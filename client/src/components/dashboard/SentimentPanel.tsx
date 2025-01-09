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
      <Card className={cn("h-[200px]", className)}>
        <CardContent className="h-full flex items-center justify-center">
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

  return (
    <Card className={cn("h-[200px]", className)}>
      <CardContent className="h-full p-4">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="text-sm">Unable to load market sentiment</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
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
                  {analysis.keyFactors.map((factor: string, index: number) => (
                    <li key={index} className="text-muted-foreground py-0.5">• {factor}</li>
                  ))}
                </ul>
              </div>
            </ScrollArea>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
}