import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIAdvisor } from "@/components/ui/ai-advisor";
import { MarketNews } from "@/components/ui/market-news";
import { ChevronDown, GraduationCap, Search } from "lucide-react";

export default function TradingTermsPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                Research Tools <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              <DropdownMenuItem className="flex items-center" onSelect={() => window.location.hash = "#market-research"}>
                <Search className="mr-2 h-4 w-4" />
                Stock Analysis
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center" onSelect={() => window.location.hash = "#quizzes"}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Trading Quiz
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Content Area */}
        <div id="main-content">
          {/* Default View - Market News */}
          <MarketNews />
        </div>

        {/* Stock Analysis Section */}
        <div id="market-research" className="mt-8">
          <AIAdvisor />
        </div>

        {/* Quiz Section */}
        <div id="quizzes" className="mt-8">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Trading Quiz</h2>
              {/* Quiz content will be restored here */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}