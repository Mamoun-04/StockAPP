import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle, AlertTriangle, LineChart, GraduationCap } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type AdvisorResponse = {
  advice: string;
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
                    <p className="text-lg leading-relaxed whitespace-pre-wrap">
                      {advisorMutation.data.advice}
                    </p>
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
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}