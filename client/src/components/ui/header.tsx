
import NavigationSidebar from "./navigation-sidebar";

interface HeaderProps {
  showSidebar?: boolean;
}

export function Header({ showSidebar = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {showSidebar && <NavigationSidebar />}
      </div>
    </header>
  );
}

export default Header;
