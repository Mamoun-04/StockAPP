import Alpaca from "@alpacahq/alpaca-trade-api";
import type { Express, Request, Response } from "express";

type AlpacaQuote = {
  AskPrice: number;
  BidPrice: number;
  Timestamp: string;
  Volume: number;
};

type AlpacaPosition = {
  symbol: string;
  qty: string;
  market_value: string;
  unrealized_pl: string;
  unrealized_plpc: string;
};

type AlpacaAccount = {
  cash: string;
  portfolio_value: string;
  buying_power: string;
};

// Add type for authenticated request
interface AuthenticatedRequest extends Request {
  user?: Express.User;
}

// Middleware to check authentication
const requireAuth = (req: AuthenticatedRequest, res: Response, next: Function) => {
  if (!req.user?.id) {
    console.log("Authentication failed - no user found in request");
    return res.status(401).json({ error: "You must be logged in to perform this action" });
  }
  next();
};

function createAlpacaClient(apiKey: string, secretKey: string) {
  console.log("Creating Alpaca client with API key:", apiKey.slice(0, 5) + '...');
  try {
    return new Alpaca({
      keyId: apiKey,
      secretKey: secretKey,
      paper: true, // Ensure paper trading is enabled
      baseUrl: "https://paper-api.alpaca.markets", // Explicitly set paper trading URL
      apiVersion: 'v2' // Explicitly set API version
    });
  } catch (error) {
    console.error("Error creating Alpaca client:", error);
    throw error;
  }
}

export function setupAlpacaRoutes(app: Express) {
  console.log("Setting up Alpaca routes...");

  app.get("/api/market/quotes/:symbol", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Fetching quote for symbol:", req.params.symbol);
      if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
        console.log("Missing Alpaca credentials for user:", req.user?.id);
        return res.status(400).json({ error: "Alpaca API credentials not configured" });
      }

      const alpaca = createAlpacaClient(req.user.alpacaApiKey, req.user.alpacaSecretKey);

      const { symbol } = req.params;
      console.log("Making API call to Alpaca for quote...");
      const quote = await alpaca.getLatestQuote(symbol) as unknown as AlpacaQuote;
      console.log("Quote received:", quote);

      res.json({
        symbol,
        price: quote.AskPrice || quote.BidPrice,
        timestamp: quote.Timestamp,
        volume: quote.Volume || 0,
        change: 0,
        changePercent: 0,
      });
    } catch (error: unknown) {
      console.error("Error fetching quote:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  });

  app.get("/api/market/trades/:symbol", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Fetching trades for symbol:", req.params.symbol);
      if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
        console.log("Missing Alpaca credentials for user:", req.user?.id);
        return res.status(400).json({ error: "Alpaca API credentials not configured" });
      }

      const alpaca = createAlpacaClient(req.user.alpacaApiKey, req.user.alpacaSecretKey);

      const { symbol } = req.params;
      console.log("Making API call to Alpaca for trades...");
      const trades = await alpaca.getLatestTrade(symbol);
      console.log("Trades received:", trades);
      res.json(trades);
    } catch (error: unknown) {
      console.error("Error fetching trades:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/trade", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Processing trade request for user:", req.user?.id);
      if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
        console.log("Missing Alpaca credentials for user:", req.user?.id);
        return res.status(400).json({ error: "Alpaca API credentials not configured" });
      }

      const alpaca = createAlpacaClient(req.user.alpacaApiKey, req.user.alpacaSecretKey);

      const { symbol, qty, side, type, timeInForce } = req.body;
      console.log("Creating order:", { symbol, qty, side, type, timeInForce });

      const order = await alpaca.createOrder({
        symbol,
        qty,
        side,
        type,
        time_in_force: timeInForce,
      });

      console.log("Order created:", order);
      res.json(order);
    } catch (error: unknown) {
      console.error("Error creating order:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  });

  app.get("/api/positions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Fetching positions for user:", req.user?.id);
      if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
        console.log("Missing Alpaca credentials for user:", req.user?.id);
        return res.status(400).json({ error: "Alpaca API credentials not configured" });
      }

      const alpaca = createAlpacaClient(req.user.alpacaApiKey, req.user.alpacaSecretKey);

      console.log("Making API call to Alpaca for positions...");
      const positions = await alpaca.getPositions() as unknown as AlpacaPosition[];
      console.log("Positions received:", positions);

      res.json(positions.map(pos => ({
        symbol: pos.symbol,
        qty: parseFloat(pos.qty),
        marketValue: parseFloat(pos.market_value),
        unrealizedPL: parseFloat(pos.unrealized_pl),
        unrealizedPLPercent: parseFloat(pos.unrealized_plpc),
      })));
    } catch (error: unknown) {
      console.error("Error fetching positions:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  });

  app.get("/api/account", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Fetching account info for user:", req.user?.id);
      if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
        console.log("Missing Alpaca credentials for user:", req.user?.id);
        return res.status(400).json({ error: "Alpaca API credentials not configured" });
      }

      const alpaca = createAlpacaClient(req.user.alpacaApiKey, req.user.alpacaSecretKey);

      console.log("Making API call to Alpaca for account info...");
      const account = await alpaca.getAccount() as unknown as AlpacaAccount;
      console.log("Account info received:", {
        cash: account.cash,
        portfolio_value: account.portfolio_value,
        buying_power: account.buying_power,
      });

      res.json({
        cash: parseFloat(account.cash),
        portfolioValue: parseFloat(account.portfolio_value),
        buyingPower: parseFloat(account.buying_power),
      });
    } catch (error: unknown) {
      console.error("Error fetching account:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  });

  console.log("Alpaca routes setup completed");
}