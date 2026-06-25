/**
 * Tiny decorative chess board thumbnail used inside CTA buttons.
 * Pure SVG — no chess engine, no heavy board lib.
 */
export function MiniBoardThumb({ size = 32 }: { size?: number }) {
  const sq = size / 4;
  const light = 'hsl(40, 45%, 85%)';
  const dark = 'hsl(28, 35%, 52%)';
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-sm shrink-0 ring-1 ring-black/20"
      aria-hidden="true"
    >
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 4 }).map((__, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * sq}
            y={r * sq}
            width={sq}
            height={sq}
            fill={(r + c) % 2 === 0 ? light : dark}
          />
        ))
      )}
      {/* A little white queen glyph in center */}
      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        fontSize={size * 0.62}
        fill="#fff"
        stroke="#000"
        strokeWidth={0.5}
        style={{ fontFamily: 'serif' }}
      >
        ♛
      </text>
    </svg>
  );
}
