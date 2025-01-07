import { useState } from "react";
import { useAIChat } from "@/hooks/use-ai-chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        data: {}, // Add relevant data here
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Analysis for ${symbol}:\n\n${analysis.summary}\n\nKey Metrics:\n${Object.entries(
            analysis.metrics
          )
            .map(([key, value]) => `${key}: ${value.value}\n${value.explanation}`)
            .join("\n\n")}`,
        },
      ]);
    } catch (error) {
      console.error("Analysis error:", error);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>AI Assistant</span>
          {symbol && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Analyze {symbol}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "assistant"
                      ? "bg-secondary"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Ask me anything about trading..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isChatting || !input.trim()}
          >
            {isChatting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
