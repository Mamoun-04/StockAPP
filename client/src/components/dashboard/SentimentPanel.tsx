import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useAIChat } from "@/hooks/use-ai-chat";
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type SentimentPanelProps = {
  symbol: string;
  className?: string;
};

export default function SentimentPanel({ symbol, className }: SentimentPanelProps) {
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
      <Card className={cn("w-full min-h-[300px]", className)}>
        <CardContent className="pt-6 flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec.toLowerCase()) {
      case 'strong buy':
      case 'buy': return 'text-green-500';
      case 'strong sell':
      case 'sell': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 7) return 'text-green-500';
    if (score >= 4) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment.includes('bullish')) {
      return <TrendingUp className="h-6 w-6 text-green-500" />;
    }
    if (sentiment.includes('bearish')) {
      return <TrendingDown className="h-6 w-6 text-red-500" />;
    }
    return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className={cn("w-full min-h-[300px]", className)}>
      <CardContent className="pt-6 space-y-4">
        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Market Sentiment</h3>
          <div className="flex items-center justify-center gap-2">
            {getSentimentIcon(analysis.sentiment)}
            <span className="text-xl font-semibold capitalize">
              {analysis.sentiment}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Confidence</h3>
            <div className={`text-2xl font-bold ${getConfidenceColor(analysis.confidence)}`}>
              {analysis.confidence}/10
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Risk Level</h3>
            <div className={`text-2xl font-bold capitalize ${getRiskColor(analysis.risk)}`}>
              {analysis.risk}
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Recommendation</h3>
          <div className={`text-2xl font-semibold uppercase ${getRecommendationColor(analysis.recommendation)}`}>
            {analysis.recommendation}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Key Factors</h3>
          <ScrollArea className="h-[120px]">
            <ul className="text-sm space-y-1">
              {analysis.keyFactors.map((factor: string, index: number) => (
                <li key={index} className="text-muted-foreground">• {factor}</li>
              ))}
            </ul>
          </ScrollArea>
        </div>

        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Short-term Outlook</h3>
          <p className="text-sm text-muted-foreground">{analysis.shortTermOutlook}</p>
        </div>
      </CardContent>
    </Card>
  );
}