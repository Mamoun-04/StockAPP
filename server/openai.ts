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
            content: "You are a helpful financial advisor assistant. Provide clear, beginner-friendly explanations about trading, investing, and financial markets.",
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

  // Enhanced AI advisor endpoint
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

            When explaining terms, always include:
            - A clear definition
            - A real-world example with numbers
            - Common pitfalls or misconceptions

            Respond in a JSON format with:
            {
              "advice": string (main explanation with numerical example),
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