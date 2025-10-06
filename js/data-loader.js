/**
 * Data loading utility with retry logic and caching
 */

const cache = new Map();

/**
 * Loads JSON from a URL with retry logic and caching
 * @param {string} url - The URL to fetch JSON from
 * @returns {Promise<any>} The parsed JSON data
 * @throws {Error} If all retry attempts fail
 */
async function loadJSON(url) {
  // Return cached result if available
  if (cache.has(url)) {
    return cache.get(url);
  }

  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
      if (error.message.includes('not found') || error.name === 'SyntaxError') {
        throw error;
      }

      // If not the last attempt, wait with exponential backoff
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  throw new Error(`Failed to load JSON after ${maxAttempts} attempts: ${lastError.message}`);
}

/**
 * Clears the cache for a specific URL or all URLs
 * @param {string} [url] - Optional URL to clear, omit to clear all
 */
function clearCache(url) {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}

export { loadJSON, clearCache };
