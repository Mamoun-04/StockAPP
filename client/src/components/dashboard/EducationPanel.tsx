import { useState } from "react";
import { useAIChat } from "@/hooks/use-ai-chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";

const commonTerms = [
  "P/E Ratio",
  "Market Cap",
  "Dividend Yield",
  "Moving Average",
  "Volume",
  "Beta",
  "EPS",
  "Short Interest",
];

export default function EducationPanel() {
  const [term, setTerm] = useState("");
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const { explain, isExplaining } = useAIChat();

  const handleExplain = async (termToExplain: string) => {
    if (!termToExplain.trim() || explanations[termToExplain]) return;

    try {
      const result = await explain(termToExplain);
      setExplanations((prev) => ({
        ...prev,
        [termToExplain]: result.explanation,
      }));
      setTerm("");
    } catch (error) {
      console.error("Explanation error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learn Trading Terms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a trading term..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleExplain(term)}
            />
            <Button
              onClick={() => handleExplain(term)}
              disabled={isExplaining || !term.trim()}
            >
              {isExplaining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Explain"
              )}
            </Button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <Accordion type="single" collapsible>
              {/* Custom terms */}
              {Object.entries(explanations).map(([term, explanation]) => (
                <AccordionItem key={term} value={term}>
                  <AccordionTrigger>{term}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {explanation}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}

              {/* Common terms */}
              {commonTerms.map((term) => (
                <AccordionItem key={term} value={term}>
                  <AccordionTrigger>{term}</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex justify-between items-center">
                      {explanations[term] ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {explanations[term]}
                        </p>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => handleExplain(term)}
                          disabled={isExplaining}
                        >
                          {isExplaining ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            "Click to explain"
                          )}
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
