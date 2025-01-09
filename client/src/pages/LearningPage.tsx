import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock, CheckCircle2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import Header from "@/components/ui/header";
import TradingTermsPage from "./TradingTermsPage";
import Footer from "@/components/ui/footer";

export default function LearningPage() {
  const { user } = useUser();
  const [showTerms, setShowTerms] = useState(false);

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const response = await fetch('/api/lessons');
      if (!response.ok) throw new Error('Failed to load lessons');
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await fetch('/api/achievements');
      if (!response.ok) throw new Error('Failed to load achievements');
      return response.json();
    },
    enabled: !!user?.id,
  });

  const completedLessons = lessons.filter(lesson => lesson.userProgress?.[0]?.completed).length;
  const totalLessons = lessons.length;
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  if (showTerms) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow p-8">
          <Button variant="outline" className="mb-4" onClick={() => setShowTerms(false)}>
            Back to Lessons
          </Button>
          <TradingTermsPage />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-grow p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Button size="lg" className="w-full" onClick={() => setShowTerms(true)}>
            Trading Terms & Quizzes
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Your Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>{completedLessons} of {totalLessons} lessons completed</span>
                  <span>Level {user?.level || 1}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Lessons</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    {lessonsLoading ? (
                      <div>Loading lessons...</div>
                    ) : (
                      <div className="space-y-4">
                        {lessons.map((lesson) => (
                          <Card key={lesson.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">{lesson.title}</h3>
                                <p className="text-sm text-muted-foreground">{lesson.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {lesson.userProgress?.[0]?.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Lock className="h-5 w-5" />
                                )}
                                <Badge variant="secondary">+{lesson.xpReward} XP</Badge>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
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
                      <div>Loading achievements...</div>
                    ) : (
                      <div className="space-y-4">
                        {achievements.map((achievement) => (
                          <div
                            key={achievement.id}
                            className={`p-4 rounded-lg border ${
                              achievement.userAchievements?.length > 0
                                ? "bg-secondary"
                                : "opacity-50 bg-background"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Trophy className={`h-5 w-5 ${
                                achievement.userAchievements?.length > 0
                                  ? "text-yellow-500"
                                  : "text-gray-500"
                              }`} />
                              <div>
                                <h3 className="font-medium">{achievement.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {achievement.description}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="mt-2">
                              +{achievement.xpReward} XP
                            </Badge>
                          </div>
                        ))}
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