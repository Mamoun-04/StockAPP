import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupAlpacaRoutes } from "./alpaca";
import { setupOpenAIRoutes } from "./openai";
import { setupLearningRoutes } from "./learning";

export function registerRoutes(app: Express): Server {
  setupAuth(app);
  setupAlpacaRoutes(app);
  setupOpenAIRoutes(app);
  setupLearningRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}