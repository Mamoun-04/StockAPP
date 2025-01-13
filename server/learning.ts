import type { Express, Request, Response, NextFunction } from "express";
import { db } from "@db";
import {
  lessons,
  userProgress,
  achievements,
  userAchievements,
  users,
  type SelectUser,
} from "@db/schema";
import { eq, and, isNull, count } from "drizzle-orm";

// Extend Express.Request with authenticated user
interface RequestWithUser extends Request {
  user: SelectUser;
}

// Authentication middleware
function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function setupLearningRoutes(app: Express): void {
  // Get all lessons with progress for current user
  app.get("/api/lessons", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
      const allLessons = await db
        .select({
          lessons: lessons,
          user_progress: userProgress
        })
        .from(lessons)
        .leftJoin(
          userProgress,
          and(
            eq(userProgress.lessonId, lessons.id),
            eq(userProgress.userId, user.id)
          )
        )
        .orderBy(lessons.order);

      const formattedLessons = allLessons.map(({ lessons: lesson, user_progress }) => ({
        ...lesson,
        userProgress: user_progress ? [user_progress] : [],
      }));

      res.json(formattedLessons);
    } catch (error: unknown) {
      console.error('Error fetching lessons:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get a specific lesson by ID
  app.get("/api/lessons/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
      const lessonId = parseInt(req.params.id);
      const lesson = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .limit(1);

      if (!lesson.length) {
        return res.status(404).send("Lesson not found");
      }

      // Check if content needs to be generated
      if (!lesson[0].content) {
        const generatedContent = await generateLesson(lesson[0].topic, lesson[0].difficulty);
        await db.update(lessons)
          .set({ content: generatedContent })
          .where(eq(lessons.id, lessonId));
        lesson[0].content = generatedContent;
      }

      res.json(lesson[0]);
    } catch (error: unknown) {
      console.error('Error fetching lesson:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Mark lesson as completed and award XP
  app.post("/api/lessons/:id/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
      const lessonId = parseInt(req.params.id);
      const { score } = req.body;

      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .limit(1);

      if (!lesson) {
        return res.status(404).send("Lesson not found");
      }

      // Check if lesson is already completed
      const [existingProgress] = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, user.id),
            eq(userProgress.lessonId, lessonId)
          )
        )
        .limit(1);

      if (existingProgress?.completed) {
        return res.status(400).send("Lesson already completed");
      }

      // Start a transaction to update progress and award XP
      await db.transaction(async (tx) => {
        // Update or create progress
        if (existingProgress) {
          await tx
            .update(userProgress)
            .set({
              completed: true,
              score,
              completedAt: new Date(),
            })
            .where(eq(userProgress.id, existingProgress.id));
        } else {
          await tx.insert(userProgress).values({
            userId: user.id,
            lessonId,
            completed: true,
            score,
            completedAt: new Date(),
          });
        }

        // Award XP to user
        const newXP = user.xp + lesson.xpReward;
        const newLevel = Math.floor(newXP / 1000) + 1;

        await tx
          .update(users)
          .set({
            xp: newXP,
            level: newLevel,
          })
          .where(eq(users.id, user.id));
      });

      res.json({ message: "Lesson completed successfully" });
    } catch (error: unknown) {
      console.error('Error completing lesson:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });
  // Get user's achievements
  app.get("/api/achievements", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
      const achievementsList = await db
        .select()
        .from(achievements)
        .leftJoin(
          userAchievements,
          and(
            eq(userAchievements.achievementId, achievements.id),
            eq(userAchievements.userId, user.id)
          )
        );

      const formattedAchievements = achievementsList.map(
        ({ achievements: achievement, user_achievements }) => ({
          ...achievement,
          userAchievements: user_achievements ? [user_achievements] : [],
        })
      );

      res.json(formattedAchievements);
    } catch (error: unknown) {
      console.error('Error fetching achievements:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });
}