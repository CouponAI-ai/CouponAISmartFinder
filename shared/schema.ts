import { pgTable, text, varchar, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Coupon schema
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey(),
  storeName: text("store_name").notNull(),
  storeLogoUrl: text("store_logo_url"),
  discountAmount: text("discount_amount").notNull(),
  discountPercentage: integer("discount_percentage"),
  title: text("title").notNull(),
  description: text("description"),
  code: text("code"),
  category: text("category").notNull(),
  expirationDate: timestamp("expiration_date"),
  claimCount: integer("claim_count").notNull().default(0),
  isTrending: integer("is_trending").notNull().default(0),
  termsAndConditions: text("terms_and_conditions"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
});

export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;

// Saved coupons schema
export const savedCoupons = pgTable("saved_coupons", {
  id: varchar("id").primaryKey(),
  couponId: varchar("coupon_id").notNull(),
  savedAt: timestamp("saved_at").notNull().defaultNow(),
});

export const insertSavedCouponSchema = createInsertSchema(savedCoupons).omit({
  id: true,
  savedAt: true,
});

export type InsertSavedCoupon = z.infer<typeof insertSavedCouponSchema>;
export type SavedCoupon = typeof savedCoupons.$inferSelect;

// Saved deal - stores full deal data for dynamically generated deals
export interface SavedDeal {
  id: string;
  couponId: string;
  savedAt: Date;
  storeName: string;
  storeLogoUrl?: string;
  discountAmount: string;
  title: string;
  description?: string;
  code?: string;
  category: string;
  expirationDate?: Date | string;
  claimCount?: number;
  isTrending?: number | boolean;
  isVerified?: boolean;
  isCurated?: boolean;
  requiresApp?: boolean;
  latitude?: number;
  longitude?: number;
  distance?: number;
  source?: string;
  terms?: string;
}

// User preferences schema
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey(),
  categories: text("categories").array(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
