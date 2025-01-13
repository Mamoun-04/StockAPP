import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, BookOpen, MessageCircle, GraduationCap, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Flashcard } from '@/components/ui/flashcard';
import { Loader2 } from 'lucide-react';
import Header from '@/components/ui/header';

interface Lesson {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  topic: string;
  duration?: string;
  content: string;
  xpReward: number;
  order: number;
}

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  lessonId: number;
}

const sampleLessons: Lesson[] = [
  {
    id: 1,
    title: "Introduction to Stock Markets",
    description: "Learn the fundamentals of how stock markets work and basic terminology.",
    difficulty: "Beginner",
    topic: "Stock Basics",
    duration: "15 mins",
    content: `
# Introduction to Stock Markets

## What is a Stock Market?
A stock market is a place where shares of publicly traded companies are bought and sold. Think of it as a marketplace for ownership pieces (shares) of companies.

## Key Concepts

### 1. Stocks
- A stock represents partial ownership in a company
- When you buy a stock, you become a shareholder
- Companies issue stocks to raise money for growth

### 2. Stock Exchanges
- Places where stocks are traded
- Examples: NYSE, NASDAQ
- Provide a regulated environment for trading

### 3. How to Make Money in Stocks
1. Capital Appreciation
   - Buy low, sell high
   - Value increases over time
2. Dividends
   - Regular payments from company profits
   - Not all stocks pay dividends

### 4. Basic Terms
- Bull Market: Market is rising
- Bear Market: Market is falling
- Volume: Number of shares traded
- Market Cap: Total value of a company's shares
`,
    xpReward: 100,
    order: 1
  },
  {
    id: 2,
    title: "Technical Analysis Basics",
    description: "Understanding price charts and basic technical indicators.",
    difficulty: "Intermediate",
    topic: "Technical Analysis",
    duration: "20 mins",
    content: `
# Technical Analysis Basics

## What is Technical Analysis?
Technical analysis is the study of price movements using charts and indicators to predict future price behavior.

## Key Components

### 1. Price Charts
- Line Charts
- Bar Charts
- Candlestick Charts (most popular)
- Volume Bars

### 2. Common Patterns
- Support and Resistance
- Trend Lines
- Chart Patterns (Head & Shoulders, Double Tops)
- Moving Averages

### 3. Popular Indicators
1. Moving Averages (MA)
   - Simple Moving Average (SMA)
   - Exponential Moving Average (EMA)
2. Relative Strength Index (RSI)
3. MACD (Moving Average Convergence Divergence)

### 4. Trading Principles
- The trend is your friend
- Volume confirms price
- Support becomes resistance (and vice versa)
`,
    xpReward: 150,
    order: 2
  },
  {
    id: 3,
    title: "Risk Management Essentials",
    description: "Learn crucial risk management strategies for trading.",
    difficulty: "Advanced",
    topic: "Risk Management",
    duration: "25 mins",
    content: `
# Risk Management Essentials

## Why Risk Management?
Risk management is the most crucial aspect of trading. It's not about avoiding losses completely, but managing them effectively.

## Key Principles

### 1. Position Sizing
- Never risk more than 1-2% per trade
- Calculate position size based on stop loss
- Account for volatility

### 2. Stop Loss Strategies
- Technical stop loss
- Time-based stop loss
- Volatility-based stops (ATR)

### 3. Risk-Reward Ratio
- Minimum 1:2 risk-reward ratio
- Higher probability setups
- Risk adjustment based on win rate

### 4. Portfolio Management
- Diversification
- Correlation between positions
- Sector exposure limits
`,
    xpReward: 200,
    order: 3
  }
];

export default function TradingLessons() {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [_, setLocation] = useLocation();

  // For now, use sample lessons instead of API
  const lessons = sampleLessons;
  const isLoading = false;

  const { data: flashcards = [], isLoading: isLoadingFlashcards } = useQuery<Flashcard[]>({
    queryKey: ['/api/flashcards', selectedLesson?.id],
    enabled: !!selectedLesson,
  });

  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  const topics = ['Stock Basics', 'Technical Analysis', 'Fundamental Analysis', 'Risk Management'];

  const filteredLessons = lessons.filter((lesson) => {
    const difficultyMatch = selectedDifficulty === 'all' || lesson.difficulty === selectedDifficulty;
    const topicMatch = selectedTopic === 'all' || lesson.topic === selectedTopic;
    return difficultyMatch && topicMatch;
  });

  const handleStartLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsLessonOpen(true);
  };

  const handleStartFlashcards = () => {
    setIsLessonOpen(false);
    setIsFlashcardOpen(true);
  };

  const handleFlashcardComplete = () => {
    setIsFlashcardOpen(false);
    setSelectedLesson(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Trading Academy</h1>
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Difficulty</h3>
              <div className="flex gap-2">
                <Badge 
                  className={`cursor-pointer ${selectedDifficulty === 'all' ? 'bg-primary' : 'bg-secondary'}`}
                  onClick={() => setSelectedDifficulty('all')}
                >
                  All
                </Badge>
                {difficulties.map(diff => (
                  <Badge
                    key={diff}
                    className={`cursor-pointer ${selectedDifficulty === diff ? 'bg-primary' : 'bg-secondary'}`}
                    onClick={() => setSelectedDifficulty(diff)}
                  >
                    {diff}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Topics</h3>
              <div className="flex gap-2 flex-wrap">
                <Badge 
                  className={`cursor-pointer ${selectedTopic === 'all' ? 'bg-primary' : 'bg-secondary'}`}
                  onClick={() => setSelectedTopic('all')}
                >
                  All Topics
                </Badge>
                {topics.map(topic => (
                  <Badge
                    key={topic}
                    className={`cursor-pointer ${selectedTopic === topic ? 'bg-primary' : 'bg-secondary'}`}
                    onClick={() => setSelectedTopic(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLessons.map((lesson) => (
              <Card 
                key={lesson.id} 
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{lesson.title}</CardTitle>
                    <Badge variant={
                      lesson.difficulty === 'Beginner' ? 'default' :
                      lesson.difficulty === 'Intermediate' ? 'secondary' : 'destructive'
                    }>
                      {lesson.difficulty}
                    </Badge>
                  </div>
                  <CardDescription>{lesson.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ScrollText className="w-4 h-4" />
                        <span>{lesson.topic}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{lesson.duration || '15 mins'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleStartLesson(lesson)}
                        >
                          <GraduationCap className="w-4 h-4" />
                          Start Lesson
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lesson Content Dialog */}
        <Dialog open={isLessonOpen} onOpenChange={setIsLessonOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedLesson && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedLesson.title}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 prose dark:prose-invert">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: selectedLesson.content
                        .split('\n')
                        .map(line => {
                          if (line.startsWith('# ')) {
                            return `<h1>${line.slice(2)}</h1>`;
                          }
                          if (line.startsWith('## ')) {
                            return `<h2>${line.slice(3)}</h2>`;
                          }
                          if (line.startsWith('### ')) {
                            return `<h3>${line.slice(4)}</h3>`;
                          }
                          if (line.startsWith('- ')) {
                            return `<li>${line.slice(2)}</li>`;
                          }
                          return line;
                        })
                        .join('\n')
                    }} 
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleStartFlashcards}>
                    Practice with Flashcards
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Flashcards Dialog */}
        <Dialog open={isFlashcardOpen} onOpenChange={setIsFlashcardOpen}>
          <DialogContent className="sm:max-w-xl">
            {isLoadingFlashcards ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Flashcard 
                cards={flashcards} 
                onComplete={handleFlashcardComplete} 
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}