import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import DealCard from "@/components/DealCard";
import DealDetailModal from "@/components/DealDetailModal";
import BottomNav from "@/components/BottomNav";
import type { Coupon, SavedCoupon } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AIPicksPage() {
  const [selectedDeal, setSelectedDeal] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const { data: aiPicks = [], isLoading, refetch, isRefetching } = useQuery<Coupon[]>({
    queryKey: ["/api/coupons/ai-picks"],
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

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Refreshed!",
      description: "AI picks updated based on your preferences",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 pt-8 pb-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold">AI Picks</h1>
            </div>
            <Button
              data-testid="button-refresh"
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefetching}
            >
              <RefreshCw className={`w-5 h-5 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Personalized deals based on your shopping preferences
          </p>
        </div>
      </div>

      {/* AI Picks Grid */}
      <div className="max-w-md mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : aiPicks.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">No AI picks yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Update your preferences in the Profile tab to get personalized recommendations
            </p>
            <Button variant="outline" onClick={() => window.location.href = "/profile"}>
              Set Preferences
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {aiPicks.map((deal) => (
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
                isAIPick={true}
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
