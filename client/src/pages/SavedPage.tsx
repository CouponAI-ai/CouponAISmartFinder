import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Heart, Calendar, MapPin, BadgeCheck, Smartphone, Store, UtensilsCrossed } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const getDaysLeft = (expirationDate?: Date | string | null) => {
    if (!expirationDate) return null;
    const expDate = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
    const now = new Date();
    const diff = expDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires Today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const activeDeals = savedDeals.filter(deal => !isExpired(deal.expirationDate));
  const expiredDeals = savedDeals.filter(deal => isExpired(deal.expirationDate));

  const handleUnsave = async (couponId: string) => {
    try {
      await apiRequest("DELETE", `/api/saved-deals/${couponId}`, undefined);
      
      await queryClient.invalidateQueries({ queryKey: ["/api/saved-deals"] });
      
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

  const convertToViewableDeal = (savedDeal: SavedDeal): Coupon => {
    return {
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
    };
  };

  const renderDealCard = (deal: SavedDeal) => {
    const expired = isExpired(deal.expirationDate);
    const daysLeft = getDaysLeft(deal.expirationDate);
    
    return (
      <Card
        key={deal.id}
        className={`p-4 cursor-pointer hover-elevate ${expired ? 'opacity-60' : ''}`}
        onClick={() => setSelectedDeal(convertToViewableDeal(deal))}
        data-testid={`card-saved-deal-${deal.couponId}`}
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
              {deal.isCurated && deal.isVerified && (
                <Badge variant="default" className="gap-1 text-xs px-1.5 py-0 h-5 bg-green-600 hover:bg-green-700">
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </Badge>
              )}
              {expired && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0 h-5">
                  Expired
                </Badge>
              )}
            </div>
            <h4 className="text-2xl font-bold text-primary mb-1">
              {deal.discountAmount}
            </h4>
            <p className="text-sm mb-2">{deal.title}</p>
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {deal.category}
              </Badge>
              {daysLeft && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {daysLeft}
                </span>
              )}
              {deal.distance !== undefined && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {deal.distance.toFixed(1)} mi
                </span>
              )}
              {deal.requiresApp && (
                <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  App Required
                </span>
              )}
            </div>
          </div>
          <button
            data-testid={`button-unsave-${deal.couponId}`}
            onClick={(e) => {
              e.stopPropagation();
              handleUnsave(deal.couponId);
            }}
            className="p-2 rounded-full hover-elevate active-elevate-2 flex-shrink-0"
          >
            <Heart className="w-5 h-5 fill-primary text-primary" />
          </button>
        </div>
      </Card>
    );
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
              <Card className="p-8 text-center">
                <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">No saved deals yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Tap the heart icon on any deal to save it here for quick access
                </p>
                <Button variant="outline" onClick={() => window.location.href = "/"}>
                  Browse Deals
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {savedDeals.map(deal => renderDealCard(deal))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            {activeDeals.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No active saved deals</p>
                <p className="text-sm text-muted-foreground mt-2">
                  All your saved deals have expired or you haven't saved any yet
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeDeals.map(deal => renderDealCard(deal))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expired" className="mt-6">
            {expiredDeals.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No expired deals</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Expired deals will appear here for reference
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {expiredDeals.map(deal => renderDealCard(deal))}
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
