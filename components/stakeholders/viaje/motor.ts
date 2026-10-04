'use client';

/* ============================================================
   MOTOR DEL VIAJE · escenas fijas controladas por el scroll.
   Cada escena registra update(p, t): p = progreso suavizado 0..1
   dentro de su tramo de scroll, t = tiempo (para movimiento
   continuo, ej. la caída).
   - Si el contenido fijo no cabe en la pantalla, la escena pasa
     a modo libre (flujo normal) y su progreso se calcula al
     entrar en pantalla.
   - "Reducir movimiento": sin fijar, sin suavizado.
   ============================================================ */

import { useEffect, useRef } from 'react';

export interface Escena {
  el: HTMLElement;
  pin: HTMLElement | null;
  update: (p: number, t: number, dt: number) => void;
  continuo: boolean;
  top: number;
  alto: number;
  raw: number;
  p: number;
  visible: boolean;
  libre: boolean;
}

const escenas = new Set<Escena>();
let raf = 0;
let last = 0;
let reduce = false;
let instalado = false;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prefiereQuieto = () => reduce;

function medir() {
  const vh = window.innerHeight;
  for (const e of escenas) {
    // ¿cabe el contenido fijo? si no, flujo normal
    if (e.pin) {
      const libre = reduce || e.pin.scrollHeight > vh + 2;
      if (libre !== e.libre) {
        e.libre = libre;
        e.el.toggleAttribute('data-libre', libre);
      }
    }
    const r = e.el.getBoundingClientRect();
    e.top = r.top + window.scrollY;
    e.alto = r.height;
  }
}

function tick(now: number) {
  const dt = Math.min(64, now - (last || now));
  last = now;
  const y = window.scrollY;
  const vh = window.innerHeight;
  let seguir = false;
  for (const e of escenas) {
    e.visible = y + vh > e.top - 50 && y < e.top + e.alto + 50;
    if (e.libre) {
      // progreso al atravesar la pantalla
      e.raw = clamp01((y + vh - e.top) / Math.max(1, vh * 0.85));
    } else {
      e.raw = clamp01((y - e.top) / Math.max(1, e.alto - vh));
    }
    const k = reduce ? 1 : 1 - Math.pow(1 - 0.16, dt / 16.7);
    const antes = e.p;
    e.p += (e.raw - e.p) * k;
    if (Math.abs(e.raw - e.p) < 0.0004) e.p = e.raw;
    const movio = e.p !== antes;
    if (e.visible && (movio || e.continuo)) e.update(e.p, now / 1000, dt);
    if (movio) seguir = true;
    if (e.visible && e.continuo && !reduce) seguir = true;
  }
  raf = seguir ? requestAnimationFrame(tick) : 0;
}

export function despertar() {
  if (!raf) {
    last = 0;
    raf = requestAnimationFrame(tick);
  }
}

function instalar() {
  if (instalado) return;
  instalado = true;
  reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.addEventListener('scroll', despertar, { passive: true });
  window.addEventListener('resize', () => { medir(); despertar(); }, { passive: true });
  const ro = new ResizeObserver(() => { medir(); despertar(); });
  ro.observe(document.body);
}

/** Registra una escena. `pinSel`: selector del bloque fijo dentro de la escena. */
export function useEscena(
  ref: React.RefObject<HTMLElement | null>,
  update: (p: number, t: number, dt: number) => void,
  opts: { continuo?: boolean; pinSel?: string } = {},
) {
  const upd = useRef(update);
  useEffect(() => { upd.current = update; });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    instalar();
    const e: Escena = {
      el,
      pin: opts.pinSel ? el.querySelector<HTMLElement>(opts.pinSel) : null,
      update: (p, t, dt) => upd.current(p, t, dt),
      continuo: Boolean(opts.continuo),
      top: 0, alto: 0, raw: 0, p: -1, visible: false, libre: false,
    };
    escenas.add(e);
    medir();
    // primer cuadro sin suavizado
    e.p = e.libre ? 0 : clamp01((window.scrollY - e.top) / Math.max(1, e.alto - window.innerHeight));
    e.update(e.p, performance.now() / 1000, 16);
    despertar();
    return () => { escenas.delete(e); };
  }, [ref, opts.continuo, opts.pinSel]);
}

/** Lleva el scroll al punto de la escena donde su progreso vale p (para los puntos del carrusel). */
export function irAProgreso(el: HTMLElement | null, p: number) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const top = r.top + window.scrollY;
  const libre = el.hasAttribute('data-libre');
  const destino = libre ? top : top + p * (r.height - window.innerHeight);
  window.scrollTo({ top: destino + 1, behavior: reduce ? 'auto' : 'smooth' });
}
