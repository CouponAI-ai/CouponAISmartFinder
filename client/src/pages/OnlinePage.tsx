import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, AlertCircle, Heart, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DealDetailModal from "@/components/DealDetailModal";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import type { Coupon, SavedDeal } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OnlinePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDeal, setSelectedDeal] = useState<Coupon | null>(null);
    const { toast } = useToast();

    const { data: savedDeals = [] } = useQuery<SavedDeal[]>({
        queryKey: ["/api/saved-deals"],
    });

    const savedDealIds = new Set(savedDeals.map((sd) => sd.couponId));

    // Fetch from the RapidAPI Coupons endpoint
    const onlineDealsQuery = useQuery<{
        count: number;
        source: string;
        coupons: any[];
    }>({
        queryKey: ['/api/coupons/rapidapi-coupons?limit=500&refresh=true'],
    });

    const onlineDeals = onlineDealsQuery.data?.coupons || [];

    // Filter deals based on the search input
    const searchFilteredDeals = onlineDeals.filter(deal => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return (
                deal.store.toLowerCase().includes(query) ||
                deal.title.toLowerCase().includes(query) ||
                deal.description?.toLowerCase().includes(query) ||
                deal.category?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    // Unique deals logic to avoid pure duplicates
    const filteredDeals = searchFilteredDeals.filter((deal, index, array) => {
        const dealCode = deal.code || '';
        const brandName = deal.store.toLowerCase();

        const firstIndex = array.findIndex(d => {
            const dCode = d.code || '';
            const dBrand = d.store.toLowerCase();

            // If both deals have no code, we don't treat them as duplicates 
            // of each other (unless they have the exact same title as well)
            if (dealCode === '' && dCode === '') {
                return dBrand === brandName && d.title === deal.title;
            }

            return dCode === dealCode && dBrand === brandName;
        });

        return firstIndex === index;
    });

    const handleSave = async (deal: any) => {
        const isSaved = savedDealIds.has(deal.id);

        try {
            if (isSaved) {
                await apiRequest("DELETE", `/api/saved-deals/${deal.id}`, undefined);
            } else {
                await apiRequest("POST", "/api/saved-deals", {
                    couponId: deal.id,
                    storeName: deal.store,
                    storeLogoUrl: deal.storeLogo,
                    discountAmount: deal.discount,
                    title: deal.title,
                    description: deal.description,
                    code: deal.code,
                    category: deal.category,
                    expirationDate: deal.expirationDate,
                    claimCount: 0,
                    isTrending: false,
                    isVerified: deal.verified,
                    isCurated: false,
                    requiresApp: false,
                    latitude: 0,
                    longitude: 0,
                    distance: 0,
                    source: deal.source,
                    terms: "",
                    storeType: "Online",
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

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        Online Deals
                    </h1>
                    <ThemeToggle />
                </div>
            </header>

            <div className="px-4 py-6 border-b border-border bg-muted/30">
                <div className="max-w-3xl mx-auto">
                    <p className="text-sm text-muted-foreground mb-4">
                        Browse thousands of global promo codes and deals that you can use anywhere.
                    </p>

                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Search online stores, brands, or deals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Available Online Offers</h2>
                    <Badge variant="secondary">
                        {onlineDealsQuery.isLoading ? (
                            <span className="flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Loading...
                            </span>
                        ) : (
                            `${filteredDeals.length} ${filteredDeals.length === 1 ? "deal" : "deals"}`
                        )}
                    </Badge>
                </div>

                {/* Deals Loading State */}
                {onlineDealsQuery.isLoading && (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="h-32 bg-muted rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!onlineDealsQuery.isLoading && filteredDeals.length === 0 && (
                    <Card className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <h4 className="font-semibold mb-2">No Deals Found</h4>
                        <p className="text-sm text-muted-foreground">
                            {searchQuery
                                ? "Try adjusting your search terms."
                                : "No online deals available perfectly matching your feed right now."}
                        </p>
                    </Card>
                )}

                <div className="space-y-4">
                    {filteredDeals.map((deal) => (
                        <Card
                            key={deal.id}
                            className="p-4 cursor-pointer hover-elevate border border-primary/10 bg-gradient-to-br from-background to-muted/20"
                            onClick={() => setSelectedDeal({
                                id: deal.id,
                                storeName: deal.store,
                                storeLogoUrl: deal.storeLogo,
                                discountAmount: deal.discount,
                                title: deal.title,
                                description: deal.description,
                                code: deal.code,
                                category: deal.category || "Online",
                                expirationDate: deal.expirationDate || null,
                                claimCount: 0,
                                isTrending: false,
                                terms: "",
                                latitude: 0,
                                longitude: 0,
                                distance: 0,
                                isVerified: deal.verified,
                                isCurated: false,
                                requiresApp: false,
                                source: deal.source,
                                address: "Online",
                                storeType: "Online"
                            })}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {deal.storeLogo && (
                                            <img
                                                src={deal.storeLogo}
                                                alt={deal.store}
                                                className="w-6 h-6 object-contain rounded"
                                            />
                                        )}
                                        <p className="font-semibold text-sm">{deal.store}</p>
                                        <Badge variant="outline" className="gap-1 text-xs px-1.5 py-0 h-5">
                                            <Globe className="w-3 h-3" />
                                            Online
                                        </Badge>
                                        {deal.verified && (
                                            <Badge variant="default" className="gap-1 text-xs px-1.5 py-0 h-5 bg-blue-600 hover:bg-blue-700">
                                                {deal.source}
                                            </Badge>
                                        )}
                                    </div>
                                    <h4 className="text-2xl font-bold text-primary mb-1">
                                        {deal.discount}
                                    </h4>
                                    <p className="text-sm mb-2 opacity-90">{deal.title}</p>

                                    {deal.code && (
                                        <div className="inline-flex items-center justify-center bg-primary/10 text-primary px-3 py-1 font-mono text-sm uppercase rounded shadow-inner border border-primary/20 mt-1 mb-2">
                                            CODE: {deal.code}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSave(deal);
                                    }}
                                    className="p-2 rounded-full hover-elevate active-elevate-2 flex-shrink-0"
                                >
                                    <Heart
                                        className={`w-5 h-5 ${savedDealIds.has(deal.id) ? "fill-primary text-primary" : "text-muted-foreground"
                                            }`}
                                    />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
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
