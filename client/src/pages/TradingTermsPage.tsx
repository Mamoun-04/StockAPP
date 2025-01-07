import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trophy, Star, GraduationCap, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Common trading terms with their definitions
const tradingTerms = [
  {
    term: "Bull Market",
    definition: "A market condition where prices are rising or expected to rise.",
    example: "The S&P 500 entered a bull market after rising 20% from its previous low.",
  },
  {
    term: "Bear Market",
    definition: "A market condition where prices are falling or expected to fall.",
    example: "Investors became cautious as the market entered bear territory.",
  },
  {
    term: "Volume",
    definition: "The total number of shares or contracts traded in a security or market during a given period.",
    example: "High trading volume often indicates strong investor interest.",
  },
  {
    term: "Market Order",
    definition: "An order to buy or sell a security immediately at the best available current price.",
    example: "She placed a market order to buy 100 shares of Apple stock.",
  },
  {
    term: "Limit Order",
    definition: "An order to buy or sell a security at a specified price or better.",
    example: "He set a limit order to buy Tesla shares at $150 or lower.",
  },
];

type QuizSection = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  order: number;
};

type QuizQuestion = {
  id: number;
  sectionId: number;
  term: string;
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  difficulty: string;
  xpReward: number;
};

type UserProgress = {
  sectionId: number;
  score: number;
  bestScore: number;
  attemptsCount: number;
};

export default function TradingTermsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<QuizSection | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([]);

  // Fetch quiz sections with user progress
  const { data: sections = [] } = useQuery<QuizSection[]>({
    queryKey: ["/api/quiz/sections"],
    enabled: !!user?.id,
  });

  // Fetch user progress for all sections
  const { data: progress = [] } = useQuery<UserProgress[]>({
    queryKey: ["/api/quiz/progress"],
    enabled: !!user?.id,
  });

  // Fetch questions for selected section
  const { data: questions = [] } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/quiz/questions", selectedSection?.id],
    enabled: !!selectedSection?.id,
  });

  // Set up answers in a fixed order when question changes
  useEffect(() => {
    if (currentQuestion) {
      const answers = [currentQuestion.correctAnswer, ...currentQuestion.wrongAnswers];
      setQuestionAnswers(answers);
    }
  }, [currentQuestion]);

  const submitAnswerMutation = useMutation({
    mutationFn: async (answer: { questionId: number; answer: string }) => {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answer),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (data) => {
      if (data.correct) {
        toast({
          title: "Correct!",
          description: `You earned ${data.xpEarned} XP!`,
        });
      } else {
        toast({
          title: "Incorrect",
          description: "Try again!",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startQuiz = (section: QuizSection) => {
    setSelectedSection(section);
    if (questions.length > 0) {
      const firstQuestion = questions[0];
      setCurrentQuestion(firstQuestion);
      setQuestionAnswers([firstQuestion.correctAnswer, ...firstQuestion.wrongAnswers]);
      setQuizScore(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !selectedAnswer) return;

    try {
      const result = await submitAnswerMutation.mutateAsync({
        questionId: currentQuestion.id,
        answer: selectedAnswer,
      });

      setIsAnswered(true);
      if (result.correct) {
        setQuizScore((prev) => prev + currentQuestion.xpReward);
      }

      // Move to next question after 2 seconds
      setTimeout(() => {
        const currentIndex = questions.findIndex((q) => q.id === currentQuestion.id);
        if (currentIndex < questions.length - 1) {
          const nextQuestion = questions[currentIndex + 1];
          setCurrentQuestion(nextQuestion);
          setQuestionAnswers([nextQuestion.correctAnswer, ...nextQuestion.wrongAnswers]);
          setSelectedAnswer(null);
          setIsAnswered(false);
        } else {
          setCurrentQuestion(null); // Quiz completed
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

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

  const getCategoryLevel = (sectionId: number) => {
    const sectionProgress = progress.find(p => p.sectionId === sectionId);
    if (!sectionProgress) return 1;
    return Math.floor(sectionProgress.bestScore / 500) + 1;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Quiz Sections */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {sections.map((section) => {
                const sectionProgress = progress.find(p => p.sectionId === section.id);
                const categoryLevel = getCategoryLevel(section.id);
                return (
                  <Card key={section.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{section.title}</h3>
                          <Badge variant="outline" className="bg-blue-100">
                            Level {categoryLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {section.description}
                        </p>
                        {sectionProgress && (
                          <div className="flex items-center gap-4 mt-2">
                            <div className="text-sm">
                              Best Score: {sectionProgress.bestScore}
                            </div>
                            <div className="text-sm">
                              Attempts: {sectionProgress.attemptsCount}
                            </div>
                            <Progress 
                              value={(sectionProgress.bestScore % 500) / 5} 
                              className="w-24"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant="secondary"
                          className={getDifficultyColor(section.difficulty)}
                        >
                          {section.difficulty}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button onClick={() => startQuiz(section)}>
                              Start Quiz <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>{section.title} Quiz</DialogTitle>
                            </DialogHeader>
                            {currentQuestion ? (
                              <div className="space-y-4">
                                <Progress
                                  value={
                                    ((questions.findIndex(
                                      (q) => q.id === currentQuestion.id
                                    ) +
                                      1) /
                                      questions.length) *
                                    100
                                  }
                                  className="w-full"
                                />
                                <p className="text-sm text-muted-foreground">
                                  Question {questions.findIndex((q) => q.id === currentQuestion.id) + 1} of{" "}
                                  {questions.length}
                                </p>
                                <div className="space-y-4">
                                  <p className="font-medium">{currentQuestion.question}</p>
                                  <div className="grid grid-cols-1 gap-2">
                                    {questionAnswers.map((answer) => (
                                      <Button
                                        key={answer}
                                        variant={
                                          isAnswered
                                            ? answer === currentQuestion.correctAnswer
                                              ? "default"
                                              : "secondary"
                                            : selectedAnswer === answer
                                            ? "default"
                                            : "secondary"
                                        }
                                        className={
                                          isAnswered &&
                                          answer === currentQuestion.correctAnswer
                                            ? "bg-green-500 hover:bg-green-600"
                                            : isAnswered &&
                                              answer === selectedAnswer &&
                                              answer !== currentQuestion.correctAnswer
                                            ? "bg-red-500 hover:bg-red-600"
                                            : ""
                                        }
                                        onClick={() => !isAnswered && setSelectedAnswer(answer)}
                                        disabled={isAnswered}
                                      >
                                        {answer}
                                      </Button>
                                    ))}
                                  </div>
                                  {!isAnswered && (
                                    <Button
                                      className="w-full"
                                      disabled={!selectedAnswer}
                                      onClick={handleAnswerSubmit}
                                    >
                                      Submit Answer
                                    </Button>
                                  )}
                                  {isAnswered && (
                                    <div className="text-center">
                                      <p className="text-sm font-medium">
                                        {selectedAnswer === currentQuestion.correctAnswer
                                          ? `Correct! +${currentQuestion.xpReward} XP`
                                          : "Incorrect. Try again!"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4 text-center">
                                <Trophy className="h-12 w-12 mx-auto text-yellow-500" />
                                <h3 className="font-medium text-lg">Quiz Complete!</h3>
                                <p>You earned {quizScore} XP</p>
                                <Button onClick={() => startQuiz(section)}>Try Again</Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Trading Terms Glossary */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Terms Glossary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Terms List */}
        <div className="grid gap-4">
          {filteredTerms.map((term) => (
            <Card key={term.term}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">{term.term}</h3>
                <p className="text-muted-foreground mb-4">{term.definition}</p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Example: </span>
                    {term.example}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}