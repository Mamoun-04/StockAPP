import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMarketData } from "@/hooks/use-market-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

const tradeSchema = z.object({
  qty: z.number().min(1, "Quantity must be at least 1"),
  type: z.enum(["market", "limit"]),
  timeInForce: z.enum(["day", "gtc"]),
  limitPrice: z.number().optional(),
});

type TradeFormData = z.infer<typeof tradeSchema>;

type TradePanelProps = {
  symbol: string;
};

type TradeDetails = {
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  price: number;
  type: "market" | "limit";
};

export default function TradePanel({ symbol }: TradePanelProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [lastTrade, setLastTrade] = useState<TradeDetails | null>(null);
  const { quote, positions, account, isLoading, placeTrade, isTradePending } = useMarketData(symbol);
  const { toast } = useToast();

  const sharePostMutation = useMutation({
    mutationFn: async (tradeDetails: TradeDetails) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `Just ${tradeDetails.side === 'buy' ? 'bought' : 'sold'} ${tradeDetails.qty} shares of $${tradeDetails.symbol}!`,
          type: 'trade',
          stockSymbol: tradeDetails.symbol,
          tradeType: tradeDetails.type,
          shares: tradeDetails.qty,
          price: tradeDetails.price,
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your trade has been shared to your feed!",
      });
      setShowShareDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      qty: 1,
      type: "market",
      timeInForce: "day"
    }
  });

  const orderType = watch("type");
  const currentPosition = positions?.find(p => p.symbol === symbol);

  const handleShare = () => {
    if (lastTrade) {
      sharePostMutation.mutate(lastTrade);
    }
  };

  const onSubmit = async (data: TradeFormData) => {
    if (!symbol || !quote) return;

    try {
      // Validate buying power for buy orders
      if (side === "buy") {
        const totalCost = data.type === "market" 
          ? quote.price * data.qty 
          : (data.limitPrice || 0) * data.qty;

        if (totalCost > (account?.buyingPower || 0)) {
          toast({
            variant: "destructive",
            title: "Insufficient Buying Power",
            description: `You need $${totalCost.toFixed(2)} but only have $${account?.buyingPower.toFixed(2)} available.`
          });
          return;
        }
      }

      // Validate position size for sell orders
      if (side === "sell") {
        const currentQty = currentPosition?.qty || 0;
        if (data.qty > currentQty) {
          toast({
            variant: "destructive",
            title: "Insufficient Shares",
            description: `You only have ${currentQty} shares available to sell.`
          });
          return;
        }
      }

      const tradeResult = await placeTrade({
        symbol,
        side,
        ...data,
      });

      // Store trade details and show share dialog
      setLastTrade({
        symbol,
        side,
        qty: data.qty,
        price: data.type === "market" ? quote.price : (data.limitPrice || quote.price),
        type: data.type
      });
      setShowShareDialog(true);

      reset();
    } catch (error) {
      console.error("Trade error:", error);
    }
  };

  if (!symbol) {
    return (
      <div className="text-center text-muted-foreground">
        Search for a stock to start trading
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Trade {symbol}</span>
            {currentPosition && (
              <span className="text-sm font-normal text-muted-foreground">
                Current Position: {currentPosition.qty} shares
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={side === "buy" ? "default" : "outline"}
                onClick={() => setSide("buy")}
                className={side === "buy" ? "bg-green-500 hover:bg-green-600" : ""}
              >
                Buy
              </Button>
              <Button
                type="button"
                variant={side === "sell" ? "default" : "outline"}
                onClick={() => setSide("sell")}
                className={side === "sell" ? "bg-red-500 hover:bg-red-600" : ""}
              >
                Sell
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                step="1"
                {...register("qty", { valueAsNumber: true })}
              />
              {errors.qty && (
                <p className="text-sm text-red-500">{errors.qty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Order Type</Label>
              <Select 
                defaultValue="market" 
                onValueChange={(value) => setValue("type", value as "market" | "limit")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {orderType === "limit" && (
              <div className="space-y-2">
                <Label htmlFor="limitPrice">Limit Price</Label>
                <Input
                  id="limitPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register("limitPrice", { valueAsNumber: true })}
                />
                {errors.limitPrice && (
                  <p className="text-sm text-red-500">{errors.limitPrice.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Time In Force</Label>
              <Select 
                defaultValue="day"
                onValueChange={(value) => setValue("timeInForce", value as "day" | "gtc")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time in force" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="gtc">Good Till Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 text-sm">
              {quote && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Current Price:</span>
                  <span>${quote.price.toFixed(2)}</span>
                </div>
              )}
              {account && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Buying Power:</span>
                  <span>${account.buyingPower.toFixed(2)}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !quote || isTradePending}
            >
              {(isLoading || isTradePending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Place {side.toUpperCase()} Order
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Share Trade Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Trade</DialogTitle>
            <DialogDescription>
              Would you like to share this trade with your followers?
            </DialogDescription>
          </DialogHeader>

          {lastTrade && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">${lastTrade.symbol}</span>
                  <span className={lastTrade.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                    {lastTrade.side.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>{lastTrade.qty} shares</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span>${lastTrade.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>${(lastTrade.qty * lastTrade.price).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleShare}
                  disabled={sharePostMutation.isPending}
                >
                  {sharePostMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  Share Trade
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}