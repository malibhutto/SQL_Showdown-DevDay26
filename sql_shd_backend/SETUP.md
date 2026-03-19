# Query Quest Backend - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- RapidAPI account with OneCompiler API access

## Step 1: Install Dependencies

```bash
cd query_quest_backend
npm install
```

## Step 2: Configure Environment

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration - Get from MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/query_quest?retryWrites=true&w=majority

# JWT Configuration - Generate a strong secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

# OneCompiler API - Get from RapidAPI
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=onecompiler-apis.p.rapidapi.com
ONECOMPILER_URL=https://onecompiler-apis.p.rapidapi.com/api/v1/run

# CORS - Your frontend URL
FRONTEND_URL=http://localhost:5173

# Rate Limiting (optional - defaults shown)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_RUN=5
RATE_LIMIT_MAX_SUBMIT=3
```

### Getting MongoDB URI

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `myFirstDatabase` with `query_quest`

### Getting RapidAPI Key

1. Go to [RapidAPI OneCompiler](https://rapidapi.com/onecompiler-onecompiler-default/api/onecompiler-apis)
2. Sign up/Login
3. Subscribe to the API (free tier available)
4. Copy your API key from the dashboard

### Generating JWT Secret

Generate a secure random string:
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 3: Seed the Database

Populate the database with sample questions:

```bash
npm run seed
```

This will:
- Create 3 sample SQL questions
- Create a demo team account:
  - Username: `demo_team`
  - Password: `demo123`

## Step 4: Start the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Step 5: Test the API

### Check Health
```bash
curl http://localhost:5000/health
```

### Login with Demo Account
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"teamName":"demo_team","password":"demo123"}'
```

### Get Questions
```bash
curl http://localhost:5000/api/questions
```

## Troubleshooting

### MongoDB Connection Fails

**Error:** `MongooseServerSelectionError`

**Solutions:**
1. Check your MongoDB URI is correct
2. Ensure your IP is whitelisted in MongoDB Atlas:
   - Go to Network Access in Atlas
   - Add your current IP or use `0.0.0.0/0` (all IPs) for development
3. Verify database user credentials

### OneCompiler API Fails

**Error:** `API Error: 401` or `403`

**Solutions:**
1. Verify your RapidAPI key is correct
2. Check you're subscribed to OneCompiler API on RapidAPI
3. Ensure you haven't exceeded your API quota

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solutions:**
1. Change the PORT in `.env`
2. Or kill the process using port 5000:
   ```bash
   # macOS/Linux
   lsof -ti:5000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

### CORS Errors from Frontend

**Error:** Browser shows CORS policy error

**Solutions:**
1. Ensure `FRONTEND_URL` in `.env` matches your frontend URL exactly
2. Check the frontend is running on the URL specified
3. Restart the backend after changing `.env`

## Project Structure

```
query_quest_backend/
├── src/
│   ├── config/          # Configuration and database setup
│   ├── middleware/      # Express middleware (auth, rate limiting)
│   ├── models/          # MongoDB models (User, Question, Submission)
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (Auth, Judge, OneCompiler)
│   ├── utils/           # Utility functions (SQL validator, parser)
│   ├── scripts/         # Database seed scripts
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── dist/                # Compiled JavaScript (after build)
├── .env                 # Environment variables (create from .env.example)
├── .env.example         # Example environment configuration
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run seed` - Populate database with sample data
- `npm run lint` - Check code style
- `npm run format` - Format code with Prettier

## Next Steps

1. Update frontend API endpoint to `http://localhost:5000/api`
2. Create more questions (use POST /api/questions endpoint)
3. Test the full flow:
   - Register/Login
   - View questions
   - Run code
   - Submit code
   - View submissions

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Use MongoDB Atlas or managed MongoDB
4. Set up proper CORS with your production frontend URL
5. Consider using PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name query-quest-backend
   ```
6. Set up SSL/HTTPS (use nginx or load balancer)
7. Monitor logs and set up error tracking

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API.md for endpoint documentation
3. Check logs for detailed error messages
