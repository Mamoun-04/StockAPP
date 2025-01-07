import OpenAI from "openai";
import type { Express } from "express";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function setupOpenAIRoutes(app: Express) {
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { symbol, data } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a financial analyst expert. Analyze the given stock data and provide insights in a beginner-friendly way. Include key metrics explanation, potential risks and opportunities.",
          },
          {
            role: "user",
            content: `Please analyze ${symbol} with the following data: ${JSON.stringify(data)}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      res.json(JSON.parse(response.choices[0].message.content));
    } catch (error) {
      res.status(500).json({ error: error.message });
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

      res.json(JSON.parse(response.choices[0].message.content));
    } catch (error) {
      res.status(500).json({ error: error.message });
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
            content: "You are a helpful financial advisor assistant. Provide clear, beginner-friendly explanations about trading, investing, and financial markets.",
          },
          ...history,
          { role: "user", content: message },
        ],
        response_format: { type: "json_object" },
      });

      res.json(JSON.parse(response.choices[0].message.content));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
