import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DealCard from "@/components/DealCard";
import DealDetailModal from "@/components/DealDetailModal";
import BottomNav from "@/components/BottomNav";
import { apiGet } from "@/lib/api";
import type { Coupon, SavedCoupon } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const categories = ["All", "Groceries", "Fashion", "Electronics", "Dining", "Travel", "Health"];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
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
      {/* Hero Section */}
      <div
        className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 pt-8 pb-12"
        style={{ minHeight: "40vh" }}
      >
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-3">
            Smart Savings, <span className="text-primary">Powered by AI</span>
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            Discover the best deals from your favorite stores
          </p>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              data-testid="input-search"
              type="search"
              placeholder="Search for deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full shadow-lg"
            />
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
            {categories.map((category) => (
              <Badge
                key={category}
                data-testid={`badge-category-${category.toLowerCase()}`}
                variant={selectedCategory === category ? "default" : "secondary"}
                className="cursor-pointer whitespace-nowrap snap-start px-4 py-2 hover-elevate"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Deals Section */}
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-semibold">Trending Now</h2>
        </div>

        {isLoadingTrending ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-card rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : trendingDeals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No trending deals available</p>
          </div>
        ) : (
          <div className="grid gap-6">
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
