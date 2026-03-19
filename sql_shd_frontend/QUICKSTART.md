# Quick Start Guide

## SQL Competition Platform

### Running the Application

The development server is already running at: **http://localhost:5173/**

### Test Credentials

Use any of these team names with the password `sql123`:
- `team_alpha`
- `team_beta`
- `devsquad`

### How to Use

1. **Login** 
   - Enter a team name and password
   - Click "Login"

2. **Competition Lobby**
   - Review the competition details (30 minutes, 5 questions)
   - Click "Enter Competition"
   - Confirm to start (timer begins)

3. **Competition Play**
   - **Left Panel**: Read the question with table data
   - **Right Panel**: Write your SQL or Plain Text answer
   - **Bottom Bar**: 
     - Click "Run" to test (mock execution)
     - Click "Submit" to save your solution
     - Watch the timer in bottom-right
   
4. **Navigation**
   - Use "Previous" / "Next" buttons to switch questions
   - Your code auto-saves as you type
   - Each question remembers your SQL and Plain Text separately

5. **Editor Features**
   - Switch between SQL and Plain Text tabs
   - Toggle theme (Light/Dark) using the theme button
   - Reset to template if needed
   - Keyboard shortcuts:
     - `Ctrl/Cmd + Enter`: Submit
     - `Ctrl/Cmd + Shift + Enter`: Run

### Questions Overview

1. **Q1 - Student Teaching Assistant Join** (Easy)
   - Find row count after INNER JOIN
   - Answer: Single integer

2. **Q2 - Employee Department Analysis** (Medium)
   - Count employees in departments with avg salary > $70,000
   - Requires aggregation

3. **Q3 - Product Inventory Left Join** (Easy)
   - Count NULL values after LEFT JOIN
   - Practice with outer joins

4. **Q4 - Customer Orders Aggregation** (Medium)
   - Find customer with highest total order amount
   - Grouping and aggregation

5. **Q5 - Subquery Practice** (Hard)
   - Books sold more than average
   - Requires subquery knowledge

### Features to Try

✅ Auto-save: Type and refresh - your code is saved!
✅ Question switching: Your drafts persist per question
✅ Timer: Persistent across refresh (simulates real contest)
✅ Submissions: Submit multiple times, count is tracked
✅ Theme toggle: Try light and dark editor themes
✅ Responsive: Works on desktop and mobile

### Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React Context for state
├── data/            # Mock question data
├── pages/           # Route pages
├── services/        # Business logic
└── types/           # TypeScript definitions
```

### Development Commands

```bash
npm run dev      # Start dev server (already running)
npm run build    # Build for production
npm run preview  # Preview production build
```

### Notes

- All data stored in browser localStorage
- Mock execution only (no real SQL engine)
- Timer is 30 minutes and persists across refresh
- When timer ends, editor locks automatically
- Submissions are saved but not evaluated (mock system)

### Troubleshooting

**If you see TypeScript errors in VS Code:**
- These are cache issues from the language server
- The app runs fine in the browser
- Reload the VS Code window if needed (Cmd/Ctrl + Shift + P → "Reload Window")

**To clear all data:**
- Open browser DevTools → Application/Storage → Clear All
- Or use: `localStorage.clear()` in console

### Next Steps

The frontend is complete and functional. To make it production-ready:
1. Add a backend API
2. Implement real SQL execution (sandboxed)
3. Add test case validation
4. Create scoring system
5. Add user registration
6. Implement leaderboards

Enjoy testing the SQL Competition Platform! 🚀
