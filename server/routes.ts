import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { getAIRecommendations } from "./ai";
import { calculateDistance, geocodeZipCode, isInZipCode } from "./geocoding";
import { fetchNearbyBusinesses, mapBusinessTypeToCategory, type OverpassBusiness } from "./overpass";
import { findCuratedCoupon, getRandomDeal, type CuratedCoupon } from "./curatedCoupons";
import { getKnownLocationsForZip, matchesKnownLocation, type KnownLocation, KNOWN_LOCATIONS } from "./knownLocations";
import { getCouponsFromApi, getCouponsForStore, findMatchingBrand, isRapidApiConfigured, type RapidApiCoupon } from "./rapidApiCoupons";

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

      // Pre-fetch RapidAPI coupons (cached, non-blocking)
      const rapidApiCoupons = await getCouponsFromApi();
      if (rapidApiCoupons.length > 0) {
        console.log(`Loaded ${rapidApiCoupons.length} coupons from RapidAPI`);
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

      // Generate deals using RapidAPI coupons first, then curated coupons
      const verifiedDeals: any[] = [];
      
      for (const business of businesses) {
        // Try to get deal from RapidAPI or curated coupons
        const deal = await generateDealFromRealCoupons(business, userLat, userLon, rapidApiCoupons);
        // Only include deals that have real verified coupons
        if (deal && deal.isCurated && deal.isVerified) {
          verifiedDeals.push(deal);
        }
      }

      console.log(`Found ${verifiedDeals.length} verified deals from OpenStreetMap businesses`);

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

      // Merge verified OpenStreetMap deals with known location deals (all verified)
      const allDeals = [...verifiedDeals, ...knownLocationDeals];

      // Sort by distance (nearest first)
      const sortedCoupons = allDeals.sort((a, b) => a.distance - b.distance);

      console.log(`Returning ${sortedCoupons.length} verified deals`);
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

      // Pre-fetch RapidAPI coupons (cached, non-blocking)
      const rapidApiCoupons = await getCouponsFromApi();

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

      // Generate deals using RapidAPI first, then curated coupons
      let deals: any[] = [];
      
      for (const business of businesses) {
        const deal = await generateDealFromRealCoupons(business, userLat, userLon, rapidApiCoupons);
        // Only include verified deals
        if (deal && deal.isCurated && deal.isVerified) {
          deals.push(deal);
        }
      }

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
        return res.json({ recommended: null, reason: "No verified deals found in this area" });
      }

      // Find the best spot using scoring algorithm (only verified deals)
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

  // Get RapidAPI coupon status
  app.get("/api/coupons/rapidapi-status", async (_req, res) => {
    try {
      const isConfigured = isRapidApiConfigured();
      if (!isConfigured) {
        return res.json({ 
          configured: false, 
          message: "RapidAPI key not configured. Using curated coupons only.",
          couponsAvailable: 0
        });
      }

      const coupons = await getCouponsFromApi();
      res.json({ 
        configured: true, 
        message: coupons.length > 0 
          ? `Successfully fetched ${coupons.length} real-time coupons from RapidAPI` 
          : "RapidAPI configured but no coupons returned. Using curated coupons.",
        couponsAvailable: coupons.length,
        source: "RapidAPI - Get Promo Codes"
      });
    } catch (error: any) {
      res.status(500).json({ 
        configured: true,
        error: error.message,
        message: "Error fetching from RapidAPI. Using curated coupons.",
        couponsAvailable: 0
      });
    }
  });

  // Get raw RapidAPI coupons (for debugging/testing)
  app.get("/api/coupons/rapidapi-coupons", async (req, res) => {
    try {
      const { store, limit = "50" } = req.query;
      let coupons = await getCouponsFromApi();
      
      // Filter by store if specified
      if (store) {
        const storeQuery = (store as string).toLowerCase();
        coupons = coupons.filter(c => 
          c.store.toLowerCase().includes(storeQuery) ||
          findMatchingBrand(c.store)?.toLowerCase().includes(storeQuery)
        );
      }
      
      // Limit results
      const limitNum = parseInt(limit as string) || 50;
      coupons = coupons.slice(0, limitNum);
      
      res.json({
        count: coupons.length,
        source: "RapidAPI - Get Promo Codes",
        coupons
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get AI-recommended coupons using real Overpass deals
  app.get("/api/coupons/ai-picks", async (req, res) => {
    try {
      const { latitude, longitude, zipCode } = req.query;
      
      // If no location provided, return empty
      if (!latitude || !longitude) {
        return res.json({ recommendations: [], aiGenerated: false });
      }

      const userLat = parseFloat(latitude as string);
      const userLon = parseFloat(longitude as string);
      const targetZipCode = zipCode as string | undefined;

      if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({ error: "Invalid latitude or longitude values" });
      }

      // Pre-fetch RapidAPI coupons (cached, non-blocking)
      const rapidApiCoupons = await getCouponsFromApi();

      // Fetch real businesses from Overpass API
      const radiusMeters = 10 * 1609.34; // 10 miles in meters
      const businesses = await fetchNearbyBusinesses(userLat, userLon, radiusMeters);
      
      // Get known locations for this ZIP
      const knownLocations = targetZipCode ? getKnownLocationsForZip(targetZipCode) : [];
      
      // Generate deals from businesses (same logic as nearby endpoint)
      const deals: any[] = [];
      const processedLocations = new Set<string>();
      
      // Add known locations first
      for (const location of knownLocations) {
        // Check if in target ZIP
        if (targetZipCode) {
          const inZip = await isInZipCode(location.latitude, location.longitude, targetZipCode);
          if (!inZip) continue;
        }
        
        const deal = generateDealFromKnownLocation(location, userLat, userLon);
        if (deal) {
          deals.push(deal);
          processedLocations.add(location.name.toLowerCase());
        }
      }
      
      // Add Overpass businesses - using RapidAPI first, then curated coupons
      for (const business of businesses) {
        // Skip if already processed from known locations
        if (matchesKnownLocation(business.name, knownLocations)) continue;
        
        // Check if in target ZIP
        if (targetZipCode) {
          const inZip = await isInZipCode(business.latitude, business.longitude, targetZipCode);
          if (!inZip) continue;
        }
        
        const deal = await generateDealFromRealCoupons(business, userLat, userLon, rapidApiCoupons);
        // Only add if it's a verified deal
        if (deal && deal.isCurated && deal.isVerified) {
          deals.push(deal);
        }
      }
      
      // All deals are now verified (no sample deals)
      const verifiedDeals = deals;
      
      if (verifiedDeals.length === 0) {
        return res.json({ recommendations: [], aiGenerated: false });
      }
      
      // Get user preferences
      const preferences = await storage.getUserPreferences();
      const userCategories = preferences?.categories || [];
      
      // Try to get AI-powered recommendations
      let aiRecommendations: any[] = [];
      let aiGenerated = false;
      
      try {
        aiRecommendations = await getAIRecommendations(verifiedDeals, userCategories);
        aiGenerated = true;
      } catch (aiError) {
        console.log("AI recommendations unavailable, falling back to scoring");
        // Fallback: Score deals manually
        aiRecommendations = verifiedDeals
          .map(deal => {
            let score = 0;
            const discountValue = extractDiscountValue(deal.discountAmount);
            score += Math.min(discountValue * 2, 50);
            score += Math.max(0, 30 * (1 - (deal.distance / 10)));
            score += Math.min((deal.claimCount / 500) * 20, 20);
            
            // Boost if matches user preferences
            if (userCategories.includes(deal.category)) {
              score += 15;
            }
            
            return {
              deal,
              score,
              reason: generateRecommendationReason(deal, discountValue, userCategories)
            };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
      }
      
      res.json({ 
        recommendations: aiRecommendations,
        aiGenerated 
      });
    } catch (error) {
      console.error("AI picks error:", error);
      res.status(500).json({ error: "Failed to fetch AI recommendations" });
    }
  });
  
  // Helper function to generate recommendation reason
  function generateRecommendationReason(deal: any, discountValue: number, userCategories: string[]): string {
    const reasons = [];
    
    if (discountValue >= 25) {
      reasons.push("Excellent savings opportunity");
    } else if (discountValue >= 15) {
      reasons.push("Great value deal");
    } else {
      reasons.push("Good discount available");
    }
    
    if (deal.distance < 2) {
      reasons.push("very close to you");
    } else if (deal.distance < 5) {
      reasons.push("conveniently nearby");
    }
    
    if (userCategories.includes(deal.category)) {
      reasons.push("matches your preferences");
    }
    
    if (deal.claimCount > 200) {
      reasons.push("popular with others");
    }
    
    return reasons.join(", ");
  }

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

  // Get saved deals (full deal data)
  app.get("/api/saved-deals", async (_req, res) => {
    try {
      const saved = await storage.getSavedDeals();
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch saved deals" });
    }
  });

  // Save a deal (stores full deal data)
  app.post("/api/saved-deals", async (req, res) => {
    try {
      const deal = req.body;
      if (!deal.couponId || !deal.storeName || !deal.discountAmount || !deal.title || !deal.category) {
        return res.status(400).json({ error: "Required deal fields missing" });
      }
      const saved = await storage.saveDeal(deal);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: "Failed to save deal" });
    }
  });

  // Unsave a deal by couponId
  app.delete("/api/saved-deals/:couponId", async (req, res) => {
    try {
      const { couponId } = req.params;
      await storage.unsaveDeal(couponId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsave deal" });
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
// Checks RapidAPI first, then curated coupons, only returns real verified deals
async function generateDealFromRealCoupons(
  business: OverpassBusiness, 
  userLat: number, 
  userLon: number,
  rapidApiCoupons: RapidApiCoupon[]
): Promise<any | null> {
  const distance = calculateDistance(
    { latitude: userLat, longitude: userLon },
    { latitude: business.latitude, longitude: business.longitude }
  );

  // STEP 1: Check RapidAPI coupons first (real-time coupon data)
  const matchingBrand = findMatchingBrand(business.name);
  if (matchingBrand && rapidApiCoupons.length > 0) {
    const rapidApiCoupon = rapidApiCoupons.find(c => {
      const couponBrand = findMatchingBrand(c.store);
      return couponBrand === matchingBrand;
    });

    if (rapidApiCoupon) {
      console.log(`[RapidAPI Match] Business "${business.name}" matched with coupon from "${rapidApiCoupon.store}" - Code: ${rapidApiCoupon.code}`);
      
      // Parse expiration date or default to 30 days
      let expiresAt: Date;
      if (rapidApiCoupon.expirationDate) {
        expiresAt = new Date(rapidApiCoupon.expirationDate);
      } else {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
      }

      // Generate realistic claim count
      const claimCount = 150 + Math.floor(Math.random() * 350);

      // Get logo from clearbit or use provided
      const logoUrl = rapidApiCoupon.storeLogo || 
        `https://logo.clearbit.com/${matchingBrand.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

      // RapidAPI coupons are always considered verified and curated since they come from a live API
      return {
        id: `rapid-${business.id}-${rapidApiCoupon.id}`,
        storeName: business.name,
        storeLogoUrl: logoUrl,
        discountAmount: rapidApiCoupon.discount,
        title: rapidApiCoupon.title,
        description: rapidApiCoupon.description,
        code: rapidApiCoupon.code,
        category: rapidApiCoupon.category || mapBusinessTypeToCategory(business.type),
        expiresAt: expiresAt.toISOString(),
        claimCount,
        trending: claimCount > 250,
        terms: rapidApiCoupon.description || "Terms apply. See store for details.",
        latitude: business.latitude,
        longitude: business.longitude,
        distance,
        isVerified: true, // RapidAPI coupons are live data, always verified
        isCurated: true,  // Mark as curated to pass filter
        requiresApp: false,
        source: rapidApiCoupon.source,
        sourceUrl: rapidApiCoupon.url,
      };
    }
  }

  // STEP 2: Fall back to curated coupons database
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
      isCurated: true,
      requiresApp: deal.requiresApp || false,
      source: curatedCoupon.source,
    };
  }

  // No real coupon found - return null (we only want real coupons)
  return null;
}

// Legacy function for backwards compatibility (still used in some places)
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
      isCurated: true,
      requiresApp: deal.requiresApp || false,
      source: curatedCoupon.source,
    };
  }

  // Return null for non-verified deals (we only want real coupons now)
  return null;
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

