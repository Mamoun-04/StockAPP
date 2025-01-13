import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";
import { Card } from "./card";
import { ChevronRight, Clock } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";

interface FlashcardProps {
  cards: Array<{
    id: number;
    question: string;
    answer: string;
  }>;
  onComplete: () => void;
}

export function Flashcard({ cards, onComplete }: FlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const initializeMutation = useMutation({
    mutationFn: async (flashcardId: number) => {
      const res = await fetch(`/api/flashcards/${flashcardId}/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to initialize flashcard');
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, correct }: { id: number; correct: boolean }) => {
      const res = await fetch(`/api/flashcards/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct }),
      });
      if (!res.ok) throw new Error('Failed to record review');
      return res.json();
    },
  });

  const handleNext = async (correct: boolean) => {
    if (!cards[currentIndex]) return;

    try {
      // Initialize progress tracking if needed
      await initializeMutation.mutateAsync(cards[currentIndex].id);
      // Record the review
      await reviewMutation.mutateAsync({
        id: cards[currentIndex].id,
        correct,
      });

      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to process review:', error);
    }
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  if (!cards[currentIndex]) return null;

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
                  {isFlipped ? "How well did you know this?" : "Click to see answer"}
                </p>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Card {currentIndex + 1} of {cards.length}
        </div>

        {isFlipped && (
          <div className="flex gap-2">
            <Button 
              onClick={() => handleNext(false)} 
              variant="outline" 
              size="sm"
              className="text-red-500"
            >
              Again
            </Button>
            <Button 
              onClick={() => handleNext(true)} 
              variant="outline"
              size="sm" 
              className="text-green-500"
            >
              Got it
            </Button>
          </div>
        )}

        {!isFlipped && (
          <Button onClick={handleCardClick} size="sm" className="gap-2">
            Show Answer
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}