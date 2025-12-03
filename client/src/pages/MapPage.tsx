import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, AlertCircle, Star, Map, List, BadgeCheck, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MapView from "@/components/MapView";
import DealDetailModal from "@/components/DealDetailModal";
import BottomNav from "@/components/BottomNav";
import type { Coupon } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface GeocodedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  boundingBox?: [number, number, number, number];
}

export default function MapPage() {
  const [zipCode, setZipCode] = useState("");
  const [searchedZip, setSearchedZip] = useState("");
  const [location, setLocation] = useState<GeocodedLocation | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Coupon | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { toast } = useToast();

  const nearbyDealsQuery = useQuery<(Coupon & { distance: number })[]>({
    queryKey: location && searchedZip
      ? [`/api/coupons/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=10&zipCode=${encodeURIComponent(searchedZip)}`]
      : ['/api/coupons/nearby'],
    enabled: !!location && !!searchedZip,
  });

  const recommendedSpotQuery = useQuery<{
    recommended: (Coupon & { distance: number }) | null;
    score: number;
    reason: string;
    totalDealsAnalyzed: number;
  }>({
    queryKey: location && searchedZip
      ? [`/api/coupons/recommended-spot?latitude=${location.latitude}&longitude=${location.longitude}&radius=10&zipCode=${encodeURIComponent(searchedZip)}`]
      : ['/api/coupons/recommended-spot'],
    enabled: !!location && !!searchedZip,
  });

  const nearbyDeals = nearbyDealsQuery.data || [];
  const recommendedSpot = recommendedSpotQuery.data?.recommended;

  const handleSearch = async () => {
    if (!zipCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a zip code",
        variant: "destructive",
      });
      return;
    }

    setIsGeocoding(true);
    try {
      const data = await queryClient.fetchQuery<GeocodedLocation>({
        queryKey: [`/api/geocode/zipcode?zipcode=${encodeURIComponent(zipCode)}`],
      });
      
      setLocation(data);
      setSearchedZip(zipCode);
      
      // Invalidate nearby deals and recommended spot cache to force fresh fetch from Overpass API
      await queryClient.invalidateQueries({ queryKey: ['/api/coupons/nearby'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/coupons/recommended-spot'] });
      
      toast({
        title: "Location found!",
        description: `Showing deals near ${data.city || data.displayName}`,
      });
    } catch (error: any) {
      console.error("Geocoding error:", error);
      
      if (error?.message?.includes("404") || error?.status === 404) {
        toast({
          title: "Zip code not found",
          description: "Please check the zip code and try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to find location. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Find Deals Near You</h1>
          
          {/* Zip Code Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                data-testid="input-zipcode"
                type="text"
                placeholder="Enter ZIP code (e.g., 94102)"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isGeocoding}
              />
            </div>
            <Button
              data-testid="button-search-zipcode"
              onClick={handleSearch}
              disabled={isGeocoding}
            >
              {isGeocoding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {location && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing deals in ZIP code {searchedZip} ({location.city || "your area"})
            </p>
          )}
        </div>
      </header>

      {/* Map and Results */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {!location ? (
          <Card className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Search for Deals</h2>
            <p className="text-muted-foreground">
              Enter your ZIP code above to find nearby stores and restaurants with exclusive deals
            </p>
          </Card>
        ) : (
          <Tabs defaultValue="map" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="map" data-testid="tab-map-view">
                <Map className="w-4 h-4 mr-2" />
                Map View
              </TabsTrigger>
              <TabsTrigger value="list" data-testid="tab-list-view">
                <List className="w-4 h-4 mr-2" />
                List View
              </TabsTrigger>
            </TabsList>

            {/* Map View Tab */}
            <TabsContent value="map" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Map - reduced height on mobile to account for bottom nav (h-16 = 64px) */}
                <div className="h-[400px] lg:h-[600px]">
                  <MapView
                    center={[location.latitude, location.longitude]}
                    zoom={12}
                    deals={nearbyDeals}
                    onViewDeal={setSelectedDeal}
                    boundingBox={location.boundingBox}
                    recommendedSpot={recommendedSpot}
                  />
                </div>

                {/* Deals List (Side Panel) */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
              <h3 className="text-lg font-semibold sticky top-0 bg-background py-2">
                {nearbyDeals.length} {nearbyDeals.length === 1 ? "Deal" : "Deals"} Found
              </h3>
              
              {/* Recommended Spot Banner */}
              {recommendedSpotQuery.isLoading && (
                <Card className="p-4 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Finding the best deal for you...</p>
                  </div>
                </Card>
              )}
              {recommendedSpotQuery.isError && (
                <Card className="p-4 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Unable to load recommendation</p>
                  </div>
                </Card>
              )}
              {recommendedSpot && recommendedSpotQuery.data && !recommendedSpotQuery.isLoading && (
                <Card 
                  className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30 cursor-pointer hover-elevate"
                  onClick={() => setSelectedDeal(recommendedSpot)}
                  data-testid="card-recommended-spot"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Star className="w-5 h-5 fill-primary text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                          Recommended Spot
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {recommendedSpot.storeLogoUrl && (
                          <img
                            src={recommendedSpot.storeLogoUrl}
                            alt={recommendedSpot.storeName}
                            className="w-6 h-6 object-contain rounded"
                          />
                        )}
                        <p className="font-bold text-base">{recommendedSpot.storeName}</p>
                        {(recommendedSpot as any).isCurated && (recommendedSpot as any).isVerified && (
                          <Badge variant="default" className="gap-1 text-xs px-1.5 py-0 h-5 bg-green-600 hover:bg-green-700">
                            <BadgeCheck className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-3xl font-bold text-primary mb-2">
                        {recommendedSpot.discountAmount}
                      </h4>
                      <p className="text-sm mb-2">{recommendedSpot.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {recommendedSpotQuery.data.reason}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          {recommendedSpot.distance.toFixed(1)} miles away • {recommendedSpot.category}
                        </p>
                        {(recommendedSpot as any).requiresApp && (
                          <span className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            App Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              {nearbyDeals.length === 0 ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <h4 className="font-semibold mb-2">No Deals Found</h4>
                  <p className="text-sm text-muted-foreground">
                    We couldn't find any deals in this area. Try a different ZIP code or check back later!
                  </p>
                </Card>
              ) : (
                nearbyDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    className="p-4 cursor-pointer hover-elevate"
                    onClick={() => setSelectedDeal(deal)}
                    data-testid={`card-map-deal-${deal.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {deal.storeLogoUrl && (
                            <img
                              src={deal.storeLogoUrl}
                              alt={deal.storeName}
                              className="w-6 h-6 object-contain rounded"
                            />
                          )}
                          <p className="font-semibold text-sm">{deal.storeName}</p>
                          {/* Verified Badge */}
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
                          <p className="text-xs text-muted-foreground">
                            {deal.distance.toFixed(1)} miles away • {deal.category}
                          </p>
                          {(deal as any).requiresApp && (
                            <span className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                              <Smartphone className="w-3 h-3" />
                              App Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
                </div>
              </div>
            </TabsContent>

            {/* List View Tab */}
            <TabsContent value="list" className="mt-0">
              <div className="max-w-3xl mx-auto space-y-4">
                <h3 className="text-lg font-semibold">
                  {nearbyDeals.length} {nearbyDeals.length === 1 ? "Deal" : "Deals"} Found
                </h3>
                
                {/* Recommended Spot Banner */}
                {recommendedSpotQuery.isLoading && (
                  <Card className="p-4 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Finding the best deal for you...</p>
                    </div>
                  </Card>
                )}
                {recommendedSpotQuery.isError && (
                  <Card className="p-4 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Unable to load recommendation</p>
                    </div>
                  </Card>
                )}
                {recommendedSpot && recommendedSpotQuery.data && !recommendedSpotQuery.isLoading && (
                  <Card 
                    className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30 cursor-pointer hover-elevate"
                    onClick={() => setSelectedDeal(recommendedSpot)}
                    data-testid="card-recommended-spot-list"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Star className="w-5 h-5 fill-primary text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                            Recommended Spot
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {recommendedSpot.storeLogoUrl && (
                            <img
                              src={recommendedSpot.storeLogoUrl}
                              alt={recommendedSpot.storeName}
                              className="w-6 h-6 object-contain rounded"
                            />
                          )}
                          <p className="font-bold text-base">{recommendedSpot.storeName}</p>
                          {(recommendedSpot as any).isCurated && (recommendedSpot as any).isVerified && (
                            <Badge variant="default" className="gap-1 text-xs px-1.5 py-0 h-5 bg-green-600 hover:bg-green-700">
                              <BadgeCheck className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-3xl font-bold text-primary mb-2">
                          {recommendedSpot.discountAmount}
                        </h4>
                        <p className="text-sm mb-2">{recommendedSpot.title}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {recommendedSpotQuery.data.reason}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-muted-foreground">
                            {recommendedSpot.distance.toFixed(1)} miles away • {recommendedSpot.category}
                          </p>
                          {(recommendedSpot as any).requiresApp && (
                            <span className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                              <Smartphone className="w-3 h-3" />
                              App Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {nearbyDeals.length === 0 ? (
                  <Card className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">No Deals Found</h4>
                    <p className="text-sm text-muted-foreground">
                      We couldn't find any deals in this area. Try a different ZIP code or check back later!
                    </p>
                  </Card>
                ) : (
                  nearbyDeals.map((deal) => (
                    <Card
                      key={deal.id}
                      className="p-4 cursor-pointer hover-elevate"
                      onClick={() => setSelectedDeal(deal)}
                      data-testid={`card-list-deal-${deal.id}`}
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
                            {/* Verified Badge */}
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
                            <p className="text-xs text-muted-foreground">
                              {deal.distance.toFixed(1)} miles away • {deal.category}
                            </p>
                            {(deal as any).requiresApp && (
                              <span className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                                <Smartphone className="w-3 h-3" />
                                App Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <DealDetailModal
          open={!!selectedDeal}
          onOpenChange={(open) => !open && setSelectedDeal(null)}
          deal={selectedDeal}
        />
      )}

      <BottomNav />
    </div>
  );
}
