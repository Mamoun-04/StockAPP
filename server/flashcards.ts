import { db } from "@db";
import { eq, and, gte, desc } from "drizzle-orm";
import { flashcards, flashcardProgress, userProgress, lessons } from "@db/schema";
import type { Express, Request } from "express";
import type { Session } from "express-session";

// Add userId to session type
interface CustomSession extends Session {
  userId?: number;
}

interface CustomRequest extends Request {
  session: CustomSession;
}

// Calculate next review time based on spaced repetition algorithm
function calculateNextReview(easeFactor: number, interval: number, correct: boolean): {
  nextInterval: number;
  newEaseFactor: number;
} {
  if (!correct) {
    return {
      nextInterval: 1,
      newEaseFactor: Math.max(1.3, easeFactor - 0.2),
    };
  }

  if (interval === 0) {
    return {
      nextInterval: 1,
      newEaseFactor: easeFactor,
    };
  }

  const nextInterval = Math.round(interval * easeFactor);
  return {
    nextInterval,
    newEaseFactor: Math.min(2.5, easeFactor + 0.1),
  };
}

export function setupFlashcardRoutes(app: Express) {
  // Get flashcards for a specific lesson
  app.get("/api/lessons/:lessonId/flashcards", async (req: CustomRequest, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const lessonId = parseInt(req.params.lessonId);
    const cards = await db.query.flashcards.findMany({
      where: eq(flashcards.lessonId, lessonId),
      orderBy: [desc(flashcards.order)],
    });

    res.json(cards);
  });

  // Mark lesson as completed
  app.post("/api/lessons/:lessonId/complete", async (req: CustomRequest, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const lessonId = parseInt(req.params.lessonId);
    const now = new Date();

    // Get the lesson to calculate XP reward
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    // Check if progress already exists
    const existingProgress = await db.query.userProgress.findFirst({
      where: and(
        eq(userProgress.userId, userId),
        eq(userProgress.lessonId, lessonId)
      ),
    });

    if (existingProgress?.completed) {
      return res.status(400).json({ error: "Lesson already completed" });
    }

    // Update or create progress
    if (existingProgress) {
      await db
        .update(userProgress)
        .set({
          completed: true,
          score: 100, // We can make this dynamic based on flashcard performance
          completedAt: now,
        })
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.lessonId, lessonId)
          )
        );
    } else {
      await db.insert(userProgress).values({
        userId,
        lessonId,
        completed: true,
        score: 100,
        completedAt: now,
      });
    }

    res.json({ success: true, xpEarned: lesson.xpReward });
  });

  // Initialize flashcard progress for a user
  app.post("/api/flashcards/:id/initialize", async (req: CustomRequest, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const flashcardId = parseInt(req.params.id);

    const existing = await db.query.flashcardProgress.findFirst({
      where: and(
        eq(flashcardProgress.userId, userId),
        eq(flashcardProgress.flashcardId, flashcardId)
      ),
    });

    if (existing) {
      return res.status(400).json({ error: "Progress already initialized" });
    }

    const now = new Date();
    await db.insert(flashcardProgress).values({
      userId,
      flashcardId,
      easeFactor: 2.5,
      interval: 0,
      consecutiveCorrect: 0,
      lastReviewedAt: now,
      nextReviewAt: now,
      createdAt: now,
    });

    res.json({ success: true });
  });

  // Record flashcard review
  app.post("/api/flashcards/:id/review", async (req: CustomRequest, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { correct } = req.body;
    const flashcardId = parseInt(req.params.id);

    const progress = await db.query.flashcardProgress.findFirst({
      where: and(
        eq(flashcardProgress.userId, userId),
        eq(flashcardProgress.flashcardId, flashcardId)
      ),
    });

    if (!progress) {
      return res.status(404).json({ error: "Flashcard progress not found" });
    }

    const { nextInterval, newEaseFactor } = calculateNextReview(
      Number(progress.easeFactor),
      progress.interval,
      correct
    );

    const now = new Date();
    const nextReview = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

    await db
      .update(flashcardProgress)
      .set({
        interval: nextInterval,
        easeFactor: newEaseFactor,
        lastReviewedAt: now,
        nextReviewAt: nextReview,
        consecutiveCorrect: correct ? progress.consecutiveCorrect + 1 : 0,
      })
      .where(
        and(
          eq(flashcardProgress.userId, userId),
          eq(flashcardProgress.flashcardId, flashcardId)
        )
      );

    res.json({ success: true });
  });
}
