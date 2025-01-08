import { useState, useEffect } from 'react';
import { useMarketData } from './use-market-data';

// Popular/trending stocks to show when user has no positions
const TRENDING_STOCKS = [
  'AAPL',  // Apple
  'MSFT',  // Microsoft
  'GOOGL', // Google
  'AMZN',  // Amazon
  'NVDA',  // NVIDIA
  'META',  // Meta
  'TSLA',  // Tesla
  'AMD',   // AMD
];

export function useStockRotation() {
  const { positions } = useMarketData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSymbol, setCurrentSymbol] = useState<string>('');

  useEffect(() => {
    // Determine which list of stocks to use
    const stockList = positions && positions.length > 0
      ? positions.map(p => p.symbol)
      : TRENDING_STOCKS;

    // Set initial symbol
    setCurrentSymbol(stockList[0]);

    // Setup rotation interval
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % stockList.length;
        setCurrentSymbol(stockList[nextIndex]);
        return nextIndex;
      });
    }, 30000); // Rotate every 30 seconds

    // Cleanup interval on unmount or when positions change
    return () => clearInterval(interval);
  }, [positions]);

  return {
    currentSymbol,
    isPositionSymbol: positions?.some(p => p.symbol === currentSymbol) ?? false,
  };
}
