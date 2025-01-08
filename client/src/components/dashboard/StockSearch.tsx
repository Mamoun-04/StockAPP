import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type StockSearchProps = {
  onSelect: (symbol: string) => void;
};

export default function StockSearch({ onSelect }: StockSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<
    Array<{ symbol: string; name: string }>
  >([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const response = await fetch(
        `/api/stocks/search?q=${encodeURIComponent(searchTerm)}`,
      );
      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (err) {
      setResults([]);
    }
  };

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setSearchTerm("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="Search by company name or symbol (e.g., Apple or AAPL)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
              <div className="font-medium">{stock.symbol}</div>
              <div className="text-sm text-gray-600">{stock.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
