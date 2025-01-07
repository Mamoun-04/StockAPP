import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockIndicators } from "@/components/ui/stock-indicators";
import { AIAdvisor } from "@/components/ui/ai-advisor";
import { LineChart, BookOpen, GraduationCap } from "lucide-react";

export default function TradingTermsPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Market Analysis
            </TabsTrigger>
            <TabsTrigger value="learn" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Trading Terms
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Quiz Center
            </TabsTrigger>
          </TabsList>

          {/* Market Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <AIAdvisor />
          </TabsContent>

          {/* Trading Terms Tab */}
          <TabsContent value="learn">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Trading Terms</h2>
                {/* Trading terms content goes here */}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Quiz Center</h2>
                {/* Quiz content goes here */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}