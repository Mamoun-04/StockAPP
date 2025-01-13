
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import NavigationSidebar from "./navigation-sidebar";

interface HeaderProps {
  showSidebar?: boolean;
}

export function Header({ showSidebar = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {showSidebar && <NavigationSidebar />}
        <nav className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost">Portfolio</Button>
          </Link>
          <Link href="/learn">
            <Button variant="ghost">Study</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">Feed</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
