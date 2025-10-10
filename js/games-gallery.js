/**
 * Unity Games Gallery
 * Handles filtering, sorting, and displaying Unity games
 */

// Sample game data
const gamesData = [
    {
        id: 1,
        name: 'Candy Rush',
        description: 'Engaging match-3 puzzle game with smooth animations and level progression',
        category: 'puzzle',
        thumbnail: 'images/candy-rush-thumb.jpg',
        rating: 4.5,
        ratingCount: 1247,
        plays: 15420,
        url: 'https://unity.irsik.software/games/candyrush',
        releaseDate: '2024-08-15'
    },
    {
        id: 2,
        name: 'Space Explorer',
        description: 'Navigate through asteroid fields and discover new planets in this action-packed adventure',
        category: 'action',
        thumbnail: 'images/space-explorer-thumb.jpg',
        rating: 4.7,
        ratingCount: 892,
        plays: 12350,
        url: 'https://unity.irsik.software/games/spaceexplorer',
        releaseDate: '2024-09-01'
    },
    {
        id: 3,
        name: 'Tower Defense Pro',
        description: 'Strategic tower defense game with multiple upgrade paths and challenging levels',
        category: 'strategy',
        thumbnail: 'images/tower-defense-thumb.jpg',
        rating: 4.3,
        ratingCount: 654,
        plays: 8920,
        url: 'https://unity.irsik.software/games/towerdefense',
        releaseDate: '2024-07-20'
    },
    {
        id: 4,
        name: 'Puzzle Master',
        description: 'Brain-teasing puzzles that will challenge your logic and problem-solving skills',
        category: 'puzzle',
        thumbnail: 'images/puzzle-master-thumb.jpg',
        rating: 4.6,
        ratingCount: 1103,
        plays: 11680,
        url: 'https://unity.irsik.software/games/puzzlemaster',
        releaseDate: '2024-06-10'
    },
    {
        id: 5,
        name: 'Dungeon Quest',
        description: 'Explore dark dungeons, fight monsters, and collect treasure in this adventure game',
        category: 'adventure',
        thumbnail: 'images/dungeon-quest-thumb.jpg',
        rating: 4.8,
        ratingCount: 2134,
        plays: 18750,
        url: 'https://unity.irsik.software/games/dungeonquest',
        releaseDate: '2024-10-01'
    },
    {
        id: 6,
        name: 'Racing Fever',
        description: 'High-speed racing with realistic physics and multiple tracks to master',
        category: 'action',
        thumbnail: 'images/racing-fever-thumb.jpg',
        rating: 4.4,
        ratingCount: 978,
        plays: 13240,
        url: 'https://unity.irsik.software/games/racingfever',
        releaseDate: '2024-08-28'
    },
    {
        id: 7,
        name: 'Kingdom Builder',
        description: 'Build and manage your medieval kingdom in this strategic simulation game',
        category: 'strategy',
        thumbnail: 'images/kingdom-builder-thumb.jpg',
        rating: 4.5,
        ratingCount: 1456,
        plays: 16890,
        url: 'https://unity.irsik.software/games/kingdombuilder',
        releaseDate: '2024-07-05'
    },
    {
        id: 8,
        name: 'Gem Crusher',
        description: 'Match colorful gems and create powerful combos in this addictive puzzle game',
        category: 'puzzle',
        thumbnail: 'images/gem-crusher-thumb.jpg',
        rating: 4.2,
        ratingCount: 834,
        plays: 9560,
        url: 'https://unity.irsik.software/games/gemcrusher',
        releaseDate: '2024-09-15'
    }
];

/**
 * Initialize the games gallery
 */
function initGamesGallery() {
    renderGames(gamesData);
    attachEventListeners();
}

/**
 * Render games to the grid
 * @param {Array} games - Array of game objects to render
 */
function renderGames(games) {
    const gamesGrid = document.getElementById('games-grid');
    const noResults = document.getElementById('no-results');

    if (!gamesGrid) return;

    if (games.length === 0) {
        gamesGrid.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
        return;
    }

    if (noResults) noResults.style.display = 'none';

    gamesGrid.innerHTML = games.map(game => createGameCard(game)).join('');
}

/**
 * Create HTML for a game card
 * @param {Object} game - Game object
 * @returns {string} HTML string for the game card
 */
function createGameCard(game) {
    const stars = createStarRating(game.rating);

    return `
        <article class="game-card" data-category="${game.category}" data-game-id="${game.id}">
            <div class="game-thumbnail">
                <img src="${game.thumbnail}" alt="${game.name} thumbnail" loading="lazy" onerror="this.src='images/placeholder-game.jpg'">
                <span class="game-category-badge">${game.category}</span>
            </div>
            <div class="game-info">
                <h3 class="game-title">${game.name}</h3>
                <p class="game-description">${game.description}</p>

                <div class="game-stats">
                    <div class="stat">
                        <span class="stat-label">Plays</span>
                        <span class="stat-value">${formatNumber(game.plays)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Rating</span>
                        <div class="game-rating">
                            <div class="stars" aria-label="Rating: ${game.rating} out of 5 stars">
                                ${stars}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="rating-info">
                    <span class="rating-value">${game.rating.toFixed(1)}</span>
                    <span class="rating-count">(${formatNumber(game.ratingCount)} ratings)</span>
                </div>

                <a href="${game.url}" class="play-button" target="_blank" rel="noopener noreferrer" aria-label="Play ${game.name}">
                    Play Now
                </a>
            </div>
        </article>
    `;
}

/**
 * Create star rating HTML
 * @param {number} rating - Rating value (0-5)
 * @returns {string} HTML string for stars
 */
function createStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<span class="star">★</span>';
    }

    // Half star
    if (hasHalfStar) {
        stars += '<span class="star">★</span>';
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars += '<span class="star empty">☆</span>';
    }

    return stars;
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
    return num.toLocaleString('en-US');
}

/**
 * Attach event listeners to filter controls
 */
function attachEventListeners() {
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const searchInput = document.getElementById('search-input');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilters);
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
}

/**
 * Apply filters and sorting to games
 */
function applyFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const searchInput = document.getElementById('search-input');

    let filtered = [...gamesData];

    // Apply category filter
    if (categoryFilter && categoryFilter.value !== 'all') {
        filtered = filtered.filter(game => game.category === categoryFilter.value);
    }

    // Apply search filter
    if (searchInput && searchInput.value.trim() !== '') {
        const searchTerm = searchInput.value.toLowerCase().trim();
        filtered = filtered.filter(game =>
            game.name.toLowerCase().includes(searchTerm) ||
            game.description.toLowerCase().includes(searchTerm)
        );
    }

    // Apply sorting
    if (sortFilter) {
        const sortBy = sortFilter.value;
        filtered = sortGames(filtered, sortBy);
    }

    renderGames(filtered);
}

/**
 * Sort games by specified criteria
 * @param {Array} games - Array of games to sort
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted games array
 */
function sortGames(games, sortBy) {
    const sorted = [...games];

    switch (sortBy) {
    case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
    case 'plays':
        return sorted.sort((a, b) => b.plays - a.plays);
    case 'newest':
        return sorted.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
        return sorted;
    }
}

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGamesGallery);
} else {
    initGamesGallery();
}
