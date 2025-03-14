import { useState, KeyboardEvent, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

// Common stocks from stock-search.tsx
const stocks = [
  { 
    symbol: "AAPL", 
    name: "Apple Inc.", 
    variations: ["apple", "apple inc", "apple computer", "iphone maker"],
    sector: "Technology"
  },
  { 
    symbol: "MSFT", 
    name: "Microsoft Corporation", 
    variations: ["microsoft", "msft", "windows maker", "microsoft corp"],
    sector: "Technology"
  },
  { 
    symbol: "GOOGL", 
    name: "Alphabet Inc.", 
    variations: ["google", "alphabet", "google inc", "alphabet inc"],
    sector: "Technology"
  },
  { 
    symbol: "AMZN", 
    name: "Amazon.com Inc.", 
    variations: ["amazon", "amazon.com", "amazon inc", "aws"],
    sector: "Consumer Cyclical"
  },
  { 
    symbol: "META", 
    name: "Meta Platforms Inc.", 
    variations: ["meta", "facebook", "instagram", "meta platforms", "fb"],
    sector: "Technology"
  },
  { 
    symbol: "TSLA", 
    name: "Tesla Inc.", 
    variations: ["tesla", "tesla motors", "tesla inc", "ev maker"],
    sector: "Automotive"
  },
  { 
    symbol: "NVDA", 
    name: "NVIDIA Corporation", 
    variations: ["nvidia", "nvidia corp", "nvda"],
    sector: "Technology"
  },
  { 
    symbol: "JPM", 
    name: "JPMorgan Chase & Co.", 
    variations: ["jpmorgan", "jp morgan", "chase", "jpm"],
    sector: "Financial Services"
  },
  { 
    symbol: "BAC", 
    name: "Bank of America Corp.", 
    variations: ["bank of america", "bofa", "bac", "bank of america corp"],
    sector: "Financial Services"
  },
  { 
    symbol: "WMT", 
    name: "Walmart Inc.", 
    variations: ["walmart", "wal-mart", "wmt", "walmart stores"],
    sector: "Consumer Defensive"
  },
] as const;

type StockSearchProps = {
  onSelect: (symbol: string) => void;
};

// Levenshtein distance calculation for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) track[0][i] = i;
  for (let j = 0; j <= str2.length; j++) track[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
}

// Calculate similarity score between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0; // Both strings are empty
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
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

    // Process results with fuzzy matching
    const processedResults = stocks.map((stock) => {
      // Calculate similarity scores for both symbol and name
      const symbolScore = calculateSimilarity(searchTerm, stock.symbol);
      const nameScore = calculateSimilarity(searchTerm, stock.name);

      // Additional scoring for variations
      const variationScores = stock.variations.map(v => 
        calculateSimilarity(searchTerm, v)
      );
      const bestVariationScore = Math.max(...variationScores);

      // Additional scoring factors
      const startsWithBonus = (
        stock.symbol.toLowerCase().startsWith(searchTerm.toLowerCase()) ? 0.3 :
        stock.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ? 0.2 : 0
      );

      const exactMatchBonus = (
        stock.symbol.toLowerCase() === searchTerm.toLowerCase() ? 0.5 :
        stock.name.toLowerCase() === searchTerm.toLowerCase() ? 0.4 : 0
      );

      // Weight the scores (symbol matches are considered more important)
      const weightedScore = (
        symbolScore * 0.4 + 
        nameScore * 0.3 + 
        bestVariationScore * 0.3
      ) + startsWithBonus + exactMatchBonus;

      return {
        ...stock,
        score: weightedScore
      };
    });

    // Filter results with a minimum similarity threshold and sort by score
    const filteredResults = processedResults
      .filter((result) => result.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Limit to top 10 results

    setResults(filteredResults);
    setShowResults(filteredResults.length > 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length >= 2) {
      // Debounce the search
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 300);

      // Cleanup timeout on next change
      return () => clearTimeout(timeoutId);
    } else {
      setShowResults(false);
    }
  };

  const handleSelect = (symbol: string) => {
    if (onSelect) {
      onSelect(symbol);
      setSearchTerm("");
      setResults([]);
      setShowResults(false);
    }
  };

  return (
    <div className="relative flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="Search by company name or symbol (e.g., Apple or AAPL)"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button onClick={handleSearch}>
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