interface Coordinates {
  latitude: number;
  longitude: number;
}

export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates,
): number {
  const R = 3959;

  const lat1 = toRadians(point1.latitude);
  const lat2 = toRadians(point2.latitude);
  const deltaLat = toRadians(point2.latitude - point1.latitude);
  const deltaLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  boundingBox?: [number, number, number, number]; // [south, north, west, east]
}

let lastNominatimCall = 0;
const NOMINATIM_MIN_INTERVAL_MS = 1100;

async function rateLimitedFetch(url: string, retries = 2): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const now = Date.now();
    const elapsed = now - lastNominatimCall;
    if (elapsed < NOMINATIM_MIN_INTERVAL_MS) {
      await new Promise(resolve => setTimeout(resolve, NOMINATIM_MIN_INTERVAL_MS - elapsed));
    }
    lastNominatimCall = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "CouponAI/1.0 (Replit Education Project)",
        },
      });

      if (response.ok) {
        return response;
      }

      if (response.status === 429) {
        console.warn(`Nominatim rate limit hit, waiting before retry (attempt ${attempt + 1}/${retries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        continue;
      }

      console.error(`Nominatim API error: ${response.status}`);
      return null;
    } catch (error) {
      console.error(`Nominatim fetch error (attempt ${attempt + 1}/${retries + 1}):`, error);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }
  return null;
}

function normalizeZip(zip: string | null | undefined): string | null {
  if (!zip) return null;
  const trimmed = zip.trim();
  const base = trimmed.split("-")[0].split(" ")[0];
  return base.length === 5 ? base : null;
}

const zipCache = new Map<string, string | null>();

export async function reverseGeocodeToZip(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`;

    const response = await rateLimitedFetch(url);

    if (!response) {
      return null;
    }

    const data = await response.json();

    if (!data || !data.address) {
      return null;
    }

    return normalizeZip(data.address.postcode);
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

const geocodeCache = new Map<string, GeocodedLocation | null>();
// Pending promise deduplicator — prevents duplicate in-flight calls for the same ZIP
const geocodePending = new Map<string, Promise<GeocodedLocation | null>>();

/**
 * Build an approximate bounding box around a lat/lon point.
 * Uses ±zipRadiusMiles as the half-extent on each axis.
 */
function buildApproxBoundingBox(
  lat: number,
  lon: number,
  radiusMiles = 4,
): [number, number, number, number] {
  const latDelta = radiusMiles / 69.0;
  const lonDelta = radiusMiles / (69.0 * Math.cos(toRadians(lat)));
  return [lat - latDelta, lat + latDelta, lon - lonDelta, lon + lonDelta];
}

/**
 * Fast ZIP geocoding via Zippopotam.us (no auth, no rate limits).
 * Only covers US ZIP codes. Returns null for non-US or unknown ZIPs.
 */
async function geocodeViaZippopotam(zipCode: string): Promise<GeocodedLocation | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.zippopotam.us/us/${zipCode}`, {
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json() as any;
    const place = data.places?.[0];
    if (!place) return null;
    const lat = parseFloat(place.latitude);
    const lon = parseFloat(place.longitude);
    const location: GeocodedLocation = {
      latitude: lat,
      longitude: lon,
      displayName: `${place["place name"]}, ${place["state abbreviation"]} ${zipCode}`,
      city: place["place name"],
      state: place.state,
      country: "United States",
      // Approximate ±4-mile bounding box (typical US ZIP radius)
      boundingBox: buildApproxBoundingBox(lat, lon, 4),
    };
    console.log(`Geocoded ZIP ${zipCode} via Zippopotam: (${lat}, ${lon})`);
    return location;
  } catch {
    return null;
  }
}

export async function geocodeZipCode(
  zipCode: string,
  countryCode = "us",
): Promise<GeocodedLocation | null> {
  const cacheKey = `${zipCode}-${countryCode}`;

  // Return cached result immediately
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) || null;
  }

  // Share in-flight requests for the same ZIP
  if (geocodePending.has(cacheKey)) {
    return geocodePending.get(cacheKey)!;
  }

  const fetchPromise = (async (): Promise<GeocodedLocation | null> => {
    try {
      // Try Zippopotam first — fast, no rate limits
      if (countryCode === "us") {
        const fast = await geocodeViaZippopotam(zipCode);
        if (fast) {
          geocodeCache.set(cacheKey, fast);
          return fast;
        }
      }

      // Fallback: Nominatim (slower, rate-limited)
      const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zipCode)}&countrycodes=${countryCode}&format=json&addressdetails=1&limit=1`;
      const response = await rateLimitedFetch(url);

      if (!response) {
        geocodeCache.set(cacheKey, null);
        return null;
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        console.log(`No results found for zip code: ${zipCode}`);
        geocodeCache.set(cacheKey, null);
        return null;
      }

      const result = data[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);

      const location: GeocodedLocation = {
        latitude: lat,
        longitude: lon,
        displayName: result.display_name,
        city: result.address?.city || result.address?.town || result.address?.village,
        state: result.address?.state,
        country: result.address?.country,
        boundingBox: result.boundingbox
          ? result.boundingbox.map((v: string) => parseFloat(v))
          : buildApproxBoundingBox(lat, lon, 4),
      };

      geocodeCache.set(cacheKey, location);
      return location;
    } catch (error) {
      console.error("Geocoding error:", error);
      geocodeCache.set(cacheKey, null);
      return null;
    } finally {
      geocodePending.delete(cacheKey);
    }
  })();

  geocodePending.set(cacheKey, fetchPromise);
  return fetchPromise;
}

export function isInBoundingBox(
  latitude: number,
  longitude: number,
  boundingBox: [number, number, number, number],
  marginMiles: number = 0.5,
): boolean {
  const [south, north, west, east] = boundingBox;
  const latMargin = marginMiles / 69.0;
  const lonMargin = marginMiles / (69.0 * Math.cos(toRadians(latitude)));

  return (
    latitude >= south - latMargin &&
    latitude <= north + latMargin &&
    longitude >= west - lonMargin &&
    longitude <= east + lonMargin
  );
}

export async function isInZipCode(
  latitude: number,
  longitude: number,
  targetZip: string,
): Promise<boolean> {
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

  if (zipCache.has(cacheKey)) {
    const cached = zipCache.get(cacheKey);
    const normalizedTarget = normalizeZip(targetZip);
    return cached === normalizedTarget;
  }

  const actualZip = await reverseGeocodeToZip(latitude, longitude);
  const normalizedActual = normalizeZip(actualZip);
  zipCache.set(cacheKey, normalizedActual);

  const normalizedTarget = normalizeZip(targetZip);
  return normalizedActual === normalizedTarget;
}

/**
 * Filter businesses to those within the ZIP code area.
 * Uses only bounding box + distance geometry — NO per-business Nominatim calls.
 * This avoids Nominatim rate-limiting which caused 90-second response times.
 */
export function filterBusinessesByZipCode(
  businesses: Array<{ latitude: number; longitude: number; [key: string]: any }>,
  targetZipCode: string,
  boundingBox?: [number, number, number, number],
  centerLat?: number,
  centerLon?: number,
): Array<{ latitude: number; longitude: number; [key: string]: any }> {
  if (boundingBox) {
    // Expand the bounding box by 1 mile so edge businesses aren't excluded
    const filtered = businesses.filter(b =>
      isInBoundingBox(b.latitude, b.longitude, boundingBox, 1.5)
    );
    console.log(`Bounding box filter: ${businesses.length} -> ${filtered.length} businesses in ZIP ${targetZipCode}`);
    return filtered;
  }

  if (centerLat !== undefined && centerLon !== undefined) {
    // Fall back to a 12-mile radius from ZIP center
    const filtered = businesses.filter(b => {
      const dist = calculateDistance(
        { latitude: centerLat, longitude: centerLon },
        { latitude: b.latitude, longitude: b.longitude },
      );
      return dist <= 12;
    });
    console.log(`Radius filter: ${businesses.length} -> ${filtered.length} businesses near ZIP ${targetZipCode}`);
    return filtered;
  }

  // No geometry info — return all (let the caller's existing distance filter handle it)
  return businesses;
}
