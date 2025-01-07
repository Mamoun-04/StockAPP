import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, TrendingUp, AlertCircle, BarChart2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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
};

export function StockIndicators() {
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
    <Card className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <BarChart2 className="h-6 w-6" />
          Stock Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

          {/* Stock Data */}
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
                      <AlertCircle className={`h-6 w-6 ${selectedStock.risk > 60 ? 'text-red-500' : 'text-yellow-500'}`} />
                    </div>
                    <Progress value={selectedStock.risk} className="h-3" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Risk Score: {selectedStock.risk}/100
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendation Reason */}
              <Card className="bg-white/50 dark:bg-gray-800/50">
                <CardContent className="pt-6">
                  <h4 className="text-lg font-semibold mb-2">Analysis</h4>
                  <p className="text-muted-foreground">{selectedStock.reason}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
