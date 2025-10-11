/**
 * CRM Integration Module
 * Provides integration with HubSpot, Salesforce, and Pipedrive for lead management
 */

class CRMIntegration {
    constructor(config = {}) {
        this.provider = config.provider || 'hubspot';
        this.apiKey = config.apiKey || '';
        this.apiEndpoint = this.getEndpoint();
        this.initialized = false;
    }

    /**
     * Get API endpoint based on CRM provider
     * @returns {string} API endpoint URL
     */
    getEndpoint() {
        const endpoints = {
            hubspot: 'https://api.hubapi.com',
            salesforce: 'https://api.salesforce.com',
            pipedrive: 'https://api.pipedrive.com/v1'
        };
        return endpoints[this.provider] || endpoints.hubspot;
    }

    /**
     * Initialize CRM connection
     * @returns {Promise<boolean>}
     */
    async initialize() {
        if (!this.apiKey) {
            console.warn('CRM API key not configured');
            return false;
        }

        try {
            const isValid = await this.validateConnection();
            this.initialized = isValid;
            return isValid;
        } catch (error) {
            console.error('CRM initialization failed:', error);
            return false;
        }
    }

    /**
     * Validate CRM connection
     * @returns {Promise<boolean>}
     */
    async validateConnection() {
        const validationEndpoints = {
            hubspot: '/crm/v3/objects/contacts/search',
            salesforce: '/services/data/v58.0/sobjects',
            pipedrive: '/users/me'
        };

        const endpoint = validationEndpoints[this.provider];

        try {
            const response = await this.makeRequest('GET', endpoint, null, true);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Make HTTP request to CRM API
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request payload
     * @param {boolean} headersOnly - Return response object instead of JSON
     * @returns {Promise<any>}
     */
    async makeRequest(method, endpoint, data = null, headersOnly = false) {
        const url = `${this.apiEndpoint}${endpoint}`;
        const headers = this.getHeaders();

        const options = {
            method,
            headers
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (headersOnly) {
            return response;
        }

        if (!response.ok) {
            throw new Error(`CRM API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Get request headers based on CRM provider
     * @returns {Object}
     */
    getHeaders() {
        const baseHeaders = {
            'Content-Type': 'application/json'
        };

        switch (this.provider) {
            case 'hubspot':
                return {
                    ...baseHeaders,
                    'Authorization': `Bearer ${this.apiKey}`
                };
            case 'salesforce':
                return {
                    ...baseHeaders,
                    'Authorization': `Bearer ${this.apiKey}`
                };
            case 'pipedrive':
                return baseHeaders;
            default:
                return baseHeaders;
        }
    }

    /**
     * Create a new lead in CRM
     * @param {Object} leadData - Lead information
     * @returns {Promise<Object>}
     */
    async createLead(leadData) {
        if (!this.initialized) {
            throw new Error('CRM not initialized. Call initialize() first.');
        }

        const payload = this.formatLeadData(leadData);

        switch (this.provider) {
            case 'hubspot':
                return await this.createHubSpotContact(payload);
            case 'salesforce':
                return await this.createSalesforceContact(payload);
            case 'pipedrive':
                return await this.createPipedriveContact(payload);
            default:
                throw new Error(`Unsupported CRM provider: ${this.provider}`);
        }
    }

    /**
     * Format lead data for specific CRM provider
     * @param {Object} leadData - Raw lead data
     * @returns {Object}
     */
    formatLeadData(leadData) {
        const {
            firstName,
            lastName,
            email,
            phone,
            company,
            website,
            notes
        } = leadData;

        switch (this.provider) {
            case 'hubspot':
                return {
                    properties: {
                        firstname: firstName,
                        lastname: lastName,
                        email,
                        phone,
                        company,
                        website,
                        notes
                    }
                };
            case 'salesforce':
                return {
                    FirstName: firstName,
                    LastName: lastName,
                    Email: email,
                    Phone: phone,
                    Company: company,
                    Website: website,
                    Description: notes
                };
            case 'pipedrive':
                return {
                    name: `${firstName} ${lastName}`,
                    email: [{ value: email, primary: true }],
                    phone: [{ value: phone, primary: true }],
                    org_name: company,
                    visible_to: 3
                };
            default:
                return leadData;
        }
    }

    /**
     * Create contact in HubSpot
     * @param {Object} payload - Formatted contact data
     * @returns {Promise<Object>}
     */
    async createHubSpotContact(payload) {
        const endpoint = '/crm/v3/objects/contacts';
        return await this.makeRequest('POST', endpoint, payload);
    }

    /**
     * Create contact in Salesforce
     * @param {Object} payload - Formatted contact data
     * @returns {Promise<Object>}
     */
    async createSalesforceContact(payload) {
        const endpoint = '/services/data/v58.0/sobjects/Contact';
        return await this.makeRequest('POST', endpoint, payload);
    }

    /**
     * Create person in Pipedrive
     * @param {Object} payload - Formatted person data
     * @returns {Promise<Object>}
     */
    async createPipedriveContact(payload) {
        const endpoint = `/persons?api_token=${this.apiKey}`;
        return await this.makeRequest('POST', endpoint, payload);
    }

    /**
     * Update existing lead
     * @param {string} leadId - Lead identifier
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>}
     */
    async updateLead(leadId, updateData) {
        if (!this.initialized) {
            throw new Error('CRM not initialized. Call initialize() first.');
        }

        const payload = this.formatLeadData(updateData);

        switch (this.provider) {
            case 'hubspot':
                return await this.makeRequest('PATCH', `/crm/v3/objects/contacts/${leadId}`, payload);
            case 'salesforce':
                return await this.makeRequest('PATCH', `/services/data/v58.0/sobjects/Contact/${leadId}`, payload);
            case 'pipedrive':
                return await this.makeRequest('PUT', `/persons/${leadId}?api_token=${this.apiKey}`, payload);
            default:
                throw new Error(`Unsupported CRM provider: ${this.provider}`);
        }
    }

    /**
     * Get lead by ID
     * @param {string} leadId - Lead identifier
     * @returns {Promise<Object>}
     */
    async getLead(leadId) {
        if (!this.initialized) {
            throw new Error('CRM not initialized. Call initialize() first.');
        }

        switch (this.provider) {
            case 'hubspot':
                return await this.makeRequest('GET', `/crm/v3/objects/contacts/${leadId}`);
            case 'salesforce':
                return await this.makeRequest('GET', `/services/data/v58.0/sobjects/Contact/${leadId}`);
            case 'pipedrive':
                return await this.makeRequest('GET', `/persons/${leadId}?api_token=${this.apiKey}`);
            default:
                throw new Error(`Unsupported CRM provider: ${this.provider}`);
        }
    }

    /**
     * Search for leads
     * @param {Object} searchCriteria - Search parameters
     * @returns {Promise<Array>}
     */
    async searchLeads(searchCriteria) {
        if (!this.initialized) {
            throw new Error('CRM not initialized. Call initialize() first.');
        }

        switch (this.provider) {
            case 'hubspot':
                return await this.searchHubSpotContacts(searchCriteria);
            case 'salesforce':
                return await this.searchSalesforceContacts(searchCriteria);
            case 'pipedrive':
                return await this.searchPipedriveContacts(searchCriteria);
            default:
                throw new Error(`Unsupported CRM provider: ${this.provider}`);
        }
    }

    /**
     * Search HubSpot contacts
     * @param {Object} criteria - Search criteria
     * @returns {Promise<Array>}
     */
    async searchHubSpotContacts(criteria) {
        const searchPayload = {
            filterGroups: [
                {
                    filters: Object.keys(criteria).map(key => ({
                        propertyName: key,
                        operator: 'EQ',
                        value: criteria[key]
                    }))
                }
            ]
        };

        const result = await this.makeRequest('POST', '/crm/v3/objects/contacts/search', searchPayload);
        return result.results || [];
    }

    /**
     * Search Salesforce contacts
     * @param {Object} criteria - Search criteria
     * @returns {Promise<Array>}
     */
    async searchSalesforceContacts(criteria) {
        const whereClause = Object.keys(criteria)
            .map(key => `${key}='${criteria[key]}'`)
            .join(' AND ');

        const query = `SELECT Id, FirstName, LastName, Email, Phone FROM Contact WHERE ${whereClause}`;
        const endpoint = `/services/data/v58.0/query?q=${encodeURIComponent(query)}`;

        const result = await this.makeRequest('GET', endpoint);
        return result.records || [];
    }

    /**
     * Search Pipedrive persons
     * @param {Object} criteria - Search criteria
     * @returns {Promise<Array>}
     */
    async searchPipedriveContacts(criteria) {
        const searchTerm = criteria.email || criteria.name || '';
        const endpoint = `/persons/search?term=${encodeURIComponent(searchTerm)}&api_token=${this.apiKey}`;

        const result = await this.makeRequest('GET', endpoint);
        return result.data?.items || [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CRMIntegration;
}

export default CRMIntegration;
