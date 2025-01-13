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
    <div className="w-64 border-r bg-background flex-shrink-0 overflow-y-auto">
      <nav className="pt-16 px-6">
        <div className="space-y-7">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <Button
                variant="ghost"
                className="w-[90%] justify-start text-base py-2 px-6 font-normal h-auto"
              >
                <item.icon className="h-6 w-6 mr-4" />
                {item.label}
              </Button>
            </Link>
          ))}
          <Button
            variant="ghost"
            className="w-[90%] justify-start text-base py-2 px-6 font-normal h-auto"
          >
            <MoreHorizontal className="h-6 w-6 mr-4" />
            More
          </Button>
        </div>
      </nav>
    </div>
  );
}