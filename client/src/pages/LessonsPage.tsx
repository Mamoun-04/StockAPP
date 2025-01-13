import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, BookOpen } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Dummy lesson content
const LESSONS_DATA = [
  {
    id: 1,
    title: "Introduction to Stock Market",
    description: "Learn the basics of how the stock market works",
    content: `
      The stock market is a vital part of the global economy where shares of publicly traded companies are bought and sold. Here are the key concepts:

      1. What is a Stock?
      - A stock represents ownership in a company
      - When you buy a stock, you become a shareholder
      - The value of your stock can increase or decrease based on company performance

      2. How the Market Works
      - Stocks are traded on exchanges like NYSE and NASDAQ
      - Prices are determined by supply and demand
      - Trading happens during market hours (9:30 AM - 4:00 PM EST)

      3. Basic Terms
      - Bull Market: When prices are rising
      - Bear Market: When prices are falling
      - Dividend: Payment made to shareholders
      - Market Cap: Total value of a company's shares

      4. Getting Started
      - Open a brokerage account
      - Research companies you're interested in
      - Start with a diversified portfolio
      - Monitor your investments regularly
    `,
    difficulty: "beginner",
    xpReward: 100,
  },
  {
    id: 2,
    title: "Understanding Market Analysis",
    description: "Learn about fundamental and technical analysis",
    content: `
      Market analysis is crucial for making informed investment decisions. There are two main types:

      1. Fundamental Analysis
      - Study of company financials
      - Industry analysis
      - Economic indicators
      - Company management and strategy

      2. Technical Analysis
      - Price charts and patterns
      - Volume indicators
      - Moving averages
      - Trend analysis

      3. Key Metrics
      - P/E Ratio
      - EPS (Earnings Per Share)
      - Book Value
      - Market Cap

      4. Analysis Tools
      - Financial statements
      - Industry reports
      - News and updates
      - Technical charting tools
    `,
    difficulty: "intermediate",
    xpReward: 150,
  },
  {
    id: 3,
    title: "Risk Management Strategies",
    description: "Learn how to protect your investments",
    content: `
      Risk management is essential for successful trading. Here are key strategies:

      1. Diversification
      - Spread investments across different sectors
      - Mix different asset types
      - Geographic diversification
      - Risk/reward balance

      2. Position Sizing
      - Determine appropriate position sizes
      - Use of stop-loss orders
      - Portfolio rebalancing
      - Risk per trade calculation

      3. Risk Assessment
      - Market risk
      - Company-specific risk
      - Economic risk
      - Political risk

      4. Practical Tips
      - Never invest more than you can afford to lose
      - Keep emergency funds separate
      - Regular portfolio review
      - Stay informed about market conditions
    `,
    difficulty: "advanced",
    xpReward: 200,
  },
];

type Lesson = {
  id: number;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  xpReward: number;
};

export default function LessonsPage() {
  const { user } = useUser();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const { data: userProgress = [] } = useQuery({
    queryKey: ['/api/lessons/progress'],
    enabled: !!user?.id,
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Trading Lessons</h1>
        <div className="grid grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Available Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {LESSONS_DATA.map((lesson) => (
                    <Card key={lesson.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{lesson.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {lesson.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge
                            variant="secondary"
                            className={getDifficultyColor(lesson.difficulty)}
                          >
                            {lesson.difficulty}
                          </Badge>
                          <Badge variant="outline">+{lesson.xpReward} XP</Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                onClick={() => setSelectedLesson(lesson)}
                              >
                                <BookOpen className="mr-2 h-4 w-4" />
                                Read Lesson
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>{lesson.title}</DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="mt-4 h-[60vh]">
                                <div className="prose prose-sm dark:prose-invert">
                                  {lesson.content.split('\n').map((paragraph, idx) => (
                                    <p key={idx} className="mb-4">
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}