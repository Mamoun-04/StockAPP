import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type StockSearchProps = {
  onSelect: (symbol: string) => void;
};

export default function StockSearch({ onSelect }: StockSearchProps) {
  const [symbol, setSymbol] = useState("");

  const handleSearch = () => {
    if (symbol.trim()) {
      onSelect(symbol.toUpperCase());
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Enter stock symbol (e.g., AAPL)"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
      />
      <Button onClick={handleSearch}>
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </div>
  );
}
