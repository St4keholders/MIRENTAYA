'use client';

/* ============================================================
   ESCENAS DEL VIAJE (3 a 7)
   - EscenaRuta: ¿Qué?, ¿Cómo? y Precios (carrusel con la nave)
   - EscenaPorQue: la frase llega como transmisión, las cifras se
     encienden como tablero de mando
   - Aterrizaje: la nave aterriza junto al formulario
   ============================================================ */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CosmoPose } from '../cosmo/poses';
import { COSMO_POSES } from '../cosmo/poses';
import { Lead, type Animo, type PoseBrazos } from './Lead';
import { Nave } from './Nave';
import { RutaCarrusel, rutaProgreso, progresoDe, type ItemRuta } from './RutaCarrusel';
import { useEscena, seg, easeOut, irAProgreso } from './motor';

const STAR = 'M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z';
const A = 0.04, B = 0.96; // tramo del carrusel dentro de la escena

/* ── Carrusel con ruta ─────────────────────────────────────── */
export function EscenaRuta({
  id, className = '', cabeza, pie, items, pose, animos, brazos = ['agarrado', 'abajo'], frase, grilla = false, etiqueta,
}: {
  id: string;
  className?: string;
  cabeza: ReactNode;
  pie?: ReactNode;
  items: ItemRuta[];
  pose: CosmoPose;
  animos: [Animo, Animo];
  brazos?: [PoseBrazos, PoseBrazos];
  frase: string;
  grilla?: boolean;
  etiqueta: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [fase, setFase] = useState(0);
  const faseRef = useRef(0);

  useEscena(ref, (p, t) => {
    const root = ref.current;
    if (!root) return;
    const libre = root.hasAttribute('data-libre');
    rutaProgreso(root.querySelector<HTMLElement>('.rc'), seg(p, A, B), t, p > 0.005 && p < 0.62, libre);
    const f = p > 0.5 ? 1 : 0;
    if (f !== faseRef.current) { faseRef.current = f; setFase(f); }
  }, { continuo: true, pinSel: '.vj-pin' });

  const onIr = (i: number) => {
    const root = ref.current;
    if (root?.hasAttribute('data-libre')) {
      // carrusel con swipe: desplaza la ventana hasta la tarjeta
      const v = root.querySelector<HTMLElement>('.rc-ventana');
      const s0 = root.querySelector<HTMLElement>('.rc-slide');
      if (v && s0) v.scrollTo({ left: i * (s0.offsetWidth + 20), behavior: 'smooth' });
      return;
    }
    irAProgreso(root, A + progresoDe(i, items.length) * (B - A));
  };

  return (
    <section ref={ref} className={`vj-escena vj-ruta ${className}`} id={id}>
      <div className="vj-pin">
        <div className="vj-ruta__cabeza">{cabeza}</div>
        <RutaCarrusel
          id={`${id}-ruta`}
          items={items}
          pose={pose}
          animo={animos[fase]}
          brazos={brazos[fase]}
          frase={frase}
          grilla={grilla}
          onIr={onIr}
          etiquetaPuntos={etiqueta}
        />
        {pie && <div className="vj-ruta__pie">{pie}</div>}
      </div>
    </section>
  );
}

/* ── ¿Por qué? ─────────────────────────────────────────────── */
export function EscenaPorQue({ frase, cita, historia, cifras, cta }: {
  frase: string;
  cita: string;
  historia: ReactNode;
  cifras: string[];
  cta: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const chars = Array.from(cita);

  useEscena(ref, (p) => {
    const root = ref.current;
    if (!root) return;
    // transmisión: la frase se escribe letra por letra
    const n = Math.round(chars.length * easeOut(seg(p, 0.02, 0.34)));
    const spans = root.querySelectorAll<HTMLElement>('.vj-cita span');
    spans.forEach((s, i) => s.classList.toggle('on', i < n));
    root.querySelector('.vj-cita')?.classList.toggle('vj-cita--escribiendo', n > 0 && n < chars.length);
    root.querySelector<HTMLElement>('.vj-holo')?.style.setProperty('opacity', String(seg(p, 0, 0.06) * (0.35 + 0.65 * (1 - seg(p, 0.34, 0.5)))));
    const h = root.querySelector<HTMLElement>('.vj-porque__historia');
    if (h) { const k = easeOut(seg(p, 0.3, 0.48)); h.style.opacity = String(k); h.style.transform = `translateY(${(1 - k) * 18}px)`; }
    // tablero: cada cifra se enciende y cuenta
    root.querySelectorAll<HTMLElement>('.vj-cifra').forEach((el, i) => {
      const k = seg(p, 0.46 + i * 0.1, 0.56 + i * 0.1);
      el.classList.toggle('vj-cifra--on', k > 0.01);
      el.style.setProperty('--k', String(easeOut(k)));
      const num = el.querySelector<HTMLElement>('.vj-num');
      if (num) num.textContent = String(Math.round(Number(num.dataset.to) * easeOut(k)));
    });
    root.querySelector('.vj-porque .vj-burbuja')?.classList.toggle('vj-burbuja--on', p > 0.04 && p < 0.72);
    const nv = root.querySelector<HTMLElement>('.vj-porque__nave');
    if (nv) nv.style.transform = `translateY(${Math.sin(performance.now() / 450) * 5}px)`;
  }, { continuo: true, pinSel: '.vj-pin' });

  return (
    <section ref={ref} className="vj-escena vj-porque" id="por-que">
      <div className="vj-pin">
        <div className="vj-porque__grid">
          <div className="vj-porque__lado" aria-hidden="true">
            <div className="vj-burbuja vj-burbuja--arriba"><span>{frase}</span></div>
            <div className="vj-porque__nave">
              <Nave id="porque" pose="pensando" animo="tranquilo" brazos="abajo" />
            </div>
            <svg className="vj-holo" viewBox="0 0 200 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="vj-holo-g" x1="0" x2="1">
                  <stop offset="0" stopColor="#4C87FF" stopOpacity=".55" />
                  <stop offset="1" stopColor="#4C87FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points="0,140 200,0 200,300 0,160" fill="url(#vj-holo-g)" />
            </svg>
          </div>
          <div className="vj-porque__contenido">
            <div className="quote-highlight">
              <blockquote className="vj-cita" aria-label={cita}>
                {chars.map((c, i) => <span key={i} aria-hidden="true">{c}</span>)}
              </blockquote>
            </div>
            <div className="vj-porque__historia">{historia}</div>
            <div className="counters-grid vj-tablero">
              {cifras.map((txt) => {
                const m = txt.match(/^(\+?)(\d+)(.*)$/);
                return (
                  <div key={txt} className="counter-box vj-cifra">
                    <div className="counter-box__val">
                      {m ? (<>{m[1]}<span className="vj-num" data-to={m[2]}>{m[2]}</span>{m[3]}</>) : txt}
                    </div>
                  </div>
                );
              })}
            </div>
            {cta}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Aterrizaje junto al formulario ────────────────────────── */
function CosmoCuerpo({ pose }: { pose: CosmoPose }) {
  return (
    <svg viewBox="0 49 300 435" className="vj-at-cosmo" aria-hidden="true">
      <g dangerouslySetInnerHTML={{ __html: COSMO_POSES[pose].svg }} />
    </svg>
  );
}

export function Aterrizaje({ celebrar }: { celebrar: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`vj-aterrizaje ${on ? 'vj-aterrizaje--on' : ''} ${celebrar ? 'vj-aterrizaje--fiesta' : ''}`} aria-hidden="true">
      <div className={`vj-burbuja vj-burbuja--arriba ${on ? 'vj-burbuja--on' : ''}`}>
        <span key={celebrar ? 'b' : 'a'}>{celebrar ? '¡Listo! Desde hoy viajamos juntos.' : 'Agenda tu diagnóstico y seguimos el viaje juntos.'}</span>
      </div>
      <div className="vj-at-escena">
        <div className="vj-at-nave"><Nave id="aterriza" conLead={false} conCosmo={false} /></div>
        <div className="vj-at-personajes">
          <CosmoCuerpo pose={celebrar ? 'celebrando' : 'saludo'} />
          <svg viewBox="0 -40 200 360" className="vj-at-lead">
            <Lead animo={celebrar ? 'feliz' : 'tranquilo'} brazos={celebrar ? 'arriba' : 'saludo'} />
          </svg>
        </div>
        <div className="vj-at-suelo" />
        <div className="vj-at-fiesta">
          {Array.from({ length: 14 }).map((_, i) => (
            <svg key={i} viewBox="-10 -10 20 20" style={{ ['--a' as string]: `${(i / 14) * 360}deg`, ['--d' as string]: `${i * 0.04}s` }}>
              <path d={STAR} fill={['#3B6EFF', '#BFD4FF', '#F0B93C', '#FFFFFF'][i % 4]} />
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
}
