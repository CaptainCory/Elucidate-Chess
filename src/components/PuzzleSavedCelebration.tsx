import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; life: number;
  rotation: number; rotationSpeed: number; shape: 'square' | 'circle';
}

const PIECES = ['♚', '♛', '♜', '♝', '♞', '♟'];

export function PuzzleSavedCelebration({ onDone }: { onDone?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const colors = [
      'hsl(42, 92%, 55%)',
      'hsl(38, 90%, 60%)',
      'hsl(48, 95%, 65%)',
      'hsl(30, 85%, 50%)',
      'hsl(350, 70%, 55%)',
      'hsl(160, 60%, 45%)',
    ];

    const particles: Particle[] = [];
    // Burst from two side cannons
    const burst = (originX: number, dir: number) => {
      for (let i = 0; i < 70; i++) {
        const angle = (-Math.PI / 2) + (Math.random() - 0.5) * 0.9 + dir * 0.4;
        const speed = 8 + Math.random() * 8;
        particles.push({
          x: originX,
          y: h,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 6,
          life: 1,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.4,
          shape: Math.random() > 0.5 ? 'square' : 'circle',
        });
      }
    };
    burst(w * 0.15, 1);
    burst(w * 0.85, -1);

    let raf: number;
    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.vx *= 0.995;
        p.life -= 0.008;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        if (p.shape === 'square') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const timer = setTimeout(() => onDone?.(), 1600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Floating chess pieces rising up */}
      {PIECES.map((piece, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl"
          style={{
            left: `${15 + i * 12}%`,
            color: i % 2 === 0 ? 'hsl(42, 92%, 55%)' : 'hsl(var(--primary))',
            textShadow: '0 4px 12px hsl(0 0% 0% / 0.3)',
          }}
          initial={{ y: '100vh', opacity: 0, rotate: -20 }}
          animate={{ y: '-20vh', opacity: [0, 1, 1, 0], rotate: 20 }}
          transition={{
            duration: 1.8,
            delay: i * 0.08,
            ease: 'easeOut',
          }}
        >
          {piece}
        </motion.div>
      ))}

      {/* Center medallion */}
      <motion.div
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{ scale: [0, 1.15, 1], rotate: 0, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative flex flex-col items-center gap-3"
      >
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full blur-2xl"
            style={{ background: 'hsl(42 92% 55% / 0.6)' }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(42 92% 55%), hsl(30 85% 50%))',
              boxShadow: '0 12px 40px hsl(42 92% 55% / 0.5), inset 0 2px 8px hsl(48 95% 75% / 0.6)',
            }}
          >
            <Crown className="w-12 h-12 text-white" strokeWidth={2.2} />
          </div>
        </div>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="px-6 py-2 rounded-full bg-card/95 backdrop-blur-sm border border-primary/30 shadow-2xl"
        >
          <p className="font-display font-bold text-lg text-foreground whitespace-nowrap">
            Position Saved! ♟️
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
