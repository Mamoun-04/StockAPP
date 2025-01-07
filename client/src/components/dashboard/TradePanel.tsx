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
import { Loader2 } from "lucide-react";

type TradeFormData = {
  qty: number;
  type: "market" | "limit";
  timeInForce: "day" | "gtc";
};

type TradePanelProps = {
  symbol: string;
};

export default function TradePanel({ symbol }: TradePanelProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const { quote, isLoading, placeTrade, account } = useMarketData(symbol);
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<TradeFormData>();

  const onSubmit = async (data: TradeFormData) => {
    if (!symbol) return;

    try {
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
          {account && (
            <span className="text-sm text-muted-foreground">
              Buying Power: ${account.buyingPower.toLocaleString()}
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
            >
              Buy
            </Button>
            <Button
              type="button"
              variant={side === "sell" ? "default" : "outline"}
              onClick={() => setSide("sell")}
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
              {...register("qty", { 
                required: "Quantity is required",
                min: { value: 1, message: "Minimum quantity is 1" }
              })}
            />
            {errors.qty && (
              <p className="text-sm text-red-500">{errors.qty.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Order Type</Label>
            <Select defaultValue="market" {...register("type")}>
              <SelectTrigger>
                <SelectValue placeholder="Select order type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="limit">Limit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Time In Force</Label>
            <Select defaultValue="day" {...register("timeInForce")}>
              <SelectTrigger>
                <SelectValue placeholder="Select time in force" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="gtc">Good Till Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {quote && (
            <div className="text-sm text-muted-foreground">
              Current Price: ${quote.price.toFixed(2)}
              {account && (
                <div className="mt-1">
                  Estimated Cost: ${(quote.price * Number(watch("qty") || 0)).toFixed(2)}
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !quote}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Place {side.toUpperCase()} Order
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}