/**
 * Custom App Install Prompt Handler
 * Manages smart app install banners for iOS, Android, and custom prompts
 */

class AppInstallPrompt {
    constructor() {
        this.deferredPrompt = null;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches
                        || window.navigator.standalone
                        || document.referrer.includes('android-app://');

        this.init();
    }

    init() {
    // Don't show prompts if already installed
        if (this.isStandalone) {
            return;
        }

        // Listen for the beforeinstallprompt event (Android/Desktop)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showCustomPrompt();
        });

        // Track installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.hideCustomPrompt();
            this.deferredPrompt = null;
        });

        // Show iOS install instructions if on iOS
        if (this.isIOS) {
            this.showIOSPrompt();
        }
    }

    showCustomPrompt() {
    // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem('app-install-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        // Don't show if dismissed within the last 7 days
        if (daysSinceDismissed < 7) {
            return;
        }

        const banner = this.createBanner(
            'Install our app for a better experience',
            'Install',
            () => this.triggerInstall()
        );

        document.body.appendChild(banner);
    }

    showIOSPrompt() {
    // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem('ios-install-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        // Don't show if dismissed within the last 7 days
        if (daysSinceDismissed < 7) {
            return;
        }

        const banner = this.createBanner(
            'Install this app: tap Share then "Add to Home Screen"',
            'Got it',
            () => this.dismissIOSPrompt(),
            'ios-install-banner'
        );

        document.body.appendChild(banner);
    }

    createBanner(message, buttonText, onAction, customClass = 'app-install-banner') {
        const banner = document.createElement('div');
        banner.className = customClass;
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'App installation prompt');
        banner.setAttribute('aria-live', 'polite');

        banner.innerHTML = `
      <div class="app-install-content">
        <p class="app-install-message">${message}</p>
        <div class="app-install-actions">
          <button class="app-install-button" aria-label="${buttonText}">
            ${buttonText}
          </button>
          <button class="app-install-dismiss" aria-label="Dismiss">
            ×
          </button>
        </div>
      </div>
    `;

        const installButton = banner.querySelector('.app-install-button');
        const dismissButton = banner.querySelector('.app-install-dismiss');

        installButton.addEventListener('click', () => {
            onAction();
            banner.remove();
        });

        dismissButton.addEventListener('click', () => {
            this.dismissPrompt(customClass);
            banner.remove();
        });

        return banner;
    }

    async triggerInstall() {
        if (!this.deferredPrompt) {
            return;
        }

        this.deferredPrompt.prompt();

        const { outcome } = await this.deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
            localStorage.setItem('app-install-dismissed', Date.now().toString());
        }

        this.deferredPrompt = null;
    }

    dismissPrompt(bannerClass = 'app-install-banner') {
        const storageKey = bannerClass === 'ios-install-banner'
            ? 'ios-install-dismissed'
            : 'app-install-dismissed';

        localStorage.setItem(storageKey, Date.now().toString());
    }

    dismissIOSPrompt() {
        localStorage.setItem('ios-install-dismissed', Date.now().toString());
    }

    hideCustomPrompt() {
        const banner = document.querySelector('.app-install-banner');
        if (banner) {
            banner.remove();
        }
    }
}

// Initialize the app install prompt handler
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AppInstallPrompt();
    });
} else {
    new AppInstallPrompt();
}
