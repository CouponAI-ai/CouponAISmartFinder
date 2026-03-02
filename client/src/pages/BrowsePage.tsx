import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, MapPin, Loader2, AlertCircle, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import DealCard from "@/components/DealCard";
import DealDetailModal from "@/components/DealDetailModal";
import BottomNav from "@/components/BottomNav";
import type { Coupon, SavedDeal } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const allCategories = [
  "Food & Dining",
  "Retail",
  "Automotive",
  "Entertainment",
  "Local Business",
  "Health",
  "Groceries",
  "Fashion",
  "Electronics",
  "Travel",
  "Beauty",
  "Fitness",
  "App Required",
];
const sortOptions = ["Nearest", "Highest Discount", "Most Popular", "Expiring Soon"];

interface GeocodedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  boundingBox?: [number, number, number, number];
}

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("Nearest");
  const [selectedDeal, setSelectedDeal] = useState<Coupon | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const { toast } = useToast();

  const [savedZip, setSavedZip] = useState<string | null>(null);
  const [savedLocation, setSavedLocation] = useState<GeocodedLocation | null>(null);

  useEffect(() => {
    const zip = localStorage.getItem('couponai_zip');
    const locationStr = localStorage.getItem('couponai_location');
    if (zip) setSavedZip(zip);
    if (locationStr) {
      try {
        setSavedLocation(JSON.parse(locationStr));
      } catch (e) {
        console.error('Failed to parse saved location');
      }
    }
  }, []);

  const { data: nearbyDeals = [], isLoading } = useQuery<(Coupon & { distance: number })[]>({
    queryKey: savedLocation && savedZip
      ? [`/api/coupons/nearby?latitude=${savedLocation.latitude}&longitude=${savedLocation.longitude}&radius=10&zipCode=${encodeURIComponent(savedZip)}`]
      : ['/api/coupons/nearby-disabled'],
    enabled: !!savedLocation && !!savedZip,
  });

  const { data: savedDeals = [] } = useQuery<SavedDeal[]>({
    queryKey: ["/api/saved-deals"],
  });

  const savedDealIds = new Set(savedDeals.map((sd) => sd.couponId));

  const sortedDeals = nearbyDeals
    .filter((deal) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          deal.title.toLowerCase().includes(query) ||
          deal.storeName.toLowerCase().includes(query) ||
          deal.description?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .filter((deal) => {
      if (selectedCategories.length > 0) {
        if (selectedCategories.includes("App Required") && (deal as any).requiresApp) return true;
        const nonAppCategories = selectedCategories.filter(c => c !== "App Required");
        if (nonAppCategories.length > 0) return nonAppCategories.includes(deal.category);
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "Nearest") return (a.distance || 0) - (b.distance || 0);
      if (sortBy === "Expiring Soon") {
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      }
      if (sortBy === "Most Popular") return (b.claimCount || 0) - (a.claimCount || 0);
      if (sortBy === "Highest Discount") {
        const getDiscountValue = (discount: string) => {
          const percentMatch = discount.match(/(\d+)%/);
          if (percentMatch) return parseInt(percentMatch[1]);
          const dollarMatch = discount.match(/\$(\d+)/);
          if (dollarMatch) return parseInt(dollarMatch[1]);
          if (discount.includes("BOGO")) return 50;
          if (discount.includes("FREE")) return 25;
          return 0;
        };
        return getDiscountValue(b.discountAmount) - getDiscountValue(a.discountAmount);
      }
      return 0;
    });

  const filteredDeals = sortedDeals.filter((deal, index, array) => {
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

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold">Browse Deals</h1>
            {savedLocation && savedZip && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {savedLocation.city || savedZip}
              </span>
            )}
          </div>

          {!savedLocation && (
            <p className="text-xs text-amber-600 dark:text-amber-500 mb-3">
              Search a ZIP code on Home to see local deals
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                data-testid="input-search-browse"
                type="search"
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-full bg-secondary border-0"
              />
            </div>

            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  data-testid="button-filters"
                  variant="outline"
                  size="icon"
                  className="relative rounded-full"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  {selectedCategories.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {selectedCategories.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col">
                <SheetHeader>
                  <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-primary to-accent mb-2" />
                  <SheetTitle className="text-lg font-bold">Filters</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto mt-4 space-y-6 pr-1">
                  <div>
                    <h3 className="text-sm font-bold mb-3 text-foreground">Categories</h3>
                    <div className="space-y-2">
                      {allCategories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => toggleCategory(category)}
                            className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                          />
                          <Label
                            htmlFor={`category-${category}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold mb-3 text-foreground">Sort By</h3>
                    <div className="flex flex-wrap gap-2">
                      {sortOptions.map((option) => (
                        <button
                          key={option}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            sortBy === option
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                          }`}
                          onClick={() => setSortBy(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t mt-2">
                  <Button
                    data-testid="button-apply-filters"
                    onClick={() => setFilterOpen(false)}
                    className="w-full rounded-full"
                  >
                    Apply Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {selectedCategories.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {selectedCategories.map((category) => (
                <Badge
                  key={category}
                  variant="default"
                  className="cursor-pointer bg-accent text-accent-foreground rounded-full"
                  onClick={() => toggleCategory(category)}
                >
                  {category} ×
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deals */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {!savedLocation && (
          <Card className="p-10 text-center border-dashed border-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Set Your Location</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Enter your ZIP code on the Home page to browse deals near you
            </p>
            <Button className="rounded-full" onClick={() => window.location.href = "/"}>
              Go to Home
            </Button>
          </Card>
        )}

        {savedLocation && (
          <>
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              {filteredDeals.length} deals found
            </p>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-52 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredDeals.length === 0 ? (
              <Card className="p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-muted-foreground animate-pulse-soft" />
                </div>
                <h4 className="font-bold text-base mb-2">No Deals Found</h4>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || selectedCategories.length > 0
                    ? "Try adjusting your filters"
                    : "No deals available in your area right now"}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredDeals.map((deal, i) => (
                  <div key={deal.id} style={{ animationDelay: `${i * 40}ms` }}>
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
          </>
        )}
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
