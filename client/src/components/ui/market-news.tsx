import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, ExternalLink } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

type NewsItem = {
  title: string;
  summary: string;
  url: string;
  source: string;
  date: string;
};

export function MarketNews() {
  const { toast } = useToast();
  
  const newsMutation = useMutation({
    mutationFn: async (): Promise<NewsItem[]> => {
      const response = await fetch('/api/news/latest', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Newspaper className="h-6 w-6" />
          Market News
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {newsMutation.data?.map((news, index) => (
            <Card key={index} className="bg-white/50 dark:bg-gray-800/50">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">{news.title}</h3>
                <p className="text-muted-foreground mb-4">{news.summary}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{news.source} • {news.date}</span>
                  <Button variant="ghost" size="sm" onClick={() => window.open(news.url, '_blank')}>
                    Read More <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
