

## Current State

Your architecture **already does this**. Here's what's in place:

- `validate-puzzle-access` edge function: free users → beginner only, premium → all levels
- `useChessGame.ts`: locks non-beginner puzzles for free users, shows upgrade overlay
- `get_next_puzzle` RPC: serves only beginner puzzles to non-premium users
- Progress cliff: prompts upgrade after 10 beginner solves

## What Can Be Simplified / Cleaned Up

There's some dead complexity that can be removed to make the architecture cleaner:

### 1. Remove `puzzle_attempts` table and daily limit infrastructure
- The `get_daily_attempt_count` function and `puzzle_attempts` table were built for a daily-limit model that's no longer used
- The only remaining write to `puzzle_attempts` is in the `analyze-chess` edge function (for analytics logging)
- **Decision**: keep the table for analytics but drop the `get_daily_attempt_count` function, or remove both entirely

### 2. Remove `validate-puzzle-access` edge function
- This function is called nowhere in the frontend code — access is already enforced via `useChessGame.ts` (client) and `get_next_puzzle` RPC (server)
- It can be deleted to reduce surface area

### 3. Simplify the progress cliff logic
- Currently triggers an upgrade overlay after 10 beginner solves, then every 5. This is good and should stay, but the messaging could be simplified to: "Ready for harder positions? Upgrade to unlock Intermediate and Advanced."

### 4. No code changes needed for core access logic
- The `get_next_puzzle` RPC already gates non-premium to beginner
- The `useChessGame` hook already blocks submission for locked difficulties
- The `UpgradeOverlay` already communicates the value prop

## Proposed Changes

| Action | Files |
|--------|-------|
| Delete `validate-puzzle-access` edge function | `supabase/functions/validate-puzzle-access/index.ts` |
| Drop `get_daily_attempt_count` function | DB migration |
| Optionally remove `puzzle_attempts` insert from `analyze-chess` | `supabase/functions/analyze-chess/index.ts` |
| Keep everything else as-is | — |

This is a cleanup-only change — the free=beginner / paid=intermediate+ model is already live.

