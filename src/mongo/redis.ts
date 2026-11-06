import { createClient, RedisClientType } from 'redis';
import { ENV } from '../../config';
import { logger } from '../utils/logger';

// One Redis client for the whole server. It reconnects by itself in the
// background. While it isn't connected the cache is simply skipped: commands
// are never queued, so an outage can't make a request wait for Redis.
let redisClient: RedisClientType | null = null;
let lastErrorLog = 0;

export const initRedisClient = async () => {
  if (redisClient) {
    return redisClient;
  }

  const client: RedisClientType = createClient({
    url: ENV.REDIS_URL,
    // Fail commands at once while disconnected instead of holding them until Redis is back
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 5000,
      // Keep retrying, at most every 10 seconds
      reconnectStrategy: (retries: number) => Math.min(500 * 2 ** retries, 10000),
    },
  });
  redisClient = client;

  client.on('error', (err) => {
    // A down Redis errors on every retry; one line a minute is enough
    if (Date.now() - lastErrorLog > 60_000) {
      lastErrorLog = Date.now();
      logger.warn(`Redis error, caching skipped until it reconnects: ${err?.message || err}`);
    }
  });
  client.on('ready', () => logger.info('Redis Client Connected'));

  // Not awaited by requests: while it connects (or retries) getRedisClient returns null
  client.connect().catch((error) => {
    logger.warn(`Redis connect failed, caching disabled: ${error?.message || error}`);
  });
  return client;
};

// The client when it is ready to answer, otherwise null (skip the cache)
export const getRedisClient = async (): Promise<RedisClientType | null> => {
  const client = redisClient ?? (await initRedisClient());
  return client.isReady ? client : null;
};

export const disconnectRedis = async () => {
  if (redisClient) {
    const client = redisClient;
    redisClient = null;
    await client.disconnect().catch(() => undefined);
  }
};
