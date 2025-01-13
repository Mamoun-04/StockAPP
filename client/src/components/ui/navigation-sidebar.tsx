import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Compass,
  Bell,
  MessageSquare,
  Bookmark,
  Users,
  User,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NavigationSidebar() {
  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
    { icon: Users, label: "Communities", href: "/communities" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-14 z-30 w-64 border-r border-border bg-background">
      <nav className="h-full overflow-y-auto pb-4">
        <div className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start text-base py-2 px-4 font-normal h-auto hover:bg-accent/50"
              >
                <item.icon className="h-5 w-5 mr-3 shrink-0" />
                {item.label}
              </Button>
            </Link>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start text-base py-2 px-4 font-normal h-auto hover:bg-accent/50"
          >
            <MoreHorizontal className="h-5 w-5 mr-3 shrink-0" />
            More
          </Button>
        </div>
      </nav>
    </aside>
  );
}