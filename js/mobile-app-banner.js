/**
 * Mobile App Install Banner
 * Handles custom app install prompts for Progressive Web Apps
 * Provides smart banner functionality for iOS and Android devices
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    STORAGE_KEY: 'app-install-banner-dismissed',
    DISMISS_DURATION_DAYS: 30,
    MIN_TIME_ON_SITE_MS: 3000, // Show after 3 seconds
    IOS_APP_STORE_URL: 'https://apps.apple.com/app/YOUR_APP_ID',
    ANDROID_PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME'
  };

  let deferredPrompt = null;

  /**
   * Detects if the device is iOS
   * @returns {boolean} True if iOS device
   */
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  /**
   * Detects if the device is Android
   * @returns {boolean} True if Android device
   */
  function isAndroid() {
    return /Android/.test(navigator.userAgent);
  }

  /**
   * Checks if the app is already installed (running in standalone mode)
   * @returns {boolean} True if app is installed
   */
  function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  /**
   * Checks if the banner was recently dismissed
   * @returns {boolean} True if banner should remain hidden
   */
  function wasBannerDismissed() {
    try {
      const dismissedDate = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!dismissedDate) return false;

      const daysSinceDismissed = (Date.now() - parseInt(dismissedDate, 10)) / (1000 * 60 * 60 * 24);
      return daysSinceDismissed < CONFIG.DISMISS_DURATION_DAYS;
    } catch (e) {
      console.warn('Error checking banner dismissal status:', e);
      return false;
    }
  }

  /**
   * Marks the banner as dismissed
   */
  function markBannerDismissed() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Error saving banner dismissal status:', e);
    }
  }

  /**
   * Shows the app install banner
   */
  function showBanner() {
    const banner = document.getElementById('app-install-banner');
    if (banner) {
      banner.style.display = 'block';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', 'Install app prompt');
    }
  }

  /**
   * Hides the app install banner
   */
  function hideBanner() {
    const banner = document.getElementById('app-install-banner');
    if (banner) {
      banner.style.display = 'none';
    }
  }

  /**
   * Handles the install button click
   */
  async function handleInstall() {
    if (isIOS()) {
      // For iOS, redirect to App Store
      window.location.href = CONFIG.IOS_APP_STORE_URL;
    } else if (isAndroid() && deferredPrompt) {
      // For Android with PWA support
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }

        deferredPrompt = null;
        hideBanner();
        markBannerDismissed();
      } catch (error) {
        console.error('Error showing install prompt:', error);
        // Fallback to Play Store
        window.location.href = CONFIG.ANDROID_PLAY_STORE_URL;
      }
    } else if (isAndroid()) {
      // For Android without PWA support, redirect to Play Store
      window.location.href = CONFIG.ANDROID_PLAY_STORE_URL;
    } else {
      // For other platforms, try to show the deferred prompt
      if (deferredPrompt) {
        try {
          await deferredPrompt.prompt();
          const choiceResult = await deferredPrompt.userChoice;

          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          }

          deferredPrompt = null;
          hideBanner();
          markBannerDismissed();
        } catch (error) {
          console.error('Error showing install prompt:', error);
        }
      }
    }
  }

  /**
   * Handles the close button click
   */
  function handleClose() {
    hideBanner();
    markBannerDismissed();
  }

  /**
   * Initializes the mobile app banner
   */
  function initBanner() {
    // Don't show banner if:
    // - App is already installed
    // - Banner was recently dismissed
    // - Not on mobile device
    if (isAppInstalled() || wasBannerDismissed() || (!isIOS() && !isAndroid() && !deferredPrompt)) {
      return;
    }

    // Wait before showing the banner
    setTimeout(() => {
      showBanner();

      // Set up event listeners
      const installButton = document.getElementById('app-install-button');
      const closeButton = document.getElementById('app-install-close');

      if (installButton) {
        installButton.addEventListener('click', handleInstall);
      }

      if (closeButton) {
        closeButton.addEventListener('click', handleClose);
      }
    }, CONFIG.MIN_TIME_ON_SITE_MS);
  }

  /**
   * Listen for the beforeinstallprompt event (PWA)
   */
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default browser install prompt
    e.preventDefault();

    // Store the event for later use
    deferredPrompt = e;

    console.log('beforeinstallprompt event captured');

    // Initialize our custom banner
    if (!isAppInstalled() && !wasBannerDismissed()) {
      setTimeout(showBanner, CONFIG.MIN_TIME_ON_SITE_MS);
    }
  });

  /**
   * Listen for app install success
   */
  window.addEventListener('appinstalled', () => {
    console.log('App was installed successfully');
    hideBanner();
    deferredPrompt = null;
  });

  /**
   * Initialize when DOM is ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBanner);
  } else {
    initBanner();
  }

  // Export for testing purposes
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      isIOS,
      isAndroid,
      isAppInstalled,
      wasBannerDismissed,
      showBanner,
      hideBanner
    };
  }
})();
