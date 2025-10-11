# Developer Sandbox Environment

API testing sandbox for development and testing purposes.

## Setup

1. Copy `.env.sandbox.example` to `.env.sandbox`
2. Configure your API endpoints and credentials
3. Run sandbox server: `npm run sandbox`

## Usage

The sandbox provides isolated API testing capabilities:

- Mock API responses
- Rate limiting testing
- Error simulation
- Request/response logging

## Configuration

Edit `./sandbox/config.js` to customize:
- API endpoints
- Mock data
- Rate limits
- Logging levels

## Testing

```bash
# Run sandbox tests
npm run sandbox:test

# Start sandbox server
npm run sandbox:start
```
