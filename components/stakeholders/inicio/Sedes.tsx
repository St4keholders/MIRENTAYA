/* ============================================================
   SEDES CON VOLUMEN · oficinas en el espacio dibujadas en falso
   3D: frente iluminado, costado en sombra y techo, luz que entra
   desde arriba a la izquierda, ventanas cálidas con gente
   trabajando, baliza, puerta y plataforma de acople para la nave
   de Cosmo. Coordenadas: 0 0 240 230.
   ============================================================ */

export type SedeId = 'contabilidad' | 'nomina' | 'renta' | 'personalizado';

const PIELES = ['#E0AC88', '#8D5A3B', '#F1C7A5', '#C68B65', '#A86F4C', '#EBC09C'];
const PELOS = ['#2A1E18', '#120D0B', '#6B4423', '#2A1E18', '#3B2A1E', '#9A9A9A'];
const ROPA = ['#3B6EFF', '#2B3550', '#B88A1E', '#1F2433', '#4C87FF', '#3A2F3F'];

/** Gradientes compartidos de cada sede (ids únicos por sede) */
function Defs({ p }: { p: string }) {
  return (
    <defs>
      <linearGradient id={`${p}-frente`} x1="0" y1="0" x2=".4" y2="1">
        <stop offset="0" stopColor="#33468C" />
        <stop offset="1" stopColor="#141B3A" />
      </linearGradient>
      <linearGradient id={`${p}-lado`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#151C3C" />
        <stop offset="1" stopColor="#090D1F" />
      </linearGradient>
      <linearGradient id={`${p}-techo`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#5470C8" />
        <stop offset="1" stopColor="#2B3C80" />
      </linearGradient>
      <linearGradient id={`${p}-vidrio`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE7B0" stopOpacity=".95" />
        <stop offset="1" stopColor="#F0B93C" stopOpacity=".7" />
      </linearGradient>
      <radialGradient id={`${p}-brillo`}>
        <stop offset="0" stopColor="#F0B93C" stopOpacity=".45" />
        <stop offset="1" stopColor="#F0B93C" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${p}-propulsor`}>
        <stop offset="0" stopColor="#BFD4FF" stopOpacity=".9" />
        <stop offset=".4" stopColor="#4C87FF" stopOpacity=".55" />
        <stop offset="1" stopColor="#3B6EFF" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Ventana cálida con una persona en su escritorio */
function Ventana({ p, x, y, w, h, i, objeto = 'pantalla' }: { p: string; x: number; y: number; w: number; h: number; i: number; objeto?: 'pantalla' | 'papel' | 'nada' }) {
  const cx = x + w * (objeto === 'nada' ? 0.5 : 0.4);
  const r = Math.min(w, h) * 0.17;
  const hy = y + h * 0.46;
  return (
    <g>
      <rect x={x - w * 0.4} y={y - h * 0.4} width={w * 1.8} height={h * 1.8} fill={`url(#${p}-brillo)`} className="ini-luz" style={{ animationDelay: `${(i * 0.7) % 5}s` }} />
      <rect x={x} y={y} width={w} height={h} rx="1.5" fill={`url(#${p}-vidrio)`} />
      <path d={`M${cx - r * 1.9},${y + h} Q${cx - r * 1.7},${hy + r * 1.3} ${cx},${hy + r * 1.3} Q${cx + r * 1.7},${hy + r * 1.3} ${cx + r * 1.9},${y + h} Z`} fill={ROPA[i % ROPA.length]} />
      <circle cx={cx} cy={hy} r={r} fill={PIELES[i % PIELES.length]} />
      <path d={`M${cx - r},${hy - r * 0.1} Q${cx},${hy - r * 1.6} ${cx + r},${hy - r * 0.1} Q${cx},${hy - r * 0.8} ${cx - r},${hy - r * 0.1} Z`} fill={PELOS[i % PELOS.length]} />
      <rect x={x} y={y + h * 0.8} width={w} height={h * 0.2} fill="#5A3D10" opacity=".55" />
      {objeto === 'pantalla' && <rect x={x + w * 0.62} y={y + h * 0.48} width={w * 0.3} height={h * 0.3} rx=".8" fill="#4C87FF" className="ini-pantalla" />}
      {objeto === 'papel' && <rect x={x + w * 0.6} y={y + h * 0.6} width={w * 0.28} height={h * 0.2} fill="#fff" transform={`rotate(-8 ${x + w * 0.74} ${y + h * 0.7})`} />}
      <path d={`M${x},${y + h} V${y} H${x + w}`} fill="none" stroke="#0B1024" strokeWidth="1.4" opacity=".7" />
    </g>
  );
}

/** Ventanitas del costado (en sombra) */
function VentanasLado({ x0, y0, filas, dy, sesgo }: { x0: number; y0: number; filas: number; dy: number; sesgo: number }) {
  return (
    <g fill="#F0B93C">
      {Array.from({ length: filas }).map((_, f) => (
        <g key={f}>
          <path d={`M${x0},${y0 + f * dy} l8,${-sesgo} v12 l-8,${sesgo} Z`} opacity=".42" />
          <path d={`M${x0 + 13},${y0 + f * dy - sesgo * 1.6} l8,${-sesgo} v12 l-8,${sesgo} Z`} opacity=".28" />
        </g>
      ))}
    </g>
  );
}

function Baliza({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle className="ini-baliza__halo" cx={x} cy={y} r="10" fill="#4C87FF" />
      <circle className="ini-baliza" cx={x} cy={y} r="3.8" fill="#DCE6FF" />
    </g>
  );
}

function Puerta({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#FFE2A0" className="ini-puerta__luz" />
      <g className="ini-puerta ini-puerta--i"><rect x={x} y={y} width={w / 2} height={h} fill="#26305C" /></g>
      <g className="ini-puerta ini-puerta--d"><rect x={x + w / 2} y={y} width={w / 2} height={h} fill="#1E2750" /></g>
      <rect x={x - 2} y={y - 3} width={w + 4} height="3" fill="#4C87FF" />
    </g>
  );
}

/** Plataforma de acople con luces */
function Pista({ x, y, w, lado }: { x: number; y: number; w: number; lado: 'i' | 'd' }) {
  const ax = lado === 'd' ? x + 4 : x + w - 4;
  return (
    <g>
      <path d={`M${ax},${y + 5} L${ax + (lado === 'd' ? -12 : 12)},${y + 20}`} stroke="#1B2347" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${x},${y} h${w} l-4,6 h-${w - 8} Z`} fill="#26305C" />
      <rect x={x} y={y - 2} width={w} height="3" rx="1.5" fill="#4A5CA0" />
      {[0.15, 0.5, 0.85].map((k, i) => (
        <circle key={i} className="ini-pista__luz" cx={x + w * k} cy={y - 0.5} r="1.8" fill="#8FB3FF" style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
    </g>
  );
}

/** Base flotante con propulsores que brillan */
function Base({ p, x1, x2, y, prof = 22 }: { p: string; x1: number; x2: number; y: number; prof?: number }) {
  return (
    <g>
      <ellipse className="ini-propulsor" cx={(x1 + x2) / 2 + prof / 2} cy={y + 26} rx={(x2 - x1) * 0.42} ry="12" fill={`url(#${p}-propulsor)`} />
      <path d={`M${x1},${y} H${x2} L${x2 + prof},${y - prof * 0.5} V${y + 6 - prof * 0.5} L${x2 - 10},${y + 16} H${x1 + 10} Z`} fill="#0D1228" />
      <path d={`M${x1},${y} H${x2} L${x2 - 10},${y + 16} H${x1 + 10} Z`} fill="#1B2347" />
      <path d={`M${x1},${y} H${x2}`} stroke="#5D7BE0" strokeWidth="1.6" />
    </g>
  );
}

/** Caja en falso 3D: frente, costado y techo */
function Bloque({ p, x, y, w, h, prof = 24 }: { p: string; x: number; y: number; w: number; h: number; prof?: number }) {
  const s = prof * 0.5;
  return (
    <g>
      <path d={`M${x + w},${y} L${x + w + prof},${y - s} V${y + h - s} L${x + w},${y + h} Z`} fill={`url(#${p}-lado)`} />
      <path d={`M${x},${y} L${x + prof},${y - s} H${x + w + prof} L${x + w},${y} Z`} fill={`url(#${p}-techo)`} />
      <rect x={x} y={y} width={w} height={h} fill={`url(#${p}-frente)`} />
      <path d={`M${x},${y + h} V${y} H${x + w} L${x + w + prof},${y - s}`} fill="none" stroke="#8FB3FF" strokeOpacity=".55" strokeWidth="1.2" />
    </g>
  );
}

export function Sede({ id }: { id: SedeId }) {
  const p = `sd-${id}`;
  return (
    <svg className={`ini-sede__svg ini-sede__svg--${id}`} viewBox="0 0 240 230" overflow="visible" aria-hidden="true">
      <Defs p={p} />
      {id === 'contabilidad' && (
        <g>
          <Base p={p} x1={56} x2={168} y={196} />
          <Pista x={176} y={140} w={42} lado="d" />
          <Bloque p={p} x={66} y={46} w={92} h={150} prof={26} />
          {[58, 92, 126].map((y, f) => [74, 103, 132].map((x, c) => (
            <Ventana key={`${f}-${c}`} p={p} x={x} y={y} w={22} h={26} i={f * 3 + c} objeto={c === 2 && f === 1 ? 'papel' : 'pantalla'} />
          )))}
          <VentanasLado x0={162} y0={62} filas={4} dy={30} sesgo={4} />
          <Puerta x={101} y={170} w={22} h={26} />
          <rect x="66" y="40" width="92" height="6" fill="#4A5CA0" />
          <line x1="140" y1="36" x2="140" y2="14" stroke="#8B95A8" strokeWidth="2" />
          <Baliza x={140} y={11} />
        </g>
      )}
      {id === 'nomina' && (
        <g>
          <Base p={p} x1={22} x2={190} y={196} />
          <Pista x={0} y={150} w={30} lado="i" />
          <path d="M84,92 A30,22 0 0 1 144,92 Z" fill="#2B3C80" />
          <path d="M84,92 A30,22 0 0 1 144,92" fill="none" stroke="#8FB3FF" strokeOpacity=".5" strokeWidth="1.2" />
          <Bloque p={p} x={28} y={96} w={156} h={100} prof={24} />
          {[106, 142].map((y, f) => [36, 66, 96, 126, 156].map((x, c) => (
            f === 1 && c === 2 ? null : <Ventana key={`${f}-${c}`} p={p} x={x} y={y} w={22} h={26} i={f * 5 + c + 2} objeto={c % 2 ? 'nada' : 'pantalla'} />
          )))}
          <VentanasLado x0={188} y0={108} filas={3} dy={28} sesgo={4} />
          <Puerta x={95} y={170} w={22} h={26} />
          <Baliza x={114} y={70} />
        </g>
      )}
      {id === 'renta' && (
        <g>
          <Base p={p} x1={60} x2={170} y={196} />
          <Pista x={180} y={160} w={38} lado="d" />
          {/* chimenea */}
          <path d="M146,74 h12 v26 h-12 Z" fill={`url(#${p}-lado)`} />
          <Bloque p={p} x={66} y={122} w={98} h={74} prof={24} />
          {/* tejado: frontón y faldón */}
          <path d="M164,122 L188,110 L148,74 L118,82 Z" fill={`url(#${p}-techo)`} />
          <path d="M60,124 L115,78 L170,124 Z" fill="#2B3C80" />
          <path d="M60,124 L115,78 L170,124" fill="none" stroke="#8FB3FF" strokeOpacity=".6" strokeWidth="1.4" />
          <circle cx="115" cy="104" r="7" fill={`url(#${p}-vidrio)`} />
          <Ventana p={p} x={74} y={134} w={26} h={28} i={4} objeto="papel" />
          <Ventana p={p} x={130} y={134} w={26} h={28} i={1} objeto="pantalla" />
          <VentanasLado x0={168} y0={136} filas={1} dy={0} sesgo={4} />
          <Puerta x={105} y={170} w={20} h={26} />
          <Baliza x={152} y={70} />
        </g>
      )}
      {id === 'personalizado' && (
        <g>
          <Base p={p} x1={44} x2={182} y={196} />
          <Pista x={6} y={168} w={34} lado="i" />
          {/* grúa */}
          <rect x="58" y="34" width="7" height="92" fill="#F0B93C" />
          <rect x="65" y="34" width="3" height="92" fill="#B88A1E" />
          <path d="M58,40 L65,48 M58,56 L65,64 M58,72 L65,80 M58,88 L65,96 M58,104 L65,112" stroke="#B88A1E" strokeWidth="1.4" />
          <rect x="44" y="30" width="140" height="6" fill="#F0B93C" />
          <rect x="44" y="36" width="140" height="2" fill="#B88A1E" />
          <g className="ini-gancho">
            <line x1="160" y1="36" x2="160" y2="70" stroke="#8B95A8" strokeWidth="1.4" />
            <g transform="translate(146 70)">
              <path d="M28,0 l8,-4 v18 l-8,4 Z" fill={`url(#${p}-lado)`} />
              <rect x="0" y="0" width="28" height="18" fill={`url(#${p}-frente)`} stroke="#8FB3FF" strokeOpacity=".5" />
              <rect x="6" y="4" width="16" height="10" fill={`url(#${p}-vidrio)`} opacity=".8" />
            </g>
          </g>
          {/* módulo terminado */}
          <Bloque p={p} x={66} y={124} w={74} h={72} prof={20} />
          <Ventana p={p} x={73} y={134} w={26} h={26} i={3} objeto="pantalla" />
          <Ventana p={p} x={106} y={134} w={26} h={26} i={0} objeto="papel" />
          <Puerta x={92} y={170} w={20} h={26} />
          {/* módulo en obra: solo la estructura */}
          <g fill="none" stroke="#BFD4FF" strokeOpacity=".5" strokeWidth="1.3">
            <path d="M160,140 h40 v56 h-40 Z" strokeDasharray="4 4" />
            <path d="M160,140 l14,-7 h40 l-14,7 M214,133 v56 l-14,7" strokeDasharray="4 4" />
            <path d="M160,140 L200,196 M200,140 L160,196" strokeOpacity=".3" />
          </g>
          {/* el cohete de "Diseña tu servicio" */}
          <g transform="translate(206 126)">
            <ellipse cx="9" cy="70" rx="12" ry="4" fill="#4C87FF" opacity=".35" />
            <path d="M9,0 C16,9 18,20 18,28 H0 C0,20 2,9 9,0 Z" fill="#E8EDF6" />
            <path d="M9,0 C12,4 14,8 15,12 H3 C4,8 6,4 9,0 Z" fill="#3B6EFF" />
            <rect x="0" y="28" width="18" height="30" fill="#DCE3EF" />
            <rect x="12" y="28" width="6" height="30" fill="#B9C4D8" />
            <circle cx="8" cy="40" r="4.5" fill="#14204D" />
            <path d="M0,48 L-7,64 H0 Z M18,48 L25,64 H18 Z" fill="#3B6EFF" />
          </g>
          <Baliza x={61} y={24} />
        </g>
      )}
    </svg>
  );
}
