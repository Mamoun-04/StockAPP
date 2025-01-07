import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle, AlertTriangle } from "lucide-react";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          AI Trading Advisor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about any trading concept..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={advisorMutation.isPending}
            />
            <Button type="submit" disabled={advisorMutation.isPending}>
              {advisorMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ask"
              )}
            </Button>
          </div>

          {advisorMutation.data && (
            <div className="space-y-4 mt-4">
              <div>
                <p className="whitespace-pre-wrap">{advisorMutation.data.advice}</p>
              </div>

              {advisorMutation.data.risks.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Key Considerations
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {advisorMutation.data.risks.map((risk, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {advisorMutation.data.nextSteps.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Next Steps</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {advisorMutation.data.nextSteps.map((step, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
