// Engine evaluation utilities for converting Stockfish output into
// an objective move-accuracy score (0-100) based on centipawn loss.

export interface EngineEval {
  /** centipawns from White's perspective, or null if mate-based */
  cp: number | null;
  /** positive = side to move mates in N, negative = side to move gets mated in N */
  mate: number | null;
  /** best move in UCI (e.g. "e2e4") */
  bestMove: string | null;
}

/** True when the engine actually returned a usable score. */
export function hasEval(raw: { cp: number | null; mate: number | null } | null | undefined): boolean {
  if (!raw) return false;
  return (raw.cp !== null && raw.cp !== undefined) || (raw.mate !== null && raw.mate !== undefined);
}

/**
 * Convert an evaluation that UCI returned (relative to side-to-move)
 * into an evaluation from White's perspective. Centipawns.
 *
 * Mate scores are mapped to a very large/small centipawn equivalent so
 * downstream math is uniform. A finite "cp" is preferred when present.
 */
export function normalizeEvalToWhite(
  raw: { cp: number | null; mate: number | null },
  sideToMove: 'w' | 'b',
): number {
  const sign = sideToMove === 'w' ? 1 : -1;
  if (raw.mate !== null && raw.mate !== undefined) {
    // "mate 0" means the side to move is already checkmated.
    if (raw.mate === 0) return sign * -10000;
    // Closer mates are worth more. Cap at 10000.
    const magnitude = 10000 - Math.min(99, Math.abs(raw.mate)) * 10;
    return sign * Math.sign(raw.mate) * magnitude;
  }
  if (raw.cp !== null && raw.cp !== undefined) {
    return sign * raw.cp;
  }
  return 0;
}


/**
 * Centipawn loss caused by the move that took the position from `before` to `after`.
 * Both evals are White-perspective centipawns; `mover` is who just moved.
 * Loss is always non-negative.
 */
export function centipawnLoss(
  beforeWhiteCp: number,
  afterWhiteCp: number,
  mover: 'w' | 'b',
): number {
  // From mover's perspective, larger eval = better for them.
  const beforeForMover = mover === 'w' ? beforeWhiteCp : -beforeWhiteCp;
  const afterForMover = mover === 'w' ? afterWhiteCp : -afterWhiteCp;
  // Their eval should ideally stay the same or go up (since they made the move).
  // It typically drops by ~equal amount because side-to-move flips.
  // The "loss" is how much worse they ended up vs. the engine's best line.
  const loss = beforeForMover - afterForMover;
  return Math.max(0, loss);
}

/**
 * Map a centipawn loss to an accuracy score in [0, 100].
 * 0 cpl -> 100, 20 -> ~92, 50 -> ~81, 100 -> ~66, 200 -> ~43, 400 -> ~19, 600+ -> <10.
 */
export function cplToScore(cpl: number): number {
  if (!Number.isFinite(cpl) || cpl <= 0) return 100;
  const raw = 100 * Math.exp(-cpl / 240);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Pretty-print a White-perspective eval for the UI. */
export function formatEval(e: EngineEval): string {
  if (e.mate !== null && e.mate !== undefined) {
    const n = Math.abs(e.mate);
    return e.mate > 0 ? `Mate in ${n}` : `Mated in ${n}`;
  }
  if (e.cp === null || e.cp === undefined) return '—';
  const pawns = e.cp / 100;
  const sign = pawns > 0 ? '+' : '';
  return `${sign}${pawns.toFixed(1)}`;
}
