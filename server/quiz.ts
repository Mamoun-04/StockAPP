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
import { and, eq } from "drizzle-orm";

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
      const sectionId = req.query.sectionId ? parseInt(req.query.sectionId as string) : undefined;

      if (!sectionId) {
        return res.status(400).json({ error: "Section ID is required" });
      }

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
        .where(eq(quizQuestions.sectionId, sectionId));

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

      // Find or create user progress for this section
      const existingProgress = await db
        .select()
        .from(userQuizProgress)
        .where(
          and(
            eq(userQuizProgress.userId, user.id),
            eq(userQuizProgress.sectionId, question.sectionId as number)
          )
        )
        .limit(1)
        .then(rows => rows[0]);

      // Update progress in a transaction
      await db.transaction(async (tx) => {
        const xpReward = correct ? 100 : 0;

        // Update user XP and level
        await tx
          .update(users)
          .set({
            xp: Number(user.xp || 0) + xpReward,
            level: Math.floor((Number(user.xp || 0) + xpReward) / 1000) + 1,
          })
          .where(eq(users.id, user.id));

        if (existingProgress) {
          // Update existing progress
          await tx
            .update(userQuizProgress)
            .set({
              score: existingProgress.score + xpReward,
              bestScore: Math.max(existingProgress.bestScore, existingProgress.score + xpReward),
              totalQuestionsAnswered: existingProgress.totalQuestionsAnswered + 1,
              correctAnswers: existingProgress.correctAnswers + (correct ? 1 : 0),
              attemptsCount: existingProgress.attemptsCount + (isNewAttempt ? 1 : 0),
            })
            .where(eq(userQuizProgress.id, existingProgress.id));
        } else {
          // Create new progress entry
          await tx.insert(userQuizProgress).values({
            userId: user.id,
            sectionId: question.sectionId as number,
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