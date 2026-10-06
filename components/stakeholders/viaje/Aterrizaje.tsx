'use client';

/* ============================================================
   ATERRIZAJE · la nave aterriza junto al formulario: Cosmo y el
   empresario bajan juntos; al enviar, celebran.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import type { CosmoPose } from '../cosmo/poses';
import { COSMO_POSES } from '../cosmo/poses';
import { Lead } from './Lead';
import { Nave } from './Nave';

const STAR = 'M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z';

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
        <div className="vj-ancla vj-ancla--at" data-ancla-nave="arriba" />
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
