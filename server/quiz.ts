import type { Express } from "express";
import { db } from "@db";
import {
  quizQuestions,
  userQuizAttempts,
  achievements,
  userAchievements,
  users,
} from "@db/schema";
import { eq, and } from "drizzle-orm";

export function setupQuizRoutes(app: Express) {
  // Get quiz questions
  app.get("/api/quiz/questions", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).send("Not logged in");
      }

      const questions = await db.query.quizQuestions.findMany({
        orderBy: quizQuestions.difficulty,
      });

      res.json(questions);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Submit quiz answer
  app.post("/api/quiz/submit", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).send("Not logged in");
      }

      const { questionId, answer } = req.body;

      const question = await db.query.quizQuestions.findFirst({
        where: eq(quizQuestions.id, questionId),
      });

      if (!question) {
        return res.status(404).send("Question not found");
      }

      const correct = answer === question.correctAnswer;

      // Record the attempt
      await db.insert(userQuizAttempts).values({
        userId: req.user.id,
        questionId,
        correct,
      });

      if (correct) {
        // Award XP and check for level up
        await db.transaction(async (tx) => {
          const newXP = req.user.xp + question.xpReward;
          const newLevel = Math.floor(newXP / 1000) + 1;

          await tx
            .update(users)
            .set({
              xp: newXP,
              level: newLevel,
            })
            .where(eq(users.id, req.user.id));

          // Check for quiz-related achievements
          const quizAchievements = await tx.query.achievements.findMany({
            where: eq(achievements.requirement.type, "quiz_completed"),
          });

          for (const achievement of quizAchievements) {
            const correctAnswers = await tx.query.userQuizAttempts.count({
              where: and(
                eq(userQuizAttempts.userId, req.user.id),
                eq(userQuizAttempts.correct, true)
              ),
            });

            if (
              correctAnswers >= achievement.requirement.value &&
              !(await tx.query.userAchievements.findFirst({
                where: and(
                  eq(userAchievements.userId, req.user.id),
                  eq(userAchievements.achievementId, achievement.id)
                ),
              }))
            ) {
              // Award achievement
              await tx.insert(userAchievements).values({
                userId: req.user.id,
                achievementId: achievement.id,
              });

              // Award achievement XP
              await tx
                .update(users)
                .set({
                  xp: newXP + achievement.xpReward,
                  level: Math.floor((newXP + achievement.xpReward) / 1000) + 1,
                })
                .where(eq(users.id, req.user.id));
            }
          }
        });
      }

      res.json({
        correct,
        xpEarned: correct ? question.xpReward : 0,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });
}
