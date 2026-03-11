import { createClient, RedisClientType } from 'redis';
import { ENV } from '../../config';

let redisClient: RedisClientType | null = null;

export const initRedisClient = async () => {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: ENV.REDIS_URL,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Error:', err);
      redisClient = null;
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.warn('Failed to connect to Redis, caching disabled:', error);
    return null;
  }
};

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (!redisClient) {
    return await initRedisClient();
  }
  return redisClient;
};

export const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
};
