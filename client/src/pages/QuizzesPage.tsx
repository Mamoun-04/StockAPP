import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";

export default function QuizzesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Trading Quizzes</h1>
        <p className="text-muted-foreground">
          Test your trading knowledge with our comprehensive quizzes.
        </p>
      </main>
      <Footer />
    </div>
  );
}
