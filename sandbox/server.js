/**
 * Sandbox API Testing Server
 */

const http = require('http');
const config = require('./config');

const mockResponses = {
  '/api/test': { message: 'Sandbox test endpoint', status: 'ok' },
  '/api/health': { status: 'healthy', timestamp: Date.now() },
};

const server = http.createServer((req, res) => {
  const startTime = Date.now();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Log request
  if (config.logging.logRequests) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }

  // Mock response
  if (config.mock.enabled && mockResponses[req.url]) {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockResponses[req.url]));

      if (config.logging.logResponses) {
        console.log(`Response: ${Date.now() - startTime}ms`);
      }
    }, config.mock.delay);
    return;
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(config.server.port, config.server.host, () => {
  console.log(`Sandbox server running at http://${config.server.host}:${config.server.port}`);
  console.log(`Mock mode: ${config.mock.enabled ? 'enabled' : 'disabled'}`);
});

module.exports = server;
