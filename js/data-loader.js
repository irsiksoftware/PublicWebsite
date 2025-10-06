/**
 * Data loading utility with retry logic, caching, and error handling UI
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

/**
 * Creates a user-friendly error message element
 * @param {Error} error - The error that occurred
 * @param {string} dataFile - The file that failed to load
 * @param {Function} retryCallback - Function to call when retry button is clicked
 * @returns {HTMLElement} The error message element
 */
function createErrorMessage(error, dataFile, retryCallback) {
  const container = document.createElement('div');
  container.className = 'data-error-message';
  container.style.cssText = `
    padding: 20px;
    margin: 10px 0;
    background-color: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 4px;
    color: #856404;
  `;

  const title = document.createElement('h4');
  title.textContent = 'Data unavailable';
  title.style.cssText = 'margin: 0 0 10px 0; font-weight: bold;';

  const message = document.createElement('p');
  message.style.cssText = 'margin: 0 0 10px 0;';

  if (error.message.includes('not found') || error.message.includes('404')) {
    message.textContent = `The data file "${dataFile}" is missing. Please run the aggregation tool to generate the required data files.`;
  } else if (error.message.includes('network') || error.message.includes('fetch')) {
    message.textContent = `Network error loading "${dataFile}". Please check your connection and try again.`;
  } else {
    message.textContent = `Error loading "${dataFile}": ${error.message}`;
  }

  const retryButton = document.createElement('button');
  retryButton.textContent = 'Retry';
  retryButton.style.cssText = `
    padding: 8px 16px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  `;
  retryButton.addEventListener('click', retryCallback);
  retryButton.addEventListener('mouseenter', () => {
    retryButton.style.backgroundColor = '#0056b3';
  });
  retryButton.addEventListener('mouseleave', () => {
    retryButton.style.backgroundColor = '#007bff';
  });

  container.appendChild(title);
  container.appendChild(message);
  container.appendChild(retryButton);

  return container;
}

/**
 * Handles data loading errors by displaying a user-friendly message
 * @param {HTMLElement} targetElement - The element to display the error in
 * @param {Error} error - The error that occurred
 * @param {string} dataFile - The file that failed to load
 * @param {Function} retryCallback - Function to call when retry is attempted
 */
function handleDataError(targetElement, error, dataFile, retryCallback) {
  if (!targetElement) {
    console.error('Target element for error display not found');
    return;
  }

  // Clear loading state
  targetElement.innerHTML = '';

  // Create and append error message
  const errorElement = createErrorMessage(error, dataFile, retryCallback);
  targetElement.appendChild(errorElement);

  // Log error for debugging
  console.error(`Failed to load ${dataFile}:`, error);
}

export { loadJSON, clearCache, handleDataError };
