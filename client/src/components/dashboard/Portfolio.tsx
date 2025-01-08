import { useMarketData } from "@/hooks/use-market-data";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function Portfolio() {
  const { positions, account, isLoading } = useMarketData();

  if (isLoading) {
    return <Skeleton className="w-full h-[300px]" />;
  }

  if (!positions || !account) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Account Overview</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Portfolio Value</p>
            <p className="text-3xl font-bold">
              ${account.portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cash</p>
            <p className="text-3xl font-bold">
              ${account.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Buying Power</p>
            <p className="text-3xl font-bold">
              ${account.buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Positions</h2>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-6">
            {positions.map((position) => {
              const isPositive = position.unrealizedPL >= 0;
              return (
                <div
                  key={position.symbol}
                  className="space-y-1"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="text-xl font-bold">{position.symbol}</p>
                    <p className="text-lg font-semibold">
                      ${position.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">
                      {position.qty} shares
                    </p>
                    <p
                      className={`${
                        isPositive ? "text-green-500" : "text-red-500"
                      } font-medium`}
                    >
                      {isPositive ? "+" : ""}$
                      {position.unrealizedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (
                      {position.unrealizedPLPercent.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}