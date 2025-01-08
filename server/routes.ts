import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupAlpacaRoutes } from "./alpaca";
import { setupOpenAIRoutes } from "./openai";
import { setupQuizRoutes } from "./quiz";
import session from "express-session";
import passport from "passport";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

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

  // Add endpoint to save Alpaca credentials
  app.post("/api/user/alpaca-credentials", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { alpacaApiKey, alpacaSecretKey } = req.body;
    if (!alpacaApiKey || !alpacaSecretKey) {
      return res.status(400).send("Missing API credentials");
    }

    try {
      // Update user's Alpaca credentials
      await db.update(users)
        .set({ 
          alpacaApiKey,
          alpacaSecretKey
        })
        .where(eq(users.id, req.user!.id));

      // Update the session
      req.user = {
        ...req.user!,
        alpacaApiKey,
        alpacaSecretKey
      };

      res.json({ message: "Alpaca credentials saved successfully" });
    } catch (error) {
      console.error("Error saving Alpaca credentials:", error);
      res.status(500).send("Failed to save credentials");
    }
  });

  // Register route handlers
  setupAuth(app);
  setupAlpacaRoutes(app);
  setupOpenAIRoutes(app);
  setupQuizRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}