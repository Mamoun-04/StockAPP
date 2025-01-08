import OpenAI from "openai";
import type { Express } from "express";
import axios from "axios";
import * as cheerio from "cheerio";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function scrapeFinancialData(symbol: string) {
  try {
    // Fetch from Yahoo Finance
    const response = await axios.get(`https://finance.yahoo.com/quote/${symbol}`);
    const $ = cheerio.load(response.data);

    // Extract key data points
    const marketPrice = $('[data-test="qsp-price"]').first().text();
    const priceChange = $('[data-test="qsp-price-change"]').first().text();

    // Get news headlines
    const headlines = $('h3')
      .map((_, el) => $(el).text())
      .get()
      .slice(0, 5)
      .join('\n');

    return {
      marketPrice,
      priceChange,
      headlines
    };
  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  }
}

export function setupOpenAIRoutes(app: Express) {
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { symbol } = req.body;

      // Fetch real market data
      const marketData = await scrapeFinancialData(symbol);
      if (!marketData) {
        throw new Error("Failed to fetch market data");
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a financial analyst expert. Analyze ${symbol} stock based on the following real-time data:
              Price: ${marketData.marketPrice}
              Price Change: ${marketData.priceChange}
              Recent Headlines:
              ${marketData.headlines}

              Provide a concise analysis with:
              1. Overall sentiment (bullish/neutral/bearish)
              2. Rating score (1-10)
              3. Trading recommendation (buy/hold/sell)
              4. Key reasons for the recommendation

              Format your response as a JSON object with:
              {
                "sentiment": "bullish" | "neutral" | "bearish",
                "rating": number,
                "recommendation": "buy" | "hold" | "sell",
                "analysis": string,
                "reasons": string[]
              }`,
          },
          {
            role: "user",
            content: `Please analyze ${symbol} stock.`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content in response");
      }

      res.json(JSON.parse(content));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/ai/explain", async (req, res) => {
    try {
      const { term } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a financial education expert. Explain financial terms in a simple, beginner-friendly way with examples.",
          },
          {
            role: "user",
            content: `Please explain the term "${term}" in simple terms with an example.`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content in response");
      }

      res.json(JSON.parse(content));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful financial advisor assistant. Your goal is to help users understand stock market concepts and make informed decisions by:
              - Explaining concepts in simple terms with examples
              - Providing factual market information
              - Never making specific buy/sell recommendations
              - Being concise and clear in your explanations
              Format your response as a JSON object:
              {
                "content": "Your response here"
              }`,
          },
          ...history,
          { role: "user", content: message },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content in response");
      }

      res.json(JSON.parse(content));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/ai/advisor", async (req, res) => {
    try {
      const { question, context } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert trading advisor assistant. Your goal is to help users understand trading concepts by:
            1. Explaining concepts in simple terms
            2. Providing concrete numerical examples (e.g., if explaining profit margins, use a sample company with actual numbers)
            3. Highlighting key risks and considerations
            4. Suggesting next steps for learning
            5. Never making specific buy/sell recommendations

            When explaining terms, always:
            - Start with a one-sentence definition
            - Break down the explanation into bullet points
            - Include a real-world example with numbers as one of the bullet points
            - List common pitfalls or misconceptions as bullet points

            Respond in a JSON format with:
            {
              "advice": string[] (array of bullet points, first item being the definition),
              "risks": string[] (key considerations),
              "nextSteps": string[] (suggested learning steps)
            }`,
          },
          {
            role: "user",
            content: `Question: ${question}\nContext: ${context || 'No additional context provided'}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content in response");
      }

      res.json(JSON.parse(content));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });
}