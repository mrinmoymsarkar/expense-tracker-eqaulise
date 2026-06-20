# Equalize — Improvement Ideas / Roadmap

Prioritized backlog of things that would make the app meaningfully better.
Grounded in the current codebase (Next.js 15 + Firebase Auth/Firestore + Genkit/Gemini,
mobile-first PWA, khata aesthetic, India/₹/UPI market).

Last reviewed: 2026-06.

---

## Tier 1 — Fix soon (correctness, safety, privacy)

### 1. Firestore rules leak private data  ⚠️ highest priority
`firestore.rules` has `match /users/{uid} { allow read: if isAuth(); }`, so **any
signed-in user can read any other user's full profile doc** — email, UPI ID,
budgets, recurring expenses, custom categories — not just people in their groups.
**Fix:** split a small public profile (displayName, photoURL) that others can read
from the private fields (email, upiId, budgets, recurring, categories) gated to
`isSelf(uid)`. Group rendering only needs the public fields.

### 2. No tests on money math
There is no test suite. The money-critical pure logic is untested:
`src/lib/balances.ts` (`computeSplits`, settlement/who-owes-whom plan), recurring
period math in `src/hooks/use-recurring.ts`, budget math, `src/lib/csv.ts`.
**Fix:** add Vitest covering split rounding (₹100 ÷ 3 reconciles), settlement
minimization, recurring date edges (Feb, year boundary), CSV escaping.

### 3. Real backup (JSON export/import)
CSV export (`src/lib/csv.ts`) is a report, not a restorable backup. Data was already
lost once (cache-only before the DB existed). **Fix:** JSON export + import/restore
round-trip so users own their data.

### 4. Error observability
No error reporting. The missing-DB bug was invisible for a long time. **Fix:** a
lightweight Sentry (or similar) so the next silent failure surfaces.

---

## Tier 2 — High-leverage features (AI infra already wired)

### 5. Use Gemini for more than receipts
Genkit/Gemini is only used for receipt scan + split suggestion. High-value adds:
- **Auto-categorize from description** — "Zepto" → Grocery automatically (helps every entry).
- **Natural-language add** — "450 dinner with Raj split 3 ways" → parsed expense + split.
- **Monthly insight narrative** — "Dining up 60% vs last month; ₹800 over Food budget."
  (Dashboard already computes all the underlying numbers.)

### 6. Push notifications (PWA + FCM)
Service worker + WhatsApp-reminder already exist. Budget-threshold alerts ("80% of
Food") and settlement reminders drive engagement.
**Gate:** reliable scheduling (and reliable recurring firing) needs server-side
Cloud Functions → requires moving Firebase **Spark → Blaze**.

### 7. Password reset / account recovery
Email+password and Google only; no visible "forgot password" flow. Table stakes
before real users.

---

## Tier 3 — Polish & scale

- **Recurring only fires on app-open** (catch-up runs in a `useEffect`). Backfills
  correctly so nothing is lost, but timely alerts need the server scheduler (#6).
- **Expense listener fetches all history with no `limit()`** — fine now
  (content-visibility handles rendering), but a date-windowed query with "load older"
  keeps it cheap as years accumulate.
- **Accessibility** — khata microcaps are small/low-contrast; do a focused pass on
  contrast + screen-reader labels + focus management in sheets.
- **Onboarding** — guided first expense / clearer first-run beyond empty states.

---

## Suggested order
1 (rules) → 2 (balance tests) → 5 (AI auto-categorize) → then 3/4/6/7 as capacity allows.
