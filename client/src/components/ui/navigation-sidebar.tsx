import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Compass,
  Bell,
  MessageSquare,
  Bookmark,
  Users,
  Crown,
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
    { icon: Crown, label: "Premium", href: "/premium" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="w-64 border-r h-screen bg-background fixed left-0 top-0 z-40">
      <nav className="pt-16 px-6">
        <div className="space-y-3">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <Button
                variant="ghost"
                className="w-[90%] justify-start text-lg py-4 px-6 font-normal"
              >
                <item.icon className="h-6 w-6 mr-4" />
                {item.label}
              </Button>
            </Link>
          ))}
          <Button
            variant="ghost"
            className="w-[90%] justify-start text-lg py-4 px-6 font-normal"
          >
            <MoreHorizontal className="h-6 w-6 mr-4" />
            More
          </Button>
        </div>
      </nav>
    </div>
  );
}