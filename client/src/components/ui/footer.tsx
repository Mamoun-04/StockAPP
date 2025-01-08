import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t bg-white dark:bg-gray-900">
      <div className="max-w-screen-2xl mx-auto px-4 py-2">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-1 md:space-y-0">
          <div className="text-xs text-muted-foreground">
            © 2025 Trading Platform. All rights reserved.
          </div>
          <div className="flex space-x-4">
            <Link href="/terms">
              <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                Terms
              </span>
            </Link>
            <Link href="/privacy">
              <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                Privacy
              </span>
            </Link>
            <Link href="/contact">
              <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                Contact
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}