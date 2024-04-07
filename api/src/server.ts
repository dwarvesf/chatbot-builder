import RedisStore from 'connect-redis';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import Logger from 'pino-http';
import './auth';
import { CookieSameSite, CookieSecure, LogHTTPRequests, getEnvF } from './config';
import { redisClient } from './gateway/redis';
import logger from './logger';
import { v1Router } from './routes/v1';

const corsWhitelist = getEnvF('CORS_ORIGIN').split(',');
export async function startServer(port: number) {
  const app = express();
  app.use(
    cors({
      // origin: getEnvF('CORS_ORIGIN').split(','),
      origin: function (origin, callback) {
        const isToolOrServerRq = !origin;

        if (corsWhitelist.indexOf(origin) !== -1 || isToolOrServerRq) {
          callback(null, true);
        } else {
          logger.info({ origin }, 'CORS not allowed');
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    })
  );

  // Session store
  let redisStore = new RedisStore({
    client: redisClient,
    prefix: 'a:',
  });
  app.set('trust proxy', 1);
  app.use(
    session({
      secret: getEnvF('SESSION_SECRET').split(','),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: CookieSameSite,
        secure: CookieSecure, // Secure true should work with trust_proxy
      },
      resave: false,
      saveUninitialized: false,
      store: redisStore,
    })
  );
  app.use(passport.session());

  // HTTP log
  if (LogHTTPRequests) {
    app.use(
      Logger({
        logger: logger,
        transport: {
          target: 'pino-http-print',
          options: {
            destination: 1,
            all: true,
            translateTime: true,
          },
        },
      })
    );
  }

  app.use(express.json());

  app.get('/health', (req, res) => {
    res.send('OK');
  });

  app.use('/api/v1', v1Router);

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err, 'Unhandled error');
    res.status(500).json({ message: 'Internal server error' });
  });

  app.listen(port, () => {
    logger.info(`Server is listening on port ${port}`);
  });
}

process.on('uncaughtException', function (err) {
  // Handle the error safely
  logger.error(err, 'uncaughtException');
});
