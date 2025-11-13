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
