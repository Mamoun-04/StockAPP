import type { Express } from "express";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mock news data - in a real app, this would come from a news API
const mockNews = [
  {
    title: "Market Rally Continues as Tech Stocks Lead Gains",
    summary: "Major indices reached new highs today as technology sector stocks continued their upward momentum, driven by positive earnings reports and AI developments.",
    url: "https://example.com/market-rally",
    source: "Market Daily",
    date: "2 hours ago"
  },
  {
    title: "Fed Signals Potential Rate Cuts in Coming Months",
    summary: "Federal Reserve officials indicated they may begin reducing interest rates in the near future as inflation shows signs of cooling.",
    url: "https://example.com/fed-rates",
    source: "Financial Times",
    date: "4 hours ago"
  },
  {
    title: "AI Investments Reshape Trading Landscape",
    summary: "Investment firms are increasingly adopting artificial intelligence tools for market analysis and trading strategies, marking a significant shift in the industry.",
    url: "https://example.com/ai-trading",
    source: "Tech Insider",
    date: "6 hours ago"
  }
];

export function setupNewsRoutes(app: Express) {
  app.get("/api/news/latest", (_req, res) => {
    // In a real application, we would fetch from a news API
    res.json(mockNews);
  });
}
