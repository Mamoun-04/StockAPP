import type { Express, Request, Response } from "express";
import { db } from "@db";
import { posts, comments, users, postLikes, type SelectUser } from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";

// Add type for authenticated request
interface AuthenticatedRequest extends Request {
  user?: SelectUser;
}

// Middleware to check authentication
const requireAuth = (req: AuthenticatedRequest, res: Response, next: Function) => {
  if (!req.user?.id) {
    console.log("Authentication failed - no user found in request");
    return res.status(401).json({ error: "You must be logged in to perform this action" });
  }
  next();
};

export function setupSocialRoutes(app: Express) {
  // Get feed posts with author info and comments
  app.get("/api/feed", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Fetching feed for user:", req.user?.id);
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
        const [[{ count }]] = await db
          .select({ count: sql<number>`count(*)` })
          .from(postLikes)
          .where(eq(postLikes.postId, post.id));

        const userLike = await db.query.postLikes.findFirst({
          where: and(
            eq(postLikes.postId, post.id),
            eq(postLikes.userId, req.user!.id)
          ),
        });

        return {
          ...post,
          likesCount: Number(count),
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
  app.post("/api/posts", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Creating new post for user:", req.user?.id);
      const { content, type, stockSymbol, tradeType, shares, price, profitLoss } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }

      const [newPost] = await db.insert(posts).values({
        userId: req.user!.id,
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

      console.log("Created post:", newPost.id);

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
  app.post("/api/posts/:postId/comments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Adding comment for user:", req.user?.id);
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
        userId: req.user!.id,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      console.log("Created comment:", newComment.id);

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
  app.post("/api/posts/:postId/like", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      console.log(`User ${req.user?.id} attempting to like post ${postId}`);

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
          eq(postLikes.userId, req.user!.id)
        ),
      });

      if (existingLike) {
        // Unlike the post
        await db.delete(postLikes).where(eq(postLikes.id, existingLike.id));
        console.log(`User ${req.user?.id} unliked post ${postId}`);
        return res.json({ liked: false });
      }

      // Like the post
      await db.insert(postLikes).values({
        postId,
        userId: req.user!.id,
        createdAt: new Date(),
      });

      console.log(`User ${req.user?.id} liked post ${postId}`);
      res.json({ liked: true });
    } catch (error: any) {
      console.error("Error liking/unliking post:", error);
      res.status(500).json({ 
        error: "Failed to like/unlike post",
        details: error.message 
      });
    }
  });

  // Get post likes count and user's like status
  app.get("/api/posts/:postId/likes", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);

      const [[{ count }]] = await db
        .select({ count: sql<number>`count(*)` })
        .from(postLikes)
        .where(eq(postLikes.postId, postId));

      const userLike = await db.query.postLikes.findFirst({
        where: and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, req.user!.id)
        ),
      });

      res.json({
        count: Number(count),
        liked: !!userLike,
      });
    } catch (error: any) {
      console.error("Error getting post likes:", error);
      res.status(500).json({ 
        error: "Failed to get post likes",
        details: error.message 
      });
    }
  });

  // Repost a post
  app.post("/api/posts/:postId/repost", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const { content } = req.body;

      // Check if post exists
      const post = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Create repost
      const [newRepost] = await db.insert(reposts).values({
        originalPostId: postId,
        userId: req.user!.id,
        content: content || null,
        createdAt: new Date(),
      }).returning();

      // Return the repost with user information
      const repostWithDetails = await db.query.reposts.findFirst({
        where: eq(reposts.id, newRepost.id),
        with: {
          user: true,
          originalPost: {
            with: {
              author: true,
            },
          },
        },
      });

      res.json(repostWithDetails);
    } catch (error: any) {
      console.error("Error reposting:", error);
      res.status(500).json({ 
        error: "Failed to repost",
        details: error.message 
      });
    }
  });


  // Update user profile
  app.put("/api/user/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Updating profile for user:", req.user?.id);

      // Validate the request body
      const result = profileUpdateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid input",
          details: result.error.issues.map(i => i.message)
        });
      }

      const updateData = result.data;

      // Only include fields that are actually provided
      const fieldsToUpdate: Partial<typeof updateData> = {};
      if (updateData.displayName !== undefined) fieldsToUpdate.displayName = updateData.displayName;
      if (updateData.bio !== undefined) fieldsToUpdate.bio = updateData.bio;
      if (updateData.avatarUrl !== undefined) fieldsToUpdate.avatarUrl = updateData.avatarUrl;
      if (updateData.education !== undefined) fieldsToUpdate.education = updateData.education;
      if (updateData.occupation !== undefined) fieldsToUpdate.occupation = updateData.occupation;

      const [updatedUser] = await db
        .update(users)
        .set(fieldsToUpdate)
        .where(eq(users.id, req.user!.id))
        .returning();

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({ 
        error: "Failed to update profile",
        details: error.message 
      });
    }
  });
}