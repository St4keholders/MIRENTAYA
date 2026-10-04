'use client';

/* ============================================================
   ESCENAS 1 + 2 · el lead cae al vacío y Cosmo lo rescata.
   El logo SH se arma, se abre como portal, sale la nave y lo
   atrapa con el rayo. Luego la nave sigue el viaje.
   ============================================================ */

import { useEffect, useRef, type ReactNode } from 'react';
import { Lead, Maletin, Factura } from './Lead';
import { Nave, PortalSH, portalProgreso } from './Nave';
import { useEscena, seg, easeOut, easeInOut, lerp, prefiereQuieto } from './motor';

const PAPELES = [
  { x: 18, d: 0.0, s: 0.9, r: 40, v: 1.0, tipo: 'f' },
  { x: 78, d: 0.35, s: 0.8, r: -30, v: 1.25, tipo: 'f1' },
  { x: 32, d: 0.6, s: 0.7, r: 70, v: 0.9, tipo: 'f' },
  { x: 86, d: 0.15, s: 1.0, r: -60, v: 1.1, tipo: 'm' },
  { x: 8, d: 0.8, s: 0.6, r: 20, v: 1.35, tipo: 'f1' },
  { x: 62, d: 0.5, s: 0.65, r: -80, v: 1.05, tipo: 'f' },
];

/* líneas de velocidad por canvas (fuera de React: se mutan en cada cuadro) */
type Linea = { x: number; y: number; l: number; a: number };
const LINEAS = new WeakMap<HTMLCanvasElement, Linea[]>();

export function EscenaCaida({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const lineasRef = useRef<HTMLCanvasElement>(null);

  // líneas de velocidad (canvas)
  useEffect(() => {
    const cv = lineasRef.current;
    if (!cv) return;
    const resize = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = r.width * dpr; cv.height = r.height * dpr;
      cv.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = window.innerWidth < 760 ? 26 : 46;
      LINEAS.set(cv, Array.from({ length: n }, () => ({
        x: Math.random() * r.width, y: Math.random() * r.height, l: 20 + Math.random() * 70, a: 0.1 + Math.random() * 0.35,
      })));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEscena(ref, (p, t, dt) => {
    const root = ref.current;
    if (!root) return;
    const quieto = prefiereQuieto();
    const stage = root.querySelector<HTMLElement>('.vj-caida__stage');
    if (!stage) return;
    const W = stage.offsetWidth, H = stage.offsetHeight;
    const movil = window.innerWidth < 900;

    // ── momentos de la historia
    const portalV = p < 0.42 ? seg(p, 0.05, 0.42) * 0.6 : 0.6 + seg(p, 0.42, 0.55) * 0.4;
    const cierra = seg(p, 0.86, 0.98); // el portal se apaga detrás de la nave
    const sale = easeOut(seg(p, 0.5, 0.64));          // la nave sale del portal
    const rayo = seg(p, 0.62, 0.66) * (1 - seg(p, 0.83, 0.87));
    const atrapa = easeInOut(seg(p, 0.66, 0.8));      // el lead sube al rayo
    const aBordo = seg(p, 0.77, 0.82);
    const parte = seg(p, 0.86, 1);                    // la nave sigue el viaje
    const velocidad = quieto ? 0 : 1 - atrapa * 0.88;

    // posiciones (en px del escenario)
    const pX = W * (movil ? 0.7 : 0.6), pY = H * (movil ? 0.57 : 0.3);
    const hX = W * (movil ? 0.5 : 0.46), hY = H * (movil ? 0.65 : 0.34);
    const lX = W * (movil ? 0.5 : 0.46), lY = H * (movil ? 0.84 : 0.7);

    // ── portal
    const portal = root.querySelector<HTMLElement>('.vj-portal');
    portalProgreso(portal, portalV);
    if (portal) {
      portal.style.opacity = String(Math.min(1, portalV * 6) * (1 - cierra));
      portal.style.transform = `translate3d(${pX}px,${pY}px,0) translate(-50%,-50%) scale(${1 - cierra * 0.6})`;
    }

    // ── nave
    const nave = root.querySelector<HTMLElement>('.vj-nave-rescate');
    if (nave) {
      const nx = lerp(pX, hX, sale) + parte * W * 1.1;
      const ny = lerp(pY, hY, sale) - parte * H * 0.25 + Math.sin(t * 2.4) * 5 * sale;
      const sc = lerp(0.06, 1, sale);
      nave.style.opacity = String(seg(p, 0.5, 0.53));
      nave.style.transform = `translate3d(${nx}px,${ny}px,0) translate(-50%,-50%) scale(${sc}) rotate(${-parte * 10 + (1 - sale) * 25}deg)`;
      const r = nave.querySelector<SVGElement>('.nv-rayo');
      if (r) r.style.opacity = String(rayo);
      const trip = nave.querySelector<SVGElement>('.nv-tripulante');
      if (trip) trip.style.opacity = String(aBordo);
    }

    // ── lead cayendo
    const lead = root.querySelector<HTMLElement>('.vj-lead-cae');
    if (lead) {
      const giro = quieto ? -8 : (t * 62) % 360;
      const ang = lerp(giro > 180 ? giro - 360 : giro, 0, atrapa);
      const sway = quieto ? 0 : Math.sin(t * 1.7) * W * 0.03 * (1 - atrapa);
      const y = lerp(lY, hY + H * 0.03, atrapa);
      lead.style.transform = `translate3d(${lX + sway}px,${y}px,0) translate(-50%,-50%) rotate(${ang}deg) scale(${lerp(1, 0.3, atrapa)})`;
      lead.style.opacity = String(1 - seg(p, 0.76, 0.8));
    }

    // ── papeles y maletín que se alejan (el lead "cae", ellos suben)
    root.querySelectorAll<HTMLElement>('.vj-papel').forEach((el, i) => {
      const c = PAPELES[i];
      const ciclo = ((t * 0.16 * c.v * (0.35 + velocidad) + c.d) % 1 + 1) % 1;
      const yy = H * (1.15 - ciclo * 1.35);
      el.style.transform = `translate3d(${(c.x / 100) * W}px,${yy}px,0) rotate(${c.r + t * 40 * c.v}deg) scale(${c.s})`;
      el.style.opacity = String((1 - seg(p, 0.82, 0.95)) * 0.9);
    });

    // ── líneas de velocidad
    const cv = lineasRef.current;
    const ctx = cv?.getContext('2d');
    if (cv && ctx) {
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      for (const ln of LINEAS.get(cv) ?? []) {
        ln.y -= (dt / 16.7) * (2 + ln.l * 0.18) * (0.15 + velocidad * 1.6);
        if (ln.y + ln.l < 0) { ln.y = H + Math.random() * 40; ln.x = Math.random() * W; }
        ctx.strokeStyle = `rgba(191,212,255,${ln.a * (0.25 + velocidad * 0.75)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(ln.x, ln.y); ctx.lineTo(ln.x, ln.y + ln.l * (0.4 + velocidad)); ctx.stroke();
      }
    }

    // ── narración
    root.querySelector('.vj-b1')?.classList.toggle('vj-burbuja--on', p > 0.08 && p < 0.5);
    root.querySelector('.vj-b2')?.classList.toggle('vj-burbuja--on', p > 0.74 && p < 0.93);
    const b1 = root.querySelector<HTMLElement>('.vj-b1');
    if (b1) b1.style.transform = `translate3d(${pX}px,${pY - Math.min(W, H) * (movil ? 0.2 : 0.17)}px,0) translate(-50%,-100%)`;
    const b2 = root.querySelector<HTMLElement>('.vj-b2');
    if (b2) b2.style.transform = `translate3d(${hX}px,${hY - (movil ? 70 : 105)}px,0) translate(-50%,-100%)`;
  }, { continuo: true, pinSel: '.vj-pin' });

  return (
    <section ref={ref} className="vj-escena vj-caida" id="inicio">
      <div className="vj-pin">
        <div className="vj-caida__copy">{children}</div>
        <div className="vj-caida__stage" aria-hidden="true">
          <div className="vj-fondo-caida">
            <canvas ref={lineasRef} className="vj-lineas" />
            {PAPELES.map((c, i) => (
              <div key={i} className="vj-papel">
                <svg viewBox="-4 -4 72 64" width={c.tipo === 'm' ? 70 : 46}>
                  {c.tipo === 'm' ? <Maletin /> : <Factura tono={c.tipo === 'f1' ? 1 : 0} />}
                </svg>
              </div>
            ))}
          </div>
          <div className="vj-portal"><PortalSH /></div>
          <div className="vj-lead-cae">
            <svg viewBox="0 -40 200 360" overflow="visible"><Lead animo="terror" brazos="agitando" despeinado /></svg>
          </div>
          <div className="vj-nave-rescate">
            <Nave id="rescate" pose="saludo" animo="miedo" brazos="agarrado" rayo />
          </div>
          <div className="vj-burbuja vj-burbuja--abs vj-b1"><span>¡Aguanta, ya voy por ti!</span></div>
          <div className="vj-burbuja vj-burbuja--abs vj-b2"><span>Te tengo. Conmigo no vuelves a caer.</span></div>
        </div>
      </div>
    </section>
  );
}
