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
    <nav className="fixed bottom-0 left-0 right-0 bg-card/98 backdrop-blur-md z-50"
      style={{ boxShadow: "0 -1px 0 0 hsl(var(--border)), 0 -6px 20px -4px rgba(0,0,0,0.06)" }}>
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
              {/* Active pill indicator at top */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all"
                  style={{ width: 28, background: "hsl(var(--primary))" }}
                />
              )}

              {/* Icon wrapper with subtle active bg */}
              <div
                className="relative flex items-center justify-center w-8 h-7 rounded-lg transition-all"
                style={isActive ? { background: "hsl(var(--primary) / 0.1)" } : {}}
              >
                <Icon
                  className="w-5 h-5 transition-colors"
                  style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {(item as any).sparkly && !isActive && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full sparkle-pulse bg-yellow-400"
                  />
                )}
              </div>

              <span
                className="text-[9px] font-semibold transition-colors leading-tight"
                style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
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
