import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupSocialRoutes } from "./social";
import { setupLearningRoutes } from "./learning";
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

    // Register social routes after auth is setup
    console.log("Setting up social routes...");
    setupSocialRoutes(app);
    console.log("Social routes registered");

    // Register learning routes
    console.log("Setting up learning routes...");
    setupLearningRoutes(app);
    console.log("Learning routes registered");

    // Create and return the HTTP server
    const httpServer = createServer(app);
    console.log("HTTP server created");

    return httpServer;
  } catch (error: any) {
    console.error("Failed to register routes:", error);
    throw error;
  }
}