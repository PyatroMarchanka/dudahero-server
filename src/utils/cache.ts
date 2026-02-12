import { getRedisClient } from '../mongo/redis';

const CACHE_TTL = 600; // 10 minutes in seconds

/**
 * Get a value from cache, or generate and cache it if not found
 * @param key Cache key
 * @param generator Async function to generate the value if not cached
 * @returns The cached or newly generated value
 */
export const cacheGet = async <T>(
  key: string,
  generator: () => Promise<T>
): Promise<T> => {
  try {
    const client = await getRedisClient();
    
    if (!client) {
      // Redis not available, skip cache
      return await generator();
    }

    // Try to get from cache
    const cached = await client.get(key);
    if (cached) {
      try {
        console.log('return from cache:', key, cached);
        return JSON.parse(cached) as T;
      } catch (error) {
        console.warn(`Failed to parse cached value for key ${key}:`, error);
        await client.del(key);
      }
    }

    // Generate new value and cache it
    const value = await generator();
    try {
      await client.setEx(key, CACHE_TTL, JSON.stringify(value));
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

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
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

    await client.flushDb();
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};
