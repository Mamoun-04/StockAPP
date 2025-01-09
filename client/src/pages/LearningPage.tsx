import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock, CheckCircle2, Star } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import Header from "@/components/ui/header";
import TradingTermsPage from "./TradingTermsPage";
import Footer from "@/components/ui/footer";

type Lesson = {
  id: number;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  xpReward: number;
  prerequisites: number[];
  order: number;
  userProgress?: {
    completed: boolean;
    score?: number;
  }[];
};

type Achievement = {
  id: number;
  title: string;
  description: string;
  xpReward: number;
  icon: string;
  userAchievements: { id: number }[];
};

export default function LearningPage() {
  const { user } = useUser();
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  const { data: lessons = [], isLoading: lessonsLoading, error: lessonsError } = useQuery<Lesson[]>({
    queryKey: ['lessons'],
    queryFn: async () => {
      const response = await fetch('/api/lessons');
      if (!response.ok) {
        throw new Error('Failed to load lessons');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: achievements = [], isLoading: achievementsLoading, error: achievementsError } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await fetch('/api/achievements');
      if (!response.ok) {
        throw new Error('Failed to load achievements');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  if (lessonsError || achievementsError) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow p-8">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <p className="text-destructive">Error loading content. Please try again later.</p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (showTerms) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow p-8">
          <Button 
            variant="outline" 
            className="mb-4"
            onClick={() => setShowTerms(false)}
          >
            Back to Lessons
          </Button>
          <TradingTermsPage />
        </div>
        <Footer />
      </div>
    );
  }

  const completedLessons = lessons.filter(
    (lesson) => lesson.userProgress?.[0]?.completed
  ).length;
  const totalLessons = lessons.length;
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const unlockedAchievements = achievements.filter(
    (achievement) => achievement.userAchievements.length > 0
  );

  const isLessonLocked = (lesson: Lesson) => {
    if (!lesson.prerequisites?.length) return false;
    return !lesson.prerequisites.every((prereqId) =>
      lessons.find(
        (l) => l.id === prereqId && l.userProgress?.[0]?.completed
      )
    );
  };

  const getProgressColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500";
      case "intermediate":
        return "bg-yellow-500";
      case "advanced":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-grow p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Add Trading Terms Button */}
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => setShowTerms(true)}
          >
            Trading Terms & Quizzes
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Your Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={progress} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {completedLessons}/{totalLessons} Lessons
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>Level {user?.level}</span>
                  <span className="text-sm text-muted-foreground">
                    ({user?.xp} XP)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Path</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    {lessonsLoading ? (
                      <div className="text-center py-4">Loading lessons...</div>
                    ) : (
                      <Accordion
                        type="single"
                        collapsible
                        value={selectedLesson?.toString()}
                        onValueChange={(value) =>
                          setSelectedLesson(value ? parseInt(value) : null)
                        }
                      >
                        {lessons.map((lesson) => {
                          const locked = isLessonLocked(lesson);
                          const completed = lesson.userProgress?.[0]?.completed;

                          return (
                            <AccordionItem
                              key={lesson.id}
                              value={lesson.id.toString()}
                              className={locked ? "opacity-50" : ""}
                            >
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                  {completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : locked ? (
                                    <Lock className="h-5 w-5" />
                                  ) : null}
                                  <span>{lesson.title}</span>
                                  <Badge
                                    variant="secondary"
                                    className={getProgressColor(lesson.difficulty)}
                                  >
                                    {lesson.difficulty}
                                  </Badge>
                                  <Badge variant="outline">+{lesson.xpReward} XP</Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 p-4">
                                  <p className="text-sm text-muted-foreground">
                                    {lesson.description}
                                  </p>
                                  {!locked && !completed && (
                                    <Button
                                      onClick={() =>
                                        window.location.href = `/lesson/${lesson.id}`
                                      }
                                    >
                                      Start Lesson
                                    </Button>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    {achievementsLoading ? (
                      <div className="text-center py-4">Loading achievements...</div>
                    ) : (
                      <div className="space-y-4">
                        {achievements.map((achievement) => {
                          const unlocked = achievement.userAchievements.length > 0;
                          return (
                            <div
                              key={achievement.id}
                              className={`p-4 rounded-lg border ${
                                unlocked
                                  ? "bg-secondary"
                                  : "opacity-50 bg-background"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Trophy
                                  className={`h-5 w-5 ${
                                    unlocked ? "text-yellow-500" : "text-gray-500"
                                  }`}
                                />
                                <div>
                                  <h3 className="font-medium">{achievement.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {achievement.description}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2">
                                <Badge variant="outline">
                                  +{achievement.xpReward} XP
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}