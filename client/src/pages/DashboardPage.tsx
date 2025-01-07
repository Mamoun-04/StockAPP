import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import StockChart from "@/components/dashboard/StockChart";
import Portfolio from "@/components/dashboard/Portfolio";
import AIChat from "@/components/dashboard/AIChat";
import StockSearch from "@/components/dashboard/StockSearch";
import TradePanel from "@/components/dashboard/TradePanel";
import EducationPanel from "@/components/dashboard/EducationPanel";
import { LogOut } from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useUser();
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Trading for Beginners</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.username}
              </span>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left column */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <Card className="p-6">
              <StockSearch onSelect={setSelectedSymbol} />
              {selectedSymbol && <StockChart symbol={selectedSymbol} />}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <Portfolio />
              </Card>
              <Card className="p-6">
                <TradePanel symbol={selectedSymbol} />
              </Card>
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Card className="p-6">
              <AIChat symbol={selectedSymbol} />
            </Card>
            <Card className="p-6">
              <EducationPanel />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
