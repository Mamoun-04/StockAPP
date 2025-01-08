import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useAIChat } from "@/hooks/use-ai-chat";
import { Loader2 } from "lucide-react";

type SentimentPanelProps = {
  symbol: string;
};

export default function SentimentPanel({ symbol }: SentimentPanelProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const { analyze, isAnalyzing } = useAIChat();

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!symbol) return;
      try {
        const result = await analyze({ symbol, data: {} });
        setAnalysis(result);
      } catch (error) {
        console.error("Analysis error:", error);
      }
    };
    fetchAnalysis();
  }, [symbol, analyze]);

  if (isAnalyzing) {
    return (
      <Card className="w-full mb-4">
        <CardContent className="pt-6 flex justify-center items-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'buy': return 'text-green-500';
      case 'sell': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getRatingColor = (score: number) => {
    if (score >= 7) return 'text-green-500';
    if (score >= 4) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-500';
      case 'bearish': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  return (
    <Card className="w-full mb-4">
      <CardContent className="pt-6 space-y-6">
        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Stock Rating</h3>
          <div className={`text-4xl font-bold ${getRatingColor(analysis.rating)}`}>
            {analysis.rating}/10
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Recommendation</h3>
          <div className={`text-2xl font-semibold uppercase ${getRecommendationColor(analysis.recommendation)}`}>
            {analysis.recommendation}
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Market Sentiment</h3>
          <div className={`text-lg font-medium ${getSentimentColor(analysis.sentiment)}`}>
            {analysis.sentiment}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}