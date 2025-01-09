import type { Express } from "express";
import { db } from "@db";
import {
  lessons,
  userProgress,
  achievements,
  userAchievements,
  users,
} from "@db/schema";
import { eq, and, isNull, count } from "drizzle-orm";

export function setupLearningRoutes(app: Express) {
  // Get all lessons with progress for current user
  app.get("/api/lessons", async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.id) {
        return res.status(401).json({ error: "Not logged in" });
      }

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

      if (!allLessons) {
        return res.status(500).json({ error: "Failed to fetch lessons" });
      }

      const formattedLessons = allLessons.map(({ lessons: lesson, user_progress }) => ({
        ...lesson,
        userProgress: user_progress ? [user_progress] : [],
      }));

      res.json(formattedLessons);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get a specific lesson by ID
  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const user = req.user;
      if (!user?.id) {
        return res.status(401).send("Not logged in");
      }

      const lessonId = parseInt(req.params.id);
      const lesson = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId))
        .limit(1);

      if (!lesson.length) {
        return res.status(404).send("Lesson not found");
      }

      res.json(lesson[0]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Mark lesson as completed and award XP
  app.post("/api/lessons/:id/complete", async (req, res) => {
    try {
      const user = req.user;
      if (!user?.id) {
        return res.status(401).send("Not logged in");
      }

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

        // Check for new achievements
        const allAchievements = await tx
          .select()
          .from(achievements)
          .leftJoin(
            userAchievements,
            and(
              eq(userAchievements.achievementId, achievements.id),
              eq(userAchievements.userId, user.id)
            )
          )
          .where(isNull(userAchievements.id));

        for (const { achievements: achievement } of allAchievements) {
          if (!achievement) continue;

          const requirement = achievement.requirement as {
            type: "lessons_completed" | "xp_reached" | "level_reached";
            value: number;
          };

          let isUnlocked = false;

          switch (requirement.type) {
            case "lessons_completed": {
              const completedCount = await tx
                .select({ value: count() })
                .from(userProgress)
                .where(
                  and(
                    eq(userProgress.userId, user.id),
                    eq(userProgress.completed, true)
                  )
                );
              isUnlocked = (completedCount[0]?.value || 0) >= requirement.value;
              break;
            }

            case "xp_reached":
              isUnlocked = newXP >= requirement.value;
              break;

            case "level_reached":
              isUnlocked = newLevel >= requirement.value;
              break;
          }

          if (isUnlocked) {
            await tx.insert(userAchievements).values({
              userId: user.id,
              achievementId: achievement.id,
            });

            // Award achievement XP
            const updatedXP = newXP + achievement.xpReward;
            await tx
              .update(users)
              .set({
                xp: updatedXP,
                level: Math.floor(updatedXP / 1000) + 1,
              })
              .where(eq(users.id, user.id));
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
      const user = req.user;
      if (!user?.id) {
        return res.status(401).send("Not logged in");
      }

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
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });
}