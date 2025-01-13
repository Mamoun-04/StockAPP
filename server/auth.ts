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
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
      },
      store: new MemoryStore({
        checkPeriod: 86400000,
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
          return done(null, false);
        }

        done(null, user);
      } catch (err) {
        console.error("Deserialization error:", err);
        done(err);
      }
    });

    app.post("/api/register", async (req, res) => {
      try {
        console.log("Registration attempt:", req.body);
        const parseResult = insertUserSchema.safeParse(req.body);

        if (!parseResult.success) {
          return res.status(400).json({ 
            error: parseResult.error.issues.map(i => i.message).join(", ") 
          });
        }

        const { username, password } = parseResult.data;

        // Check if user exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (existingUser) {
          return res.status(400).json({ error: "Username already exists" });
        }

        const hashedPassword = await crypto.hash(password);

        // Create user
        const [newUser] = await db
          .insert(users)
          .values({
            username,
            password: hashedPassword,
            level: 1,
            xp: 0,
          })
          .returning();

        // Log the user in
        req.login(newUser, (err) => {
          if (err) {
            console.error("Login after registration failed:", err);
            return res.status(500).json({ error: "Error logging in after registration" });
          }
          return res.json({
            message: "Registration successful",
            user: {
              id: newUser.id,
              username: newUser.username
            },
          });
        });
      } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
      }
    });

    app.post("/api/login", (req, res, next) => {
      passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Login failed" });
        }

        if (!user) {
          return res.status(400).json({ error: info.message ?? "Login failed" });
        }

        req.login(user, (err) => {
          if (err) {
            console.error("Login session creation failed:", err);
            return res.status(500).json({ error: "Login failed" });
          }

          return res.json({
            message: "Login successful",
            user: {
              id: user.id,
              username: user.username
            },
          });
        });
      })(req, res, next);
    });

    app.post("/api/logout", (req, res) => {
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    });

    app.get("/api/user", (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not logged in" });
      }

      const user = req.user!;
      res.json({
        id: user.id,
        username: user.username
      });
    });

    console.log("Authentication setup completed");
  } catch (error) {
    console.error("Failed to setup authentication:", error);
    throw error;
  }
}