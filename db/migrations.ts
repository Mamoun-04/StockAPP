
import { sql } from "drizzle-orm";
import { db } from "./index";

export async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      displayname TEXT,
      bio TEXT,
      avatar_url TEXT,
      education TEXT,
      occupation TEXT,
      alpaca_api_key TEXT,
      alpaca_secret_key TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      xp INTEGER DEFAULT 0 NOT NULL,
      level INTEGER DEFAULT 1 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS portfolios (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      symbol TEXT NOT NULL,
      shares DECIMAL NOT NULL,
      average_price DECIMAL NOT NULL,
      last_updated TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS watchlists (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      symbol TEXT NOT NULL,
      added_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      content TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      xp_reward INTEGER NOT NULL,
      prerequisites INTEGER[],
      "order" INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      lesson_id INTEGER REFERENCES lessons(id),
      completed BOOLEAN DEFAULT FALSE,
      score INTEGER,
      completed_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      requirement JSONB NOT NULL,
      xp_reward INTEGER NOT NULL,
      icon TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      achievement_id INTEGER REFERENCES achievements(id),
      unlocked_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quiz_sections (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      "order" INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id SERIAL PRIMARY KEY,
      section_id INTEGER REFERENCES quiz_sections(id),
      term TEXT NOT NULL,
      question TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      wrong_answers TEXT[] NOT NULL,
      difficulty TEXT NOT NULL,
      xp_reward INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_quiz_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      section_id INTEGER REFERENCES quiz_sections(id),
      score INTEGER DEFAULT 0 NOT NULL,
      best_score INTEGER DEFAULT 0 NOT NULL,
      total_questions_answered INTEGER DEFAULT 0 NOT NULL,
      correct_answers INTEGER DEFAULT 0 NOT NULL,
      attempts_count INTEGER DEFAULT 0 NOT NULL,
      last_attempt_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_quiz_attempts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      question_id INTEGER REFERENCES quiz_questions(id),
      correct BOOLEAN NOT NULL,
      attempted_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      stock_symbol TEXT,
      trade_type TEXT,
      shares DECIMAL,
      price DECIMAL,
      profit_loss DECIMAL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id) NOT NULL,
      user_id INTEGER REFERENCES users(id) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;
}
