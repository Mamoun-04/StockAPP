import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export async function setupAuth(app: Express) {
  try {
    console.log("Setting up authentication...");
    const MemoryStore = createMemoryStore(session);
    const sessionSettings: session.SessionOptions = {
      secret: process.env.REPL_ID || "trading-platform-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: app.get("env") === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      },
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    };

    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
      new LocalStrategy(async (username, password, done) => {
        try {
          console.log(`Attempting authentication for user: ${username}`);
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);

          if (!user) {
            return done(null, false, { message: "Incorrect username." });
          }
          const isMatch = await crypto.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect password." });
          }
          return done(null, user);
        } catch (err) {
          console.error("Authentication error:", err);
          return done(err);
        }
      })
    );

    passport.serializeUser((user, done) => {
      console.log("Serializing user:", user.id);
      done(null, user.id);
    });

    passport.deserializeUser(async (id: number, done) => {
      try {
        console.log("Deserializing user:", id);
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (!user) {
          return done(new Error('User not found'));
        }

        done(null, user);
      } catch (err) {
        console.error("Deserialization error:", err);
        done(err);
      }
    });


    // Login route
    app.post("/api/login", (req, res, next) => {
      passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
        if (err) {
          console.error("Login error:", err);
          return next(err);
        }

        if (!user) {
          return res.status(400).json({ error: info.message ?? "Login failed" });
        }

        req.logIn(user, (err) => {
          if (err) {
            console.error("Login session creation failed:", err);
            return next(err);
          }

          return res.json({
            message: "Login successful",
            user: {
              id: user.id,
              username: user.username,
              alpacaApiKey: user.alpacaApiKey,
              alpacaSecretKey: user.alpacaSecretKey
            },
          });
        });
      })(req, res, next);
    });

    // Get current user route
    app.get("/api/user", (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not logged in" });
      }
      const user = req.user!;
      res.json({
        id: user.id,
        username: user.username,
        alpacaApiKey: user.alpacaApiKey,
        alpacaSecretKey: user.alpacaSecretKey
      });
    });

    console.log("Authentication setup completed");
  } catch (error) {
    console.error("Failed to setup authentication:", error);
    throw error;
  }
}