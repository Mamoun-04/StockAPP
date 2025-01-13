import { useState, KeyboardEvent, ChangeEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type Stock = {
  symbol: string;
  name: string;
  class: string;
};

type StockSearchProps = {
  onSelect: (symbol: string) => void;
};

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  return s2.includes(s1) ? 1 : 0;
}

export default function StockSearch({ onSelect }: StockSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [results, setResults] = useState<Array<{ symbol: string; name: string; score: number }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch('/api/market/assets');
        if (!response.ok) throw new Error('Failed to fetch assets');
        const data = await response.json();
        setStocks(data);
      } catch (error) {
        console.error('Error fetching stocks:', error);
      }
    };

    fetchStocks();
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const processedResults = stocks
      .map((stock) => {
        const symbolScore = calculateSimilarity(searchTerm, stock.symbol);
        const nameScore = calculateSimilarity(searchTerm, stock.name);
        return {
          ...stock,
          score: Math.max(symbolScore, nameScore)
        };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setResults(processedResults);
    setShowResults(processedResults.length > 0);
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
    if (value.length >= 1) {
      handleSearch();
    } else {
      setShowResults(false);
    }
  };

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setSearchTerm(symbol);
    setResults([]);
    setShowResults(false);
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