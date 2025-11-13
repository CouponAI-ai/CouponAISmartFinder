import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DealCard from "@/components/DealCard";
import DealDetailModal from "@/components/DealDetailModal";
import BottomNav from "@/components/BottomNav";
import type { Coupon, SavedCoupon } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SavedPage() {
  const [selectedDeal, setSelectedDeal] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const { data: savedCoupons = [] } = useQuery<SavedCoupon[]>({
    queryKey: ["/api/saved-coupons"],
  });

  const { data: allCoupons = [] } = useQuery<Coupon[]>({
    queryKey: ["/api/coupons"],
  });

  // Get full deal info for saved coupons
  const savedDeals = savedCoupons
    .map((sc) => allCoupons.find((c) => c.id === sc.couponId))
    .filter((deal): deal is Coupon => deal !== undefined);

  // Filter active vs expired
  const activeDeals = savedDeals.filter(
    (deal) => !deal.expirationDate || new Date(deal.expirationDate) > new Date()
  );
  const expiredDeals = savedDeals.filter(
    (deal) => deal.expirationDate && new Date(deal.expirationDate) <= new Date()
  );

  const savedCouponIds = new Set(savedCoupons.map((sc) => sc.couponId));

  const handleUnsave = async (couponId: string) => {
    try {
      const savedCoupon = savedCoupons.find((sc) => sc.couponId === couponId);
      if (savedCoupon) {
        await apiRequest("DELETE", `/api/saved-coupons/${savedCoupon.id}`, undefined);
      }
      
      await queryClient.invalidateQueries({ queryKey: ["/api/saved-coupons"] });
      
      toast({
        title: "Deal removed",
        description: "Removed from your saved deals",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove deal",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 pt-8 pb-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Bookmark className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-semibold">Saved Deals</h1>
          </div>
          <p className="text-muted-foreground">
            {savedDeals.length} {savedDeals.length === 1 ? "deal" : "deals"} saved
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1" data-testid="tab-all-saved">
              All ({savedDeals.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1" data-testid="tab-active">
              Active ({activeDeals.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex-1" data-testid="tab-expired">
              Expired ({expiredDeals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {savedDeals.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">No saved deals yet</p>
                <p className="text-sm text-muted-foreground">
                  Start saving your favorite deals to access them here
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {savedDeals.map((deal) => (
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
                    isSaved={true}
                    onSave={() => handleUnsave(deal.id)}
                    onViewDeal={() => setSelectedDeal(deal)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            {activeDeals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No active saved deals</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeDeals.map((deal) => (
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
                    isSaved={true}
                    onSave={() => handleUnsave(deal.id)}
                    onViewDeal={() => setSelectedDeal(deal)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expired" className="mt-6">
            {expiredDeals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No expired deals</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {expiredDeals.map((deal) => (
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
                    isSaved={true}
                    onSave={() => handleUnsave(deal.id)}
                    onViewDeal={() => setSelectedDeal(deal)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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
