import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { apiGet } from "@/lib/api";
import type { Coupon, SavedCoupon } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const allCategories = ["Groceries", "Fashion", "Electronics", "Dining", "Travel", "Health", "Beauty", "Fitness"];
const sortOptions = ["Newest", "Expiring Soon", "Highest Discount", "Most Popular"];

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("Newest");
  const [selectedDeal, setSelectedDeal] = useState<Coupon | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const { toast } = useToast();

  const { data: allDeals = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/coupons"],
  });

  const { data: savedCoupons = [] } = useQuery<SavedCoupon[]>({
    queryKey: ["/api/saved-coupons"],
  });

  const savedCouponIds = new Set(savedCoupons.map((sc) => sc.couponId));

  // Filter and sort deals
  const filteredDeals = allDeals
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
        return selectedCategories.includes(deal.category);
      }
      return true;
    })
    .sort((a, b) => {
      // Sort
      if (sortBy === "Expiring Soon") {
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      }
      if (sortBy === "Most Popular") {
        return (b.claimCount || 0) - (a.claimCount || 0);
      }
      return 0; // Newest (default order from API)
    });

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
          <h1 className="text-xl font-semibold mb-4">Browse Deals</h1>
          
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
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
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

                  {/* Apply Button */}
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
      <div className="max-w-md mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground mb-4">
          {filteredDeals.length} deals found
        </p>

        {isLoading ? (
          <div className="grid gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No deals found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDeals.map((deal) => (
              <DealCard
                key={deal.id}
                id={deal.id}
                storeName={deal.storeName}
                storeLogoUrl={deal.storeLogoUrl || undefined}
                discountAmount={deal.discountAmount}
                title={deal.title}
                description={deal.description || undefined}
                category={deal.category}
                expirationDate={deal.expirationDate}
                claimCount={deal.claimCount}
                isTrending={deal.isTrending}
                isSaved={savedCouponIds.has(deal.id)}
                onSave={() => handleSave(deal.id)}
                onViewDeal={() => setSelectedDeal(deal)}
              />
            ))}
          </div>
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
