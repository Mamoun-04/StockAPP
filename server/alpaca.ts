
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
    if (!req.isAuthenticated()) {
      console.log("Authentication failed - User not authenticated");
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  };

  // Middleware to check Alpaca credentials
  const checkAlpacaCredentials = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
        console.error("Environment Alpaca credentials missing");
        return res.status(400).json({ 
          error: "Alpaca API credentials not configured in environment" 
        });
      }
      next();
    } catch (error) {
      console.error("Error in checkAlpacaCredentials:", error);
      next(error);
    }
  };

  app.get("/api/market/quotes/:symbol", requireAuth, checkAlpacaCredentials, async (req: AuthenticatedRequest, res) => {
    try {
      console.log(`Fetching quote for symbol: ${req.params.symbol}`);
      const alpaca = new Alpaca({
        keyId: process.env.ALPACA_API_KEY!,
        secretKey: process.env.ALPACA_SECRET_KEY!,
        paper: true,
        baseUrl: 'https://paper-api.alpaca.markets'
      });

      const { symbol } = req.params;
      const quote = await alpaca.getLatestQuote(symbol) as unknown as AlpacaQuote;

      const response = {
        symbol,
        price: quote.AskPrice || quote.BidPrice,
        timestamp: quote.Timestamp,
        volume: quote.Volume || 0,
        change: 0,
        changePercent: 0,
      };

      console.log(`Quote fetched successfully for ${symbol}`);
      res.json(response);
    } catch (error: any) {
      console.error('Error fetching quote:', error);
      res.status(500).json({ 
        error: "Failed to fetch market data",
        details: error.message 
      });
    }
  });

  app.get("/api/positions", requireAuth, checkAlpacaCredentials, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Fetching positions");
      const alpaca = new Alpaca({
        keyId: process.env.ALPACA_API_KEY!,
        secretKey: process.env.ALPACA_SECRET_KEY!,
        paper: true,
        baseUrl: 'https://paper-api.alpaca.markets'
      });

      const positions = await alpaca.getPositions() as unknown as AlpacaPosition[];
      console.log(`Successfully fetched ${positions.length} positions`);

      const response = positions.map(pos => ({
        symbol: pos.symbol,
        qty: parseFloat(pos.qty),
        marketValue: parseFloat(pos.market_value),
        unrealizedPL: parseFloat(pos.unrealized_pl),
        unrealizedPLPercent: parseFloat(pos.unrealized_plpc),
      }));

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching positions:', error);
      res.status(500).json({ 
        error: "Failed to fetch positions",
        details: error.message 
      });
    }
  });

  app.get("/api/account", requireAuth, checkAlpacaCredentials, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Fetching account data");
      const alpaca = new Alpaca({
        keyId: process.env.ALPACA_API_KEY!,
        secretKey: process.env.ALPACA_SECRET_KEY!,
        paper: true,
        baseUrl: 'https://paper-api.alpaca.markets'
      });

      const account = await alpaca.getAccount() as unknown as AlpacaAccount;
      console.log("Account data fetched successfully");

      res.json({
        cash: parseFloat(account.cash),
        portfolioValue: parseFloat(account.portfolio_value),
        buyingPower: parseFloat(account.buying_power),
      });
    } catch (error: any) {
      console.error('Error fetching account:', error);
      res.status(500).json({ 
        error: "Failed to fetch account data",
        details: error.message 
      });
    }
  });

  app.post("/api/trade", requireAuth, checkAlpacaCredentials, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Executing trade:", req.body);
      const alpaca = new Alpaca({
        keyId: process.env.ALPACA_API_KEY!,
        secretKey: process.env.ALPACA_SECRET_KEY!,
        paper: true,
        baseUrl: 'https://paper-api.alpaca.markets'
      });

      const { symbol, qty, side, type, timeInForce, limitPrice } = req.body;
      
      const order = await alpaca.createOrder({
        symbol,
        qty,
        side,
        type,
        time_in_force: timeInForce,
        limit_price: type === 'limit' ? limitPrice : undefined
      });

      console.log("Trade executed successfully:", order);
      res.json(order);
    } catch (error: any) {
      console.error('Error executing trade:', error);
      res.status(500).json({ 
        error: "Failed to execute trade",
        details: error.message 
      });
    }
  });
}
