// In your server/src/index.ts (or equivalent)
import express, { Request, Response } from 'express';
import axios from 'axios';

// ... (your existing app setup, e.g., const app = express();)

/**
 * API Endpoint: /api/locations
 * Query Param: ?zip=...
 *
 * Takes a zip code, geocodes it, and finds nearby restaurants/stores
 * using the OpenStreetMap Overpass API.
 */
app.get('/api/locations', async (req: Request, res: Response) => {
  const zip = req.query.zip as string;

  if (!zip) {
    return res.status(400).json({ error: 'Zip code is required' });
  }

  try {
    // === Part A: Geocoding (Zip -> Lat/Lon) ===
    // We use Nominatim, OSM's geocoding service.
    // IMPORTANT: Provide a valid User-Agent header.
    const geoUrl = `https://nominatim.openstreetmap.org/search`;
    const geoResponse = await axios.get(geoUrl, {
      params: {
        postalcode: zip,
        country: 'US', // Assuming US zip codes
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'YourAppName/1.0 (your-email@example.com)', // Be polite!
      },
    });

    if (geoResponse.data.length === 0) {
      return res.status(404).json({ error: 'Invalid zip code or area not found' });
    }

    const { lat, lon } = geoResponse.data[0];

    // === Part B: Find POIs (Lat/Lon -> Stores/Restaurants) ===
    // We use the Overpass API. We'll search in a 5000m (5km) radius.
    const radius = 5000;
    const overpassQuery = `
      [out:json];
      (
        // Query for restaurants
        node["amenity"="restaurant"](around:${radius},${lat},${lon});
        way["amenity"="restaurant"](around:${radius},${lat},${lon});
        relation["amenity"="restaurant"](around:${radius},${lat},${lon});

        // Query for stores (using the 'shop' tag)
        node["shop"](around:${radius},${lat},${lon});
        way["shop"](around:${radius},${lat},${lon});
        relation["shop"](around:${radius},${lat},${lon});
      );
      out center;
    `;

    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const poiResponse = await axios.post(overpassUrl, overpassQuery, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // === Part C: Format and Send Response ===
    // Filter and format the results to be simple and useful
    const locations = poiResponse.data.elements
      .filter(el => el.tags && el.tags.name) // Only include items with a name
      .map(el => {
        const type = el.tags.amenity || el.tags.shop;
        return {
          id: el.id,
          name: el.tags.name,
          type: type,
          lat: el.lat || el.center.lat, // Use 'center' for ways/relations
          lon: el.lon || el.center.lon,
        };
      });

    // Send back the geocoded center (to center the map) and the list of locations
    res.json({
      center: { lat: parseFloat(lat), lon: parseFloat(lon) },
      locations: locations,
    });

  } catch (error) {
    console.error('Error fetching data from OSM:', error);
    res.status(500).json({ error: 'Failed to fetch location data' });
  }
});

// ... (your existing app.listen(...)