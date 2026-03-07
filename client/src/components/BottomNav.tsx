import { Home, Search, Sparkles, Bookmark, MapIcon, Globe, MessageCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/browse", icon: Search, label: "Browse" },
    { path: "/online", icon: Globe, label: "Online" },
    { path: "/ai-picks", icon: Sparkles, label: "AI Picks" },
    { path: "/chatbot", icon: MessageCircle, label: "AI Chat", sparkly: true },
    { path: "/map", icon: MapIcon, label: "Map" },
    { path: "/saved", icon: Bookmark, label: "Saved" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card shadow-[0_-1px_0_0_hsl(var(--border)),0_-4px_16px_-4px_rgba(0,0,0,0.08)] z-50">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`button-nav-${item.label.toLowerCase().replace(/ /g, '-')}`}
              className="relative flex flex-col items-center justify-center gap-0.5 px-1.5 py-2 rounded-lg transition-colors min-w-0 flex-1"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {(item as any).sparkly && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 sparkle-pulse" />
                )}
              </div>
              <span
                className={`text-[9px] font-medium transition-colors leading-tight ${isActive ? "text-primary" : "text-muted-foreground"}`}
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
