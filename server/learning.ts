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

interface Section {
  title: string;
  content: string;
  xpReward: number;
}

async function initializeLessons() {
  const initialLessons = [
    {
      title: "Introduction to Stock Trading",
      description: "Learn the basics of stock trading and market fundamentals",
      content: JSON.stringify([
        {
          title: "What are Stocks?",
          content: "Stocks represent ownership shares in a company.",
          xpReward: 20
        },
        {
          title: "How the Market Works",
          content: "A brief overview of how stock markets function.",
          xpReward: 30
        }
      ]),
      difficulty: "beginner",
      xpReward: 100,
      order: 1
    },
    {
      title: "Technical Analysis Basics",
      description: "Understanding charts and basic technical indicators",
      content: JSON.stringify([{title: "Reading Stock Charts", content: "Learn to interpret candlestick charts and other visual representations of stock price.", xpReward: 40}, {title: "Moving Averages", content: "Understanding simple and exponential moving averages.", xpReward: 50}]),
      difficulty: "intermediate",
      xpReward: 150,
      order: 2
    },
    {
      title: "Risk Management",
      description: "Essential risk management strategies for trading",
      content: JSON.stringify([{title: "Position Sizing", content: "Learn how to determine the appropriate amount of capital to allocate to each trade.", xpReward: 60}, {title: "Stop Losses", content: "Setting stop-loss orders to limit potential losses.", xpReward: 70}, {title: "Portfolio Diversification", content: "Spreading your investments across different assets to reduce risk.", xpReward: 80}]),
      difficulty: "intermediate",
      xpReward: 200,
      order: 3
    }
  ];

  // Add lessons if they don't exist
  for (const lesson of initialLessons) {
    const exists = await db.select().from(lessons).where(eq(lessons.title, lesson.title)).limit(1);
    if (!exists.length) {
      await db.insert(lessons).values(lesson);
    }
  }
}

export function setupLearningRoutes(app: Express): void {
  // Initialize lessons when routes are set up
  initializeLessons().catch(console.error);

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
        sections: JSON.parse(lesson.content || '[]') as Section[],
        totalXP: 0,
        userProgress: user_progress ? [user_progress] : [],
        lastUpdated: lesson.createdAt?.toISOString() || new Date().toISOString()
      }));

      // Calculate total XP for each lesson from its sections
      formattedLessons.forEach(lesson => {
        lesson.totalXP = lesson.sections.reduce((sum: number, section: Section) => sum + section.xpReward, 0);
      });

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

      const formattedLesson = {
        ...lesson[0],
        sections: JSON.parse(lesson[0].content || '[]') as Section[],
        totalXP: 0,
        lastUpdated: lesson[0].createdAt?.toISOString() || new Date().toISOString()
      };

      // Calculate total XP from sections
      formattedLesson.totalXP = formattedLesson.sections.reduce(
        (sum: number, section: Section) => sum + section.xpReward,
        0
      );

      res.json(formattedLesson);
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

      // Parse sections to calculate total XP
      const sections = JSON.parse(lesson.content || '[]');
      const totalLessonXP = sections.reduce((sum, section) => sum + section.xpReward, 0);

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
        const newXP = user.xp + totalLessonXP;
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