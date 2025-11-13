import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { getAIRecommendations } from "./ai";

export function registerRoutes(app: Express) {
  const server = createServer(app);
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
