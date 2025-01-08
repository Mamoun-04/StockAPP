import { useState, KeyboardEvent, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type StockSearchProps = {
  onSelect: (symbol: string) => void;
};

export default function StockSearch({ onSelect }: StockSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Array<{ symbol: string; name: string }>>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      // Create variations of the search term
      const searchVariations = generateSearchVariations(searchTerm);
      let allResults: Array<{ symbol: string; name: string }> = [];

      // Search with each variation
      for (const variation of searchVariations) {
        const response = await fetch(
          `/api/stocks/search?q=${encodeURIComponent(variation)}`
        );
        const data = await response.json();
        allResults = [...allResults, ...data];
      }

      // Remove duplicates
      const uniqueResults = Array.from(
        new Map(allResults.map(stock => [stock.symbol, stock])).values()
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
      console.error('Search error:', err);
      setResults([]);
    }
  };

  const generateSearchVariations = (search: string): string[] => {
    const variations = new Set<string>();
    const searchLower = search.toLowerCase();

    // Add original search term
    variations.add(search);
    variations.add(searchLower);
    variations.add(search.toUpperCase());

    // Add first 4 characters for longer terms
    if (search.length > 4) {
      variations.add(search.substring(0, 4));
    }

    // Handle common company name variations
    if (searchLower.endsWith('le')) {
      variations.add(searchLower.slice(0, -2) + 'l');  // e.g., "apple" -> "appl"
    }
    if (searchLower.endsWith('le ')) {
      variations.add(searchLower.slice(0, -3) + 'l');  // Handle trailing space
    }
    if (searchLower.endsWith('gle')) {
      variations.add(searchLower.slice(0, -3) + 'gl');  // e.g., "google" -> "googl"
    }
    if (searchLower.endsWith('gle ')) {
      variations.add(searchLower.slice(0, -4) + 'gl');  // Handle trailing space
    }

    return Array.from(variations);
  };

  const getRelevanceScore = (stock: { symbol: string; name: string }, search: string): number => {
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

      const symbolWordMatch = new RegExp(`\\b${word}`, 'i').test(stock.symbol);
      const nameWordMatch = new RegExp(`\\b${word}`, 'i').test(stock.name);

      if (symbolWordMatch) score += 40;
      if (nameWordMatch) score += 30;
    }

    return score;
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
              <div className="font-medium">{stock.symbol}</div>
              <div className="text-sm text-gray-600">{stock.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}