/* ============================================================
   EL COHETE · cuatro piezas, una por servicio, de abajo arriba:
   motor (contabilidad), módulo de tripulación (nómina), cabina
   de mando (contador acompañante) y cono de navegación
   (infraestructura tecnológica). Las piezas no escogidas se ven
   grises. Coordenadas: 0 0 240 560 (la llama sale por debajo).
   ============================================================ */

export type PiezaId = 'contabilidad' | 'nomina' | 'acompanante' | 'tecnologia';

function Cabeza({ cx, cy, r, piel, pelo, saco, corbata }: { cx: number; cy: number; r: number; piel: string; pelo: string; saco: string; corbata: string }) {
  const k = r / 11;
  return (
    <g>
      <path d={`M${cx - 20 * k},${cy + 26 * k} Q${cx - 18 * k},${cy + 10 * k} ${cx},${cy + 10 * k} Q${cx + 18 * k},${cy + 10 * k} ${cx + 20 * k},${cy + 26 * k} Z`} fill={saco} />
      <path d={`M${cx - 6 * k},${cy + 10 * k} L${cx},${cy + 20 * k} L${cx + 6 * k},${cy + 10 * k} Z`} fill="#EEF1F6" />
      <path d={`M${cx - 1.6 * k},${cy + 10 * k} L${cx + 1.6 * k},${cy + 10 * k} L${cx + 2.4 * k},${cy + 19 * k} L${cx},${cy + 22 * k} L${cx - 2.4 * k},${cy + 19 * k} Z`} fill={corbata} />
      <circle cx={cx} cy={cy - 3 * k} r={r} fill={piel} />
      <path d={`M${cx - r},${cy - 4 * k} Q${cx - r},${cy - 16 * k} ${cx},${cy - 15 * k} Q${cx + r},${cy - 16 * k} ${cx + r},${cy - 4 * k} Q${cx + 4 * k},${cy - 10 * k} ${cx - r},${cy - 4 * k} Z`} fill={pelo} />
      <circle cx={cx - 3.8 * k} cy={cy - 2 * k} r={1.4 * k} fill="#1C1F28" />
      <circle cx={cx + 3.8 * k} cy={cy - 2 * k} r={1.4 * k} fill="#1C1F28" />
      <path d={`M${cx - 3 * k},${cy + 2.5 * k} Q${cx},${cy + 5 * k} ${cx + 3 * k},${cy + 2.5 * k}`} stroke="#3A1A1A" strokeWidth={1.3 * k} strokeLinecap="round" fill="none" />
    </g>
  );
}

export function Cohete({ id, piezas, className = '' }: { id: string; piezas: PiezaId[]; className?: string }) {
  const on = (p: PiezaId) => (piezas.includes(p) ? 'is-on' : '');
  return (
    <svg className={`ch ${className}`} viewBox="0 0 240 560" overflow="visible" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-vc`}><circle cx="120" cy="198" r="28" /></clipPath>
        {[[96, 292], [144, 292], [120, 338]].map(([x, y], i) => (
          <clipPath key={i} id={`${id}-vt${i}`}><circle cx={x} cy={y} r="15" /></clipPath>
        ))}
        <radialGradient id={`${id}-llama`} cx=".5" cy="0" r="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".3" stopColor="#BFD4FF" />
          <stop offset=".7" stopColor="#4C87FF" stopOpacity=".85" />
          <stop offset="1" stopColor="#3B6EFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* llama (se enciende al despegar) */}
      <g className="ch-fuego">
        <ellipse cx="120" cy="500" rx="34" ry="62" fill={`url(#${id}-llama)`} />
        <ellipse cx="120" cy="490" rx="16" ry="34" fill="#fff" opacity=".9" />
      </g>

      {/* MOTOR · Contabilidad */}
      <g className={`ch-pieza ch-pieza--contabilidad ${on('contabilidad')}`} data-pieza="contabilidad">
        <path d="M70,384 L26,452 L26,478 L70,452 Z" fill="#3B6EFF" />
        <path d="M170,384 L214,452 L214,478 L170,452 Z" fill="#3B6EFF" />
        <rect x="70" y="378" width="100" height="62" rx="4" fill="#C9D2E3" />
        <rect x="70" y="392" width="100" height="8" fill="#F0B93C" />
        <path d="M90,440 H150 L162,476 H78 Z" fill="#2A3150" />
        <path d="M84,470 H156" stroke="#161C36" strokeWidth="5" strokeLinecap="round" />
        <circle cx="120" cy="418" r="9" fill="#1B2A6B" />
        <path d="M115,418 h10 M120,413 v10" stroke="#F0B93C" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* MÓDULO DE TRIPULACIÓN · Nómina */}
      <g className={`ch-pieza ch-pieza--nomina ${on('nomina')}`} data-pieza="nomina">
        <rect x="70" y="250" width="100" height="128" fill="#E8EDF6" />
        <rect x="70" y="250" width="100" height="6" fill="#B9C4D8" />
        <rect x="70" y="370" width="100" height="8" fill="#B9C4D8" />
        {[[96, 292], [144, 292], [120, 338]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="18" fill="#B9C4D8" />
            <circle cx={x} cy={y} r="15" fill="#14204D" />
            <g clipPath={`url(#${id}-vt${i})`}>
              <Cabeza
                cx={x} cy={y + 4} r={7.5}
                piel={['#C68B65', '#F1C7A5', '#8D5A3B'][i]}
                pelo={['#2A1E18', '#6B4423', '#120D0B'][i]}
                saco={['#1F2433', '#2B3550', '#3A2F3F'][i]}
                corbata={['#3B6EFF', '#F0B93C', '#B33A3A'][i]}
              />
            </g>
            <path d={`M${x - 9},${y - 7} A11,11 0 0 1 ${x - 2},${y - 12}`} stroke="#fff" strokeOpacity=".4" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </g>
        ))}
      </g>

      {/* CABINA DE MANDO · Contador acompañante */}
      <g className={`ch-pieza ch-pieza--acompanante ${on('acompanante')}`} data-pieza="acompanante">
        <rect x="70" y="152" width="100" height="98" fill="#DCE3EF" />
        <rect x="70" y="152" width="100" height="7" fill="#3B6EFF" />
        <circle cx="120" cy="198" r="33" fill="#B9C4D8" />
        <circle cx="120" cy="198" r="28" fill="#14204D" />
        <g clipPath={`url(#${id}-vc)`}>
          <Cabeza cx={120} cy={204} r={13} piel="#E0AC88" pelo="#2A1E18" saco="#1F2433" corbata="#3B6EFF" />
          {/* auricular: siempre en línea contigo */}
          <path d="M105,195 A15,15 0 0 1 135,195" stroke="#BFD4FF" strokeWidth="2.4" fill="none" />
          <rect x="102" y="193" width="5" height="9" rx="2" fill="#BFD4FF" />
        </g>
        <path d="M100,180 A26,26 0 0 1 112,172" stroke="#fff" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle className="ch-led" cx="152" cy="236" r="3" fill="#4C87FF" />
      </g>

      {/* CONO DE NAVEGACIÓN · Infraestructura tecnológica */}
      <g className={`ch-pieza ch-pieza--tecnologia ${on('tecnologia')}`} data-pieza="tecnologia">
        <line x1="120" y1="40" x2="120" y2="14" stroke="#8B95A8" strokeWidth="3" />
        <circle className="ch-led" cx="120" cy="11" r="5" fill="#4C87FF" />
        <path d="M120,36 C150,66 168,114 170,152 H70 C72,114 90,66 120,36 Z" fill="#E8EDF6" />
        <path d="M120,36 C132,48 141,62 147,76 H93 C99,62 108,48 120,36 Z" fill="#3B6EFF" />
        <rect x="104" y="100" width="32" height="24" rx="4" fill="#1B2A6B" />
        <path d="M108,100 v-6 M116,100 v-6 M124,100 v-6 M132,100 v-6 M108,124 v6 M116,124 v6 M124,124 v6 M132,124 v6" stroke="#8B95A8" strokeWidth="2" strokeLinecap="round" />
        <path className="ch-circuito" d="M90,140 H104 V118 M150,140 H136 V106" stroke="#4C87FF" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle className="ch-led" cx="120" cy="112" r="4" fill="#BFD4FF" />
      </g>
    </svg>
  );
}

/** Ícono pequeño de cada pieza para las tarjetas */
export function IconoPieza({ p }: { p: PiezaId }) {
  return (
    <svg className="ch-icono" viewBox="0 0 48 48" aria-hidden="true">
      {p === 'contabilidad' && (
        <g>
          <path d="M14,10 L4,30 L4,36 L14,30 Z M34,10 L44,30 L44,36 L34,30 Z" fill="#3B6EFF" />
          <rect x="14" y="8" width="20" height="18" rx="2" fill="#C9D2E3" />
          <rect x="14" y="12" width="20" height="3" fill="#F0B93C" />
          <path d="M17,26 H31 L34,36 H14 Z" fill="#2A3150" />
          <ellipse cx="24" cy="42" rx="5" ry="5" fill="#4C87FF" opacity=".8" />
        </g>
      )}
      {p === 'nomina' && (
        <g>
          <rect x="12" y="6" width="24" height="36" rx="3" fill="#E8EDF6" />
          <circle cx="18.5" cy="18" r="4.5" fill="#14204D" />
          <circle cx="29.5" cy="18" r="4.5" fill="#14204D" />
          <circle cx="24" cy="30" r="4.5" fill="#14204D" />
          <circle cx="18.5" cy="19" r="2" fill="#C68B65" />
          <circle cx="29.5" cy="19" r="2" fill="#F1C7A5" />
          <circle cx="24" cy="31" r="2" fill="#8D5A3B" />
        </g>
      )}
      {p === 'acompanante' && (
        <g>
          <rect x="10" y="8" width="28" height="32" rx="3" fill="#DCE3EF" />
          <rect x="10" y="8" width="28" height="3" fill="#3B6EFF" />
          <circle cx="24" cy="25" r="10" fill="#14204D" />
          <circle cx="24" cy="24" r="4" fill="#E0AC88" />
          <path d="M18,33 Q24,27 30,33 Z" fill="#1F2433" />
          <path d="M18.5,23 A6,6 0 0 1 29.5,23" stroke="#BFD4FF" strokeWidth="1.6" fill="none" />
        </g>
      )}
      {p === 'tecnologia' && (
        <g>
          <line x1="24" y1="4" x2="24" y2="10" stroke="#8B95A8" strokeWidth="2" />
          <circle cx="24" cy="4" r="2.6" fill="#4C87FF" />
          <path d="M24,9 C33,17 38,30 38,42 H10 C10,30 15,17 24,9 Z" fill="#E8EDF6" />
          <path d="M24,9 C28,13 31,17 33,21 H15 C17,17 20,13 24,9 Z" fill="#3B6EFF" />
          <rect x="18" y="27" width="12" height="9" rx="1.5" fill="#1B2A6B" />
          <circle cx="24" cy="31.5" r="1.8" fill="#BFD4FF" />
        </g>
      )}
    </svg>
  );
}
