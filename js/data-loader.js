/**
 * Data loader utility for fetching JSON files with retry logic and caching
 */

const cache = new Map();

/**
 * Load JSON data from a URL with retry logic and caching
 * @param {string} url - The URL to fetch JSON from
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<any>} The parsed JSON data
 */
export async function loadJSON(url, maxRetries = 3) {
  // Return cached result if available
  if (cache.has(url)) {
    return cache.get(url);
  }

  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Resource not found: ${url}`);
        }
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache successful result
      cache.set(url, data);

      return data;

    } catch (error) {
      lastError = error;

      // Don't retry on 404 or JSON parse errors
      if (error.message.includes('not found') || error instanceof SyntaxError) {
        throw error;
      }

      // Exponential backoff: wait before retrying (except on last attempt)
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  throw new Error(`Failed to load ${url} after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Clear the cache (useful for testing or forcing fresh data)
 */
export function clearCache() {
  cache.clear();
}
