import Alpaca from "@alpacahq/alpaca-trade-api";
import type { Express } from "express";

type AlpacaQuote = {
  AskPrice: number;
  BidPrice: number;
  Timestamp: string;
  Volume: number;
  Change?: number;
  ChangePercent?: number;
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
  app.get("/api/market/quotes/:symbol", async (req, res) => {
    try {
      if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_API_SECRET) {
        return res.status(400).send("Alpaca API credentials not configured");
      }

      const alpaca = new Alpaca({
        keyId: process.env.ALPACA_API_KEY,
        secretKey: process.env.ALPACA_API_SECRET,
        paper: true,
      });

      const { symbol } = req.params;
      const quote = await alpaca.getLatestQuote(symbol) as unknown as AlpacaQuote;

      // Get daily bar for change calculation
      const bars = await alpaca.getBarsV2(symbol, {
        start: new Date(new Date().setHours(0,0,0,0)).toISOString(),
        timeframe: "1Day",
        limit: 1
      });

      const bar = await bars.next();
      const prevClose = bar.value?.OpenPrice || quote.AskPrice;
      const currentPrice = quote.AskPrice || quote.BidPrice;
      const change = currentPrice - prevClose;
      const changePercent = (change / prevClose) * 100;

      res.json({
        symbol,
        price: currentPrice,
        timestamp: quote.Timestamp,
        volume: quote.Volume || 0,
        change,
        changePercent,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/trade", async (req, res) => {
    try {
      if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_API_SECRET) {
        return res.status(400).send("Alpaca API credentials not configured");
      }

      const alpaca = new Alpaca({
        keyId: process.env.ALPACA_API_KEY,
        secretKey: process.env.ALPACA_API_SECRET,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  });

  app.get("/api/positions", async (req, res) => {
    try {
      if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_API_SECRET) {
        return res.status(400).send("Alpaca API credentials not configured");
      }

      const alpaca = new Alpaca({
        keyId: process.env.ALPACA_API_KEY,
        secretKey: process.env.ALPACA_API_SECRET,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  });

  app.get("/api/account", async (req, res) => {
    try {
      if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_API_SECRET) {
        return res.status(400).send("Alpaca API credentials not configured");
      }

      const alpaca = new Alpaca({
        keyId: process.env.ALPACA_API_KEY,
        secretKey: process.env.ALPACA_API_SECRET,
        paper: true,
      });

      const account = await alpaca.getAccount() as unknown as AlpacaAccount;
      res.json({
        cash: parseFloat(account.cash),
        portfolioValue: parseFloat(account.portfolio_value),
        buyingPower: parseFloat(account.buying_power),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  });
}