import type { Coupon, SavedCoupon, UserPreferences } from "@shared/schema";
import { nanoid } from "nanoid";

// In-memory storage interface
export interface IStorage {
  // Coupons
  getCoupons(): Promise<Coupon[]>;
  getCouponById(id: string): Promise<Coupon | undefined>;
  getCouponsByCategory(category: string): Promise<Coupon[]>;
  getTrendingCoupons(): Promise<Coupon[]>;
  searchCoupons(query: string): Promise<Coupon[]>;
  claimCoupon(id: string): Promise<void>;
  
  // Saved coupons
  getSavedCoupons(): Promise<SavedCoupon[]>;
  saveCoupon(couponId: string): Promise<SavedCoupon>;
  unsaveCoupon(id: string): Promise<void>;
  
  // User preferences
  getUserPreferences(): Promise<UserPreferences | undefined>;
  updateUserPreferences(categories: string[]): Promise<UserPreferences>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private coupons: Map<string, Coupon> = new Map();
  private savedCoupons: Map<string, SavedCoupon> = new Map();
  private userPreferences: UserPreferences | undefined;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Sample coupon data
    const sampleCoupons: Coupon[] = [
      {
        id: nanoid(),
        storeName: "Whole Foods",
        storeLogoUrl: "https://logo.clearbit.com/wholefoodsmarket.com",
        discountAmount: "$20 OFF",
        discountPercentage: null,
        title: "Save $20 on orders over $100",
        description: "Get $20 off your next grocery order of $100 or more",
        code: "FRESH20",
        category: "Groceries",
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        claimCount: 1234,
        isTrending: 1,
        termsAndConditions: "Valid on orders $100 or more. Cannot be combined with other offers. Expires in 7 days.",
        latitude: 37.7749,
        longitude: -122.4194,
      },
      {
        id: nanoid(),
        storeName: "Nike",
        storeLogoUrl: "https://logo.clearbit.com/nike.com",
        discountAmount: "30% OFF",
        discountPercentage: 30,
        title: "30% off athletic wear",
        description: "Save big on shoes, clothing, and accessories",
        code: "NIKE30",
        category: "Fashion",
        expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        claimCount: 5678,
        isTrending: 1,
        termsAndConditions: "Valid on select items. Excludes new releases.",
        latitude: 37.3861,
        longitude: -122.0839,
      },
      {
        id: nanoid(),
        storeName: "Best Buy",
        storeLogoUrl: "https://logo.clearbit.com/bestbuy.com",
        discountAmount: "$100 OFF",
        discountPercentage: null,
        title: "Save $100 on laptops",
        description: "Get $100 off select laptops and computers",
        code: "TECH100",
        category: "Electronics",
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        claimCount: 892,
        isTrending: 0,
        termsAndConditions: "Valid on laptops $500 or more. While supplies last.",
        latitude: 37.7849,
        longitude: -122.4094,
      },
      {
        id: nanoid(),
        storeName: "Uber Eats",
        storeLogoUrl: "https://logo.clearbit.com/uber.com",
        discountAmount: "50% OFF",
        discountPercentage: 50,
        title: "50% off your first 3 orders",
        description: "New users get half off their first three food deliveries",
        code: "FIRST50",
        category: "Dining",
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        claimCount: 3456,
        isTrending: 1,
        termsAndConditions: "For new users only. Up to $10 off per order. Valid for 30 days.",
        latitude: 37.7749,
        longitude: -122.4294,
      },
      {
        id: nanoid(),
        storeName: "Airbnb",
        storeLogoUrl: "https://logo.clearbit.com/airbnb.com",
        discountAmount: "$50 OFF",
        discountPercentage: null,
        title: "$50 off travel bookings",
        description: "Save on your next vacation rental",
        code: "TRAVEL50",
        category: "Travel",
        expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        claimCount: 2109,
        isTrending: 0,
        termsAndConditions: "Valid on bookings $200 or more. Not valid during peak season.",
        latitude: 37.7649,
        longitude: -122.4394,
      },
      {
        id: nanoid(),
        storeName: "CVS Pharmacy",
        storeLogoUrl: "https://logo.clearbit.com/cvs.com",
        discountAmount: "20% OFF",
        discountPercentage: 20,
        title: "20% off vitamins and supplements",
        description: "Stock up on health essentials",
        code: "HEALTH20",
        category: "Health",
        expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        claimCount: 678,
        isTrending: 0,
        termsAndConditions: "Valid on select health products. Cannot be combined with ExtraCare rewards.",
        latitude: 37.7849,
        longitude: -122.4094,
      },
      {
        id: nanoid(),
        storeName: "Sephora",
        storeLogoUrl: "https://logo.clearbit.com/sephora.com",
        discountAmount: "15% OFF",
        discountPercentage: 15,
        title: "15% off beauty favorites",
        description: "Save on makeup, skincare, and fragrance",
        code: "BEAUTY15",
        category: "Beauty",
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        claimCount: 1890,
        isTrending: 1,
        termsAndConditions: "Excludes prestige brands and sale items.",
        latitude: 37.7949,
        longitude: -122.3994,
      },
      {
        id: nanoid(),
        storeName: "Planet Fitness",
        storeLogoUrl: "https://logo.clearbit.com/planetfitness.com",
        discountAmount: "$10/month",
        discountPercentage: null,
        title: "Gym membership $10/month",
        description: "Join today and start your fitness journey",
        code: "FIT10",
        category: "Fitness",
        expirationDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        claimCount: 543,
        isTrending: 0,
        termsAndConditions: "Annual fee applies. 12-month commitment required.",
        latitude: 37.7549,
        longitude: -122.4494,
      },
      {
        id: nanoid(),
        storeName: "Target",
        storeLogoUrl: "https://logo.clearbit.com/target.com",
        discountAmount: "25% OFF",
        discountPercentage: 25,
        title: "25% off home decor",
        description: "Refresh your space with stylish decor",
        code: "HOME25",
        category: "Fashion",
        expirationDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        claimCount: 1567,
        isTrending: 0,
        termsAndConditions: "Valid on select home goods and furniture.",
        latitude: 37.7449,
        longitude: -122.4594,
      },
      {
        id: nanoid(),
        storeName: "Amazon",
        storeLogoUrl: "https://logo.clearbit.com/amazon.com",
        discountAmount: "$15 OFF",
        discountPercentage: null,
        title: "$15 off electronics",
        description: "Save on tech gadgets and accessories",
        code: "AMZN15",
        category: "Electronics",
        expirationDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        claimCount: 8901,
        isTrending: 1,
        termsAndConditions: "Valid on select electronics. Minimum $50 purchase.",
        latitude: 37.7349,
        longitude: -122.4694,
      },
    ];

    sampleCoupons.forEach((coupon) => {
      this.coupons.set(coupon.id, coupon);
    });

    // Initialize with default preferences
    this.userPreferences = {
      id: "default",
      categories: ["Groceries", "Dining", "Electronics"],
      updatedAt: new Date(),
    };
  }

  async getCoupons(): Promise<Coupon[]> {
    return Array.from(this.coupons.values());
  }

  async getCouponById(id: string): Promise<Coupon | undefined> {
    return this.coupons.get(id);
  }

  async getCouponsByCategory(category: string): Promise<Coupon[]> {
    return Array.from(this.coupons.values()).filter(
      (c) => c.category.toLowerCase() === category.toLowerCase()
    );
  }

  async getTrendingCoupons(): Promise<Coupon[]> {
    return Array.from(this.coupons.values())
      .filter((c) => c.isTrending === 1)
      .sort((a, b) => (b.claimCount || 0) - (a.claimCount || 0));
  }

  async searchCoupons(query: string): Promise<Coupon[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.coupons.values()).filter(
      (c) =>
        c.title.toLowerCase().includes(lowerQuery) ||
        c.storeName.toLowerCase().includes(lowerQuery) ||
        c.description?.toLowerCase().includes(lowerQuery)
    );
  }

  async claimCoupon(id: string): Promise<void> {
    const coupon = this.coupons.get(id);
    if (coupon) {
      coupon.claimCount = (coupon.claimCount || 0) + 1;
      this.coupons.set(id, coupon);
    }
  }

  async getSavedCoupons(): Promise<SavedCoupon[]> {
    return Array.from(this.savedCoupons.values());
  }

  async saveCoupon(couponId: string): Promise<SavedCoupon> {
    const saved: SavedCoupon = {
      id: nanoid(),
      couponId,
      savedAt: new Date(),
    };
    this.savedCoupons.set(saved.id, saved);
    return saved;
  }

  async unsaveCoupon(id: string): Promise<void> {
    this.savedCoupons.delete(id);
  }

  async getUserPreferences(): Promise<UserPreferences | undefined> {
    return this.userPreferences;
  }

  async updateUserPreferences(categories: string[]): Promise<UserPreferences> {
    this.userPreferences = {
      id: "default",
      categories,
      updatedAt: new Date(),
    };
    return this.userPreferences;
  }
}

export const storage = new MemStorage();
