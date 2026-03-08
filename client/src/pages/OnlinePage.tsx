import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertCircle, Heart, Globe, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DealDetailModal from "@/components/DealDetailModal";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import type { Coupon, SavedDeal } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCategoryImage } from "@/lib/categoryImages";

// ── Category normalization ────────────────────────────────────────────────────

const TAG_MAP: Record<string, string> = {
  "fashion": "Fashion",
  "womens apparels": "Fashion",
  "mens apparels": "Fashion",
  "ethnic wear": "Fashion",
  "lingerie": "Fashion",
  "handbags and wallets": "Fashion",
  "jewellery": "Fashion",
  "fashion accessories": "Fashion",
  "eyewear": "Fashion",
  "watches": "Fashion",
  "footwear": "Footwear",
  "kids and toddlers": "Kids & Baby",
  "kids fashion": "Kids & Baby",
  "baby care": "Kids & Baby",
  "maternity": "Kids & Baby",
  "baby gears": "Kids & Baby",
  "baby food": "Kids & Baby",
  "school stuff": "Education",
  "stationary": "Education",
  "arts and crafts": "Education",
  "entertainment": "Entertainment",
  "board games and toys": "Entertainment",
  "cds books and magazine": "Entertainment",
  "merchandise": "Entertainment",
  "gaming consoles": "Entertainment",
  "sports and outdoor": "Sports",
  "sportswear": "Sports",
  "sports gear": "Sports",
  "cycles and electric bikes": "Sports",
  "health and beauty": "Beauty",
  "body care": "Beauty",
  "makeup products": "Beauty",
  "nutrition": "Beauty",
  "sanitary products": "Beauty",
  "home and living": "Home",
  "furniture and decor": "Home",
  "housekeeping": "Home",
  "gardening supplies": "Home",
  "kitchenware": "Home",
  "home appliances": "Electronics",
  "electronics and gadgets": "Electronics",
  "software": "Electronics",
  "vpn": "Electronics",
  "hosting": "Electronics",
  "travel": "Travel",
  "travel gear": "Travel",
  "food and beverages": "Food",
  "snacks and drinks": "Food",
  "grocery": "Food",
  "cake and flowers": "Food",
  "gift items": "Gifts",
  "gift cards": "Gifts",
  "personalised gifts": "Gifts",
  "car and bike accessories": "Automotive",
};

const CATEGORY_PRIORITY = [
  "Food", "Electronics", "Automotive", "Travel", "Sports",
  "Beauty", "Home", "Gifts", "Education", "Entertainment",
  "Footwear", "Kids & Baby", "Fashion",
];

function normalizeDealCategory(raw: string | undefined): string {
  if (!raw) return "Other";
  const lower = raw.toLowerCase();
  // Handle common software/tech categories from ScrapingBee
  if (lower.includes("vpn") || lower.includes("security") || lower.includes("software") || lower.includes("antivirus")) return "Electronics";
  if (lower.includes("hosting") || lower.includes("domain") || lower.includes("web")) return "Electronics";
  const tags = raw.split(",").map(t => t.trim().toLowerCase());
  for (const priority of CATEGORY_PRIORITY) {
    for (const tag of tags) {
      if (TAG_MAP[tag] === priority) return priority;
    }
  }
  for (const tag of tags) {
    const mapped = TAG_MAP[tag];
    if (mapped) return mapped;
  }
  return "Other";
}

// ── US vs International classification ───────────────────────────────────────

const US_BRANDS = new Set([
  // Retail & shopping
  "amazon","walmart","target","costco","best buy","bestbuy","sears","kohl's","kohls",
  "macy's","macys","nordstrom","gap","old navy","banana republic","j.crew","jcrew",
  "forever 21","forever21","h&m","zara","express","ae","american eagle","abercrombie",
  "hollister","victoria's secret","vs","bath & body works","bbw",
  // Food & dining
  "mcdonald's","mcdonalds","subway","dominos","domino's","taco bell","tacobell",
  "wendy's","wendys","burger king","burgerking","pizza hut","pizzahut","kfc",
  "chick-fil-a","chickfila","popeyes","sonic","starbucks","dunkin","dunkin'",
  "chipotle","panda express","pandaexpress","little caesars","papa john's","papajohns",
  "arby's","arbys","jimmy john's","jimmyjohns","dairy queen","dairyqueen","hardee's",
  "hardees","jack in the box","whataburger","five guys","fiveguys","denny's","dennys",
  "cracker barrel","crackerbarrel","ihop","applebee's","applebees","olive garden",
  "outback","red lobster","redlobster","chili's","chilis","texas roadhouse","panera",
  // Automotive
  "autozone","o'reilly","oreilly","jiffy lube","jiffylube","valvoline","pep boys",
  "pepboys","firestone","midas","advance auto","advanceauto","napa auto","napauto",
  // Tech & software (US-based)
  "godaddy","hostgator","bluehost","namecheap","siteground","wix","squarespace",
  "shopify","mailchimp","hubspot","salesforce","adobe","microsoft","apple",
  "spytech","spytechsoftware",
  "norton","mcafee","bitdefender","malwarebytes","avg","avast",
  // Health & pharmacy
  "walgreens","cvs","rite aid","riteaid","1-800-flowers","1800flowers",
  "gnc","vitamin shoppe","vitaminworld",
  // Travel
  "expedia","hotels.com","hotwire","priceline","orbitz","travelocity","kayak",
  "united","delta","southwest","american airlines","jetblue","spirit","frontier",
  "marriott","hilton","hyatt","ihg","wyndham","choice hotels",
  // Entertainment
  "amc","regal","cinemark","fandango","ticketmaster","stubhub","vivid seats",
  "disney","netflix","hulu","spotify","pandora","amazon music",
  // Home & garden
  "home depot","homedepot","lowe's","lowes","ikea","wayfair","overstock",
  "bed bath beyond","williams-sonoma","crate and barrel","pottery barn",
  // Other US services
  "geico","state farm","allstate","progressive","liberty mutual",
  "usps","fedex","ups","dhl",
  "petco","petsmart",
]);

function classifyRegion(storeName: string): "US" | "International" {
  if (!storeName) return "US";
  const lower = storeName.toLowerCase()
    .replace(/\s+coupons?$/i, "")
    .replace(/\s+deals?$/i, "")
    .trim();
  if (US_BRANDS.has(lower)) return "US";
  // Check partial matches for common US brands
  for (const brand of US_BRANDS) {
    if (lower.includes(brand) || brand.includes(lower)) return "US";
  }
  return "International";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnlinePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [regionTab, setRegionTab] = useState<"US" | "International">("US");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Coupon | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: savedDeals = [] } = useQuery<SavedDeal[]>({
    queryKey: ["/api/saved-deals"],
  });

  const savedDealIds = new Set(savedDeals.map((sd) => sd.couponId));

  const onlineDealsQuery = useQuery<{
    count: number;
    source: string;
    coupons: any[];
  }>({
    queryKey: ['/api/coupons/rapidapi-coupons?limit=500&refresh=true'],
  });

  const onlineDeals = onlineDealsQuery.data?.coupons || [];

  // Split deals into US and International
  const { usDeals, intlDeals } = useMemo(() => {
    const us: any[] = [];
    const intl: any[] = [];
    for (const deal of onlineDeals) {
      if (classifyRegion(deal.store) === "US") us.push(deal);
      else intl.push(deal);
    }
    return { usDeals: us, intlDeals: intl };
  }, [onlineDeals]);

  const regionDeals = regionTab === "US" ? usDeals : intlDeals;

  // Derive categories for the current region tab
  const availableCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const deal of regionDeals) {
      const normalized = normalizeDealCategory(deal.category || deal.title);
      if (normalized !== "Other") {
        counts[normalized] = (counts[normalized] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);
  }, [regionDeals]);

  // Reset category when switching tabs
  const switchTab = (tab: "US" | "International") => {
    setRegionTab(tab);
    setSelectedCategory(null);
  };

  // Filter by search + category within the region
  const filteredDeals = useMemo(() => {
    const searched = regionDeals.filter(deal => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          deal.store?.toLowerCase().includes(q) ||
          deal.title?.toLowerCase().includes(q) ||
          deal.description?.toLowerCase().includes(q) ||
          deal.category?.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const categorised = searched.filter(deal => {
      if (!selectedCategory) return true;
      return normalizeDealCategory(deal.category || deal.title) === selectedCategory;
    });

    return categorised.filter((deal, index, array) => {
      const dealCode = deal.code || '';
      const brandName = deal.store?.toLowerCase() || '';
      const firstIndex = array.findIndex(d => {
        const dCode = d.code || '';
        const dBrand = d.store?.toLowerCase() || '';
        if (dealCode === '' && dCode === '') {
          return dBrand === brandName && d.title === deal.title;
        }
        return dCode === dealCode && dBrand === brandName;
      });
      return firstIndex === index;
    });
  }, [regionDeals, searchQuery, selectedCategory]);

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
      toast({ title: "Error", description: "Failed to update saved deals", variant: "destructive" });
    }
  };

  const handleCopy = async (e: React.MouseEvent, deal: any) => {
    e.stopPropagation();
    if (!deal.code) return;
    await navigator.clipboard.writeText(deal.code);
    setCopiedId(deal.id);
    toast({ title: "Code copied!", description: `${deal.code} copied to clipboard` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const buildCoupon = (deal: any): Coupon => ({
    id: deal.id,
    storeName: deal.store,
    storeLogoUrl: deal.storeLogo,
    discountAmount: deal.discount,
    discountPercentage: null,
    title: deal.title,
    description: deal.description,
    code: deal.code,
    category: deal.category || "Online",
    expirationDate: deal.expirationDate || null,
    claimCount: 0,
    isTrending: false,
    termsAndConditions: null,
    latitude: 0,
    longitude: 0,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold">Online Deals</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 bg-card border-b border-border">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              data-testid="input-search-online"
              type="text"
              placeholder="Search stores, brands, or deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-full bg-secondary border-0"
            />
          </div>
        </div>
      </div>

      {/* US / International tabs */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <button
              data-testid="button-region-us"
              onClick={() => switchTab("US")}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${
                regionTab === "US"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              <span className="text-base leading-none">🇺🇸</span>
              United States
              {!onlineDealsQuery.isLoading && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ml-0.5 ${
                  regionTab === "US" ? "bg-white/20" : "bg-muted-foreground/20"
                }`}>
                  {usDeals.length}
                </span>
              )}
            </button>
            <button
              data-testid="button-region-international"
              onClick={() => switchTab("International")}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${
                regionTab === "International"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              International
              {!onlineDealsQuery.isLoading && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ml-0.5 ${
                  regionTab === "International" ? "bg-white/20" : "bg-muted-foreground/20"
                }`}>
                  {intlDeals.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      {(availableCategories.length > 0 || onlineDealsQuery.isLoading) && (
        <div className="bg-card border-b border-border px-4 pb-3 pt-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                  selectedCategory === null
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
                onClick={() => setSelectedCategory(null)}
                data-testid="button-online-category-all"
              >
                All
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  data-testid={`button-online-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                    selectedCategory === cat
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deals list */}
      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* Count row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">
            {selectedCategory ? (
              <span>
                <span className="text-foreground font-semibold">{selectedCategory}</span>
                &nbsp;&mdash; {filteredDeals.length} {filteredDeals.length === 1 ? "deal" : "deals"}
              </span>
            ) : (
              `${filteredDeals.length} ${regionTab === "US" ? "US" : "international"} ${filteredDeals.length === 1 ? "deal" : "deals"}`
            )}
          </p>
          {selectedCategory && (
            <button
              className="text-xs text-primary font-semibold"
              onClick={() => setSelectedCategory(null)}
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {onlineDealsQuery.isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!onlineDealsQuery.isLoading && filteredDeals.length === 0 && (
          <Card className="p-10 text-center border-dashed border-2">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground animate-pulse-soft" />
            </div>
            <h4 className="font-bold text-base mb-2">No Deals Found</h4>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {searchQuery || selectedCategory
                ? "Try adjusting your search or clearing the category filter."
                : regionTab === "US"
                  ? "No US deals available right now. Check the International tab for more deals."
                  : "No international deals available right now. Check the US tab for more deals."}
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                className="mt-4 text-sm text-primary font-semibold"
                onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
              >
                Clear all filters
              </button>
            )}
          </Card>
        )}

        {/* Deal cards */}
        {!onlineDealsQuery.isLoading && filteredDeals.length > 0 && (
          <div className="space-y-4">
            {filteredDeals.map((deal, i) => {
              const isSaved = savedDealIds.has(deal.id);
              const bannerImg = getCategoryImage(normalizeDealCategory(deal.category || deal.title));
              const region = classifyRegion(deal.store);
              return (
                <Card
                  key={deal.id}
                  className="overflow-hidden cursor-pointer hover-elevate animate-fade-in"
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                  onClick={() => setSelectedDeal(buildCoupon(deal))}
                  data-testid={`card-online-deal-${deal.id}`}
                >
                  {/* Banner */}
                  <div className="relative h-16 overflow-hidden">
                    <img src={bannerImg} alt={deal.category || "deal"} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />
                    <div className="absolute top-2 right-3">
                      <span className="text-2xl font-extrabold text-white font-display drop-shadow">
                        {deal.discount}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSave(deal); }}
                      className="absolute top-2 left-3 p-1.5 rounded-full bg-black/30 backdrop-blur-sm hover-elevate active-elevate-2"
                      data-testid={`button-save-online-${deal.id}`}
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? "fill-white text-white" : "text-white"}`} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {deal.storeLogo && (
                            <img src={deal.storeLogo} alt={deal.store} className="w-5 h-5 object-contain rounded flex-shrink-0" />
                          )}
                          <p className="font-bold text-sm truncate">{deal.store}</p>
                          {region === "US" ? (
                            <Badge variant="outline" className="gap-1 text-xs px-1.5 py-0 h-5 flex-shrink-0 text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700">
                              🇺🇸 US
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-xs px-1.5 py-0 h-5 flex-shrink-0">
                              <Globe className="w-3 h-3" />
                              Intl
                            </Badge>
                          )}
                          {normalizeDealCategory(deal.category || deal.title) !== "Other" && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 flex-shrink-0">
                              {normalizeDealCategory(deal.category || deal.title)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm line-clamp-1 text-foreground/80">{deal.title}</p>
                      </div>
                    </div>

                    {/* Code + Copy row */}
                    {deal.code && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-secondary rounded-md px-3 py-1.5 font-mono text-sm font-semibold text-foreground truncate">
                          {deal.code}
                        </div>
                        <button
                          onClick={(e) => handleCopy(e, deal)}
                          data-testid={`button-copy-online-${deal.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-accent text-accent text-xs font-semibold hover-elevate active-elevate-2 flex-shrink-0 transition-colors"
                        >
                          {copiedId === deal.id ? (
                            <><Check className="w-3 h-3" /> Copied</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copy</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
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
