import { useEffect, useRef, useState, useCallback } from 'react';

// Stockfish 10 (asm.js, no SharedArrayBuffer requirement) loaded from CDN.
const STOCKFISH_URL = 'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js';

type EngineState = 'loading' | 'ready' | 'thinking' | 'error';

let cachedWorkerUrl: string | null = null;

async function getWorkerUrl(): Promise<string> {
  if (cachedWorkerUrl) return cachedWorkerUrl;
  // Fetch the script and wrap as a blob so we can spawn a same-origin Worker.
  const res = await fetch(STOCKFISH_URL);
  if (!res.ok) throw new Error(`Failed to load Stockfish: ${res.status}`);
  const text = await res.text();
  const blob = new Blob([text], { type: 'application/javascript' });
  cachedWorkerUrl = URL.createObjectURL(blob);
  return cachedWorkerUrl;
}

export function useStockfish(elo = 2000) {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<EngineState>('loading');
  const pendingResolve = useRef<((move: string | null) => void) | null>(null);

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
          } else if (line === 'readyok') {
            setState('ready');
          } else if (line.startsWith('bestmove')) {
            const parts = line.split(/\s+/);
            const best = parts[1] && parts[1] !== '(none)' ? parts[1] : null;
            setState('ready');
            const resolve = pendingResolve.current;
            pendingResolve.current = null;
            resolve?.(best);
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
        pendingResolve.current = resolve;
        setState('thinking');
        worker.postMessage('ucinewgame');
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go movetime ${movetimeMs}`);
      });
    },
    [state],
  );

  return { state, getBestMove };
}
