import { useState } from "react";
import { useAIChat } from "@/hooks/use-ai-chat";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, TrendingUp, TrendingDown, AlertTriangle, BarChart2, Clock, AlertCircle } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AIAnalysisProps = {
  symbol: string;
};

export default function AIChat({ symbol }: AIAnalysisProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { chat, analyze, isChatting, isAnalyzing } = useAIChat();

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    try {
      const response = await chat({
        message: input,
        history: messages,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  const handleAnalyze = async () => {
    if (!symbol) return;

    const analysisMessage: Message = { 
      role: "user", 
      content: `Analyze ${symbol} stock` 
    };
    setMessages((prev) => [...prev, analysisMessage]);

    try {
      const analysis = await analyze({
        symbol,
        data: {},
      });

      const getSentimentIcon = (sentiment: string) => {
        if (sentiment.includes('bullish')) return '📈';
        if (sentiment.includes('bearish')) return '📉';
        return '➖';
      };

      const getRiskIcon = (risk: string) => {
        switch(risk.toLowerCase()) {
          case 'low': return '🟢';
          case 'medium': return '🟡';
          case 'high': return '🔴';
          default: return '⚪';
        }
      };

      const formattedContent = `${getSentimentIcon(analysis.sentiment)} Analysis for ${symbol}

🎯 Recommendation: ${analysis.recommendation.toUpperCase()}
📊 Confidence: ${analysis.confidence}/10
${getRiskIcon(analysis.risk)} Risk Level: ${analysis.risk}

Key Insights:
${analysis.keyFactors.slice(0, 3).map(f => `• ${f}`).join('\n')}

Outlook: ${analysis.shortTermOutlook}`;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: formattedContent },
      ]);
    } catch (error) {
      console.error("Analysis error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error while analyzing the stock. Please try again later." },
      ]);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col bg-background">
      <div className="p-4 border-b flex justify-between items-center bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold">AI Assistant</h2>
        </div>
        {symbol && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="h-9 px-4 font-medium"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <BarChart2 className="h-4 w-4 mr-2" />
            )}
            Analyze {symbol}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-3 max-w-[85%] ${
                  message.role === "assistant"
                    ? "bg-card text-card-foreground shadow-sm"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <pre className="font-sans whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white dark:bg-gray-900">
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything about trading..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="h-10"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isChatting || !input.trim()}
            className="h-10 w-10"
          >
            {isChatting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}