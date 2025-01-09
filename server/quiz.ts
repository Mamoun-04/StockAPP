import type { Express, Request, Response, NextFunction } from "express";
import { db } from "@db";
import {
  quizQuestions,
  quizSections,
  userQuizProgress,
  userQuizAttempts,
  users,
  type SelectUser,
} from "@db/schema";
import { eq, and } from "drizzle-orm";

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

export function setupQuizRoutes(app: Express): void {
  // Get quiz sections
  app.get("/api/quiz/sections", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
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
      console.error('Error fetching quiz sections:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get user progress for all sections
  app.get("/api/quiz/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
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
        .where(eq(userQuizProgress.userId, user.id));

      res.json(progress);
    } catch (error: unknown) {
      console.error('Error fetching quiz progress:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get quiz questions for a section
  app.get("/api/quiz/questions", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
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
  app.post("/api/quiz/submit", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
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
        userId: user.id,
        questionId,
        correct,
      });

      // Start a transaction for updating progress and XP
      await db.transaction(async (tx) => {
        // Get current user data for XP calculation
        const [currentUser] = await tx
          .select()
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);

        if (!currentUser) {
          throw new Error("User not found");
        }

        // Fixed XP reward of 100 per correct answer
        const xpReward = correct ? 100 : 0;
        const newXP = currentUser.xp + xpReward;
        const newLevel = Math.floor(newXP / 1000) + 1;

        // Update user XP and level
        await tx
          .update(users)
          .set({
            xp: newXP,
            level: newLevel,
          })
          .where(eq(users.id, user.id));

        // Update section progress
        const [existingProgress] = await tx
          .select()
          .from(userQuizProgress)
          .where(
            and(
              eq(userQuizProgress.userId, user.id),
              eq(userQuizProgress.sectionId, question.sectionId)
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
            userId: user.id,
            sectionId: question.sectionId,
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