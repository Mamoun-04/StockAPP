import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Common stocks with their variations and details
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

export interface StockSearchProps {
  value?: string;
  onSelect?: (value: string) => void;
}

export function StockSearch({ value, onSelect }: StockSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Enhanced search function that checks both symbol, name, and variations
  const filteredStocks = React.useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    if (!searchLower) return stocks;

    return stocks.filter((stock) => {
      // Direct symbol match gets highest priority
      if (stock.symbol.toLowerCase() === searchLower) return true;

      // Check name
      if (stock.name.toLowerCase().includes(searchLower)) return true;

      // Check variations
      return stock.variations.some(variation => 
        variation.toLowerCase().includes(searchLower)
      );
    }).sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.symbol.toLowerCase() === searchLower || 
                    a.variations.some(v => v.toLowerCase() === searchLower);
      const bExact = b.symbol.toLowerCase() === searchLower || 
                    b.variations.some(v => v.toLowerCase() === searchLower);

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Secondary sort by symbol length for similar matches
      return a.symbol.length - b.symbol.length;
    });
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {value
            ? stocks.find((stock) => stock.symbol === value)?.symbol
            : "Search stocks..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search stocks..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No stocks found.</CommandEmpty>
          <CommandGroup>
            {filteredStocks.map((stock) => (
              <CommandItem
                key={stock.symbol}
                value={stock.symbol}
                onSelect={(currentValue) => {
                  onSelect?.(currentValue === value ? "" : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === stock.symbol ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{stock.symbol}</span>
                  <span className="text-sm text-muted-foreground">
                    {stock.name} • {stock.sector}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}