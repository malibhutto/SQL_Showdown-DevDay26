import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/query_quest'
  },
  
  jwt: {
    secret: (process.env.JWT_SECRET || 'default_secret_change_this') as string,
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h')
  },
  
  admin: {
    key: process.env.ADMIN_SECRET || 'admin_default_key'
  },
  
  oneCompiler: {
    apiKey: process.env.RAPIDAPI_KEY || '',
    host: process.env.RAPIDAPI_HOST || 'onecompiler-apis.p.rapidapi.com',
    url: process.env.ONECOMPILER_URL || 'https://onecompiler-apis.p.rapidapi.com/api/v1/run'
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || true  // Allow all origins
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRun: parseInt(process.env.RATE_LIMIT_MAX_RUN || '30'),
    maxSubmit: parseInt(process.env.RATE_LIMIT_MAX_SUBMIT || '20')
  }
};

// Validate critical config
if (!config.oneCompiler.apiKey && config.nodeEnv === 'production') {
  console.warn('WARNING: RAPIDAPI_KEY is not set!');
}

if (config.jwt.secret === 'default_secret_change_this' && config.nodeEnv === 'production') {
  console.warn('WARNING: Using default JWT_SECRET in production!');
}
