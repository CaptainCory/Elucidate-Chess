# Stickiness & Activation Build Plan

Nine features grouped into three waves so each wave is shippable and testable on its own.

---

## Wave 1 — Activation (land → play in seconds)

### 1. Zero-friction first puzzle on landing
- Replace the hero illustration on `/` with a live interactive board (a curated easy mate-in-1).
- Guest can move pieces immediately. On correct move: confetti + "Nice — try another?" CTA leading into `/play`.
- No signup required, no typing required for this single board.

### 3. Difficulty preview on CTAs
- The "Unlimited Beginner Puzzles" buttons get a small inline board thumbnail (40×40) next to the text showing a real starting position, so the click feels concrete.

### 4. Remove typing for puzzle #1
- For the very first puzzle a guest plays in `/play`, skip the "explain your reasoning" requirement. They move → instant analysis.
- Track via `localStorage` flag `ec_first_puzzle_done`. From puzzle #2 onward, the normal typing flow returns.

---

## Wave 2 — Retention loop (reasons to come back)

### 5. Surface Daily Challenge + streak counter everywhere
- Add a compact streak chip in the top nav: `🔥 7` linking to `/daily`.
- On `/play` result screen, after every solve, show "Daily Challenge — Day N streak" card if not yet played today.
- Reads from `profiles.current_streak` and a new `daily_streak` derived from `daily_challenge_scores`.

### 6. Streak-save email
- New scheduled edge function `send-streak-reminder` running daily at 18:00 UTC via pg_cron.
- For users with `current_streak >= 2` who have NOT played today and have an email, send a single reminder via existing Resend setup.
- Reuses existing email infrastructure; one new template `streak-reminder.tsx`.

### 7. Visible ELO rating
- Add `rating int default 1000` to `profiles`.
- Update `increment_puzzle_stats` RPC to adjust rating per solve: simple delta = `round((score - 50) * difficulty_multiplier / 5)` (beginner 1×, intermediate 1.5×, advanced 2×). Clamp 400–2400.
- Display rating prominently on result screen with an animated +/- delta, and on the profile page.

---

## Wave 3 — Fun & social

### 8. Themed quests
- New table `weekly_quests` (seeded weekly by cron) and `user_quest_progress`.
- Examples: "Solve 5 fork puzzles", "Get 3 A+ grades", "Play 7 days in a row".
- Quest card on `/play` sidebar + completion badge + small celebration.
- For v1 ship 3 hardcoded rotating quests; full editor later.

### 9. More juice on success
- Bigger confetti burst for A/A+ (already partially there — increase particle count + add screen flash).
- Add a short success sound layer (uses existing `useSoundEffects`).
- Score badge gets a brief scale-up + glow pulse at 90+.

### 14. "Players online now"
- Use Supabase Realtime presence channel `online-users` joined on app mount.
- Small badge in nav: `● 42 playing now`. Updates live.
- Anonymous-friendly (joins with a random id; no auth required).

---

## Technical notes (internal)

- DB migrations needed for: `profiles.rating`, `weekly_quests`, `user_quest_progress`, plus update to `increment_puzzle_stats`.
- One new edge function `send-streak-reminder` + one new email template.
- pg_cron job for the reminder + quest rotation.
- Realtime presence does not need a table — uses ephemeral channel state.
- The landing-page board and the puzzle-#1 typing skip are pure frontend.

---

## Suggested shipping order

1. **Wave 1** first — biggest visible activation win, all frontend, ~1 build cycle.
2. **Wave 7 (rating)** + **Wave 5 (streak surface)** next — both lean on existing tables, high retention impact.
3. **Wave 9 (juice)** + **Wave 14 (presence)** — small, polished touches.
4. **Wave 6 (streak email)** + **Wave 8 (quests)** last — need cron + new tables.

Want me to start with Wave 1, or build everything end-to-end in one go?
