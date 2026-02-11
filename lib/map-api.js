/**
 * Map API client for PostGIS server.
 * Provides fetch utilities for map-related endpoints.
 */

const MAP_SERVER = process.env.NEXT_PUBLIC_MAP_SERVER || "http://localhost:3001";

/**
 * Fetch all cities from the server.
 * @returns {Promise<Array>} List of city objects
 */
export async function fetchCities() {
  const res = await fetch(`${MAP_SERVER}/api/cities`);
  if (!res.ok) {
    throw new Error(`Failed to load cities: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch city SVG map by slug.
 * @param {string} slug - City slug
 * @returns {Promise<string>} SVG text content
 */
export async function fetchCityMap(slug) {
  const res = await fetch(`${MAP_SERVER}/api/map/${slug}`);
  if (!res.ok) {
    throw new Error(`Failed to load SVG for ${slug}: ${res.status}`);
  }
  return res.text();
}

/**
 * Fetch venues list for a city.
 * @param {string} slug - City slug
 * @returns {Promise<Array>} List of venue objects
 */
export async function fetchVenues(slug) {
  const res = await fetch(`${MAP_SERVER}/api/venues-list/${slug}`);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to load venues for ${slug}: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch events for a city.
 * @param {string} slug - City slug
 * @returns {Promise<Array>} List of event objects
 */
export async function fetchEvents(slug) {
  const res = await fetch(`${MAP_SERVER}/api/events/${slug}`);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to load events for ${slug}: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch spotlight NFTs for a city (5 NFTs from different venues).
 * @param {string} slug - City slug
 * @param {number} limit - Number of NFTs to fetch (default: 5)
 * @returns {Promise<Array>} List of NFT objects
 */
export async function fetchSpotlightNfts(slug, limit = 5) {
  const res = await fetch(`${MAP_SERVER}/api/nfts/${slug}/spotlight?limit=${limit}`);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to load spotlight NFTs for ${slug}: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch NFTs for a specific venue.
 * @param {string} slug - City slug
 * @param {string} venueId - Venue UUID
 * @returns {Promise<Array>} List of NFT objects
 */
export async function fetchVenueNfts(slug, venueId) {
  const res = await fetch(`${MAP_SERVER}/api/nfts/${slug}?venue=${venueId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch venue NFTs: ${res.status}`);
  }
  return res.json();
}

export { MAP_SERVER };
