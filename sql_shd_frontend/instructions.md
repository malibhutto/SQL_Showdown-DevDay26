# Build a Vite + React “SQL Competition” Frontend (HackerRank/LeetCode-style)

You are building a **complete frontend project** using **Vite + React (TypeScript)** that simulates a **SQL competition platform**. The UI/UX should feel like **HackerRank / LeetCode “contest + editor”** experience, with **question on the left** and a **code/text editor on the right**, plus a **bottom action bar**.

> Styling: keep it simple, clean, and usable. Don’t over-design. Focus on layout, interactions, routing, state, and component structure.

---

## 1) Tech Stack & Setup

### Requirements
- Vite + React + TypeScript
- React Router (routing)
- State management: React Context + hooks (no Redux needed)
- UI: minimal CSS (CSS modules or plain CSS). No heavy component libraries required.
- Editor: **Monaco Editor** preferred (VS Code-like), fallback to CodeMirror if needed.
- Persist minimal session info in `localStorage`.

### Project Structure (suggested)
- `src/`
  - `app/` (router, layout, providers)
  - `pages/` (Login, CompetitionLobby, CompetitionPlay, NotFound)
  - `components/` (SplitLayout, QuestionPanel, EditorPanel, BottomBar, Tabs, Timer, Modal)
  - `data/` (mock questions, mock tables)
  - `services/` (mock api, auth)
  - `styles/` (base styles)

---

## 2) Routing & Pages

### Routes
1. `/login`
2. `/competition` (lobby page)
3. `/competition/play` (main contest UI)
4. `*` NotFound

### Guarded Access
- Only logged-in teams can access `/competition` and `/competition/play`.
- If not logged in → redirect to `/login`.

---

## 3) Authentication (Simple Team Login)

### Login Screen Behavior
- Form fields:
  - `team_name` (text)
  - `password` (password)
- Validation:
  - team_name required (min 2 chars)
  - password required (min 4 chars)
- On submit:
  - call mock auth service (`AuthService.login(team_name, password)`)
  - if success:
    - store session: `{ teamName, token, loginTime }` in `localStorage`
    - redirect to `/competition`
  - if fail:
    - show error message (inline + optional toast)

### Mock Auth Logic
- Use a simple hardcoded credential list:
  - Team names allowed: e.g. `["team_alpha", "team_beta", "devsquad"]`
  - Password for all: `"sql123"` (or per team)
- Return a fake token like `"mock-token-<teamName>"`

### Logout
- Available in lobby + play pages
- Clears session and redirects to `/login`

---

## 4) Competition Lobby Page (`/competition`)

### Goal
This is the “entry point” before playing the contest.

### UI Elements
- Header:
  - Competition title
  - Logged in team name
  - Logout button
- Main content:
  - A “Competition Card” showing:
    - contest name
    - duration (e.g., 30 min)
    - number of questions (e.g., 5)
    - rules summary (no switching tabs restrictions, etc.)
  - Primary CTA button:
    - “Enter Competition”
      - click → show a confirmation modal:
        - “Ready to start? Timer begins once you start.”
        - Buttons: Start / Cancel
      - Start → redirect to `/competition/play`

### State
- `entered = true/false` optional
- Timer must **NOT** start in lobby.

---

## 5) Competition Play Page (`/competition/play`) – Main Interface

This page must resemble the provided screenshot layout:

### Core Layout
- Full screen, 2-column split:
  - **Left panel**: Question
  - **Right panel**: Editor
- A **bottom action bar**:
  - Left side: Submit button + optional “Run”
  - Middle: status output
  - Right side: timer + question navigation controls

### Split Layout Specs
- Default ratio: 50/50 (or 55/45)
- Resizable divider (drag to resize) is a plus but optional.
- Panels must scroll independently (question scroll doesn’t move editor).

---

## 6) Question Panel (Left Side)

### What it Shows
- Question title
- Difficulty tag (Easy/Medium/Hard)
- Prompt body written in rich formatted text:
  - paragraphs
  - bold/italic
  - inline code
- Display “tables” like in the screenshot:
  - Render as clean HTML tables
  - Include headings and sample rows
- Show question instruction:
  - “Only enter a single integer…”
  - “Do not include extra spaces…”

### Question Navigation
- Show question number list or Next/Prev:
  - Example:
    - “Question 1 of 5”
    - Buttons: Previous, Next
- Clicking a question changes content in left panel and also changes editor saved draft for that question.

### Question Data Model (mock)
Each question should include:
- `id`
- `title`
- `statement` (markdown-like string or structured blocks)
- `tables`: array of `{ name, columns, rows }`
- `joinOrTask`: description (if needed)
- `answerType`: e.g. `single_integer`, `sql_result`, `text`
- `initialEditorText`: default template (SQL comment + prompt)

---

## 7) Editor Panel (Right Side)

### Tabs
The editor must support at least **two modes**:
- **SQL** tab (Monaco language: `sql`)
- **Plain Text** tab (Monaco language: `plaintext`)
(Exactly like the screenshot “Language: Plain Text”)

### Editor Behavior
- Auto-save per question:
  - When user types, save to in-memory state and also to `localStorage` (drafts)
  - Key: `draft::<teamName>::<questionId>::<tab>`
- Switching question restores saved text for that question.
- Provide an optional “Reset to template” action (small button).

### Editor UI Controls
- Top bar inside editor panel:
  - “Change Theme” (just toggles dark/light editor theme; keep it simple)
  - “Language: SQL / Plain Text” (or via tabs)
- Main editor area:
  - fill available height
- Bottom bar (global bottom action bar handles submit/run)

---

## 8) Bottom Action Bar (Global)

### Left Section
- `Run` button (optional in mock; can simulate)
- `Submit` button (mandatory)
- Buttons disabled when:
  - competition ended
  - submission in progress

### Middle Section (Output / Status)
- Show:
  - “Ready”
  - “Running…”
  - “Submitted ✓”
  - “Error: …”
- If “Run” pressed:
  - simulate output like:
    - “Mock execution complete. Rows returned: 3”
  - For Plain Text:
    - “Text saved locally”

### Right Section
- Countdown timer (starts when entering `/competition/play`)
- Show:
  - `Time Left: mm:ss`
- When timer reaches 0:
  - lock the editor (read-only)
  - disable Run/Submit
  - show “Competition ended”

---

## 9) Competition Timer Rules

### Start
- Timer starts when user clicks “Start” in lobby and lands on `/competition/play`
- Duration: configurable (e.g. 30 min)
- Save start time in `localStorage`:
  - `competition::<teamName>::startTime`
- Derive remaining time from real clock so refresh doesn’t reset timer.

### End
- When time is up:
  - set `ended=true`
  - lock submissions
  - optionally auto-redirect to a “Results” modal (still on same page)

---

## 10) Submissions (Mock Only)

### Submission Flow
- On Submit:
  - capture:
    - teamName
    - questionId
    - language/tab (sql/plaintext)
    - editorContent
    - timestamp
  - store in `localStorage` under:
    - `submissions::<teamName>` (array)
- Show a confirmation:
  - “Submission saved.”
- Display “Latest submission status” per question in question nav (tiny dot or label):
  - e.g. `Submitted (1)` count

### Optional: Fake Evaluation
- For SQL questions:
  - if query contains certain keyword, mark as “Accepted” (mock)
  - else “Wrong Answer”
- For Plain text:
  - always “Saved”

---

## 11) Data & Sample Questions (Include 3–5)

Create at least 3 questions, one of them matching the screenshot vibe:
- show two tables (Student, Teaching Assistants)
- ask count of rows after join
- requires returning a single integer

Example question content requirements:
- Must include:
  - table definitions (names + columns + data rows)
  - a join expression shown in formatted text
  - a clear instruction like “Only enter a single integer…”

---

## 12) Accessibility & UX Details
- Keyboard shortcuts:
  - `Ctrl/Cmd + Enter` → Submit
  - `Ctrl/Cmd + Shift + Enter` → Run
- Toast or inline status messages
- Keep everything responsive:
  - On smaller screens:
    - stack panels vertically (question on top, editor below)
    - still keep bottom bar accessible

---

## 13) Non-Goals (Do NOT implement now)
- Real backend execution of SQL
- Real DB connection
- Real multi-user matchmaking
- Heavy styling or animations

---

## 14) Deliverables (What to Output)
Generate the full working Vite + React project with:
- All routes and components implemented
- Mock data (questions + tables)
- Session auth (localStorage)
- Competition timer (persistent)
- Split screen play UI
- Editor with SQL + Plain Text tabs
- Run + Submit behavior (mock)
- Submissions stored locally and displayed as status

---

## 15) Acceptance Criteria Checklist

### Login
- [ ] Team login works with mock credentials
- [ ] Session persists on refresh
- [ ] Protected routes redirect to login

### Lobby
- [ ] Enter competition button + confirmation modal
- [ ] Starts competition and routes to play page

### Play UI
- [ ] Left panel shows question with tables and formatted instructions
- [ ] Right panel shows editor with SQL/Plain Text modes
- [ ] Bottom bar has Submit (and optional Run)
- [ ] Per-question drafts persist and restore
- [ ] Timer persists across refresh
- [ ] When timer ends, editor locks and buttons disable

### Submission
- [ ] Submit stores payload in localStorage
- [ ] UI shows submission confirmation + per-question submission indicator

---

## 16) Visual Reference (Layout Target)
Target layout:
- Left: question statement + tables (like HackerRank prompt)
- Right: code editor + language selection
- Bottom: submit/run controls

Implement a clean dark theme by default (optional), but keep styling minimal and readable.

---

## Final Instruction
Implement everything above as a complete, runnable Vite + React TypeScript app. Ensure code is clean, modular, and easy to extend later with real backend evaluation.
