import { Switch, Route } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import TradingTermsPage from "./pages/TradingTermsPage";
import LearningPage from "./pages/LearningPage";
import QuizzesPage from "./pages/QuizzesPage";
import LessonsPage from "./pages/LessonsPage";
import TradingLessons from "./pages/TradingLessons";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import FloatingChat from "@/components/ui/floating-chat";

function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/learn" component={LearningPage} />
        <Route path="/learn/quizzes" component={QuizzesPage} />
        <Route path="/learn/lessons" component={TradingLessons} />
        <Route path="/feed" component={FeedPage} />
        <Route path="/terms" component={TradingTermsPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
      <FloatingChat />
    </>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;