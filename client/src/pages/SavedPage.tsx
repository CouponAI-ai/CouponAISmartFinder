import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Calendar, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DealCard from "@/components/DealCard";
import DealDetailModal from "@/components/DealDetailModal";
import BottomNav from "@/components/BottomNav";
import type { SavedDeal, Coupon } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SavedPage() {
  const [selectedDeal, setSelectedDeal] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const { data: savedDeals = [] } = useQuery<SavedDeal[]>({
    queryKey: ["/api/saved-deals"],
  });

  const isExpired = (expirationDate?: Date | string | null) => {
    if (!expirationDate) return false;
    const expDate = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
    return expDate <= new Date();
  };

  const activeDeals = savedDeals.filter(deal => !isExpired(deal.expirationDate));
  const expiredDeals = savedDeals.filter(deal => isExpired(deal.expirationDate));

  const handleUnsave = async (couponId: string) => {
    try {
      await apiRequest("DELETE", `/api/saved-deals/${couponId}`, undefined);
      await queryClient.invalidateQueries({ queryKey: ["/api/saved-deals"] });
      toast({ title: "Deal removed", description: "Removed from your saved deals" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove deal", variant: "destructive" });
    }
  };

  const convertToViewableDeal = (savedDeal: SavedDeal): Coupon => ({
    id: savedDeal.couponId,
    storeName: savedDeal.storeName,
    storeLogoUrl: savedDeal.storeLogoUrl || null,
    discountAmount: savedDeal.discountAmount,
    discountPercentage: null,
    title: savedDeal.title,
    description: savedDeal.description || null,
    code: savedDeal.code || null,
    category: savedDeal.category,
    expirationDate: savedDeal.expirationDate ? new Date(savedDeal.expirationDate) : null,
    claimCount: savedDeal.claimCount || 0,
    isTrending: savedDeal.isTrending ? 1 : 0,
    termsAndConditions: savedDeal.terms || null,
    latitude: savedDeal.latitude || null,
    longitude: savedDeal.longitude || null,
  });

  const renderDealList = (deals: SavedDeal[]) => (
    <div className="space-y-4">
      {deals.map((deal) => {
        const expired = isExpired(deal.expirationDate);
        return (
          <div key={deal.id} className={expired ? 'opacity-60' : ''}>
            <DealCard
              id={deal.couponId}
              storeName={deal.storeName}
              storeLogoUrl={deal.storeLogoUrl ?? undefined}
              discountAmount={deal.discountAmount}
              title={deal.title}
              description={deal.description ?? undefined}
              category={deal.category}
              expirationDate={deal.expirationDate}
              claimCount={deal.claimCount ?? 0}
              isTrending={deal.isTrending ?? false}
              isSaved={true}
              isCurated={deal.isCurated ?? false}
              isVerified={deal.isVerified ?? false}
              isLocalBusiness={(deal as any).isLocalBusiness ?? false}
              requiresApp={deal.requiresApp ?? false}
              code={deal.code ?? undefined}
              distance={deal.distance ?? undefined}
              onSave={() => handleUnsave(deal.couponId)}
              onViewDeal={() => setSelectedDeal(convertToViewableDeal(deal))}
            />
          </div>
        );
      })}
    </div>
  );

  const EmptyState = ({ title, message, showCTA }: { title: string; message: string; showCTA?: boolean }) => (
    <Card className="p-10 text-center border-dashed border-2">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Bookmark className="w-8 h-8 text-primary animate-pulse-soft" />
      </div>
      <p className="text-base font-bold mb-2">{title}</p>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">{message}</p>
      {showCTA && (
        <Button className="rounded-full" onClick={() => window.location.href = "/"}>
          Browse Deals
        </Button>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-accent px-4 pt-10 pb-14">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white font-display">Saved Deals</h1>
          </div>
          <p className="text-white/70 text-sm">
            {savedDeals.length} {savedDeals.length === 1 ? "deal" : "deals"} saved
          </p>
        </div>
      </div>

      {/* Tabs — overlap header */}
      <div className="max-w-md mx-auto px-4 -mt-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full rounded-xl shadow-md bg-card p-1 h-auto">
            <TabsTrigger
              value="all"
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm py-2"
              data-testid="tab-all-saved"
            >
              All ({savedDeals.length})
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm py-2"
              data-testid="tab-active"
            >
              Active ({activeDeals.length})
            </TabsTrigger>
            <TabsTrigger
              value="expired"
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm py-2"
              data-testid="tab-expired"
            >
              Expired ({expiredDeals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-5">
            {savedDeals.length === 0 ? (
              <EmptyState
                title="No saved deals yet"
                message="Tap the heart icon on any deal to save it here for quick access"
                showCTA
              />
            ) : renderDealList(savedDeals)}
          </TabsContent>

          <TabsContent value="active" className="mt-5">
            {activeDeals.length === 0 ? (
              <EmptyState
                title="No active saved deals"
                message="All your saved deals have expired, or you haven't saved any yet"
              />
            ) : renderDealList(activeDeals)}
          </TabsContent>

          <TabsContent value="expired" className="mt-5">
            {expiredDeals.length === 0 ? (
              <EmptyState
                title="No expired deals"
                message="Expired deals will appear here for your reference"
              />
            ) : renderDealList(expiredDeals)}
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
