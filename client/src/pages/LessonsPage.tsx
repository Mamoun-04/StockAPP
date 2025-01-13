
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, BookOpen } from "lucide-react";
import { Header } from "@/components/ui/header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type LessonSection = {
  title: string;
  content: string;
  xpReward: number;
};

type Lesson = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  sections: LessonSection[];
  lastUpdated: Date;
  totalXP: number;
};

export default function LessonPage() {
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: ['lesson', 1],
    queryFn: async () => {
      const response = await fetch('/api/lessons/1');
      if (response.status === 401) {
        window.location.href = '/auth';
        return null;
      }
      if (!response.ok) throw new Error('Failed to load lesson');
      const data = await response.json();
      return data;
    }
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/lessons/${lesson?.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score: 100 })
      });
      if (!response.ok) throw new Error('Failed to complete lesson');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lesson']);
      setIsLessonOpen(false);
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-500';
      case 'intermediate':
        return 'bg-amber-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const nextSection = () => {
    if (currentSectionIndex < (lesson?.sections.length || 0) - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      completeMutation.mutate();
    }
  };

  const previousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  };

  if (isLoading || !lesson) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header showSidebar={false} />
      <div className="max-w-6xl mx-auto p-6 flex-1">
        <h1 className="text-3xl font-bold mb-6">Available Lessons</h1>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{lesson.title}</h2>
                <p className="text-muted-foreground mt-1">{lesson.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ScrollText className="w-4 h-4" />
                    <span>Last updated: {new Date(lesson.lastUpdated).toLocaleDateString()}</span>
                  </div>
                  <Badge variant="outline">+{lesson.totalXP} XP Total</Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={getDifficultyColor(lesson.difficulty)}>
                  {lesson.difficulty}
                </Badge>
                <Dialog open={isLessonOpen} onOpenChange={setIsLessonOpen}>
                  <DialogTrigger asChild>
                    <button className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
                      <BookOpen className="w-5 h-5" />
                      Start Lesson
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{lesson.title}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-6">
                        {lesson.sections.map((_, index) => (
                          <div
                            key={index}
                            className={`h-2 flex-1 rounded-full ${
                              index <= currentSectionIndex ? 'bg-primary' : 'bg-secondary'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold">
                          {lesson.sections[currentSectionIndex].title}
                        </h3>
                        <div className="prose dark:prose-invert">
                          {lesson.sections[currentSectionIndex].content}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Badge variant="outline">
                            +{lesson.sections[currentSectionIndex].xpReward} XP
                          </Badge>
                          <div className="flex gap-4">
                            <button
                              onClick={previousSection}
                              disabled={currentSectionIndex === 0}
                              className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
                            >
                              Previous
                            </button>
                            <button
                              onClick={nextSection}
                              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              {currentSectionIndex === lesson.sections.length - 1 ? 'Complete' : 'Next'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {lesson.sections.map((section, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/10">
                  <span className="text-sm">{section.title}</span>
                  <Badge variant="outline">+{section.xpReward} XP</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
