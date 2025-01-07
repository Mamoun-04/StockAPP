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

type HistoricalData = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export function useMarketData(symbol?: string, timeframe: string = "1D") {
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
    refetchInterval: 5000
  });

  const historicalData = useQuery({
    queryKey: [`/api/market/history/${symbol}`, symbol, timeframe],
    queryFn: async () => {
      if (!symbol) return null;
      const res = await fetch(`/api/market/history/${symbol}?timeframe=${timeframe}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<HistoricalData[]>;
    },
    enabled: !!symbol,
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
    refetchInterval: 15000
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
    refetchInterval: 15000
  });

  const tradeMutation = useMutation({
    mutationFn: async (order: {
      symbol: string;
      qty: number;
      side: 'buy' | 'sell';
      type: 'market' | 'limit';
      timeInForce: 'day' | 'gtc';
    }) => {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(order)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Placed",
        description: "Your trade order has been successfully placed"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: error.message
      });
    }
  });

  return {
    quote: quote.data,
    historicalData: historicalData.data,
    positions: positions.data,
    account: account.data,
    isLoading: quote.isLoading || positions.isLoading || account.isLoading || historicalData.isLoading,
    error: quote.error || positions.error || account.error || historicalData.error,
    placeTrade: tradeMutation.mutateAsync
  };
}