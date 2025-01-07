import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
} from "recharts";
import { useMarketData } from "@/hooks/use-market-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StockChartProps = {
  symbol: string;
};

type TimeFrame = "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y";
type ChartType = "line" | "candlestick";

interface PriceData {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  wickHeight?: number;
  bodyHeight?: number;
  isPositive?: boolean;
}

export default function StockChart({ symbol }: StockChartProps) {
  const { quote, isLoading } = useMarketData(symbol);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1D");
  const [chartType, setChartType] = useState<ChartType>("line");

  useEffect(() => {
    if (quote) {
      setPriceHistory((prev) => {
        const newDataPoint: PriceData = {
          time: new Date().toLocaleTimeString(),
          price: quote.price,
          open: quote.price - 1, // Placeholder data for demo
          high: quote.price + 0.5,
          low: quote.price - 1.5,
          close: quote.price,
        };

        // Calculate heights for candlestick visualization
        newDataPoint.wickHeight = newDataPoint.high - newDataPoint.low;
        newDataPoint.bodyHeight = Math.abs(newDataPoint.close - newDataPoint.open);
        newDataPoint.isPositive = newDataPoint.close >= newDataPoint.open;

        const newHistory = [...prev, newDataPoint];
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

  const renderChart = () => {
    if (chartType === "line") {
      return (
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
      );
    } else {
      return (
        <ComposedChart data={priceHistory}>
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
          {/* Candlestick wicks */}
          <Bar
            dataKey="wickHeight"
            fill="none"
            stroke="#666"
            yAxisId={0}
            barSize={2}
          />
          {/* Candlestick bodies */}
          <Area
            type="step"
            dataKey="bodyHeight"
            fill={(data: PriceData) =>
              data.isPositive ? "#22c55e" : "#ef4444"
            }
            stroke="none"
          />
        </ComposedChart>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center justify-between flex-1">
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
          <div className="flex items-center gap-2 ml-4">
            <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="candlestick">Candlestick</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFrame} onValueChange={(value: TimeFrame) => setTimeFrame(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Time Frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1D">1 Day</SelectItem>
                <SelectItem value="1W">1 Week</SelectItem>
                <SelectItem value="1M">1 Month</SelectItem>
                <SelectItem value="3M">3 Months</SelectItem>
                <SelectItem value="YTD">YTD</SelectItem>
                <SelectItem value="1Y">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}