import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollText, BookOpen, GraduationCap } from "lucide-react";
import { useLocation } from "wouter";
import Header from '@/components/ui/header';

import { Badge } from "@/components/ui/badge";

type Lesson = {
  id: number;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  topic: string;
  xpReward: number;
  order: number;
};

export default function TradingLessons() {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [_, setLocation] = useLocation();

  const { data: lessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ['/api/lessons'],
  });

  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  const topics = Array.from(new Set(lessons.map(lesson => lesson.topic))).sort(); //Sort topics alphabetically

  const filteredLessons = lessons.filter((lesson) => {
    const difficultyMatch = selectedDifficulty === 'all' || lesson.difficulty === selectedDifficulty;
    const topicMatch = selectedTopic === 'all' || lesson.topic === selectedTopic;
    return difficultyMatch && topicMatch;
  });

  const handleStartLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsLessonOpen(true);
  };

  const handleLessonComplete = () => {
    //Implementation for lesson completion
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Trading Academy</h1>
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Difficulty</h3>
              <div className="flex gap-2">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="all">All Difficulties</option>
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Topics</h3>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="all">All Topics</option>
                  {topics.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{lesson.title}</CardTitle>
                    <Badge variant={
                      lesson.difficulty === 'Beginner' ? 'default' :
                        lesson.difficulty === 'Intermediate' ? 'secondary' : 'destructive'
                    }>
                      {lesson.difficulty}
                    </Badge>
                  </div>
                  <CardDescription>{lesson.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ScrollText className="w-4 h-4" />
                        <span>{lesson.topic}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{lesson.duration || '15 mins'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleStartLesson(lesson)}
                      >
                        <GraduationCap className="w-4 h-4" />
                        Start Lesson
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lesson Content Dialog */}
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
                  <div className="mt-8 flex justify-between items-center">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const sections = selectedLesson.content.split('\n## ');
                        // Implementation for previous section
                      }}
                    >
                      Previous Section
                    </Button>
                    <Button 
                      onClick={() => {
                        const sections = selectedLesson.content.split('\n## ');
                        // Implementation for next section
                      }}
                    >
                      Next Section
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleLessonComplete}
                      className="ml-4"
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