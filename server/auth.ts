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
      cookie: {},
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    };

    if (app.get("env") === "production") {
      app.set("trust proxy", 1);
      sessionSettings.cookie = {
        secure: true,
      };
    }

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
      done(null, user.id);
    });

    passport.deserializeUser(async (id: number, done) => {
      try {
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

    // Register route
    app.post("/api/register", async (req, res, next) => {
      try {
        console.log("Processing registration request");
        const result = insertUserSchema.safeParse(req.body);
        if (!result.success) {
          return res
            .status(400)
            .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
        }

        const { username, password } = result.data;

        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (existingUser) {
          return res.status(400).send("Username already exists");
        }

        const hashedPassword = await crypto.hash(password);

        const [newUser] = await db
          .insert(users)
          .values({
            username,
            password: hashedPassword,
            xp: 0,
            level: 1,
          })
          .returning();

        req.login(newUser, (err) => {
          if (err) {
            console.error("Login after registration failed:", err);
            return next(err);
          }
          return res.json({
            message: "Registration successful",
            user: { 
              id: newUser.id, 
              username: newUser.username,
              displayName: newUser.displayName,
              education: newUser.education,
              occupation: newUser.occupation,
              bio: newUser.bio,
              xp: newUser.xp,
              level: newUser.level,
            },
          });
        });
      } catch (error) {
        console.error("Registration error:", error);
        next(error);
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
          return res.status(400).send(info.message ?? "Login failed");
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
              displayName: user.displayName,
              education: user.education,
              occupation: user.occupation,
              bio: user.bio,
              xp: user.xp,
              level: user.level,
            },
          });
        });
      })(req, res, next);
    });

    // Logout route
    app.post("/api/logout", (req, res) => {
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).send("Logout failed");
        }
        res.json({ message: "Logout successful" });
      });
    });

    // Get current user route
    app.get("/api/user", (req, res) => {
      if (req.isAuthenticated()) {
        const user = req.user;
        return res.json({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          education: user.education,
          occupation: user.occupation,
          bio: user.bio,
          xp: user.xp,
          level: user.level,
        });
      }
      res.status(401).send("Not logged in");
    });

    console.log("Authentication setup completed");
  } catch (error) {
    console.error("Failed to setup authentication:", error);
    throw error;
  }
}