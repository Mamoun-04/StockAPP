import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed right-6 bottom-20 z-50 w-[400px] transform transition-all duration-200 ease-in-out",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        <Card className="border shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">AI Assistant</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Content */}
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />
              <p className="text-muted-foreground">OpenAI API currently disabled.</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
