import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, RefreshCw, MapPin, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DealCard from "@/components/DealCard";
import DealDetailModal from "@/components/DealDetailModal";
import BottomNav from "@/components/BottomNav";
import type { Coupon, SavedDeal } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GeocodedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
}

interface AIRecommendation {
  deal: Coupon & { distance: number };
  reason: string;
  score: number;
}

export default function AIPicksPage() {
  const [selectedDeal, setSelectedDeal] = useState<Coupon | null>(null);
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

  const { data: aiPicksData, isLoading, refetch, isRefetching } = useQuery<{
    recommendations: AIRecommendation[];
    aiGenerated: boolean;
  }>({
    queryKey: savedLocation && savedZip
      ? [`/api/coupons/ai-picks?latitude=${savedLocation.latitude}&longitude=${savedLocation.longitude}&zipCode=${encodeURIComponent(savedZip)}`]
      : ['/api/coupons/ai-picks-disabled'],
    enabled: !!savedLocation && !!savedZip,
  });

  const rawAiPicks = aiPicksData?.recommendations || [];
  const isAIGenerated = aiPicksData?.aiGenerated || false;

  const aiPicks = rawAiPicks.filter((pick, index, array) => {
    const dealCode = (pick.deal as any).code || '';
    const brandName = pick.deal.storeName.toLowerCase();
    const firstIndex = array.findIndex(p => {
      const pCode = (p.deal as any).code || '';
      const pBrand = p.deal.storeName.toLowerCase();
      return pCode === dealCode && pBrand === brandName;
    });
    return firstIndex === index;
  });

  const { data: savedDeals = [] } = useQuery<SavedDeal[]>({
    queryKey: ["/api/saved-deals"],
  });

  const savedDealIds = new Set(savedDeals.map((sd) => sd.couponId));

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

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0] as string;
        return key?.includes('/api/coupons/ai-picks');
      }
    });
    await refetch();
    toast({ title: "Refreshed!", description: "AI is analyzing your best deals..." });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent px-4 pt-10 pb-14">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }} />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white font-display">AI Picks</h1>
                <p className="text-white/70 text-xs">Personalized recommendations</p>
              </div>
            </div>
            {savedLocation && (
              <Button
                data-testid="button-refresh"
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefetching || isLoading}
                className="rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
          {savedLocation && savedZip && (
            <p className="text-white/60 text-xs flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Based on deals near {savedLocation.city || savedZip}
            </p>
          )}
        </div>
      </div>

      {/* Content — overlap header */}
      <div className="max-w-3xl mx-auto px-4 -mt-6 pb-4">
        {!savedLocation && (
          <Card className="p-10 text-center border-dashed border-2 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Set Your Location</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-xs mx-auto">
              Enter your ZIP code on the Home page to get AI-powered recommendations
            </p>
            <Button className="rounded-full" onClick={() => window.location.href = "/"}>
              Go to Home
            </Button>
          </Card>
        )}

        {savedLocation && (
          <>
            {isLoading && (
              <div className="space-y-4">
                <Card className="p-4 bg-card shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">AI is analyzing deals...</p>
                      <p className="text-xs text-muted-foreground">Finding the best picks for you</p>
                    </div>
                  </div>
                </Card>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-52 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {!isLoading && aiPicks.length === 0 && (
              <Card className="p-10 text-center border-dashed border-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse-soft" />
                </div>
                <p className="text-base font-bold mb-2">No AI Picks Available</p>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                  We couldn't find enough verified deals in your area to generate recommendations
                </p>
                <Button className="rounded-full" variant="outline" onClick={() => window.location.href = "/"}>
                  Try a Different ZIP Code
                </Button>
              </Card>
            )}

            {!isLoading && aiPicks.length > 0 && (
              <div className="space-y-4">
                {/* AI status */}
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={isAIGenerated ? "default" : "secondary"} className="gap-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    {isAIGenerated ? "AI-Powered Analysis" : "Smart Ranking"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {aiPicks.length} personalized {aiPicks.length === 1 ? "pick" : "picks"}
                  </span>
                </div>

                {/* Top pick callout */}
                {aiPicks[0] && (
                  <Card
                    className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 cursor-pointer hover-elevate mb-1"
                    onClick={() => setSelectedDeal(aiPicks[0].deal)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Star className="w-5 h-5 fill-primary text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">Top AI Pick</span>
                        <p className="font-bold truncate">{aiPicks[0].deal.storeName}</p>
                        <p className="text-2xl font-extrabold text-primary font-display">{aiPicks[0].deal.discountAmount}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {aiPicks.map((pick, index) => (
                  <div key={pick.deal.id} style={{ animationDelay: `${index * 50}ms` }}>
                    <DealCard
                      id={pick.deal.id}
                      storeName={pick.deal.storeName}
                      storeLogoUrl={pick.deal.storeLogoUrl ?? undefined}
                      discountAmount={pick.deal.discountAmount}
                      title={pick.deal.title}
                      description={pick.deal.description ?? undefined}
                      category={pick.deal.category}
                      expirationDate={pick.deal.expirationDate}
                      claimCount={pick.deal.claimCount ?? 0}
                      isTrending={pick.deal.isTrending ?? false}
                      isSaved={savedDealIds.has(pick.deal.id)}
                      isAIPick={true}
                      isCurated={(pick.deal as any).isCurated}
                      isVerified={(pick.deal as any).isVerified}
                      isLocalBusiness={(pick.deal as any).isLocalBusiness}
                      requiresApp={(pick.deal as any).requiresApp}
                      code={(pick.deal as any).code}
                      aiReason={pick.reason}
                      distance={pick.deal.distance}
                      onSave={() => handleSave(pick.deal)}
                      onViewDeal={() => setSelectedDeal(pick.deal)}
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
