import { Home, Search, Sparkles, Bookmark, MapIcon } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/browse", icon: Search, label: "Browse" },
    { path: "/ai-picks", icon: Sparkles, label: "AI Picks" },
    { path: "/saved", icon: Bookmark, label: "Saved" },
    { path: "/map", icon: MapIcon, label: "Map" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`button-nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover-elevate active-elevate-2 rounded-md transition-colors min-w-[60px]"
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-xs ${
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
