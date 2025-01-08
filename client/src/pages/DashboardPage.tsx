import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import StockChart from "@/components/dashboard/StockChart";
import Portfolio from "@/components/dashboard/Portfolio";
import AIChat from "@/components/dashboard/AIChat";
import { StockSearch } from "@/components/ui/stock-search";
import TradePanel from "@/components/dashboard/TradePanel";
import { LogOut, BookOpen, LineChart, Users } from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useUser();
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b bg-white dark:bg-gray-900">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">Trading Platform</h1>
              <div className="hidden md:flex space-x-4">
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
                <Link href="/portfolio">
                  <Button variant="ghost" className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Portfolio
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
          <div className="col-span-12 md:col-span-2 space-y-4">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Positions</h2>
              <div className="space-y-2">
                <Portfolio />
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 md:col-span-7 space-y-6">
            {/* Stock Search and Chart */}
            <Card className="p-4">
              <div className="mb-4">
                <StockSearch value={selectedSymbol} onSelect={setSelectedSymbol} />
              </div>
              {selectedSymbol && <StockChart symbol={selectedSymbol} />}
            </Card>

            {/* Trade Panel */}
            <Card className="p-4">
              <TradePanel symbol={selectedSymbol} />
            </Card>
          </div>

          {/* Right Sidebar - Feed/Chat */}
          <div className="col-span-12 md:col-span-3 space-y-4">
            <Card className="p-4 h-full">
              <h2 className="text-lg font-semibold mb-4">Market Feed</h2>
              <AIChat symbol={selectedSymbol} />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}