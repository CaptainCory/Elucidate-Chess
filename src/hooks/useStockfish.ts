import { useEffect, useRef, useState, useCallback } from 'react';

// Stockfish 10 (asm.js, no SharedArrayBuffer requirement) loaded from CDN.
const STOCKFISH_URL = 'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js';

type EngineState = 'loading' | 'ready' | 'thinking' | 'error';

export interface RawEval {
  cp: number | null;
  mate: number | null;
  bestMove: string | null;
}

let cachedWorkerUrl: string | null = null;

async function getWorkerUrl(): Promise<string> {
  if (cachedWorkerUrl) return cachedWorkerUrl;
  const res = await fetch(STOCKFISH_URL);
  if (!res.ok) throw new Error(`Failed to load Stockfish: ${res.status}`);
  const text = await res.text();
  const blob = new Blob([text], { type: 'application/javascript' });
  cachedWorkerUrl = URL.createObjectURL(blob);
  return cachedWorkerUrl;
}

type PendingBest = ((move: string | null) => void) | null;
type PendingEval = ((res: RawEval) => void) | null;

export function useStockfish(elo = 2000) {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<EngineState>('loading');
  const pendingBestRef = useRef<PendingBest>(null);
  const pendingEvalRef = useRef<PendingEval>(null);
  // Accumulator for the deepest "info" line seen during current eval
  const evalAccumRef = useRef<{ cp: number | null; mate: number | null; depth: number }>({
    cp: null,
    mate: null,
    depth: -1,
  });

  useEffect(() => {
    let cancelled = false;
    let worker: Worker | null = null;

    (async () => {
      try {
        const url = await getWorkerUrl();
        if (cancelled) return;
        worker = new Worker(url);
        workerRef.current = worker;

        worker.onmessage = (e: MessageEvent<string>) => {
          const line = typeof e.data === 'string' ? e.data : '';
          if (!line) return;

          if (line === 'uciok') {
            worker?.postMessage('setoption name UCI_LimitStrength value true');
            worker?.postMessage(`setoption name UCI_Elo value ${Math.max(1320, Math.min(3190, elo))}`);
            worker?.postMessage('isready');
            return;
          }
          if (line === 'readyok') {
            setState('ready');
            return;
          }
          if (line.startsWith('info')) {
            // Parse score from info lines while evaluating
            if (!pendingEvalRef.current) return;
            const depthMatch = line.match(/\bdepth (\d+)/);
            const scoreCpMatch = line.match(/score cp (-?\d+)/);
            const scoreMateMatch = line.match(/score mate (-?\d+)/);
            const depth = depthMatch ? parseInt(depthMatch[1], 10) : -1;
            if (depth >= evalAccumRef.current.depth) {
              if (scoreMateMatch) {
                evalAccumRef.current = {
                  cp: null,
                  mate: parseInt(scoreMateMatch[1], 10),
                  depth,
                };
              } else if (scoreCpMatch) {
                evalAccumRef.current = {
                  cp: parseInt(scoreCpMatch[1], 10),
                  mate: null,
                  depth,
                };
              }
            }
            return;
          }
          if (line.startsWith('bestmove')) {
            const parts = line.split(/\s+/);
            const best = parts[1] && parts[1] !== '(none)' ? parts[1] : null;
            setState('ready');

            if (pendingEvalRef.current) {
              const resolve = pendingEvalRef.current;
              pendingEvalRef.current = null;
              const acc = evalAccumRef.current;
              evalAccumRef.current = { cp: null, mate: null, depth: -1 };
              resolve({ cp: acc.cp, mate: acc.mate, bestMove: best });
              return;
            }
            if (pendingBestRef.current) {
              const resolve = pendingBestRef.current;
              pendingBestRef.current = null;
              resolve(best);
            }
          }
        };

        worker.onerror = () => {
          setState('error');
        };

        worker.postMessage('uci');
      } catch {
        if (!cancelled) setState('error');
      }
    })();

    return () => {
      cancelled = true;
      try { worker?.postMessage('quit'); } catch {}
      try { worker?.terminate(); } catch {}
      workerRef.current = null;
    };
  }, [elo]);

  const getBestMove = useCallback(
    (fen: string, movetimeMs = 800): Promise<string | null> => {
      return new Promise((resolve) => {
        const worker = workerRef.current;
        if (!worker || state === 'error') {
          resolve(null);
          return;
        }
        pendingBestRef.current = resolve;
        setState('thinking');
        worker.postMessage('ucinewgame');
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go movetime ${movetimeMs}`);
      });
    },
    [state],
  );

  /**
   * Evaluate a position. Returns the deepest score seen plus the engine's best move.
   * Score is relative to side-to-move (UCI convention).
   */
  const getEvaluation = useCallback(
    (fen: string, depth = 14, timeoutMs = 6000): Promise<RawEval> => {
      return new Promise((resolve) => {
        const worker = workerRef.current;
        if (!worker || state === 'error') {
          resolve({ cp: null, mate: null, bestMove: null });
          return;
        }
        evalAccumRef.current = { cp: null, mate: null, depth: -1 };
        let settled = false;
        const safeResolve = (v: RawEval) => {
          if (settled) return;
          settled = true;
          pendingEvalRef.current = null;
          resolve(v);
        };
        pendingEvalRef.current = (v) => safeResolve(v);
        setState('thinking');
        worker.postMessage('ucinewgame');
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);

        setTimeout(() => {
          if (!settled) {
            try { worker.postMessage('stop'); } catch {}
            // Allow a short grace for bestmove; if still nothing, resolve with what we have.
            setTimeout(() => {
              const acc = evalAccumRef.current;
              safeResolve({ cp: acc.cp, mate: acc.mate, bestMove: null });
            }, 300);
          }
        }, timeoutMs);
      });
    },
    [state],
  );

  return { state, getBestMove, getEvaluation };
}
