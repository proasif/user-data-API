import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { userCache, cacheStats } from './cache';
import { fetchUser } from './queue';
import { mockUsers, User } from './mockData';
import { rateLimiter } from './rateLimiter';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Rate limiter applied globally
app.use(rateLimiter);

// GET /users/:id
app.get('/users/:id', async (req, res) => {
  const start = Date.now();
  const id = req.params.id;
  let user = userCache.get(id);
  if (user) {
    cacheStats.hits += 1;
    cacheStats.requestCount += 1;
    cacheStats.totalResponseTime += Date.now() - start;
    return res.json(user);
  }

  cacheStats.misses += 1;
  try {
    user = await fetchUser(id);
  } catch (err) {
    cacheStats.requestCount += 1;
    cacheStats.totalResponseTime += Date.now() - start;
    return res.status(500).json({ message: 'Internal server error' });
  }

  if (!user) {
    cacheStats.requestCount += 1;
    cacheStats.totalResponseTime += Date.now() - start;
    return res.status(404).json({ message: 'User not found' });
  }

  if (!userCache.has(id)) {
    userCache.set(id, user);
  }
  cacheStats.requestCount += 1;
  cacheStats.totalResponseTime += Date.now() - start;
  return res.json(user);
});

// POST /users
app.post('/users', (req, res) => {
  const { id, name, email } = req.body as User;
  if (!id || !name || !email) {
    return res.status(400).json({ message: 'Invalid user data' });
  }
  if (mockUsers[id]) {
    return res.status(409).json({ message: 'User already exists' });
  }
  const user: User = { id, name, email };
  mockUsers[id] = user;
  userCache.set(String(id), user);
  return res.status(201).json(user);
});

// DELETE /cache
app.delete('/cache', (_req, res) => {
  userCache.clear();
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.totalResponseTime = 0;
  cacheStats.requestCount = 0;
  return res.json({ message: 'Cache cleared' });
});

// GET /cache-status
app.get('/cache-status', (_req, res) => {
  const avgResponseTime = cacheStats.requestCount
    ? cacheStats.totalResponseTime / cacheStats.requestCount
    : 0;
  return res.json({
    size: userCache.size,
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    avgResponseTime,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
