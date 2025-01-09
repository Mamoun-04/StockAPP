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
      // Use environment variables as fallback
      if (!req.user?.alpacaApiKey && process.env.ALPACA_API_KEY) {
        console.log("Using environment Alpaca API key");
        req.user = {
          ...req.user!,
          alpacaApiKey: process.env.ALPACA_API_KEY
        };
      }

      if (!req.user?.alpacaSecretKey && process.env.ALPACA_SECRET_KEY) {
        console.log("Using environment Alpaca secret key");
        req.user = {
          ...req.user!,
          alpacaSecretKey: process.env.ALPACA_SECRET_KEY
        };
      }

      if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
        console.error("Alpaca credentials missing");
        return res.status(400).json({ 
          error: "Alpaca API credentials not configured" 
        });
      }

      next();
    } catch (error) {
      console.error("Error in checkAlpacaCredentials:", error);
      next(error);
    }
  };

  app.post("/api/trade", requireAuth, checkAlpacaCredentials, async (req: AuthenticatedRequest, res) => {
    try {
      const alpaca = new Alpaca({
        keyId: req.user!.alpacaApiKey!,
        secretKey: req.user!.alpacaSecretKey!,
        paper: true,
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

      res.json(order);
    } catch (error: any) {
      console.error('Error placing trade:', error);
      res.status(500).json({ 
        error: "Failed to place trade",
        details: error.message 
      });
    }
  });

  app.get("/api/market/quotes/:symbol", requireAuth, checkAlpacaCredentials, async (req: AuthenticatedRequest, res) => {
    try {
      console.log(`Fetching quote for symbol: ${req.params.symbol}`);
      const alpaca = new Alpaca({
        keyId: req.user!.alpacaApiKey!,
        secretKey: req.user!.alpacaSecretKey!,
        paper: true,
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
        keyId: req.user!.alpacaApiKey!,
        secretKey: req.user!.alpacaSecretKey!,
        paper: true,
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
        keyId: req.user!.alpacaApiKey!,
        secretKey: req.user!.alpacaSecretKey!,
        paper: true,
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
}