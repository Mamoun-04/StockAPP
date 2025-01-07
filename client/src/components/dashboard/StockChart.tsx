import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ReferenceLine,
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
import { format } from "date-fns";
import React from 'react';

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
  volume: number;
}

export default function StockChart({ symbol }: StockChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1D");
  const [chartType, setChartType] = useState<ChartType>("line");
  const { quote, historicalData, isLoading } = useMarketData(symbol, timeFrame);

  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (!quote || !historicalData) {
    return null;
  }

  // Process historical data for visualization
  const processedData = historicalData.map((item) => ({
    time: format(new Date(item.time), getTimeFormat(timeFrame)),
    price: item.close,
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume,
  }));

  const priceChange = quote.change;
  const priceChangePercent = quote.changePercent;
  const isPositive = priceChange >= 0;

  // Helper function to get time format based on timeframe
  function getTimeFormat(timeframe: TimeFrame): string {
    switch (timeframe) {
      case "1D":
        return "HH:mm";
      case "1W":
        return "EEE HH:mm";
      case "1M":
      case "3M":
        return "MMM dd";
      case "YTD":
      case "1Y":
        return "MMM dd yyyy";
      default:
        return "HH:mm";
    }
  }

  const renderChart = () => {
    if (chartType === "line") {
      return (
        <LineChart data={processedData}>
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
            dataKey="close"
            stroke={isPositive ? "#22c55e" : "#ef4444"}
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      );
    } else {
      // Candlestick chart using Bars
      return (
        <LineChart data={processedData}>
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
          {processedData.map((item, index) => (
            <React.Fragment key={index}>
              {/* High-Low line */}
              <ReferenceLine
                segment={[
                  { x: item.time, y: item.high },
                  { x: item.time, y: item.low },
                ]}
                stroke="#666"
                strokeWidth={1}
              />
              {/* Open-Close bar */}
              <Bar
                dataKey={item.close >= item.open ? "close" : "open"}
                data={[item]}
                fill={item.close >= item.open ? "#22c55e" : "#ef4444"}
                barSize={8}
              />
            </React.Fragment>
          ))}
        </LineChart>
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