import { useState } from "react";
import { useAIChat } from "@/hooks/use-ai-chat";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";

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

    try {
      const analysis = await analyze({
        symbol,
        data: {},
      });

      const formattedContent = `
${analysis.summary}

Key Metrics:
• Sentiment: ${analysis.metrics.sentiment.value}
  ${analysis.metrics.sentiment.explanation}
• Momentum: ${analysis.metrics.momentum.value}
  ${analysis.metrics.momentum.explanation}
• Risk: ${analysis.metrics.risk.value}
  ${analysis.metrics.risk.explanation}`;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: formattedContent },
      ]);
    } catch (error) {
      console.error("Analysis error:", error);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        {symbol && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="h-8"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
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
                className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                  message.role === "assistant"
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <pre className="font-sans whitespace-pre-wrap">
                  {message.content}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything about trading..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="h-8"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isChatting || !input.trim()}
            className="h-8 w-8"
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