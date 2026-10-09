/* ============================================================
   SEDES FLOTANTES · cuatro oficinas en el espacio, una por
   servicio. Ventanas iluminadas con gente trabajando, baliza en
   el techo, puerta que se abre al pasar el mouse y plataforma de
   aterrizaje para la nave de Cosmo. Coordenadas: 0 0 240 200.
   ============================================================ */

export type SedeId = 'contabilidad' | 'nomina' | 'renta' | 'personalizado';

const PIELES = ['#E0AC88', '#8D5A3B', '#F1C7A5', '#C68B65', '#A86F4C', '#EBC09C'];
const PELOS = ['#2A1E18', '#120D0B', '#6B4423', '#2A1E18', '#3B2A1E', '#9A9A9A'];
const ROPA = ['#3B6EFF', '#2B3550', '#B88A1E', '#1F2433', '#4C87FF', '#3A2F3F'];

/** Ventana iluminada con una persona en su escritorio */
function Ventana({ x, y, w, h, i, objeto = 'pantalla' }: { x: number; y: number; w: number; h: number; i: number; objeto?: 'pantalla' | 'papel' | 'nada' }) {
  const cx = x + w * (objeto === 'nada' ? 0.5 : 0.4);
  const r = Math.min(w, h) * 0.17;
  const hy = y + h * 0.44;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="2.5" fill="#22305E" />
      <rect x={x} y={y} width={w} height={h} rx="2.5" fill="#F0B93C" opacity=".16" className="ini-luz" style={{ animationDelay: `${(i * 0.7) % 5}s` }} />
      {/* persona */}
      <path d={`M${cx - r * 1.9},${y + h} Q${cx - r * 1.7},${hy + r * 1.3} ${cx},${hy + r * 1.3} Q${cx + r * 1.7},${hy + r * 1.3} ${cx + r * 1.9},${y + h} Z`} fill={ROPA[i % ROPA.length]} />
      <circle cx={cx} cy={hy} r={r} fill={PIELES[i % PIELES.length]} />
      <path d={`M${cx - r},${hy - r * 0.1} Q${cx},${hy - r * 1.6} ${cx + r},${hy - r * 0.1} Q${cx},${hy - r * 0.8} ${cx - r},${hy - r * 0.1} Z`} fill={PELOS[i % PELOS.length]} />
      {/* escritorio y objeto */}
      <rect x={x} y={y + h * 0.82} width={w} height={h * 0.18} fill="#161C36" />
      {objeto === 'pantalla' && <rect x={x + w * 0.62} y={y + h * 0.5} width={w * 0.3} height={h * 0.3} rx="1" fill="#4C87FF" className="ini-pantalla" />}
      {objeto === 'papel' && <rect x={x + w * 0.62} y={y + h * 0.62} width={w * 0.26} height={h * 0.2} fill="#EEF1F6" transform={`rotate(-8 ${x + w * 0.75} ${y + h * 0.72})`} />}
      <rect x={x} y={y} width={w} height={h} rx="2.5" fill="none" stroke="#BFD4FF" strokeOpacity=".3" strokeWidth="1" />
    </g>
  );
}

function Baliza({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle className="ini-baliza__halo" cx={x} cy={y} r="9" fill="#4C87FF" />
      <circle className="ini-baliza" cx={x} cy={y} r="3.6" fill="#BFD4FF" />
    </g>
  );
}

function Puerta({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#F0B93C" opacity=".75" className="ini-puerta__luz" />
      <g className="ini-puerta ini-puerta--i"><rect x={x} y={y} width={w / 2} height={h} fill="#2A3150" /><circle cx={x + w / 2 - 2.5} cy={y + h * 0.55} r="1.2" fill="#BFD4FF" /></g>
      <g className="ini-puerta ini-puerta--d"><rect x={x + w / 2} y={y} width={w / 2} height={h} fill="#2A3150" /><circle cx={x + w / 2 + 2.5} cy={y + h * 0.55} r="1.2" fill="#BFD4FF" /></g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#3B6EFF" strokeWidth="1.4" />
    </g>
  );
}

/** Plataforma de aterrizaje lateral */
function Pista({ x, y, w, lado }: { x: number; y: number; w: number; lado: 'i' | 'd' }) {
  const brazoX = lado === 'd' ? x : x + w;
  return (
    <g>
      <path d={`M${brazoX},${y + 3} L${brazoX + (lado === 'd' ? -8 : 8)},${y + 16}`} stroke="#2A3150" strokeWidth="4" strokeLinecap="round" />
      <rect x={x} y={y} width={w} height="5" rx="2.5" fill="#2A3150" />
      {[0.15, 0.5, 0.85].map((k, i) => (
        <circle key={i} className="ini-pista__luz" cx={x + w * k} cy={y + 2.5} r="1.6" fill="#4C87FF" style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
    </g>
  );
}

/** Base flotante con propulsores */
function Base({ x1 = 40, x2 = 200, y = 170 }: { x1?: number; x2?: number; y?: number }) {
  return (
    <g>
      <ellipse className="ini-propulsor" cx="120" cy={y + 20} rx={(x2 - x1) * 0.36} ry="7" fill="#4C87FF" />
      <path d={`M${x1},${y} H${x2} L${x2 - 16},${y + 14} H${x1 + 16} Z`} fill="#161C36" />
      <path d={`M${x1},${y} H${x2}`} stroke="#3B6EFF" strokeWidth="2" />
      {[0.3, 0.5, 0.7].map((k) => (
        <rect key={k} x={x1 + (x2 - x1) * k - 5} y={y + 14} width="10" height="4" rx="1.5" fill="#2A3150" />
      ))}
    </g>
  );
}

export function Sede({ id }: { id: SedeId }) {
  return (
    <svg className={`ini-sede__svg ini-sede__svg--${id}`} viewBox="0 0 240 200" overflow="visible" aria-hidden="true">
      {id === 'contabilidad' && (
        <g>
          <Base x1={56} x2={184} />
          <Pista x={170} y={118} w={40} lado="d" />
          <rect x="72" y="30" width="96" height="140" rx="4" fill="#1A2140" />
          <rect x="72" y="30" width="96" height="140" rx="4" fill="none" stroke="#3B6EFF" strokeOpacity=".7" strokeWidth="1.6" />
          <rect x="66" y="24" width="108" height="8" rx="2" fill="#2A3150" />
          {[40, 74, 108].map((y, f) => [80, 107, 134].map((x, c) => (
            <Ventana key={`${f}-${c}`} x={x} y={y} w={24} h={27} i={f * 3 + c} objeto={c === 2 && f === 1 ? 'papel' : 'pantalla'} />
          )))}
          <Puerta x={108} y={146} w={24} h={24} />
          <line x1="150" y1="24" x2="150" y2="8" stroke="#8B95A8" strokeWidth="2" />
          <Baliza x={150} y={6} />
        </g>
      )}
      {id === 'nomina' && (
        <g>
          <Base x1={24} x2={216} />
          <Pista x={0} y={128} w={30} lado="i" />
          <path d="M96,74 A24,20 0 0 1 144,74 Z" fill="#2A3150" />
          <rect x="28" y="74" width="184" height="96" rx="5" fill="#1A2140" />
          <rect x="28" y="74" width="184" height="96" rx="5" fill="none" stroke="#3B6EFF" strokeOpacity=".7" strokeWidth="1.6" />
          {[84, 120].map((y, f) => [36, 70, 104, 138, 172].map((x, c) => (
            f === 1 && c === 2 ? null : <Ventana key={`${f}-${c}`} x={x} y={y} w={30} h={28} i={f * 5 + c + 2} objeto={c % 2 ? 'nada' : 'pantalla'} />
          )))}
          <Puerta x={108} y={146} w={24} h={24} />
          <Baliza x={120} y={52} />
        </g>
      )}
      {id === 'renta' && (
        <g>
          <Base x1={62} x2={178} />
          <Pista x={168} y={136} w={36} lado="d" />
          <rect x="146" y="60" width="13" height="30" fill="#2A3150" />
          <path d="M60,102 L120,50 L180,102 Z" fill="#2A3150" />
          <path d="M60,102 L120,50 L180,102" fill="none" stroke="#3B6EFF" strokeOpacity=".7" strokeWidth="1.6" />
          <rect x="72" y="100" width="96" height="70" fill="#1A2140" />
          <rect x="72" y="100" width="96" height="70" fill="none" stroke="#3B6EFF" strokeOpacity=".7" strokeWidth="1.6" />
          <circle cx="120" cy="80" r="8" fill="#22305E" />
          <circle cx="120" cy="80" r="8" fill="#F0B93C" opacity=".3" />
          <Ventana x={78} y={110} w={28} h={28} i={4} objeto="papel" />
          <Ventana x={134} y={110} w={28} h={28} i={1} objeto="pantalla" />
          <Puerta x={110} y={146} w={20} h={24} />
          <Baliza x={152} y={56} />
        </g>
      )}
      {id === 'personalizado' && (
        <g>
          <Base x1={40} x2={196} />
          <Pista x={8} y={150} w={34} lado="i" />
          {/* grúa */}
          <rect x="56" y="26" width="6" height="74" fill="#F0B93C" />
          <path d="M56,30 L62,36 M56,44 L62,50 M56,58 L62,64 M56,72 L62,78 M56,86 L62,92" stroke="#B88A1E" strokeWidth="1.4" />
          <rect x="40" y="26" width="132" height="5" fill="#F0B93C" />
          <g className="ini-gancho">
            <line x1="150" y1="31" x2="150" y2="62" stroke="#8B95A8" strokeWidth="1.4" />
            <rect x="138" y="62" width="24" height="18" rx="2" fill="#1A2140" stroke="#3B6EFF" strokeWidth="1.2" />
            <rect x="143" y="66" width="14" height="10" fill="#22305E" />
          </g>
          {/* módulo terminado y módulo en obra */}
          <rect x="62" y="100" width="70" height="70" rx="3" fill="#1A2140" />
          <rect x="62" y="100" width="70" height="70" rx="3" fill="none" stroke="#3B6EFF" strokeOpacity=".7" strokeWidth="1.6" />
          <Ventana x={70} y={108} w={26} h={26} i={3} objeto="pantalla" />
          <Ventana x={100} y={108} w={26} h={26} i={0} objeto="papel" />
          <Puerta x={86} y={146} w={22} h={24} />
          <rect x="132" y="120" width="44" height="50" fill="none" stroke="#BFD4FF" strokeOpacity=".45" strokeWidth="1.4" strokeDasharray="4 4" />
          <path d="M132,120 L176,170 M176,120 L132,170 M132,145 H176" stroke="#8B95A8" strokeOpacity=".5" strokeWidth="1.2" />
          {/* el cohete de "Diseña tu servicio" estacionado */}
          <g transform="translate(186 112)">
            <path d="M8,0 C14,8 16,18 16,26 H0 C0,18 2,8 8,0 Z" fill="#E8EDF6" />
            <rect x="0" y="26" width="16" height="26" fill="#DCE3EF" />
            <circle cx="8" cy="36" r="4" fill="#14204D" />
            <path d="M0,44 L-6,58 H0 Z M16,44 L22,58 H16 Z" fill="#3B6EFF" />
          </g>
          <Baliza x={59} y={20} />
        </g>
      )}
    </svg>
  );
}
