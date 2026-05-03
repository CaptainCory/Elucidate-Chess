## Goal
Replace the plain spinner during AI analysis with a chess-themed "thinking interlude" that builds anticipation and keeps the user engaged.

## Where it lives
`src/pages/PositionPage.tsx`, the `gameState === 'analyzing'` branch currently shows a generic spinning ring + "Analyzing your chess thinking..." line. We'll replace it with a richer, chess-flavored sequence.

## New component: `src/components/AnalyzingSequence.tsx`

Three stacked, chess-specific elements rendered in the same vertical space the spinner uses today:

### 1. Mini animated chess scene
A small (roughly 96×96) inline SVG showing a 4×4 cream/walnut checker fragment with **a single knight piece** (reuse the same Wikipedia SVG URLs already used by `ChessBoard`, per the piece-rendering memory). The knight "hops" between squares in an L-pattern on a loop using framer-motion `animate` on `x`/`y` with `ease: [0.4, 0, 0.2, 1]`, ~700ms per hop, brief pause, then next hop. Soft drop shadow under the piece scales down on landing for a tactile feel. Conveys "the engine is calculating moves."

### 2. Cycling chess-flavored status lines
Below the scene, rotate evocative phrases every ~1.5s with `AnimatePresence mode="wait"` (fade + 4px slide):
- "Reading the position..."
- "Counting material and tempo..."
- "Looking for tactics..."
- "Checking candidate moves..."
- "Weighing your reasoning..."
- "Comparing to the strongest line..."
- "Drafting your feedback..."

Loops if analysis runs long. Uses `font-display` serif, `text-muted-foreground`. Strictly no war/military metaphors (per Core memory).

### 3. Pawn-march progress strip
A thin horizontal track styled like a single board rank (8 cream/walnut squares, ~6px tall total bar height with subtle square dividers). A tiny pawn glyph (Unicode ♙ or reused SVG) advances square-by-square left→right, ~250ms per square, then resets. Acts as an indeterminate progress indicator that's unmistakably chess.

All three pieces share the existing palette tokens (`--board-light`, `--board-dark`, `text-primary`) — no new colors. Respects `prefers-reduced-motion`: framer-motion handles automatically; the knight stops hopping and the pawn fades between squares instead of sliding.

## Wiring in PositionPage.tsx
Replace these ~6 lines in the `analyzing` branch:

```tsx
<div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
<p className="text-muted-foreground">Analyzing your chess thinking...</p>
```

with:

```tsx
<AnalyzingSequence />
```

The header text above ("Analyzing your response...") stays. No state/logic changes — animations auto-cycle via internal intervals cleared on unmount, ending naturally when `gameState` flips to `'result'`.

## Files
- **create** `src/components/AnalyzingSequence.tsx`
- **edit** `src/pages/PositionPage.tsx` (swap the analyzing block)