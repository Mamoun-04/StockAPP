import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupSocialRoutes } from "./social";
import { setupAlpacaRoutes } from "./alpaca";
import { setupOpenAIRoutes } from "./openai";
import { db } from "@db";

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    // First verify database connection
    console.log("Verifying database connection...");
    await db.query.users.findFirst();
    console.log("Database connection verified");

    // Setup authentication first
    console.log("Setting up authentication routes...");
    await setupAuth(app);
    console.log("Authentication routes registered");

    // Register other routes after auth is setup
    console.log("Setting up alpaca routes...");
    setupAlpacaRoutes(app);
    console.log("Alpaca routes registered");

    console.log("Setting up social routes...");
    setupSocialRoutes(app);
    console.log("Social routes registered");

    console.log("Setting up OpenAI routes...");
    setupOpenAIRoutes(app);
    console.log("OpenAI routes registered");

    // Create and return the HTTP server
    const httpServer = createServer(app);
    console.log("HTTP server created");

    // Set up error handler after all routes
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('Error:', err);
      res.status(500).json({ 
        message: "Internal server error",
        error: err.message 
      });
    });

    return httpServer;
  } catch (error: any) {
    console.error("Failed to register routes:", error);
    throw error;
  }
}