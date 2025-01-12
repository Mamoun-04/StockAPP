import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

type AIAnalysisProps = {
  symbol: string;
};

export default function AIChat({ symbol }: AIAnalysisProps) {
  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-900 rounded-lg shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold">AI Assistant</h2>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />
          <p className="text-muted-foreground">OpenAI API currently disabled.</p>
        </div>
      </div>
    </div>
  );
}