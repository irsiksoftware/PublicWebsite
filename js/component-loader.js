/**
 * Component Loader
 * Manages lazy loading of UI components with loading states
 */

import { lazyLoad, lazyLoadOnVisible, lazyLoadOnInteraction } from './lazy-loader.js';

/**
 * Show loading state for a component
 * @param {HTMLElement} container - Container element
 */
function showLoadingState(container) {
    const loader = document.createElement('div');
    loader.className = 'component-loading';
    loader.setAttribute('aria-live', 'polite');
    loader.setAttribute('aria-busy', 'true');
    loader.innerHTML = `
    <div class="spinner" role="status">
      <span class="sr-only">Loading...</span>
    </div>
  `;
    container.appendChild(loader);
    return loader;
}

/**
 * Hide loading state
 * @param {HTMLElement} loader - Loader element
 */
function hideLoadingState(loader) {
    if (loader && loader.parentNode) {
        loader.setAttribute('aria-busy', 'false');
        loader.remove();
    }
}

/**
 * Show error state
 * @param {HTMLElement} container - Container element
 * @param {Error} error - Error object
 */
function showErrorState(container) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'component-error';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.innerHTML = `
    <p>Failed to load component. Please try again.</p>
    <button class="retry-button">Retry</button>
  `;
    container.appendChild(errorDiv);
    return errorDiv;
}

/**
 * Load charts dynamically
 */
export async function loadCharts() {
    const chartContainers = document.querySelectorAll('[data-chart]');
    if (chartContainers.length === 0) return;

    const promises = [];

    chartContainers.forEach(container => {
        const chartType = container.dataset.chart;
        const loader = showLoadingState(container);

        const promise = lazyLoadOnVisible(container, async () => {
            try {
                let module;
                switch (chartType) {
                case 'success-rate':
                    module = await import('./success-rate-chart.js');
                    break;
                case 'token-usage':
                    module = await import('./token-usage-chart.js');
                    break;
                case 'cache-performance':
                    module = await import('./cache-performance-chart.js');
                    break;
                default:
                    module = await import('./charts.js');
                }
                hideLoadingState(loader);
                if (module.default) {
                    module.default(container);
                }
            } catch {
                hideLoadingState(loader);
                showErrorState(container);
            }
        });

        promises.push(promise);
    });

    return Promise.allSettled(promises);
}

/**
 * Load agent components dynamically
 */
export async function loadAgentComponents() {
    const agentMetricsTable = document.querySelector('[data-component="agent-metrics-table"]');
    const agentProfile = document.querySelector('[data-component="agent-profile"]');
    const agentSelector = document.querySelector('[data-component="agent-selector"]');

    const promises = [];

    if (agentMetricsTable) {
        const loader = showLoadingState(agentMetricsTable);
        promises.push(
            lazyLoadOnVisible(agentMetricsTable, async () => {
                try {
                    const module = await import('./agent-metrics-table.js');
                    hideLoadingState(loader);
                    if (module.default) module.default();
                } catch {
                    hideLoadingState(loader);
                    showErrorState(agentMetricsTable);
                }
            })
        );
    }

    if (agentProfile) {
        const loader = showLoadingState(agentProfile);
        promises.push(
            lazyLoadOnVisible(agentProfile, async () => {
                try {
                    const module = await import('./agent-profile.js');
                    hideLoadingState(loader);
                    if (module.default) module.default();
                } catch {
                    hideLoadingState(loader);
                    showErrorState(agentProfile);
                }
            })
        );
    }

    if (agentSelector) {
        promises.push(
            lazyLoad(() => import('./agent-selector.js'))
        );
    }

    return Promise.allSettled(promises);
}

/**
 * Load session components dynamically
 */
export async function loadSessionComponents() {
    const sessionTimeline = document.querySelector('[data-component="session-timeline"]');
    const sessionModal = document.querySelector('[data-component="session-modal"]');
    const auditSessions = document.querySelector('[data-component="audit-sessions"]');

    const promises = [];

    if (sessionTimeline) {
        const loader = showLoadingState(sessionTimeline);
        promises.push(
            lazyLoadOnVisible(sessionTimeline, async () => {
                try {
                    const module = await import('./session-timeline.js');
                    hideLoadingState(loader);
                    if (module.default) module.default();
                } catch {
                    hideLoadingState(loader);
                    showErrorState(sessionTimeline);
                }
            })
        );
    }

    if (sessionModal) {
        promises.push(
            lazyLoad(() => import('./session-detail-modal.js'))
        );
    }

    if (auditSessions) {
        const loader = showLoadingState(auditSessions);
        promises.push(
            lazyLoadOnVisible(auditSessions, async () => {
                try {
                    const module = await import('./audit-sessions.js');
                    hideLoadingState(loader);
                    if (module.default) module.default();
                } catch {
                    hideLoadingState(loader);
                    showErrorState(auditSessions);
                }
            })
        );
    }

    return Promise.allSettled(promises);
}

/**
 * Load game components dynamically
 */
export async function loadGameComponents() {
    const tetrisGame = document.querySelector('[data-component="tetris"]');
    const unityGame = document.querySelector('[data-component="unity-game"]');

    const promises = [];

    if (tetrisGame) {
        const playButton = tetrisGame.querySelector('.play-button');
        if (playButton) {
            promises.push(
                lazyLoadOnInteraction(playButton, async () => {
                    const [tetrisModule] = await Promise.all([
                        import('./tetris.js'),
                        import('./tetromino-shapes.js')
                    ]);
                    if (tetrisModule.default) tetrisModule.default();
                })
            );
        }
    }

    if (unityGame) {
        const loader = showLoadingState(unityGame);
        promises.push(
            lazyLoadOnVisible(unityGame, async () => {
                try {
                    const module = await import('./unity-loader.js');
                    hideLoadingState(loader);
                    if (module.default) module.default();
                } catch {
                    hideLoadingState(loader);
                    showErrorState(unityGame);
                }
            })
        );
    }

    return Promise.allSettled(promises);
}

/**
 * Load roles overview component
 */
export async function loadRolesOverview() {
    const rolesSection = document.querySelector('[data-component="roles-overview"]');
    if (!rolesSection) return;

    const loader = showLoadingState(rolesSection);

    return lazyLoadOnVisible(rolesSection, async () => {
        try {
            const module = await import('./roles-overview.js');
            hideLoadingState(loader);
            if (module.default) module.default();
        } catch {
            hideLoadingState(loader);
            showErrorState(rolesSection);
        }
    });
}

/**
 * Initialize all lazy-loaded components
 */
export async function initializeLazyComponents() {
    // Load critical components immediately
    const criticalPromises = [
        loadAgentComponents(),
        loadSessionComponents()
    ];

    // Load non-critical components on interaction/visibility
    const nonCriticalPromises = [
        loadCharts(),
        loadGameComponents(),
        loadRolesOverview()
    ];

    // Wait for critical components
    await Promise.allSettled(criticalPromises);

    // Load non-critical in background
    Promise.allSettled(nonCriticalPromises);
}
