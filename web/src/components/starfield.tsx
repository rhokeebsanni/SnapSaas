'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

interface Star {
  x: number;
  y: number;
  r: number;
  /** Base brightness 0..1. */
  base: number;
  /** Twinkle phase + speed. */
  phase: number;
  speed: number;
  /** Parallax depth 0..1 (bigger = closer = drifts faster). */
  depth: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0..1, counts down
  len: number;
  /** A "dying star" flares brighter and fades in place rather than streaking. */
  dying: boolean;
}

/**
 * A lightweight animated starfield painted on a fixed full-screen canvas. Stars
 * twinkle and drift with subtle parallax; every few seconds a shooting star
 * streaks across, or a "dying star" flares and fades. Renders only in dark mode
 * and fully disables itself under `prefers-reduced-motion`.
 */
export function Starfield() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const { resolvedTheme } = useTheme();
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Non-null aliases so the closures below don't re-widen these to nullable.
    const c: CanvasRenderingContext2D = ctx;
    const cv: HTMLCanvasElement = canvas;

    const dark = resolvedTheme === 'dark';

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars: Star[] = [];

    function seed() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      cv.width = Math.floor(width * dpr);
      cv.height = Math.floor(height * dpr);
      cv.style.width = `${width}px`;
      cv.style.height = `${height}px`;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density scales with screen area but is capped for performance.
      const count = Math.min(260, Math.floor((width * height) / 6500));
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.4 + depth * 1.3,
          base: 0.25 + Math.random() * 0.75,
          phase: Math.random() * Math.PI * 2,
          speed: 0.6 + Math.random() * 1.4,
          depth,
        };
      });
    }

    seed();

    let shooters: ShootingStar[] = [];
    let nextShooter = performance.now() + 1400 + Math.random() * 2600;
    let raf = 0;
    let last = performance.now();

    function spawnShooter(now: number) {
      const dying = Math.random() < 0.4;
      if (dying) {
        // A dying star: flares in place somewhere in the upper field.
        shooters.push({
          x: width * (0.15 + Math.random() * 0.7),
          y: height * (0.1 + Math.random() * 0.5),
          vx: 0,
          vy: 0,
          life: 1,
          len: 0,
          dying: true,
        });
      } else {
        // A shooting star: streaks diagonally across the sky.
        const fromLeft = Math.random() < 0.5;
        const angle = (Math.PI / 7) * (0.6 + Math.random() * 0.8);
        const speed = 9 + Math.random() * 7;
        shooters.push({
          x: fromLeft ? -40 : width + 40,
          y: Math.random() * height * 0.5,
          vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          len: 90 + Math.random() * 80,
          dying: false,
        });
      }
      nextShooter = now + 2200 + Math.random() * 4200;
    }

    function frame(now: number) {
      const dt = Math.min(50, now - last) / 16.67; // ~frames elapsed
      last = now;
      c.clearRect(0, 0, width, height);

      // Twinkling, slowly drifting stars.
      for (const s of stars) {
        s.phase += s.speed * 0.015 * dt;
        // Gentle left/up parallax drift; wrap around the edges.
        s.x -= s.depth * 0.06 * dt;
        if (s.x < -2) s.x = width + 2;
        const twinkle = 0.55 + 0.45 * Math.sin(s.phase);
        const alpha = s.base * twinkle;
        c.beginPath();
        c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        c.fillStyle = `rgba(214, 222, 255, ${alpha.toFixed(3)})`;
        c.fill();
        // Brighter stars get a soft halo.
        if (s.r > 1.2 && twinkle > 0.85) {
          c.beginPath();
          c.arc(s.x, s.y, s.r * 2.6, 0, Math.PI * 2);
          c.fillStyle = `rgba(170, 190, 255, ${(alpha * 0.12).toFixed(3)})`;
          c.fill();
        }
      }

      if (now >= nextShooter) spawnShooter(now);

      shooters = shooters.filter((sh) => {
        if (sh.dying) {
          sh.life -= 0.012 * dt;
          const flare = Math.sin((1 - sh.life) * Math.PI); // up then down
          const r = 1 + flare * 3.5;
          const a = Math.max(0, flare);
          const grad = c.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, r * 6);
          grad.addColorStop(0, `rgba(255, 240, 220, ${(a * 0.9).toFixed(3)})`);
          grad.addColorStop(0.3, `rgba(255, 200, 160, ${(a * 0.5).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(255, 180, 140, 0)');
          c.beginPath();
          c.arc(sh.x, sh.y, r * 6, 0, Math.PI * 2);
          c.fillStyle = grad;
          c.fill();
          return sh.life > 0;
        }

        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.life -= 0.01 * dt;
        const tailX = sh.x - (sh.vx / Math.hypot(sh.vx, sh.vy)) * sh.len;
        const tailY = sh.y - (sh.vy / Math.hypot(sh.vx, sh.vy)) * sh.len;
        const grad = c.createLinearGradient(sh.x, sh.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${(sh.life * 0.9).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(150, 180, 255, 0)');
        c.strokeStyle = grad;
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(sh.x, sh.y);
        c.lineTo(tailX, tailY);
        c.stroke();
        return sh.life > 0 && sh.x > -80 && sh.x < width + 80 && sh.y < height + 80;
      });

      raf = requestAnimationFrame(frame);
    }

    function onResize() {
      seed();
    }
    window.addEventListener('resize', onResize);

    if (dark && !reducedMotion) {
      raf = requestAnimationFrame(frame);
    } else if (dark) {
      // Reduced motion: paint a single static field, no animation loop.
      c.clearRect(0, 0, width, height);
      for (const s of stars) {
        c.beginPath();
        c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        c.fillStyle = `rgba(214, 222, 255, ${(s.base * 0.7).toFixed(3)})`;
        c.fill();
      }
    } else {
      c.clearRect(0, 0, width, height);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [resolvedTheme, reducedMotion]);

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />;
}
