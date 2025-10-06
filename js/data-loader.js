/**
 * Data loader module for fetching JSON data files
 */

async function loadData() {
  try {
    const [agents, spyActivity, performance] = await Promise.all([
      fetch('/data/agents.json').then(res => res.json()),
      fetch('/data/spy-activity.json').then(res => res.json()),
      fetch('/data/performance.json').then(res => res.json())
    ]);

    console.log('Data loaded', { agents, spyActivity, performance });

    return { agents, spyActivity, performance };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}

// Auto-load on module import
loadData();
