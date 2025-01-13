import type { Express, Request, Response, NextFunction } from "express";
import { db } from "@db";
import { posts, comments, users, postLikes, type SelectUser } from "@db/schema";
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
          comments: {
            with: {
              author: true,
            },
            orderBy: desc(comments.createdAt),
          },
        },
        orderBy: desc(posts.createdAt),
        limit: 50,
      });

      // Add user's like status to each post
      const postsWithLikeStatus = await Promise.all(feedPosts.map(async (post) => {
        const userLike = await db.query.postLikes.findFirst({
          where: and(
            eq(postLikes.postId, post.id),
            eq(postLikes.userId, user.id)
          ),
        });

        return {
          ...post,
          isLiked: !!userLike,
        };
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

      // Create the post
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
        likesCount: 0 // Initialize likesCount here
      }).returning();


      // Return the post with author information 
      const postWithDetails = await db.query.posts.findFirst({
        where: eq(posts.id, newPost.id),
        with: {
          author: true,
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
        await db.delete(postLikes)
          .where(and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, user.id)
          ));

        // Decrement likes count
        await db
          .update(posts)
          .set({ 
            likesCount: Math.max(0, post.likesCount - 1),
            updatedAt: new Date()
          })
          .where(eq(posts.id, postId));

      } else {
        // Like the post
        await db.insert(postLikes)
          .values({
            postId,
            userId: user.id,
            createdAt: new Date(),
          });

        // Increment likes count
        await db
          .update(posts)
          .set({ 
            likesCount: post.likesCount + 1,
            updatedAt: new Date()
          })
          .where(eq(posts.id, postId));
      }

      // Get updated post
      const updatedPost = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
      });

      res.json({ 
        liked: !existingLike,
        likesCount: updatedPost?.likesCount ?? 0,
      });
    } catch (error: any) {
      console.error("Error liking/unliking post:", error);
      res.status(500).json({ 
        error: "Failed to like/unlike post",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
  // Get post stats - This route is removed as stats are now directly on the post
  // app.get("/api/posts/:postId/stats", requireAuth, async (req: Request, res: Response) => { ... });
}