import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollText, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Header from '@/components/ui/header';

type Lesson = {
  id: number;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  xpReward: number;
};

export default function TradingLessons() {
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const queryClient = useQueryClient();

  const { data: lessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons'],
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
      setIsLessonOpen(false);
      setSelectedLesson(null);
    },
  });

  const handleStartLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsLessonOpen(true);
  };

  const handleLessonComplete = () => {
    if (selectedLesson) {
      completeLessonMutation.mutate(selectedLesson.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Trading Academy</h1>

        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <Card className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ) : (
            lessons.map((lesson) => (
              <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{lesson.title}</CardTitle>
                    <Badge variant="secondary">{lesson.difficulty}</Badge>
                  </div>
                  <CardDescription>{lesson.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ScrollText className="w-4 h-4" />
                        <span>Comprehensive lesson</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>~15 mins</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleStartLesson(lesson)}
                    >
                      Start Lesson
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isLessonOpen} onOpenChange={setIsLessonOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedLesson && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedLesson.title}</DialogTitle>
                </DialogHeader>
                <div>
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
                    <Button
                      variant="default"
                      onClick={handleLessonComplete}
                      disabled={completeLessonMutation.isPending}
                    >
                      Complete Lesson
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}