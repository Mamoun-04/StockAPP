import type { Express } from "express";
import { db } from "@db";
import {
  quizQuestions,
  quizSections,
  userQuizProgress,
  userQuizAttempts,
  users,
} from "@db/schema";
import { eq, and } from "drizzle-orm";

export function setupQuizRoutes(app: Express) {
  // Get quiz sections
  app.get("/api/quiz/sections", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).send("Not logged in");
      }

      const sections = await db
        .select({
          id: quizSections.id,
          title: quizSections.title,
          description: quizSections.description,
          difficulty: quizSections.difficulty,
          order: quizSections.order,
        })
        .from(quizSections)
        .orderBy(quizSections.order);

      res.json(sections);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get user progress for all sections
  app.get("/api/quiz/progress", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).send("Not logged in");
      }

      const progress = await db
        .select({
          sectionId: userQuizProgress.sectionId,
          score: userQuizProgress.score,
          bestScore: userQuizProgress.bestScore,
          totalQuestionsAnswered: userQuizProgress.totalQuestionsAnswered,
          correctAnswers: userQuizProgress.correctAnswers,
          attemptsCount: userQuizProgress.attemptsCount,
        })
        .from(userQuizProgress)
        .where(eq(userQuizProgress.userId, req.user.id));

      res.json(progress);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get quiz questions for a section
  app.get("/api/quiz/questions", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).send("Not logged in");
      }

      const sectionId = req.query.sectionId ? parseInt(req.query.sectionId as string) : undefined;

      const questions = await db
        .select({
          id: quizQuestions.id,
          sectionId: quizQuestions.sectionId,
          term: quizQuestions.term,
          question: quizQuestions.question,
          correctAnswer: quizQuestions.correctAnswer,
          wrongAnswers: quizQuestions.wrongAnswers,
          difficulty: quizQuestions.difficulty,
          xpReward: quizQuestions.xpReward,
        })
        .from(quizQuestions)
        .where(sectionId ? eq(quizQuestions.sectionId, sectionId) : undefined);

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

      const { questionId, answer, isNewAttempt } = req.body;

      const [question] = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.id, questionId))
        .limit(1);

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

      // Update progress and award XP if correct
      await db.transaction(async (tx) => {
        // Get current user data
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, req.user!.id))
          .limit(1);

        // Fixed XP reward of 100 per correct answer
        const xpReward = correct ? 100 : 0;
        const newXP = (user?.xp || 0) + xpReward;
        const newLevel = Math.floor(newXP / 1000) + 1;

        // Update user XP and level
        await tx
          .update(users)
          .set({
            xp: newXP,
            level: newLevel,
          })
          .where(eq(users.id, req.user!.id));

        // Update section progress
        const [existingProgress] = await tx
          .select()
          .from(userQuizProgress)
          .where(
            and(
              eq(userQuizProgress.userId, req.user!.id),
              eq(userQuizProgress.sectionId, question.sectionId!)
            )
          )
          .limit(1);

        if (existingProgress) {
          const newScore = existingProgress.score + xpReward;
          await tx
            .update(userQuizProgress)
            .set({
              score: newScore,
              bestScore: Math.max(existingProgress.bestScore, newScore),
              totalQuestionsAnswered: existingProgress.totalQuestionsAnswered + 1,
              correctAnswers: existingProgress.correctAnswers + (correct ? 1 : 0),
              attemptsCount: existingProgress.attemptsCount + (isNewAttempt ? 1 : 0),
            })
            .where(eq(userQuizProgress.id, existingProgress.id));
        } else {
          await tx.insert(userQuizProgress).values({
            userId: req.user!.id,
            sectionId: question.sectionId!,
            score: xpReward,
            bestScore: xpReward,
            totalQuestionsAnswered: 1,
            correctAnswers: correct ? 1 : 0,
            attemptsCount: 1,
          });
        }
      });

      res.json({
        correct,
        xpEarned: correct ? 100 : 0,
      });
    } catch (error: unknown) {
      console.error('Error submitting answer:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });
}