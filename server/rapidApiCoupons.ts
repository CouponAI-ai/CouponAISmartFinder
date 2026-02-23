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
  Walmart: ["walmart", "wal-mart", "walmart supercenter"],
  Subway: ["subway", "subway restaurant", "subway sandwiches"],
  "Domino's": ["domino's", "dominos", "domino's pizza", "dominos pizza"],
  Sonic: ["sonic", "sonic drive-in", "sonic drive in"],
  "Dollar General": ["dollar general", "dg"],
  "Dollar Tree": ["dollar tree", "dollartree"],
  Walgreens: ["walgreens", "walgreen's"],
  CVS: ["cvs", "cvs pharmacy", "cvs health"],
  Target: ["target", "supertarget", "super target"],
  "Taco Bell": ["taco bell", "tacobell"],
  "Wendy's": ["wendy's", "wendys"],
  "Burger King": ["burger king", "bk"],
  "Chick-fil-A": ["chick-fil-a", "chickfila", "chick fil a"],
  Starbucks: ["starbucks", "starbucks coffee"],
  "Dunkin'": ["dunkin'", "dunkin", "dunkin donuts", "dunkin' donuts"],
  "Pizza Hut": ["pizza hut", "pizzahut"],
  KFC: ["kfc", "kentucky fried chicken"],
  Popeyes: ["popeyes", "popeye's", "popeyes louisiana kitchen"],
  "Arby's": ["arby's", "arbys"],
  "Papa John's": ["papa john's", "papa johns", "papajohns"],
  "Little Caesars": ["little caesars", "little caesar's", "little ceasars"],
  "Panda Express": ["panda express", "panda"],
  "Jimmy John's": ["jimmy john's", "jimmy johns", "jimmyjohns", "jj"],
  Chipotle: ["chipotle", "chipotle mexican grill"],
  "Five Guys": ["five guys", "five guys burgers"],
  "Raising Cane's": ["raising cane's", "raising canes", "canes"],
  Wingstop: ["wingstop", "wing stop"],
  "Buffalo Wild Wings": ["buffalo wild wings", "bdubs", "bww"],
  "Applebee's": ["applebee's", "applebees"],
  "Olive Garden": ["olive garden"],
  "Red Lobster": ["red lobster", "redlobster"],
  "Denny's": ["denny's", "dennys"],
  IHOP: ["ihop", "international house of pancakes"],
  "Waffle House": ["waffle house"],
  "Cracker Barrel": ["cracker barrel"],
  "Chili's": ["chili's", "chilis"],
  "Outback Steakhouse": ["outback", "outback steakhouse"],
  "Texas Roadhouse": ["texas roadhouse"],
  "The Home Depot": ["home depot", "the home depot", "homedepot"],
  "Lowe's": ["lowe's", "lowes"],
  "Best Buy": ["best buy", "bestbuy"],
  Costco: ["costco", "costco wholesale"],
  "Sam's Club": ["sam's club", "sams club"],
  Kroger: ["kroger", "krogers"],
  Safeway: ["safeway"],
  Publix: ["publix"],
  "Whole Foods": ["whole foods", "whole foods market"],
  "Trader Joe's": ["trader joe's", "trader joes"],
  Aldi: ["aldi"],
  "7-Eleven": ["7-eleven", "7 eleven", "seven eleven", "7eleven"],
  "Circle K": ["circle k", "circlek"],
  Shell: ["shell", "shell gas"],
  ExxonMobil: ["exxon", "exxonmobil", "mobil"],
  Chevron: ["chevron"],
  BP: ["bp", "british petroleum"],
  Amazon: ["amazon", "amazon.com"],
  eBay: ["ebay"],
  Nike: ["nike", "nike.com"],
  Adidas: ["adidas"],
  "Foot Locker": ["foot locker", "footlocker"],
  "Finish Line": ["finish line"],
  "Old Navy": ["old navy", "oldnavy"],
  Gap: ["gap", "gap inc"],
  "H&M": ["h&m", "hm", "h and m"],
  "Forever 21": ["forever 21", "forever21"],
  "Macy's": ["macy's", "macys"],
  "Kohl's": ["kohl's", "kohls"],
  JCPenney: ["jcpenney", "jc penney", "penneys"],
  Nordstrom: ["nordstrom", "nordstrom rack"],
  Sephora: ["sephora"],
  Ulta: ["ulta", "ulta beauty"],
  "Bath & Body Works": ["bath & body works", "bath and body works", "bbw"],
  "Victoria's Secret": ["victoria's secret", "victorias secret", "vs"],
  GameStop: ["gamestop", "game stop"],
  AutoZone: ["autozone", "auto zone"],
  "O'Reilly Auto Parts": ["o'reilly", "oreilly", "o'reilly auto parts"],
  "Advance Auto Parts": ["advance auto parts", "advance auto"],
  PetSmart: ["petsmart", "pet smart"],
  Petco: ["petco"],
  "Office Depot": ["office depot", "officedepot"],
  Staples: ["staples"],
  "Bed Bath & Beyond": ["bed bath & beyond", "bed bath and beyond", "bbb"],
  Michaels: ["michaels", "michael's"],
  "Hobby Lobby": ["hobby lobby"],
  Joann: ["joann", "jo-ann", "joann fabrics"],
  "Dick's Sporting Goods": ["dick's", "dicks", "dick's sporting goods"],
  "Academy Sports": ["academy", "academy sports", "academy sports + outdoors"],
  REI: ["rei", "rei co-op"],
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
    if (
      aliases.some(
        (alias) => normalized.includes(alias) || alias.includes(normalized),
      )
    ) {
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
        name: "Get Promo Codes - /codes",
      },
      {
        url: "https://get-promo-codes.p.rapidapi.com/promos",
        host: "get-promo-codes.p.rapidapi.com",
        name: "Get Promo Codes - /promos",
      },
      {
        url: "https://get-promo-codes.p.rapidapi.com/coupons",
        host: "get-promo-codes.p.rapidapi.com",
        name: "Get Promo Codes - /coupons",
      },
      {
        url: "https://get-promo-codes.p.rapidapi.com/deals",
        host: "get-promo-codes.p.rapidapi.com",
        name: "Get Promo Codes - /deals",
      },
      {
        url: "https://get-promo-codes.p.rapidapi.com/",
        host: "get-promo-codes.p.rapidapi.com",
        name: "Get Promo Codes - root",
      },
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying RapidAPI endpoint: ${endpoint.name}`);
        const response = await axios.get(endpoint.url, {
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": endpoint.host,
          },
          timeout: 15000,
        });

        // Handle different response formats
        let data = response.data;

        // Some APIs wrap data in a results/data object
        if (data && typeof data === "object") {
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
            store:
              item.store ||
              item.merchant ||
              item.brand ||
              item.retailer ||
              item.company ||
              "Unknown Store",
            storeLogo: item.logo || item.image || item.merchant_logo || null,
            code:
              item.code ||
              item.coupon_code ||
              item.promo_code ||
              item.couponCode ||
              "",
            title:
              item.title ||
              item.offer ||
              item.name ||
              item.description ||
              "Special Offer",
            description:
              item.description ||
              item.details ||
              item.title ||
              item.terms ||
              "",
            discount:
              item.discount ||
              item.savings ||
              item.discount_amount ||
              extractDiscount(item.title || item.description || ""),
            category: item.category || item.type || "General",
            verified: item.verified !== false && item.is_verified !== false,
            expirationDate:
              item.expiration_date ||
              item.expires ||
              item.end_date ||
              item.expiry ||
              null,
            url:
              item.url ||
              item.link ||
              item.affiliate_link ||
              item.redirect_url ||
              null,
            source: `RapidAPI - ${endpoint.name}`,
          }));

          const validCoupons = coupons.filter(
            (c: RapidApiCoupon) => c.code && c.code.length > 0,
          );
          console.log(
            `Fetched ${validCoupons.length} coupons from ${endpoint.name}`,
          );

          if (validCoupons.length > 0) {
            return validCoupons;
          }
        }
      } catch (endpointError: any) {
        const status = endpointError.response?.status;
        const message = endpointError.message;
        console.log(
          `RapidAPI endpoint ${endpoint.name} error: ${status || message}`,
        );

        // 403 = not subscribed, 401 = invalid key, 429 = rate limit
        if (status === 403) {
          console.log(
            `Note: You may need to subscribe to "${endpoint.name}" on RapidAPI`,
          );
        }
        continue;
      }
    }

    console.log(
      "No coupons fetched from RapidAPI. Make sure you've subscribed to a coupon API on RapidAPI.",
    );
    return [];
  } catch (error: any) {
    console.error("RapidAPI fetch error:", error.message);
    return [];
  }
}

// Fetch coupons from LinkMyDeals
async function fetchFromLinkMyDeals(): Promise<RapidApiCoupon[]> {
  const apiKey = process.env.LINKMYDEALS_API_KEY;

  if (!apiKey) {
    console.log("LinkMyDeals API key not configured");
    return [];
  }

  try {
    console.log("Trying LinkMyDeals endpoint: getOffers");
    const response = await axios.get("https://feed.linkmydeals.com/getOffers/", {
      params: {
        API_KEY: apiKey,
        format: "json",
      },
      timeout: 15000,
    });

    const data = response.data;

    // The API returns { result: true, offers: [...] } based on current live test
    const isSuccess = data.Result === true || data.result === true;
    const offersArray = data.Offers || data.offers;

    const decodeHtmlEntities = (text: string): string => {
      if (!text) return text;
      return text
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'");
    };

    if (data && isSuccess && Array.isArray(offersArray)) {
      const coupons = offersArray.map((item: any, index: number) => {
        // Handle both Title Case and lowercase keys from the API
        const title = decodeHtmlEntities(item["Title"] || item["title"] || item["Offer Text"] || item["offer_text"] || "Special Offer");
        const desc = decodeHtmlEntities(item["Description"] || item["description"] || "");

        return {
          id: item["lmd_id"]?.toString() || `lmd-${index}`,
          store: item["Store"] || item["store"] || "Unknown Store",
          storeLogo: item["Image Url"] || item["image_url"] || null,
          code: item["Code"] || item["code"] || "",
          title: title,
          description: desc,
          discount: decodeHtmlEntities(item["Offer Value"] || item["offer_value"] || extractDiscount(title)),
          category: item["Categories"] || item["categories"] || "General",
          verified: true,
          expirationDate: item["End Date"] || item["end_date"] || null,
          url: item["URL"] || item["url"] || item["Affiliate Link"] || null,
          source: "LinkMyDeals",
        };
      });

      // Valid coupons must have some content
      const validCoupons = coupons.filter(
        (c: RapidApiCoupon) => c.title && c.title.length > 0,
      );
      console.log(`Fetched ${validCoupons.length} coupons from LinkMyDeals`);

      return validCoupons;
    } else {
      // Possible error returned by API
      console.log("LinkMyDeals returned unexpected data format:", typeof data === 'string' ? data.substring(0, 100) : "Not JSON array");
      return [];
    }
  } catch (error: any) {
    console.error("LinkMyDeals fetch error:", error.message);
    return [];
  }
}

// Extract discount from title if not provided
function extractDiscount(title: string): string {
  const percentMatch = title.match(/(\d+)%\s*(off|discount)/i);
  if (percentMatch) return `${percentMatch[1]}% OFF`;

  const dollarMatch = title.match(
    /\$(\d+(?:\.\d{2})?)\s*(off|discount|savings)/i,
  );
  if (dollarMatch) return `$${dollarMatch[1]} OFF`;

  const bogoMatch = title.match(/buy\s*\d*\s*get\s*\d*/i);
  if (bogoMatch) return "BOGO";

  return "Special Offer";
}

// Fetch coupons from Amazon RapidAPI
async function fetchFromAmazon(): Promise<RapidApiCoupon[]> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    console.log("RapidAPI key not configured");
    return [];
  }

  try {
    console.log("Trying Amazon Coupon API endpoint");
    const response = await axios.get("https://get-amazon-coupon.p.rapidapi.com/amazon/coupon/", {
      params: {
        start_date: "2023-10-01",
        page: "1",
        sort: "addtime_desc",
      },
      headers: {
        "x-rapidapi-host": "get-amazon-coupon.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      timeout: 15000,
    });

    const data = response.data;

    if (data && data.data && Array.isArray(data.data)) {
      const decodeHtmlEntities = (text: string): string => {
        if (!text) return text;
        return text
          .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
          .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&#39;/g, "'");
      };

      const coupons = data.data.map((item: any, index: number) => {
        const title = decodeHtmlEntities(item.title || "Amazon Deal");
        // Only include "CODE: X" if the code isn't a phrase like "Not need code"
        const hasCode = item.coupon_code && !item.coupon_code.toLowerCase().includes("not need");

        return {
          id: item.id?.toString() || `amazon-${index}`,
          store: "Amazon",
          storeLogo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
          code: hasCode ? item.coupon_code : "",
          title: title,
          description: item.original_price ? `Was ${item.currency}${item.original_price}, Now ${item.currency}${item.price}` : "",
          discount: item.percent || (item.price ? `${item.currency}${item.price}` : "Special Offer"),
          category: "Retail", // Amazon spans all categories, keeping general
          verified: true,
          expirationDate: item.end_time || null,
          url: item.url || null,
          source: "Amazon Coupons API",
        };
      });

      console.log(`Fetched ${coupons.length} coupons from Amazon API`);
      return coupons;
    } else {
      console.log("Amazon API returned unexpected data format");
      return [];
    }
  } catch (error: any) {
    console.error("Amazon API fetch error:", error.message);
    if (error.response?.status === 403) {
      console.log(`Note: You may need to subscribe to "Get Amazon Coupon" on RapidAPI`);
    }
    return [];
  }
}

// Fetch coupons from Apify Actor (CouponCodes.store)
async function fetchFromApify(): Promise<RapidApiCoupon[]> {
  const token = process.env.APIFY_API_TOKEN;

  if (!token) {
    console.log("Apify API token not configured");
    return [];
  }

  try {
    console.log("Trying Apify Actor endpoint (CouponCodes.store)");

    // Dynamically import to avoid missing module errors at startup if uninstalled
    const { ApifyClient } = await import('apify-client');
    const client = new ApifyClient({ token });

    // We limit dataset pulling to top 50 to avoid massive latency on UI load
    // For a real prod app Webhooks or DB sync is better
    const input = { "Url": "https://www.couponcodes.store/" };
    const run = await client.actor("HT0HgHEfSzfm9Tk25").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 50 });

    if (items && Array.isArray(items)) {
      const coupons = items.map((item: any, index: number) => {
        // Extract a store name from title (heuristics)
        let storeName = "CouponCodes.store";
        const titleWords = item.title?.split(" ") || [];
        if (titleWords.length > 2) {
          // Trying to guess store name from prefixes like "90% Off Nero..."
          storeName = titleWords.slice(titleWords.findIndex((w: string) => w.toLowerCase() === 'off') + 1, titleWords.findIndex((w: string) => w.toLowerCase() === 'off') + 3).join(" ") || "Online Store";
          // Cleanup
          storeName = storeName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
          if (!storeName || storeName.toLowerCase() === 'promo code') storeName = "Web Deal";
        }

        return {
          id: item.coupon_id?.toString() || `apify-${run.id}-${index}`,
          store: storeName,
          storeLogo: undefined,
          code: item.code || "",
          title: item.title || "Special Deal",
          description: `Extracted via Apify (${item.type || 'deal'})`,
          discount: extractDiscount(item.title || ""),
          category: "Online",
          verified: true,
          expirationDate: undefined,
          url: item.site_link || undefined,
          source: "CouponCodes.store",
        };
      });

      console.log(`Fetched ${coupons.length} coupons from Apify Actor`);
      return coupons;
    } else {
      console.log("Apify returned unexpected dataset format");
      return [];
    }
  } catch (error: any) {
    console.error("Apify API fetch error:", error.message);
    return [];
  }
}

// Fetch coupons from ScrapingBee (Generic extraction example)
async function fetchFromScrapingbee(): Promise<RapidApiCoupon[]> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;

  if (!apiKey) {
    console.log("ScrapingBee API key not configured");
    return [];
  }

  try {
    console.log("Trying ScrapingBee API endpoint");

    const extractRules = {
      "coupons": {
        "selector": ".coupon-item, article, .offer, .deal-card",
        "type": "list",
        "output": {
          "title": "h2, h3, .title, .offer-title, .deal-title",
          "code": ".code, .promo-code, .coupon-code",
          "store": ".store-name, .brand, .merchant"
        }
      }
    };

    const response = await axios.get("https://app.scrapingbee.com/api/v1", {
      params: {
        api_key: apiKey,
        url: "https://www.couponcodes.store/",
        render_js: "false",
        extract_rules: JSON.stringify(extractRules)
      },
      timeout: 15000,
    });

    const data = response.data;

    if (data && data.coupons && Array.isArray(data.coupons)) {
      const coupons = data.coupons.map((item: any, index: number) => {
        const title = item.title || "Scraped Deal";

        return {
          id: `sb-${Date.now()}-${index}`,
          store: item.store || "Online Store",
          storeLogo: undefined,
          code: item.code || "",
          title: title,
          description: "Sourced via ScrapingBee",
          discount: extractDiscount(title),
          category: "Online",
          verified: true,
          expirationDate: undefined,
          url: undefined,
          source: "ScrapingBee",
        };
      });

      // Filter out deals with basically no data
      const validCoupons = coupons.filter((c: any) => c.title !== "Scraped Deal" || c.code !== "");
      console.log(`Fetched ${validCoupons.length} coupons from ScrapingBee`);
      return validCoupons;
    } else {
      console.log("ScrapingBee returned unexpected dataset format");
      return [];
    }
  } catch (error: any) {
    console.error("ScrapingBee API fetch error:", error.message);
    return [];
  }
}

// Get coupons with caching
// IMPORTANT: We cache even empty results to avoid burning rate limit quota
// (Unless forceRefresh is true, which forces an API hit to clear an accidental empty cache)
export async function getCouponsFromApi(forceRefresh = false): Promise<RapidApiCoupon[]> {
  const now = Date.now();

  // Return cached data if still valid (even if empty) unless forcing a refresh
  if (!forceRefresh && couponCache && now - couponCache.lastFetched < CACHE_DURATION_MS) {
    if (couponCache.coupons.length > 0) {
      console.log(`Returning ${couponCache.coupons.length} cached coupons`);
    } else {
      console.log(
        "Returning cached empty result (API was rate limited, will retry in 24h)",
      );
    }
    return couponCache.coupons;
  }

  // Fetch fresh data
  console.log("Fetching fresh coupons from external APIs...");
  const [rapidApiCoupons, lmdCoupons, amazonCoupons, apifyCoupons, sbCoupons] = await Promise.all([
    fetchFromRapidApi(),
    fetchFromLinkMyDeals(),
    fetchFromAmazon(),
    fetchFromApify(),
    fetchFromScrapingbee(),
  ]);

  const combinedCoupons = [...rapidApiCoupons, ...lmdCoupons, ...amazonCoupons, ...apifyCoupons, ...sbCoupons];

  // Cache the result even if empty (to prevent repeated API calls when rate limited)
  couponCache = {
    coupons: combinedCoupons,
    lastFetched: now,
    source: combinedCoupons.length > 0 ? "External APIs" : "External APIs (rate limited / no data)",
  };

  if (combinedCoupons.length === 0) {
    console.log(
      "Cached empty result - will not retry API for 24 hours to respect rate limits",
    );
  }

  return combinedCoupons;
}

// Get coupons for a specific store/brand
export async function getCouponsForStore(
  storeName: string,
): Promise<RapidApiCoupon[]> {
  const coupons = await getCouponsFromApi();
  const matchingBrand = findMatchingBrand(storeName);

  if (!matchingBrand) {
    return [];
  }

  return coupons.filter((coupon) => {
    const couponBrand = findMatchingBrand(coupon.store);
    return couponBrand === matchingBrand;
  });
}

// Get all unique stores that have coupons
export async function getStoresWithCoupons(): Promise<string[]> {
  const coupons = await getCouponsFromApi();
  const stores = new Set<string>();

  coupons.forEach((coupon) => {
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

  return coupons.filter(
    (coupon) =>
      coupon.store.toLowerCase().includes(lowerQuery) ||
      coupon.title.toLowerCase().includes(lowerQuery) ||
      coupon.description.toLowerCase().includes(lowerQuery) ||
      coupon.category.toLowerCase().includes(lowerQuery),
  );
}

// Get coupons by category
export async function getCouponsByCategory(
  category: string,
): Promise<RapidApiCoupon[]> {
  const coupons = await getCouponsFromApi();
  const lowerCategory = category.toLowerCase();

  return coupons.filter((coupon) =>
    coupon.category.toLowerCase().includes(lowerCategory),
  );
}

// Clear the cache (for testing or manual refresh)
export function clearCouponCache(): void {
  couponCache = null;
  console.log("Coupon cache cleared");
}

// Check if at least one external API is configured
export function isRapidApiConfigured(): boolean {
  return !!process.env.RAPIDAPI_KEY || !!process.env.LINKMYDEALS_API_KEY;
}
