import { pgTable, text, serial, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  alpacaApiKey: text("alpaca_api_key"),
  alpacaSecretKey: text("alpaca_secret_key"),
  createdAt: timestamp("created_at").defaultNow(),
  xp: integer("xp").default(0).notNull(),
  level: integer("level").default(1).notNull(),
});

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  symbol: text("symbol").notNull(),
  shares: decimal("shares").notNull(),
  averagePrice: decimal("average_price").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  symbol: text("symbol").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  xpReward: integer("xp_reward").notNull(),
  prerequisites: integer("prerequisites").array(), // Array of lesson IDs required before this one
  order: integer("order").notNull(), // Sequence in the learning path
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  completed: boolean("completed").default(false),
  score: integer("score"), // Optional quiz score
  completedAt: timestamp("completed_at"),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirement: jsonb("requirement").notNull(), // JSON object with achievement criteria
  xpReward: integer("xp_reward").notNull(),
  icon: text("icon").notNull(), // Icon identifier
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  achievementId: integer("achievement_id").references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(),
  question: text("question").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  wrongAnswers: text("wrong_answers").array().notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  xpReward: integer("xp_reward").notNull(),
});

export const userQuizAttempts = pgTable("user_quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  questionId: integer("question_id").references(() => quizQuestions.id),
  correct: boolean("correct").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions);
export const selectQuizQuestionSchema = createSelectSchema(quizQuestions);

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type Portfolio = typeof portfolios.$inferSelect;
export type Watchlist = typeof watchlists.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type UserQuizAttempt = typeof userQuizAttempts.$inferSelect;