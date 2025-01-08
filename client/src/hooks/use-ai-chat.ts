import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type AnalysisResult = {
  summary: string;
  metrics: {
    [key: string]: {
      value: string;
      explanation: string;
    };
  };
  risks: string[];
  opportunities: string[];
};

export function useAIChat() {
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async ({
      symbol,
      data
    }: {
      symbol: string;
      data: any;
    }): Promise<AnalysisResult> => {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ symbol, data })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message
      });
    }
  });

  const explainMutation = useMutation({
    mutationFn: async (term: string) => {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ term })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Explanation Failed",
        description: error.message
      });
    }
  });

  const chatMutation = useMutation({
    mutationFn: async ({
      message,
      history
    }: {
      message: string;
      history: Message[];
    }) => {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message, history })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Chat Failed",
        description: error.message
      });
    }
  });

  return {
    analyze: analyzeMutation.mutateAsync,
    explain: explainMutation.mutateAsync,
    chat: chatMutation.mutateAsync,
    isAnalyzing: analyzeMutation.isPending,
    isExplaining: explainMutation.isPending,
    isChatting: chatMutation.isPending
  };
}