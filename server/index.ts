import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "@db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Global error handler
const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
};

// Start the server
(async () => {
  try {
    // First verify database connection
    console.log("Verifying database connection...");
    await db.query.users.findFirst();
    console.log("Database connection verified");

    // Setup routes and get the server
    console.log("Setting up routes...");
    const server = await registerRoutes(app);
    console.log("Routes registered");

    // Register error handler after routes
    app.use(errorHandler);

    // Setup static file serving
    console.log("Setting up static file serving...");
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the server on port 5000
    server.listen(5000, "0.0.0.0", () => {
      console.log("Server started on port 5000");
    });

    // Handle cleanup on process termination
    const cleanup = () => {
      console.log('Cleaning up server...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

  } catch (error: any) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
