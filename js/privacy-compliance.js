/**
 * Privacy Compliance Utilities
 * Provides utilities for GDPR compliance across the website
 */

export class PrivacyCompliance {
    constructor() {
        this.userDataKey = 'user_personal_data';
        this.consentHistoryKey = 'consent_history';
    }

    /**
   * Data Subject Access Request (DSAR) - Export user data
   */
    exportUserData() {
        const userData = {
            metadata: {
                export_date: new Date().toISOString(),
                format_version: '1.0',
                data_controller: 'IrsikSoftware'
            },
            personal_data: this.collectPersonalData(),
            consent_history: this.getConsentHistory(),
            preferences: this.getUserPreferences(),
            activity_log: this.getActivityLog()
        };

        return userData;
    }

    /**
   * Collect all personal data stored in browser
   */
    collectPersonalData() {
        const personalData = {};

        // Iterate through localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // Only include keys that might contain personal data
            if (this.isPersonalDataKey(key)) {
                try {
                    personalData[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    personalData[key] = localStorage.getItem(key);
                }
            }
        }

        // Include cookies
        personalData.cookies = this.getCookies();

        return personalData;
    }

    /**
   * Check if a localStorage key contains personal data
   */
    isPersonalDataKey(key) {
        const personalDataPrefixes = [
            'user_',
            'profile_',
            'contact_',
            'email_',
            'name_',
            'preferences_',
            'settings_',
            'gdpr_'
        ];

        return personalDataPrefixes.some(prefix => key.startsWith(prefix));
    }

    /**
   * Get all cookies
   */
    getCookies() {
        const cookies = {};
        const cookieArray = document.cookie.split(';');

        cookieArray.forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = decodeURIComponent(value);
        });

        return cookies;
    }

    /**
   * Get consent history
   */
    getConsentHistory() {
        try {
            const history = localStorage.getItem(this.consentHistoryKey);
            return history ? JSON.parse(history) : [];
        } catch (e) {
            return [];
        }
    }

    /**
   * Record consent event
   */
    recordConsentEvent(action, details) {
        const history = this.getConsentHistory();
        const event = {
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            user_agent: navigator.userAgent
        };

        history.push(event);

        // Keep only last 100 events
        if (history.length > 100) {
            history.shift();
        }

        localStorage.setItem(this.consentHistoryKey, JSON.stringify(history));
    }

    /**
   * Get user preferences
   */
    getUserPreferences() {
        const preferences = {};

        // Cookie preferences
        try {
            const cookiePrefs = localStorage.getItem('gdpr_cookie_preferences');
            preferences.cookies = cookiePrefs ? JSON.parse(cookiePrefs) : null;
        } catch (e) {
            preferences.cookies = null;
        }

        // Theme preferences
        preferences.theme = localStorage.getItem('theme');

        // Language preferences
        preferences.language = localStorage.getItem('language');

        return preferences;
    }

    /**
   * Get activity log (limited to non-sensitive data)
   */
    getActivityLog() {
    // This would typically be fetched from a server
    // For now, return local activity indicators
        return {
            last_visit: localStorage.getItem('last_visit'),
            page_views: localStorage.getItem('page_views'),
            session_count: localStorage.getItem('session_count')
        };
    }

    /**
   * Download user data as JSON file
   */
    downloadUserData() {
        const userData = this.exportUserData();
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `personal-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
   * Right to be forgotten - Delete all user data
   */
    deleteAllUserData() {
    // Clear all localStorage that might contain personal data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (this.isPersonalDataKey(key) || key.includes('gdpr') || key.includes('consent')) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Clear all cookies
        this.deleteAllCookies();

        // Record this action before clearing
        console.log('All personal data has been deleted');

        return {
            success: true,
            message: 'All personal data has been deleted from this browser',
            items_removed: keysToRemove.length
        };
    }

    /**
   * Delete all cookies
   */
    deleteAllCookies() {
        const cookies = document.cookie.split(';');

        cookies.forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            // Delete cookie for all possible paths and domains
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
        });
    }

    /**
   * Anonymize user data (for analytics purposes)
   */
    anonymizeData(data) {
        const anonymized = JSON.parse(JSON.stringify(data));

        // Remove or hash identifying information
        const sensitiveFields = ['name', 'email', 'phone', 'address', 'ip_address'];

        const anonymizeObject = (obj) => {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (sensitiveFields.includes(key.toLowerCase())) {
                        obj[key] = '[REDACTED]';
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        anonymizeObject(obj[key]);
                    }
                }
            }
        };

        anonymizeObject(anonymized);
        return anonymized;
    }

    /**
   * Check data retention compliance
   */
    checkRetentionCompliance() {
        const retentionPeriods = {
            'gdpr_cookie_consent': 365, // 1 year
            'consent_history': 365 * 3, // 3 years
            'user_preferences': 365 * 2, // 2 years
            'session_data': 30 // 30 days
        };

        const now = new Date();
        const expiredData = [];

        for (const [key, days] of Object.entries(retentionPeriods)) {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.timestamp) {
                        const dataDate = new Date(parsed.timestamp);
                        const daysSinceCreation = (now - dataDate) / (1000 * 60 * 60 * 24);

                        if (daysSinceCreation > days) {
                            expiredData.push({
                                key,
                                days_old: Math.floor(daysSinceCreation),
                                retention_period: days
                            });
                        }
                    }
                } catch (e) {
                    // Not JSON or no timestamp
                }
            }
        }

        return {
            compliant: expiredData.length === 0,
            expired_data: expiredData
        };
    }

    /**
   * Clean up expired data
   */
    cleanupExpiredData() {
        const compliance = this.checkRetentionCompliance();

        compliance.expired_data.forEach(item => {
            localStorage.removeItem(item.key);
            console.log(`Removed expired data: ${item.key} (${item.days_old} days old)`);
        });

        return {
            success: true,
            items_removed: compliance.expired_data.length
        };
    }

    /**
   * Generate privacy compliance report
   */
    generateComplianceReport() {
        return {
            timestamp: new Date().toISOString(),
            data_stored: {
                localStorage_items: localStorage.length,
                personal_data_items: Object.keys(this.collectPersonalData()).length,
                cookies: Object.keys(this.getCookies()).length
            },
            consent_status: {
                has_consent: !!localStorage.getItem('gdpr_cookie_consent'),
                consent_date: this.getConsentDate(),
                preferences: this.getUserPreferences()
            },
            retention_compliance: this.checkRetentionCompliance(),
            user_rights: {
                can_export_data: true,
                can_delete_data: true,
                can_modify_consent: true,
                can_object_processing: true
            }
        };
    }

    /**
   * Get consent date
   */
    getConsentDate() {
        try {
            const consent = localStorage.getItem('gdpr_cookie_consent');
            if (consent) {
                const parsed = JSON.parse(consent);
                return parsed.timestamp || null;
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    /**
   * Show privacy dashboard
   */
    showPrivacyDashboard() {
        const report = this.generateComplianceReport();

        const modal = document.createElement('div');
        modal.id = 'privacy-dashboard-modal';
        modal.className = 'privacy-dashboard-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-label', 'Privacy Dashboard');
        modal.innerHTML = `
      <div class="privacy-dashboard-content">
        <div class="privacy-dashboard-header">
          <h2>Your Privacy Dashboard</h2>
          <button id="privacy-dashboard-close" class="btn-close" aria-label="Close">&times;</button>
        </div>
        <div class="privacy-dashboard-body">
          <div class="privacy-section">
            <h3>Data Stored</h3>
            <p>Personal data items: ${report.data_stored.personal_data_items}</p>
            <p>Cookies: ${report.data_stored.cookies}</p>
          </div>

          <div class="privacy-section">
            <h3>Consent Status</h3>
            <p>Consent given: ${report.consent_status.has_consent ? 'Yes' : 'No'}</p>
            ${report.consent_status.consent_date ? `<p>Consent date: ${new Date(report.consent_status.consent_date).toLocaleDateString()}</p>` : ''}
          </div>

          <div class="privacy-section">
            <h3>Your Rights</h3>
            <div class="privacy-actions">
              <button id="export-data-btn" class="btn btn-primary">Export My Data</button>
              <button id="delete-data-btn" class="btn btn-danger">Delete All My Data</button>
              <button id="manage-cookies-btn" class="btn btn-secondary">Manage Cookie Preferences</button>
            </div>
          </div>

          <div class="privacy-section">
            <h3>Data Retention</h3>
            <p>Compliance status: ${report.retention_compliance.compliant ? '✓ Compliant' : '⚠ Expired data found'}</p>
            ${!report.retention_compliance.compliant ? '<button id="cleanup-data-btn" class="btn btn-warning">Clean Up Expired Data</button>' : ''}
          </div>
        </div>
      </div>

      <style>
        .privacy-dashboard-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10002;
        }

        .privacy-dashboard-content {
          background: white;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 8px;
        }

        .privacy-dashboard-header {
          padding: 1.5rem;
          border-bottom: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .privacy-dashboard-header h2 {
          margin: 0;
          color: #333;
        }

        .privacy-dashboard-body {
          padding: 1.5rem;
        }

        .privacy-section {
          margin-bottom: 2rem;
        }

        .privacy-section h3 {
          margin-top: 0;
          color: #007bff;
        }

        .privacy-section p {
          color: #666;
          margin: 0.5rem 0;
        }

        .privacy-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .privacy-actions .btn {
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-warning {
          background: #ffc107;
          color: #000;
        }
      </style>
    `;

        document.body.appendChild(modal);
        this.attachDashboardEventListeners();
    }

    /**
   * Attach event listeners to dashboard
   */
    attachDashboardEventListeners() {
        document.getElementById('privacy-dashboard-close')?.addEventListener('click', () => {
            document.getElementById('privacy-dashboard-modal')?.remove();
        });

        document.getElementById('export-data-btn')?.addEventListener('click', () => {
            this.downloadUserData();
        });

        document.getElementById('delete-data-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all your personal data? This action cannot be undone.')) {
                this.deleteAllUserData();
                alert('All your personal data has been deleted.');
                document.getElementById('privacy-dashboard-modal')?.remove();
            }
        });

        document.getElementById('manage-cookies-btn')?.addEventListener('click', () => {
            document.getElementById('privacy-dashboard-modal')?.remove();
            if (window.cookieConsentManager) {
                window.cookieConsentManager.openPreferences();
            }
        });

        document.getElementById('cleanup-data-btn')?.addEventListener('click', () => {
            this.cleanupExpiredData();
            alert('Expired data has been cleaned up.');
            document.getElementById('privacy-dashboard-modal')?.remove();
        });
    }
}

// Initialize on page load
if (typeof window !== 'undefined') {
    window.privacyCompliance = new PrivacyCompliance();

    // Auto-cleanup expired data on page load
    window.addEventListener('load', () => {
        window.privacyCompliance.cleanupExpiredData();
    });
}
