import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

// Common trading terms with their definitions
const tradingTerms = [
  {
    term: "Bull Market",
    definition: "A market condition where prices are rising or expected to rise.",
    example: "The S&P 500 entered a bull market after rising 20% from its previous low.",
  },
  {
    term: "Bear Market",
    definition: "A market condition where prices are falling or expected to fall.",
    example: "Investors became cautious as the market entered bear territory.",
  },
  {
    term: "Volume",
    definition: "The total number of shares or contracts traded in a security or market during a given period.",
    example: "High trading volume often indicates strong investor interest.",
  },
  {
    term: "Market Order",
    definition: "An order to buy or sell a security immediately at the best available current price.",
    example: "She placed a market order to buy 100 shares of Apple stock.",
  },
  {
    term: "Limit Order",
    definition: "An order to buy or sell a security at a specified price or better.",
    example: "He set a limit order to buy Tesla shares at $150 or lower.",
  },
  // Add more terms as needed
];

export default function TradingTermsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTerms = tradingTerms.filter(
    (term) =>
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Trading Terms Glossary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {filteredTerms.map((term) => (
            <Card key={term.term}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">{term.term}</h3>
                <p className="text-muted-foreground mb-4">{term.definition}</p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Example: </span>
                    {term.example}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
