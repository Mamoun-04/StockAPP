import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { StockIndicators } from "@/components/ui/stock-indicators";

export default function TradingTermsPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Stock Analysis Section */}
        <StockIndicators />
      </div>
    </div>
  );
}