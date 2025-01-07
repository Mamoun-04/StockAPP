import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle, AlertTriangle, LineChart, GraduationCap, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type AdvisorResponse = {
  advice: string[];
  risks: string[];
  nextSteps: string[];
};

export function AIAdvisor() {
  const [question, setQuestion] = useState("");
  const { toast } = useToast();

  const advisorMutation = useMutation({
    mutationFn: async (question: string): Promise<AdvisorResponse> => {
      const response = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    advisorMutation.mutate(question);
  };

  // Helper to extract key terms from the advice text
  const generateSuggestedQuestions = (advice: string): string[] => {
    const commonTerms = [
      [
        "profit margin",
        ["What is net profit margin?", "How to improve profit margins?", "What's the difference between gross and net margins?"],
        ["revenue", "cost", "net", "gross"]
      ],
      [
        "revenue",
        ["What affects revenue growth?", "How to calculate revenue projections?", "What's the difference between revenue and income?"],
        ["sales", "income", "earnings"]
      ],
      [
        "investment",
        ["What is risk management in investing?", "How to build a diversified portfolio?", "What are different investment strategies?"],
        ["portfolio", "risk", "return", "strategy"]
      ],
      [
        "technical analysis",
        ["What are support and resistance levels?", "How to use moving averages?", "What is relative strength index (RSI)?"],
        ["indicator", "chart", "pattern", "trend"]
      ],
      [
        "fundamental analysis",
        ["How to read financial statements?", "What are key financial ratios?", "How to value a company?"],
        ["valuation", "ratio", "statement", "earnings"]
      ],
    ];

    // Extract key terms from the advice text
    const lowerAdvice = advice.toLowerCase();
    let suggestedQuestions: string[] = [];

    // Find matching terms and their related terms
    for (const [mainTerm, questions, relatedTerms] of commonTerms) {
      if (
        lowerAdvice.includes(mainTerm as string) ||
        (relatedTerms as string[]).some(term => lowerAdvice.includes(term))
      ) {
        suggestedQuestions.push(...questions as string[]);
      }
    }

    // If we found relevant questions, return the top 3
    if (suggestedQuestions.length > 0) {
      return suggestedQuestions.slice(0, 3);
    }

    // Default questions based on the broader topic of trading and investing
    return [
      "What are common trading strategies?",
      "How to analyze market trends?",
      "What are key risk management techniques?",
    ];
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <MessageCircle className="h-6 w-6" />
          AI Trading Advisor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about any trading concept..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={advisorMutation.isPending}
              className="text-lg"
            />
            <Button type="submit" disabled={advisorMutation.isPending} size="lg">
              {advisorMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ask"
              )}
            </Button>
          </div>

          {advisorMutation.data && (
            <div className="space-y-6 mt-6">
              {/* Main Explanation */}
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="pt-6">
                  <LineChart className="h-6 w-6 mb-4 text-blue-500" />
                  <div className="prose dark:prose-invert max-w-none">
                    {advisorMutation.data.advice.map((point, i) => (
                      <div key={i} className={i === 0 ? 'mb-4 text-lg font-medium' : 'flex items-start gap-2 mb-2'}>
                        {i === 0 ? (
                          point
                        ) : (
                          <>
                            <span className="text-blue-600 mt-1">•</span>
                            <span className="text-gray-700 dark:text-gray-300">{point}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Considerations */}
              {advisorMutation.data.risks.length > 0 && (
                <Card className="bg-amber-50 dark:bg-gray-800/50">
                  <CardContent className="pt-6">
                    <h4 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Key Considerations
                    </h4>
                    <ul className="space-y-3">
                      {advisorMutation.data.risks.map((risk, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                        >
                          <span className="text-amber-600 mt-1">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Next Steps */}
              {advisorMutation.data.nextSteps.length > 0 && (
                <Card className="bg-green-50 dark:bg-gray-800/50">
                  <CardContent className="pt-6">
                    <h4 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <GraduationCap className="h-5 w-5 text-green-500" />
                      Next Steps
                    </h4>
                    <ul className="space-y-3">
                      {advisorMutation.data.nextSteps.map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                        >
                          <span className="text-green-600 mt-1">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Suggested Questions */}
              <Card className="bg-blue-50 dark:bg-gray-800/50">
                <CardContent className="pt-6">
                  <h4 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    Related Questions
                  </h4>
                  <div className="grid gap-2">
                    {generateSuggestedQuestions(advisorMutation.data.advice.join(' ')).map((suggestedQ, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        className="justify-start text-left hover:bg-blue-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          setQuestion(suggestedQ);
                          advisorMutation.mutate(suggestedQ);
                        }}
                      >
                        <ArrowRight className="h-4 w-4 mr-2 text-blue-500" />
                        {suggestedQ}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}