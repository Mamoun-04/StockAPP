import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMarketData } from "@/hooks/use-market-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

export default function TradePanel({ symbol }: TradePanelProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const { quote, positions, account, isLoading, placeTrade, isTradePending } = useMarketData(symbol);
  const { toast } = useToast();

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

      await placeTrade({
        symbol,
        side,
        ...data,
      });

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
  );
}