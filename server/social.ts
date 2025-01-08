import type { Express, Request, Response } from "express";
import { db } from "@db";
import { posts, comments, users, type SelectUser } from "@db/schema";
import { eq, desc } from "drizzle-orm";
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

// Profile update validation schema
const profileUpdateSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
  education: z.string().optional(),
  occupation: z.string().optional(),
  alpacaApiKey: z.string().min(1, "Alpaca API Key is required").optional(),
  alpacaSecretKey: z.string().min(1, "Alpaca Secret Key is required").optional(),
});

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
        },
        orderBy: desc(posts.createdAt),
        limit: 50, // Limit the number of posts to prevent overload
      });

      console.log("Found posts:", feedPosts.length);
      res.json(feedPosts);
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
      console.log("Updating profile with data:", { ...updateData, alpacaApiKey: '[REDACTED]', alpacaSecretKey: '[REDACTED]' });

      // Only include fields that are actually provided
      const fieldsToUpdate: Partial<typeof updateData> = {};
      if (updateData.displayName !== undefined) fieldsToUpdate.displayName = updateData.displayName;
      if (updateData.bio !== undefined) fieldsToUpdate.bio = updateData.bio;
      if (updateData.avatarUrl !== undefined) fieldsToUpdate.avatarUrl = updateData.avatarUrl;
      if (updateData.education !== undefined) fieldsToUpdate.education = updateData.education;
      if (updateData.occupation !== undefined) fieldsToUpdate.occupation = updateData.occupation;
      if (updateData.alpacaApiKey !== undefined) fieldsToUpdate.alpacaApiKey = updateData.alpacaApiKey;
      if (updateData.alpacaSecretKey !== undefined) fieldsToUpdate.alpacaSecretKey = updateData.alpacaSecretKey;

      const [updatedUser] = await db
        .update(users)
        .set(fieldsToUpdate)
        .where(eq(users.id, req.user!.id))
        .returning();

      console.log("Profile updated successfully for user:", req.user?.id);
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