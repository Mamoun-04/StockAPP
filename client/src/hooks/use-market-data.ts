import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

type Quote = {
  symbol: string;
  price: number;
  timestamp: string;
  volume: number;
  change: number;
  changePercent: number;
};

type Position = {
  symbol: string;
  qty: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
};

type Account = {
  cash: number;
  portfolioValue: number;
  buyingPower: number;
};

type TradeOrder = {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  timeInForce: 'day' | 'gtc';
  limitPrice?: number;
};

type HistoricalData = {
  time: string;
  price: number;
}[];

export function useMarketData(symbol?: string) {
  const { toast } = useToast();

  const quote = useQuery({
    queryKey: [`/api/market/quotes/${symbol}`, symbol],
    queryFn: async () => {
      if (!symbol) return null;
      const res = await fetch(`/api/market/quotes/${symbol}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Quote>;
    },
    enabled: !!symbol,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const positions = useQuery({
    queryKey: ['/api/positions'],
    queryFn: async () => {
      const res = await fetch('/api/positions', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Position[]>;
    },
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  const account = useQuery({
    queryKey: ['/api/account'],
    queryFn: async () => {
      const res = await fetch('/api/account', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Account>;
    },
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  const tradeMutation = useMutation({
    mutationFn: async (order: TradeOrder) => {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(order)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Order Placed Successfully",
        description: `${variables.side.toUpperCase()} order for ${variables.qty} shares of ${variables.symbol} has been placed.`,
        variant: "default"
      });

      // Invalidate queries to refresh data
      quote.refetch();
      positions.refetch();
      account.refetch();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });

  const fetchHistoricalData = async (symbol: string, timeRange: string) => {
    try {
      // Mock historical data with more realistic price movements
      const now = new Date();
      const mockData: HistoricalData = [];
      let dataPoints = 0;
      let startDate = new Date();

      switch (timeRange) {
        case "1D":
          dataPoints = 24;
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "1W":
          dataPoints = 7;
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "1M":
          dataPoints = 30;
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "3M":
          dataPoints = 90;
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1Y":
          dataPoints = 252; // Trading days in a year
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case "5Y":
          dataPoints = 1260; // Trading days in 5 years
          startDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
          break;
      }

      // Use current quote price as the end point
      const currentPrice = quote.data?.price || 100;
      let lastPrice = currentPrice;

      // Generate more realistic price movements with trend and volatility
      const trend = 0.0001; // Small upward trend
      const volatility = 0.02; // 2% daily volatility

      for (let i = 0; i < dataPoints; i++) {
        const currentDate = new Date(startDate.getTime() + (i * (now.getTime() - startDate.getTime()) / dataPoints));

        // Random walk with drift
        const randomChange = (Math.random() - 0.5) * 2 * volatility;
        const trendChange = trend;
        const totalChange = randomChange + trendChange;

        lastPrice = lastPrice * (1 + totalChange);

        mockData.push({
          time: timeRange === "1D" 
            ? currentDate.toLocaleTimeString() 
            : currentDate.toLocaleDateString(),
          price: lastPrice
        });
      }

      // Ensure the last point matches the current quote
      if (mockData.length > 0 && quote.data) {
        mockData[mockData.length - 1].price = quote.data.price;
      }

      return mockData;
    } catch (error) {
      console.error('Error generating historical data:', error);
      return [];
    }
  };

  return {
    quote: quote.data,
    positions: positions.data,
    account: account.data,
    isLoading: quote.isLoading || positions.isLoading || account.isLoading,
    error: quote.error || positions.error || account.error,
    placeTrade: tradeMutation.mutateAsync,
    isTradePending: tradeMutation.isPending,
    fetchHistoricalData
  };
}