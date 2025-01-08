import Alpaca from "@alpacahq/alpaca-trade-api";
import type { Express } from "express";

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
  app.get("/api/market/quotes/:symbol", async (req, res) => {
    try {
      if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
        return res.status(400).send("Alpaca API credentials not configured");
      }

      const alpaca = new Alpaca({
        keyId: req.user.alpacaApiKey,
        secretKey: req.user.alpacaSecretKey,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  });

  // New endpoint for historical data
  app.get("/api/market/history/:symbol", async (req, res) => {
    try {
      if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
        return res.status(400).send("Alpaca API credentials not configured");
      }

      const alpaca = new Alpaca({
        keyId: req.user.alpacaApiKey,
        secretKey: req.user.alpacaSecretKey,
        paper: true,
      });

      const { symbol } = req.params;
      const { period = 'day' } = req.query;

      // Calculate start and end times based on period
      const end = new Date();
      let start = new Date();

      switch(period) {
        case 'week':
          start.setDate(end.getDate() - 7);
          break;
        case 'month':
          start.setMonth(end.getMonth() - 1);
          break;
        case 'year':
          start.setFullYear(end.getFullYear() - 1);
          break;
        default: // day
          start.setDate(end.getDate() - 1);
      }

      // Fetch bars with appropriate timeframe
      const timeframe = period === 'day' ? '5Min' : 
                       period === 'week' ? '15Min' : 
                       period === 'month' ? '1Hour' : '1Day';

      const bars = await alpaca.getBarsV2(symbol, {
        start: start.toISOString(),
        end: end.toISOString(),
        timeframe: timeframe,
      });

      const history: Array<{
        timestamp: string;
        price: number;
        volume: number;
      }> = [];

      // Collect all bars
      for await (const bar of bars) {
        history.push({
          timestamp: new Date(bar.Timestamp).toISOString(),
          price: bar.ClosePrice,
          volume: bar.Volume
        });
      }

      res.json(history);
    } catch (error: unknown) {
      console.error('Historical data fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  });

  app.get("/api/market/trades/:symbol", async (req, res) => {
    try {
      if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
        return res.status(400).send("Alpaca API credentials not configured");
      }

      const alpaca = new Alpaca({
        keyId: req.user.alpacaApiKey,
        secretKey: req.user.alpacaSecretKey,
        paper: true,
      });

      const { symbol } = req.params;
      const trades = await alpaca.getLatestTrade(symbol);
      res.json(trades);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/trade", async (req, res) => {
    try {
      if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
        return res.status(400).send("Alpaca API credentials not configured");
      }

      const alpaca = new Alpaca({
        keyId: req.user.alpacaApiKey,
        secretKey: req.user.alpacaSecretKey,
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
      if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
        return res.status(400).send("Alpaca API credentials not configured");
      }

      const alpaca = new Alpaca({
        keyId: req.user.alpacaApiKey,
        secretKey: req.user.alpacaSecretKey,
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
      if (!req.user?.alpacaApiKey || !req.user?.alpacaSecretKey) {
        return res.status(400).send("Alpaca API credentials not configured");
      }

      const alpaca = new Alpaca({
        keyId: req.user.alpacaApiKey,
        secretKey: req.user.alpacaSecretKey,
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