import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { getAIRecommendations } from "./ai";
import { calculateDistance, geocodeZipCode, isInZipCode } from "./geocoding";
import { fetchNearbyBusinesses, mapBusinessTypeToCategory, type OverpassBusiness } from "./overpass";
import { findCuratedCoupon, getRandomDeal, type CuratedCoupon } from "./curatedCoupons";
import { getKnownLocationsForZip, matchesKnownLocation, type KnownLocation, KNOWN_LOCATIONS } from "./knownLocations";

export function registerRoutes(app: Express) {
  const server = createServer(app);
  
  // Password verification endpoint
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { password } = req.body;
      const correctPassword = process.env.APP_PASSWORD;

      if (!correctPassword) {
        return res.status(500).json({ error: "App password not configured" });
      }

      if (password === correctPassword) {
        return res.json({ success: true });
      } else {
        return res.status(401).json({ error: "Incorrect password" });
      }
    } catch (error) {
      console.error("Auth verification error:", error);
      res.status(500).json({ error: "Failed to verify password" });
    }
  });
  
  // Geocode zip code to coordinates
  app.get("/api/geocode/zipcode", async (req, res) => {
    try {
      const { zipcode, country = "us" } = req.query;
      
      if (!zipcode) {
        return res.status(400).json({ error: "zipcode query parameter required" });
      }

      const result = await geocodeZipCode(zipcode as string, country as string);
      
      if (!result) {
        return res.status(404).json({ error: "Zip code not found" });
      }

      res.json(result);
    } catch (error) {
      console.error("Geocoding error:", error);
      res.status(500).json({ error: "Failed to geocode zip code" });
    }
  });

  // Get nearby coupons based on location
  app.get("/api/coupons/nearby", async (req, res) => {
    try {
      const { latitude, longitude, radius = "25", zipCode } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          error: "latitude and longitude query parameters required" 
        });
      }

      const userLat = parseFloat(latitude as string);
      const userLon = parseFloat(longitude as string);
      const maxRadiusMiles = parseFloat(radius as string);
      const targetZipCode = zipCode as string | undefined;

      if (isNaN(userLat) || isNaN(userLon) || isNaN(maxRadiusMiles)) {
        return res.status(400).json({ 
          error: "Invalid latitude, longitude, or radius values" 
        });
      }

      // Convert miles to meters for Overpass API (1 mile ≈ 1609 meters)
      // Using 10 miles for faster Overpass queries
      const searchRadiusMiles = Math.min(maxRadiusMiles, 10);
      const maxRadiusMeters = searchRadiusMiles * 1609;

      console.log(`Searching for businesses within ${searchRadiusMiles} miles of (${userLat}, ${userLon})`);
      if (targetZipCode) {
        console.log(`Filtering to only show businesses in ZIP code: ${targetZipCode}`);
      }

      // Fetch real businesses from OpenStreetMap
      let businesses = await fetchNearbyBusinesses(userLat, userLon, maxRadiusMeters);
      
      console.log(`Found ${businesses.length} businesses from Overpass API`);

      // If a ZIP code is specified, filter businesses to only include those in the target ZIP
      if (targetZipCode) {
        const filteredBusinesses: OverpassBusiness[] = [];
        
        for (const business of businesses) {
          const inZip = await isInZipCode(business.latitude, business.longitude, targetZipCode);
          if (inZip) {
            filteredBusinesses.push(business);
          }
        }
        
        console.log(`Filtered to ${filteredBusinesses.length} businesses in ZIP ${targetZipCode}`);
        businesses = filteredBusinesses;
      }

      // Generate sample coupon deals for each real business
      const couponsWithDeals = businesses.map((business) => 
        generateSampleDeal(business, userLat, userLon)
      );

      // Get known locations for the target ZIP code only
      let knownLocationDeals: any[] = [];
      
      if (targetZipCode) {
        // Only get known locations that match the searched ZIP code exactly
        const knownLocations = getKnownLocationsForZip(targetZipCode);
        
        if (knownLocations.length > 0) {
          console.log(`Found ${knownLocations.length} known locations for ZIP ${targetZipCode}`);
          
          // Generate deals from known locations, filtering out duplicates
          for (const location of knownLocations) {
            // Check if this chain already exists in OpenStreetMap results
            if (!isDuplicateLocation(location, businesses)) {
              const deal = generateDealFromKnownLocation(location, userLat, userLon);
              if (deal) {
                knownLocationDeals.push(deal);
              }
            }
          }
          
          console.log(`Added ${knownLocationDeals.length} deals from known locations`);
        }
      }

      // Merge OpenStreetMap deals with known location deals
      const allDeals = [...couponsWithDeals, ...knownLocationDeals];

      // Sort by distance (nearest first)
      const sortedCoupons = allDeals.sort((a, b) => a.distance - b.distance);

      console.log(`Returning ${sortedCoupons.length} total deals`);
      res.json(sortedCoupons);
    } catch (error) {
      console.error("Nearby coupons error:", error);
      res.status(500).json({ error: "Failed to fetch nearby coupons" });
    }
  });

  // Get recommended spot for deals based on location
  app.get("/api/coupons/recommended-spot", async (req, res) => {
    try {
      const { latitude, longitude, radius = "25", zipCode } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          error: "latitude and longitude query parameters required" 
        });
      }

      const userLat = parseFloat(latitude as string);
      const userLon = parseFloat(longitude as string);
      const maxRadiusMiles = parseFloat(radius as string);
      const targetZipCode = zipCode as string | undefined;

      if (isNaN(userLat) || isNaN(userLon) || isNaN(maxRadiusMiles)) {
        return res.status(400).json({ 
          error: "Invalid latitude, longitude, or radius values" 
        });
      }

      // Convert miles to meters for Overpass API
      const searchRadiusMiles = Math.min(maxRadiusMiles, 10);
      const maxRadiusMeters = searchRadiusMiles * 1609;

      // Fetch real businesses from OpenStreetMap
      let businesses = await fetchNearbyBusinesses(userLat, userLon, maxRadiusMeters);

      // If a ZIP code is specified, filter businesses to only include those in the target ZIP
      if (targetZipCode) {
        const filteredBusinesses: OverpassBusiness[] = [];
        
        for (const business of businesses) {
          const inZip = await isInZipCode(business.latitude, business.longitude, targetZipCode);
          if (inZip) {
            filteredBusinesses.push(business);
          }
        }
        
        businesses = filteredBusinesses;
      }

      // Generate deals for analysis
      let deals = businesses.map((business) => 
        generateSampleDeal(business, userLat, userLon)
      );

      // Add known locations for the target ZIP code only
      if (targetZipCode) {
        const knownLocations = getKnownLocationsForZip(targetZipCode);
        for (const location of knownLocations) {
          if (!isDuplicateLocation(location, businesses)) {
            const deal = generateDealFromKnownLocation(location, userLat, userLon);
            if (deal) {
              deals.push(deal);
            }
          }
        }
      }
      
      if (deals.length === 0) {
        return res.json({ recommended: null, reason: "No deals found in this area" });
      }

      // Find the best spot using scoring algorithm
      const recommendedSpot = findRecommendedSpot(deals, userLat, userLon);

      res.json(recommendedSpot);
    } catch (error) {
      console.error("Recommended spot error:", error);
      res.status(500).json({ error: "Failed to find recommended spot" });
    }
  });

  // Get all coupons
  app.get("/api/coupons", async (_req, res) => {
    try {
      const coupons = await storage.getCoupons();
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coupons" });
    }
  });

  // Get trending coupons
  app.get("/api/coupons/trending", async (_req, res) => {
    try {
      const trending = await storage.getTrendingCoupons();
      res.json(trending);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending coupons" });
    }
  });

  // Get AI-recommended coupons
  app.get("/api/coupons/ai-picks", async (_req, res) => {
    try {
      const allCoupons = await storage.getCoupons();
      const preferences = await storage.getUserPreferences();
      const userCategories = preferences?.categories || [];
      
      const recommendations = await getAIRecommendations(allCoupons, userCategories);
      res.json(recommendations);
    } catch (error) {
      console.error("AI picks error:", error);
      res.status(500).json({ error: "Failed to fetch AI recommendations" });
    }
  });

  // Get coupons by category
  app.get("/api/coupons/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const coupons = await storage.getCouponsByCategory(category);
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coupons by category" });
    }
  });

  // Search coupons
  app.get("/api/coupons/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query required" });
      }
      const results = await storage.searchCoupons(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search coupons" });
    }
  });

  // Get specific coupon
  app.get("/api/coupons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await storage.getCouponById(id);
      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coupon" });
    }
  });

  // Claim a coupon
  app.post("/api/coupons/:id/claim", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.claimCoupon(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to claim coupon" });
    }
  });

  // Get saved coupons
  app.get("/api/saved-coupons", async (_req, res) => {
    try {
      const saved = await storage.getSavedCoupons();
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch saved coupons" });
    }
  });

  // Save a coupon
  app.post("/api/saved-coupons", async (req, res) => {
    try {
      const { couponId } = req.body;
      if (!couponId) {
        return res.status(400).json({ error: "couponId required" });
      }
      const saved = await storage.saveCoupon(couponId);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: "Failed to save coupon" });
    }
  });

  // Unsave a coupon
  app.delete("/api/saved-coupons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.unsaveCoupon(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsave coupon" });
    }
  });

  // Get user preferences
  app.get("/api/user-preferences", async (_req, res) => {
    try {
      const preferences = await storage.getUserPreferences();
      res.json(preferences || { id: "default", categories: [], updatedAt: new Date() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // Update user preferences
  app.post("/api/user-preferences", async (req, res) => {
    try {
      const { categories } = req.body;
      if (!Array.isArray(categories)) {
        return res.status(400).json({ error: "categories must be an array" });
      }
      const updated = await storage.updateUserPreferences(categories);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  return server;
}

// Find the recommended spot for deals based on scoring algorithm
// Only recommends verified deals, not sample/generated coupons
function findRecommendedSpot(deals: any[], userLat: number, userLon: number) {
  // Filter to only verified deals
  const verifiedDeals = deals.filter(deal => deal.isVerified === true && deal.isCurated === true);
  
  if (verifiedDeals.length === 0) {
    return { recommended: null, reason: "No verified deals available in this area" };
  }

  // Score each verified deal
  const scoredDeals = verifiedDeals.map(deal => {
    let score = 0;
    
    // 1. Discount Value Score (0-50 points)
    const discountValue = extractDiscountValue(deal.discountAmount);
    score += Math.min(discountValue * 2, 50); // Cap at 50 points
    
    // 2. Distance Score (0-30 points) - closer is better
    const maxDistance = 10; // miles
    const distanceScore = Math.max(0, 30 * (1 - (deal.distance / maxDistance)));
    score += distanceScore;
    
    // 3. Popularity Score (0-20 points) - based on claim count
    const popularityScore = Math.min((deal.claimCount / 500) * 20, 20);
    score += popularityScore;
    
    return {
      deal,
      score,
      discountValue
    };
  });

  // Sort by score (highest first)
  scoredDeals.sort((a, b) => b.score - a.score);
  
  const winner = scoredDeals[0];
  
  // Generate recommendation reason
  const reasons = [];
  if (winner.discountValue >= 20) {
    reasons.push(`Excellent ${winner.deal.discountAmount} discount`);
  } else if (winner.discountValue >= 10) {
    reasons.push(`Great ${winner.deal.discountAmount} deal`);
  } else {
    reasons.push(`Good ${winner.deal.discountAmount} savings`);
  }
  
  if (winner.deal.distance < 2) {
    reasons.push("Very close to you");
  } else if (winner.deal.distance < 5) {
    reasons.push("Nearby location");
  }
  
  if (winner.deal.claimCount > 250) {
    reasons.push("Popular among other users");
  }
  
  return {
    recommended: winner.deal,
    score: Math.round(winner.score),
    reason: reasons.join(" • "),
    totalDealsAnalyzed: deals.length,
    verifiedDealsCount: verifiedDeals.length
  };
}

// Extract numeric discount value for scoring
function extractDiscountValue(discountAmount: string): number {
  // Extract percentage (e.g., "20% OFF" -> 20)
  const percentMatch = discountAmount.match(/(\d+)%/);
  if (percentMatch) {
    return parseInt(percentMatch[1]);
  }
  
  // Extract dollar amount (e.g., "$15 OFF" -> 15)
  const dollarMatch = discountAmount.match(/\$(\d+)/);
  if (dollarMatch) {
    return parseInt(dollarMatch[1]);
  }
  
  // Special cases
  if (discountAmount.includes("BOGO")) return 25; // Treat BOGO as 25% value
  if (discountAmount.includes("FREE")) return 15; // Treat free item as $15 value
  
  return 5; // Default minimal value
}

// Helper function to generate coupon deals from known locations
// These are manually researched locations that supplement OpenStreetMap data
function generateDealFromKnownLocation(location: KnownLocation, userLat: number, userLon: number) {
  const distance = calculateDistance(
    { latitude: userLat, longitude: userLon },
    { latitude: location.latitude, longitude: location.longitude }
  );

  // Check if we have a curated coupon for this known location
  const curatedCoupon = findCuratedCoupon(location.name);
  
  if (curatedCoupon) {
    const deal = getRandomDeal(curatedCoupon);
    
    let expiresAt: Date;
    if (deal.expiresAt) {
      expiresAt = new Date(deal.expiresAt);
    } else {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    const claimCount = 150 + Math.floor(Math.random() * 350);

    return {
      id: location.id,
      storeName: location.name,
      storeLogoUrl: curatedCoupon.logoUrl,
      discountAmount: deal.discountAmount,
      title: deal.title,
      description: deal.description,
      code: deal.code,
      category: curatedCoupon.category,
      expiresAt: expiresAt.toISOString(),
      claimCount,
      trending: claimCount > 250,
      terms: deal.terms,
      latitude: location.latitude,
      longitude: location.longitude,
      distance,
      isVerified: deal.isVerified,
      isCurated: true,
      requiresApp: deal.requiresApp || false,
      source: curatedCoupon.source,
      address: location.address,
    };
  }
  
  return null; // Only return deals if we have curated coupons
}

// Get known locations within the search radius from user's position
function getKnownLocationsInRadius(userLat: number, userLon: number, radiusMiles: number): KnownLocation[] {
  const locationsInRange: KnownLocation[] = [];
  
  for (const location of KNOWN_LOCATIONS) {
    const distance = calculateDistance(
      { latitude: userLat, longitude: userLon },
      { latitude: location.latitude, longitude: location.longitude }
    );
    
    // Include if within the search radius
    if (distance <= radiusMiles) {
      locationsInRange.push(location);
    }
  }
  
  return locationsInRange;
}

// Check if a known location already exists in OpenStreetMap results
// Uses both name matching AND coordinate proximity to avoid duplicates
function isDuplicateLocation(location: KnownLocation, businesses: OverpassBusiness[]): boolean {
  for (const biz of businesses) {
    // Check coordinate proximity (within 0.1 miles = ~160 meters)
    const distance = calculateDistance(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: biz.latitude, longitude: biz.longitude }
    );
    
    if (distance < 0.1) {
      return true; // Same physical location
    }
    
    // Check name matching (case-insensitive, handles variations)
    const locName = location.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const bizName = biz.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (locName.includes(bizName) || bizName.includes(locName)) {
      return true;
    }
    
    // Handle specific brand variations
    if (locName === "walmartupercenter" && bizName.includes("walmart")) return true;
    if (locName === "walmartupercenter" && bizName.includes("walmart")) return true;
    if (locName.includes("sonic") && bizName.includes("sonic")) return true;
    if (locName.includes("whataburger") && bizName.includes("whata")) return true;
    if (locName.includes("hardee") && bizName.includes("hardee")) return true;
  }
  
  return false;
}

// Helper function to generate coupon deals for real businesses
// Uses curated real coupons when available, otherwise generates sample deals
function generateSampleDeal(business: OverpassBusiness, userLat: number, userLon: number) {
  const distance = calculateDistance(
    { latitude: userLat, longitude: userLon },
    { latitude: business.latitude, longitude: business.longitude }
  );

  // Check if we have a curated real coupon for this business
  const curatedCoupon = findCuratedCoupon(business.name);
  
  if (curatedCoupon) {
    // Use REAL curated coupon data
    const deal = getRandomDeal(curatedCoupon);
    
    // Parse expiration date or default to 30 days
    let expiresAt: Date;
    if (deal.expiresAt) {
      expiresAt = new Date(deal.expiresAt);
    } else {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // Generate realistic claim count for popular chains
    const claimCount = 150 + Math.floor(Math.random() * 350);

    return {
      id: `osm-${business.id}`,
      storeName: business.name,
      storeLogoUrl: curatedCoupon.logoUrl,
      discountAmount: deal.discountAmount,
      title: deal.title,
      description: deal.description,
      code: deal.code,
      category: curatedCoupon.category,
      expiresAt: expiresAt.toISOString(),
      claimCount,
      trending: claimCount > 250,
      terms: deal.terms,
      latitude: business.latitude,
      longitude: business.longitude,
      distance,
      isVerified: deal.isVerified,
      isCurated: true, // Flag to indicate this is a real, curated coupon
      requiresApp: deal.requiresApp || false,
      source: curatedCoupon.source, // Source attribution for verified codes
    };
  }

  // FALLBACK: Generate sample deal for non-chain businesses
  const discountTypes = [
    { amount: "$5 OFF", title: "Save $5 on your purchase", code: "SAVE5" },
    { amount: "$10 OFF", title: "Save $10 on orders over $30", code: "SAVE10" },
    { amount: "$15 OFF", title: "Save $15 on orders over $50", code: "SAVE15" },
    { amount: "$20 OFF", title: "Save $20 on orders over $75", code: "SAVE20" },
    { amount: "10% OFF", title: "10% off your entire order", code: "OFF10" },
    { amount: "15% OFF", title: "15% off your entire order", code: "OFF15" },
    { amount: "20% OFF", title: "20% off your entire order", code: "OFF20" },
    { amount: "25% OFF", title: "25% off your entire order", code: "OFF25" },
    { amount: "BOGO", title: "Buy one, get one free", code: "BOGO" },
    { amount: "FREE ITEM", title: "Free appetizer with entree", code: "FREEAPP" },
  ];

  // Select a random discount
  const discount = discountTypes[Math.floor(Math.random() * discountTypes.length)];

  // Generate expiration date (30-90 days from now)
  const daysUntilExpiry = 30 + Math.floor(Math.random() * 60);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysUntilExpiry);

  // Generate claim count (0-500)
  const claimCount = Math.floor(Math.random() * 500);

  // Determine category based on business type
  const category = mapBusinessTypeToCategory(business.type);

  // Generate store logo URL (placeholder - could be enhanced with real logos)
  const logoUrl = generateLogoUrl(business.name, category);

  return {
    id: `osm-${business.id}`,
    storeName: business.name,
    storeLogoUrl: logoUrl,
    discountAmount: discount.amount,
    title: discount.title,
    description: `Exclusive deal at ${business.name}`,
    code: discount.code,
    category,
    expiresAt: expiresAt.toISOString(),
    claimCount,
    trending: claimCount > 250,
    terms: "Sample offer - verify in-store. Cannot be combined with other offers.",
    latitude: business.latitude,
    longitude: business.longitude,
    distance,
    isVerified: false,
    isCurated: false, // Flag to indicate this is a sample deal
    requiresApp: false,
  };
}

// Generate logo URL for stores
function generateLogoUrl(storeName: string, category: string): string {
  // Map common store names to known logos
  const logoMap: Record<string, string> = {
    "walmart": "https://logo.clearbit.com/walmart.com",
    "target": "https://logo.clearbit.com/target.com",
    "kroger": "https://logo.clearbit.com/kroger.com",
    "safeway": "https://logo.clearbit.com/safeway.com",
    "walgreens": "https://logo.clearbit.com/walgreens.com",
    "cvs": "https://logo.clearbit.com/cvs.com",
    "mcdonald": "https://logo.clearbit.com/mcdonalds.com",
    "subway": "https://logo.clearbit.com/subway.com",
    "starbucks": "https://logo.clearbit.com/starbucks.com",
    "wendy": "https://logo.clearbit.com/wendys.com",
    "burger king": "https://logo.clearbit.com/bk.com",
    "taco bell": "https://logo.clearbit.com/tacobell.com",
    "pizza hut": "https://logo.clearbit.com/pizzahut.com",
    "domino": "https://logo.clearbit.com/dominos.com",
    "best buy": "https://logo.clearbit.com/bestbuy.com",
  };

  const lowerName = storeName.toLowerCase();
  
  for (const [key, url] of Object.entries(logoMap)) {
    if (lowerName.includes(key)) {
      return url;
    }
  }

  // Default category-based icons
  const categoryIcons: Record<string, string> = {
    "Food & Dining": "https://api.dicebear.com/7.x/icons/svg?icon=restaurant",
    "Grocery": "https://api.dicebear.com/7.x/icons/svg?icon=shopping-cart",
    "Retail": "https://api.dicebear.com/7.x/icons/svg?icon=shopping-bag",
    "Electronics": "https://api.dicebear.com/7.x/icons/svg?icon=cpu",
    "Health": "https://api.dicebear.com/7.x/icons/svg?icon=heart",
  };

  return categoryIcons[category] || "https://api.dicebear.com/7.x/icons/svg?icon=store";
}

