'use client';

/* ============================================================
   INICIO · cuatro sedes flotantes en el espacio, una por
   servicio. Cosmo espera en su nave; al escoger una sede vuela,
   aterriza en su plataforma y la página pasa al servicio.
   ============================================================ */

import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Stars from '../Stars';
import { Nave } from '../viaje/Nave';
import { Sede, type SedeId } from './Sedes';
import { Constelacion } from './Constelacion';
import '@/app/stakeholders.css';
import '@/app/servicios.css';
import '@/components/stakeholders/viaje/viaje.css';
import './inicio.css';

const SEDES: Array<{ id: SedeId; href: string; t: string; d: string; pad: [number, number] }> = [
  { id: 'contabilidad', href: '/contabilidad', t: 'SERVICIO DE CONTABILIDAD', d: 'Libros, impuestos y estados financieros de tu empresa.', pad: [79.2, 59] },
  { id: 'nomina', href: '/nomina', t: 'SERVICIO DE NÓMINA', d: 'Liquidación, nómina electrónica y seguridad social de tu equipo.', pad: [6.3, 64] },
  { id: 'renta', href: '/renta', t: 'RENTA PERSONA NATURAL', d: 'Descubre si debes declarar y hasta cuándo tienes plazo.', pad: [77.5, 68] },
  { id: 'personalizado', href: '/personalizado', t: 'SERVICIO PERSONALIZADO', d: 'Trámites y casos puntuales, revisados por un contador.', pad: [10.4, 75] },
];

const TITULO = 'Un área contable completa, fuera de tu oficina';
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Inicio() {
  const router = useRouter();
  const [in_, setIn] = useState(false);
  const [modo, setModo] = useState<'espera' | 'tour' | 'vuelo'>('espera');
  const [destacada, setDestacada] = useState<SedeId | 'todas' | null>(null);
  const [destino, setDestino] = useState<SedeId | null>(null);
  const [aterriza, setAterriza] = useState(false);
  const naveRef = useRef<HTMLDivElement>(null);
  const ocupado = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIn(true));
    const ts = timers.current;
    return () => { cancelAnimationFrame(id); ts.forEach((t) => window.clearTimeout(t)); };
  }, []);

  const despues = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };

  /** Punto (relativo a la nave en reposo) donde su base toca un punto de la pantalla */
  const hacia = (px: number, py: number) => {
    const nave = naveRef.current!;
    const r = nave.getBoundingClientRect();
    // la nave en reposo: sin transform de vuelo aplicado (las animaciones WAAPI se cancelan antes)
    return { dx: px - (r.left + r.width / 2), dy: py - (r.top + r.height * 0.967) };
  };

  const volar = (id: SedeId, href: string) => {
    if (ocupado.current) return;
    ocupado.current = true;
    const nave = naveRef.current;
    const sede = document.querySelector<HTMLElement>(`[data-sede="${id}"] .ini-sede__svg`);
    const datos = SEDES.find((s) => s.id === id)!;
    if (!nave || !sede || quieto()) { router.push(href); return; }
    nave.getAnimations().forEach((a) => a.cancel());
    setModo('vuelo');
    setDestino(id);
    const rs = sede.getBoundingClientRect();
    const px = rs.left + (rs.width * datos.pad[0]) / 100;
    const py = rs.top + (rs.height * datos.pad[1]) / 100;
    const { dx, dy } = hacia(px, py);
    const sc = Math.max(0.22, Math.min(0.6, (rs.width * 0.24) / nave.offsetWidth));
    nave.animate(
      [
        { transform: 'translate(0,0) scale(1) rotate(0deg)' },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(${(1 + sc) / 2}) rotate(${dx > 0 ? 9 : -9}deg)`, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(${sc}) rotate(0deg)` },
      ],
      { duration: 900, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' },
    );
    despues(720, () => setAterriza(true));
    despues(1200, () => router.push(href));
  };

  /** "Elige lo que necesitas resolver": las sedes se iluminan y Cosmo las recorre */
  const mostrar = () => {
    if (ocupado.current) return;
    const nave = naveRef.current;
    if (!nave || quieto()) {
      setDestacada('todas');
      despues(1400, () => setDestacada(null));
      return;
    }
    ocupado.current = true;
    setModo('tour');
    nave.getAnimations().forEach((a) => a.cancel());
    const puntos = SEDES.map((s) => {
      // pasa por encima del letrero de cada sede, sin taparlo
      const r = document.querySelector<HTMLElement>(`[data-sede="${s.id}"] .ini-sede__letrero`)!.getBoundingClientRect();
      return hacia(r.left + r.width / 2, r.top - 10);
    });
    const n = puntos.length;
    const T = 650 * n + 500;
    nave.animate(
      [
        { transform: 'translate(0,0) scale(1)', offset: 0 },
        ...puntos.map((p, i) => ({ transform: `translate(${p.dx}px, ${p.dy}px) scale(.62) rotate(${i % 2 ? -5 : 5}deg)`, offset: (250 + i * 650) / T })),
        { transform: 'translate(0,0) scale(1)', offset: 1 },
      ],
      { duration: T, easing: 'ease-in-out' },
    );
    SEDES.forEach((s, i) => despues(250 + i * 650 - 150, () => setDestacada(s.id)));
    despues(T - 250, () => setDestacada(null));
    despues(T, () => { setModo('espera'); ocupado.current = false; });
  };

  return (
    <div className="ini">
      <Stars />
      <main className="ini__main">
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

        <div className={`ini__escena is-${modo}`}>
          <div className="ini__puerto">
            <div className="ini__nave" ref={naveRef} aria-hidden="true">
              <div className={`ini__nave-cuerpo ${aterriza ? 'is-aterriza' : ''}`}>
                <Nave id="ini" conLead={false} pose={modo === 'espera' ? 'saludo' : 'senalando'} />
              </div>
            </div>
            <div className={`vj-burbuja vj-burbuja--arriba ini__burbuja ${modo === 'espera' && in_ ? 'vj-burbuja--on' : ''}`} aria-hidden="true">
              <span>¿Qué servicio quieres conocer?</span>
            </div>
          </div>

          <p className="ini__instruccion">Escoge una sede y Cosmo te lleva</p>

          <nav className="ini__sedes" id="servicios" aria-label="Servicios">
            {SEDES.map((s, i) => {
              const clases = [
                'ini-sede',
                destacada === s.id || destacada === 'todas' ? 'is-destacada' : '',
                destino === s.id ? 'is-destino' : '',
                destino && destino !== s.id ? 'is-otra' : '',
              ].join(' ');
              return (
                <Link
                  key={s.id}
                  href={s.href}
                  data-sede={s.id}
                  className={clases}
                  style={{ ['--i' as string]: i }}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                    e.preventDefault();
                    volar(s.id, s.href);
                  }}
                >
                  <h2 className="ini-sede__letrero">{s.t}</h2>
                  <div className="ini-sede__flota"><Sede id={s.id} /></div>
                  <p className="ini-sede__d">{s.d}</p>
                  <span className="ini-sede__entrar">
                    Entrar
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </Link>
              );
            })}
          </nav>
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
