import { describe, it, expect } from 'vitest';
import { cplToScore, centipawnLoss, normalizeEvalToWhite, formatEval } from './engineScore';

describe('cplToScore', () => {
  it('returns 100 for zero loss', () => {
    expect(cplToScore(0)).toBe(100);
  });
  it('is monotonically decreasing', () => {
    const a = cplToScore(20);
    const b = cplToScore(100);
    const c = cplToScore(400);
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
  });
  it('clamps to [0, 100]', () => {
    expect(cplToScore(-50)).toBe(100);
    expect(cplToScore(100000)).toBeGreaterThanOrEqual(0);
    expect(cplToScore(100000)).toBeLessThanOrEqual(100);
  });
});

describe('centipawnLoss', () => {
  it('is zero when white maintains advantage after white moves', () => {
    expect(centipawnLoss(50, 50, 'w')).toBe(0);
  });
  it('penalizes white blundering', () => {
    expect(centipawnLoss(50, -200, 'w')).toBe(250);
  });
  it('penalizes black blundering (sign flipped)', () => {
    // before: -50 (black is better by 0.5), after: +200 (white now better)
    // black moved and made it worse for themselves by 250cp
    expect(centipawnLoss(-50, 200, 'b')).toBe(250);
  });
  it('never negative', () => {
    expect(centipawnLoss(0, 300, 'w')).toBe(0);
  });
});

describe('normalizeEvalToWhite', () => {
  it('keeps white cp as-is', () => {
    expect(normalizeEvalToWhite({ cp: 120, mate: null }, 'w')).toBe(120);
  });
  it('flips black cp', () => {
    expect(normalizeEvalToWhite({ cp: 120, mate: null }, 'b')).toBe(-120);
  });
  it('handles mate for white-to-move', () => {
    expect(normalizeEvalToWhite({ cp: null, mate: 3 }, 'w')).toBeGreaterThan(9000);
  });
  it('handles mate for black-to-move', () => {
    expect(normalizeEvalToWhite({ cp: null, mate: 3 }, 'b')).toBeLessThan(-9000);
  });
});

describe('formatEval', () => {
  it('formats cp with sign and pawns', () => {
    expect(formatEval({ cp: 120, mate: null, bestMove: null })).toBe('+1.2');
    expect(formatEval({ cp: -50, mate: null, bestMove: null })).toBe('-0.5');
  });
  it('formats mate', () => {
    expect(formatEval({ cp: null, mate: 3, bestMove: null })).toBe('Mate in 3');
    expect(formatEval({ cp: null, mate: -2, bestMove: null })).toBe('Mated in 2');
  });
});
