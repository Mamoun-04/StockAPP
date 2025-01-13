import type { Express, Request, Response, NextFunction } from "express";
import { db } from "@db";
import { posts, comments, users, postLikes, type SelectUser } from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";

// Authentication middleware
const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "You must be logged in to perform this action" });
  }
  next();
};

export function setupSocialRoutes(app: Express) {
  // Get feed posts with author info and comments
  app.get("/api/feed", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
      const feedPosts = await db.query.posts.findMany({
        with: {
          author: true,
          comments: {
            with: {
              author: true,
            },
            orderBy: desc(comments.createdAt),
          },
          likes: true,
        },
        orderBy: desc(posts.createdAt),
        limit: 50,
      });

      // Add likes count and user's like status to each post
      const postsWithLikes = await Promise.all(feedPosts.map(async (post) => {
        const result = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(postLikes)
          .where(eq(postLikes.postId, post.id));

        const count = result[0]?.count ?? 0;

        const userLike = await db.query.postLikes.findFirst({
          where: and(
            eq(postLikes.postId, post.id),
            eq(postLikes.userId, user.id)
          ),
        });

        return {
          ...post,
          likesCount: count,
          isLiked: !!userLike,
        };
      }));

      res.json(postsWithLikes);
    } catch (error: any) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ 
        error: "Failed to fetch feed",
        details: error.message 
      });
    }
  });

  // Create a new post
  app.post("/api/posts", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
      const { content, type, stockSymbol, tradeType, shares, price, profitLoss } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }

      const [newPost] = await db.insert(posts).values({
        userId: user.id,
        content,
        type: type || 'general',
        stockSymbol,
        tradeType,
        shares,
        price,
        profitLoss,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Return the post with author information
      const postWithAuthor = await db.query.posts.findFirst({
        where: eq(posts.id, newPost.id),
        with: {
          author: true,
          comments: {
            with: {
              author: true,
            },
          },
        },
      });

      res.json(postWithAuthor);
    } catch (error: any) {
      console.error("Error creating post:", error);
      res.status(500).json({ 
        error: "Failed to create post",
        details: error.message 
      });
    }
  });

  // Add a comment to a post
  app.post("/api/posts/:postId/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
      const postId = parseInt(req.params.postId);
      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      // First verify the post exists
      const post = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const [newComment] = await db.insert(comments).values({
        postId,
        userId: user.id,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Return the comment with author information
      const commentWithAuthor = await db.query.comments.findFirst({
        where: eq(comments.id, newComment.id),
        with: {
          author: true,
        },
      });

      res.json(commentWithAuthor);
    } catch (error: any) {
      console.error("Error creating comment:", error);
      res.status(500).json({ 
        error: "Failed to create comment",
        details: error.message 
      });
    }
  });

  // Like a post
  app.post("/api/posts/:postId/like", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
      const postId = parseInt(req.params.postId);

      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      // Check if post exists
      const post = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Check if user already liked the post
      const existingLike = await db.query.postLikes.findFirst({
        where: and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, user.id)
        ),
      });

      if (existingLike) {
        // Unlike the post
        await db.delete(postLikes).where(eq(postLikes.id, existingLike.id));
        return res.json({ liked: false });
      }

      // Like the post
      const [newLike] = await db.insert(postLikes).values({
        postId,
        userId: user.id,
        createdAt: new Date(),
      }).returning();

      res.json({ liked: true });
    } catch (error: any) {
      console.error("Error liking/unliking post:", error);
      res.status(500).json({ 
        error: "Failed to like/unlike post",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get post likes count and user's like status
  app.get("/api/posts/:postId/likes", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
      const postId = parseInt(req.params.postId);

      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(postLikes)
        .where(eq(postLikes.postId, postId));

      const count = result[0]?.count ?? 0;

      const userLike = await db.query.postLikes.findFirst({
        where: and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, user.id)
        ),
      });

      res.json({
        count,
        liked: !!userLike,
      });
    } catch (error: any) {
      console.error("Error getting post likes:", error);
      res.status(500).json({ 
        error: "Failed to get post likes",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
}