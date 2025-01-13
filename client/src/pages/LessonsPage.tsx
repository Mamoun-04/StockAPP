
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";

export default function LessonsPage() {
  const { user } = useUser();

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const response = await fetch('/api/lessons');
      if (!response.ok) throw new Error('Failed to load lessons');
      return response.json();
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Trading Lessons</h1>
        <div className="grid grid-cols-1 gap-8">
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
      </main>
      <Footer />
    </div>
  );
}
