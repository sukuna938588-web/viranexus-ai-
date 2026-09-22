// Smart Location Detection & Auto-Resolution Service

export interface SmartLocation {
  query: string;
  name: string;
  city: string;
  district: string;
  state: string;
  region: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number; // In meters
  source?: 'geolocation' | 'search' | 'knowledge_base' | 'manual';
}

export interface GeolocationDetectionResult {
  success: boolean;
  location?: SmartLocation;
  error?: string;
  errorCode?: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED' | 'NETWORK_ERROR';
}

// Curated database of prominent cities, districts, states, and regional surveillance zones
const LOCATION_KNOWLEDGE_BASE: Record<string, Omit<SmartLocation, 'query'>> = {
  // Tamil Nadu & South India (Explicitly requested by user: Madurai -> District: Madurai, State: Tamil Nadu, Region: South Tamil Nadu)
  'madurai': {
    name: 'Madurai',
    city: 'Madurai',
    district: 'Madurai',
    state: 'Tamil Nadu',
    region: 'South Tamil Nadu',
    country: 'India',
    latitude: 9.9252,
    longitude: 78.1198,
    source: 'knowledge_base',
  },
  'chennai': {
    name: 'Chennai',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    region: 'North Tamil Nadu',
    country: 'India',
    latitude: 13.0827,
    longitude: 80.2707,
    source: 'knowledge_base',
  },
  'coimbatore': {
    name: 'Coimbatore',
    city: 'Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    region: 'West Tamil Nadu',
    country: 'India',
    latitude: 11.0168,
    longitude: 76.9558,
    source: 'knowledge_base',
  },
  'tiruchirappalli': {
    name: 'Tiruchirappalli',
    city: 'Tiruchirappalli',
    district: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    region: 'Central Tamil Nadu',
    country: 'India',
    latitude: 10.7905,
    longitude: 78.7047,
    source: 'knowledge_base',
  },
  'trichy': {
    name: 'Trichy',
    city: 'Trichy',
    district: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    region: 'Central Tamil Nadu',
    country: 'India',
    latitude: 10.7905,
    longitude: 78.7047,
    source: 'knowledge_base',
  },
  'salem': {
    name: 'Salem',
    city: 'Salem',
    district: 'Salem',
    state: 'Tamil Nadu',
    region: 'North-West Tamil Nadu',
    country: 'India',
    latitude: 11.6643,
    longitude: 78.146,
    source: 'knowledge_base',
  },
  'tirunelveli': {
    name: 'Tirunelveli',
    city: 'Tirunelveli',
    district: 'Tirunelveli',
    state: 'Tamil Nadu',
    region: 'South Tamil Nadu',
    country: 'India',
    latitude: 8.7139,
    longitude: 77.7567,
    source: 'knowledge_base',
  },
  'thanjavur': {
    name: 'Thanjavur',
    city: 'Thanjavur',
    district: 'Thanjavur',
    state: 'Tamil Nadu',
    region: 'Central Tamil Nadu',
    country: 'India',
    latitude: 10.787,
    longitude: 79.1378,
    source: 'knowledge_base',
  },
  'vellore': {
    name: 'Vellore',
    city: 'Vellore',
    district: 'Vellore',
    state: 'Tamil Nadu',
    region: 'North Tamil Nadu',
    country: 'India',
    latitude: 12.9165,
    longitude: 79.1325,
    source: 'knowledge_base',
  },
  'kanyakumari': {
    name: 'Kanyakumari',
    city: 'Kanyakumari',
    district: 'Kanyakumari',
    state: 'Tamil Nadu',
    region: 'South Tamil Nadu',
    country: 'India',
    latitude: 8.0883,
    longitude: 77.5385,
    source: 'knowledge_base',
  },
  'dindigul': {
    name: 'Dindigul',
    city: 'Dindigul',
    district: 'Dindigul',
    state: 'Tamil Nadu',
    region: 'South Tamil Nadu',
    country: 'India',
    latitude: 10.3673,
    longitude: 77.9803,
    source: 'knowledge_base',
  },
  'erode': {
    name: 'Erode',
    city: 'Erode',
    district: 'Erode',
    state: 'Tamil Nadu',
    region: 'West Tamil Nadu',
    country: 'India',
    latitude: 11.341,
    longitude: 77.7172,
    source: 'knowledge_base',
  },
  'tiruppur': {
    name: 'Tiruppur',
    city: 'Tiruppur',
    district: 'Tiruppur',
    state: 'Tamil Nadu',
    region: 'West Tamil Nadu',
    country: 'India',
    latitude: 11.1085,
    longitude: 77.3411,
    source: 'knowledge_base',
  },
  'thoothukudi': {
    name: 'Thoothukudi',
    city: 'Thoothukudi',
    district: 'Thoothukudi',
    state: 'Tamil Nadu',
    region: 'South Tamil Nadu',
    country: 'India',
    latitude: 8.7642,
    longitude: 78.1348,
    source: 'knowledge_base',
  },
  'virudhunagar': {
    name: 'Virudhunagar',
    city: 'Virudhunagar',
    district: 'Virudhunagar',
    state: 'Tamil Nadu',
    region: 'South Tamil Nadu',
    country: 'India',
    latitude: 9.5872,
    longitude: 77.957,
    source: 'knowledge_base',
  },
  'bengaluru': {
    name: 'Bengaluru',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    region: 'South India',
    country: 'India',
    latitude: 12.9716,
    longitude: 77.5946,
    source: 'knowledge_base',
  },
  'bangalore': {
    name: 'Bangalore',
    city: 'Bangalore',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    region: 'South India',
    country: 'India',
    latitude: 12.9716,
    longitude: 77.5946,
    source: 'knowledge_base',
  },
  'hyderabad': {
    name: 'Hyderabad',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    region: 'Deccan South India',
    country: 'India',
    latitude: 17.385,
    longitude: 78.4867,
    source: 'knowledge_base',
  },
  'kochi': {
    name: 'Kochi',
    city: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    region: 'South India',
    country: 'India',
    latitude: 9.9312,
    longitude: 76.2673,
    source: 'knowledge_base',
  },
  'thiruvananthapuram': {
    name: 'Thiruvananthapuram',
    city: 'Thiruvananthapuram',
    district: 'Thiruvananthapuram',
    state: 'Kerala',
    region: 'South India',
    country: 'India',
    latitude: 8.5241,
    longitude: 76.9366,
    source: 'knowledge_base',
  },
  'mumbai': {
    name: 'Mumbai',
    city: 'Mumbai',
    district: 'Mumbai City',
    state: 'Maharashtra',
    region: 'West Coast India',
    country: 'India',
    latitude: 19.076,
    longitude: 72.8777,
    source: 'knowledge_base',
  },
  'pune': {
    name: 'Pune',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    region: 'Western India',
    country: 'India',
    latitude: 18.5204,
    longitude: 73.8567,
    source: 'knowledge_base',
  },
  'delhi': {
    name: 'Delhi',
    city: 'Delhi',
    district: 'New Delhi',
    state: 'Delhi NCR',
    region: 'Northern India',
    country: 'India',
    latitude: 28.6139,
    longitude: 77.209,
    source: 'knowledge_base',
  },
  'kolkata': {
    name: 'Kolkata',
    city: 'Kolkata',
    district: 'Kolkata',
    state: 'West Bengal',
    region: 'Eastern India',
    country: 'India',
    latitude: 22.5726,
    longitude: 88.3639,
    source: 'knowledge_base',
  },
  'ahmedabad': {
    name: 'Ahmedabad',
    city: 'Ahmedabad',
    district: 'Ahmedabad',
    state: 'Gujarat',
    region: 'Western India',
    country: 'India',
    latitude: 23.0225,
    longitude: 72.5714,
    source: 'knowledge_base',
  },
  'jaipur': {
    name: 'Jaipur',
    city: 'Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    region: 'Northern India',
    country: 'India',
    latitude: 26.9124,
    longitude: 75.7873,
    source: 'knowledge_base',
  },

  // International Major Metros
  'london': {
    name: 'London',
    city: 'London',
    district: 'Greater London',
    state: 'England',
    region: 'United Kingdom',
    country: 'UK',
    latitude: 51.5074,
    longitude: -0.1278,
    source: 'knowledge_base',
  },
  'new york': {
    name: 'New York',
    city: 'New York',
    district: 'New York City',
    state: 'New York',
    region: 'Northeast US',
    country: 'USA',
    latitude: 40.7128,
    longitude: -74.006,
    source: 'knowledge_base',
  },
  'san francisco': {
    name: 'San Francisco',
    city: 'San Francisco',
    district: 'San Francisco County',
    state: 'California',
    region: 'West Coast US',
    country: 'USA',
    latitude: 37.7749,
    longitude: -122.4194,
    source: 'knowledge_base',
  },
  'los angeles': {
    name: 'Los Angeles',
    city: 'Los Angeles',
    district: 'Los Angeles County',
    state: 'California',
    region: 'West Coast US',
    country: 'USA',
    latitude: 34.0522,
    longitude: -118.2437,
    source: 'knowledge_base',
  },
  'austin': {
    name: 'Austin',
    city: 'Austin',
    district: 'Travis County',
    state: 'Texas',
    region: 'South US',
    country: 'USA',
    latitude: 30.2672,
    longitude: -97.7431,
    source: 'knowledge_base',
  },
  'seattle': {
    name: 'Seattle',
    city: 'Seattle',
    district: 'King County',
    state: 'Washington',
    region: 'Pacific Northwest US',
    country: 'USA',
    latitude: 47.6062,
    longitude: -122.3321,
    source: 'knowledge_base',
  },
  'chicago': {
    name: 'Chicago',
    city: 'Chicago',
    district: 'Cook County',
    state: 'Illinois',
    region: 'Midwest US',
    country: 'USA',
    latitude: 41.8781,
    longitude: -87.6298,
    source: 'knowledge_base',
  },
  'singapore': {
    name: 'Singapore',
    city: 'Singapore',
    district: 'Central Singapore',
    state: 'Singapore',
    region: 'Southeast Asia',
    country: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    source: 'knowledge_base',
  },
  'tokyo': {
    name: 'Tokyo',
    city: 'Tokyo',
    district: 'Tokyo Metropolis',
    state: 'Kanto',
    region: 'Japan',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    source: 'knowledge_base',
  },
  'dubai': {
    name: 'Dubai',
    city: 'Dubai',
    district: 'Dubai Emirate',
    state: 'Dubai',
    region: 'Middle East',
    country: 'UAE',
    latitude: 25.2048,
    longitude: 55.2708,
    source: 'knowledge_base',
  },
  'sydney': {
    name: 'Sydney',
    city: 'Sydney',
    district: 'City of Sydney',
    state: 'New South Wales',
    region: 'Eastern Australia',
    country: 'Australia',
    latitude: -33.8688,
    longitude: 151.2093,
    source: 'knowledge_base',
  },
  'toronto': {
    name: 'Toronto',
    city: 'Toronto',
    district: 'Greater Toronto',
    state: 'Ontario',
    region: 'Eastern Canada',
    country: 'Canada',
    latitude: 43.6532,
    longitude: -79.3832,
    source: 'knowledge_base',
  },
};

/**
 * Calculates geographical distance in kilometers between two GPS coordinate points
 */
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest known municipality/city from GPS coordinates
 */
export function findNearestCity(
  latitude: number,
  longitude: number
): { location: SmartLocation; distanceKm: number } | null {
  let nearest: { location: SmartLocation; distanceKm: number } | null = null;

  for (const [_, loc] of Object.entries(LOCATION_KNOWLEDGE_BASE)) {
    if (loc.latitude !== undefined && loc.longitude !== undefined) {
      const dist = haversineDistanceKm(latitude, longitude, loc.latitude, loc.longitude);
      if (!nearest || dist < nearest.distanceKm) {
        nearest = {
          location: {
            query: loc.name,
            ...loc,
          },
          distanceKm: dist,
        };
      }
    }
  }

  return nearest;
}

/**
 * Infers an appropriate surveillance region based on city and state
 */
export function inferRegion(city: string, state: string, country?: string): string {
  const lowerCity = city.toLowerCase().trim();
  if (LOCATION_KNOWLEDGE_BASE[lowerCity]) {
    return LOCATION_KNOWLEDGE_BASE[lowerCity].region;
  }

  const s = state.toLowerCase();
  const c = (country || '').toLowerCase();

  // Tamil Nadu specific regions
  if (s.includes('tamil nadu')) {
    if (/madurai|theni|dindigul|virudhunagar|ramanathapuram|sivaganga|tirunelveli|thoothukudi|tenkasi|kanyakumari/i.test(city)) {
      return 'South Tamil Nadu';
    }
    if (/chennai|tiruvallur|kanchipuram|chengalpattu|vellore|ranipet|tirupathur/i.test(city)) {
      return 'North Tamil Nadu';
    }
    if (/coimbatore|tiruppur|erode|nilgiris/i.test(city)) {
      return 'West Tamil Nadu';
    }
    if (/tiruchirappalli|trichy|thanjavur|thiruvarur|nagapattinam|karur|pudukkottai|ariyalur|perambalur/i.test(city)) {
      return 'Central Tamil Nadu';
    }
    if (/salem|dharmapuri|krishnagiri|namakkal/i.test(city)) {
      return 'North-West Tamil Nadu';
    }
    return 'Tamil Nadu Surveillance Sector';
  }

  if (s.includes('kerala')) return 'South India / Kerala Coastal';
  if (s.includes('karnataka')) return 'South India / Karnataka';
  if (s.includes('telangana') || s.includes('andhra')) return 'South India / Deccan';
  if (s.includes('maharashtra')) return 'Western India / Maharashtra';
  if (s.includes('delhi')) return 'Northern India / Delhi NCR';
  if (s.includes('west bengal')) return 'Eastern India / Bengal';
  if (s.includes('california')) return 'West Coast US';
  if (s.includes('new york')) return 'Northeast US';
  if (s.includes('texas')) return 'South US';
  if (s.includes('florida')) return 'Southeast US';
  if (s.includes('washington')) return 'Pacific Northwest US';
  if (s.includes('illinois')) return 'Midwest US';
  if (s.includes('england') || s.includes('scotland') || c.includes('united kingdom') || c.includes('uk')) {
    return 'United Kingdom';
  }

  if (state && state !== 'Local State' && state !== 'Detected State') {
    return `${state} Surveillance Region`;
  }

  return `${city || 'Central'} Sector`;
}

/**
 * Resolves any user text input into an automatically generated SmartLocation object.
 * When user enters "Madurai", automatically produces:
 * City: Madurai
 * State: Tamil Nadu
 * Region: South Tamil Nadu
 * District: Madurai
 */
export function resolveSmartLocation(input: string): SmartLocation {
  const clean = input.trim();
  if (!clean) {
    return {
      query: '',
      name: '',
      city: '',
      district: '',
      state: '',
      region: '',
    };
  }

  const lower = clean.toLowerCase();

  // 1. Direct match in knowledge base
  if (LOCATION_KNOWLEDGE_BASE[lower]) {
    return {
      query: clean,
      ...LOCATION_KNOWLEDGE_BASE[lower],
    };
  }

  // 2. Substring or partial match
  for (const [key, loc] of Object.entries(LOCATION_KNOWLEDGE_BASE)) {
    if (lower.includes(key) || key.includes(lower)) {
      return {
        query: clean,
        name: clean.charAt(0).toUpperCase() + clean.slice(1),
        city: clean.charAt(0).toUpperCase() + clean.slice(1),
        district: loc.district,
        state: loc.state,
        region: loc.region,
        country: loc.country,
        latitude: loc.latitude,
        longitude: loc.longitude,
        source: 'knowledge_base',
      };
    }
  }

  // 3. Comma-separated user input: e.g. "Madurai, Tamil Nadu" or "Dallas, Texas"
  if (clean.includes(',')) {
    const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
    const city = parts[0] || clean;
    const state = parts[1] || `${city} State`;
    const region = parts[2] || inferRegion(city, state);

    return {
      query: clean,
      name: city,
      city,
      district: `${city} District`,
      state,
      region,
      source: 'manual',
    };
  }

  // 4. Intelligent heuristic capitalization & auto-inference
  const capitalized = clean
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return {
    query: clean,
    name: capitalized,
    city: capitalized,
    district: `${capitalized} District`,
    state: `${capitalized} State / Zone`,
    region: `${capitalized} Surveillance Region`,
    source: 'manual',
  };
}

/**
 * Searches location suggestions as the user types
 */
export function searchLocations(query: string): SmartLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    // Return top popular default locations
    return ['madurai', 'chennai', 'coimbatore', 'bengaluru', 'mumbai', 'delhi'].map((k) => ({
      query: LOCATION_KNOWLEDGE_BASE[k].name,
      ...LOCATION_KNOWLEDGE_BASE[k],
    }));
  }

  const results: SmartLocation[] = [];
  for (const [k, loc] of Object.entries(LOCATION_KNOWLEDGE_BASE)) {
    if (
      k.includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.district.toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q) ||
      loc.region.toLowerCase().includes(q)
    ) {
      results.push({
        query: loc.name,
        ...loc,
      });
    }
  }

  return results.slice(0, 6);
}

/**
 * Resolves GPS coordinates into City, State, and Region using OpenStreetMap Nominatim reverse geocoding
 */
export async function reverseGeocodeWithNominatim(
  latitude: number,
  longitude: number
): Promise<{ city: string; state: string; region: string; district: string; country: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    const res = await fetch(osmUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const rawCity =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb ||
        addr.county ||
        addr.state_district ||
        '';
      const city = rawCity || findNearestCity(latitude, longitude)?.location.city || 'Detected City';
      const state = addr.state || addr.region || addr.province || 'Detected State';
      const country = addr.country || '';
      const district = addr.county || addr.state_district || addr.district || city;
      const region = inferRegion(city, state, country);

      return { city, state, region, district, country };
    }
  } catch (err) {
    console.warn('OpenStreetMap Nominatim reverse geocoding fallback triggered:', err);
  }
  return null;
}

/**
 * Detects user's current location via browser Geolocation API
 * with multi-tier reverse geocoding (OpenStreetMap Nominatim -> BigDataCloud -> Haversine nearest neighbor)
 * and returns full status, coordinates, city, state, and region.
 */
export async function detectUserCurrentLocationWithDetails(): Promise<GeolocationDetectionResult> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return {
      success: false,
      error: 'Geolocation is not supported by your browser environment.',
      errorCode: 'UNSUPPORTED',
      location: resolveSmartLocation('Madurai'),
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // Tier 1: Primary OpenStreetMap Nominatim reverse geocoding
        const nominatimResult = await reverseGeocodeWithNominatim(latitude, longitude);
        if (nominatimResult) {
          const { city, state, region, district, country } = nominatimResult;
          resolve({
            success: true,
            location: {
              query: `${city}, ${state}`,
              name: city,
              city,
              district,
              state,
              region,
              country,
              latitude,
              longitude,
              accuracy,
              source: 'geolocation',
            },
          });
          return;
        }

        // Tier 2: Resilient client reverse geocoding via BigDataCloud (free, client-safe fallback)
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3500);

          const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
          const res = await fetch(bdcUrl, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });
          clearTimeout(timer);

          if (res.ok) {
            const data = await res.json();
            const rawCity =
              data.city ||
              data.locality ||
              data.principalSubdivision ||
              '';
            const state = data.principalSubdivision || 'Local State';
            const country = data.countryName || '';
            const district =
              data.localityInfo?.administrative?.[2]?.name ||
              data.localityInfo?.administrative?.[1]?.name ||
              rawCity ||
              'Local District';

            const city = rawCity || findNearestCity(latitude, longitude)?.location.city || 'Detected City';
            const region = inferRegion(city, state, country);

            const location: SmartLocation = {
              query: `${city}, ${state}`,
              name: city,
              city,
              district,
              state,
              region,
              country,
              latitude,
              longitude,
              accuracy,
              source: 'geolocation',
            };

            resolve({ success: true, location });
            return;
          }
        } catch {
          // Fall through to Tier 3
        }

        // Tier 3: Local Haversine nearest city lookup against knowledge base
        const nearest = findNearestCity(latitude, longitude);
        if (nearest && nearest.distanceKm < 350) {
          resolve({
            success: true,
            location: {
              ...nearest.location,
              latitude,
              longitude,
              accuracy,
              source: 'geolocation',
            },
          });
          return;
        }

        // Tier 4: Coordinate-based fallback
        const latStr = `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}`;
        const lonStr = `${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}`;
        const autoCity = `GPS Area (${latStr}, ${lonStr})`;
        const autoState = 'Detected State';
        const autoRegion = `Health Sector ${latStr}`;

        resolve({
          success: true,
          location: {
            query: autoCity,
            name: autoCity,
            city: autoCity,
            district: 'Local District',
            state: autoState,
            region: autoRegion,
            latitude,
            longitude,
            accuracy,
            source: 'geolocation',
          },
        });
      },
      (geoError) => {
        let errorCode: GeolocationDetectionResult['errorCode'] = 'NETWORK_ERROR';
        let errorMsg = 'Could not retrieve your location from device.';

        if (geoError.code === geoError.PERMISSION_DENIED) {
          errorCode = 'PERMISSION_DENIED';
          errorMsg = 'Location permission was denied. You can enable location access in your browser or type your city manually.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          errorCode = 'POSITION_UNAVAILABLE';
          errorMsg = 'Location information is unavailable from your device sensors.';
        } else if (geoError.code === geoError.TIMEOUT) {
          errorCode = 'TIMEOUT';
          errorMsg = 'Location request timed out. Please try again or type manually.';
        }

        resolve({
          success: false,
          error: errorMsg,
          errorCode,
          location: resolveSmartLocation('Madurai'),
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Backward-compatible helper that resolves user current location
 */
export async function detectUserCurrentLocation(): Promise<SmartLocation> {
  const res = await detectUserCurrentLocationWithDetails();
  return res.location || resolveSmartLocation('Madurai');
}
