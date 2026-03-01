import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, RefreshCw, MapPin, Loader2, AlertCircle, BadgeCheck, Smartphone, Star, Heart, Store, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  // Fetch AI picks using saved location
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

  // Deduplicate AI picks - only show each unique coupon code once per brand
  const aiPicks = rawAiPicks.filter((pick, index, array) => {
    const dealCode = (pick.deal as any).code || '';
    const brandName = pick.deal.storeName.toLowerCase();
    
    // Find if this code+brand combination appeared earlier
    const firstIndex = array.findIndex(p => {
      const pCode = (p.deal as any).code || '';
      const pBrand = p.deal.storeName.toLowerCase();
      return pCode === dealCode && pBrand === brandName;
    });
    
    // Only keep if this is the first occurrence
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
      toast({
        title: "Error",
        description: "Failed to update saved deals",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    // Invalidate to force fresh AI analysis
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0] as string;
        return key?.includes('/api/coupons/ai-picks');
      }
    });
    await refetch();
    toast({
      title: "Refreshed!",
      description: "AI is analyzing your best deals...",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 pt-8 pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold">AI Picks</h1>
            </div>
            {savedLocation && (
              <Button
                data-testid="button-refresh"
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefetching || isLoading}
              >
                <RefreshCw className={`w-5 h-5 ${isRefetching ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            AI-powered recommendations from real local deals
          </p>
          {savedLocation && savedZip && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Based on deals near {savedLocation.city || savedZip}
            </p>
          )}
        </div>
      </div>

      {/* AI Picks Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* No location set */}
        {!savedLocation && (
          <Card className="p-8 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Set Your Location</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Enter your ZIP code on the Home page to get AI-powered recommendations for deals near you
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Home
            </Button>
          </Card>
        )}

        {/* Location set - show AI picks */}
        {savedLocation && (
          <>
            {isLoading && (
              <div className="space-y-4">
                <Card className="p-4 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <div>
                      <p className="text-sm font-medium">AI is analyzing deals...</p>
                      <p className="text-xs text-muted-foreground">Finding the best picks for you</p>
                    </div>
                  </div>
                </Card>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {!isLoading && aiPicks.length === 0 && (
              <Card className="p-8 text-center">
                <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">No AI Picks Available</p>
                <p className="text-sm text-muted-foreground mb-6">
                  We couldn't find enough verified deals in your area to generate recommendations
                </p>
                <Button variant="outline" onClick={() => window.location.href = "/"}>
                  Try a Different ZIP Code
                </Button>
              </Card>
            )}

            {!isLoading && aiPicks.length > 0 && (
              <div className="space-y-4">
                {/* AI Status Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={isAIGenerated ? "default" : "secondary"} className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    {isAIGenerated ? "AI-Powered Analysis" : "Smart Ranking"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {aiPicks.length} personalized {aiPicks.length === 1 ? "pick" : "picks"}
                  </span>
                </div>

                {aiPicks.map((pick, index) => (
                  <Card
                    key={pick.deal.id}
                    className={`p-4 cursor-pointer hover-elevate ${index === 0 ? 'bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30' : ''}`}
                    onClick={() => setSelectedDeal(pick.deal)}
                    data-testid={`card-ai-pick-${pick.deal.id}`}
                  >
                    <div className="flex items-start gap-3">
                      {index === 0 && (
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Star className="w-5 h-5 fill-primary text-primary" />
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        {index === 0 && (
                          <span className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 block">
                            Top AI Pick
                          </span>
                        )}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {pick.deal.storeLogoUrl && (
                            <img
                              src={pick.deal.storeLogoUrl}
                              alt={pick.deal.storeName}
                              className="w-6 h-6 object-contain rounded"
                            />
                          )}
                          <p className="font-semibold text-sm">{pick.deal.storeName}</p>
                          {(pick.deal as any).storeType && (
                            <Badge variant="outline" className="gap-1 text-xs px-1.5 py-0 h-5">
                              {(pick.deal as any).storeType === "Store" ? <Store className="w-3 h-3" /> : <UtensilsCrossed className="w-3 h-3" />}
                              {(pick.deal as any).storeType}
                            </Badge>
                          )}
                          {(pick.deal as any).isCurated && (pick.deal as any).isVerified && (
                            <Badge variant="default" className="gap-1 text-xs px-1.5 py-0 h-5 bg-green-600 hover:bg-green-700">
                              <BadgeCheck className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
                          {(pick.deal as any).isLocalBusiness && (
                            <Badge variant="outline" className="gap-1 text-xs px-1.5 py-0 h-5 text-indigo-600 border-indigo-300 dark:text-indigo-400 dark:border-indigo-700">
                              <MapPin className="w-3 h-3" />
                              Local
                            </Badge>
                          )}
                        </div>
                        <h4 className={`font-bold text-primary mb-1 ${index === 0 ? 'text-3xl' : 'text-2xl'}`}>
                          {pick.deal.discountAmount}
                        </h4>
                        <p className="text-sm mb-2">{pick.deal.title}</p>
                        
                        {/* AI Reason */}
                        <p className="text-xs text-muted-foreground mb-2 italic">
                          "{pick.reason}"
                        </p>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {pick.deal.category}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {pick.deal.distance?.toFixed(1)} miles away
                          </p>
                          {(pick.deal as any).requiresApp && (
                            <span className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                              <Smartphone className="w-3 h-3" />
                              App Required
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        data-testid={`button-save-${pick.deal.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(pick.deal);
                        }}
                        className="p-2 rounded-full hover-elevate active-elevate-2 flex-shrink-0"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            savedDealIds.has(pick.deal.id) ? "fill-primary text-primary" : "text-muted-foreground"
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
