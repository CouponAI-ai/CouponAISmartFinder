// Overpass API integration for fetching real businesses from OpenStreetMap
// With retry logic, failover servers, and caching for reliability

export interface OverpassBusiness {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: string; // restaurant, cafe, fast_food, shop, etc.
  cuisine?: string;
  address?: string;
  phone?: string;
  website?: string;
}

// Multiple Overpass API servers for failover
const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// Cache for successful Overpass responses (1 hour TTL)
interface CacheEntry {
  data: OverpassBusiness[];
  timestamp: number;
}

const overpassCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate cache key from coordinates and radius
 */
function getCacheKey(latitude: number, longitude: number, radiusMeters: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)},${radiusMeters}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Query OpenStreetMap for businesses within a radius of coordinates
 * Features: Multiple server failover, retry with exponential backoff, caching
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radiusMeters Search radius in meters (default 10 miles = ~16000m)
 */
export async function fetchNearbyBusinesses(
  latitude: number,
  longitude: number,
  radiusMeters: number = 16000 // ~10 miles
): Promise<OverpassBusiness[]> {
  // Check cache first
  const cacheKey = getCacheKey(latitude, longitude, radiusMeters);
  const cachedEntry = overpassCache.get(cacheKey);
  
  if (cachedEntry && isCacheValid(cachedEntry)) {
    console.log(`Using cached Overpass data (${cachedEntry.data.length} businesses)`);
    return cachedEntry.data;
  }

  // Build Overpass QL query for all business types including local businesses
  const query = `
    [out:json][timeout:30];
    (
      node["amenity"="restaurant"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="cafe"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="fast_food"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="bar"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="ice_cream"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="supermarket"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="convenience"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="department_store"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="bakery"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="butcher"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="florist"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="hardware"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="clothes"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="shoes"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="books"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="beauty"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="hairdresser"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="gift"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="jewelry"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="pet"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="furniture"](around:${radiusMeters},${latitude},${longitude});
      node["shop"="sports"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="pharmacy"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="laundry"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="dry_cleaning"](around:${radiusMeters},${latitude},${longitude});
    );
    out body 100;
  `;

  // Try each server with retry logic
  for (let serverIndex = 0; serverIndex < OVERPASS_SERVERS.length; serverIndex++) {
    const serverUrl = OVERPASS_SERVERS[serverIndex];
    const serverName = new URL(serverUrl).hostname;
    
    // Retry up to 3 times per server with exponential backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Querying Overpass API (${serverName}, attempt ${attempt}/3) for businesses within ${radiusMeters}m of (${latitude}, ${longitude})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(serverUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "CouponAI/1.0 (Replit Education Project)",
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`Overpass API error (${serverName}): ${response.status}`);
          
          // If rate limited (429) or server error (5xx), try again after delay
          if (response.status === 429 || response.status >= 500) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s (max 5s)
            console.log(`Retrying in ${delay}ms...`);
            await sleep(delay);
            continue;
          }
          
          // For other errors, try next server
          break;
        }

        const data = await response.json();
        
        if (!data.elements || data.elements.length === 0) {
          console.log(`No businesses found from ${serverName}`);
          // Don't cache empty results - allow retries on next request
          return [];
        }

        // Transform Overpass data to our business format
        const businesses: OverpassBusiness[] = data.elements
          .filter((element: any) => element.tags && element.tags.name) // Only include named businesses
          .map((element: any) => {
            const tags = element.tags;
            
            // Determine business type
            let type = "other";
            if (tags.amenity === "restaurant") type = "restaurant";
            else if (tags.amenity === "cafe") type = "cafe";
            else if (tags.amenity === "fast_food") type = "fast_food";
            else if (tags.amenity === "pharmacy") type = "pharmacy";
            else if (tags.shop) type = tags.shop;

            return {
              id: element.id,
              name: tags.name,
              latitude: element.lat,
              longitude: element.lon,
              type,
              cuisine: tags.cuisine,
              address: buildAddress(tags),
              phone: tags.phone,
              website: tags.website,
            };
          });

        console.log(`Found ${businesses.length} businesses from ${serverName}`);
        
        // Cache successful response
        overpassCache.set(cacheKey, { data: businesses, timestamp: Date.now() });
        
        return businesses;

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error(`Overpass API timeout (${serverName}, attempt ${attempt})`);
        } else {
          console.error(`Error fetching from ${serverName}:`, error.message);
        }
        
        // Exponential backoff before retry
        if (attempt < 3) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }
    
    // If this server failed all retries, try next server
    console.log(`Server ${serverName} failed, trying next server...`);
  }

  // All servers failed - return empty array (known locations will be used as fallback)
  console.error("All Overpass API servers failed. Using known locations as fallback.");
  return [];
}

/**
 * Build a readable address from OSM tags
 */
function buildAddress(tags: any): string | undefined {
  const parts: string[] = [];
  
  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:state"]) parts.push(tags["addr:state"]);
  if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);
  
  return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Map business type to coupon category
 */
export function mapBusinessTypeToCategory(type: string): string {
  const categoryMap: Record<string, string> = {
    restaurant: "Food & Dining",
    cafe: "Food & Dining",
    fast_food: "Food & Dining",
    bakery: "Food & Dining",
    bar: "Food & Dining",
    ice_cream: "Food & Dining",
    butcher: "Food & Dining",
    supermarket: "Groceries",
    convenience: "Groceries",
    clothes: "Fashion",
    shoes: "Fashion",
    electronics: "Electronics",
    pharmacy: "Health",
    beauty: "Beauty",
    hairdresser: "Beauty",
    department_store: "Retail",
    hardware: "Local Business",
    florist: "Local Business",
    books: "Local Business",
    gift: "Local Business",
    jewelry: "Local Business",
    pet: "Local Business",
    furniture: "Local Business",
    sports: "Local Business",
    laundry: "Local Business",
    dry_cleaning: "Local Business",
  };

  return categoryMap[type] || "Local Business";
}

/**
 * Clear the Overpass cache (useful for testing)
 */
export function clearOverpassCache(): void {
  overpassCache.clear();
  console.log("Overpass cache cleared");
}
