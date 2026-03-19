# 🚀 API Quick Reference Card

## Server Status
```bash
# Check if server is running
curl http://localhost:5000/health
```

## Authentication

### Register Team
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "teamName": "team_alpha",
    "password": "securePassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "teamName": "team_alpha",
    "password": "securePassword123"
  }'

# Response will include token:
# "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Save Token
```bash
TOKEN="your_token_here"
```

### Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

---

## Questions API

### Get All Questions
```bash
curl -X GET http://localhost:5000/api/questions \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Question
```bash
curl -X GET http://localhost:5000/api/questions/select-basic-001 \
  -H "Authorization: Bearer $TOKEN"
```

### Create Question (Admin)
```bash
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "questionId": "new-q-001",
    "title": "Query Title",
    "description": "Query Description",
    "setupSql": "CREATE TABLE...",
    "starterSql": "SELECT...",
    "dialect": "sqlite",
    "difficulty": "Easy",
    "points": 10,
    "expectedOutput": {
      "type": "table",
      "columns": ["col1"],
      "rows": [[1]]
    },
    "constraints": {
      "allowOnlySelect": true,
      "maxRows": 100,
      "maxQueryLength": 5000
    }
  }'
```

---

## Code Execution

### Run SQL (No Judging)
```bash
curl -X POST http://localhost:5000/api/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "questionId": "select-basic-001",
    "sql": "SELECT * FROM users;"
  }'
```

---

## Submissions

### Submit Solution
```bash
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "questionId": "select-basic-001",
    "content": "SELECT * FROM users;",
    "language": "sql"
  }'
```

### Get All Submissions
```bash
curl -X GET http://localhost:5000/api/submissions \
  -H "Authorization: Bearer $TOKEN"
```

### Get Specific Submission
```bash
curl -X GET http://localhost:5000/api/submissions/submission_id \
  -H "Authorization: Bearer $TOKEN"
```

---

## Competition

### Get Competition Config
```bash
curl -X GET http://localhost:5000/api/competition/config
```

### Enter Competition
```bash
curl -X POST http://localhost:5000/api/competition/enter \
  -H "Authorization: Bearer $TOKEN"
```

### Get Leaderboard
```bash
curl -X GET http://localhost:5000/api/competition/leaderboard
```

### Get My Progress
```bash
curl -X GET http://localhost:5000/api/competition/progress \
  -H "Authorization: Bearer $TOKEN"
```

---

## Admin APIs

### Admin Key
```bash
ADMIN_KEY="admin-secret-key-change-in-production"
```

### Get Competition Config
```bash
curl -X GET http://localhost:5000/api/admin/competition \
  -H "x-admin-key: $ADMIN_KEY"
```

### Set Competition
```bash
START_TIME="2025-12-31T10:00:00Z"
curl -X POST http://localhost:5000/api/admin/competition \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{
    "competitionName": "SQL Challenge 2025",
    "startTime": "'$START_TIME'",
    "duration": 3600000,
    "isActive": true,
    "maxTeams": 100
  }'
```

### Get All Submissions
```bash
curl -X GET http://localhost:5000/api/admin/submissions \
  -H "x-admin-key: $ADMIN_KEY"
```

### Get Statistics
```bash
curl -X GET http://localhost:5000/api/admin/statistics \
  -H "x-admin-key: $ADMIN_KEY"
```

### Get Teams
```bash
curl -X GET http://localhost:5000/api/admin/teams \
  -H "x-admin-key: $ADMIN_KEY"
```

---

## Testing Tools

### Option 1: Node.js Script
```bash
npm install axios
node test-api.js
```

### Option 2: Postman
1. Import `Query_Quest_API.postman_collection.json`
2. Update variables (base_url, token, admin_key)
3. Run requests

### Option 3: Bash Script
```bash
chmod +x test-api.sh
./test-api.sh
```

### Option 4: Manual cURL
- Copy commands from API_RESPONSES.md
- Replace placeholders with actual values
- Run in terminal

---

## Dummy Test Data

### Teams
```
team_alpha / securePassword123
team_beta / securePassword123
team_gamma / securePassword123
```

### Admin Key
```
admin-secret-key-change-in-production
```

### Questions
```
ID: select-basic-001 (Easy, 10 pts)
ID: join-advanced-002 (Medium, 25 pts)
```

---

## Common Patterns

### Pattern 1: Register & Login
```bash
# 1. Register
REG=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"teamName":"test_team","password":"test123"}')
TOKEN=$(echo $REG | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Use token for next requests
curl -X GET http://localhost:5000/api/questions \
  -H "Authorization: Bearer $TOKEN"
```

### Pattern 2: Submit & Check Result
```bash
# 1. Submit
SUBMIT=$(curl -s -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"questionId":"select-basic-001","content":"SELECT 1;","language":"sql"}')

# 2. Get submission ID
SUB_ID=$(echo $SUBMIT | grep -o '"submissionId":"[^"]*' | cut -d'"' -f4)

# 3. Check result
curl -X GET http://localhost:5000/api/submissions/$SUB_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Pattern 3: Get & Filter Data
```bash
# Get submissions with filter
curl -X GET "http://localhost:5000/api/submissions?questionId=select-basic-001&status=Accepted" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Server Error |

---

## Error Handling

### Bad Request (400)
```json
{
  "error": "Team name and password are required"
}
```

### Unauthorized (401)
```json
{
  "error": "Authentication failed"
}
```

### Not Found (404)
```json
{
  "error": "Question not found"
}
```

### Rate Limited (429)
```json
{
  "error": "Too many requests",
  "retryAfter": 60
}
```

---

## Rate Limits

- **Global**: 100 requests/15 minutes per IP
- **Auth**: 5 requests/15 minutes per IP
- **Run**: 5 requests/minute per user
- **Submit**: 2 requests/minute per user

---

## Troubleshooting

### Server Not Running
```bash
cd query_quest_backend
npm run dev
```

### Invalid Token
- Get new token by logging in again
- Use new token in requests

### Access Denied (Admin)
- Verify x-admin-key header is correct
- Check key value in environment

### Rate Limit Hit
- Wait before making more requests
- Check limit duration (usually 60 seconds)

---

## Important Notes

1. **All timestamps** are ISO 8601 format (UTC)
2. **Token expiration** is 24 hours
3. **Max query length** is 5000 characters
4. **Max results** is 100 rows
5. **Only SELECT** queries are allowed
6. **Passwords** must be at least 6 characters
7. **Team names** must be unique

---

## Files Reference

- `API_RESPONSES.md` - Complete documentation
- `TESTING_GUIDE.md` - How to test
- `test-api.js` - Node.js test script
- `test-api.sh` - Bash test script
- `Query_Quest_API.postman_collection.json` - Postman collection

---

**Last Updated:** January 6, 2026  
**Base URL:** `http://localhost:5000/api`  
**Status:** ✅ All 24 endpoints documented

