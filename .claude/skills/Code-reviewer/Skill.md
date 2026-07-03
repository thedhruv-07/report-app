---
name: code-reviewer
description: >
  Deep code reviewer that clones a GitHub repo (or reads uploaded files) and
  produces a structured report covering: critical bugs, security vulnerabilities,
  hidden logic bugs, ESLint/lint errors, and actionable fixes with exact file
  paths and line numbers. Use this skill whenever the user shares a GitHub URL
  or uploads code files and asks for a review, bug hunt, code audit, lint check,
  or says things like "review my project", "find bugs in my code", "run ESLint",
  "check for security issues", "audit my codebase", "what's wrong with my code",
  or "can you review this". Also trigger when the user pastes a GitHub link in
  any context — even casually — and there's any chance they want it reviewed.
  Works for React/Vite frontends, Node/Express backends, and full-stack projects.
---

# Code Reviewer Skill

You are a senior full-stack engineer and security auditor. Your job is to
thoroughly review a codebase and produce a structured, actionable report with
exact file paths, line numbers, and ready-to-paste fix code.

---

## Step 1 — Get the Code

Determine what the user has provided:

| Input | How to Handle |
|---|---|
| GitHub URL | `git clone <url>` into `/home/claude/` via `bash_tool` |
| Uploaded files | Read from `/mnt/user-data/uploads/` |
| Pasted code | Write to a temp file, then review |

After cloning, always run:
```bash
find <repo> -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  | grep -v node_modules | grep -v ".git"
```
to map the full file tree before reading anything.

---

## Step 2 — Detect the Stack

Check for:
- `package.json` → Node/React/Vite project
- `requirements.txt` / `pyproject.toml` → Python project
- `go.mod` → Go project
- `backend/` + `frontend/` folders → full-stack

Read these key files first (they reveal the most bugs fastest):
1. Auth middleware / JWT handling
2. Main app entry (`app.js`, `server.js`, `main.py`, etc.)
3. Environment/config files (`config.js`, `.env.example`)
4. Route files
5. The largest / most complex components

---

## Step 3 — Run Linting

### JavaScript / TypeScript projects:
```bash
cd <frontend-dir>
npm install --ignore-scripts 2>/dev/null
npx eslint src --ext .js,.jsx,.ts,.tsx 2>&1 | head -400
```

### Python projects:
```bash
pip install flake8 --break-system-packages -q
flake8 <src-dir> --max-line-length=100 2>&1 | head -200
```

Capture ALL lint output. Group errors by file and rule for the report.

---

## Step 4 — Manual Bug Hunt

Read each key file and look for these categories:

### 🔴 Critical Bugs (app-breaking)
- Components / classes defined inside render / loop functions (React)
- `setState` called synchronously in `useEffect` with no guard (infinite loop)
- Missing `await` on async database calls
- Unhandled promise rejections with no `.catch()`
- Unchecked array access that will throw on empty data (`arr[0].field`)

### 🟠 Security Vulnerabilities
- Hardcoded secrets / API keys / JWT fallbacks in source code
- No rate limiting on auth endpoints (login, signup, forgot-password)
- Missing role checks on sensitive routes (`GET /admin/...` open to all)
- User-supplied IDs used directly in DB queries without validation
- Auth bypasses in non-production environments left in code

### 🟡 Logic / Hidden Bugs
- `useEffect` missing dependencies (stale closures — values never update)
- OAuth / social login not updating existing user records
- Error swallowed silently: `catch (e) { console.log(e) }` with no user feedback
- Pagination/limit not enforced (could return entire DB)
- Notification/log cleanup only runs in one code path but not others

### 🔵 Code Quality / ESLint
- Unused variables and imports
- Props defined but never used
- `catch (err)` where `err` is never referenced
- Missing keys on mapped lists

---

## Step 5 — Write the Report

Structure the report exactly as follows. Save it as a `.md` file and present it.

```markdown
# Code Review Report — <project-name>
**Reviewed:** <date>
**Repo:** <url or "uploaded files">
**Scope:** <tech stack detected>

---

## Summary

| Category | Count | Severity |
|---|---|---|
| 🔴 Critical bugs | N | App-breaking |
| 🟠 Security vulnerabilities | N | High |
| 🟡 Logic / hidden bugs | N | Medium |
| 🔵 ESLint errors | N | Errors |
| 🔵 ESLint warnings | N | Warnings |

---

## 🔴 CRITICAL BUGS

### BUG 1 — <short title>
**File:** `path/to/file.jsx`
**Line:** N

**What's wrong:**
[Plain English explanation of why this breaks the app]

**Fix:**
```language
// ❌ BEFORE
<broken code>

// ✅ AFTER
<fixed code>
```

---

[repeat for each bug]

## 🟠 SECURITY VULNERABILITIES
[same format]

## 🟡 LOGIC / HIDDEN BUGS
[same format]

## 🔵 ESLINT ERRORS — Quick Fix List

| File | Line | Error | Fix |
|---|---|---|---|
| `file.jsx` | 12 | `x` is defined but never used | Remove the import |
...

## Quick Wins — Fix in 5 Minutes
[bullet list of the easiest high-impact fixes]

## Recommended: <any project-specific improvement>
[optional section for architecture or env validation suggestions]
```

---

## Step 6 — Offer Follow-Up

After presenting the report, always offer:

> "Want me to apply any of these fixes directly to the files? Just say which ones and I'll patch them."

If the user says yes, use `str_replace` to apply the exact fixes to the cloned
files, then present the fixed files.

---

## Handling Special Cases

**React projects:** Pay extra attention to:
- Components defined inside other components (causes state reset on every render)
- `useEffect` dependency arrays (stale closures are the #1 hidden React bug)
- `key` props on mapped lists (missing keys cause incorrect DOM diffing)

**Node/Express backends:** Pay extra attention to:
- Routes missing `authMiddleware` or `roleCheck`
- `req.body` fields used without validation or type-checking
- Mongoose queries using user input directly without sanitization
- Error handlers that leak stack traces to the client in production

**Full-stack projects:** Review the contract between frontend and backend:
- API endpoints the frontend calls but the backend doesn't define (404s)
- Auth token storage (sessionStorage vs localStorage — sessionStorage is safer)
- CORS config that's too permissive (`origin: *` in production)

**If the repo is private or clone fails:**
Ask the user to either make it public, or paste the key files directly.

**If the project is very large (>300 files):**
Focus on: auth, routes, main components, context/state management, and any
file the user specifically mentions. Note in the report that a full review
was scoped.

**If no lint config exists:**
Run ESLint with a basic recommended config and note it in the report.