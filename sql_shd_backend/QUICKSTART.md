# Query Quest Backend - Quick Reference

## 🚀 Getting Started (3 Steps)

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your MongoDB URI, RapidAPI key, and JWT secret

# 3. Seed & Run
npm run seed
npm run dev
```

Server: `http://localhost:5000`

---

## 📝 Essential Commands

```bash
npm run dev      # Development with auto-reload
npm run build    # Compile TypeScript
npm start        # Production server
npm run seed     # Create sample data
```

---

## 🔑 Demo Account (After Seeding)

- **Username:** `demo_team`
- **Password:** `demo123`

---

## 🌐 API Quick Reference

### Auth
```bash
# Register
POST /api/auth/register
{ "teamName": "team_name", "password": "password123" }

# Login (get token)
POST /api/auth/login
{ "teamName": "team_name", "password": "password123" }
```

### Questions
```bash
# List all
GET /api/questions

# Get one
GET /api/questions/select-basic-001
```

### Execution (Requires Auth Header)
```bash
# Run (no judging)
POST /api/run
Authorization: Bearer <token>
{ "questionId": "select-basic-001", "sql": "SELECT * FROM users;" }

# Submit (with judging)
POST /api/run/submit
Authorization: Bearer <token>
{ "questionId": "select-basic-001", "sql": "SELECT * FROM users;" }
```

---

## 🔒 Required Environment Variables

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/query_quest
JWT_SECRET=<random_32_char_string>
RAPIDAPI_KEY=<your_rapidapi_key>
FRONTEND_URL=http://localhost:5173
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

**Get MongoDB URI:** https://www.mongodb.com/cloud/atlas  
**Get RapidAPI Key:** https://rapidapi.com/onecompiler-onecompiler-default/api/onecompiler-apis

---

## 📊 Rate Limits

- Run: 5/min per team
- Submit: 3/min per team
- Login: 10 per 15min per IP
- API: 100/min per IP

---

## 🎯 Verdicts

- **Accepted** - Correct answer
- **Wrong Answer** - Output doesn't match
- **Runtime Error** - SQL execution failed

---

## 📁 Key Files

```
src/
├── server.ts              # Entry point
├── app.ts                 # Express setup
├── config/
│   └── database.ts        # MongoDB connection
├── models/                # User, Question, Submission
├── services/              # Auth, Judge, OneCompiler
├── routes/                # API endpoints
├── middleware/            # Auth, rate limiting
└── utils/                 # SQL validator, parser
```

---

## 🧪 Testing Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"teamName":"demo_team","password":"demo123"}'

# Get questions
curl http://localhost:5000/api/questions

# Run code (with token)
curl -X POST http://localhost:5000/api/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"questionId":"select-basic-001","sql":"SELECT * FROM users;"}'
```

---

## 🐛 Common Issues

**MongoDB Connection Failed:**
- Check MongoDB URI format
- Whitelist your IP in MongoDB Atlas

**OneCompiler API Error:**
- Verify RapidAPI key
- Check subscription is active

**Port 5000 Already in Use:**
```bash
lsof -ti:5000 | xargs kill -9
# Or change PORT in .env
```

**CORS Error:**
- Update FRONTEND_URL in .env
- Restart backend

---

## 📚 Documentation

- **[README.md](README.md)** - Overview and features
- **[SETUP.md](SETUP.md)** - Detailed setup guide
- **[API.md](API.md)** - Complete API reference
- **[instructions.md](instructions.md)** - System requirements

---

## ✅ Feature Highlights

- ✅ JWT Authentication
- ✅ SQL Sanitization (blocks DROP, INSERT, etc.)
- ✅ Automated Judging (scalar & table comparison)
- ✅ Rate Limiting
- ✅ OneCompiler Integration
- ✅ MongoDB Storage
- ✅ Submission History
- ✅ Security (Helmet, CORS, bcrypt)

---

**Next Step:** Update your frontend to use `http://localhost:5000/api` 🎉
