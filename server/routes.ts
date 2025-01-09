import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupSocialRoutes } from "./social";
import { setupAlpacaRoutes } from "./alpaca";
import { setupOpenAIRoutes } from "./openai";
import { setupLearningRoutes } from "./learning";
import { setupQuizRoutes } from "./quiz";
import { db } from "@db";
import express from 'express';

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    // First verify database connection
    console.log("Verifying database connection...");
    await db.query.users.findFirst();
    console.log("Database connection verified");

    // Setup JSON parsing middleware first
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Setup authentication next
    console.log("Setting up authentication routes...");
    await setupAuth(app);
    console.log("Authentication routes registered");

    // Register feature routes after auth is setup
    console.log("Setting up alpaca routes...");
    setupAlpacaRoutes(app);
    console.log("Alpaca routes registered");

    console.log("Setting up social routes...");
    setupSocialRoutes(app);
    console.log("Social routes registered");

    console.log("Setting up OpenAI routes...");
    setupOpenAIRoutes(app);
    console.log("OpenAI routes registered");

    console.log("Setting up learning routes...");
    setupLearningRoutes(app);
    console.log("Learning routes registered");

    console.log("Setting up quiz routes...");
    setupQuizRoutes(app);
    console.log("Quiz routes registered");

    // Add error handling middleware last
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('Error:', err);
      // Ensure we always send JSON responses, even for errors
      res.status(err.status || 500).json({ 
        error: err.message || "Internal Server Error",
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    });

    // Create and return the HTTP server
    const httpServer = createServer(app);
    console.log("HTTP server created");

    return httpServer;
  } catch (error: any) {
    console.error("Failed to register routes:", error);
    throw error;
  }
}