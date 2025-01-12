import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/use-user";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MoreHorizontal, Settings, DollarSign, LayoutList, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

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
  };
  comments: {
    id: number;
    content: string;
    createdAt: string;
    author: {
      id: number;
      username: string;
      displayName?: string;
    };
  }[];
};

export default function FeedPage() {
  const { user } = useUser();
  const [newPost, setNewPost] = useState("");
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['/api/feed'],
    enabled: !!user?.id,
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'general' }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error(await response.text());
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
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error(await response.text());
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
        variant: "destructive",
        title: "Error",
        description: error.message,
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

  const getInitials = (author: { displayName?: string; username: string }) => {
    if (author?.displayName) {
      return author.displayName[0].toUpperCase();
    }
    return author?.username ? author.username[0].toUpperCase() : '?';
  };

  const renderAuthorName = (author: { displayName?: string; username: string }) => {
    return author?.displayName || author?.username || 'Unknown User';
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

  const navigateTo = (path: string) => () => setLocation(path);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-64 h-screen sticky top-0 bg-background border-r flex flex-col">
          <nav className="space-y-2 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={navigateTo('/feed')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Feed
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={navigateTo('/lists')}
            >
              <LayoutList className="mr-2 h-4 w-4" />
              Lists
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={navigateTo('/monetization')}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Monetization
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={navigateTo('/lists')}>
                  <div className="flex items-center w-full">
                    <LayoutList className="mr-2 h-4 w-4" />
                    Lists
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={navigateTo('/monetization')}>
                  <div className="flex items-center w-full">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Monetization
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={navigateTo('/settings')}>
                  <div className="flex items-center w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings and privacy
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="mt-auto p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden text-left">
                      <p className="text-sm font-medium truncate">{user?.username}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user?.username}</p>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={navigateTo('/profile')}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={navigateTo('/settings')}>Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 border-l min-h-screen">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <Card className="mb-6">
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
                    {createPostMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar>
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

                      <div>
                        <p className="text-sm">{post.content}</p>
                        {renderTradeInfo(post)}
                      </div>

                      <div className="mt-4">
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          {post.comments?.length || 0} comments
                        </div>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-4">
                            {post.comments?.map((comment) => (
                              <div key={comment.id} className="flex space-x-3">
                                <Avatar className="h-6 w-6">
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
      </div>

      {/* Footer */}
      <footer className="bg-background border-t py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-muted-foreground text-center">
            © 2025 Trading Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}