import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, MapPin, Loader2, AlertCircle, BadgeCheck, Smartphone, Heart, Store, UtensilsCrossed } from "lucide-react";
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

  // Load saved location from localStorage
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

  // Fetch real deals from Overpass API using saved location
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

  // Filter and sort deals
  const sortedDeals = nearbyDeals
    .filter((deal) => {
      // Search filter
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
      // Category filter
      if (selectedCategories.length > 0) {
        // "App Required" matches deals where requiresApp is true
        if (selectedCategories.includes("App Required") && (deal as any).requiresApp) {
          return true;
        }
        const nonAppCategories = selectedCategories.filter(c => c !== "App Required");
        if (nonAppCategories.length > 0) {
          return nonAppCategories.includes(deal.category);
        }
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort
      if (sortBy === "Nearest") {
        return (a.distance || 0) - (b.distance || 0);
      }
      if (sortBy === "Expiring Soon") {
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      }
      if (sortBy === "Most Popular") {
        return (b.claimCount || 0) - (a.claimCount || 0);
      }
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

  // Deduplicate deals - only show each unique coupon code once per brand
  const filteredDeals = sortedDeals.filter((deal, index, array) => {
    const dealCode = (deal as any).code || '';
    const brandName = deal.storeName.toLowerCase();
    
    // Find if this code+brand combination appeared earlier
    const firstIndex = array.findIndex(d => {
      const dCode = (d as any).code || '';
      const dBrand = d.storeName.toLowerCase();
      return dCode === dealCode && dBrand === brandName;
    });
    
    // Only keep if this is the first occurrence
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
      toast({
        title: "Error",
        description: "Failed to update saved deals",
        variant: "destructive",
      });
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-40 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold mb-2">Browse Deals</h1>
          
          {savedLocation && savedZip ? (
            <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Showing deals near {savedLocation.city || savedZip}
            </p>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-500 mb-4">
              Search for a ZIP code on the Home page to see local deals
            </p>
          )}
          
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                data-testid="input-search-browse"
                type="search"
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  data-testid="button-filters"
                  variant="outline"
                  size="icon"
                  className="relative"
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
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto mt-6 space-y-6 pr-1">
                  {/* Category Filter */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Categories</h3>
                    <div className="space-y-2">
                      {allCategories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => toggleCategory(category)}
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

                  {/* Sort By */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Sort By</h3>
                    <div className="space-y-2">
                      {sortOptions.map((option) => (
                        <Badge
                          key={option}
                          variant={sortBy === option ? "default" : "secondary"}
                          className="cursor-pointer mr-2"
                          onClick={() => setSortBy(option)}
                        >
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t mt-2">
                  <Button
                    data-testid="button-apply-filters"
                    onClick={() => setFilterOpen(false)}
                    className="w-full"
                  >
                    Apply Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters */}
          {selectedCategories.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {selectedCategories.map((category) => (
                <Badge
                  key={category}
                  variant="default"
                  className="cursor-pointer"
                  onClick={() => toggleCategory(category)}
                >
                  {category} ×
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deals Grid */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* No location set */}
        {!savedLocation && (
          <Card className="p-8 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Set Your Location</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Enter your ZIP code on the Home page to browse deals near you
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Home
            </Button>
          </Card>
        )}

        {/* Location set - show deals */}
        {savedLocation && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredDeals.length} deals found
            </p>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredDeals.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <h4 className="font-semibold mb-2">No Deals Found</h4>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || selectedCategories.length > 0
                    ? "Try adjusting your filters"
                    : "No deals available in your area right now"}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    className="p-4 cursor-pointer hover-elevate"
                    onClick={() => setSelectedDeal(deal)}
                    data-testid={`card-browse-deal-${deal.id}`}
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
                          {(deal as any).storeType && (
                            <Badge variant="outline" className="gap-1 text-xs px-1.5 py-0 h-5">
                              {(deal as any).storeType === "Store" ? <Store className="w-3 h-3" /> : <UtensilsCrossed className="w-3 h-3" />}
                              {(deal as any).storeType}
                            </Badge>
                          )}
                          {(deal as any).isCurated && (deal as any).isVerified && (
                            <Badge variant="default" className="gap-1 text-xs px-1.5 py-0 h-5 bg-green-600 hover:bg-green-700">
                              <BadgeCheck className="w-3 h-3" />
                              Verified
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
                            {deal.distance?.toFixed(1)} miles away
                          </p>
                          {(deal as any).requiresApp && (
                            <span className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                              <Smartphone className="w-3 h-3" />
                              App Required
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        data-testid={`button-save-${deal.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(deal);
                        }}
                        className="p-2 rounded-full hover-elevate active-elevate-2 flex-shrink-0"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            savedDealIds.has(deal.id) ? "fill-primary text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    </div>
                  </Card>
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
