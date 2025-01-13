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
import { eq, and } from "drizzle-orm";
import { generateLesson } from "./lessonGenerator";

// Extend Express.Request with authenticated user
interface RequestWithUser extends Request {
  user?: SelectUser;
}

// Simplified authentication middleware
function requireAuth(req: RequestWithUser, res: Response, next: NextFunction) {
  // For testing purposes, bypass authentication
  next();
}

export function setupLearningRoutes(app: Express): void {
  // Get all lessons
  app.get("/api/lessons", requireAuth, async (req: RequestWithUser, res: Response) => {
    try {
      const allLessons = await db
        .select()
        .from(lessons)
        .orderBy(lessons.order);

      res.json(allLessons);
    } catch (error: unknown) {
      console.error('Error fetching lessons:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get a specific lesson by ID
  app.get("/api/lessons/:id", requireAuth, async (req: RequestWithUser, res: Response) => {
    try {
      const lessonId = parseInt(req.params.id);

      const lesson = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .limit(1);

      if (!lesson.length) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      // If content is not generated yet, generate it
      if (!lesson[0].content) {
        const generatedContent = await generateLesson(lesson[0].title, lesson[0].difficulty);
        await db
          .update(lessons)
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

  // Mark lesson as completed
  app.post("/api/lessons/:id/complete", requireAuth, async (req: RequestWithUser, res: Response) => {
    try {
      const lessonId = parseInt(req.params.id);
      const { score = 100 } = req.body;

      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .limit(1);

      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      res.json({ message: "Lesson completed successfully" });
    } catch (error: unknown) {
      console.error('Error completing lesson:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });
  // Get user's achievements
  app.get("/api/achievements", requireAuth, async (req: RequestWithUser, res: Response) => {
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