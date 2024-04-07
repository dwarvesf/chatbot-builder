import { createClient } from 'redis';
import { RedisPassword, RedisUrl } from '../config';
import logger from '../logger';

const redisClientLogger = logger.child({ fn: 'redisClient' });
const redisClient = createClient({
  url: RedisUrl,
  password: RedisPassword,
  socket: {
    connectTimeout: 60000,
    keepAlive: 60000,
    reconnectStrategy: (attempts: number, causedErr: Error) => {
      logger.error({ retries: attempts, causedErr }, 'Redis reconnecting ');
      return 500; // 500ms to reconnect
    },
  },
});
redisClient.connect().catch((err) => {
  logger.error(err, 'Redis connection failed ');
});
redisClient.on('connect', () => redisClientLogger.info('connected'));
redisClient.on('reconnecting', () => redisClientLogger.info('reconnecting'));
redisClient.on('ready', () => redisClientLogger.info('ready'));
redisClient.on('error', (err) => redisClientLogger.error(err, 'error'));

export { redisClient };
