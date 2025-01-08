import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import StockChart from "@/components/dashboard/StockChart";
import Portfolio from "@/components/dashboard/Portfolio";
import AIChat from "@/components/dashboard/AIChat";
import { StockSearch } from "@/components/ui/stock-search";
import TradePanel from "@/components/dashboard/TradePanel";
import SentimentPanel from "@/components/dashboard/SentimentPanel";
import { LogOut, Users, BookOpen, LineChart } from "lucide-react";
import { useStockRotation } from "@/hooks/use-stock-rotation";

export default function DashboardPage() {
  const { user, logout } = useUser();
  const { currentSymbol, isPositionSymbol } = useStockRotation();
  const [selectedSymbol, setSelectedSymbol] = useState(currentSymbol);

  // Update selected symbol when rotation changes
  useEffect(() => {
    setSelectedSymbol(currentSymbol);
  }, [currentSymbol]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b bg-white dark:bg-gray-900">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">Trading Platform</h1>
              <div className="hidden md:flex space-x-4">
                <Link href="/portfolio">
                  <Button variant="ghost" className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Portfolio
                  </Button>
                </Link>
                <Link href="/study">
                  <Button variant="ghost" className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Study
                  </Button>
                </Link>
                <Link href="/feed">
                  <Button variant="ghost" className="flex items-center">
                    <LineChart className="h-4 w-4 mr-2" />
                    Feed
                  </Button>
                </Link>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6">
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
    </div>
  );
}