

# Daily Challenge, Sound Effects & Score Reactions, Achievement Badges

## 1. Daily Position Challenge

**Database changes:**
- Add a `daily_challenges` table with columns: `id`, `puzzle_id` (text), `challenge_date` (date, unique), `created_at`
- Add a `daily_challenge_scores` table: `id`, `user_id` (uuid), `challenge_date` (date), `score` (integer), `created_at` — unique on (user_id, challenge_date)
- Create a scheduled edge function `set-daily-challenge` that picks a random puzzle each day and inserts it into `daily_challenges`
- RLS: anyone can SELECT daily_challenges; authenticated users can INSERT/SELECT their own daily_challenge_scores

**Frontend:**
- Add a `/daily` route with a `DailyChallengePage`
- Shows today's position with a countdown timer to next day's challenge
- After solving, shows user's score + a mini daily leaderboard (top 10 scores for today)
- Add a "Daily Challenge" CTA on the landing page and in the nav header with a calendar icon
- If already solved today, show the result and leaderboard (no re-solve)

## 2. Sound Effects & Score Reactions

**Sound effects (Web Audio API — already have the pattern from audio-feedback memory):**
- Create `src/hooks/useSoundEffects.ts` with methods:
  - `playMoveSound()` — wooden click (existing pattern from memory)
  - `playSubmitSound()` — subtle whoosh
  - `playScoreSound(score)` — celebratory chime for 80+, neutral tone for 50-79, low tone for <50
- Trigger `playMoveSound()` in `ChessBoard.tsx` on piece drop
- Trigger `playScoreSound()` in `AnalysisResult.tsx` when score appears

**Score reactions:**
- Enhance `AnimatedScore.tsx` with tier-based visual reactions:
  - **90+**: Confetti burst (small canvas-based particle animation) + golden glow
  - **70-89**: Sparkle effect around the score circle
  - **40-69**: Subtle pulse, no extra effects
  - **<40**: Gentle shake animation, encouraging copy
- Add a `ScoreConfetti` component using canvas for the confetti burst (lightweight, no library needed)

## 3. Achievement Badges

**Database:**
- Add `user_achievements` table: `id` (uuid), `user_id` (uuid), `achievement_key` (text), `unlocked_at` (timestamptz) — unique on (user_id, achievement_key)
- Define achievement checks inside `increment_puzzle_stats` RPC (server-side, atomic):
  - `first_solve` — first puzzle solved
  - `perfect_score` — score of 100
  - `streak_5` — 5 consecutive ≥70 scores
  - `streak_10` — 10 consecutive
  - `ten_solved` — 10 total puzzles
  - `fifty_solved` — 50 total
  - `beginner_graduate` — graduated to intermediate
  - `advanced_graduate` — graduated to advanced
- RPC returns newly unlocked achievements in its response

**Frontend:**
- Create `src/components/AchievementBadge.tsx` — displays individual badge with icon, name, locked/unlocked state
- Create `src/components/AchievementToast.tsx` — animated toast/modal that pops up when a new achievement unlocks (shown after analysis result)
- Add achievements grid to `ProfilePage.tsx` showing all badges (locked ones are grayed out)
- In `useChessGame.ts`, check RPC response for new achievements and trigger the celebration toast

## Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/useSoundEffects.ts` | Web Audio API sound effects |
| `src/components/ScoreConfetti.tsx` | Canvas confetti for high scores |
| `src/components/AchievementBadge.tsx` | Individual badge display |
| `src/components/AchievementToast.tsx` | Unlock celebration popup |
| `src/pages/DailyChallengePage.tsx` | Daily challenge page |
| `supabase/functions/set-daily-challenge/index.ts` | Scheduled daily puzzle picker |

## Files to Modify
| File | Change |
|------|--------|
| `src/components/AnimatedScore.tsx` | Add tier-based reactions (confetti, sparkle, shake) |
| `src/components/ChessBoard.tsx` | Add move sound on piece drop |
| `src/components/AnalysisResult.tsx` | Add score sound, remove TTS references |
| `src/hooks/useChessGame.ts` | Handle achievement unlocks from RPC response |
| `src/pages/ProfilePage.tsx` | Add achievements grid section |
| `src/pages/LandingPage.tsx` | Add Daily Challenge CTA |
| `src/App.tsx` | Add `/daily` route |
| DB migration | Create `daily_challenges`, `daily_challenge_scores`, `user_achievements` tables + update `increment_puzzle_stats` RPC |

## Implementation Order
1. Database migration (tables + updated RPC)
2. Sound effects hook + integrate into board and results
3. Score reactions (confetti component + AnimatedScore enhancements)
4. Achievement system (badge components, toast, profile grid)
5. Daily challenge (page, edge function, scheduled job, nav links)

