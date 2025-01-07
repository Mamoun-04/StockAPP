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
import { Check, ChevronsUpDown, TrendingUp, DollarSign, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Enhanced stocks data with logos and metadata
const stocks = [
  { 
    symbol: "AAPL", 
    name: "Apple Inc.", 
    variations: ["apple", "apple inc", "apple computer", "iphone maker"],
    sector: "Technology",
    logo: "https://companieslogo.com/img/orig/AAPL-0b51f0c9.png",
    marketCap: "3.02T",
    priceRange: "170.20 - 240.65",
    avgVolume: "55.22M"
  },
  { 
    symbol: "MSFT", 
    name: "Microsoft Corporation", 
    variations: ["microsoft", "msft", "windows maker", "microsoft corp"],
    sector: "Technology",
    logo: "https://companieslogo.com/img/orig/MSFT-6e6e6e96.png",
    marketCap: "2.95T",
    priceRange: "245.35 - 384.30",
    avgVolume: "26.11M"
  },
  { 
    symbol: "GOOGL", 
    name: "Alphabet Inc.", 
    variations: ["google", "alphabet", "google inc", "alphabet inc"],
    sector: "Technology",
    logo: "https://companieslogo.com/img/orig/GOOGL-0200ca83.png",
    marketCap: "1.89T",
    priceRange: "102.45 - 142.68",
    avgVolume: "28.37M"
  },
  { 
    symbol: "AMZN", 
    name: "Amazon.com Inc.", 
    variations: ["amazon", "amazon.com", "amazon inc", "aws"],
    sector: "Consumer Cyclical",
    logo: "https://companieslogo.com/img/orig/AMZN-e8b65030.png",
    marketCap: "1.68T",
    priceRange: "88.12 - 145.86",
    avgVolume: "49.32M"
  },
  { 
    symbol: "META", 
    name: "Meta Platforms Inc.", 
    variations: ["meta", "facebook", "instagram", "meta platforms", "fb"],
    sector: "Technology",
    logo: "https://companieslogo.com/img/orig/META-4767da84.png",
    marketCap: "968.43B",
    priceRange: "178.65 - 342.92",
    avgVolume: "18.21M"
  },
  { 
    symbol: "TSLA", 
    name: "Tesla Inc.", 
    variations: ["tesla", "tesla motors", "tesla inc", "ev maker"],
    sector: "Automotive",
    logo: "https://companieslogo.com/img/orig/TSLA-6da1e910.png",
    marketCap: "857.34B",
    priceRange: "198.45 - 265.12",
    avgVolume: "108.45M"
  },
  { 
    symbol: "NVDA", 
    name: "NVIDIA Corporation", 
    variations: ["nvidia", "nvidia corp", "nvda"],
    sector: "Technology",
    logo: "https://companieslogo.com/img/orig/NVDA-9a633623.png",
    marketCap: "1.21T",
    priceRange: "345.65 - 505.48",
    avgVolume: "42.18M"
  },
  { 
    symbol: "JPM", 
    name: "JPMorgan Chase & Co.", 
    variations: ["jpmorgan", "jp morgan", "chase", "jpm"],
    sector: "Financial Services",
    logo: "https://companieslogo.com/img/orig/JPM-0c1438e4.png",
    marketCap: "498.76B",
    priceRange: "135.78 - 172.96",
    avgVolume: "8.92M"
  },
  { 
    symbol: "BAC", 
    name: "Bank of America Corp.", 
    variations: ["bank of america", "bofa", "bac", "bank of america corp"],
    sector: "Financial Services",
    logo: "https://companieslogo.com/img/orig/BAC-d77e744d.png",
    marketCap: "271.54B",
    priceRange: "29.48 - 35.12",
    avgVolume: "41.23M"
  },
  { 
    symbol: "WMT", 
    name: "Walmart Inc.", 
    variations: ["walmart", "wal-mart", "wmt", "walmart stores"],
    sector: "Consumer Defensive",
    logo: "https://companieslogo.com/img/orig/WMT-9c16a614.png",
    marketCap: "428.92B",
    priceRange: "145.78 - 165.32",
    avgVolume: "5.84M"
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
          className="w-full justify-between"
        >
          {value ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={stocks.find((stock) => stock.symbol === value)?.logo} />
                <AvatarFallback>{value}</AvatarFallback>
              </Avatar>
              <span>{value}</span>
            </div>
          ) : (
            "Search stocks..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
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
                className="py-3"
              >
                <div className="flex items-start gap-3 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={stock.logo} />
                    <AvatarFallback>{stock.symbol}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stock.symbol}</span>
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === stock.symbol ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stock.marketCap}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stock.name} • {stock.sector}
                    </span>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {stock.priceRange}
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart2 className="h-3 w-3" />
                        {stock.avgVolume}
                      </div>
                    </div>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}