import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupAlpacaRoutes } from "./alpaca";
import { setupOpenAIRoutes } from "./openai";
import { setupLearningRoutes } from "./learning";
import session from "express-session";
import passport from "passport";

export function registerRoutes(app: Express): Server {
  // Setup session middleware first
  app.use(session({
    secret: process.env.REPL_ID || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Register route handlers
  setupAuth(app);
  setupAlpacaRoutes(app);
  setupOpenAIRoutes(app);
  setupLearningRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}