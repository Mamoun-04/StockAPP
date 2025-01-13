import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type SentimentPanelProps = {
  symbol: string;
  className?: string;
};

type MarketAnalysis = {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  recommendation: 'strong buy' | 'buy' | 'hold' | 'sell' | 'strong sell';
  keyFactors: string[];
};

// Dummy data generator based on symbol
const getDummyAnalysis = (symbol: string): MarketAnalysis => {
  // Use symbol to generate consistent but seemingly random data
  const hash = symbol.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);

  const sentiments = ['bullish', 'bearish', 'neutral'] as const;
  const recommendations = ['strong buy', 'buy', 'hold', 'sell', 'strong sell'] as const;

  return {
    sentiment: sentiments[hash % 3],
    confidence: 5 + (hash % 6), // Score between 5-10
    recommendation: recommendations[hash % 5],
    keyFactors: [
      "Strong technical indicators showing potential momentum",
      "Recent market volatility affecting sector performance",
      "Positive analyst coverage and institutional interest",
      "Upcoming earnings report could impact short-term price action"
    ]
  };
};

export default function SentimentPanel({ symbol, className }: SentimentPanelProps) {
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) {
      setLoading(false);
      setAnalysis(null);
      return;
    }

    setLoading(true);
    // Simulate API delay
    const timer = setTimeout(() => {
      setAnalysis(getDummyAnalysis(symbol));
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [symbol]);

  const getRecommendationColor = (rec: string) => {
    switch (rec.toLowerCase()) {
      case 'strong buy':
      case 'buy': return 'text-green-500';
      case 'strong sell':
      case 'sell': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  if (!symbol) {
    return (
      <Card className={cn("h-[250px]", className)}>
        <CardContent className="h-full p-4">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a stock to view sentiment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-[250px]", className)}>
      <CardContent className="h-full p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : analysis ? (
          <div className="flex flex-col h-full">
            <div className="text-center mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Market Sentiment</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                {analysis.sentiment.includes('bullish') ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : analysis.sentiment.includes('bearish') ? (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="text-lg font-semibold capitalize">
                  {analysis.sentiment}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">Confidence</div>
                <div className={cn(
                  "text-lg font-bold mt-1",
                  analysis.confidence >= 7 ? "text-green-500" :
                  analysis.confidence >= 4 ? "text-yellow-500" :
                  "text-red-500"
                )}>
                  {analysis.confidence}/10
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">Signal</div>
                <div className={cn(
                  "text-lg font-semibold mt-1 uppercase",
                  getRecommendationColor(analysis.recommendation)
                )}>
                  {analysis.recommendation}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Key Factors</h3>
                  <ul className="text-sm">
                    {analysis.keyFactors.map((factor, index) => (
                      <li key={index} className="text-muted-foreground py-0.5">• {factor}</li>
                    ))}
                  </ul>
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}