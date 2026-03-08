import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Search, Sparkles, Loader2, MapPin, Star, BadgeCheck,
  AlertCircle, UtensilsCrossed, Tag, Car, Film,
  ShoppingBag, Activity, ShoppingCart, Shirt, Cpu, Store, ChevronRight, Zap, Coffee, TrendingUp
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { getBrandColor } from "@/lib/brandLogos";
import { getCategoryImage } from "@/lib/categoryImages";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import DealCard from "@/components/DealCard";
import DealDetailModal from "@/components/DealDetailModal";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import type { Coupon, SavedDeal } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/* ── Category config ──────────────────────────────────────────────── */
const CATEGORY_CONFIG: Record<string, {
  icon: React.ElementType;
  gradient: string;
  image: string;
  filter: string;
}> = {
  "Food & Dining": {
    icon: UtensilsCrossed,
    gradient: "from-orange-500 to-red-500",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=75",
    filter: "Food & Dining",
  },
  "Coffee": {
    icon: Coffee,
    gradient: "from-amber-600 to-yellow-500",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75",
    filter: "Food & Dining",
  },
  "Retail": {
    icon: ShoppingBag,
    gradient: "from-blue-500 to-indigo-600",
    image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&q=75",
    filter: "Retail",
  },
  "Entertainment": {
    icon: Film,
    gradient: "from-purple-500 to-pink-600",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=75",
    filter: "Entertainment",
  },
  "Groceries": {
    icon: ShoppingCart,
    gradient: "from-lime-500 to-green-600",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=75",
    filter: "Groceries",
  },
  "Local Deals": {
    icon: Store,
    gradient: "from-teal-500 to-emerald-600",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=75",
    filter: "Local Business",
  },
  "Automotive": {
    icon: Car,
    gradient: "from-gray-600 to-gray-800",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=75",
    filter: "Automotive",
  },
  "Health": {
    icon: Activity,
    gradient: "from-green-500 to-teal-500",
    image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&q=75",
    filter: "Health",
  },
  "Fashion": {
    icon: Shirt,
    gradient: "from-pink-500 to-rose-600",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75",
    filter: "Fashion",
  },
  "Electronics": {
    icon: Cpu,
    gradient: "from-sky-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&q=75",
    filter: "Electronics",
  },
};

/* ── Compact horizontal deal card ───────────────────────────────────── */
interface CompactDealCardProps {
  deal: Coupon & { distance?: number };
  isSaved: boolean;
  onSave: () => void;
  onClick: () => void;
}

function CompactDealCard({ deal, isSaved, onSave, onClick }: CompactDealCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const code = (deal as any).code;
  const isCurated = (deal as any).isCurated;
  const isVerified = (deal as any).isVerified;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Code copied!", description: `${code} copied to clipboard` });
    setTimeout(() => setCopied(false), 2000);
  };

  const expiryLabel = (() => {
    if (!deal.expirationDate) return null;
    const d = typeof deal.expirationDate === "string" ? new Date(deal.expirationDate) : deal.expirationDate;
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (days < 0) return "Expired";
    if (days === 0) return "Today";
    if (days === 1) return "1 day left";
    return `${days}d left`;
  })();

  return (
    <div
      data-testid={`card-deal-${deal.id}`}
      onClick={onClick}
      className="flex-shrink-0 w-52 rounded-2xl overflow-hidden cursor-pointer bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      {/* Brand image header */}
      <div className="relative h-28 overflow-hidden" style={{ background: getBrandColor(deal.storeName) }}>
        <BrandLogo
          storeName={deal.storeName}
          storeLogoUrl={deal.storeLogoUrl ?? undefined}
          categoryFallbackImage={getCategoryImage(deal.category)}
          fill
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        {/* Discount badge */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-extrabold text-white"
          style={{ background: "hsl(var(--primary) / 0.85)", backdropFilter: "blur(4px)" }}>
          {deal.discountAmount}
        </div>

        {/* Save button */}
        <button
          data-testid={`button-save-${deal.id}`}
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${isSaved ? "fill-white stroke-white" : "fill-none stroke-white"}`} strokeWidth={2}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Verified badge */}
        {isCurated && isVerified && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold">
            <BadgeCheck className="w-2.5 h-2.5" />
            Verified
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="font-bold text-xs text-foreground truncate mb-1">{deal.storeName}</p>
        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 leading-snug">{deal.title}</p>

        <div className="flex items-center justify-between gap-1">
          {expiryLabel && (
            <span className="text-[10px] text-muted-foreground">{expiryLabel}</span>
          )}
          {code ? (
            <button
              data-testid={`button-copy-code-${deal.id}`}
              onClick={handleCopy}
              className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors text-white"
              style={{ background: copied ? "hsl(164 60% 36%)" : "hsl(var(--accent))" }}
            >
              {copied ? "Copied!" : `${code}`}
            </button>
          ) : (
            <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
              View Deal
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Horizontal section ──────────────────────────────────────────────── */
interface HorizontalSectionProps {
  title: string;
  icon: React.ElementType;
  deals: (Coupon & { distance?: number })[];
  savedDealIds: Set<string>;
  onSave: (deal: any) => void;
  onView: (deal: Coupon) => void;
  onViewAll: () => void;
  isLoading?: boolean;
}

function HorizontalSection({ title, icon: Icon, deals, savedDealIds, onSave, onView, onViewAll, isLoading }: HorizontalSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isLoading && deals.length === 0) return null;

  return (
    <div className="mb-7 animate-fade-in">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--primary) / 0.12)" }}>
            <Icon className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h2 className="text-sm font-bold">{title}</h2>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-xs font-semibold"
          style={{ color: "hsl(var(--primary))" }}
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1"
      >
        {isLoading
          ? [1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-52 h-44 rounded-2xl bg-muted animate-pulse" />
          ))
          : deals.slice(0, 8).map((deal) => (
            <CompactDealCard
              key={deal.id}
              deal={deal}
              isSaved={savedDealIds.has(deal.id)}
              onSave={() => onSave(deal)}
              onClick={() => onView(deal)}
            />
          ))
        }
      </div>
    </div>
  );
}

/* ── GeocodedLocation type ──────────────────────────────────────────── */
interface GeocodedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  boundingBox?: [number, number, number, number];
}

/* ── Main page ───────────────────────────────────────────────────────── */
export default function HomePage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeal, setSelectedDeal] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const [zipCode, setZipCode] = useState("");
  const [searchedZip, setSearchedZip] = useState("");
  const [geoLocation, setGeoLocation] = useState<GeocodedLocation | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    const savedZip = localStorage.getItem("couponai_zip");
    const savedLocationStr = localStorage.getItem("couponai_location");
    if (savedZip) { setZipCode(savedZip); setSearchedZip(savedZip); }
    if (savedLocationStr) {
      try { setGeoLocation(JSON.parse(savedLocationStr)); } catch {}
    }
  }, []);

  const { data: savedDeals = [] } = useQuery<SavedDeal[]>({ queryKey: ["/api/saved-deals"] });

  const nearbyDealsQuery = useQuery<(Coupon & { distance: number })[]>({
    queryKey: geoLocation && searchedZip
      ? [`/api/coupons/nearby?latitude=${geoLocation.latitude}&longitude=${geoLocation.longitude}&radius=10&zipCode=${encodeURIComponent(searchedZip)}`]
      : ["/api/coupons/nearby"],
    enabled: !!geoLocation && !!searchedZip,
  });

  const recommendedSpotQuery = useQuery<{
    recommended: (Coupon & { distance: number }) | null;
    score: number; reason: string; totalDealsAnalyzed: number;
  }>({
    queryKey: geoLocation && searchedZip
      ? [`/api/coupons/recommended-spot?latitude=${geoLocation.latitude}&longitude=${geoLocation.longitude}&radius=10&zipCode=${encodeURIComponent(searchedZip)}`]
      : ["/api/coupons/recommended-spot"],
    enabled: !!geoLocation && !!searchedZip,
  });

  const rawDeals = nearbyDealsQuery.data || [];
  const savedDealIds = new Set(savedDeals.map((sd) => sd.couponId));

  /* de-duplicate by code+store */
  const allDeals = rawDeals.filter((deal, idx, arr) => {
    const code = (deal as any).code || "";
    const brand = deal.storeName.toLowerCase();
    return arr.findIndex(d => ((d as any).code || "") === code && d.storeName.toLowerCase() === brand) === idx;
  });

  /* search filter */
  const filtered = searchQuery.trim()
    ? allDeals.filter(d => {
        const q = searchQuery.toLowerCase();
        return d.storeName.toLowerCase().includes(q) || d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
      })
    : allDeals;

  /* category buckets */
  const foodDeals   = filtered.filter(d => d.category === "Food & Dining");
  const retailDeals = filtered.filter(d => d.category === "Retail");
  const autoDeals   = filtered.filter(d => d.category === "Automotive");
  const entDeals    = filtered.filter(d => d.category === "Entertainment");
  const localDeals  = filtered.filter(d => (d as any).isLocalBusiness);
  const trendingDeals = filtered.filter(d => d.isTrending || (d as any).isTrending === 1);
  const verifiedDeals = filtered.filter(d => (d as any).isCurated && (d as any).isVerified);

  const recommendedSpot = recommendedSpotQuery.data?.recommended;

  const handleSave = async (deal: any) => {
    const isSaved = savedDealIds.has(deal.id);
    try {
      if (isSaved) {
        await apiRequest("DELETE", `/api/saved-deals/${deal.id}`, undefined);
      } else {
        await apiRequest("POST", "/api/saved-deals", {
          couponId: deal.id, storeName: deal.storeName, storeLogoUrl: deal.storeLogoUrl,
          discountAmount: deal.discountAmount, title: deal.title, description: deal.description,
          code: deal.code, category: deal.category, expirationDate: deal.expirationDate || deal.expiresAt,
          claimCount: deal.claimCount, isTrending: deal.isTrending || deal.trending,
          isVerified: deal.isVerified, isCurated: deal.isCurated, requiresApp: deal.requiresApp,
          latitude: deal.latitude, longitude: deal.longitude, distance: deal.distance,
          source: deal.source, terms: deal.terms || deal.termsAndConditions, storeType: deal.storeType,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/saved-deals"] });
      toast({ title: isSaved ? "Deal removed" : "Deal saved!", description: isSaved ? "Removed from saved deals" : "Added to your saved deals" });
    } catch {
      toast({ title: "Error", description: "Failed to update saved deals", variant: "destructive" });
    }
  };

  const handleZipSearch = async () => {
    if (!zipCode.trim()) { toast({ title: "Error", description: "Please enter a ZIP code", variant: "destructive" }); return; }
    setIsGeocoding(true);
    try {
      const resp = await fetch(`/api/geocode/zipcode?zipcode=${encodeURIComponent(zipCode)}`, { credentials: "include" });
      if (!resp.ok) throw { status: resp.status };
      const data: GeocodedLocation = await resp.json();
      localStorage.setItem("couponai_zip", zipCode);
      localStorage.setItem("couponai_location", JSON.stringify(data));
      setSearchedZip(zipCode);
      setGeoLocation(data);
      toast({ title: "Location found!", description: `Showing deals near ${data.city || data.displayName}` });
    } catch (err: any) {
      toast({ title: err?.status === 404 ? "ZIP code not found" : "Error", description: "Please check the ZIP code and try again", variant: "destructive" });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleZipSearch(); };
  const goToBrowse = () => setLocation("/browse");
  const isLoading = nearbyDealsQuery.isLoading;

  const browseCats = [
    "Food & Dining", "Retail", "Coffee", "Entertainment",
    "Groceries", "Local Deals", "Automotive", "Health",
  ];

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── Sticky header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--primary))" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight" style={{ color: "hsl(var(--primary))" }}>
              CouponAI
            </span>
          </div>

          <div className="flex-1 max-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <Input
              data-testid="input-search-header"
              type="search"
              placeholder="Search deals…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-full bg-secondary border-0 text-sm"
            />
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(214 80% 22%) 0%, hsl(214 70% 34%) 50%, hsl(164 60% 34%) 100%)" }}>
        {/* decorative orbs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-15"
          style={{ background: "hsl(164 60% 60%)" }} />
        <div className="absolute bottom-0 -left-12 w-40 h-40 rounded-full opacity-10"
          style={{ background: "hsl(214 80% 60%)" }} />

        <div className="relative z-10 max-w-3xl mx-auto px-4 pt-10 pb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white font-display leading-tight tracking-tight mb-2">
            Discover Deals <span style={{ color: "hsl(164 70% 70%)" }}>Near You</span>
          </h1>
          <p className="text-white/70 text-sm md:text-base mb-7 max-w-xs mx-auto">
            AI-powered coupons from real local businesses
          </p>

          {/* ZIP search */}
          <div className="max-w-sm mx-auto">
            <div className="flex gap-2 rounded-full p-1.5 border border-white/20"
              style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4 pointer-events-none" />
                <input
                  data-testid="input-home-zipcode"
                  type="text"
                  placeholder="Enter ZIP code…"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isGeocoding}
                  className="w-full bg-transparent pl-9 pr-3 py-2 text-white placeholder-white/50 text-sm font-medium focus:outline-none"
                />
              </div>
              <Button
                data-testid="button-home-search-zip"
                onClick={handleZipSearch}
                disabled={isGeocoding}
                size="sm"
                className="rounded-full flex-shrink-0 font-bold px-5 text-sm border-0 text-white"
                style={{ background: "hsl(var(--accent))" }}
              >
                {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </div>
            {geoLocation && (
              <p className="text-white/55 text-xs mt-2.5 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" />
                {geoLocation.city || geoLocation.displayName} · {searchedZip}
              </p>
            )}
          </div>
        </div>

        {/* Wave */}
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 36" preserveAspectRatio="none" style={{ height: 36 }}>
          <path d="M0,36 C480,0 960,0 1440,36 L1440,36 L0,36 Z" fill="hsl(var(--background))" />
        </svg>
      </div>

      {/* ── Category browsing grid ─────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Browse by Category</h2>
          <button
            className="text-xs font-semibold flex items-center gap-0.5"
            style={{ color: "hsl(var(--primary))" }}
            onClick={goToBrowse}
            data-testid="button-filters"
          >
            See All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {browseCats.map((name) => {
            const cfg = CATEGORY_CONFIG[name];
            const Icon = cfg?.icon || Tag;
            return (
              <button
                key={name}
                data-testid={`button-category-${name.toLowerCase().replace(/ /g, "-")}`}
                className="relative overflow-hidden rounded-xl h-20 text-left transition-all duration-200 active:scale-95"
                onClick={goToBrowse}
              >
                {cfg?.image && (
                  <img src={cfg.image} alt={name} className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className={`absolute inset-0 bg-gradient-to-br ${cfg?.gradient || "from-gray-600 to-gray-800"} opacity-80`} />
                <div className="relative z-10 p-2 flex flex-col justify-between h-full">
                  <Icon className="w-4 h-4 text-white/90" />
                  <span className="text-[10px] font-bold text-white leading-tight drop-shadow-sm">{name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── No ZIP yet ─────────────────────────────────────────── */}
      {!geoLocation && (
        <div className="max-w-3xl mx-auto px-4 pt-6 animate-scale-in">
          <Card className="p-8 text-center border-dashed border-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "hsl(var(--primary) / 0.1)" }}>
              <MapPin className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <h3 className="text-base font-bold mb-1">Enter Your ZIP Code</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              We'll find real coupon deals from businesses within 10 miles of you
            </p>
          </Card>
        </div>
      )}

      {/* ── App Store-style horizontal deal sections ───────────── */}
      {geoLocation && searchedZip && (
        <div className="mt-6">

          {/* Search results override — show flat list when searching */}
          {searchQuery.trim() ? (
            <div className="max-w-3xl mx-auto px-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{searchQuery}"
                </span>
              </div>
              {filtered.length === 0 ? (
                <Card className="p-10 text-center border-dashed">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3 animate-pulse-soft" />
                  <p className="font-bold text-sm mb-1">No results found</p>
                  <p className="text-xs text-muted-foreground">Try a different search term</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filtered.map((deal, i) => (
                    <div key={deal.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}>
                      <DealCard
                        id={deal.id}
                        storeName={deal.storeName}
                        storeLogoUrl={deal.storeLogoUrl ?? undefined}
                        discountAmount={deal.discountAmount}
                        title={deal.title}
                        description={deal.description ?? undefined}
                        category={deal.category}
                        expirationDate={deal.expirationDate}
                        claimCount={deal.claimCount ?? 0}
                        isTrending={deal.isTrending ?? false}
                        isSaved={savedDealIds.has(deal.id)}
                        isCurated={(deal as any).isCurated}
                        isVerified={(deal as any).isVerified}
                        isLocalBusiness={(deal as any).isLocalBusiness}
                        requiresApp={(deal as any).requiresApp}
                        code={(deal as any).code}
                        distance={deal.distance}
                        onSave={() => handleSave(deal)}
                        onViewDeal={() => setSelectedDeal(deal)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── Top Pick banner ──────────────────────────── */}
              {(recommendedSpotQuery.isLoading || recommendedSpot) && (
                <div className="max-w-3xl mx-auto px-4 mb-6">
                  {recommendedSpotQuery.isLoading ? (
                    <div className="h-24 rounded-2xl bg-muted animate-pulse" />
                  ) : recommendedSpot && (
                    <div
                      className="rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                      onClick={() => setSelectedDeal(recommendedSpot)}
                      data-testid="card-home-recommended-spot"
                      style={{ background: "linear-gradient(135deg, hsl(214 80% 22%), hsl(164 60% 28%))" }}
                    >
                      <div className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "hsl(164 60% 40% / 0.25)" }}>
                          <Star className="w-6 h-6" style={{ fill: "hsl(164 70% 70%)", color: "hsl(164 70% 70%)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "hsl(164 70% 75%)" }}>Top Pick</p>
                          <p className="font-extrabold text-white text-sm truncate">{recommendedSpot.storeName}</p>
                          <p className="text-xl font-extrabold font-display" style={{ color: "hsl(164 70% 75%)" }}>{recommendedSpot.discountAmount}</p>
                        </div>
                        {(recommendedSpot as any).isCurated && (recommendedSpot as any).isVerified && (
                          <Badge className="bg-emerald-500 text-white text-[10px] flex-shrink-0">
                            <BadgeCheck className="w-3 h-3 mr-1" />Verified
                          </Badge>
                        )}
                        <ChevronRight className="w-5 h-5 text-white/60 flex-shrink-0" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Trending ──────────────────────────────────── */}
              <HorizontalSection
                title="Trending Now"
                icon={TrendingUp}
                deals={trendingDeals.length > 0 ? trendingDeals : filtered.slice(0, 8)}
                savedDealIds={savedDealIds}
                onSave={handleSave}
                onView={(d) => setSelectedDeal(d)}
                onViewAll={goToBrowse}
                isLoading={isLoading}
              />

              {/* ── Restaurants ───────────────────────────────── */}
              <HorizontalSection
                title="Restaurants Near You"
                icon={UtensilsCrossed}
                deals={foodDeals}
                savedDealIds={savedDealIds}
                onSave={handleSave}
                onView={(d) => setSelectedDeal(d)}
                onViewAll={goToBrowse}
                isLoading={isLoading}
              />

              {/* ── Retail ────────────────────────────────────── */}
              <HorizontalSection
                title="Retail Deals"
                icon={ShoppingBag}
                deals={retailDeals}
                savedDealIds={savedDealIds}
                onSave={handleSave}
                onView={(d) => setSelectedDeal(d)}
                onViewAll={goToBrowse}
                isLoading={isLoading}
              />

              {/* ── Local businesses ──────────────────────────── */}
              <HorizontalSection
                title="Local Business Deals"
                icon={Store}
                deals={localDeals.length > 0 ? localDeals : filtered.filter(d => d.category === "Local Business")}
                savedDealIds={savedDealIds}
                onSave={handleSave}
                onView={(d) => setSelectedDeal(d)}
                onViewAll={goToBrowse}
                isLoading={isLoading}
              />

              {/* ── Verified picks ────────────────────────────── */}
              <HorizontalSection
                title="Verified Deals"
                icon={BadgeCheck}
                deals={verifiedDeals}
                savedDealIds={savedDealIds}
                onSave={handleSave}
                onView={(d) => setSelectedDeal(d)}
                onViewAll={goToBrowse}
                isLoading={isLoading}
              />

              {/* ── Automotive ────────────────────────────────── */}
              <HorizontalSection
                title="Automotive"
                icon={Car}
                deals={autoDeals}
                savedDealIds={savedDealIds}
                onSave={handleSave}
                onView={(d) => setSelectedDeal(d)}
                onViewAll={goToBrowse}
                isLoading={isLoading}
              />

              {/* ── Entertainment ─────────────────────────────── */}
              <HorizontalSection
                title="Entertainment"
                icon={Film}
                deals={entDeals}
                savedDealIds={savedDealIds}
                onSave={handleSave}
                onView={(d) => setSelectedDeal(d)}
                onViewAll={goToBrowse}
                isLoading={isLoading}
              />

              {/* ── Empty state ───────────────────────────────── */}
              {!isLoading && allDeals.length === 0 && (
                <div className="max-w-3xl mx-auto px-4 animate-fade-in">
                  <Card className="p-10 text-center border-dashed">
                    <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-4 animate-pulse-soft" />
                    <h4 className="font-bold text-base mb-2">No Deals Found</h4>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      We couldn't find any deals near this ZIP code. Try a different one!
                    </p>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <BottomNav />

      {selectedDeal && (
        <DealDetailModal
          open={!!selectedDeal}
          onOpenChange={(open) => !open && setSelectedDeal(null)}
          deal={selectedDeal}
        />
      )}
    </div>
  );
}
