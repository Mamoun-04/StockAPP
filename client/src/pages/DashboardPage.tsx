import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import StockChart from "@/components/dashboard/StockChart";
import Portfolio from "@/components/dashboard/Portfolio";
import StockSearch from "@/components/dashboard/StockSearch";
import TradePanel from "@/components/dashboard/TradePanel";
import SentimentPanel from "@/components/dashboard/SentimentPanel";
import { useStockRotation } from "@/hooks/use-stock-rotation";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";

export default function DashboardPage() {
  const { user } = useUser();
  const { currentSymbol, isPositionSymbol } = useStockRotation();
  const [selectedSymbol, setSelectedSymbol] = useState(currentSymbol);

  useEffect(() => {
    setSelectedSymbol(currentSymbol);
  }, [currentSymbol]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-6">
            {/* Portfolio Section */}
            <div className="col-span-12 md:col-span-3">
              <Card className="p-4">
                <Portfolio />
              </Card>
            </div>

            {/* Chart and Trade Panel Section */}
            <div className="col-span-12 md:col-span-6">
              <Card className="p-4 mb-6">
                <div className="mb-4">
                  <StockSearch onSelect={setSelectedSymbol} />
                </div>
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    {isPositionSymbol ? (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                        Your Position
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                        Trending
                      </span>
                    )}
                  </div>
                  <div className="h-[400px]">
                    <StockChart symbol={selectedSymbol} />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <TradePanel symbol={selectedSymbol} />
              </Card>
            </div>

            {/* Sentiment Section */}
            <div className="col-span-12 md:col-span-3">
              {selectedSymbol && (
                <SentimentPanel symbol={selectedSymbol} />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}