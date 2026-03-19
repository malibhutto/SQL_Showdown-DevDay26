import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import routes from './routes';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  apiRateLimiter
} from './middleware';

export function createApp(): Application {
  const app = express();
  
  // CORS must be BEFORE helmet for proper preflight handling
  app.use(cors({
    origin: true,  // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
  }));

  // Handle preflight requests explicitly
  app.options('*', cors());
  
  // Security middleware (after CORS)
  app.use(helmet());
  
  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request logging
  app.use(requestLogger);
  
  // Global rate limiting
  app.use('/api/', apiRateLimiter);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv
    });
  });
  
  // API routes
  app.use('/api', routes);
  
  // 404 handler
  app.use(notFoundHandler);
  
  // Error handler (must be last)
  app.use(errorHandler);
  
  return app;
}
