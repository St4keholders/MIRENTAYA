'use client';

import { useEffect, useRef } from 'react';

/** Fondo de estrellas animado (mismo algoritmo del landing de renta). */
export default function Stars() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars: Array<{ x: number; y: number; r: number; a: number; t: number }> = [];
    let w = 0, h = 0, raf: number | null = null;
    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.min(Math.round((w * h) / 12000), 260) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() < 0.88 ? Math.random() * 0.7 + 0.25 : Math.random() * 1.1 + 0.8,
        a: Math.random() * 0.45 + 0.08, t: Math.random() * Math.PI * 2,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const time = performance.now() / 2600;
      for (const s of stars) {
        ctx.globalAlpha = s.a * (REDUCE ? 1 : 0.7 + 0.3 * Math.sin(time + s.t));
        ctx.fillStyle = s.r > 0.9 ? '#BFD4FF' : '#FFFFFF';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    build(); if (REDUCE) draw(); else loop();
    const onR = () => build();
    window.addEventListener('resize', onR, { passive: true });
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', onR); };
  }, []);
  return (
    <>
      <canvas id="stars" ref={ref} aria-hidden="true" />
      <div className="veil" aria-hidden="true" />
    </>
  );
}
