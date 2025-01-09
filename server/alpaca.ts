import Alpaca from "@alpacahq/alpaca-trade-api";
import type { Express, Request, Response, NextFunction } from "express";
import { type SelectUser } from "@db/schema";

// Add type for authenticated request
interface AuthenticatedRequest extends Request {
  user?: SelectUser;
}

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

export function setupAlpacaRoutes(app: Express) {
  // Middleware to check authentication
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user?.id) {
      console.log("Authentication failed - no user found in request");
      return res.status(401).json({ error: "You must be logged in to perform this action" });
    }
    next();
  };

  // Middleware to check Alpaca credentials
  const checkAlpacaCredentials = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
      return res.status(400).json({ 
        error: "Alpaca API credentials not configured",
        details: "Please ensure your Alpaca API credentials are set in your profile."
      });
    }
    next();
  };

  app.get("/api/market/quotes/:symbol", requireAuth, checkAlpacaCredentials, async (req: AuthenticatedRequest, res) => {
    try {
      const alpaca = new Alpaca({
        keyId: req.user!.alpacaApiKey!,
        secretKey: req.user!.alpacaSecretKey!,
        paper: true,
      });

      const { symbol } = req.params;
      const quote = await alpaca.getLatestQuote(symbol) as unknown as AlpacaQuote;
      res.json({
        symbol,
        price: quote.AskPrice || quote.BidPrice,
        timestamp: quote.Timestamp,
        volume: quote.Volume || 0,
        change: 0,
        changePercent: 0,
      });
    } catch (error: any) {
      console.error('Alpaca API error (quotes):', error);
      res.status(500).json({ 
        error: "Failed to fetch market data",
        details: error.message 
      });
    }
  });

  app.get("/api/market/trades/:symbol", requireAuth, checkAlpacaCredentials, async (req: AuthenticatedRequest, res) => {
    try {
      const alpaca = new Alpaca({
        keyId: req.user!.alpacaApiKey!,
        secretKey: req.user!.alpacaSecretKey!,
        paper: true,
      });

      const { symbol } = req.params;
      const trades = await alpaca.getLatestTrade(symbol);
      res.json(trades);
    } catch (error: any) {
      console.error('Alpaca API error (trades):', error);
      res.status(500).json({ 
        error: "Failed to fetch trade data",
        details: error.message 
      });
    }
  });

  app.post("/api/trade", requireAuth, checkAlpacaCredentials, async (req: AuthenticatedRequest, res) => {
    try {
      const alpaca = new Alpaca({
        keyId: req.user!.alpacaApiKey!,
        secretKey: req.user!.alpacaSecretKey!,
        paper: true,
      });

      const { symbol, qty, side, type, timeInForce } = req.body;

      const order = await alpaca.createOrder({
        symbol,
        qty,
        side,
        type,
        time_in_force: timeInForce,
      });

      res.json(order);
    } catch (error: any) {
      console.error('Alpaca API error (trade):', error);
      res.status(500).json({ 
        error: "Failed to execute trade",
        details: error.message 
      });
    }
  });

  app.get("/api/positions", requireAuth, checkAlpacaCredentials, async (req: AuthenticatedRequest, res) => {
    try {
      const alpaca = new Alpaca({
        keyId: req.user!.alpacaApiKey!,
        secretKey: req.user!.alpacaSecretKey!,
        paper: true,
      });

      const positions = await alpaca.getPositions() as unknown as AlpacaPosition[];
      res.json(positions.map(pos => ({
        symbol: pos.symbol,
        qty: parseFloat(pos.qty),
        marketValue: parseFloat(pos.market_value),
        unrealizedPL: parseFloat(pos.unrealized_pl),
        unrealizedPLPercent: parseFloat(pos.unrealized_plpc),
      })));
    } catch (error: any) {
      console.error('Alpaca API error (positions):', error);
      res.status(500).json({ 
        error: "Failed to fetch positions",
        details: error.message 
      });
    }
  });

  app.get("/api/account", requireAuth, checkAlpacaCredentials, async (req: AuthenticatedRequest, res) => {
    try {
      const alpaca = new Alpaca({
        keyId: req.user!.alpacaApiKey!,
        secretKey: req.user!.alpacaSecretKey!,
        paper: true,
      });

      const account = await alpaca.getAccount() as unknown as AlpacaAccount;
      res.json({
        cash: parseFloat(account.cash),
        portfolioValue: parseFloat(account.portfolio_value),
        buyingPower: parseFloat(account.buying_power),
      });
    } catch (error: any) {
      console.error('Alpaca API error (account):', error);
      res.status(500).json({ 
        error: "Failed to fetch account data",
        details: error.message 
      });
    }
  });
}