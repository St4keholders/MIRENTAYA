/* ============================================================
   ÓRBITA · el planeta de la sección al centro y todos sus puntos
   alrededor, a la vista a la vez. Al llegar a la estación las
   tarjetas salen del planeta y se acomodan en su órbita.
   ============================================================ */

import type { CSSProperties, ReactNode } from 'react';

const STAR = 'M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z';

export function Orbita({
  planeta, items, className = '', anclaModo = 'arriba',
}: {
  planeta: ReactNode;
  items: Array<{ key: string; contenido: ReactNode }>;
  className?: string;
  anclaModo?: 'arriba' | 'der' | 'izq';
}) {
  const filas = Math.ceil(items.length / 2);
  return (
    <div className={`vj-orb ${className}`} style={{ ['--filas' as string]: filas }}>
      <svg className="vj-orb__anillos" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <ellipse cx="50" cy="50" rx="31" ry="40" className="vj-orb__anillo" />
        <ellipse cx="50" cy="50" rx="47" ry="48" className="vj-orb__anillo vj-orb__anillo--ext" />
        <g className="vj-orb__lunas">
          <circle r="0.7" fill="#BFD4FF">
            <animateMotion dur="16s" repeatCount="indefinite" path="M81,50 A31,40 0 1,1 19,50 A31,40 0 1,1 81,50" />
          </circle>
          <circle r="0.55" fill="#4C87FF">
            <animateMotion dur="26s" repeatCount="indefinite" begin="-9s" path="M3,50 A47,48 0 1,0 97,50 A47,48 0 1,0 3,50" />
          </circle>
        </g>
      </svg>
      <div className="vj-orb__centro" style={{ gridRow: `1 / span ${filas}` }}>
        <div className="vj-orb__planeta">{planeta}</div>
        <div className="vj-ancla" data-ancla-nave={anclaModo} data-ancla-movil="der" />
      </div>
      {items.map((it, i) => {
        const fila = Math.floor(i / 2);
        const lado = i % 2 === 0 ? -1 : 1;
        const estilo = {
          gridColumn: lado < 0 ? 1 : 3,
          gridRow: fila + 1,
          ['--i' as string]: i,
          ['--lado' as string]: lado,
          ['--fila' as string]: fila - (filas - 1) / 2,
        } as CSSProperties;
        return (
          <div key={it.key} className="vj-orb__item" style={estilo}>
            <div className="vj-orb__flota">{it.contenido}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Estrella SH que destella dentro de los botones de agendar */
export function Destello() {
  return (
    <svg className="vj-destello" viewBox="-10 -10 20 20" aria-hidden="true">
      <path d={STAR} fill="currentColor" />
    </svg>
  );
}
