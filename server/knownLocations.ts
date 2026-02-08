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
 * Research source: Official store locators, Nominatim geocoding, verified Dec 2025
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
    address: "1412 E Main St, Magnolia, AR 71753",
    latitude: 33.2670862,
    longitude: -93.2220136,
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
  },
  {
    id: "known-mcdonalds-magnolia",
    name: "McDonald's",
    address: "1127 E Main St, Magnolia, AR 71753",
    latitude: 33.2672274,
    longitude: -93.2247390,
    zipCode: "71753",
    type: "restaurant"
  },
  {
    id: "known-burgerking-magnolia",
    name: "Burger King",
    address: "1114 E Main St, Magnolia, AR 71753",
    latitude: 33.2671972,
    longitude: -93.2260735,
    zipCode: "71753",
    type: "restaurant"
  },
  {
    id: "known-tacobell-magnolia",
    name: "Taco Bell",
    address: "1521 E Main St, Magnolia, AR 71753",
    latitude: 33.2651492,
    longitude: -93.2187267,
    zipCode: "71753",
    type: "restaurant"
  },
  {
    id: "known-pizzahut-magnolia",
    name: "Pizza Hut",
    address: "1621 E Main St, Magnolia, AR 71753",
    latitude: 33.2646359,
    longitude: -93.2187662,
    zipCode: "71753",
    type: "restaurant"
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
    if (locName === "mcdonald's" && lowerName.includes("mcdonald")) return true;
    if (locName === "burger king" && (lowerName.includes("burger king") || lowerName === "bk")) return true;
    if (locName === "taco bell" && lowerName.includes("taco")) return true;
    if (locName === "pizza hut" && lowerName.includes("pizza hut")) return true;
  }
  
  return false;
}
