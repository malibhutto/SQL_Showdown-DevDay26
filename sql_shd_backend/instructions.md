```markdown
# Full System Prompt — SQL Competition Judge using OneCompiler + MongoDB (Production-Ready)

You are building the **backend + judge layer** for a **SQL competition platform** (frontend already implemented).
The system must be **correct, fair, secure, scalable, and extensible**, similar in behavior to **HackerRank / LeetCode SQL rounds**.

This document defines **ALL conditions, rules, data models, execution constraints, judging logic, security measures, and cloud storage requirements** to make the system **fully workable and robust**.

---

# 1. System Architecture (High Level)

```

Frontend (Vite + React)
|
|  HTTPS (REST)
↓
Backend API (Node.js / Express / NestJS)
|
|── Auth & Session
|── Question Fetch
|── Submission Handler
|── SQL Judge Engine
|── OneCompiler Proxy
|
↓
MongoDB Atlas (Cloud)

````

---

# 2. Core Responsibilities

## Frontend (Already Done)
- UI / UX
- Editor
- Run / Submit buttons
- Displays results

## Backend (YOU MUST IMPLEMENT)
- Authentication
- Secure API proxy to OneCompiler
- SQL execution orchestration
- ASCII output parsing
- Judge comparison logic
- Verdict generation
- Persistence to MongoDB
- Rate limiting and security

---

# 3. Authentication & User Management (MongoDB)

## User Model (MongoDB)

```json
{
  "_id": ObjectId,
  "teamName": "team_alpha",
  "passwordHash": "<bcrypt_hash>",
  "createdAt": ISODate,
  "lastLogin": ISODate,
  "isActive": true
}
````

### Conditions

* `teamName` must be unique
* Password stored **ONLY as bcrypt hash**
* Never store plaintext password
* Password comparison via bcrypt
* JWT-based session or HTTP-only cookie

---

# 4. Competition & Question Storage (MongoDB)

## Question Model

```json
{
  "_id": ObjectId,
  "questionId": "join-count-001",
  "title": "Join Count",
  "description": "Markdown / HTML string",
  "setupSql": "DDL + INSERT statements",
  "starterSql": "Initial query shown to user",
  "dialect": "sqlite",
  "expectedOutput": {
    "type": "scalar | table",
    "columns": ["name", "number"],
    "rows": [
      ["Nina", 3412],
      ["Nelson", 2341]
    ],
    "orderMatters": false,
    "caseSensitive": false,
    "numericTolerance": 0
  },
  "constraints": {
    "allowOnlySelect": true,
    "maxRows": 100,
    "maxQueryLength": 5000
  },
  "createdAt": ISODate
}
```

---

# 5. Submission Storage (MongoDB)

## Submission Model

```json
{
  "_id": ObjectId,
  "teamName": "team_alpha",
  "questionId": "join-count-001",
  "submittedSql": "SELECT ...",
  "execution": {
    "stdout": "...",
    "stderr": null,
    "executionTimeMs": 21,
    "memoryUsedKb": 4828
  },
  "verdict": "Accepted | Wrong Answer | Runtime Error",
  "judgeMessage": "Optional explanation",
  "submittedAt": ISODate
}
```

### Conditions

* Save **EVERY submission**
* Do NOT overwrite previous submissions
* Use for leaderboard / auditing later

---

# 6. OneCompiler Integration (CRITICAL RULES)

## Supported Languages

* ❌ `"sql"` → NOT supported
* ✅ `"sqlite"` → USE THIS (most reliable)
* Possibly `"mysql"` / `"postgresql"` (plan-dependent)

## Request Structure (MANDATORY)

```json
{
  "language": "sqlite",
  "files": [
    {
      "name": "script.sql",
      "content": "<SETUP_SQL>\n\n<USER_SQL>"
    }
  ]
}
```

### MUST CONDITIONS

* Always prepend `setupSql`
* Never allow user to override setup tables
* Always run in **isolated execution**
* OneCompiler DB is **in-memory only**

---

# 7. SQL Safety & Sanitization Rules

Before sending user SQL to OneCompiler, enforce:

## Allowed

* `SELECT`
* `WITH`
* `JOIN`
* `WHERE`
* `GROUP BY`
* `HAVING`
* `ORDER BY`
* `LIMIT`

## Forbidden (BLOCK IMMEDIATELY)

* `DROP`
* `ALTER`
* `ATTACH`
* `PRAGMA`
* `INSERT`
* `UPDATE`
* `DELETE`
* `CREATE`
* `;` multiple statements (optional but recommended)
* Comments attempting to bypass rules

### Enforcement

* Regex based SQL sanitizer
* Reject request with clear error message

---

# 8. Execution Flow (Run vs Submit)

## Run Code

* Execute SQL via OneCompiler
* Parse stdout
* Return parsed table
* DO NOT judge
* DO NOT save submission

## Submit Code

* Execute SQL

* Parse stdout

* Judge against expected output

* Generate verdict

* Save submission in MongoDB

* Return verdict + diff info

---

# 9. ASCII Output Parsing (MANDATORY)

OneCompiler returns **ASCII table format**, never raw JSON.

### Example

```
┌──────────┐
│ COUNT(*) │
├──────────┤
│ 2        │
└──────────┘
```

### Parser Requirements

* Extract headers
* Extract rows
* Ignore borders
* Trim whitespace
* Convert numeric strings → numbers
* Convert `"NULL"` → null

### Parsed Result Structure

```ts
{
  columns: string[],
  rows: (string | number | null)[][]
}
```

---

# 10. Judge Logic (MOST IMPORTANT)

## Judge Modes

### Scalar Result

* Expect exactly 1 row, 1 column
* Compare numeric or string value

### Table Result

* Compare rows and columns
* Respect `orderMatters`
* Respect `caseSensitive`
* Respect `numericTolerance`

---

## Comparison Rules

### Column Check

* If expected columns defined → must match (after normalization)

### Row Check

* Row count must match
* Column count must match

### Value Check

* Trim whitespace
* Case fold if required
* Numeric comparison using tolerance
* NULL comparison strict

### Order Handling

* If `orderMatters=false` → sort rows before compare

---

# 11. Verdict Rules

| Condition          | Verdict       |
| ------------------ | ------------- |
| SQL error / stderr | Runtime Error |
| Output mismatch    | Wrong Answer  |
| Matches expected   | Accepted      |

---

# 12. Rate Limiting & Abuse Protection

## Per Team

* Max 5 runs / minute
* Max 3 submissions / minute

## Per IP

* Throttle aggressively

## Query Limits

* Max query length (e.g. 5000 chars)
* Max result rows (e.g. 100)

---

# 13. Security (MANDATORY)

* ❌ NEVER expose RapidAPI key to frontend
* Use backend proxy only
* Store secrets in `.env`
* Use HTTPS
* Validate JWT on every request
* Log judge errors (without leaking SQL)

---

# 14. Environment Variables

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=super_secret
RAPIDAPI_KEY=xxxx
RAPIDAPI_HOST=onecompiler-apis.p.rapidapi.com
ONECOMPILER_URL=https://onecompiler-apis.p.rapidapi.com/api/v1/run
```

---

# 15. Backend API Endpoints (Minimum)

## Auth

* `POST /api/auth/login`
* `POST /api/auth/logout`

## Questions

* `GET /api/questions`
* `GET /api/questions/:id`

## Execution

* `POST /api/run`
* `POST /api/submit`

---

# 16. Logging & Auditing

* Log:

  * teamName
  * questionId
  * verdict
  * execution time
* Store raw stdout/stderr in DB
* Useful for disputes & debugging

---

# 17. Production-Grade Enhancements (Optional but Recommended)

* Dockerized Postgres judge (replace OneCompiler later)
* Redis caching for repeated runs
* Leaderboard service
* Admin panel to create questions
* Contest timer enforcement
* Anti-plagiarism SQL AST comparison

---

# 18. Acceptance Checklist (SYSTEM READY WHEN ALL TRUE)

* [ ] MongoDB stores users, questions, submissions
* [ ] Passwords hashed
* [ ] OneCompiler called via backend only
* [ ] ASCII output parsed correctly
* [ ] Scalar & table results supported
* [ ] Order-independent judging supported
* [ ] Rate limits enforced
* [ ] Submissions logged
* [ ] Verdicts consistent & fair
* [ ] Frontend already integrated

---

# FINAL INSTRUCTION

Implement the backend + judge exactly according to this document.
The system must be deterministic, secure, and contest-grade.
Do not cut corners on parsing, comparison, or security.

This design should allow you to scale from **hackathon demo** to **real SQL contest platform** without re-architecture.

```

If you want next:
- I can generate **full backend code (Express/NestJS)**  
- Or **MongoDB schemas + indexes**
- Or **secure SQL sanitizer**
- Or **Dockerized Postgres judge replacement**

Just tell me.
```
