import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles, SlidersHorizontal, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DealCard from "@/components/DealCard";
import DealDetailModal from "@/components/DealDetailModal";
import BottomNav from "@/components/BottomNav";
import type { Coupon, SavedCoupon } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const categories = ["Groceries", "Fashion", "Electronics", "Dining", "Travel", "Health"];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const { data: trendingDeals = [], isLoading: isLoadingTrending } = useQuery<Coupon[]>({
    queryKey: ["/api/coupons/trending"],
  });

  const { data: savedCoupons = [] } = useQuery<SavedCoupon[]>({
    queryKey: ["/api/saved-coupons"],
  });

  const savedCouponIds = new Set(savedCoupons.map((sc) => sc.couponId));

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
          <Button size="icon" variant="ghost" className="rounded-full">
            <Moon className="w-5 h-5" />
          </Button>
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

      {/* Categories Section */}
      <div className="px-4 py-6 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide">Categories</h3>
            <Button variant="ghost" size="sm" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                data-testid={`button-category-${category.toLowerCase()}`}
                variant={selectedCategory === category ? "default" : "secondary"}
                size="sm"
                className="rounded-full whitespace-nowrap px-4"
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Picked For You Section */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Picked For You</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          AI-powered recommendations based on your preferences
        </p>

        {isLoadingTrending ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-muted rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : trendingDeals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No deals available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trendingDeals.map((deal) => (
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
                isAIPick={true}
                onSave={() => handleSave(deal.id)}
                onViewDeal={() => setSelectedDeal(deal)}
                latitude={deal.latitude}
                longitude={deal.longitude}
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
