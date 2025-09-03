# user-data-API

An Express.js API in TypeScript that serves mock user data with advanced caching,
rate limiting, and asynchronous processing. The API demonstrates performance
optimization techniques such as an LRU cache with TTL, a token-bucket rate
limiter, and a queue-based simulation of database calls.

## Requirements
- Node.js 18+

## Installation
```bash
npm install
```

## Running the server
Compile the TypeScript sources and start the server:
```bash
npm run build
npm start
```
For development with live reload:
```bash
npm run dev
```

The server listens on port `3000` by default.

## Endpoints
- `GET /users/:id` – fetch a user by id (with caching and queue-backed fetch).
- `POST /users` – create a new mock user and cache it.
- `DELETE /cache` – clear the entire cache and reset statistics.
- `GET /cache-status` – view current cache size, hits, misses, and average
  response time.

## Caching Strategy
User data is stored in an in-memory [LRU cache](https://github.com/isaacs/node-lru-cache)
with a 60‑second TTL. Cache statistics (hits, misses, average response time) are
tracked and exposed via `/cache-status`. A background task calls
`purgeStale()` every second to remove expired entries.

## Rate Limiting
A custom token-bucket limiter allows **10 requests per minute** with a burst of
**5 requests per 10 seconds** per client IP. Exceeding the limit returns HTTP
429.

## Asynchronous Processing
Database access is simulated using a queue. Each miss enqueues a job that waits
200 ms before returning mock data. Concurrent requests for the same user share a
single pending promise to avoid duplicate work.

## Testing
Use any HTTP client (e.g. Postman or curl) to exercise the endpoints. The first
request to a user id will take ~200 ms, while subsequent requests hit the cache
and return immediately. Send more than 5 requests within 10 seconds to trigger
rate limiting.
