/**
 * Sandbox Configuration
 * Configure API testing environment
 */

module.exports = {
  server: {
    port: process.env.SANDBOX_PORT || 3001,
    host: process.env.SANDBOX_HOST || 'localhost',
  },

  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    timeout: 5000,
    retries: 3,
  },

  rateLimit: {
    enabled: true,
    windowMs: 60000,
    maxRequests: 100,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    logRequests: true,
    logResponses: true,
  },

  mock: {
    enabled: process.env.MOCK_ENABLED === 'true',
    delay: 100,
  },
};
