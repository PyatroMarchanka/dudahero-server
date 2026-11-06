import { getRedisClient } from '../mongo/redis';

// A cache call that takes longer than this is given up, so Redis can never hold a request
const REDIS_TIMEOUT_MS = 2000;

const withTimeout = <T>(promise: Promise<T>, what: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Redis ${what} timed out`)), REDIS_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

const CACHE_TTL = 600; // 10 minutes in seconds

// For keys that every write path clears explicitly: the time is only a safety net
export const LONG_CACHE_TTL = 24 * 60 * 60;

/**
 * Get a value from cache, or generate and cache it if not found
 * @param key Cache key
 * @param generator Async function to generate the value if not cached
 * @returns The cached or newly generated value
 */
export const cacheGet = async <T>(
  key: string,
  generator: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> => {
  try {
    const client = await getRedisClient();
    
    if (!client) {
      // Redis not available, skip cache
      return await generator();
    }

    // Try to get from cache
    const cached = await withTimeout(client.get(key), `get ${key}`);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch (error) {
        console.warn(`Failed to parse cached value for key ${key}:`, error);
        await withTimeout(client.del(key), `del ${key}`).catch(() => undefined);
      }
    }

    // Generate new value and cache it
    const value = await generator();
    try {
      await withTimeout(client.setEx(key, ttl, JSON.stringify(value)), `set ${key}`);
    } catch (error) {
      console.warn(`Failed to cache value for key ${key}:`, error);
    }

    return value;
  } catch (error) {
    console.warn('Cache operation failed, falling back to direct call:', error);
    return await generator();
  }
};

/**
 * Invalidate cache entries by key or pattern
 * @param pattern Key or pattern to invalidate (supports Redis glob patterns)
 */
export const cacheInvalidate = async (pattern: string): Promise<void> => {
  try {
    const client = await getRedisClient();
    
    if (!client) {
      return;
    }

    const keys = await withTimeout(client.keys(pattern), `keys ${pattern}`);
    if (keys.length > 0) {
      await withTimeout(client.del(keys), `del ${pattern}`);
    }
  } catch (error) {
    console.warn(`Failed to invalidate cache pattern ${pattern}:`, error);
  }
};

/**
 * Clear all cache entries
 */
export const cacheClear = async (): Promise<void> => {
  try {
    const client = await getRedisClient();
    
    if (!client) {
      return;
    }

    await withTimeout(client.flushDb(), 'flush');
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};
