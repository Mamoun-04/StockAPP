import { useState, KeyboardEvent, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const stocks = [
  { symbol: "AAPL", name: "Apple Inc.", variations: ["apple", "apple inc", "apple computer", "iphone maker"], sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corporation", variations: ["microsoft", "msft", "windows maker", "microsoft corp"], sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.", variations: ["google", "alphabet", "google inc", "alphabet inc"], sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", variations: ["amazon", "amazon.com", "amazon inc", "aws"], sector: "Consumer Cyclical" },
  { symbol: "META", name: "Meta Platforms Inc.", variations: ["meta", "facebook", "instagram", "meta platforms", "fb"], sector: "Technology" },
  { symbol: "TSLA", name: "Tesla Inc.", variations: ["tesla", "tesla motors", "tesla inc", "ev maker"], sector: "Automotive" },
  { symbol: "NVDA", name: "NVIDIA Corporation", variations: ["nvidia", "nvidia corp", "nvda"], sector: "Technology" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", variations: ["jpmorgan", "jp morgan", "chase", "jpm"], sector: "Financial Services" },
  { symbol: "BAC", name: "Bank of America Corp.", variations: ["bank of america", "bofa", "bac", "bank of america corp"], sector: "Financial Services" },
  { symbol: "WMT", name: "Walmart Inc.", variations: ["walmart", "wal-mart", "wmt", "walmart stores"], sector: "Consumer Defensive" }
] as const;

type StockSearchProps = {
  onSelect: (symbol: string) => void;
};

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  return s2.includes(s1) ? 1 - (s2.indexOf(s1) / s2.length) : 0;
}

export default function StockSearch({ onSelect }: StockSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Array<{ symbol: string; name: string; score: number }>>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const processedResults = stocks.map((stock) => {
      const symbolScore = calculateSimilarity(searchTerm, stock.symbol);
      const nameScore = calculateSimilarity(searchTerm, stock.name);
      const variationScores = stock.variations.map(v => calculateSimilarity(searchTerm, v));
      const bestVariationScore = Math.max(...variationScores);

      const exactMatchBonus = stock.symbol.toLowerCase() === searchTerm.toLowerCase() ? 0.5 : 0;
      const startsWithBonus = stock.symbol.toLowerCase().startsWith(searchTerm.toLowerCase()) ? 0.3 : 0;

      const score = (symbolScore * 0.5 + nameScore * 0.3 + bestVariationScore * 0.2) + exactMatchBonus + startsWithBonus;

      return { ...stock, score };
    });

    const filteredResults = processedResults
      .filter((result) => result.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setResults(filteredResults);
    setShowResults(true);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length >= 1) {
      handleSearch();
    } else {
      setShowResults(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0) {
        handleSelect(results[0].symbol);
      }
    }
  };

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setSearchTerm(symbol);
    setShowResults(false);
  };

  return (
    <div className="relative flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="Search stocks (e.g., AAPL, Apple)"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button onClick={() => handleSearch()}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto z-50">
          {results.map((stock) => (
            <button
              key={stock.symbol}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              onClick={() => handleSelect(stock.symbol)}
            >
              <div className="font-medium">
                {stock.symbol}
                <span className="text-xs text-gray-500 ml-2">
                  Match: {Math.round(stock.score * 100)}%
                </span>
              </div>
              <div className="text-sm text-gray-600">{stock.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}