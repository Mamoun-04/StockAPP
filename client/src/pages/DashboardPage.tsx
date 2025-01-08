import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import StockChart from "@/components/dashboard/StockChart";
import Portfolio from "@/components/dashboard/Portfolio";
import AIChat from "@/components/dashboard/AIChat";
import { StockSearch } from "@/components/ui/stock-search";
import TradePanel from "@/components/dashboard/TradePanel";
import SentimentPanel from "@/components/dashboard/SentimentPanel";
import { useStockRotation } from "@/hooks/use-stock-rotation";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";

export default function DashboardPage() {
  const { user } = useUser();
  const { currentSymbol, isPositionSymbol } = useStockRotation();
  const [selectedSymbol, setSelectedSymbol] = useState(currentSymbol);

  // Update selected symbol when rotation changes
  useEffect(() => {
    setSelectedSymbol(currentSymbol);
  }, [currentSymbol]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6 flex-grow">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Portfolio */}
          <div className="col-span-12 md:col-span-3 space-y-4">
            <Card className="p-4 overflow-visible">
              <div className="space-y-2">
                <Portfolio />
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 md:col-span-6 space-y-6">
            {/* Stock Search and Chart */}
            <Card className="p-4">
              <div className="mb-4">
                <StockSearch 
                  value={selectedSymbol} 
                  onSelect={setSelectedSymbol}
                />
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

            {/* Trade Panel */}
            <Card className="p-4">
              <TradePanel symbol={selectedSymbol} />
            </Card>
          </div>

          {/* Right Sidebar - Sentiment and AI Chat */}
          <div className="col-span-12 md:col-span-3 space-y-4">
            {selectedSymbol && <SentimentPanel symbol={selectedSymbol} />}
            <Card className="p-4 h-full">
              <AIChat symbol={selectedSymbol} />
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}