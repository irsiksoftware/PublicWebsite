/**
 * Social Media Share Module
 * Handles social media sharing functionality across the website
 */

class SocialMediaShare {
    constructor() {
        this.shareButtons = document.querySelectorAll('.social-share-btn');
        this.successMessage = document.querySelector('.share-success-message');
        this.init();
    }

    init() {
        if (!this.shareButtons.length) return;

        this.shareButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleShare(e));
        });

        // Track share events for analytics
        this.trackShareEvents();
    }

    handleShare(event) {
        const button = event.currentTarget;
        const platform = button.dataset.platform;
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        const description = encodeURIComponent(
            document.querySelector('meta[name="description"]')?.content || ''
        );

        switch (platform) {
        case 'twitter':
            this.shareToTwitter(url, title);
            break;
        case 'facebook':
            this.shareToFacebook(url);
            break;
        case 'linkedin':
            this.shareToLinkedIn(url);
            break;
        case 'email':
            this.shareViaEmail(title, url);
            break;
        case 'copy':
            this.copyToClipboard(window.location.href);
            break;
        }

        // Track share event
        this.logShareEvent(platform);
    }

    shareToTwitter(url, title) {
        const twitterUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}&via=irsiksoft`;
        this.openShareWindow(twitterUrl, 'Twitter Share', 550, 420);
    }

    shareToFacebook(url) {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        this.openShareWindow(facebookUrl, 'Facebook Share', 550, 420);
    }

    shareToLinkedIn(url) {
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        this.openShareWindow(linkedInUrl, 'LinkedIn Share', 550, 420);
    }

    shareViaEmail(title, url) {
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(`Check out this page: ${decodeURIComponent(url)}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        this.showSuccessMessage('Email client opened');
    }

    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                this.showSuccessMessage('Link copied to clipboard!');
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showSuccessMessage('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showSuccessMessage('Failed to copy link', true);
        }
    }

    openShareWindow(url, title, width, height) {
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        const options = `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no`;

        window.open(url, title, options);
    }

    showSuccessMessage(message, isError = false) {
        if (!this.successMessage) return;

        this.successMessage.textContent = message;
        this.successMessage.classList.add('visible');
        this.successMessage.classList.toggle('error', isError);

        setTimeout(() => {
            this.successMessage.classList.remove('visible');
            this.successMessage.classList.remove('error');
        }, 3000);
    }

    logShareEvent(platform) {
        // Track with analytics if available
        if (window.gtag) {
            window.gtag('event', 'share', {
                method: platform,
                content_type: 'page',
                item_id: window.location.pathname
            });
        }

        // Track with custom analytics events
        if (window.analyticsEvents) {
            window.analyticsEvents.track('social_share', {
                platform: platform,
                url: window.location.href,
                page: document.title
            });
        }
    }

    trackShareEvents() {
        // Add visual feedback on hover
        this.shareButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.classList.add('hover-active');
            });

            button.addEventListener('mouseleave', () => {
                button.classList.remove('hover-active');
            });
        });
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SocialMediaShare();
    });
} else {
    new SocialMediaShare();
}

export default SocialMediaShare;
