import type { Express, Request, Response, NextFunction } from "express";
import { db } from "@db";
import { posts, postLikes, users, type SelectUser } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "You must be logged in to perform this action" });
  }
  next();
};

export function setupSocialRoutes(app: Express) {
  // Get feed posts with author info and likes
  app.get("/api/feed", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
      const feedPosts = await db.query.posts.findMany({
        with: {
          author: true,
          likes: true,
        },
        orderBy: desc(posts.createdAt),
        limit: 50,
      });

      // Add user's like status to each post
      const postsWithLikeStatus = feedPosts.map(post => ({
        ...post,
        isLiked: post.likes.some(like => like.userId === user.id),
      }));

      res.json(postsWithLikeStatus);
    } catch (error: any) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ 
        error: "Failed to fetch feed",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Return the post with author information
      const postWithDetails = await db.query.posts.findFirst({
        where: eq(posts.id, newPost.id),
        with: {
          author: true,
          likes: true,
        },
      });

      res.json(postWithDetails);
    } catch (error: any) {
      console.error("Error creating post:", error);
      res.status(500).json({ 
        error: "Failed to create post",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Like/unlike a post
  app.post("/api/posts/:postId/like", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as SelectUser;
      const postId = parseInt(req.params.postId);

      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      console.log(`Processing like/unlike for post ${postId} by user ${user.id}`);

      const result = await db.transaction(async (tx) => {
        // Check if post exists
        const post = await tx.query.posts.findFirst({
          where: eq(posts.id, postId),
          with: {
            likes: true,
          },
        });

        if (!post) {
          console.log(`Post ${postId} not found`);
          throw new Error("Post not found");
        }

        const hasLiked = post.likes.some(like => like.userId === user.id);
        console.log(`User ${user.id} has ${hasLiked ? 'already' : 'not'} liked post ${postId}`);

        if (hasLiked) {
          // Unlike
          console.log(`Removing like for post ${postId}`);
          await tx.delete(postLikes)
            .where(and(
              eq(postLikes.postId, postId),
              eq(postLikes.userId, user.id)
            ));

          const [updatedPost] = await tx.update(posts)
            .set({
              likesCount: Math.max(0, post.likesCount - 1),
              updatedAt: new Date()
            })
            .where(eq(posts.id, postId))
            .returning();

          console.log(`Updated post ${postId} likes count to ${updatedPost.likesCount}`);
          return { liked: false, likesCount: updatedPost.likesCount };
        } else {
          // Like
          console.log(`Adding like for post ${postId}`);
          await tx.insert(postLikes)
            .values({
              postId,
              userId: user.id,
              createdAt: new Date(),
            });

          const [updatedPost] = await tx.update(posts)
            .set({
              likesCount: post.likesCount + 1,
              updatedAt: new Date()
            })
            .where(eq(posts.id, postId))
            .returning();

          console.log(`Updated post ${postId} likes count to ${updatedPost.likesCount}`);
          return { liked: true, likesCount: updatedPost.likesCount };
        }
      });

      console.log(`Successfully processed like/unlike for post ${postId}:`, result);
      res.json(result);
    } catch (error: any) {
      console.error("Error liking/unliking post:", error);
      if (error.message === "Post not found") {
        res.status(404).json({ error: "Post not found" });
      } else {
        res.status(500).json({ 
          error: "Failed to update like status",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  });
}