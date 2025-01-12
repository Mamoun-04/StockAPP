import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/use-user";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import NavigationSidebar from "@/components/ui/navigation-sidebar";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type Post = {
  id: number;
  content: string;
  type: string;
  stockSymbol?: string;
  tradeType?: string;
  shares?: number;
  price?: number;
  profitLoss?: number;
  createdAt: string;
  author: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  comments: {
    id: number;
    content: string;
    createdAt: string;
    author: {
      id: number;
      username: string;
      displayName?: string;
      avatarUrl?: string;
    };
  }[];
};

export default function FeedPage() {
  const { user } = useUser();
  const [newPost, setNewPost] = useState("");
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['/api/feed'],
    enabled: !!user?.id,
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type: 'general'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      setNewPost("");
      toast({
        title: "Success",
        description: "Your post has been published!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      setNewComment({});
      toast({
        title: "Success",
        description: "Your comment has been added!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePost = () => {
    if (!newPost.trim()) return;
    createPostMutation.mutate(newPost);
  };

  const handleComment = (postId: number) => {
    const content = newComment[postId];
    if (!content?.trim()) return;
    addCommentMutation.mutate({ postId, content });
  };

  const getInitials = (author: { displayName?: string; username: string } | undefined) => {
    if (author?.displayName) {
      return author.displayName[0].toUpperCase();
    }
    return author?.username ? author.username[0].toUpperCase() : '?';
  };

  const renderAuthorName = (author: { displayName?: string; username: string } | undefined) => {
    if (!author) return 'Unknown User';
    return author.displayName || author.username;
  };

  const renderTradeInfo = (post: Post) => {
    if (post.type !== 'trade' || !post.stockSymbol) return null;

    const profitClass = post.profitLoss && post.profitLoss > 0 ? 'text-green-500' : 'text-red-500';

    return (
      <div className="mt-2 p-3 bg-secondary rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-semibold">{post.stockSymbol}</span>
          <span className="text-sm text-muted-foreground">{post.tradeType}</span>
        </div>
        {post.shares && post.price && (
          <div className="mt-1 text-sm">
            <span>{post.shares} shares @ ${post.price}</span>
          </div>
        )}
        {post.profitLoss && (
          <div className={`mt-1 font-semibold ${profitClass}`}>
            {post.profitLoss > 0 ? '+' : ''}{post.profitLoss.toFixed(2)} USD
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationSidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <Header className="fixed top-0 right-0 left-64 z-50 border-b bg-background" />
        <main className="flex-grow p-8 mt-16">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* New Post Form */}
            <Card>
              <CardContent className="pt-6">
                <Textarea
                  placeholder="Share your trading insights..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] mb-4"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handlePost}
                    disabled={createPostMutation.isPending}
                  >
                    {createPostMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            {isLoading ? (
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading posts...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      {/* Post Header */}
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar>
                          {post.author?.avatarUrl && (
                            <AvatarImage
                              src={post.author.avatarUrl}
                              alt={renderAuthorName(post.author)}
                            />
                          )}
                          <AvatarFallback>
                            {post.author ? getInitials(post.author) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">
                            {renderAuthorName(post.author)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div>
                        <p className="text-sm">{post.content}</p>
                        {renderTradeInfo(post)}
                      </div>

                      {/* Comments Section */}
                      <div className="mt-4">
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          {post.comments?.length || 0} comments
                        </div>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-4">
                            {post.comments?.map((comment) => (
                              <div key={comment.id} className="flex space-x-3">
                                <Avatar className="h-6 w-6">
                                  {comment.author?.avatarUrl && (
                                    <AvatarImage
                                      src={comment.author.avatarUrl}
                                      alt={renderAuthorName(comment.author)}
                                    />
                                  )}
                                  <AvatarFallback>
                                    {comment.author ? getInitials(comment.author) : '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium">
                                    {renderAuthorName(comment.author)}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {comment.content}
                                  </p>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        {/* Add Comment */}
                        <div className="mt-4 flex gap-2">
                          <Textarea
                            placeholder="Write a comment..."
                            value={newComment[post.id] || ''}
                            onChange={(e) => setNewComment({
                              ...newComment,
                              [post.id]: e.target.value
                            })}
                            className="min-h-[60px]"
                          />
                          <Button
                            size="sm"
                            className="self-end"
                            disabled={addCommentMutation.isPending}
                            onClick={() => handleComment(post.id)}
                          >
                            {addCommentMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : 'Comment'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer className="border-t bg-background" />
      </div>
    </div>
  );
}