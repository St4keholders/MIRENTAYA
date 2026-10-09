/* ============================================================
   RESCATES · tres escenas de "antes y después" para ¿Qué hacemos?
   Cada escena arranca en peligro (rojo) y, al llegar la estación,
   el rescate ocurre por CSS: oxígeno que se llena, cuerda que
   engancha, provisiones que vuelven. Coordenadas: 0 0 240 150.
   ============================================================ */

function Astronauta({ x, y, rot, piel, medidor = false, brazos = 'abiertos' }: {
  x: number; y: number; rot: number; piel: string; medidor?: boolean; brazos?: 'abiertos' | 'alcanza';
}) {
  const bi = brazos === 'alcanza' ? -70 : 40;
  const bd = brazos === 'alcanza' ? -100 : -40;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {/* mochila */}
      <rect x="-22" y="-14" width="44" height="40" rx="8" fill="#C3CCDD" />
      {/* piernas */}
      <rect x="-15" y="20" width="12" height="27" rx="6" fill="#E4E9F2" />
      <rect x="3" y="20" width="12" height="27" rx="6" fill="#E4E9F2" />
      <rect x="-16" y="42" width="14" height="8" rx="4" fill="#8B95A8" />
      <rect x="2" y="42" width="14" height="8" rx="4" fill="#8B95A8" />
      {/* brazos */}
      <g transform={`rotate(${bi} -17 -4)`}>
        <rect x="-23" y="-6" width="11" height="27" rx="5.5" fill="#E4E9F2" />
        <circle cx="-17.5" cy="21" r="5.5" fill="#8B95A8" />
      </g>
      <g transform={`rotate(${bd} 17 -4)`}>
        <rect x="12" y="-6" width="11" height="27" rx="5.5" fill="#E4E9F2" />
        <circle cx="17.5" cy="21" r="5.5" fill="#8B95A8" />
      </g>
      {/* traje */}
      <rect x="-19" y="-10" width="38" height="36" rx="12" fill="#EEF2F8" />
      <rect x="-19" y="17" width="38" height="5" fill="#C3CCDD" />
      <rect x="-11" y="-2" width="22" height="13" rx="3" fill="#1B2A6B" />
      {medidor ? (
        <>
          <rect x="-8" y="2.5" width="16" height="4.5" rx="2.2" fill="#0B0F1E" />
          <rect className="as-o2" x="-8" y="2.5" width="16" height="4.5" rx="2.2" />
        </>
      ) : (
        <g>
          <circle cx="-5" cy="4.5" r="2" fill="#3B6EFF" />
          <circle cx="1" cy="4.5" r="2" fill="#BFD4FF" />
          <circle cx="7" cy="4.5" r="2" fill="#F0B93C" />
        </g>
      )}
      {/* casco */}
      <line x1="13" y1="-40" x2="17" y2="-50" stroke="#C3CCDD" strokeWidth="2" />
      <circle className="as-luz" cx="17.5" cy="-51" r="3.2" />
      <circle cx="0" cy="-26" r="20" fill="#F4F7FB" />
      <ellipse cx="0" cy="-25" rx="14.5" ry="11.5" fill="#1B2A6B" />
      <circle cx="0" cy="-22" r="9.5" fill={piel} />
      <circle cx="-3.4" cy="-23.5" r="1.5" fill="#1C1F28" />
      <circle cx="3.4" cy="-23.5" r="1.5" fill="#1C1F28" />
      <path className="as-boca as-boca--mal" d="M-3,-17 Q0,-19.5 3,-17" stroke="#3A1A1A" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path className="as-boca as-boca--bien" d="M-3.2,-18.5 Q0,-15.5 3.2,-18.5" stroke="#3A1A1A" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M-10,-31 A12,10 0 0 1 -2,-35" stroke="#fff" strokeOpacity=".45" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </g>
  );
}

/** Salud y pensión: el oxígeno pasa de rojo a lleno */
export function EscenaOxigeno() {
  return (
    <svg className="nm-escena" viewBox="0 0 240 150" aria-hidden="true">
      <circle className="nm-aura" cx="120" cy="78" r="58" />
      {[[62, 40, 3], [176, 54, 2.4], [164, 120, 2], [70, 112, 2.6]].map(([cx, cy, r], i) => (
        <circle key={i} className="nm-burbuja" cx={cx} cy={cy} r={r} style={{ animationDelay: `${i * -0.8}s` }} />
      ))}
      <g className="nm-flota">
        <Astronauta x={120} y={84} rot={-12} piel="#C68B65" medidor />
      </g>
    </svg>
  );
}

/** ARL: la cuerda de seguridad lo engancha */
export function EscenaCuerda() {
  return (
    <svg className="nm-escena" viewBox="0 0 240 150" aria-hidden="true">
      {/* panel donde trabajaba */}
      <g transform="translate(18 74) rotate(-12)">
        <rect x="0" y="0" width="64" height="36" rx="3" fill="#1B2A6B" />
        <path d="M16,0 V36 M32,0 V36 M48,0 V36 M0,18 H64" stroke="#3B6EFF" strokeOpacity=".7" strokeWidth="1.4" />
        <rect x="62" y="14" width="18" height="6" fill="#2A3150" />
      </g>
      <path className="nm-cuerda" d="M8,6 C60,4 92,96 146,99" pathLength={1} />
      <circle className="nm-gancho" cx="146" cy="99" r="3.4" />
      <g className="nm-deriva">
        <Astronauta x={148} y={80} rot={8} piel="#E0AC88" />
      </g>
    </svg>
  );
}

/** Prestaciones: las provisiones vuelven con el rayo */
export function EscenaProvisiones() {
  return (
    <svg className="nm-escena" viewBox="0 0 240 150" aria-hidden="true">
      <polygon className="nm-rayo" points="170,0 222,0 160,118 112,118" />
      <g className="nm-flota">
        <Astronauta x={76} y={84} rot={-6} piel="#8D5A3B" brazos="alcanza" />
      </g>
      <g className="nm-caja">
        <g transform="translate(136 92)">
          <rect x="-18" y="-14" width="36" height="28" rx="4" className="nm-caja__cuerpo" />
          <rect x="-18" y="-3" width="36" height="6" fill="#6E4F12" />
          <circle cx="0" cy="0" r="7" fill="#F0B93C" />
          <text x="0" y="3.6" textAnchor="middle" fontSize="10" fontWeight="700" fill="#6E4F12" fontFamily="var(--mono)">$</text>
        </g>
      </g>
    </svg>
  );
}
