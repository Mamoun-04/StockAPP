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
      // First try exact symbol match
      const symbolResponse = await fetch(
        `/api/stocks/search?q=${encodeURIComponent(searchTerm.toUpperCase())}`,
      );
      let symbolData = await symbolResponse.json();

      // Then try company name search
      const nameResponse = await fetch(
        `/api/stocks/search?q=${encodeURIComponent(searchTerm.toLowerCase())}`,
      );
      let nameData = await nameResponse.json();

      // Combine results and remove duplicates
      const combinedResults = [...symbolData, ...nameData];
      const uniqueResults = Array.from(
        new Map(combinedResults.map((stock) => [stock.symbol, stock])).values(),
      );

      // Sort results by relevance
      const sortedResults = uniqueResults.sort((a, b) => {
        const aRelevance = getRelevanceScore(a, searchTerm);
        const bRelevance = getRelevanceScore(b, searchTerm);
        return bRelevance - aRelevance;
      });

      setResults(sortedResults);
      setShowResults(true);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    }
  };

  // Calculate relevance score for sorting results
  const getRelevanceScore = (
    stock: { symbol: string; name: string },
    search: string,
  ) => {
    const searchLower = search.toLowerCase();
    const symbolLower = stock.symbol.toLowerCase();
    const nameLower = stock.name.toLowerCase();

    let score = 0;

    // Exact matches get highest priority
    if (symbolLower === searchLower) score += 100;
    if (nameLower === searchLower) score += 90;

    // Starts with search term
    if (symbolLower.startsWith(searchLower)) score += 80;
    if (nameLower.startsWith(searchLower)) score += 70;

    // Contains search term
    if (symbolLower.includes(searchLower)) score += 60;
    if (nameLower.includes(searchLower)) score += 50;

    // Word boundary matches
    const searchWords = searchLower.split(/\s+/);
    for (const word of searchWords) {
      if (word.length < 2) continue;

      const symbolWordMatch = new RegExp(`\\b${word}`, "i").test(stock.symbol);
      const nameWordMatch = new RegExp(`\\b${word}`, "i").test(stock.name);

      if (symbolWordMatch) score += 40;
      if (nameWordMatch) score += 30;
    }

    return score;
  };

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setSearchTerm("");
    setResults([]);
    setShowResults(false);
  };

  // Debounced search
  let searchTimeout: NodeJS.Timeout;
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);

    clearTimeout(searchTimeout);
    if (e.target.value.length >= 2) {
      searchTimeout = setTimeout(() => {
        handleSearch();
      }, 300); // 300ms delay
    } else {
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
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
              <div className="font-medium">{stock.symbol}</div>
              <div className="text-sm text-gray-600">{stock.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
