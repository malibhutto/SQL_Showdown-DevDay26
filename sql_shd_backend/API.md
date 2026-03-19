# Query Quest Backend - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### Health Check

#### GET /health
Check server status (no authentication required)

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-31T12:00:00.000Z",
  "environment": "development"
}
```

---

### Authentication

#### POST /api/auth/register
Register a new team

**Request Body:**
```json
{
  "teamName": "team_alpha",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "teamName": "team_alpha",
    "createdAt": "2025-12-31T12:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Team name already exists
- `400` - Password must be at least 6 characters

---

#### POST /api/auth/login
Login with team credentials

**Request Body:**
```json
{
  "teamName": "team_alpha",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "teamName": "team_alpha",
    "lastLogin": "2025-12-31T12:00:00.000Z"
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `429` - Too many login attempts

---

#### POST /api/auth/logout
Logout (client should delete token)

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Questions

#### GET /api/questions
Get all available questions

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "questionId": "select-basic-001",
      "title": "Basic SELECT",
      "description": "Write a SQL query to select all columns...",
      "starterSql": "SELECT * FROM users;",
      "dialect": "sqlite",
      "constraints": {
        "allowOnlySelect": true,
        "maxRows": 100,
        "maxQueryLength": 5000
      }
    }
  ]
}
```

---

#### GET /api/questions/:id
Get a specific question by ID

**Response:**
```json
{
  "success": true,
  "question": {
    "questionId": "select-basic-001",
    "title": "Basic SELECT",
    "description": "Write a SQL query to select all columns...",
    "starterSql": "SELECT * FROM users;",
    "dialect": "sqlite",
    "constraints": {
      "allowOnlySelect": true,
      "maxRows": 100,
      "maxQueryLength": 5000
    }
  }
}
```

**Errors:**
- `404` - Question not found

---

#### POST /api/questions
Create a new question (authenticated)

**Request Body:**
```json
{
  "questionId": "new-question-001",
  "title": "Question Title",
  "description": "Question description in markdown",
  "setupSql": "CREATE TABLE...",
  "starterSql": "SELECT...",
  "dialect": "sqlite",
  "expectedOutput": {
    "type": "table",
    "columns": ["col1", "col2"],
    "rows": [[1, "value"]],
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

### Code Execution

#### POST /api/run
Run SQL code without judging (authenticated)

**Rate Limit:** 5 requests per minute

**Request Body:**
```json
{
  "questionId": "select-basic-001",
  "sql": "SELECT * FROM users;"
}
```

**Response:**
```json
{
  "success": true,
  "execution": {
    "stdout": "┌────┬─────────┬──────────────────┐\n│ id │ name    │ email            │\n...",
    "stderr": null,
    "executionTimeMs": 125,
    "parsedOutput": {
      "columns": ["id", "name", "email"],
      "rows": [
        [1, "Alice", "alice@example.com"]
      ]
    }
  }
}
```

**Errors:**
- `400` - Invalid SQL or validation failed
- `404` - Question not found
- `429` - Rate limit exceeded

---

#### POST /api/run/submit
Submit SQL code for judging (authenticated)

**Rate Limit:** 3 requests per minute

**Request Body:**
```json
{
  "questionId": "select-basic-001",
  "sql": "SELECT * FROM users;"
}
```

**Response:**
```json
{
  "success": true,
  "verdict": "Accepted",
  "message": "All test cases passed!",
  "details": {
    "expectedRows": 3,
    "actualRows": 3,
    "expectedColumns": 3,
    "actualColumns": 3
  },
  "execution": {
    "executionTimeMs": 125,
    "parsedOutput": {
      "columns": ["id", "name", "email"],
      "rows": [[1, "Alice", "alice@example.com"]]
    }
  },
  "submissionId": "507f1f77bcf86cd799439011"
}
```

**Possible Verdicts:**
- `Accepted` - Correct answer
- `Wrong Answer` - Output doesn't match expected
- `Runtime Error` - SQL execution failed

**Errors:**
- `400` - Invalid SQL or validation failed
- `404` - Question not found
- `429` - Rate limit exceeded

---

#### GET /api/run/submissions
Get user's submissions (authenticated)

**Query Parameters:**
- `questionId` (optional) - Filter by question

**Response:**
```json
{
  "success": true,
  "submissions": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "teamName": "team_alpha",
      "questionId": "select-basic-001",
      "verdict": "Accepted",
      "judgeMessage": "All test cases passed!",
      "submittedAt": "2025-12-31T12:00:00.000Z"
    }
  ]
}
```

---

#### GET /api/run/submissions/:id
Get specific submission details (authenticated)

**Response:**
```json
{
  "success": true,
  "submission": {
    "_id": "507f1f77bcf86cd799439011",
    "teamName": "team_alpha",
    "questionId": "select-basic-001",
    "submittedSql": "SELECT * FROM users;",
    "execution": {
      "stdout": "...",
      "stderr": null,
      "executionTimeMs": 125,
      "memoryUsedKb": 0
    },
    "verdict": "Accepted",
    "judgeMessage": "All test cases passed!",
    "submittedAt": "2025-12-31T12:00:00.000Z"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "message": "Optional detailed message"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## Rate Limiting

- **Run endpoint:** 5 requests per minute per team
- **Submit endpoint:** 3 requests per minute per team
- **Login endpoint:** 10 attempts per 15 minutes per IP
- **General API:** 100 requests per minute per IP

Rate limit headers are included in responses:
```
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: 1640995200
```
