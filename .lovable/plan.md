# Engine Analysis Pipeline

Today `analyze-chess` asks an LLM to compare the user's move against a hand-authored `bestMove` and score the whole submission. There is no true engine in the loop — the "best move" is whatever was saved with the puzzle, and "accuracy" is the LLM's vibe. This plan adds a real Stockfish pipeline that produces an objective move score, then combines it with the reasoning score the LLM is already good at.

## Goals

- Compute an **engine best move** and **centipawn evaluation** for the current FEN.
- Evaluate the position **after the user's move** and derive a **centipawn loss (CPL)**.
- Convert CPL into a **move accuracy score (0–100)**.
- Keep the LLM responsible for **reasoning quality** only, then blend both into the final score the UI already renders.
- Surface engine data (best move, eval, CPL, mate-in-N) to the result screen and follow-up chat.

## Architecture

```text
ChessBoard submit
   │
   ▼
useChessGame.handleSubmit(thinking)
   │  1. run engine locally (useStockfish)
   │     - bestMoveEngine, evalBefore  @ fen
   │     - evalAfter                   @ fen + userMove
   │     - cpl = sideAdjusted(evalBefore - evalAfter)
   │     - moveScore = cplToScore(cpl)
   │
   ├──▶ supabase.functions.invoke('analyze-chess', { ...existing, engine })
   │       server uses engine.bestMove as ground truth (overrides stored bestMove
   │       when it differs), asks LLM ONLY for reasoning score + feedback
   │
   ▼
finalScore = round(0.6 * reasoningScore + 0.4 * moveScore)
```

Engine runs in the browser (Stockfish 10 asm.js already wired in `useStockfish`). No new infra, no API keys.

## Changes

### 1. Engine wrapper — `src/hooks/useStockfish.ts`

Extend the hook (or add `useEngineAnalysis`) so it can:

- `getBestMove(fen, movetimeMs)` — already exists.
- `getEvaluation(fen, depth)` — parse `info ... score cp <n>` / `score mate <n>` from UCI output and return `{ cp: number | null, mate: number | null, bestMove: string }` from the deepest `info` line before `bestmove`.
- Normalize evaluation to **White's perspective** (UCI returns side-to-move relative).

Use `go depth 14` (≈300–600 ms on modern laptops) as the default; expose `movetimeMs` override.

### 2. New utility — `src/lib/engineScore.ts`

```ts
// Map centipawn loss to an accuracy score in [0,100].
// Tuned to match common "accuracy" curves: 0 cpl → 100, 20 → ~92,
// 50 → ~78, 100 → ~60, 200 → ~35, 400+ → <15.
export function cplToScore(cpl: number): number;

// Handle mate scores: missing a forced mate is heavy CPL;
// finding the only mate is 100.
export function evalDelta(before: Eval, after: Eval, sideToMove: 'w' | 'b'): number;
```

Pure functions, unit-testable. Add a vitest file.

### 3. Game flow — `src/hooks/useChessGame.ts`

- Instantiate the engine on mount (lazy-load worker).
- In `handleSubmit`, before invoking the edge function:
  1. `evalBefore = engine.getEvaluation(puzzle.fen)`
  2. Apply `selectedMove` with chess.js to get `fenAfter`.
  3. `evalAfter = engine.getEvaluation(fenAfter)`
  4. Compute `cpl` and `moveScore`.
- Pass `engine: { bestMove, evalBefore, evalAfter, cpl, moveScore }` to the edge function.
- If engine fails (worker error / timeout > 6 s), fall back to the existing flow with `engine: null` so the LLM scores both axes like today.

### 4. Edge function — `supabase/functions/analyze-chess/index.ts`

- Accept new optional `engine` payload.
- When present:
  - Override `bestMove` ground truth with `engine.bestMove` (still show puzzle's stored move in the prompt as "author's intended move" for context).
  - Ask the LLM for `reasoningScore` (0–100) + textual feedback only; drop `moveCorrect`/`score` from its responsibility.
  - Compute final `score = round(0.6 * reasoningScore + 0.4 * engine.moveScore)`.
  - `moveCorrect = engine.cpl <= 15` (within engine noise).
- Return engine fields in the response so the UI can display them.

### 5. UI — `src/components/AnalysisResult.tsx`

Add a small engine panel under "Move Comparison":

- Engine best move (badge).
- Eval before → after (e.g. `+0.4 → −1.8`, or `Mate in 3`).
- Centipawn loss + move-accuracy sub-score.
- Keep the existing big score circle (now the blended score).

### 6. Types

- Extend `AnalysisData` with `engine?: { bestMove; evalBefore; evalAfter; cpl; moveScore }`.
- Extend `AnalysisRequest` on the function side to match.

## Scoring details

Reasoning weight stays at 60% (matches the existing memory note `60/40 scoring weighting`), move weight 40% — but **move score is now objective**, not LLM-guessed.

CPL → score curve (logistic, tuned):

```text
score = 100 * exp(-cpl / 120)   // clamped to [0, 100]
```

Mate handling:

- User plays the mate the engine sees → moveScore = 100.
- Engine sees mate-in-N, user misses it → treat as CPL = 600 (≈8 score).
- User walks into being mated → CPL = 1000 (≈0 score).

## Performance

- Engine worker is created once per session, reused across positions.
- Two evals per submit at `depth 14` ≈ 0.6–1.2 s on a laptop, hidden behind the existing "Analyzing…" sequence.
- Mobile fallback: if first eval takes > 3 s, drop to `depth 10` for the second one.

## Out of scope

- Server-side Stockfish (Deno edge functions can't host the WASM worker realistically).
- Re-grading historical attempts.
- Showing a full PV / arrows on the board (could be a follow-up).

## Files touched

- `src/hooks/useStockfish.ts` (extend)
- `src/lib/engineScore.ts` (new) + test
- `src/hooks/useChessGame.ts`
- `src/components/AnalysisResult.tsx`
- `supabase/functions/analyze-chess/index.ts`
- `src/components/AnalyzingSequence.tsx` (minor: add an "engine thinking" step)
