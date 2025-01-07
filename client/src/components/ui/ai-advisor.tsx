import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle, AlertTriangle, LineChart, GraduationCap, ArrowRight, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type AdvisorResponse = {
  advice: string[];
  risks: string[];
  nextSteps: string[];
};

type StockData = {
  symbol: string;
  name: string;
  sentiment: number;
  risk: number;
  recommendation: 'Buy' | 'Sell' | 'Hold';
  reason: string;
};

type SearchResult = {
  symbol: string;
  name: string;
  description: string;
  similarStocks?: SearchResult[];
};

export function AIAdvisor() {
  const [question, setQuestion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (query: string): Promise<SearchResult[]> => {
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`, {
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

  const stockDataMutation = useMutation({
    mutationFn: async (symbol: string): Promise<StockData> => {
      const response = await fetch(`/api/stocks/analyze/${symbol}`, {
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

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      const results = await searchMutation.mutateAsync(query);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectStock = async (symbol: string) => {
    setSearchQuery("");
    setSuggestions([]);
    const data = await stockDataMutation.mutateAsync(symbol);
    setSelectedStock(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    advisorMutation.mutate(question);
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'buy':
        return 'bg-green-500 hover:bg-green-600';
      case 'sell':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-yellow-500 hover:bg-yellow-600';
    }
  };

  const getSentimentEmoji = (sentiment: number) => {
    if (sentiment >= 80) return '🚀';
    if (sentiment >= 60) return '😊';
    if (sentiment >= 40) return '😐';
    if (sentiment >= 20) return '😕';
    return '😢';
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <MessageCircle className="h-6 w-6" />
          Market Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Stock Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stocks (e.g., Apple, AAPL)..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9 text-lg"
            />
            {suggestions.length > 0 && (
              <Card className="absolute mt-1 w-full z-50">
                <CardContent className="p-2">
                  {suggestions.map((result) => (
                    <Button
                      key={result.symbol}
                      variant="ghost"
                      className="w-full justify-start text-left hover:bg-blue-50 dark:hover:bg-gray-700"
                      onClick={() => handleSelectStock(result.symbol)}
                    >
                      <div>
                        <div className="font-medium">{result.symbol} - {result.name}</div>
                        <div className="text-sm text-muted-foreground">{result.description}</div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Stock Analysis */}
          {selectedStock && (
            <div className="space-y-6 animate-in fade-in-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">{selectedStock.name}</h3>
                  <p className="text-muted-foreground">{selectedStock.symbol}</p>
                </div>
                <Badge
                  className={`text-lg px-6 py-2 ${getRecommendationColor(selectedStock.recommendation)}`}
                >
                  {selectedStock.recommendation}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Sentiment Score */}
                <Card className="bg-white/50 dark:bg-gray-800/50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold">Market Sentiment</h4>
                      <span className="text-2xl">{getSentimentEmoji(selectedStock.sentiment)}</span>
                    </div>
                    <Progress value={selectedStock.sentiment} className="h-3" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selectedStock.sentiment}% Positive
                    </p>
                  </CardContent>
                </Card>

                {/* Risk Score */}
                <Card className="bg-white/50 dark:bg-gray-800/50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold">Risk Level</h4>
                      <AlertTriangle className={`h-6 w-6 ${selectedStock.risk > 60 ? 'text-red-500' : 'text-yellow-500'}`} />
                    </div>
                    <Progress value={selectedStock.risk} className="h-3" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Risk Score: {selectedStock.risk}/100
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Analysis */}
              <Card className="bg-white/50 dark:bg-gray-800/50">
                <CardContent className="pt-6">
                  <h4 className="text-lg font-semibold mb-2">Analysis</h4>
                  <p className="text-muted-foreground">{selectedStock.reason}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Q&A */}
          <div className="border-t pt-6 mt-6">
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
                <div className="space-y-6">
                  {/* Main Explanation */}
                  <Card className="bg-white/50 dark:bg-gray-800/50">
                    <CardContent className="pt-6">
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
                </div>
              )}
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}