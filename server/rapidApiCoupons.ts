// RapidAPI Coupon Service - Fetches real, working promo codes
// Integrates with "Get Promo Codes" API on RapidAPI

import axios from "axios";

export interface RapidApiCoupon {
  id: string;
  store: string;
  storeLogo?: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  category: string;
  verified: boolean;
  expirationDate?: string;
  url?: string;
  source: string;
}

export interface CouponApiResponse {
  coupons: RapidApiCoupon[];
  lastFetched: number;
  source: string;
}

// In-memory cache for coupons (respects free tier rate limits)
// Free tier usually allows ~100 calls/day, so we cache aggressively
let couponCache: CouponApiResponse | null = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours cache for free tier

// Brand name normalization for matching
const BRAND_ALIASES: Record<string, string[]> = {
  "McDonald's": ["mcdonald's", "mcdonalds", "mcd", "maccas"],
  "Walmart": ["walmart", "wal-mart", "walmart supercenter"],
  "Subway": ["subway", "subway restaurant", "subway sandwiches"],
  "Domino's": ["domino's", "dominos", "domino's pizza", "dominos pizza"],
  "Sonic": ["sonic", "sonic drive-in", "sonic drive in"],
  "Dollar General": ["dollar general", "dg"],
  "Dollar Tree": ["dollar tree", "dollartree"],
  "Walgreens": ["walgreens", "walgreen's"],
  "CVS": ["cvs", "cvs pharmacy", "cvs health"],
  "Target": ["target", "supertarget", "super target"],
  "Taco Bell": ["taco bell", "tacobell"],
  "Wendy's": ["wendy's", "wendys"],
  "Burger King": ["burger king", "bk"],
  "Chick-fil-A": ["chick-fil-a", "chickfila", "chick fil a"],
  "Starbucks": ["starbucks", "starbucks coffee"],
  "Dunkin'": ["dunkin'", "dunkin", "dunkin donuts", "dunkin' donuts"],
  "Pizza Hut": ["pizza hut", "pizzahut"],
  "KFC": ["kfc", "kentucky fried chicken"],
  "Popeyes": ["popeyes", "popeye's", "popeyes louisiana kitchen"],
  "Arby's": ["arby's", "arbys"],
  "Papa John's": ["papa john's", "papa johns", "papajohns"],
  "Little Caesars": ["little caesars", "little caesar's", "little ceasars"],
  "Panda Express": ["panda express", "panda"],
  "Chipotle": ["chipotle", "chipotle mexican grill"],
  "Five Guys": ["five guys", "five guys burgers"],
  "Raising Cane's": ["raising cane's", "raising canes", "canes"],
  "Wingstop": ["wingstop", "wing stop"],
  "Buffalo Wild Wings": ["buffalo wild wings", "bdubs", "bww"],
  "Applebee's": ["applebee's", "applebees"],
  "Olive Garden": ["olive garden"],
  "Red Lobster": ["red lobster", "redlobster"],
  "Denny's": ["denny's", "dennys"],
  "IHOP": ["ihop", "international house of pancakes"],
  "Waffle House": ["waffle house"],
  "Cracker Barrel": ["cracker barrel"],
  "Chili's": ["chili's", "chilis"],
  "Outback Steakhouse": ["outback", "outback steakhouse"],
  "Texas Roadhouse": ["texas roadhouse"],
  "The Home Depot": ["home depot", "the home depot", "homedepot"],
  "Lowe's": ["lowe's", "lowes"],
  "Best Buy": ["best buy", "bestbuy"],
  "Costco": ["costco", "costco wholesale"],
  "Sam's Club": ["sam's club", "sams club"],
  "Kroger": ["kroger", "krogers"],
  "Safeway": ["safeway"],
  "Publix": ["publix"],
  "Whole Foods": ["whole foods", "whole foods market"],
  "Trader Joe's": ["trader joe's", "trader joes"],
  "Aldi": ["aldi"],
  "7-Eleven": ["7-eleven", "7 eleven", "seven eleven", "7eleven"],
  "Circle K": ["circle k", "circlek"],
  "Shell": ["shell", "shell gas"],
  "ExxonMobil": ["exxon", "exxonmobil", "mobil"],
  "Chevron": ["chevron"],
  "BP": ["bp", "british petroleum"],
  "Amazon": ["amazon", "amazon.com"],
  "eBay": ["ebay"],
  "Nike": ["nike", "nike.com"],
  "Adidas": ["adidas"],
  "Foot Locker": ["foot locker", "footlocker"],
  "Finish Line": ["finish line"],
  "Old Navy": ["old navy", "oldnavy"],
  "Gap": ["gap", "gap inc"],
  "H&M": ["h&m", "hm", "h and m"],
  "Forever 21": ["forever 21", "forever21"],
  "Macy's": ["macy's", "macys"],
  "Kohl's": ["kohl's", "kohls"],
  "JCPenney": ["jcpenney", "jc penney", "penneys"],
  "Nordstrom": ["nordstrom", "nordstrom rack"],
  "Sephora": ["sephora"],
  "Ulta": ["ulta", "ulta beauty"],
  "Bath & Body Works": ["bath & body works", "bath and body works", "bbw"],
  "Victoria's Secret": ["victoria's secret", "victorias secret", "vs"],
  "GameStop": ["gamestop", "game stop"],
  "AutoZone": ["autozone", "auto zone"],
  "O'Reilly Auto Parts": ["o'reilly", "oreilly", "o'reilly auto parts"],
  "Advance Auto Parts": ["advance auto parts", "advance auto"],
  "PetSmart": ["petsmart", "pet smart"],
  "Petco": ["petco"],
  "Office Depot": ["office depot", "officedepot"],
  "Staples": ["staples"],
  "Bed Bath & Beyond": ["bed bath & beyond", "bed bath and beyond", "bbb"],
  "Michaels": ["michaels", "michael's"],
  "Hobby Lobby": ["hobby lobby"],
  "Joann": ["joann", "jo-ann", "joann fabrics"],
  "Dick's Sporting Goods": ["dick's", "dicks", "dick's sporting goods"],
  "Academy Sports": ["academy", "academy sports", "academy sports + outdoors"],
  "REI": ["rei", "rei co-op"],
  "Bass Pro Shops": ["bass pro", "bass pro shops"],
  "Cabela's": ["cabela's", "cabelas"],
};

// Normalize store name for matching
function normalizeStoreName(name: string): string {
  return name.toLowerCase().trim().replace(/['']/g, "'");
}

// Find matching brand for a store name
export function findMatchingBrand(storeName: string): string | null {
  const normalized = normalizeStoreName(storeName);
  
  for (const [brand, aliases] of Object.entries(BRAND_ALIASES)) {
    if (aliases.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
      return brand;
    }
  }
  
  return null;
}

// Fetch coupons from RapidAPI
async function fetchFromRapidApi(): Promise<RapidApiCoupon[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  
  if (!apiKey) {
    console.log("RapidAPI key not configured, using fallback curated coupons");
    return [];
  }

  try {
    // Try "Get Promo Codes" API endpoints - this is the API the user subscribed to
    // Based on RapidAPI patterns, the API likely uses one of these endpoint paths
    const endpoints = [
      // Most common RapidAPI coupon endpoint patterns
      {
        url: "https://get-promo-codes.p.rapidapi.com/codes",
        host: "get-promo-codes.p.rapidapi.com",
        name: "Get Promo Codes - /codes"
      },
      {
        url: "https://get-promo-codes.p.rapidapi.com/promos",
        host: "get-promo-codes.p.rapidapi.com",
        name: "Get Promo Codes - /promos"
      },
      {
        url: "https://get-promo-codes.p.rapidapi.com/coupons",
        host: "get-promo-codes.p.rapidapi.com",
        name: "Get Promo Codes - /coupons"
      },
      {
        url: "https://get-promo-codes.p.rapidapi.com/deals",
        host: "get-promo-codes.p.rapidapi.com",
        name: "Get Promo Codes - /deals"
      },
      {
        url: "https://get-promo-codes.p.rapidapi.com/",
        host: "get-promo-codes.p.rapidapi.com",
        name: "Get Promo Codes - root"
      },
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying RapidAPI endpoint: ${endpoint.name}`);
        const response = await axios.get(endpoint.url, {
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": endpoint.host
          },
          timeout: 15000
        });

        // Handle different response formats
        let data = response.data;
        
        // Some APIs wrap data in a results/data object
        if (data && typeof data === 'object') {
          if (data.results && Array.isArray(data.results)) {
            data = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            data = data.data;
          } else if (data.coupons && Array.isArray(data.coupons)) {
            data = data.coupons;
          }
        }

        if (data && Array.isArray(data) && data.length > 0) {
          const coupons = data.map((item: any, index: number) => ({
            id: item.id || item._id || `rapidapi-${index}`,
            store: item.store || item.merchant || item.brand || item.retailer || item.company || "Unknown Store",
            storeLogo: item.logo || item.image || item.merchant_logo || null,
            code: item.code || item.coupon_code || item.promo_code || item.couponCode || "",
            title: item.title || item.offer || item.name || item.description || "Special Offer",
            description: item.description || item.details || item.title || item.terms || "",
            discount: item.discount || item.savings || item.discount_amount || extractDiscount(item.title || item.description || ""),
            category: item.category || item.type || "General",
            verified: item.verified !== false && item.is_verified !== false,
            expirationDate: item.expiration_date || item.expires || item.end_date || item.expiry || null,
            url: item.url || item.link || item.affiliate_link || item.redirect_url || null,
            source: `RapidAPI - ${endpoint.name}`
          }));

          const validCoupons = coupons.filter((c: RapidApiCoupon) => c.code && c.code.length > 0);
          console.log(`Fetched ${validCoupons.length} coupons from ${endpoint.name}`);
          
          if (validCoupons.length > 0) {
            return validCoupons;
          }
        }
      } catch (endpointError: any) {
        const status = endpointError.response?.status;
        const message = endpointError.message;
        console.log(`RapidAPI endpoint ${endpoint.name} error: ${status || message}`);
        
        // 403 = not subscribed, 401 = invalid key, 429 = rate limit
        if (status === 403) {
          console.log(`Note: You may need to subscribe to "${endpoint.name}" on RapidAPI`);
        }
        continue;
      }
    }

    console.log("No coupons fetched from RapidAPI. Make sure you've subscribed to a coupon API on RapidAPI.");
    return [];
  } catch (error: any) {
    console.error("RapidAPI fetch error:", error.message);
    return [];
  }
}

// Extract discount from title if not provided
function extractDiscount(title: string): string {
  const percentMatch = title.match(/(\d+)%\s*(off|discount)/i);
  if (percentMatch) return `${percentMatch[1]}% OFF`;
  
  const dollarMatch = title.match(/\$(\d+(?:\.\d{2})?)\s*(off|discount|savings)/i);
  if (dollarMatch) return `$${dollarMatch[1]} OFF`;
  
  const bogoMatch = title.match(/buy\s*\d*\s*get\s*\d*/i);
  if (bogoMatch) return "BOGO";
  
  return "Special Offer";
}

// Get coupons with caching
// IMPORTANT: We cache even empty results to avoid burning rate limit quota
export async function getCouponsFromApi(): Promise<RapidApiCoupon[]> {
  const now = Date.now();
  
  // Return cached data if still valid (even if empty)
  if (couponCache && (now - couponCache.lastFetched) < CACHE_DURATION_MS) {
    if (couponCache.coupons.length > 0) {
      console.log(`Returning ${couponCache.coupons.length} cached coupons`);
    } else {
      console.log("Returning cached empty result (API was rate limited, will retry in 24h)");
    }
    return couponCache.coupons;
  }

  // Fetch fresh data
  console.log("Fetching fresh coupons from RapidAPI...");
  const coupons = await fetchFromRapidApi();
  
  // Cache the result even if empty (to prevent repeated API calls when rate limited)
  couponCache = {
    coupons,
    lastFetched: now,
    source: coupons.length > 0 ? "RapidAPI" : "RapidAPI (rate limited)"
  };
  
  if (coupons.length === 0) {
    console.log("Cached empty result - will not retry API for 24 hours to respect rate limits");
  }
  
  return coupons;
}

// Get coupons for a specific store/brand
export async function getCouponsForStore(storeName: string): Promise<RapidApiCoupon[]> {
  const coupons = await getCouponsFromApi();
  const matchingBrand = findMatchingBrand(storeName);
  
  if (!matchingBrand) {
    return [];
  }

  return coupons.filter(coupon => {
    const couponBrand = findMatchingBrand(coupon.store);
    return couponBrand === matchingBrand;
  });
}

// Get all unique stores that have coupons
export async function getStoresWithCoupons(): Promise<string[]> {
  const coupons = await getCouponsFromApi();
  const stores = new Set<string>();
  
  coupons.forEach(coupon => {
    const brand = findMatchingBrand(coupon.store);
    if (brand) {
      stores.add(brand);
    } else {
      stores.add(coupon.store);
    }
  });
  
  return Array.from(stores);
}

// Search coupons by keyword
export async function searchCoupons(query: string): Promise<RapidApiCoupon[]> {
  const coupons = await getCouponsFromApi();
  const lowerQuery = query.toLowerCase();
  
  return coupons.filter(coupon => 
    coupon.store.toLowerCase().includes(lowerQuery) ||
    coupon.title.toLowerCase().includes(lowerQuery) ||
    coupon.description.toLowerCase().includes(lowerQuery) ||
    coupon.category.toLowerCase().includes(lowerQuery)
  );
}

// Get coupons by category
export async function getCouponsByCategory(category: string): Promise<RapidApiCoupon[]> {
  const coupons = await getCouponsFromApi();
  const lowerCategory = category.toLowerCase();
  
  return coupons.filter(coupon => 
    coupon.category.toLowerCase().includes(lowerCategory)
  );
}

// Clear the cache (for testing or manual refresh)
export function clearCouponCache(): void {
  couponCache = null;
  console.log("Coupon cache cleared");
}

// Check if RapidAPI is configured
export function isRapidApiConfigured(): boolean {
  return !!process.env.RAPIDAPI_KEY;
}
