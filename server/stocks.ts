import type { Express } from "express";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Extended mock database of stock information
const stockDatabase = [
  { 
    symbol: "AAPL", 
    name: "Apple Inc.", 
    description: "Consumer electronics and software company",
    similar: ["MSFT", "GOOGL", "META"],
    sector: "Technology"
  },
  { 
    symbol: "MSFT", 
    name: "Microsoft Corporation", 
    description: "Software and cloud computing company",
    similar: ["AAPL", "GOOGL", "META"],
    sector: "Technology"
  },
  { 
    symbol: "GOOGL", 
    name: "Alphabet Inc.", 
    description: "Internet services and AI technology company",
    similar: ["META", "MSFT", "AMZN"],
    sector: "Technology"
  },
  { 
    symbol: "META", 
    name: "Meta Platforms Inc.", 
    description: "Social media and virtual reality company",
    similar: ["SNAP", "GOOGL", "TWTR"],
    sector: "Technology"
  },
  { 
    symbol: "NVDA", 
    name: "NVIDIA Corporation", 
    description: "Graphics and AI computing company",
    similar: ["AMD", "INTC", "TSM"],
    sector: "Technology"
  },
  { 
    symbol: "AMZN", 
    name: "Amazon.com Inc.", 
    description: "E-commerce and cloud computing company",
    similar: ["BABA", "WMT", "TGT"],
    sector: "Consumer Cyclical"
  },
  { 
    symbol: "TSLA", 
    name: "Tesla Inc.", 
    description: "Electric vehicles and clean energy company",
    similar: ["F", "GM", "NIO"],
    sector: "Automotive"
  },
  { 
    symbol: "AMD", 
    name: "Advanced Micro Devices Inc.", 
    description: "Semiconductor company",
    similar: ["NVDA", "INTC", "TSM"],
    sector: "Technology"
  },
  { 
    symbol: "INTC", 
    name: "Intel Corporation", 
    description: "Semiconductor chip manufacturer",
    similar: ["AMD", "NVDA", "TSM"],
    sector: "Technology"
  },
  { 
    symbol: "F", 
    name: "Ford Motor Company", 
    description: "Automotive manufacturer",
    similar: ["GM", "TSLA", "TM"],
    sector: "Automotive"
  }
];

// Enhanced fuzzy search function
function fuzzySearch(query: string, stocks: typeof stockDatabase) {
  const lowerQuery = query.toLowerCase();
  const matches = stocks.filter(stock => {
    // Check symbol match
    const symbolMatch = stock.symbol.toLowerCase().includes(lowerQuery);
    // Check name match
    const nameMatch = stock.name.toLowerCase().includes(lowerQuery);
    // Check description match
    const descriptionMatch = stock.description.toLowerCase().includes(lowerQuery);
    // Check sector match
    const sectorMatch = stock.sector.toLowerCase().includes(lowerQuery);

    return symbolMatch || nameMatch || descriptionMatch || sectorMatch;
  });

  // Sort results by relevance
  return matches.sort((a, b) => {
    // Exact symbol matches first
    if (a.symbol.toLowerCase() === lowerQuery) return -1;
    if (b.symbol.toLowerCase() === lowerQuery) return 1;

    // Then exact name matches
    if (a.name.toLowerCase() === lowerQuery) return -1;
    if (b.name.toLowerCase() === lowerQuery) return 1;

    // Then partial symbol matches
    if (a.symbol.toLowerCase().includes(lowerQuery) && !b.symbol.toLowerCase().includes(lowerQuery)) return -1;
    if (b.symbol.toLowerCase().includes(lowerQuery) && !a.symbol.toLowerCase().includes(lowerQuery)) return 1;

    return 0;
  });
}

export function setupStockRoutes(app: Express) {
  // Enhanced search endpoint with fuzzy matching and similar stocks
  app.get("/api/stocks/search", (req, res) => {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const results = fuzzySearch(query, stockDatabase);

    // For each result, include similar stocks information
    const enrichedResults = results.map(stock => ({
      ...stock,
      similarStocks: stock.similar.map(symbol => 
        stockDatabase.find(s => s.symbol === symbol)
      ).filter(Boolean)
    }));

    res.json(enrichedResults.slice(0, 5)); // Limit to top 5 results
  });

  // Stock analysis endpoint
  app.get("/api/stocks/analyze/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const stock = stockDatabase.find(s => s.symbol === symbol.toUpperCase());

      if (!stock) {
        return res.status(404).send("Stock not found");
      }

      // Use OpenAI to analyze the stock
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a stock market analyst. Analyze ${stock.name} (${symbol}) and provide:
            1. A sentiment score (0-100)
            2. A risk score (0-100)
            3. A recommendation (Buy/Sell/Hold)
            4. A brief explanation of the recommendation

            Respond in JSON format with these fields:
            {
              "sentiment": number,
              "risk": number,
              "recommendation": "Buy" | "Sell" | "Hold",
              "reason": string
            }`,
          },
          {
            role: "user",
            content: `Analyze ${stock.name} (${symbol})`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content);

      res.json({
        symbol: stock.symbol,
        name: stock.name,
        ...analysis,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}