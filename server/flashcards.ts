import { db } from "@db";
import { eq, and, gte, desc } from "drizzle-orm";
import { flashcards, flashcardProgress } from "@db/schema";
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
    newEaseFactor: easeFactor + 0.1,
  };
}

export function setupFlashcardRoutes(app: Express) {
  // Get due flashcards for a user
  app.get("/api/flashcards/due", async (req: CustomRequest, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const now = new Date();
    const dueCards = await db.query.flashcardProgress.findMany({
      where: and(
        eq(flashcardProgress.userId, userId),
        gte(flashcardProgress.nextReviewAt, now)
      ),
      orderBy: [desc(flashcardProgress.nextReviewAt)],
      with: {
        flashcard: true,
      },
    });

    res.json(dueCards);
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
}