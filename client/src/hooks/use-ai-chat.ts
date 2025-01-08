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
      const response = await res.json();

      // Format the response to be more visually appealing
      const content = response.content;
      let formattedContent = `💡 ${content}`;

      // Format based on question type
      if (message.toLowerCase().includes('what is') || message.toLowerCase().includes('explain')) {
        // Definition format
        formattedContent = content.split('\n').map(line => {
          if (line.includes('**Definition**:')) {
            return `💡 - ${line.replace('**Definition**:', 'Definition:').trim()}`;
          }
          if (line.includes('**Key Information**:')) {
            return `📝 Key Information:${line.split('**Key Information**:')[1]}`;
          }
          if (line.trim().startsWith('-')) {
            return `   ${line.trim().substring(1).trim()}`;
          }
          if (line.includes('**Example**:')) {
            return `📊 Example:${line.split('**Example**:')[1]}`;
          }
          return line;
        }).filter(line => line.trim()).join('\n');
      } else if (content.toLowerCase().includes('pros') || content.toLowerCase().includes('advantages')) {
        // Pros/Advantages format
        formattedContent = content.split('\n').map(line => {
          if (line.trim().startsWith('-')) {
            return `✅ ${line.trim().substring(1).trim()}`;
          }
          return line;
        }).filter(line => line.trim()).join('\n');
      } else if (content.toLowerCase().includes('cons') || content.toLowerCase().includes('risks')) {
        // Cons/Risks format
        formattedContent = content.split('\n').map(line => {
          if (line.trim().startsWith('-')) {
            return `⚠️ ${line.trim().substring(1).trim()}`;
          }
          return line;
        }).filter(line => line.trim()).join('\n');
      } else if (content.toLowerCase().includes('steps') || content.toLowerCase().includes('guide')) {
        // Steps/Guide format
        formattedContent = content.split('\n').map(line => {
          if (line.trim().startsWith('-')) {
            return `📍 ${line.trim().substring(1).trim()}`;
          }
          return line;
        }).filter(line => line.trim()).join('\n');
      }

      return { content: formattedContent };
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