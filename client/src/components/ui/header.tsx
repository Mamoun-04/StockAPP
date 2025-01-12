import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Users, BookOpen, LineChart } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { logout } = useUser();
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location === path;
    }
    // For study dropdown items
    if (path.startsWith('/learn/')) {
      return location === path;
    }
    return location === path;
  };

  return (
    <nav className="border-b bg-white dark:bg-gray-900 fixed top-0 right-0 left-64 z-50 h-16">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">Trading Platform</h1>
            <div className="hidden md:flex space-x-4">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  className={`flex items-center ${isActive('/') ? 'bg-accent' : ''}`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Portfolio
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`flex items-center ${
                      isActive('/learn/quizzes') || isActive('/learn/lessons') ? 'bg-accent' : ''
                    }`}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Study
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/learn/quizzes">
                      <span className={`w-full ${isActive('/learn/quizzes') ? 'bg-accent' : ''}`}>
                        Quizzes
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/learn/lessons">
                      <span className={`w-full ${isActive('/learn/lessons') ? 'bg-accent' : ''}`}>
                        Lessons
                      </span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/feed">
                <Button 
                  variant="ghost" 
                  className={`flex items-center ${isActive('/feed') ? 'bg-accent' : ''}`}
                >
                  <LineChart className="h-4 w-4 mr-2" />
                  Feed
                </Button>
              </Link>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}