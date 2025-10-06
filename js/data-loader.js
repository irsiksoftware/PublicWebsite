/**
 * Data loader module for preloading JSON data files
 */

const DATA_FILES = {
  agents: '/data/agents.json',
  spyActivity: '/data/spy-activity.json',
  performance: '/data/performance-sample.json'
};

const dataCache = {};

/**
 * Fetch JSON data with error handling
 * @param {string} url - URL to fetch
 * @returns {Promise<Object>} Parsed JSON data
 */
async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
}

/**
 * Load all data files
 */
async function loadAllData() {
  try {
    const results = await Promise.all([
      fetchJSON(DATA_FILES.agents),
      fetchJSON(DATA_FILES.spyActivity),
      fetchJSON(DATA_FILES.performance)
    ]);

    dataCache.agents = results[0];
    dataCache.spyActivity = results[1];
    dataCache.performance = results[2];

    console.log('Data loaded successfully:', {
      agents: dataCache.agents?.length || 0,
      spyActivity: dataCache.spyActivity?.length || 0,
      performance: Object.keys(dataCache.performance || {}).length
    });
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Auto-load data when module loads
loadAllData();

// Export data cache for other modules
window.dataCache = dataCache;
