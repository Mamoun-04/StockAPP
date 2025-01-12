import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";

export default function LessonsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Trading Lessons</h1>
        <p className="text-muted-foreground">
          Learn trading fundamentals through our structured lessons.
        </p>
      </main>
      <Footer />
    </div>
  );
}
