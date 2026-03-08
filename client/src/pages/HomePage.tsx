import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Search, Sparkles, SlidersHorizontal, Loader2, MapPin, Star, BadgeCheck,
  Smartphone, AlertCircle, UtensilsCrossed, Tag, Car, Film,
  ShoppingBag, Activity, ShoppingCart, Shirt, Cpu, Plane, Scissors, Dumbbell, Store, ChevronRight, Zap
} from "lucide-react";
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

const categories = [
  "Food & Dining",
  "Retail",
  "Automotive",
  "Entertainment",
  "Local Business",
  "Health",
  "App Required",
];

const categoryConfig: Record<string, { icon: React.ElementType; color: string; image: string }> = {
  "Food & Dining": {
    icon: UtensilsCrossed,
    color: "from-orange-500 to-red-500",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80",
  },
  "Retail": {
    icon: ShoppingBag,
    color: "from-blue-500 to-indigo-600",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80",
  },
  "Automotive": {
    icon: Car,
    color: "from-gray-600 to-gray-800",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80",
  },
  "Entertainment": {
    icon: Film,
    color: "from-purple-500 to-pink-600",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80",
  },
  "Local Business": {
    icon: Store,
    color: "from-teal-500 to-emerald-600",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
  },
  "Health": {
    icon: Activity,
    color: "from-green-500 to-teal-500",
    image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&q=80",
  },
  "Groceries": {
    icon: ShoppingCart,
    color: "from-lime-500 to-green-600",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
  },
  "Fashion": {
    icon: Shirt,
    color: "from-pink-500 to-rose-600",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  },
  "Electronics": {
    icon: Cpu,
    color: "from-sky-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&q=80",
  },
  "Fitness": {
    icon: Dumbbell,
    color: "from-yellow-500 to-orange-500",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
  },
};

interface GeocodedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  boundingBox?: [number, number, number, number];
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const [zipCode, setZipCode] = useState("");
  const [searchedZip, setSearchedZip] = useState("");
  const [geoLocation, setGeoLocation] = useState<GeocodedLocation | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    const savedZip = localStorage.getItem('couponai_zip');
    const savedLocationStr = localStorage.getItem('couponai_location');
    if (savedZip) {
      setZipCode(savedZip);
      setSearchedZip(savedZip);
    }
    if (savedLocationStr) {
      try {
        const savedLocation = JSON.parse(savedLocationStr);
        setGeoLocation(savedLocation);
      } catch (e) {
        console.error('Failed to parse saved location');
      }
    }
  }, []);

  const { data: savedDeals = [] } = useQuery<SavedDeal[]>({
    queryKey: ["/api/saved-deals"],
  });

  const nearbyDealsQuery = useQuery<(Coupon & { distance: number })[]>({
    queryKey: geoLocation && searchedZip
      ? [`/api/coupons/nearby?latitude=${geoLocation.latitude}&longitude=${geoLocation.longitude}&radius=10&zipCode=${encodeURIComponent(searchedZip)}`]
      : ['/api/coupons/nearby'],
    enabled: !!geoLocation && !!searchedZip,
  });

  const recommendedSpotQuery = useQuery<{
    recommended: (Coupon & { distance: number }) | null;
    score: number;
    reason: string;
    totalDealsAnalyzed: number;
    verifiedDealsCount?: number;
  }>({
    queryKey: geoLocation && searchedZip
      ? [`/api/coupons/recommended-spot?latitude=${geoLocation.latitude}&longitude=${geoLocation.longitude}&radius=10&zipCode=${encodeURIComponent(searchedZip)}`]
      : ['/api/coupons/recommended-spot'],
    enabled: !!geoLocation && !!searchedZip,
  });

  const nearbyDeals = nearbyDealsQuery.data || [];
  const recommendedSpot = recommendedSpotQuery.data?.recommended;
  const savedDealIds = new Set(savedDeals.map((sd) => sd.couponId));

  const searchAndCategoryFilteredDeals = nearbyDeals
    .filter(deal => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          deal.storeName.toLowerCase().includes(query) ||
          deal.title.toLowerCase().includes(query) ||
          deal.description?.toLowerCase().includes(query) ||
          deal.category.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .filter(deal => {
      if (selectedCategory) {
        if (selectedCategory === "App Required") return !!(deal as any).requiresApp;
        return deal.category === selectedCategory;
      }
      return true;
    });

  const filteredDeals = searchAndCategoryFilteredDeals.filter((deal, index, array) => {
    const dealCode = (deal as any).code || '';
    const brandName = deal.storeName.toLowerCase();
    const firstIndex = array.findIndex(d => {
      const dCode = (d as any).code || '';
      const dBrand = d.storeName.toLowerCase();
      return dCode === dealCode && dBrand === brandName;
    });
    return firstIndex === index;
  });

  const handleSave = async (deal: any) => {
    const isSaved = savedDealIds.has(deal.id);
    try {
      if (isSaved) {
        await apiRequest("DELETE", `/api/saved-deals/${deal.id}`, undefined);
      } else {
        await apiRequest("POST", "/api/saved-deals", {
          couponId: deal.id,
          storeName: deal.storeName,
          storeLogoUrl: deal.storeLogoUrl,
          discountAmount: deal.discountAmount,
          title: deal.title,
          description: deal.description,
          code: deal.code,
          category: deal.category,
          expirationDate: deal.expirationDate || deal.expiresAt,
          claimCount: deal.claimCount,
          isTrending: deal.isTrending || deal.trending,
          isVerified: deal.isVerified,
          isCurated: deal.isCurated,
          requiresApp: deal.requiresApp,
          latitude: deal.latitude,
          longitude: deal.longitude,
          distance: deal.distance,
          source: deal.source,
          terms: deal.terms || deal.termsAndConditions,
          storeType: deal.storeType,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/saved-deals"] });
      toast({
        title: isSaved ? "Deal removed" : "Deal saved!",
        description: isSaved ? "Removed from your saved deals" : "Added to your saved deals",
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update saved deals", variant: "destructive" });
    }
  };

  const handleZipSearch = async () => {
    if (!zipCode.trim()) {
      toast({ title: "Error", description: "Please enter a ZIP code", variant: "destructive" });
      return;
    }
    setIsGeocoding(true);
    try {
      const response = await fetch(`/api/geocode/zipcode?zipcode=${encodeURIComponent(zipCode)}`, {
        credentials: "include",
      });
      if (!response.ok) throw { status: response.status, message: `${response.status}` };
      const data: GeocodedLocation = await response.json();
      localStorage.setItem('couponai_zip', zipCode);
      localStorage.setItem('couponai_location', JSON.stringify(data));
      setSearchedZip(zipCode);
      setGeoLocation(data);
      toast({
        title: "Location found!",
        description: `Showing deals near ${data.city || data.displayName}`,
      });
    } catch (error: any) {
      console.error("Geocoding error:", error);
      if (error?.message?.includes("404") || error?.status === 404) {
        toast({ title: "ZIP code not found", description: "Please check the ZIP code and try again", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to find location. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleZipSearch();
  };

  const browseCategoryList = ["Food & Dining", "Retail", "Automotive", "Entertainment", "Local Business", "Health", "Fashion", "Fitness"];

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── Sticky header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold tracking-tight" style={{ color: 'hsl(var(--primary))' }}>
              CouponAI
            </span>
          </div>

          <div className="flex-1 max-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <Input
              data-testid="input-search-header"
              type="search"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-full bg-secondary border-0 text-sm"
            />
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(142 71% 20%) 0%, hsl(142 60% 32%) 50%, hsl(80 60% 35%) 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20"
          style={{ background: 'hsl(45 93% 47%)' }} />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-15"
          style={{ background: 'hsl(142 71% 60%)' }} />

        <div className="relative z-10 max-w-3xl mx-auto px-4 pt-12 pb-10 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-5 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
            <Sparkles className="w-3 h-3" />
            AI-Powered Savings
          </div>

          {/* Big name */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-white font-display leading-none mb-3 tracking-tight">
            Coupon<span style={{ color: 'hsl(45 93% 60%)' }}>AI</span>
          </h1>
          <p className="text-white/70 text-base mb-8 max-w-xs mx-auto">
            Real coupons from real businesses near you — verified &amp; ready to use
          </p>

          {/* ZIP search bar */}
          <div className="max-w-sm mx-auto">
            <div className="flex gap-2 rounded-full p-1.5 border border-white/20"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
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
                className="rounded-full flex-shrink-0 font-semibold px-5"
                style={{ background: 'hsl(45 93% 47%)', color: 'hsl(40 50% 10%)' }}
              >
                {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </div>
            {geoLocation && (
              <p className="text-white/55 text-xs mt-2.5">
                <MapPin className="w-3 h-3 inline mr-1" />
                {geoLocation.city || geoLocation.displayName} · {searchedZip}
              </p>
            )}
          </div>
        </div>

        {/* Bottom wave */}
        <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 32" preserveAspectRatio="none" style={{ height: 32 }}>
          <path d="M0,32 C360,0 1080,0 1440,32 L1440,32 L0,32 Z" fill="hsl(var(--background))" />
        </svg>
      </div>

      {/* ── Deals section (shown after ZIP search) ───────────────── */}
      {geoLocation && searchedZip && (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-slide-up">

          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'hsl(var(--primary) / 0.12)' }}>
                <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <h2 className="text-base font-bold">Deals Near You</h2>
            </div>
            <Badge variant="secondary" className="font-mono">
              {nearbyDealsQuery.isLoading ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading
                </span>
              ) : (
                `${filteredDeals.length} ${filteredDeals.length === 1 ? "deal" : "deals"}`
              )}
            </Badge>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-5">
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                selectedCategory === null
                  ? 'text-white shadow-sm'
                  : 'bg-secondary text-secondary-foreground'
              }`}
              style={selectedCategory === null ? { background: 'hsl(var(--primary))' } : {}}
              onClick={() => setSelectedCategory(null)}
              data-testid="button-category-all"
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                data-testid={`button-local-category-${category.toLowerCase()}`}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  selectedCategory === category
                    ? 'text-white shadow-sm'
                    : 'bg-secondary text-secondary-foreground'
                }`}
                style={selectedCategory === category ? { background: 'hsl(var(--primary))' } : {}}
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Recommended Spot Banner */}
          {recommendedSpotQuery.isLoading && (
            <Card className="p-4 bg-muted/30 mb-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-40" />
                </div>
              </div>
            </Card>
          )}

          {recommendedSpot && recommendedSpotQuery.data && !recommendedSpotQuery.isLoading && (
            <Card
              className="overflow-hidden cursor-pointer hover-elevate mb-5 border-0 shadow-sm"
              onClick={() => setSelectedDeal(recommendedSpot)}
              data-testid="card-home-recommended-spot"
              style={{ background: 'linear-gradient(135deg, hsl(142 71% 30% / 0.08), hsl(45 93% 47% / 0.08))' }}
            >
              <div className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'hsl(45 93% 47% / 0.2)' }}>
                    <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide mb-1"
                    style={{ color: 'hsl(var(--primary))' }}>
                    Top Pick for You
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sm truncate">{recommendedSpot.storeName}</p>
                    {(recommendedSpot as any).isCurated && (recommendedSpot as any).isVerified && (
                      <Badge variant="default" className="gap-1 text-xs px-1.5 py-0 h-5 bg-emerald-600 flex-shrink-0">
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-extrabold font-display"
                    style={{ color: 'hsl(var(--primary))' }}>
                    {recommendedSpot.discountAmount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{recommendedSpotQuery.data.reason}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Card>
          )}

          {/* Loading skeletons */}
          {nearbyDealsQuery.isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-52 rounded-xl animate-pulse"
                  style={{ background: 'hsl(var(--muted))' }} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!nearbyDealsQuery.isLoading && filteredDeals.length === 0 && (
            <Card className="p-10 text-center border-dashed">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-muted-foreground animate-pulse-soft" />
              </div>
              <h4 className="font-bold text-base mb-2">No Deals Found</h4>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {selectedCategory
                  ? `No ${selectedCategory} deals in this area. Try a different category.`
                  : "We couldn't find any deals in this area. Try a different ZIP code!"}
              </p>
              {selectedCategory && (
                <button
                  className="mt-4 text-sm font-semibold"
                  style={{ color: 'hsl(var(--primary))' }}
                  onClick={() => setSelectedCategory(null)}
                >
                  Clear filter
                </button>
              )}
            </Card>
          )}

          {/* Deals list */}
          {!nearbyDealsQuery.isLoading && filteredDeals.length > 0 && (
            <div className="space-y-4">
              {filteredDeals.map((deal, i) => (
                <div
                  key={deal.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
                >
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
      )}

      {/* ── No ZIP yet: prompt + categories ─────────────────────── */}
      {!geoLocation && (
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
          <Card className="p-8 text-center border-2 border-dashed animate-scale-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'hsl(var(--primary) / 0.1)' }}>
              <MapPin className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <h3 className="text-lg font-bold mb-2">Enter Your ZIP Code Above</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
              We'll find real coupon deals from businesses within 10 miles of you
            </p>
          </Card>
        </div>
      )}

      {/* ── Browse by Category ───────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold">Browse by Category</h3>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-sm"
            style={{ color: 'hsl(var(--primary))' }}
            onClick={() => setLocation("/browse")}
            data-testid="button-filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            All Filters
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {browseCategoryList.map((category) => {
            const config = categoryConfig[category];
            const Icon = config?.icon || Tag;
            return (
              <button
                key={category}
                data-testid={`button-category-${category.toLowerCase()}`}
                className="relative overflow-hidden rounded-xl h-24 text-left transition-transform duration-200 active:scale-95 hover:opacity-90"
                onClick={() => setLocation("/browse")}
              >
                {config?.image && (
                  <img
                    src={config.image}
                    alt={category}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className={`absolute inset-0 bg-gradient-to-br ${config?.color || 'from-gray-600 to-gray-800'} opacity-75`} />
                <div className="relative z-10 p-3 flex flex-col justify-between h-full">
                  <Icon className="w-5 h-5 text-white/90" />
                  <span className="text-xs font-bold text-white leading-tight drop-shadow-sm">{category}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
