import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";
import { Card } from "./card";
import { ChevronRight } from "lucide-react";

interface FlashcardProps {
  cards: Array<{
    question: string;
    answer: string;
  }>;
  onComplete: () => void;
}

export function Flashcard({ cards, onComplete }: FlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      onComplete();
    }
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <div 
        className="relative w-full aspect-[2/1] perspective-1000 cursor-pointer" 
        onClick={handleCardClick}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`${currentIndex}-${isFlipped}`}
            initial={{ rotateY: isFlipped ? -180 : 0 }}
            animate={{ rotateY: isFlipped ? 0 : 180 }}
            exit={{ rotateY: isFlipped ? 180 : -180 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ 
              position: 'absolute',
              width: '100%',
              height: '100%',
              transformStyle: "preserve-3d"
            }}
          >
            <Card 
              className={`w-full h-full p-6 flex items-center justify-center text-center
                ${isFlipped ? 'bg-secondary' : 'bg-background'}
                shadow-md transition-shadow duration-300 hover:shadow-lg
                border border-border/50`}
            >
              <div className="max-w-md">
                <p className="text-lg">
                  {isFlipped ? (
                    <span className="font-medium text-primary">{cards[currentIndex].answer}</span>
                  ) : (
                    <span>{cards[currentIndex].question}</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {isFlipped ? "Click to see question" : "Click to see answer"}
                </p>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Card {currentIndex + 1} of {cards.length}
        </div>
        <Button onClick={handleNext} size="sm" className="gap-2">
          {currentIndex === cards.length - 1 ? "Complete" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}