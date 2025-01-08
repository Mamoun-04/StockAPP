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
import { useQuery } from "@tanstack/react-query";
import { useMarketData } from "@/hooks/use-market-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StockChartProps = {
  symbol: string;
};

type Period = 'day' | 'week' | 'month' | 'year';

export default function StockChart({ symbol }: StockChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('day');
  const { quote, isLoading: isQuoteLoading } = useMarketData(symbol);

  // Fetch historical data
  const { data: historicalData, isLoading: isHistoryLoading, error } = useQuery({
    queryKey: ['/api/market/history/' + symbol, { period: selectedPeriod }],
    enabled: !!symbol,
    staleTime: 60000, // Refresh every minute
  });

  if (isQuoteLoading || isHistoryLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Error loading chart</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!quote || !historicalData) {
    return null;
  }

  const priceChange = quote.change;
  const priceChangePercent = quote.changePercent;
  const isPositive = priceChange >= 0;

  // Format dates based on period
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    switch (selectedPeriod) {
      case 'day':
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      case 'week':
        return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' });
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'year':
        return date.toLocaleDateString('en-US', { month: 'short' });
      default:
        return date.toLocaleString();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-4">
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
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as Period)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
                width={80}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                labelFormatter={(label) => formatDate(label)}
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