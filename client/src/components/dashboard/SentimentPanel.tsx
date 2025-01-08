import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

type SentimentPanelProps = {
  symbol: string;
};

export default function SentimentPanel({ symbol }: SentimentPanelProps) {
  // Mock data - to be replaced with ML model later
  const [rating, setRating] = useState(0);
  const [recommendation, setRecommendation] = useState<'buy' | 'sell' | 'hold'>('hold');

  // Simulate random updates for demo
  useEffect(() => {
    setRating(Math.floor(Math.random() * 11)); // 0-10
    setRecommendation(['buy', 'sell', 'hold'][Math.floor(Math.random() * 3)] as 'buy' | 'sell' | 'hold');
  }, [symbol]);

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

  return (
    <Card className="w-full mb-4">
      <CardContent className="pt-6 space-y-6">
        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Stock Rating</h3>
          <div className={`text-4xl font-bold ${getRatingColor(rating)}`}>
            {rating}/10
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Recommendation</h3>
          <div className={`text-2xl font-semibold uppercase ${getRecommendationColor(recommendation)}`}>
            {recommendation}
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Market Sentiment</h3>
          <div className="text-lg font-medium">
            {rating >= 7 ? 'Bullish' : rating >= 4 ? 'Neutral' : 'Bearish'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
