/**
 * Social Media Feed Module
 * Displays aggregated social media posts from various platforms
 */

class SocialMediaFeed {
    constructor() {
        this.feedContainer = document.getElementById('socialFeedPosts');
        this.loadingElement = document.querySelector('.feed-loading');
        this.maxPosts = 6;
        this.refreshInterval = 300000; // 5 minutes
        this.init();
    }

    init() {
        if (!this.feedContainer) return;

        this.loadFeed();
        this.setupRefreshInterval();
        this.setupPlatformLinks();
    }

    async loadFeed() {
        try {
            // In a production environment, this would fetch from your backend API
            // which aggregates posts from various social media platforms
            const posts = await this.fetchSocialPosts();
            this.renderFeed(posts);
        } catch (error) {
            console.error('Failed to load social media feed:', error);
            this.showErrorState();
        }
    }

    async fetchSocialPosts() {
        // Simulated social media posts
        // In production, replace with actual API call to backend
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        id: 1,
                        platform: 'twitter',
                        author: 'IrsikSoftware',
                        avatar: 'https://via.placeholder.com/50',
                        content: 'Excited to announce our latest AI-powered analytics platform! Transform your data into actionable insights. #AI #MachineLearning #Analytics',
                        timestamp: new Date(Date.now() - 3600000),
                        likes: 45,
                        shares: 12,
                        url: 'https://twitter.com/irsiksoft/status/123456789'
                    },
                    {
                        id: 2,
                        platform: 'linkedin',
                        author: 'IrsikSoftware',
                        avatar: 'https://via.placeholder.com/50',
                        content: 'We are proud to share our latest case study on digital transformation for a Fortune 500 manufacturing company. See how we helped reduce operational costs by 35%.',
                        timestamp: new Date(Date.now() - 7200000),
                        likes: 128,
                        shares: 34,
                        url: 'https://linkedin.com/company/irsiksoft/posts/123456789'
                    },
                    {
                        id: 3,
                        platform: 'twitter',
                        author: 'IrsikSoftware',
                        avatar: 'https://via.placeholder.com/50',
                        content: 'Join our webinar next week on Cloud Architecture Best Practices! Learn from industry experts. Register now: irsik.software/webinar',
                        timestamp: new Date(Date.now() - 86400000),
                        likes: 67,
                        shares: 23,
                        url: 'https://twitter.com/irsiksoft/status/123456790'
                    },
                    {
                        id: 4,
                        platform: 'facebook',
                        author: 'IrsikSoftware',
                        avatar: 'https://via.placeholder.com/50',
                        content: 'Customer success story: How we helped a logistics company improve fleet efficiency by 40% using IoT and machine learning.',
                        timestamp: new Date(Date.now() - 172800000),
                        likes: 89,
                        shares: 19,
                        url: 'https://facebook.com/irsiksoft/posts/123456789'
                    },
                    {
                        id: 5,
                        platform: 'linkedin',
                        author: 'IrsikSoftware',
                        avatar: 'https://via.placeholder.com/50',
                        content: 'We are hiring! Looking for talented developers to join our growing team. Check out our open positions and apply today.',
                        timestamp: new Date(Date.now() - 259200000),
                        likes: 156,
                        shares: 42,
                        url: 'https://linkedin.com/company/irsiksoft/jobs'
                    },
                    {
                        id: 6,
                        platform: 'twitter',
                        author: 'IrsikSoftware',
                        avatar: 'https://via.placeholder.com/50',
                        content: 'DevOps best practices: Implementing CI/CD pipelines for faster deployment cycles. Read our latest blog post.',
                        timestamp: new Date(Date.now() - 345600000),
                        likes: 91,
                        shares: 27,
                        url: 'https://twitter.com/irsiksoft/status/123456791'
                    }
                ]);
            }, 1000);
        });
    }

    renderFeed(posts) {
        if (!posts || posts.length === 0) {
            this.showEmptyState();
            return;
        }

        const postsHTML = posts.slice(0, this.maxPosts).map(post => this.createPostCard(post)).join('');

        this.feedContainer.innerHTML = `
            <div class="social-feed-grid">
                ${postsHTML}
            </div>
        `;

        // Animate posts on load
        this.animatePosts();
    }

    createPostCard(post) {
        const platformIcon = this.getPlatformIcon(post.platform);
        const timeAgo = this.formatTimeAgo(post.timestamp);

        return `
            <article class="social-post-card" data-platform="${post.platform}">
                <div class="post-header">
                    <div class="post-author">
                        <div class="author-avatar" style="background-color: var(--color-primary-light);">
                            ${platformIcon}
                        </div>
                        <div class="author-info">
                            <h4 class="author-name">${this.escapeHtml(post.author)}</h4>
                            <time class="post-time" datetime="${post.timestamp.toISOString()}">${timeAgo}</time>
                        </div>
                    </div>
                    <span class="platform-badge ${post.platform}" aria-label="${post.platform}">
                        ${platformIcon}
                    </span>
                </div>
                <div class="post-content">
                    <p>${this.escapeHtml(post.content)}</p>
                </div>
                <div class="post-footer">
                    <div class="post-stats">
                        <span class="stat-item">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            ${post.likes}
                        </span>
                        <span class="stat-item">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                            </svg>
                            ${post.shares}
                        </span>
                    </div>
                    <a href="${post.url}" class="view-post-link" target="_blank" rel="noopener noreferrer" aria-label="View post on ${post.platform}">
                        View Post
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                        </svg>
                    </a>
                </div>
            </article>
        `;
    }

    getPlatformIcon(platform) {
        const icons = {
            twitter: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
            facebook: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
            linkedin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'
        };
        return icons[platform] || icons.twitter;
    }

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
            }
        }

        return 'Just now';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    animatePosts() {
        const posts = this.feedContainer.querySelectorAll('.social-post-card');
        posts.forEach((post, index) => {
            setTimeout(() => {
                post.classList.add('fade-in');
            }, index * 100);
        });
    }

    showEmptyState() {
        this.feedContainer.innerHTML = `
            <div class="feed-empty-state">
                <p>No posts available at the moment. Check back soon!</p>
            </div>
        `;
    }

    showErrorState() {
        this.feedContainer.innerHTML = `
            <div class="feed-error-state">
                <p>Unable to load social media feed. Please try again later.</p>
                <button class="retry-button" onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    setupRefreshInterval() {
        setInterval(() => {
            this.loadFeed();
        }, this.refreshInterval);
    }

    setupPlatformLinks() {
        const platformLinks = document.querySelectorAll('.social-platform-link');
        platformLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.gtag) {
                    const platform = link.classList.contains('twitter') ? 'twitter' :
                        link.classList.contains('facebook') ? 'facebook' :
                            link.classList.contains('linkedin') ? 'linkedin' : 'github';
                    window.gtag('event', 'social_platform_click', {
                        platform: platform
                    });
                }
            });
        });
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SocialMediaFeed();
    });
} else {
    new SocialMediaFeed();
}

export default SocialMediaFeed;
