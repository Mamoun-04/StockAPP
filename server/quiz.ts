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

      const questions = await db.select({
        id: quizQuestions.id,
        term: quizQuestions.term,
        question: quizQuestions.question,
        correctAnswer: quizQuestions.correctAnswer,
        wrongAnswers: quizQuestions.wrongAnswers,
        difficulty: quizQuestions.difficulty,
        xpReward: quizQuestions.xpReward,
      }).from(quizQuestions);

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

      const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, questionId)).limit(1);

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
          const [user] = await tx.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
          const newXP = (user?.xp || 0) + question.xpReward;
          const newLevel = Math.floor(newXP / 1000) + 1;

          await tx
            .update(users)
            .set({
              xp: newXP,
              level: newLevel,
            })
            .where(eq(users.id, req.user!.id));

          // Check for quiz-related achievements
          const quizAchievements = await tx.select().from(achievements)
            .where(eq(achievements.requirement['type'].type, 'quiz_completed'));

          for (const achievement of quizAchievements) {
            const correctAnswers = await tx.select()
              .from(userQuizAttempts)
              .where(
                and(
                  eq(userQuizAttempts.userId, req.user!.id),
                  eq(userQuizAttempts.correct, true)
                )
              ).then(rows => rows.length);

            const requirement = achievement.requirement as { type: string; value: number };

            if (correctAnswers >= requirement.value) {
              const existingAchievement = await tx.select()
                .from(userAchievements)
                .where(
                  and(
                    eq(userAchievements.userId, req.user!.id),
                    eq(userAchievements.achievementId, achievement.id)
                  )
                )
                .limit(1);

              if (!existingAchievement.length) {
                // Award achievement
                await tx.insert(userAchievements).values({
                  userId: req.user!.id,
                  achievementId: achievement.id,
                });

                // Award achievement XP
                await tx
                  .update(users)
                  .set({
                    xp: newXP + achievement.xpReward,
                    level: Math.floor((newXP + achievement.xpReward) / 1000) + 1,
                  })
                  .where(eq(users.id, req.user!.id));
              }
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