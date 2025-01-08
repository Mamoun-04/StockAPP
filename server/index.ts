import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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

(async () => {
  try {
    // Register routes and get server instance
    const server = await registerRoutes(app);

    app.use(errorHandler);

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Try to find an available port starting from 5000
    const tryPort = async (port: number): Promise<number> => {
      try {
        await new Promise((resolve, reject) => {
          const srv = server.listen(port, "0.0.0.0", () => {
            resolve(port);
          });

          srv.on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
              srv.close();
              reject(error);
            } else {
              reject(error);
            }
          });
        });
        return port;
      } catch (error: any) {
        if (error.code === 'EADDRINUSE' && port < 5010) {
          // Try next port
          return tryPort(port + 1);
        }
        throw error;
      }
    };

    const PORT = await tryPort(5000);
    log(`Server started successfully on port ${PORT}`);
  } catch (error: any) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();