import { Home, Search, Sparkles, Bookmark, MapIcon, Globe } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/browse", icon: Search, label: "Browse" },
    { path: "/online", icon: Globe, label: "Online" },
    { path: "/ai-picks", icon: Sparkles, label: "AI Picks" },
    { path: "/map", icon: MapIcon, label: "Map" },
    { path: "/saved", icon: Bookmark, label: "Saved" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card shadow-[0_-1px_0_0_hsl(var(--border)),0_-4px_16px_-4px_rgba(0,0,0,0.08)] z-50">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`button-nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className="relative flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg transition-colors min-w-[52px]"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
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
