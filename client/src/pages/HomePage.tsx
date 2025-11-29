import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Sparkles, SlidersHorizontal, Loader2, MapPin, Star, BadgeCheck, Info, Smartphone, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import DealCard from "@/components/DealCard";
import DealDetailModal from "@/components/DealDetailModal";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import type { Coupon, SavedCoupon } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const categories = ["Groceries", "Fashion", "Electronics", "Dining", "Travel", "Health"];

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

  // ZIP code search state
  const [zipCode, setZipCode] = useState("");
  const [searchedZip, setSearchedZip] = useState("");
  const [geoLocation, setGeoLocation] = useState<GeocodedLocation | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { data: savedCoupons = [] } = useQuery<SavedCoupon[]>({
    queryKey: ["/api/saved-coupons"],
  });

  // Nearby deals from Overpass API
  const nearbyDealsQuery = useQuery<(Coupon & { distance: number })[]>({
    queryKey: geoLocation && searchedZip
      ? [`/api/coupons/nearby?latitude=${geoLocation.latitude}&longitude=${geoLocation.longitude}&radius=10&zipCode=${encodeURIComponent(searchedZip)}`]
      : ['/api/coupons/nearby'],
    enabled: !!geoLocation && !!searchedZip,
  });

  // Recommended spot (verified deals only)
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

  const savedCouponIds = new Set(savedCoupons.map((sc) => sc.couponId));

  // Filter nearby deals by selected category
  const filteredDeals = selectedCategory 
    ? nearbyDeals.filter(deal => deal.category === selectedCategory)
    : nearbyDeals;

  const handleSave = async (couponId: string) => {
    const isSaved = savedCouponIds.has(couponId);
    
    try {
      if (isSaved) {
        const savedCoupon = savedCoupons.find((sc) => sc.couponId === couponId);
        if (savedCoupon) {
          await apiRequest("DELETE", `/api/saved-coupons/${savedCoupon.id}`, undefined);
        }
      } else {
        await apiRequest("POST", "/api/saved-coupons", { couponId });
      }
      
      await queryClient.invalidateQueries({ queryKey: ["/api/saved-coupons"] });
      
      toast({
        title: isSaved ? "Deal removed" : "Deal saved!",
        description: isSaved ? "Removed from your saved deals" : "Added to your saved deals",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update saved deals",
        variant: "destructive",
      });
    }
  };

  const handleZipSearch = async () => {
    if (!zipCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a ZIP code",
        variant: "destructive",
      });
      return;
    }

    setIsGeocoding(true);
    try {
      const data = await queryClient.fetchQuery<GeocodedLocation>({
        queryKey: [`/api/geocode/zipcode?zipcode=${encodeURIComponent(zipCode)}`],
      });
      
      setGeoLocation(data);
      setSearchedZip(zipCode);
      
      // Invalidate caches to force fresh fetch - use predicate to match any nearby/recommended queries
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.includes('/api/coupons/nearby') || key?.includes('/api/coupons/recommended-spot');
        }
      });
      
      toast({
        title: "Location found!",
        description: `Showing deals near ${data.city || data.displayName}`,
      });
    } catch (error: any) {
      console.error("Geocoding error:", error);
      
      if (error?.message?.includes("404") || error?.status === 404) {
        toast({
          title: "ZIP code not found",
          description: "Please check the ZIP code and try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to find location. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleZipSearch();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">CouponAI</h1>
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              data-testid="input-search-header"
              type="search"
              placeholder="Search for deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 rounded-lg bg-muted/50"
            />
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-background px-4 pt-12 pb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Smart Savings, Powered by AI
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Discover personalized deals from your favorite stores
          </p>
        </div>
      </div>

      {/* ZIP Code Search Section */}
      <div className="px-4 py-6 border-b border-border bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Find Local Deals</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your ZIP code to discover deals from real businesses near you
          </p>
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                data-testid="input-home-zipcode"
                type="text"
                placeholder="Enter ZIP code (e.g., 71753)"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isGeocoding}
              />
            </div>
            <Button
              data-testid="button-home-search-zip"
              onClick={handleZipSearch}
              disabled={isGeocoding}
            >
              {isGeocoding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {geoLocation && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing deals in ZIP code {searchedZip} ({geoLocation.city || "your area"})
            </p>
          )}
        </div>
      </div>

      {/* Local Deals Results */}
      {geoLocation && searchedZip && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Deals Near You</h2>
            </div>
            <Badge variant="secondary">
              {filteredDeals.length} {filteredDeals.length === 1 ? "deal" : "deals"}
            </Badge>
          </div>

          {/* Category Filter for Local Deals */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
            <Button
              variant={selectedCategory === null ? "default" : "secondary"}
              size="sm"
              className="rounded-full whitespace-nowrap"
              onClick={() => setSelectedCategory(null)}
              data-testid="button-category-all"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                data-testid={`button-local-category-${category.toLowerCase()}`}
                variant={selectedCategory === category ? "default" : "secondary"}
                size="sm"
                className="rounded-full whitespace-nowrap"
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Recommended Spot Banner */}
          {recommendedSpotQuery.isLoading && (
            <Card className="p-4 bg-muted/30 mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Finding the best deal for you...</p>
              </div>
            </Card>
          )}
          {recommendedSpot && recommendedSpotQuery.data && !recommendedSpotQuery.isLoading && (
            <Card 
              className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30 cursor-pointer hover-elevate mb-4"
              onClick={() => setSelectedDeal(recommendedSpot)}
              data-testid="card-home-recommended-spot"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Star className="w-5 h-5 fill-primary text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      Recommended Spot
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {recommendedSpot.storeLogoUrl && (
                      <img
                        src={recommendedSpot.storeLogoUrl}
                        alt={recommendedSpot.storeName}
                        className="w-6 h-6 object-contain rounded"
                      />
                    )}
                    <p className="font-bold text-base">{recommendedSpot.storeName}</p>
                    {(recommendedSpot as any).isCurated && (recommendedSpot as any).isVerified && (
                      <Badge variant="default" className="gap-1 text-xs px-1.5 py-0 h-5 bg-green-600 hover:bg-green-700">
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-3xl font-bold text-primary mb-2">
                    {recommendedSpot.discountAmount}
                  </h4>
                  <p className="text-sm mb-2">{recommendedSpot.title}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {recommendedSpotQuery.data.reason}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      {recommendedSpot.distance.toFixed(1)} miles away
                    </p>
                    {(recommendedSpot as any).requiresApp && (
                      <span className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        App Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Deals Loading State */}
          {nearbyDealsQuery.isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-muted rounded-xl animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Deals List */}
          {!nearbyDealsQuery.isLoading && filteredDeals.length === 0 && (
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <h4 className="font-semibold mb-2">No Deals Found</h4>
              <p className="text-sm text-muted-foreground">
                {selectedCategory 
                  ? `No ${selectedCategory} deals in this area. Try a different category.`
                  : "We couldn't find any deals in this area. Try a different ZIP code!"}
              </p>
            </Card>
          )}

          {!nearbyDealsQuery.isLoading && filteredDeals.length > 0 && (
            <div className="space-y-4">
              {filteredDeals.map((deal) => (
                <Card
                  key={deal.id}
                  className="p-4 cursor-pointer hover-elevate"
                  onClick={() => setSelectedDeal(deal)}
                  data-testid={`card-home-deal-${deal.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {deal.storeLogoUrl && (
                          <img
                            src={deal.storeLogoUrl}
                            alt={deal.storeName}
                            className="w-6 h-6 object-contain rounded"
                          />
                        )}
                        <p className="font-semibold text-sm">{deal.storeName}</p>
                        {(deal as any).isCurated && (deal as any).isVerified && (
                          <Badge variant="default" className="gap-1 text-xs px-1.5 py-0 h-5 bg-green-600 hover:bg-green-700">
                            <BadgeCheck className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                        {!(deal as any).isCurated && (
                          <Badge variant="outline" className="gap-1 text-xs px-1.5 py-0 h-5 text-muted-foreground">
                            <Info className="w-3 h-3" />
                            Sample
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-2xl font-bold text-primary mb-1">
                        {deal.discountAmount}
                      </h4>
                      <p className="text-sm mb-2">{deal.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {deal.category}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {deal.distance.toFixed(1)} miles away
                        </p>
                        {(deal as any).requiresApp && (
                          <span className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            App Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State - No ZIP entered yet */}
      {!geoLocation && (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Card className="p-8 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Enter Your ZIP Code</h3>
            <p className="text-muted-foreground text-sm">
              Enter your ZIP code above to discover deals from real local businesses near you
            </p>
          </Card>
        </div>
      )}

      {/* Categories Section */}
      <div className="px-4 py-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide">Browse by Category</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={() => setLocation("/browse")}
              data-testid="button-filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                data-testid={`button-category-${category.toLowerCase()}`}
                variant="secondary"
                size="lg"
                className="rounded-full whitespace-nowrap px-6 text-base font-semibold"
                onClick={() => setLocation("/browse")}
              >
                {category}
              </Button>
            ))}
          </div>
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
