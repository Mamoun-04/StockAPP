import type { Express } from "express";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mock database of stock information for demonstration
const stockDatabase = [
  { 
    symbol: "AAPL", 
    name: "Apple Inc.", 
    description: "Consumer electronics and software company" 
  },
  { 
    symbol: "MSFT", 
    name: "Microsoft Corporation", 
    description: "Software and cloud computing company" 
  },
  { 
    symbol: "GOOGL", 
    name: "Alphabet Inc.", 
    description: "Internet services and AI technology company" 
  },
  { 
    symbol: "META", 
    name: "Meta Platforms Inc.", 
    description: "Social media and virtual reality company" 
  },
  { 
    symbol: "NVDA", 
    name: "NVIDIA Corporation", 
    description: "Graphics and AI computing company" 
  },
];

function fuzzySearch(query: string, stocks: typeof stockDatabase) {
  const lowerQuery = query.toLowerCase();
  return stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(lowerQuery) ||
    stock.name.toLowerCase().includes(lowerQuery) ||
    stock.description.toLowerCase().includes(lowerQuery)
  );
}

export function setupStockRoutes(app: Express) {
  // Search endpoint with fuzzy matching
  app.get("/api/stocks/search", (req, res) => {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const results = fuzzySearch(query, stockDatabase);
    res.json(results);
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
