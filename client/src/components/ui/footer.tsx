import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t bg-white dark:bg-gray-900 mt-auto">
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2025 Trading Platform. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link href="/terms">
              <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                Terms
              </span>
            </Link>
            <Link href="/privacy">
              <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                Privacy
              </span>
            </Link>
            <Link href="/contact">
              <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                Contact
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
