# CBT — Collaborative GATE-style Mock Test Portal

A private, small-group (3–5 people) practice tool. Everyone logs in with a real account, organises
tests into **Subject → Topic → Test**, and publishes MCQ / MSQ / NAT questions with per-question
marks and negative marking. Tests published today are highlighted on the dashboard so the group can
attempt them the same day; a GATE-CBT-style exam screen (timer, question palette, mark-for-review,
colour coding) records per-question time spent, and a leaderboard compares everyone's best attempt
on each test.

## Layout

```
CBT/
├── package.json        # root: orchestration scripts only (concurrently)
├── frontend/           # React 19 + Vite 8 + Tailwind v4 + react-router-dom
│   ├── src/
│   │   ├── App.jsx           # routes
│   │   ├── AuthContext.jsx   # logged-in user + login/register/logout
│   │   ├── api.js            # fetch wrapper (cookie-based session auth)
│   │   └── components/       # Dashboard, TopicList, TestWizard, ExamScreen, ResultScreen, …
│   ├── index.html
│   └── vite.config.js  # proxies /api -> http://localhost:5000
└── backend/            # Express 5 + Mongoose 9 + express-session (MongoDB-backed)
    ├── .env            # PORT + MONGODB_URI + SESSION_SECRET
    ├── index.js
    ├── middleware/requireAuth.js
    ├── models/         # User, Subject, Topic, Test, Attempt
    ├── routes/         # auth, subjects, topics, tests, attempts
    └── scripts/smoke.mjs   # end-to-end check against a running dev server
```

`frontend/` and `backend/` are independent npm packages with their own `node_modules`.

## Run

```bash
npm install        # root deps + installs frontend/ and backend/ (via postinstall)
npm run dev        # Vite (http://localhost:5173) + API (http://localhost:5000) together
```

If `postinstall` is skipped for any reason: `npm run install:all`.

| command | what it does |
| --- | --- |
| `npm run dev` | both servers (root) |
| `npm --prefix frontend run dev` | Vite only |
| `npm --prefix backend run dev` | API only (`node --watch`) |
| `npm run build` | production build of `frontend/` |
| `npm run lint` | oxlint over `frontend/` |
| `node backend/scripts/smoke.mjs` | end-to-end check (auth, scoring, leaderboard) against a running dev server |

> Port **5000** must be free — stop any other process listening on it first.

Set a real `SESSION_SECRET` in `backend/.env` before sharing this outside your own machine — the
committed placeholder is fine for solo local dev only.

## Using it

1. **Register / log in** — real accounts (hashed password, server-side session cookie). Everything
   past `/login` and `/register` requires being signed in.
2. **New Subject** → type a folder name (e.g. *Database Management*); the app starts empty.
3. Open a subject → **New Topic** (e.g. *Normalization*, *ER Diagrams*) → **Create Test** inside it.
4. **Create Test** is a 3-step wizard:
   - **Step 1** — pick or create the Subject + Topic.
   - **Step 2** — add questions, either **manually** (MCQ / MSQ / NAT, options, correct answer(s),
     per-question marks + negative marking) or by **importing** Paste / CSV / PDF text (always added
     as MCQ — set MSQ/NAT questions manually):
     - **Paste** — `1. question` / `A) option` / `Answer: B` / optional `Explanation:`, blank line
       between questions (`Answer:` accepts a letter or a number).
     - **CSV** — columns `question, optionA..E, answer, explanation`.
     - **PDF** — text-based PDFs only; extracted text is best-effort split into questions.
     Every import lands in the same editable row list as manual questions — fix text/options/marks,
     delete/add rows — before moving on.
   - **Step 3** — set the timer and **Publish**. A published test appears under its Topic, and in
     **Today's Tests** on the dashboard if published today.
5. **Start Test** → GATE-CBT-style timed exam: fixed timer, question palette (green = answered,
   red = not answered, purple = marked for review), Mark for Review / Clear Response / Save & Next,
   Submit with a confirmation popup. Re-attempt any test any number of times.
6. **Result** → score, correct/wrong/unattempted, time spent per question, and a **Leaderboard**
   ranking everyone who attempted that test by their *best* score (ties broken by lower time taken).

## Data model (MongoDB)

- `users` — `{ name, email (unique), passwordHash }`
- `subjects` — `{ name (unique), description, icon }`
- `topics` — `{ subject (ref), name, description, createdBy (ref) }`, unique per subject
- `tests` — `{ subject (ref), topic (ref), title, timeLimitMinutes, createdBy (ref),
  questions[{ type: MCQ|MSQ|NAT, text, options[], correctIndex, correctIndices[], correctValue,
  tolerance, marks, negativeMarks, explanation }] }` — marks/negative marks are per-question.
- `attempts` — `{ testId (ref), userId (ref), score, total, correctCount, wrongCount,
  unattemptedCount, answers[{ questionIndex, type, selectedIndex, selectedIndices[], numericValue,
  status, timeSpentSeconds }], durationSeconds }` (score is always recomputed server-side; NAT is
  graded as `|value − correctValue| ≤ tolerance`, MSQ is all-or-nothing).

Deleting a subject cascades to its topics, their tests, and those tests' attempts; deleting a topic
cascades to its tests and their attempts; deleting a test cascades to its attempts.

## Auth

Session-cookie based (not JWT): `express-session` with a MongoDB-backed store (`connect-mongo`), so
sessions survive a dev-server restart. Passwords are hashed with `bcryptjs`. There are no roles or
email verification — this is sized for a small trusted group, not a public product.
