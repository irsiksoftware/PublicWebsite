/**
 * Infinite Scroll for Mission Logs
 * Uses IntersectionObserver to lazy load table rows
 */

(function() {
  'use strict';

  // Configuration
  const ROWS_PER_LOAD = 20;
  const LOAD_DELAY = 800; // Simulate network delay
  const BACK_TO_TOP_THRESHOLD = 500; // px scrolled before showing button
  const TOTAL_MISSIONS = 200; // Total available missions

  // State
  let currentPage = 0;
  let isLoading = false;
  let hasMoreData = true;

  // DOM Elements
  const tableBody = document.getElementById('missionLogsTableBody');
  const sentinel = document.getElementById('missionLogsSentinel');
  const loader = document.getElementById('missionLogsLoader');
  const backToTopBtn = document.getElementById('backToTop');
  const tableWrapper = document.querySelector('.mission-logs__table-wrapper');

  // Sample mission data generator
  const missionNames = [
    'Battle of New York', 'Sokovia Incident', 'Infinity War', 'Endgame Operation',
    'Hydra Facility Raid', 'Multiverse Anomaly', 'Quantum Realm Exploration',
    'Chitauri Invasion', 'Ultron Crisis', 'Civil War Conflict', 'Wakanda Defense',
    'Titan Assault', 'Asgard Evacuation', 'Dark Dimension Breach', 'Kree Conflict',
    'Skrull Infiltration', 'Time Heist', 'Decimation Recovery', 'Snap Reversal',
    'Vormir Mission', 'Garden Reconnaissance', 'Compound Defense', 'New York Sanctum',
    'Kamar-Taj Protection', 'Ancient Artifact Recovery', 'Tesseract Retrieval'
  ];

  const agents = [
    'Tony Stark', 'Steve Rogers', 'Thor Odinson', 'Bruce Banner', 'Natasha Romanoff',
    'Clint Barton', 'Wanda Maximoff', 'Vision', 'Sam Wilson', 'Bucky Barnes',
    'T\'Challa', 'Peter Parker', 'Stephen Strange', 'Carol Danvers', 'Scott Lang',
    'Hope van Dyne', 'Nick Fury', 'Maria Hill', 'Phil Coulson', 'James Rhodes'
  ];

  const statuses = [
    { name: 'Completed', class: 'completed' },
    { name: 'Active', class: 'active' },
    { name: 'Failed', class: 'failed' },
    { name: 'Pending', class: 'pending' }
  ];

  const priorities = [
    { name: 'CRITICAL', class: 'critical' },
    { name: 'HIGH', class: 'high' },
    { name: 'MEDIUM', class: 'medium' },
    { name: 'LOW', class: 'low' }
  ];

  /**
   * Generate a mission row
   */
  function generateMission(id) {
    const missionName = missionNames[Math.floor(Math.random() * missionNames.length)];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    // Generate random date within last 5 years
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 1825));
    const formattedDate = date.toISOString().split('T')[0];

    return {
      id,
      missionName,
      date: formattedDate,
      agent,
      status,
      priority
    };
  }

  /**
   * Create table row element
   */
  function createTableRow(mission) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${mission.id}</td>
      <td>${mission.missionName}</td>
      <td>${mission.date}</td>
      <td>${mission.agent}</td>
      <td><span class="mission-logs__status mission-logs__status--${mission.status.class}">${mission.status.name}</span></td>
      <td><span class="mission-logs__priority mission-logs__priority--${mission.priority.class}">${mission.priority.name}</span></td>
    `;
    return tr;
  }

  /**
   * Load next batch of missions
   */
  function loadMoreMissions() {
    if (isLoading || !hasMoreData) return;

    isLoading = true;
    loader.style.display = 'block';

    // Simulate network request
    setTimeout(() => {
      const startId = currentPage * ROWS_PER_LOAD + 1;
      const endId = startId + ROWS_PER_LOAD;

      // Generate and append new rows
      const fragment = document.createDocumentFragment();
      for (let i = startId; i < endId && i <= TOTAL_MISSIONS; i++) {
        const mission = generateMission(i);
        const row = createTableRow(mission);
        fragment.appendChild(row);
      }

      tableBody.appendChild(fragment);
      currentPage++;

      // Check if we've loaded all data
      if (currentPage * ROWS_PER_LOAD >= TOTAL_MISSIONS) {
        hasMoreData = false;
        observer.unobserve(sentinel);
        loader.innerHTML = '<p style="color: var(--text-light); padding: 20px;">No more missions to load</p>';
      } else {
        loader.style.display = 'none';
      }

      isLoading = false;
    }, LOAD_DELAY);
  }

  /**
   * Initialize IntersectionObserver for sentinel element
   */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMoreData) {
          loadMoreMissions();
        }
      });
    },
    {
      root: tableWrapper,
      rootMargin: '100px',
      threshold: 0.1
    }
  );

  /**
   * Back to top button functionality
   */
  function handleScroll() {
    if (tableWrapper.scrollTop > BACK_TO_TOP_THRESHOLD) {
      backToTopBtn.style.display = 'block';
    } else {
      backToTopBtn.style.display = 'none';
    }
  }

  function scrollToTop() {
    tableWrapper.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Initialize
   */
  function init() {
    if (!tableBody || !sentinel || !loader || !backToTopBtn || !tableWrapper) {
      console.error('Mission logs elements not found');
      return;
    }

    // Load initial batch
    loadMoreMissions();

    // Start observing sentinel
    observer.observe(sentinel);

    // Back to top button
    tableWrapper.addEventListener('scroll', handleScroll);
    backToTopBtn.addEventListener('click', scrollToTop);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
