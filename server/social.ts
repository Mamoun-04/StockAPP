import type { Express } from "express";
import { db } from "@db";
import { posts, comments, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export function setupSocialRoutes(app: Express) {
  // Get feed posts with author info and comment counts
  app.get("/api/feed", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).send("Not logged in");
      }

      const feedPosts = await db.query.posts.findMany({
        with: {
          author: true,
          comments: true,
        },
        orderBy: desc(posts.createdAt),
      });

      res.json(feedPosts);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Create a new post
  app.post("/api/posts", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).send("Not logged in");
      }

      const { content, type, stockSymbol, tradeType, shares, price, profitLoss } = req.body;
      const newPost = await db.insert(posts).values({
        userId: req.user.id,
        content,
        type,
        stockSymbol,
        tradeType,
        shares,
        price,
        profitLoss,
      }).returning();

      res.json(newPost[0]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Add a comment to a post
  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).send("Not logged in");
      }

      const postId = parseInt(req.params.postId);
      const { content } = req.body;

      const newComment = await db.insert(comments).values({
        postId,
        userId: req.user.id,
        content,
      }).returning();

      res.json(newComment[0]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Update user profile
  app.put("/api/user/profile", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).send("Not logged in");
      }

      const { displayName, bio, avatarUrl } = req.body;
      const updatedUser = await db
        .update(users)
        .set({
          displayName,
          bio,
          avatarUrl,
        })
        .where(eq(users.id, req.user.id))
        .returning();

      res.json(updatedUser[0]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });
}
