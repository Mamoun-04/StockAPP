import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMarketData } from "@/hooks/use-market-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type StockChartProps = {
  symbol: string;
};

export default function StockChart({ symbol }: StockChartProps) {
  const { quote, isLoading } = useMarketData(symbol);
  const [priceHistory, setPriceHistory] = useState<Array<{ time: string; price: number }>>([]);

  useEffect(() => {
    if (quote) {
      setPriceHistory((prev) => {
        const newHistory = [...prev, { time: new Date().toLocaleTimeString(), price: quote.price }];
        if (newHistory.length > 100) {
          return newHistory.slice(-100);
        }
        return newHistory;
      });
    }
  }, [quote]);

  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (!quote) {
    return null;
  }

  const priceChange = quote.change;
  const priceChangePercent = quote.changePercent;
  const isPositive = priceChange >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{symbol}</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl">${quote.price.toFixed(2)}</span>
            <span
              className={`text-sm ${
                isPositive ? "text-green-500" : "text-red-500"
              }`}
            >
              {isPositive ? "+" : ""}
              {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 12 }}
                width={80}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "#22c55e" : "#ef4444"}
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
