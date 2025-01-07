import type { Express } from "express";
import { db } from "@db";
import {
  lessons,
  userProgress,
  achievements,
  userAchievements,
  users,
} from "@db/schema";
import { eq, and, isNull } from "drizzle-orm";

export function setupLearningRoutes(app: Express) {
  // Get all lessons with progress for current user
  app.get("/api/lessons", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not logged in");
      }

      const allLessons = await db.query.lessons.findMany({
        with: {
          userProgress: {
            where: eq(userProgress.userId, req.user.id),
          },
        },
        orderBy: lessons.order,
      });

      res.json(allLessons);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get a specific lesson by ID
  app.get("/api/lessons/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not logged in");
      }

      const lessonId = parseInt(req.params.id);
      const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
      });

      if (!lesson) {
        return res.status(404).send("Lesson not found");
      }

      res.json(lesson);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Mark lesson as completed and award XP
  app.post("/api/lessons/:id/complete", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not logged in");
      }

      const lessonId = parseInt(req.params.id);
      const { score } = req.body;

      const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
      });

      if (!lesson) {
        return res.status(404).send("Lesson not found");
      }

      // Check if lesson is already completed
      const existingProgress = await db.query.userProgress.findFirst({
        where: and(
          eq(userProgress.userId, req.user.id),
          eq(userProgress.lessonId, lessonId)
        ),
      });

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
            userId: req.user.id,
            lessonId,
            completed: true,
            score,
            completedAt: new Date(),
          });
        }

        // Award XP to user
        const [updatedUser] = await tx
          .update(users)
          .set({
            xp: req.user.xp + lesson.xpReward,
            // Level up every 1000 XP
            level: Math.floor((req.user.xp + lesson.xpReward) / 1000) + 1,
          })
          .where(eq(users.id, req.user.id))
          .returning();

        // Check for new achievements
        const potentialAchievements = await tx.query.achievements.findMany({
          where: isNull(userAchievements.userId),
          with: {
            userAchievements: {
              where: eq(userAchievements.userId, req.user.id),
            },
          },
        });

        for (const achievement of potentialAchievements) {
          const requirement = achievement.requirement as {
            type: "lessons_completed" | "xp_reached" | "level_reached";
            value: number;
          };

          let isUnlocked = false;

          switch (requirement.type) {
            case "lessons_completed":
              const completedCount = await tx.query.userProgress.count({
                where: and(
                  eq(userProgress.userId, req.user.id),
                  eq(userProgress.completed, true)
                ),
              });
              isUnlocked = completedCount >= requirement.value;
              break;

            case "xp_reached":
              isUnlocked = updatedUser.xp >= requirement.value;
              break;

            case "level_reached":
              isUnlocked = updatedUser.level >= requirement.value;
              break;
          }

          if (isUnlocked) {
            await tx.insert(userAchievements).values({
              userId: req.user.id,
              achievementId: achievement.id,
            });

            // Award achievement XP
            await tx
              .update(users)
              .set({
                xp: updatedUser.xp + achievement.xpReward,
                level: Math.floor((updatedUser.xp + achievement.xpReward) / 1000) + 1,
              })
              .where(eq(users.id, req.user.id));
          }
        }
      });

      res.json({ message: "Lesson completed successfully" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get user's achievements
  app.get("/api/achievements", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not logged in");
      }

      const achievements = await db.query.achievements.findMany({
        with: {
          userAchievements: {
            where: eq(userAchievements.userId, req.user.id),
          },
        },
      });

      res.json(achievements);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });
}
