'use client';

/* ============================================================
   ESPACIO EN MOVIMIENTO · el fondo del mapa nunca se detiene:
   tres capas de estrellas que fluyen a distintas velocidades,
   polvo cósmico cercano, nebulosas que se desplazan, cometas y
   planetas lejanos. `impulso` acelera el flujo mientras Cosmo
   viaja (sensación de avance).
   ============================================================ */

import { useEffect, useRef } from 'react';
import { Planeta } from '../viaje/Planeta';

type Punto = { x: number; y: number; r: number; a: number; t: number; capa: number };

export function Espacio({ impulso = 0 }: { impulso?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const imp = useRef(impulso);
  useEffect(() => { imp.current = impulso; }, [impulso]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, puntos: Punto[] = [], raf = 0, last = performance.now(), vel = 0;
    const crear = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(340, Math.round((W * H) / 5200));
      puntos = Array.from({ length: n }, (_, i) => {
        const capa = i % 10 < 6 ? 0 : i % 10 < 9 ? 1 : 2; // lejos, medio, polvo cercano
        return {
          x: Math.random() * W, y: Math.random() * H,
          r: capa === 0 ? 0.3 + Math.random() * 0.6 : capa === 1 ? 0.6 + Math.random() * 0.9 : 1.2 + Math.random() * 1.6,
          a: capa === 2 ? 0.12 + Math.random() * 0.2 : 0.25 + Math.random() * 0.6,
          t: Math.random() * Math.PI * 2, capa,
        };
      });
    };
    const VEL = [0.006, 0.016, 0.045]; // px por ms, por capa
    const frame = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      vel += ((1 + imp.current * 7) - vel) * (imp.current ? 0.06 : 0.12);
      ctx.clearRect(0, 0, W, H);
      for (const p of puntos) {
        const v = reduce ? 0 : VEL[p.capa] * vel * dt;
        p.x -= v; p.y += v * 0.32;
        if (p.x < -6) { p.x = W + 6; p.y = Math.random() * H; }
        if (p.y > H + 6) { p.y = -6; p.x = Math.random() * W; }
        const tw = p.capa === 2 ? 1 : 0.65 + 0.35 * Math.sin(now / 900 + p.t);
        ctx.globalAlpha = p.a * tw;
        if (vel > 2.2 && p.capa > 0) {
          // en viaje, las estrellas cercanas dejan estela
          ctx.strokeStyle = p.capa === 2 ? '#BFD4FF' : '#fff';
          ctx.lineWidth = p.r;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + v * 7, p.y - v * 2.2); ctx.stroke();
        } else {
          ctx.fillStyle = p.capa === 2 ? '#BFD4FF' : '#fff';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    crear();
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', crear);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', crear); };
  }, []);

  return (
    <div className="mp-espacio" aria-hidden="true">
      <div className="mp-nebulosa mp-nebulosa--a" />
      <div className="mp-nebulosa mp-nebulosa--b" />
      <div className="mp-nebulosa mp-nebulosa--c" />
      <div className="mp-lejano mp-lejano--a"><Planeta v="hogar" giro={180} inclinacion={-18} /></div>
      <div className="mp-lejano mp-lejano--b"><Planeta v="anillo" anillo giro={90} /></div>
      <div className="mp-lejano mp-lejano--c"><Planeta v="oro" giro={70} /></div>
      <canvas ref={ref} className="mp-flujo" />
      <span className="mp-cometa mp-cometa--a" />
      <span className="mp-cometa mp-cometa--b" />
    </div>
  );
}
