# Query Quest Backend 🚀

**Production-ready backend API and SQL Judge for Query Quest Competition Platform**

A complete backend system for running SQL coding competitions similar to HackerRank/LeetCode SQL rounds. Features secure code execution, automated judging, rate limiting, and comprehensive authentication.

---

## ✨ Features

### Core Functionality
- ✅ **Secure SQL Execution** - Validates and sanitizes SQL queries before execution
- ✅ **Automated Judging** - Compares outputs with configurable tolerance and ordering
- ✅ **OneCompiler Integration** - Proxy for secure SQL execution via RapidAPI
- ✅ **ASCII Table Parsing** - Parses OneCompiler output to structured data
- ✅ **Multiple Verdict Types** - Accepted, Wrong Answer, Runtime Error

### Security & Performance
- 🔒 **JWT Authentication** - Secure token-based authentication
- 🔒 **Password Hashing** - bcrypt for secure password storage
- 🚦 **Rate Limiting** - Prevents abuse (5 runs/min, 3 submits/min per team)
- 🛡️ **SQL Sanitization** - Blocks DROP, INSERT, UPDATE, DELETE, etc.
- 🔐 **CORS & Helmet** - Secure HTTP headers and cross-origin policies

### Database & Storage
- 💾 **MongoDB Integration** - Stores users, questions, and submissions
- 📊 **Submission History** - Complete audit trail of all attempts
- 🎯 **Flexible Question Format** - Supports scalar and table results

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd query_quest_backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials (MongoDB, RapidAPI, JWT secret)
```

### 3. Seed Database
```bash
npm run seed
```
Creates demo account: `demo_team` / `demo123` and 3 sample questions

### 4. Start Server
```bash
npm run dev
```

Server runs on `http://localhost:5000`

---

## 📁 Project Structure

```
query_quest_backend/
├── src/
│   ├── config/              # Configuration & database connection
│   │   ├── index.ts         # Environment config
│   │   └── database.ts      # MongoDB setup
│   ├── models/              # MongoDB schemas
│   │   ├── User.ts          # Team/user model
│   │   ├── Question.ts      # SQL question model
│   │   └── Submission.ts    # Submission model
│   ├── services/            # Business logic
│   │   ├── AuthService.ts   # Authentication & JWT
│   │   ├── OneCompilerService.ts  # SQL execution
│   │   └── JudgeService.ts  # Output comparison
│   ├── utils/               # Utilities
│   │   ├── SqlValidator.ts  # SQL safety checks
│   │   └── AsciiTableParser.ts  # Output parsing
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT verification
│   │   ├── rateLimiter.ts   # Rate limiting
│   │   └── errorHandler.ts  # Error handling
│   ├── routes/              # API endpoints
│   │   ├── auth.routes.ts   # /api/auth/*
│   │   ├── question.routes.ts  # /api/questions/*
│   │   └── execution.routes.ts  # /api/run/*
│   ├── scripts/
│   │   └── seed.ts          # Database seeding
│   ├── app.ts               # Express app setup
│   └── server.ts            # Entry point
├── .env.example             # Environment template
├── package.json
├── tsconfig.json
├── API.md                   # Complete API docs
└── SETUP.md                # Detailed setup guide
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register   - Register new team
POST   /api/auth/login      - Login and get JWT
POST   /api/auth/logout     - Logout
```

### Questions
```
GET    /api/questions       - List all questions
GET    /api/questions/:id   - Get question details
POST   /api/questions       - Create question (authenticated)
```

### Code Execution
```
POST   /api/run             - Run SQL (no judging) [5/min]
POST   /api/run/submit      - Submit for judging [3/min]
GET    /api/run/submissions - Get submission history
GET    /api/run/submissions/:id - Get submission details
```

### Health Check
```
GET    /health              - Server status
```

📖 **Full API documentation:** See [API.md](API.md)

---

## 🛠️ Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT + bcrypt
- **Security:** Helmet, CORS, Rate Limiting
- **SQL Execution:** OneCompiler API (RapidAPI)
- **Development:** ts-node, nodemon

---

## 📋 Configuration

### Required Environment Variables

```env
# MongoDB connection string
MONGODB_URI=mongodb+srv://...

# JWT secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_secret_key

# RapidAPI credentials (from https://rapidapi.com/onecompiler)
RAPIDAPI_KEY=your_api_key
RAPIDAPI_HOST=onecompiler-apis.p.rapidapi.com

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

📖 **Complete setup guide:** See [SETUP.md](SETUP.md)

---

## 🧪 Available Scripts

```bash
npm run dev      # Start development server (auto-reload)
npm run build    # Compile TypeScript to JavaScript
npm start        # Start production server
npm run seed     # Populate database with sample data
npm run lint     # Check code style
npm run format   # Format code with Prettier
```

---

## 🔒 Security Features

### SQL Sanitization
- Blocks dangerous operations: DROP, INSERT, UPDATE, DELETE, ALTER, etc.
- Enforces SELECT-only queries
- Prevents multiple statement execution
- Checks for SQL injection patterns

### Authentication & Authorization
- JWT-based session management
- Bcrypt password hashing (10 rounds)
- Token expiration (24h default)
- Protected endpoints require valid token

### Rate Limiting
- Run code: 5 requests/minute per team
- Submit code: 3 requests/minute per team
- Login: 10 attempts per 15 minutes per IP
- General API: 100 requests/minute per IP

### Additional Security
- Helmet.js for secure HTTP headers
- CORS with configurable origin
- API keys never exposed to frontend
- Input validation on all endpoints

---

## 📊 Database Models

### User (Team)
```typescript
{
  teamName: string (unique)
  passwordHash: string (bcrypt)
  createdAt: Date
  lastLogin: Date
  isActive: boolean
}
```

### Question
```typescript
{
  questionId: string (unique)
  title: string
  description: string (markdown)
  setupSql: string (DDL + INSERT)
  starterSql: string
  dialect: 'sqlite' | 'mysql' | 'postgresql'
  expectedOutput: {
    type: 'scalar' | 'table'
    columns: string[]
    rows: (string | number | null)[][]
    orderMatters: boolean
    caseSensitive: boolean
    numericTolerance: number
  }
  constraints: {
    allowOnlySelect: boolean
    maxRows: number
    maxQueryLength: number
  }
}
```

### Submission
```typescript
{
  teamName: string
  questionId: string
  submittedSql: string
  execution: {
    stdout: string
    stderr: string | null
    executionTimeMs: number
    memoryUsedKb: number
  }
  verdict: 'Accepted' | 'Wrong Answer' | 'Runtime Error'
  judgeMessage: string
  submittedAt: Date
}
```

---

## 🎯 Judging System

### Judge Modes

**Scalar Mode:**
- Expects single value (1 row × 1 column)
- Compares exact value with tolerance

**Table Mode:**
- Compares row and column counts
- Validates column names (optional)
- Order-independent comparison (configurable)
- Case-insensitive comparison (configurable)
- Numeric tolerance for floating point

### Verdict Logic
| Condition | Verdict |
|-----------|---------|
| SQL error / stderr present | Runtime Error |
| Output doesn't match expected | Wrong Answer |
| Output matches all criteria | Accepted |

---

## 🧩 Integration with Frontend

Update your frontend API base URL to:
```typescript
const API_BASE_URL = 'http://localhost:5000/api';
```

Authentication flow:
```typescript
// 1. Login
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ teamName, password })
});
const { token } = await response.json();

// 2. Store token
localStorage.setItem('token', token);

// 3. Use token in subsequent requests
fetch(`${API_BASE_URL}/run`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ questionId, sql })
});
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB URI format
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

### OneCompiler API Issues
- Confirm RapidAPI subscription is active
- Check API key is correct
- Verify you haven't exceeded quota

### Port Already in Use
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
```

### CORS Errors
- Ensure FRONTEND_URL matches your frontend exactly
- Restart backend after changing .env

---

## 📝 Sample Question Format

```json
{
  "questionId": "join-basic-001",
  "title": "Basic JOIN Query",
  "description": "# Join Users and Orders\n\nWrite a query to count orders per user...",
  "setupSql": "CREATE TABLE users (id INT, name TEXT);\nINSERT INTO users VALUES (1, 'Alice');",
  "starterSql": "SELECT * FROM users;",
  "dialect": "sqlite",
  "expectedOutput": {
    "type": "table",
    "columns": ["name", "order_count"],
    "rows": [["Alice", 2], ["Bob", 1]],
    "orderMatters": false,
    "caseSensitive": false,
    "numericTolerance": 0
  },
  "constraints": {
    "allowOnlySelect": true,
    "maxRows": 100,
    "maxQueryLength": 5000
  }
}
```

---

## 🚀 Production Deployment

1. **Set production environment:**
   ```env
   NODE_ENV=production
   ```

2. **Use strong secrets:**
   ```bash
   openssl rand -base64 32
   ```

3. **Build and start:**
   ```bash
   npm run build
   npm start
   ```

4. **Use process manager (optional):**
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name query-quest
   ```

5. **Set up reverse proxy (nginx example):**
   ```nginx
   location /api {
     proxy_pass http://localhost:5000;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection 'upgrade';
     proxy_set_header Host $host;
   }
   ```

---

## 📚 Additional Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions and troubleshooting
- **[API.md](API.md)** - Complete API reference with examples
- **[instructions.md](instructions.md)** - Original system requirements

---

## ✅ Feature Checklist

Based on [instructions.md](instructions.md):

- [x] MongoDB Atlas integration
- [x] User authentication with bcrypt
- [x] JWT session management
- [x] Question storage and retrieval
- [x] Submission logging
- [x] OneCompiler proxy integration
- [x] ASCII table output parsing
- [x] SQL safety validation
- [x] Scalar and table result judging
- [x] Order-independent comparison
- [x] Case-insensitive comparison
- [x] Numeric tolerance
- [x] Rate limiting (run & submit)
- [x] Security middleware (helmet, CORS)
- [x] Error handling and logging
- [x] RESTful API design
- [x] TypeScript implementation
- [x] Sample data seeding

---

## 📄 License

MIT

---

## 🙋 Support

For issues or questions:
1. Check [SETUP.md](SETUP.md) troubleshooting section
2. Review [API.md](API.md) for endpoint documentation
3. Check server logs for error details

---

**Built with ❤️ for SQL coding competitions**
