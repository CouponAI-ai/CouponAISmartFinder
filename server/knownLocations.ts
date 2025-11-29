/**
 * Known chain locations for specific areas
 * These are manually researched locations that supplement OpenStreetMap data
 * to ensure users always see deals for major chains in their area
 */

export interface KnownLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  zipCode: string;
  type: string;
}

/**
 * Known chain locations in Magnolia, Arkansas (71753)
 * Research source: Google Maps, Whataburger/Sonic/Hardee's/Walmart store locators
 */
export const KNOWN_LOCATIONS: KnownLocation[] = [
  // Magnolia, AR 71753
  {
    id: "known-whataburger-magnolia",
    name: "Whataburger",
    address: "49 Highway 79 Bypass N, Magnolia, AR 71753",
    latitude: 33.2770,
    longitude: -93.2297,
    zipCode: "71753",
    type: "restaurant"
  },
  {
    id: "known-sonic-magnolia",
    name: "Sonic Drive-In",
    address: "1920 E Main St, Magnolia, AR 71753",
    latitude: 33.2680,
    longitude: -93.2150,
    zipCode: "71753",
    type: "restaurant"
  },
  {
    id: "known-walmart-magnolia",
    name: "Walmart Supercenter",
    address: "60 Highway 79 N, Magnolia, AR 71753",
    latitude: 33.2820,
    longitude: -93.2350,
    zipCode: "71753",
    type: "store"
  }
];

/**
 * Get known locations for a specific ZIP code
 */
export function getKnownLocationsForZip(zipCode: string): KnownLocation[] {
  return KNOWN_LOCATIONS.filter(loc => loc.zipCode === zipCode);
}

/**
 * Check if a business name matches a known location (to avoid duplicates)
 */
export function matchesKnownLocation(businessName: string, knownLocations: KnownLocation[]): boolean {
  const lowerName = businessName.toLowerCase();
  
  for (const loc of knownLocations) {
    const locName = loc.name.toLowerCase();
    // Check if names overlap significantly
    if (lowerName.includes(locName) || locName.includes(lowerName)) {
      return true;
    }
    // Handle common variations
    if (locName === "whataburger" && lowerName.includes("whata")) return true;
    if (locName === "sonic drive-in" && lowerName.includes("sonic")) return true;
    if (locName === "hardee's" && lowerName.includes("hardee")) return true;
    if (locName.includes("walmart") && lowerName.includes("walmart")) return true;
  }
  
  return false;
}
