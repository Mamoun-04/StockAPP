import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, BookOpen } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Flashcard } from "@/components/ui/flashcard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Lesson = {
  id: number;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  xpReward: number;
  userProgress?: Array<{
    completed: boolean;
    score: number;
  }>;
};

export default function LessonsPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showFlashcards, setShowFlashcards] = useState(false);

  // Fetch lessons data from API
  const { data: lessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons'],
    enabled: !!user?.id,
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score: 100 }),
      });
      if (!response.ok) throw new Error('Failed to complete lesson');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleLessonComplete = async () => {
    if (!selectedLesson) return;
    setShowFlashcards(false);
    try {
      await completeLessonMutation.mutateAsync(selectedLesson.id);
    } catch (error) {
      console.error('Failed to complete lesson:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Trading Lessons</h1>
        <div className="grid grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Available Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-4">Loading lessons...</div>
                  ) : (
                    lessons.map((lesson) => (
                      <Card key={lesson.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-medium">{lesson.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {lesson.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge
                              variant="secondary"
                              className={getDifficultyColor(lesson.difficulty)}
                            >
                              {lesson.difficulty}
                            </Badge>
                            <Badge variant="outline">+{lesson.xpReward} XP</Badge>
                            <Dialog open={showFlashcards} onOpenChange={setShowFlashcards}>
                              <DialogTrigger asChild>
                                <button
                                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                  onClick={() => {
                                    setSelectedLesson(lesson);
                                    setShowFlashcards(true);
                                  }}
                                >
                                  <BookOpen className="mr-2 h-4 w-4" />
                                  Start Lesson
                                </button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>{lesson.title}</DialogTitle>
                                </DialogHeader>
                                {selectedLesson && (
                                  <div className="mt-4">
                                    <div className="prose dark:prose-invert max-w-none">
                                      <div dangerouslySetInnerHTML={{ 
                                        __html: selectedLesson.content
                                          .split('\n')
                                          .map(line => {
                                            if (line.startsWith('# ')) {
                                              return `<h1 class="text-2xl font-bold mb-4">${line.slice(2)}</h1>`;
                                            }
                                            if (line.startsWith('## ')) {
                                              return `<h2 class="text-xl font-bold mb-3 mt-6">${line.slice(3)}</h2>`;
                                            }
                                            if (line.startsWith('### ')) {
                                              return `<h3 class="text-lg font-bold mb-2 mt-4">${line.slice(4)}</h3>`;
                                            }
                                            if (line.startsWith('- ')) {
                                              return `<li class="ml-4">${line.slice(2)}</li>`;
                                            }
                                            return `<p class="mb-2">${line}</p>`;
                                          })
                                          .join('\n')
                                      }} />
                                    </div>
                                    <div className="mt-8 flex justify-end">
                                      <button
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                        onClick={handleLessonComplete}
                                      >
                                        Complete Lesson
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}