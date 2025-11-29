// Haversine formula to calculate distance between two points on Earth
// Returns distance in miles

interface Coordinates {
  latitude: number;
  longitude: number;
}

export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 3959; // Earth's radius in miles
  
  const lat1 = toRadians(point1.latitude);
  const lat2 = toRadians(point2.latitude);
  const deltaLat = toRadians(point2.latitude - point1.latitude);
  const deltaLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in miles
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Geocode zip code to coordinates using Nominatim API
export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  boundingBox?: [number, number, number, number]; // [south, north, west, east]
}

// Reverse geocode coordinates to get ZIP code
export async function reverseGeocodeToZip(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CouponAI/1.0 (Replit Education Project)",
      },
    });

    if (!response.ok) {
      console.error(`Nominatim reverse API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data || !data.address) {
      return null;
    }

    // Return the postal code (ZIP code)
    return data.address.postcode || null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

// Cache for reverse geocoded ZIP codes to reduce API calls
const zipCache = new Map<string, string | null>();

// Batch check if coordinates are in a specific ZIP code
// Uses caching to avoid repeated API calls
export async function isInZipCode(
  latitude: number,
  longitude: number,
  targetZip: string
): Promise<boolean> {
  // Create cache key from rounded coordinates (to group nearby points)
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  
  if (zipCache.has(cacheKey)) {
    const cached = zipCache.get(cacheKey);
    return cached === targetZip;
  }
  
  const actualZip = await reverseGeocodeToZip(latitude, longitude);
  zipCache.set(cacheKey, actualZip);
  
  return actualZip === targetZip;
}

export async function geocodeZipCode(
  zipCode: string,
  countryCode = "us"
): Promise<GeocodedLocation | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zipCode)}&countrycodes=${countryCode}&format=json&addressdetails=1&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CouponAI/1.0 (Replit Education Project)",
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.log(`No results found for zip code: ${zipCode}`);
      return null;
    }

    const result = data[0];
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village,
      state: result.address?.state,
      country: result.address?.country,
      boundingBox: result.boundingbox ? result.boundingbox.map((v: string) => parseFloat(v)) : undefined,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
