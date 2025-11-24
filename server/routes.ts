import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { getAIRecommendations } from "./ai";
import { calculateDistance, geocodeZipCode } from "./geocoding";
import { fetchNearbyBusinesses, mapBusinessTypeToCategory, type OverpassBusiness } from "./overpass";

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
      const { latitude, longitude, radius = "25" } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          error: "latitude and longitude query parameters required" 
        });
      }

      const userLat = parseFloat(latitude as string);
      const userLon = parseFloat(longitude as string);
      const maxRadiusMiles = parseFloat(radius as string);

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

      // Fetch real businesses from OpenStreetMap
      const businesses = await fetchNearbyBusinesses(userLat, userLon, maxRadiusMeters);
      
      console.log(`Found ${businesses.length} businesses from Overpass API`);

      // Generate sample coupon deals for each real business
      const couponsWithDeals = businesses.map((business) => 
        generateSampleDeal(business, userLat, userLon)
      );

      // Sort by distance (nearest first)
      const sortedCoupons = couponsWithDeals.sort((a, b) => a.distance - b.distance);

      console.log(`Returning ${sortedCoupons.length} deals`);
      res.json(sortedCoupons);
    } catch (error) {
      console.error("Nearby coupons error:", error);
      res.status(500).json({ error: "Failed to fetch nearby coupons" });
    }
  });

  // Get recommended spot for deals based on location
  app.get("/api/coupons/recommended-spot", async (req, res) => {
    try {
      const { latitude, longitude, radius = "25" } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          error: "latitude and longitude query parameters required" 
        });
      }

      const userLat = parseFloat(latitude as string);
      const userLon = parseFloat(longitude as string);
      const maxRadiusMiles = parseFloat(radius as string);

      if (isNaN(userLat) || isNaN(userLon) || isNaN(maxRadiusMiles)) {
        return res.status(400).json({ 
          error: "Invalid latitude, longitude, or radius values" 
        });
      }

      // Convert miles to meters for Overpass API
      const searchRadiusMiles = Math.min(maxRadiusMiles, 10);
      const maxRadiusMeters = searchRadiusMiles * 1609;

      // Fetch real businesses from OpenStreetMap
      const businesses = await fetchNearbyBusinesses(userLat, userLon, maxRadiusMeters);
      
      if (businesses.length === 0) {
        return res.json({ recommended: null, reason: "No deals found in this area" });
      }

      // Generate deals for analysis
      const deals = businesses.map((business) => 
        generateSampleDeal(business, userLat, userLon)
      );

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
function findRecommendedSpot(deals: any[], userLat: number, userLon: number) {
  if (deals.length === 0) {
    return { recommended: null, reason: "No deals available" };
  }

  // Score each deal
  const scoredDeals = deals.map(deal => {
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
    totalDealsAnalyzed: deals.length
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

// Helper function to generate sample coupon deals for real businesses
function generateSampleDeal(business: OverpassBusiness, userLat: number, userLon: number) {
  const distance = calculateDistance(
    { latitude: userLat, longitude: userLon },
    { latitude: business.latitude, longitude: business.longitude }
  );

  // Generate varied discount types
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
    terms: "Valid for in-store purchases only. Cannot be combined with other offers.",
    latitude: business.latitude,
    longitude: business.longitude,
    distance,
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

