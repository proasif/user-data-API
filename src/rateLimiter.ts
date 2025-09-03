import { Request, Response, NextFunction } from 'express';

interface LimiterState {
  tokens: number;
  lastRefill: number;
  burstTokens: number;
  lastBurstRefill: number;
}

const MAX_TOKENS_PER_MIN = 10;
const MAX_BURST_TOKENS = 5;

const states = new Map<string, LimiterState>();

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'global';
  const now = Date.now();
  let state = states.get(key);
  if (!state) {
    state = {
      tokens: MAX_TOKENS_PER_MIN,
      lastRefill: now,
      burstTokens: MAX_BURST_TOKENS,
      lastBurstRefill: now,
    };
    states.set(key, state);
  }

  // Refill main bucket
  const minutesPassed = (now - state.lastRefill) / 60000;
  if (minutesPassed > 0) {
    state.tokens = Math.min(
      MAX_TOKENS_PER_MIN,
      state.tokens + minutesPassed * MAX_TOKENS_PER_MIN,
    );
    state.lastRefill = now;
  }

  // Refill burst bucket
  const secondsPassed = (now - state.lastBurstRefill) / 10000;
  if (secondsPassed > 0) {
    state.burstTokens = Math.min(
      MAX_BURST_TOKENS,
      state.burstTokens + secondsPassed * MAX_BURST_TOKENS,
    );
    state.lastBurstRefill = now;
  }

  if (state.tokens >= 1 && state.burstTokens >= 1) {
    state.tokens -= 1;
    state.burstTokens -= 1;
    return next();
  }

  return res.status(429).json({ message: 'Too many requests. Please try again later.' });
}
