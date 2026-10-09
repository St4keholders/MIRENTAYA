'use client';

/* ============================================================
   INICIO · estación orbital de Stakeholders
   Las cuatro sedes cuelgan de un anillo que gira lento alrededor
   del núcleo. Profundidad en falso 3D: las de atrás se ven más
   pequeñas y oscuras. Al hacer clic en una sede, el anillo la
   trae al frente, la cámara se acerca, la nave de Cosmo sale
   del núcleo, se acopla en su plataforma y la página cambia.
   ============================================================ */

import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Stars from '../Stars';
import { Nave } from '../viaje/Nave';
import { Planeta } from '../viaje/Planeta';
import { Sede, type SedeId } from './Sedes';
import { Nucleo } from './Nucleo';
import { Constelacion } from './Constelacion';
import '@/app/stakeholders.css';
import '@/app/servicios.css';
import '@/components/stakeholders/viaje/planeta.css';
import '@/components/stakeholders/viaje/viaje.css';
import './inicio.css';

const SEDES: Array<{ id: SedeId; href: string; t: string; d: string; pad: [number, number] }> = [
  { id: 'contabilidad', href: '/contabilidad', t: 'SERVICIO DE CONTABILIDAD', d: 'Libros, impuestos y estados financieros de tu empresa.', pad: [82, 60] },
  { id: 'nomina', href: '/nomina', t: 'SERVICIO DE NÓMINA', d: 'Liquidación, nómina electrónica y seguridad social de tu equipo.', pad: [6.3, 64.3] },
  { id: 'renta', href: '/renta', t: 'RENTA PERSONA NATURAL', d: 'Descubre si debes declarar y hasta cuándo tienes plazo.', pad: [83, 68.7] },
  { id: 'personalizado', href: '/personalizado', t: 'SERVICIO PERSONALIZADO', d: 'Trámites y casos puntuales, revisados por un contador.', pad: [9.6, 72.2] },
];

const TITULO = 'Un área contable completa, fuera de tu oficina';
const N = SEDES.length;
const PASO = (Math.PI * 2) / N;
const TAU = Math.PI * 2;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Ángulo del anillo que deja la sede i al frente, por el camino más corto */
const anguloFrente = (i: number, actual: number) => {
  const base = -i * PASO;
  const k = Math.round((actual - base) / TAU);
  return base + k * TAU;
};

export default function Inicio() {
  const router = useRouter();
  const [in_, setIn] = useState(false);
  const [modo, setModo] = useState<'espera' | 'tour' | 'vuelo'>('espera');
  const [frente, setFrente] = useState(0);
  const [destino, setDestino] = useState<SedeId | null>(null);
  const [aterriza, setAterriza] = useState(false);

  const escenaRef = useRef<HTMLDivElement>(null);
  const naveRef = useRef<HTMLDivElement>(null);
  const nucleoRef = useRef<HTMLDivElement>(null);
  const atrasRef = useRef<SVGSVGElement>(null);
  const delanteRef = useRef<SVGSVGElement>(null);
  const sedesRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const lanzaderasRef = useRef<Array<HTMLDivElement | null>>([]);
  const ctl = useRef({
    phi: Math.PI / 4, giro: null as null | { de: number; a: number; t0: number; dur: number; fin?: () => void },
    pausa: false, ocupado: false, frente: -1,
    geo: { W: 0, H: 0, cx: 0, cy: 0, R: 0, ry: 0, bw: 0, nave: 0 },
    timers: [] as number[],
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* ── motor de la estación ── */
  useEffect(() => {
    const C = ctl.current;
    const escena = escenaRef.current;
    if (!escena) return;
    const reduce = quieto();

    const medir = () => {
      const W = escena.offsetWidth, H = escena.offsetHeight;
      const movil = W < 700;
      const R = movil ? W * 0.34 : Math.min(W * 0.33, 500);
      const ry = R * (movil ? 0.5 : 0.27);
      const bw = movil ? Math.min(112, W * 0.29) : Math.max(160, Math.min(240, W * 0.165));
      C.geo = { W, H, cx: W / 2, cy: H * (movil ? 0.5 : 0.6), R, ry, bw, nave: movil ? 76 : 120 };
      escena.style.setProperty('--bw', `${bw}px`);
      escena.style.setProperty('--oy', `${C.geo.cy + ry}px`);
      const nuc = nucleoRef.current;
      if (nuc) {
        const nw = R * (movil ? 0.5 : 0.36);
        nuc.style.width = `${nw}px`;
        // el collar (50%, 75.3%) queda en el centro del anillo
        nuc.style.transform = `translate(${C.geo.cx - nw / 2}px, ${C.geo.cy - nw * 1.5 * 0.753}px)`;
      }
      const naveEl = naveRef.current;
      if (naveEl) naveEl.style.width = `${C.geo.nave}px`;
      for (const svg of [atrasRef.current, delanteRef.current]) svg?.setAttribute('viewBox', `0 0 ${W} ${H}`);
    };

    const elipse = (lado: 'atras' | 'delante') => {
      const { cx, cy, R, ry } = C.geo;
      return lado === 'atras'
        ? `M${cx - R},${cy} A${R},${ry} 0 0 1 ${cx + R},${cy}`
        : `M${cx + R},${cy} A${R},${ry} 0 0 1 ${cx - R},${cy}`;
    };

    const posNaveReposo = () => {
      const { cx, cy, R, nave } = C.geo;
      const nw = R * (C.geo.W < 700 ? 0.5 : 0.36);
      const topNucleo = cy - nw * 1.5 * 0.753;
      // Cosmo espera junto a la cúpula del núcleo (en celular, arriba a la izquierda)
      if (C.geo.W < 700) return { x: 14, y: 4, s: 1 };
      return { x: cx + nw * 0.34, y: topNucleo + nw * 0.12 - nave * 0.6, s: 1 };
    };

    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      const { cx, cy, R, ry, bw } = C.geo;

      // giro: animado hacia una sede o lento en reposo
      if (C.giro) {
        if (C.giro.t0 < 0) C.giro.t0 = now;
        const t = Math.min(1, (now - C.giro.t0) / C.giro.dur);
        C.phi = C.giro.de + (C.giro.a - C.giro.de) * easeInOut(t);
        if (t >= 1) { const fin = C.giro.fin; C.giro = null; fin?.(); }
      } else if (!C.pausa && !reduce && !C.ocupado) {
        C.phi -= (TAU / 110000) * dt;
      }

      // sedes en el anillo
      let mejor = 0, dMax = -2;
      SEDES.forEach((_, i) => {
        const el = sedesRef.current[i];
        if (!el) return;
        const th = C.phi + i * PASO;
        const d = Math.cos(th);
        const x = cx + R * Math.sin(th);
        const y = cy + ry * d;
        const s = 0.6 + 0.4 * ((d + 1) / 2);
        const h = bw * (230 / 240);
        el.style.transform = `translate3d(${x - bw / 2}px, ${y - h * 0.92}px, 0) scale(${s.toFixed(3)})`;
        el.style.zIndex = String(d > 0.02 ? 22 + Math.round(d * 8) : 12 + Math.round((d + 1) * 3.5));
        el.style.setProperty('--inv', (1 / Math.pow(s, 0.75)).toFixed(3));
        const luz = (0.5 + 0.5 * ((d + 1) / 2)).toFixed(2);
        if (el.dataset.luz !== luz) { el.dataset.luz = luz; el.style.setProperty('--luz', luz); }
        if (d > dMax) { dMax = d; mejor = i; }
      });
      if (mejor !== C.frente) { C.frente = mejor; setFrente(mejor); }

      // anillo: luces que corren con el giro, y brazos hacia cada sede
      const off = String((-C.phi * R).toFixed(1));
      atrasRef.current?.querySelectorAll<SVGPathElement>('.ini3-anillo__luces').forEach((p) => p.setAttribute('stroke-dashoffset', off));
      delanteRef.current?.querySelectorAll<SVGPathElement>('.ini3-anillo__luces').forEach((p) => p.setAttribute('stroke-dashoffset', off));
      const brazos = atrasRef.current?.querySelectorAll<SVGLineElement>('.ini3-brazo');
      brazos?.forEach((b, i) => {
        const th = C.phi + i * PASO + PASO / 2;
        b.setAttribute('x1', String(cx)); b.setAttribute('y1', String(cy));
        b.setAttribute('x2', (cx + R * Math.sin(th)).toFixed(1)); b.setAttribute('y2', (cy + ry * Math.cos(th)).toFixed(1));
      });

      // lanzaderas que dan la vuelta al anillo más rápido
      lanzaderasRef.current.forEach((el, k) => {
        if (!el) return;
        const th = (reduce ? 0 : now / (k ? 9000 : 13000)) * (k ? -TAU : TAU) + k * 2;
        const d = Math.cos(th);
        const x = cx + R * 1.08 * Math.sin(th);
        const y = cy + ry * 1.08 * d - 26;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${(0.55 + 0.45 * ((d + 1) / 2)).toFixed(3)}) scaleX(${Math.cos(th) * (k ? -1 : 1) > 0 ? 1 : -1})`;
        el.style.zIndex = String(d > 0 ? 31 : 6);
        el.style.opacity = String(0.55 + 0.45 * ((d + 1) / 2));
      });

      // la nave de Cosmo espera sobre el núcleo
      const nave = naveRef.current;
      if (nave) {
        const p = posNaveReposo();
        nave.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      }
      raf = requestAnimationFrame(frame);
    };

    medir();
    // trazos del anillo
    for (const [svg, lado] of [[atrasRef.current, 'atras'], [delanteRef.current, 'delante']] as const) {
      svg?.querySelectorAll<SVGPathElement>('path[data-arco]').forEach((p) => p.setAttribute('d', elipse(lado)));
    }
    raf = requestAnimationFrame(frame);
    const alCambiar = () => {
      medir();
      for (const [svg, lado] of [[atrasRef.current, 'atras'], [delanteRef.current, 'delante']] as const) {
        svg?.querySelectorAll<SVGPathElement>('path[data-arco]').forEach((p) => p.setAttribute('d', elipse(lado)));
      }
    };
    window.addEventListener('resize', alCambiar);

    // paralaje con el mouse
    const alMover = (e: PointerEvent) => {
      if (reduce || e.pointerType !== 'mouse') return;
      const mx = (e.clientX / window.innerWidth) * 2 - 1;
      const my = (e.clientY / window.innerHeight) * 2 - 1;
      document.documentElement.style.setProperty('--mx', mx.toFixed(3));
      document.documentElement.style.setProperty('--my', my.toFixed(3));
    };
    window.addEventListener('pointermove', alMover);
    const timers = C.timers;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', alCambiar);
      window.removeEventListener('pointermove', alMover);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const despues = (ms: number, fn: () => void) => { ctl.current.timers.push(window.setTimeout(fn, ms)); };

  const girarA = (i: number, dur: number, fin?: () => void) => {
    const C = ctl.current;
    const a = anguloFrente(i, C.phi);
    C.giro = { de: C.phi, a, t0: -1, dur: Math.abs(a - C.phi) < 0.01 ? 1 : dur, fin }; // t0 lo fija el motor
  };

  /** Clic en una sede: al frente, acercamiento, Cosmo se acopla y entramos */
  const entrar = (i: number) => {
    const C = ctl.current;
    if (C.ocupado) return;
    const s = SEDES[i];
    if (quieto()) { router.push(s.href); return; }
    C.ocupado = true;
    setModo('vuelo');
    setDestino(s.id);
    girarA(i, 850, () => {
      const nave = naveRef.current;
      if (!nave) { router.push(s.href); return; }
      // en coordenadas de la escena: la sede quedó al frente (escala 1)
      const { cx, cy, ry, bw, nave: nw } = C.geo;
      const h = bw * (230 / 240);
      const px = cx - bw / 2 + (bw * s.pad[0]) / 100;
      const py = cy + ry - h * 0.92 + (h * s.pad[1]) / 100;
      const sc = Math.max(0.3, Math.min(0.7, (bw * 0.3) / nw));
      const hN = nw * 0.6;
      const desde = nave.style.transform;
      const x2 = px - (nw * sc) / 2, y2 = py - hN * sc * 0.967;
      const m = nave.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
      const x0 = m ? Number(m[1]) : x2, y0 = m ? Number(m[2]) : y2;
      nave.animate(
        [
          { transform: desde },
          { transform: `translate3d(${(x0 + x2) / 2}px, ${Math.min(y0, y2) - 50}px, 0) scale(${(1 + sc) / 2}) rotate(${x2 > x0 ? 10 : -10}deg)`, offset: 0.5 },
          { transform: `translate3d(${x2}px, ${y2}px, 0) scale(${sc})` },
        ],
        { duration: 820, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' },
      );
      despues(650, () => setAterriza(true));
      despues(1050, () => router.push(s.href));
    });
  };

  /** "Elige lo que necesitas resolver": el anillo muestra cada sede al frente */
  const mostrar = () => {
    const C = ctl.current;
    if (C.ocupado) return;
    C.ocupado = true;
    setModo('tour');
    const r = quieto();
    const paso = (k: number) => {
      if (k >= N) { C.ocupado = false; setModo('espera'); return; }
      girarA(k, r ? 1 : 700, () => despues(r ? 300 : 650, () => paso(k + 1)));
    };
    paso(0);
  };

  return (
    <div className="ini">
      <Stars />
      <main className="ini__main ini3">
        <span className="home__brand">STAKEHOLDERS<i /></span>

        <div className={`ini__copy ${in_ ? 'is-in' : ''}`}>
          <h1 aria-label={TITULO}>
            {TITULO.split(' ').map((w, i) => (
              <Fragment key={i}>
                <span className="w" aria-hidden="true">
                  <span className="wi" style={{ transitionDelay: `${i * 55}ms` }}>{w}</span>
                </span>{' '}
              </Fragment>
            ))}
          </h1>
          <h2 className="lead fade" style={{ transitionDelay: '.45s' }}>
            Contadores públicos que llevan la contabilidad y la nómina de tu empresa. Y si eres persona natural, también te ayudamos con tu declaración de renta.
          </h2>
          <div className="fade" style={{ transitionDelay: '.65s' }}>
            <button type="button" className="home__cta-btn ini__cta" onClick={mostrar}>
              <span>Elige lo que necesitas resolver</span>
              <span className="home__cta-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <p className="ini__instruccion">Escoge una sede y Cosmo te lleva</p>

        <div className={`ini3-escena is-${modo} ${destino ? 'is-acerca' : ''}`} ref={escenaRef} style={{ ['--fx' as string]: '50%' }}>
          {/* fondo: sol y planeta */}
          <div className="ini3-fondo" aria-hidden="true">
            <div className="ini3-sol" />
            <div className="ini3-planeta"><Planeta v="hogar" giro={160} inclinacion={-18} /></div>
            <div className="ini3-luna"><Planeta v="piedra" giro={90} /></div>
          </div>

          <div className="ini3-mundo">
            <svg className="ini3-anillo ini3-anillo--atras" ref={atrasRef} aria-hidden="true">
              {SEDES.map((s) => <line key={s.id} className="ini3-brazo" />)}
              <path data-arco className="ini3-anillo__banda" />
              <path data-arco className="ini3-anillo__borde" />
              <path data-arco className="ini3-anillo__luces" />
            </svg>

            <div className="ini3-nucleo" ref={nucleoRef} aria-hidden="true"><Nucleo /></div>

            <svg className="ini3-anillo ini3-anillo--delante" ref={delanteRef} aria-hidden="true">
              <path data-arco className="ini3-anillo__banda" />
              <path data-arco className="ini3-anillo__borde" />
              <path data-arco className="ini3-anillo__luces" />
            </svg>

            {[0, 1].map((k) => (
              <div key={k} className="ini3-lanzadera" ref={(el) => { lanzaderasRef.current[k] = el; }} aria-hidden="true">
                <svg viewBox="0 0 40 16"><path d="M4,8 Q10,1 26,3 L36,8 L26,13 Q10,15 4,8 Z" fill="#DCE3EF" /><circle cx="24" cy="8" r="2.4" fill="#4C87FF" /><ellipse cx="2" cy="8" rx="6" ry="2.4" fill="#8FB3FF" opacity=".7" /></svg>
              </div>
            ))}

            <nav aria-label="Servicios" id="servicios">
              {SEDES.map((s, i) => (
                <Link
                  key={s.id}
                  href={s.href}
                  data-sede={s.id}
                  ref={(el) => { sedesRef.current[i] = el; }}
                  className={['ini3-sede', frente === i ? 'is-frente' : '', destino === s.id ? 'is-destino' : '', destino && destino !== s.id ? 'is-otra' : ''].join(' ')}
                  onMouseEnter={() => { ctl.current.pausa = true; }}
                  onMouseLeave={() => { ctl.current.pausa = false; }}
                  onFocus={() => { if (!ctl.current.ocupado) girarA(i, 700); }}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                    e.preventDefault();
                    entrar(i);
                  }}
                >
                  <span className="ini3-sede__letrero">
                    <h2>{s.t}</h2>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                  <span className="ini3-sede__arte"><Sede id={s.id} /></span>
                  <span className="ini3-sede__info">
                    <span className="ini3-sede__d">{s.d}</span>
                    <span className="ini3-sede__entrar">
                      Entrar
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                  </span>
                </Link>
              ))}
            </nav>

            <div className="ini3-nave" ref={naveRef} aria-hidden="true">
              <div className={`vj-burbuja vj-burbuja--arriba ini3-burbuja ${modo === 'espera' && in_ ? 'vj-burbuja--on' : ''}`}>
                <span>¿Qué servicio quieres conocer?</span>
              </div>
              <div className={`ini__nave-cuerpo ${aterriza ? 'is-aterriza' : ''}`}>
                <Nave id="ini" conLead={false} pose={modo === 'espera' ? 'saludo' : 'senalando'} />
              </div>
            </div>
          </div>

          {/* asteroides en primer plano */}
          <div className="ini3-cerca" aria-hidden="true">
            <div className="ini3-roca ini3-roca--a"><Planeta v="piedra" giro={40} /></div>
            <div className="ini3-roca ini3-roca--b"><Planeta v="piedra" giro={55} /></div>
          </div>
        </div>

        <Constelacion />
        <div className="home__foot">
          <span>Stakeholders 2026 · Colombia</span>
          <Link href="/admin/login">Acceso equipo</Link>
        </div>
      </main>
    </div>
  );
}
