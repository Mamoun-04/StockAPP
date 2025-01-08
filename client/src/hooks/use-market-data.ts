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
        description: error.message
      });
    }
  });

  return {
    quote: quote.data,
    positions: positions.data,
    account: account.data,
    isLoading: quote.isLoading || positions.isLoading || account.isLoading,
    error: quote.error || positions.error || account.error,
    placeTrade: tradeMutation.mutateAsync,
    isTradePending: tradeMutation.isPending
  };
}