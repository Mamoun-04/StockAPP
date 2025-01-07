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
            content: `You are an expert trading and company analyst assistant. Your goal is to help users understand:
            1. Trading concepts and financial terms
            2. Company histories, backgrounds, and achievements
            3. Market trends and industry insights

            For trading concepts:
            - Start with a clear one-sentence definition
            - Break down explanations into bullet points
            - Include numerical examples
            - Highlight key considerations and risks

            For company-related questions:
            - Start with a one-sentence company description
            - Break down the company history into key milestones
            - Include important facts about founders and leadership
            - Highlight the company's main products/services
            - Mention recent developments and market position

            For all responses:
            - Keep explanations simple and beginner-friendly
            - Use bullet points for better readability
            - Avoid technical jargon
            - Include relevant numerical data when available
            - Never make specific buy/sell recommendations

            Respond in a JSON format with:
            {
              "advice": string[] (array of bullet points, first being a clear definition or company description),
              "risks": string[] (key considerations or challenges),
              "nextSteps": string[] (suggested learning steps or areas to explore)
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