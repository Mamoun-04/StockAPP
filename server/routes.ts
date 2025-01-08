import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupSocialRoutes } from "./social";

export function registerRoutes(app: Express): Server {
  // Setup authentication first
  setupAuth(app);

  // Register social routes after auth is setup
  setupSocialRoutes(app);

  // Add other routes here...

  const httpServer = createServer(app);
  return httpServer;
}