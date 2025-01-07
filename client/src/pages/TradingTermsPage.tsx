import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trophy, Star } from "lucide-react";
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

type QuizQuestion = {
  id: number;
  term: string;
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  difficulty: string;
  xpReward: number;
};

export default function TradingTermsPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const { data: questions = [] } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/quiz/questions"],
    enabled: !!user?.id,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/achievements"],
    enabled: !!user?.id,
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (answer: { questionId: number; answer: string }) => {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answer),
      });
      if (!response.ok) throw new Error("Failed to submit answer");
      return response.json();
    },
  });

  const filteredTerms = tradingTerms.filter(
    (term) =>
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startQuiz = () => {
    if (questions.length > 0) {
      setCurrentQuestion(questions[0]);
      setQuizScore(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !selectedAnswer) return;

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
        setCurrentQuestion(questions[currentIndex + 1]);
        setSelectedAnswer(null);
        setIsAnswered(false);
      } else {
        setCurrentQuestion(null); // Quiz completed
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Trading Terms Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Trading Terms Glossary</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={startQuiz} disabled={!questions.length}>
                    Take Quiz
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Trading Terms Quiz</DialogTitle>
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
                          {[
                            currentQuestion.correctAnswer,
                            ...currentQuestion.wrongAnswers,
                          ]
                            .sort(() => Math.random() - 0.5)
                            .map((answer) => (
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
                      <Button onClick={startQuiz}>Try Again</Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
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

        {/* Achievements Section */}
        {achievements && achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex flex-col items-center p-4 border rounded-lg"
                  >
                    <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
                    <h4 className="font-medium text-center">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                      {achievement.description}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      +{achievement.xpReward} XP
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}