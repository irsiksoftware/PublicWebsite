/**
 * Data Processing Agreements (DPA) Management
 * Handles data processing agreements for GDPR compliance
 */

export class DataProcessingAgreementManager {
    constructor() {
        this.dpaKey = 'gdpr_dpa_status';
        this.processors = [
            {
                id: 'analytics',
                name: 'Google Analytics',
                purpose: 'Website analytics and user behavior tracking',
                dataTypes: ['IP addresses', 'browser information', 'page views', 'session data'],
                location: 'USA (Google LLC)',
                safeguards: 'Standard Contractual Clauses, Privacy Shield (where applicable)',
                retentionPeriod: '26 months',
                website: 'https://policies.google.com/privacy'
            },
            {
                id: 'hosting',
                name: 'Cloud Hosting Provider',
                purpose: 'Website hosting and content delivery',
                dataTypes: ['All website data', 'user information', 'technical data'],
                location: 'EEA',
                safeguards: 'GDPR-compliant data center, EU-based servers',
                retentionPeriod: 'Duration of service',
                website: '#'
            },
            {
                id: 'email',
                name: 'Email Service Provider',
                purpose: 'Transactional and marketing emails',
                dataTypes: ['Email addresses', 'names', 'communication preferences'],
                location: 'USA',
                safeguards: 'Standard Contractual Clauses',
                retentionPeriod: 'Until consent is withdrawn',
                website: '#'
            },
            {
                id: 'crm',
                name: 'CRM System',
                purpose: 'Customer relationship management',
                dataTypes: ['Contact information', 'interaction history', 'preferences'],
                location: 'EEA',
                safeguards: 'GDPR-compliant processing',
                retentionPeriod: '7 years for business records',
                website: '#'
            }
        ];
    }

    /**
   * Get all data processors
   */
    getProcessors() {
        return this.processors;
    }

    /**
   * Get processor by ID
   */
    getProcessor(id) {
        return this.processors.find(p => p.id === id);
    }

    /**
   * Generate DPA HTML for display
   */
    generateDPAHTML() {
        return `
      <div class="dpa-container">
        <h2>Data Processing Information</h2>
        <p>As part of our commitment to transparency under GDPR, we provide information about third-party processors who handle your personal data on our behalf.</p>

        ${this.processors.map(processor => `
          <div class="dpa-card">
            <h3>${processor.name}</h3>

            <div class="dpa-field">
              <strong>Purpose:</strong>
              <p>${processor.purpose}</p>
            </div>

            <div class="dpa-field">
              <strong>Data Types Processed:</strong>
              <ul>
                ${processor.dataTypes.map(type => `<li>${type}</li>`).join('')}
              </ul>
            </div>

            <div class="dpa-field">
              <strong>Processing Location:</strong>
              <p>${processor.location}</p>
            </div>

            <div class="dpa-field">
              <strong>Data Protection Safeguards:</strong>
              <p>${processor.safeguards}</p>
            </div>

            <div class="dpa-field">
              <strong>Retention Period:</strong>
              <p>${processor.retentionPeriod}</p>
            </div>

            ${processor.website !== '#' ? `
              <div class="dpa-field">
                <a href="${processor.website}" target="_blank" rel="noopener noreferrer" class="dpa-link">
                  View Privacy Policy &rarr;
                </a>
              </div>
            ` : ''}
          </div>
        `).join('')}

        <div class="dpa-footer">
          <h3>Your Rights</h3>
          <p>You have the right to:</p>
          <ul>
            <li>Request information about which processors handle your data</li>
            <li>Object to processing by specific processors</li>
            <li>Request data deletion from all processors</li>
            <li>Obtain a copy of data processed by these third parties</li>
          </ul>
          <p>To exercise these rights, please contact us at <a href="mailto:dpo@irsik.software">dpo@irsik.software</a>.</p>
        </div>

        <style>
          .dpa-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
          }

          .dpa-container h2 {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #333;
          }

          .dpa-container > p {
            margin-bottom: 2rem;
            color: #666;
            line-height: 1.6;
          }

          .dpa-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }

          .dpa-card h3 {
            margin-top: 0;
            margin-bottom: 1rem;
            color: #007bff;
            font-size: 1.5rem;
          }

          .dpa-field {
            margin-bottom: 1rem;
          }

          .dpa-field:last-child {
            margin-bottom: 0;
          }

          .dpa-field strong {
            display: block;
            margin-bottom: 0.25rem;
            color: #333;
          }

          .dpa-field p {
            margin: 0;
            color: #666;
            line-height: 1.5;
          }

          .dpa-field ul {
            margin: 0.5rem 0 0 0;
            padding-left: 1.5rem;
            color: #666;
          }

          .dpa-field li {
            margin-bottom: 0.25rem;
          }

          .dpa-link {
            display: inline-block;
            color: #007bff;
            text-decoration: none;
            font-weight: 600;
            margin-top: 0.5rem;
          }

          .dpa-link:hover {
            text-decoration: underline;
          }

          .dpa-footer {
            background: #e9ecef;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 2rem;
          }

          .dpa-footer h3 {
            margin-top: 0;
            margin-bottom: 1rem;
            color: #333;
          }

          .dpa-footer p {
            margin-bottom: 1rem;
            color: #666;
            line-height: 1.6;
          }

          .dpa-footer ul {
            margin: 0.5rem 0 1rem 0;
            padding-left: 1.5rem;
            color: #666;
          }

          .dpa-footer li {
            margin-bottom: 0.5rem;
          }

          .dpa-footer a {
            color: #007bff;
            text-decoration: none;
          }

          .dpa-footer a:hover {
            text-decoration: underline;
          }

          @media (max-width: 768px) {
            .dpa-container {
              padding: 1rem;
            }

            .dpa-card {
              padding: 1rem;
            }

            .dpa-container h2 {
              font-size: 1.5rem;
            }

            .dpa-card h3 {
              font-size: 1.25rem;
            }
          }
        </style>
      </div>
    `;
    }

    /**
   * Render DPA information to a container
   */
    renderToContainer(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.generateDPAHTML();
        }
    }

    /**
   * Export processor information as JSON
   */
    exportProcessorData() {
        return JSON.stringify(this.processors, null, 2);
    }

    /**
   * Generate data processing record for compliance documentation
   */
    generateProcessingRecord() {
        return {
            controller: {
                name: 'IrsikSoftware',
                contact: 'dpo@irsik.software',
                representative: 'Data Protection Officer'
            },
            processors: this.processors.map(processor => ({
                name: processor.name,
                purpose: processor.purpose,
                categories_of_data: processor.dataTypes,
                categories_of_data_subjects: ['Website visitors', 'Customers', 'Newsletter subscribers'],
                retention_period: processor.retentionPeriod,
                technical_and_organizational_measures: processor.safeguards,
                international_transfers: processor.location.includes('USA') || !processor.location.includes('EEA')
                    ? {
                        destination: processor.location,
                        safeguards: processor.safeguards
                    }
                    : null
            })),
            generated_date: new Date().toISOString()
        };
    }

    /**
   * Check if user has acknowledged data processing information
   */
    hasAcknowledgedDPA() {
        return localStorage.getItem(this.dpaKey) === 'acknowledged';
    }

    /**
   * Record user acknowledgement of DPA information
   */
    acknowledgeDPA() {
        localStorage.setItem(this.dpaKey, 'acknowledged');
        localStorage.setItem(`${this.dpaKey}_date`, new Date().toISOString());
    }

    /**
   * Get acknowledgement date
   */
    getAcknowledgementDate() {
        return localStorage.getItem(`${this.dpaKey}_date`);
    }
}

// Initialize on page load
if (typeof window !== 'undefined') {
    window.dataProcessingAgreementManager = new DataProcessingAgreementManager();

    // Auto-render if container exists
    document.addEventListener('DOMContentLoaded', () => {
        const dpaContainer = document.getElementById('dpa-information');
        if (dpaContainer) {
            window.dataProcessingAgreementManager.renderToContainer('dpa-information');
        }
    });
}
