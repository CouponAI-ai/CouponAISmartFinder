// Overpass API integration for fetching real businesses from OpenStreetMap

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

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

/**
 * Query OpenStreetMap for businesses within a radius of coordinates
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radiusMeters Search radius in meters (default 25 miles = ~40000m)
 */
export async function fetchNearbyBusinesses(
  latitude: number,
  longitude: number,
  radiusMeters: number = 16000 // ~10 miles (reduced for faster queries)
): Promise<OverpassBusiness[]> {
  try {
    console.log(`Querying Overpass API for businesses within ${radiusMeters}m of (${latitude}, ${longitude})`);
    
    // Build Overpass QL query for main business types only
    // Simplified to reduce query time
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="restaurant"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="cafe"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="fast_food"](around:${radiusMeters},${latitude},${longitude});
        node["shop"="supermarket"](around:${radiusMeters},${latitude},${longitude});
        node["shop"="convenience"](around:${radiusMeters},${latitude},${longitude});
      );
      out body 50;
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Overpass API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.elements || data.elements.length === 0) {
      console.log("No businesses found in this area");
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

    console.log(`Found ${businesses.length} businesses from OpenStreetMap`);
    return businesses;

  } catch (error) {
    console.error("Error fetching businesses from Overpass API:", error);
    return [];
  }
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
    supermarket: "Grocery",
    convenience: "Grocery",
    clothes: "Retail",
    electronics: "Electronics",
    pharmacy: "Health",
    department_store: "Retail",
  };

  return categoryMap[type] || "Retail";
}
