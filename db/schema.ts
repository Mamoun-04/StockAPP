import { pgTable, text, serial, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Base tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  education: text("education"),
  occupation: text("occupation"),
  alpacaApiKey: text("alpaca_api_key"),
  alpacaSecretKey: text("alpaca_secret_key"),
  createdAt: timestamp("created_at").defaultNow(),
  xp: integer("xp").default(0).notNull(),
  level: integer("level").default(1).notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(),
  stockSymbol: text("stock_symbol"),
  tradeType: text("trade_type"),
  shares: decimal("shares"),
  price: decimal("price"),
  profitLoss: decimal("profit_loss"),
  likesCount: integer("likes_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  likes: many(postLikes),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  likes: many(postLikes),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));


export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const reposts = pgTable("reposts", {
  id: serial("id").primaryKey(),
  originalPostId: integer("original_post_id").references(() => posts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const repostsRelations = relations(reposts, ({ one }) => ({
  originalPost: one(posts, {
    fields: [reposts.originalPostId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [reposts.userId],
    references: [users.id],
  }),
}));

// Schema validation
//export const insertUserSchema = createInsertSchema(users);
//export const selectUserSchema = createSelectSchema(users);
//export const insertPostSchema = createInsertSchema(posts);
//export const selectPostSchema = createSelectSchema(posts);
//export const insertPostLikeSchema = createInsertSchema(postLikes);
//export const selectPostLikeSchema = createSelectSchema(postLikes);

// Types
//export type InsertUser = typeof users.$inferInsert;
//export type SelectUser = typeof users.$inferSelect;
//export type InsertPost = typeof posts.$inferInsert;
//export type SelectPost = typeof posts.$inferSelect;
//export type InsertPostLike = typeof postLikes.$inferInsert;
//export type SelectPostLike = typeof postLikes.$inferSelect;

// Other tables
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
  difficulty: text("difficulty").notNull(),
  xpReward: integer("xp_reward").notNull(),
  prerequisites: integer("prerequisites").array(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  completed: boolean("completed").default(false),
  score: integer("score"),
  completedAt: timestamp("completed_at"),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirement: jsonb("requirement").notNull(),
  xpReward: integer("xp_reward").notNull(),
  icon: text("icon").notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  achievementId: integer("achievement_id").references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const quizSections = pgTable("quiz_sections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(),
  order: integer("order").notNull(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").references(() => quizSections.id),
  term: text("term").notNull(),
  question: text("question").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  wrongAnswers: text("wrong_answers").array().notNull(),
  difficulty: text("difficulty").notNull(),
  xpReward: integer("xp_reward").notNull(),
});

export const userQuizProgress = pgTable("user_quiz_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sectionId: integer("section_id").references(() => quizSections.id),
  score: integer("score").default(0).notNull(),
  bestScore: integer("best_score").default(0).notNull(),
  totalQuestionsAnswered: integer("total_questions_answered").default(0).notNull(),
  correctAnswers: integer("correct_answers").default(0).notNull(),
  attemptsCount: integer("attempts_count").default(0).notNull(),
  lastAttemptAt: timestamp("last_attempt_at").defaultNow(),
});

export const userQuizAttempts = pgTable("user_quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  questionId: integer("question_id").references(() => quizQuestions.id),
  correct: boolean("correct").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  difficulty: text("difficulty").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const flashcardProgress = pgTable("flashcard_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  flashcardId: integer("flashcard_id").references(() => flashcards.id),
  easeFactor: decimal("ease_factor", { precision: 4, scale: 2 }).notNull().default("2.5"),
  interval: integer("interval").notNull().default(0),
  consecutiveCorrect: integer("consecutive_correct").notNull().default(0),
  lastReviewedAt: timestamp("last_reviewed_at").defaultNow(),
  nextReviewAt: timestamp("next_review_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [flashcards.lessonId],
    references: [lessons.id],
  }),
  progress: many(flashcardProgress),
}));

export const flashcardProgressRelations = relations(flashcardProgress, ({ one }) => ({
  user: one(users, {
    fields: [flashcardProgress.userId],
    references: [users.id],
  }),
  flashcard: one(flashcards, {
    fields: [flashcardProgress.flashcardId],
    references: [flashcards.id],
  }),
}));