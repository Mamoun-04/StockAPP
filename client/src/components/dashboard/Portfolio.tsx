import { useMarketData } from "@/hooks/use-market-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
              <p className="text-2xl font-semibold">
                ${account.portfolioValue.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cash</p>
              <p className="text-2xl font-semibold">
                ${account.cash.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Buying Power</p>
              <p className="text-2xl font-semibold">
                ${account.buyingPower.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-4">
              {positions.map((position) => {
                const isPositive = position.unrealizedPL >= 0;
                return (
                  <div
                    key={position.symbol}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{position.symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        {position.qty} shares
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${position.marketValue.toFixed(2)}
                      </p>
                      <p
                        className={`text-sm ${
                          isPositive ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {isPositive ? "+" : ""}$
                        {position.unrealizedPL.toFixed(2)} (
                        {position.unrealizedPLPercent.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
