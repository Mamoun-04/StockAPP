import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ScrollText, BookOpen, MessageCircle, GraduationCap } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Enhanced flashcard generation using GPT-generated content
function createFlashcardsFromLesson(content: string) {
  // Split content into sections based on markdown headers
  const sections = content.split(/(?=## )/);
  const flashcards = [];

  for (const section of sections) {
    const lines = section.split('\n').filter(line => line.trim());

    // Get section title if it exists
    const titleMatch = lines[0].match(/## (.*)/);
    if (titleMatch) {
      const title = titleMatch[1];
      // Create a question from the section title
      flashcards.push({
        question: `What is the main topic being discussed in this section: "${title.replace(/[^,.:\s]+ /, '_____')}"?`,
        answer: title.split(' ')[0]
      });
    }

    // Process bullet points and key concepts
    lines.forEach(line => {
      if (line.startsWith('• ') || line.startsWith('- ')) {
        const content = line.replace(/^[•-]\s/, '');
        const words = content.split(' ');
        const keyWordIndex = Math.floor(Math.random() * words.length);
        const keyWord = words[keyWordIndex];

        flashcards.push({
          question: content.replace(keyWord, '_____'),
          answer: keyWord
        });
      }
    });
  }

  return flashcards;
}

type Lesson = {
  id: number;
  topic: string;
  description: string;
  content: string;
  difficulty: string;
  lastUpdated: Date;
  xpReward?: number;
  userProgress?: Array<{
    completed: boolean;
    score: number;
  }>;
};

export default function LessonsPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [showFlashcards, setShowFlashcards] = useState(false);

  // Fetch lessons with filtering
  const { data: lessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons', selectedDifficulty],
    queryFn: async () => {
      const url = selectedDifficulty === "all" 
        ? '/api/lessons'
        : `/api/lessons?difficulty=${selectedDifficulty}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch lessons');
      return response.json();
    },
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

  const difficulties = ["all", "Beginner", "Intermediate", "Advanced"];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500 hover:bg-green-600';
      case 'intermediate':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'advanced':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Trading Academy</h1>
        <div className="flex gap-2 mb-6">
          {difficulties.map((diff) => (
            <Badge
              key={diff}
              className={`cursor-pointer ${
                selectedDifficulty === diff.toLowerCase()
                  ? getDifficultyColor(diff)
                  : 'bg-secondary'
              }`}
              onClick={() => setSelectedDifficulty(diff.toLowerCase())}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </Badge>
          ))}
        </div>
      </div>

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
                  <Card key={lesson.id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{lesson.topic}</h3>
                        <p className="text-sm text-muted-foreground">
                          {lesson.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <ScrollText className="w-4 h-4" />
                            <span>Last updated: {new Date(lesson.lastUpdated).toLocaleDateString()}</span>
                          </div>
                          {lesson.xpReward && (
                            <Badge variant="outline">+{lesson.xpReward} XP</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          className={getDifficultyColor(lesson.difficulty)}
                        >
                          {lesson.difficulty}
                        </Badge>
                        <Dialog open={showFlashcards && selectedLesson?.id === lesson.id} 
                               onOpenChange={setShowFlashcards}>
                          <DialogTrigger asChild>
                            <button
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                              onClick={() => {
                                setSelectedLesson(lesson);
                                setShowFlashcards(true);
                              }}
                            >
                              <BookOpen className="w-4 h-4" />
                              Start Lesson
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>{lesson.topic}</DialogTitle>
                            </DialogHeader>
                            {selectedLesson && (
                              <div className="mt-4">
                                <div className="prose dark:prose-invert mb-6">
                                  <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <button
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                    onClick={() => {
                                      // Start flashcards
                                      const flashcards = createFlashcardsFromLesson(selectedLesson.content);
                                      // You'll need to implement the Flashcard component
                                      // setFlashcards(flashcards);
                                    }}
                                  >
                                    <GraduationCap className="w-4 h-4" />
                                    Practice with Flashcards
                                  </button>
                                  <button
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                                    onClick={() => {
                                      // Implement AI chat functionality
                                    }}
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    Ask AI Tutor
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
  );
}