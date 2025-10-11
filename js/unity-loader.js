/**
 * @fileoverview Unity WebGL Loader Script
 * Manages loading and initialization of Unity WebGL games with fallback demo mode.
 * Provides fullscreen functionality, game restart, and responsive canvas handling.
 *
 * @module unity-loader
 * @global gameConfig
 *
 * @example
 * // Loader automatically initializes on DOMContentLoaded
 * // Configure via global gameConfig object:
 * // window.gameConfig = {
 * //   dataUrl: 'path/to/unity/build.data',
 * //   frameworkUrl: 'path/to/unity/build.framework.js',
 * //   codeUrl: 'path/to/unity/build.wasm'
 * // };
 */

/* global gameConfig */
(function() {
    'use strict';

    let unityInstance = null;
    const container = document.querySelector('#unity-container');
    const canvas = document.querySelector('#unity-canvas');
    const loadingBar = document.querySelector('#unity-loading-bar');
    const progressBarFull = document.querySelector('#unity-progress-bar-full');
    const fullscreenButton = document.querySelector('#fullscreen-button');
    const restartButton = document.querySelector('#restart-button');

    /**
     * Displays warning/info banner message
     * @param {string} msg - Message to display
     * @param {string} type - Banner type ('error' or 'info')
     * @function
     */
    function showWarningBanner(msg, type) {
        const warningBanner = document.querySelector('#unity-warning');
        if (!warningBanner) return;

        warningBanner.innerHTML = msg;
        warningBanner.style.display = 'block';

        if (type === 'error') {
            warningBanner.style.background = 'rgba(255, 0, 0, 0.1)';
            warningBanner.style.color = '#ff0000';
        } else if (type === 'info') {
            warningBanner.style.background = 'rgba(0, 123, 255, 0.1)';
            warningBanner.style.color = '#007bff';
        }
    }

    /**
     * Initializes Unity WebGL loader or demo mode
     * @function
     */
    function initUnityLoader() {
        if (typeof gameConfig === 'undefined') {
            showWarningBanner('Game configuration not found. Please check the setup.', 'error');
            return;
        }

        // Show informational message about demo
        showWarningBanner(
            'Demo Mode: Unity build files would be loaded here. In production, this would load the actual Unity WebGL game. ' +
            'To test with real Unity builds, export your Unity project as WebGL and place the files in the configured paths.',
            'info'
        );

        // Simulate loading for demo purposes
        simulateLoading();
    }

    /**
     * Simulates Unity game loading progress for demo mode
     * @function
     */
    function simulateLoading() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 0.02;
            if (progressBarFull) {
                progressBarFull.style.width = (progress * 100) + '%';
            }

            if (progress >= 1) {
                clearInterval(interval);
                if (loadingBar) {
                    loadingBar.style.display = 'none';
                }

                // Display demo canvas
                displayDemoCanvas();
            }
        }, 50);
    }

    /**
     * Displays demo placeholder canvas with grid and instructions
     * @function
     */
    function displayDemoCanvas() {
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Draw placeholder content
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 50) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }

        // Draw text
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Unity WebGL Game Would Load Here', canvas.width / 2, canvas.height / 2 - 30);

        ctx.font = '16px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Export your Unity project as WebGL to test', canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('Place build files in: ' + (gameConfig.dataUrl || 'unity-builds/'), canvas.width / 2, canvas.height / 2 + 40);
    }

    /**
     * Toggles fullscreen mode for Unity game container
     * @function
     */
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    /**
     * Restarts or reloads the Unity game instance
     * @function
     */
    function restartGame() {
        if (unityInstance) {
            unityInstance.Quit().then(() => {
                initUnityLoader();
            });
        } else {
            // In demo mode, just reload the page
            window.location.reload();
        }
    }

    // Event listeners
    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', toggleFullscreen);
    }

    if (restartButton) {
        restartButton.addEventListener('click', restartGame);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        if (canvas && !unityInstance) {
            displayDemoCanvas();
        }
    });

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUnityLoader);
    } else {
        initUnityLoader();
    }
})();
