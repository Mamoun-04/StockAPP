import OpenAI from "openai";
import type { Express } from "express";
import axios from "axios";
import * as cheerio from "cheerio";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function scrapeFinancialData(symbol: string) {
  try {
    // Fetch from multiple sources for comprehensive analysis
    const [yahooData, seekingAlphaData, marketWatchData] = await Promise.all([
      axios.get(`https://finance.yahoo.com/quote/${symbol}`),
      axios.get(`https://seekingalpha.com/symbol/${symbol}`),
      axios.get(`https://www.marketwatch.com/investing/stock/${symbol}`)
    ]).catch(() => [null, null, null]);

    const data = {
      marketMetrics: {},
      newsHeadlines: [],
      technicalIndicators: [],
      analystOpinions: []
    };

    // Parse Yahoo Finance
    if (yahooData) {
      const $ = cheerio.load(yahooData.data);
      data.marketMetrics = {
        price: $('[data-test="qsp-price"]').first().text(),
        priceChange: $('[data-test="qsp-price-change"]').first().text(),
        volume: $('[data-test="qsp-volume"]').first().text(),
        peRatio: $('[data-test="qsp-pe-ratio"]').first().text(),
      };

      // Get news headlines
      $('h3').each((_, el) => {
        const headline = $(el).text().trim();
        if (headline) data.newsHeadlines.push(headline);
      });
    }

    // Parse Seeking Alpha for analyst opinions
    if (seekingAlphaData) {
      const $ = cheerio.load(seekingAlphaData.data);
      $('.analyst-rating-summary').each((_, el) => {
        data.analystOpinions.push($(el).text().trim());
      });
    }

    // Parse MarketWatch for technical indicators
    if (marketWatchData) {
      const $ = cheerio.load(marketWatchData.data);
      $('.technical-indicator').each((_, el) => {
        data.technicalIndicators.push($(el).text().trim());
      });
    }

    return data;
  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  }
}

export function setupOpenAIRoutes(app: Express) {
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
              - Using bullet points for lists
              - Keeping responses focused and direct
              - Avoiding unnecessary technical jargon

              When explaining concepts:
              1. Start with a clear, one-sentence definition
              2. Use bullet points for key information
              3. Include a simple example if relevant
              4. Keep the total response under 4-5 bullet points

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

  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { symbol } = req.body;

      // Fetch comprehensive market data
      const marketData = await scrapeFinancialData(symbol);
      if (!marketData) {
        throw new Error("Failed to fetch market data");
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert financial analyst. Perform a comprehensive analysis of ${symbol} stock using the following data:

              Market Metrics:
              ${JSON.stringify(marketData.marketMetrics, null, 2)}

              Recent News Headlines:
              ${marketData.newsHeadlines.slice(0, 5).join('\n')}

              Technical Indicators:
              ${marketData.technicalIndicators.join('\n')}

              Analyst Opinions:
              ${marketData.analystOpinions.join('\n')}

              Provide a detailed analysis with:
              1. Overall market sentiment (strongly bullish/bullish/neutral/bearish/strongly bearish)
              2. Confidence score (1-10)
              3. Trading recommendation (strong buy/buy/hold/sell/strong sell)
              4. Risk assessment (low/medium/high)
              5. Short-term outlook (1-3 months)
              6. Key factors influencing the analysis
              7. Potential catalysts to watch

              Format your response as a JSON object with:
              {
                "sentiment": string,
                "confidence": number,
                "recommendation": string,
                "risk": string,
                "shortTermOutlook": string,
                "keyFactors": string[],
                "catalysts": string[],
                "analysis": string
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