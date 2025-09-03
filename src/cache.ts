import { LRUCache } from 'lru-cache';
import { User } from './mockData';

export interface CacheStats {
  hits: number;
  misses: number;
  totalResponseTime: number;
  requestCount: number;
}

export const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  totalResponseTime: 0,
  requestCount: 0,
};

export const userCache = new LRUCache<string, User>({
  max: 100,
  ttl: 1000 * 60,
});

setInterval(() => {
  userCache.purgeStale();
}, 1000);
