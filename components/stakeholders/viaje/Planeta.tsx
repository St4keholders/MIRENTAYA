/* ============================================================
   PLANETAS · SVG livianos que giran.
   La "rotación" es una textura plana que se desplaza dentro de
   un círculo (transform → la GPU la mueve sin repintar), con
   sombra y atmósfera fijas encima. Paleta de marca: azules,
   hielo y dorado.
   ============================================================ */

import type { CSSProperties } from 'react';

export type Variante = 'hogar' | 'hielo' | 'anillo' | 'oro' | 'nebula' | 'piedra';

interface Banda { y: number; amp: number; k: number; fase: number; grosor: number; color: string; op?: number }
interface Def { base: string; bandas: Banda[]; crateres?: Array<[number, number, number, string]>; luces?: string; atm: string; nubes?: boolean }

const DEFS: Record<Variante, Def> = {
  hogar: {
    base: '#142456', atm: 'rgba(76,135,255,.55)', nubes: true, luces: '#F0B93C',
    bandas: [
      { y: 18, amp: 6, k: 2, fase: 0.4, grosor: 16, color: '#1E3A8A' },
      { y: 52, amp: 9, k: 3, fase: 1.2, grosor: 22, color: '#0F1C47' },
      { y: 86, amp: 7, k: 2, fase: 2.1, grosor: 14, color: '#2B4FB8', op: 0.7 },
      { y: 118, amp: 10, k: 1, fase: 0.2, grosor: 26, color: '#0F1C47' },
      { y: 156, amp: 6, k: 4, fase: 2.8, grosor: 12, color: '#24409E', op: 0.8 },
    ],
  },
  hielo: {
    base: '#8FB3F5', atm: 'rgba(191,212,255,.6)',
    bandas: [
      { y: 22, amp: 5, k: 2, fase: 0.3, grosor: 18, color: '#BFD4FF' },
      { y: 64, amp: 8, k: 3, fase: 1.4, grosor: 14, color: '#6E95E0', op: 0.8 },
      { y: 104, amp: 6, k: 2, fase: 2.2, grosor: 22, color: '#DCE8FF', op: 0.85 },
      { y: 150, amp: 7, k: 1, fase: 0.9, grosor: 16, color: '#7AA0EC' },
    ],
    crateres: [[70, 42, 9, '#7AA0EC'], [230, 130, 12, '#7AA0EC'], [320, 70, 7, '#A9C4F7'], [150, 170, 8, '#7AA0EC']],
  },
  anillo: {
    base: '#2E5BD6', atm: 'rgba(59,110,255,.6)',
    bandas: [
      { y: 20, amp: 4, k: 3, fase: 0.1, grosor: 14, color: '#3B6EFF' },
      { y: 58, amp: 6, k: 2, fase: 1.9, grosor: 20, color: '#1F45B8' },
      { y: 100, amp: 5, k: 4, fase: 0.7, grosor: 12, color: '#6C93FF', op: 0.8 },
      { y: 136, amp: 7, k: 2, fase: 2.5, grosor: 22, color: '#1F45B8' },
      { y: 174, amp: 4, k: 3, fase: 1.1, grosor: 10, color: '#3B6EFF' },
    ],
  },
  oro: {
    base: '#8C6416', atm: 'rgba(240,185,60,.5)',
    bandas: [
      { y: 16, amp: 5, k: 2, fase: 0.5, grosor: 16, color: '#B88A1E' },
      { y: 52, amp: 8, k: 3, fase: 1.7, grosor: 18, color: '#F0B93C', op: 0.85 },
      { y: 92, amp: 6, k: 2, fase: 0.2, grosor: 20, color: '#6E4F12' },
      { y: 132, amp: 9, k: 1, fase: 2.4, grosor: 16, color: '#D9A42F' },
      { y: 170, amp: 5, k: 3, fase: 1.0, grosor: 14, color: '#6E4F12' },
    ],
  },
  nebula: {
    base: '#0F1638', atm: 'rgba(76,135,255,.5)', nubes: true,
    bandas: [
      { y: 26, amp: 10, k: 2, fase: 0.8, grosor: 20, color: '#24306E' },
      { y: 74, amp: 12, k: 1, fase: 2.0, grosor: 16, color: '#1B2A6B' },
      { y: 110, amp: 9, k: 3, fase: 0.4, grosor: 8, color: '#4C87FF', op: 0.5 },
      { y: 140, amp: 11, k: 2, fase: 1.5, grosor: 22, color: '#24306E' },
    ],
  },
  piedra: {
    base: '#2A3150', atm: 'rgba(191,212,255,.35)',
    bandas: [
      { y: 30, amp: 6, k: 2, fase: 1.0, grosor: 20, color: '#3A4266' },
      { y: 96, amp: 8, k: 3, fase: 0.2, grosor: 18, color: '#222844' },
      { y: 150, amp: 5, k: 2, fase: 2.3, grosor: 16, color: '#3A4266' },
    ],
    crateres: [[60, 70, 10, '#1E2440'], [190, 40, 7, '#1E2440'], [260, 120, 13, '#1E2440'], [350, 160, 8, '#1E2440'], [120, 150, 6, '#1E2440']],
  },
};

/* Banda ondulada que empata en x=0 y x=400 (k entero) → textura sin costuras */
function pathBanda(b: Banda) {
  const pts: string[] = [];
  const f = (x: number) => b.y + b.amp * Math.sin((2 * Math.PI * b.k * x) / 400 + b.fase);
  for (let x = 0; x <= 400; x += 20) pts.push(`${x},${f(x).toFixed(1)}`);
  const ida = pts.map((p, i) => `${i ? 'L' : 'M'}${p}`).join(' ');
  const vuelta = [];
  for (let x = 400; x >= 0; x -= 20) vuelta.push(`L${x},${(f(x) + b.grosor).toFixed(1)}`);
  return `${ida} ${vuelta.join(' ')} Z`;
}

function Textura({ v, rep = 1, id, alto = 200 }: { v: Variante; rep?: number; id: string; alto?: number }) {
  const d = DEFS[v];
  if (rep > 1) {
    // textura más fina para planetas enormes: se repite rep×rep dentro del mismo cuadro
    // (alto < 200 recorta la parte de arriba: horizonte)
    return (
      <svg viewBox={`0 0 400 ${alto}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id={id} width={400 / rep} height={200 / rep} patternUnits="userSpaceOnUse">
            <g transform={`scale(${1 / rep})`}><Capas d={d} /></g>
          </pattern>
        </defs>
        <rect width="400" height={alto} fill={`url(#${id})`} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><Capas d={d} /></svg>
  );
}

function Capas({ d }: { d: Def }) {
  return (
    <>
      <rect width="400" height="200" fill={d.base} />
      {d.bandas.map((b, i) => <path key={i} d={pathBanda(b)} fill={b.color} opacity={b.op ?? 1} />)}
      {d.crateres?.map(([x, y, r, c], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={r * 1.4} ry={r} fill={c} />
          <ellipse cx={x - r * 0.3} cy={y - r * 0.25} rx={r * 0.9} ry={r * 0.55} fill="#000" opacity=".12" />
        </g>
      ))}
      {d.nubes && (
        <g fill="none" stroke="#BFD4FF" strokeLinecap="round" opacity=".22">
          <path d="M20,40 q30,-8 60,0 t60,0" strokeWidth="5" />
          <path d="M210,96 q40,-10 80,0 t70,0" strokeWidth="6" />
          <path d="M90,150 q30,8 60,0" strokeWidth="4" />
          <path d="M300,30 q25,-6 50,0" strokeWidth="4" />
        </g>
      )}
      {d.luces && (
        <g fill={d.luces} opacity=".7">
          {[[40, 64], [46, 70], [120, 128], [126, 124], [260, 60], [268, 66], [330, 132], [180, 172], [186, 168]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" />)}
        </g>
      )}
    </>
  );
}

/**
 * Planeta. Tamaño por CSS (--pl). `giro` = segundos por vuelta.
 * `inclinacion` rota la textura (ejes inclinados se ven más naturales).
 */
export function Planeta({
  v, anillo = false, giro = 60, inclinacion = -12, rep = 1, className = '', style,
}: {
  v: Variante;
  anillo?: boolean;
  /** repeticiones de la textura (planetas enormes) */
  rep?: number;
  giro?: number;
  inclinacion?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const d = DEFS[v];
  return (
    <div className={`pl pl--${v} ${className}`} style={{ ...style, ['--atm' as string]: d.atm, ['--giro' as string]: `${giro}s`, ['--incl' as string]: `${inclinacion}deg` }} aria-hidden="true">
      {anillo && <div className="pl-anillo pl-anillo--atras" />}
      <div className="pl-esfera">
        <div className="pl-rot">
          <div className="pl-tex"><Textura v={v} rep={rep} id={`plt-${v}-${rep}-a`} /><Textura v={v} rep={rep} id={`plt-${v}-${rep}-b`} /></div>
        </div>
        <div className="pl-sombra" />
      </div>
      {anillo && <div className="pl-anillo pl-anillo--frente" />}
    </div>
  );
}

/**
 * Horizonte: solo el casquete superior de un planeta enorme (lo único que
 * se ve en pantalla). La textura que gira es así mucho más pequeña.
 * Tamaños por CSS: --pl (diámetro) y --cap (alto visible), en px.
 * `fraccion` = cap / diámetro (para recortar la textura con la misma escala).
 */
export function PlanetaHorizonte({
  v = 'hogar', giro = 120, rep = 4, fraccion = 0.3, className = '', style,
}: {
  v?: Variante;
  giro?: number;
  rep?: number;
  fraccion?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const d = DEFS[v];
  const alto = Math.max(20, Math.round(400 * fraccion));
  return (
    <div className={`plh ${className}`} style={{ ...style, ['--atm' as string]: d.atm, ['--giro' as string]: `${giro}s` }} aria-hidden="true">
      <div className="plh-atm" />
      <div className="plh-esfera">
        <div className="pl-tex"><Textura v={v} rep={rep} alto={alto} id={`plh-${v}-a`} /><Textura v={v} rep={rep} alto={alto} id={`plh-${v}-b`} /></div>
        <div className="plh-sombra" />
      </div>
    </div>
  );
}
