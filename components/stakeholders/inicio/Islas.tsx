/* ============================================================
   ISLAS VIVAS · cada servicio es una sede sobre su propio pedazo
   de tierra suspendido en el espacio, vista en tres cuartos.
   Colores reales según lo construido (calles, jardín, casa, obra)
   y vida propia: tráfico, gente, grúa, humo, agua… Todo el
   movimiento es CSS (islas.css) y se apaga con reduced-motion.
   Coordenadas: 0 0 320 300. La superficie es una elipse centrada
   en (160, 150) de 140 × 50.
   ============================================================ */

import type { CSSProperties, ReactNode } from 'react';

export type IslaId = 'contabilidad' | 'nomina' | 'renta' | 'personalizado';

type Tierra = { superficie: string; borde: string; roca: string; rocaOscura: string; pasto?: string };

const TIERRAS: Record<IslaId, Tierra> = {
  contabilidad: { superficie: '#AEB6C3', borde: '#E3E8F0', roca: '#5A544F', rocaOscura: '#24211F' },
  nomina: { superficie: '#4C955B', borde: '#8FD199', roca: '#6A4E39', rocaOscura: '#2A1F17', pasto: '#3E8150' },
  renta: { superficie: '#58A05C', borde: '#9AD596', roca: '#6E5440', rocaOscura: '#2C2119', pasto: '#4A8C4E' },
  personalizado: { superficie: '#A7825A', borde: '#D8B892', roca: '#5E4A3A', rocaOscura: '#271E17' },
};

/** Variables CSS para las animaciones (tramos, rutas, retrasos) */
const v = (o: Record<string, string | number>) => {
  const s: Record<string, string> = {};
  for (const k in o) s[k.startsWith('--') ? k : `--${k}`] = typeof o[k] === 'number' ? `${o[k]}px` : (o[k] as string);
  return s as CSSProperties;
};
const seg = (s: number) => `${s}s`;

function Defs({ p, t }: { p: string; t: Tierra }) {
  return (
    <defs>
      <clipPath id={`${p}-sup`}><ellipse cx="160" cy="150" rx="140" ry="50" /></clipPath>
      <linearGradient id={`${p}-roca`} x1="0" x2=".3" y1="0" y2="1">
        <stop offset="0" stopColor={t.roca} />
        <stop offset=".55" stopColor={t.rocaOscura} />
        <stop offset="1" stopColor="#07080F" />
      </linearGradient>
      <linearGradient id={`${p}-luzlado`} x1="0" x2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".16" />
        <stop offset=".45" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity=".45" />
      </linearGradient>
      {/* rebote de luz azul de la autopista, desde abajo */}
      <linearGradient id={`${p}-rebote`} x1="0" x2="0" y1="0" y2="1">
        <stop offset=".45" stopColor="#3B6EFF" stopOpacity="0" />
        <stop offset="1" stopColor="#5C8CFF" stopOpacity=".28" />
      </linearGradient>
      <radialGradient id={`${p}-sup-luz`} cx=".32" cy=".2" r=".95">
        <stop offset="0" stopColor="#fff" stopOpacity=".2" />
        <stop offset=".6" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity=".3" />
      </radialGradient>
      <radialGradient id={`${p}-brillo`}>
        <stop offset="0" stopColor="#4C87FF" stopOpacity=".6" />
        <stop offset="1" stopColor="#4C87FF" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${p}-halo`}>
        <stop offset="0" stopColor="#EAF2FF" stopOpacity=".9" />
        <stop offset="1" stopColor="#EAF2FF" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${p}-vidrio`} x1="0" x2=".4" y1="0" y2="1">
        <stop offset="0" stopColor="#8FB2F0" />
        <stop offset=".5" stopColor="#4A6DB8" />
        <stop offset="1" stopColor="#22396F" />
      </linearGradient>
      <linearGradient id={`${p}-vidrio-lado`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#3A5BA0" />
        <stop offset="1" stopColor="#121F42" />
      </linearGradient>
      <linearGradient id={`${p}-reflejo`} x1="0" x2="1" y1="0" y2="1">
        <stop offset=".3" stopColor="#fff" stopOpacity="0" />
        <stop offset=".45" stopColor="#fff" stopOpacity=".28" />
        <stop offset=".6" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${p}-agua`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#8CCBF2" />
        <stop offset="1" stopColor="#3F86C4" />
      </linearGradient>
    </defs>
  );
}

const PENASCO = 'M20,150 C20,170 32,184 50,194 L58,212 C70,220 84,226 94,238 L100,258 C114,266 128,274 140,288 L158,302 L168,290 C182,280 194,270 202,258 L212,240 C228,230 242,220 252,208 L270,198 C288,186 300,170 300,150 Z';

/** Peñasco: el pedazo de tierra que cuelga bajo la superficie */
function Penasco({ p, t }: { p: string; t: Tierra }) {
  return (
    <g>
      <ellipse className="isla-brillo" cx="160" cy="272" rx="118" ry="32" fill={`url(#${p}-brillo)`} />
      <path d={PENASCO} fill={`url(#${p}-roca)`} />
      <path d={PENASCO} fill={`url(#${p}-luzlado)`} />
      <path d={PENASCO} fill={`url(#${p}-rebote)`} />
      {/* estratos y grietas */}
      <g fill="none" stroke="#000" strokeOpacity=".25" strokeWidth="2">
        <path d="M30,172 C80,194 150,200 214,194 C250,190 278,182 292,170" />
        <path d="M64,206 C110,224 170,228 226,216" />
        <path d="M104,242 C140,254 178,254 210,244" />
        <path d="M150,276 C160,282 170,280 176,274" />
      </g>
      <g fill="none" stroke="#fff" strokeOpacity=".07" strokeWidth="1.4">
        <path d="M40,168 C86,186 150,192 210,186" /><path d="M80,212 C120,224 170,224 214,214" />
      </g>
      <g fill="#fff" fillOpacity=".07">
        <path d="M46,172 l14,6 -6,8 Z" /><path d="M120,216 l18,4 -8,9 Z" /><path d="M200,208 l14,-2 -4,10 Z" /><path d="M150,252 l10,2 -5,7 Z" />
      </g>
      {/* rocas sueltas que flotan debajo */}
      <path className="isla-roca iv-flotar" style={v({ dl: seg(-1.2) })} d="M62,240 l10,-6 9,5 -3,10 -11,3 Z" fill={t.rocaOscura} />
      <path className="isla-roca iv-flotar" style={v({ dl: seg(-2.6) })} d="M246,244 l8,-5 8,4 -2,8 -9,2 Z" fill={t.roca} />
      <path className="isla-roca iv-flotar" style={v({ dl: seg(-0.4) })} d="M186,306 l6,-4 6,3 -2,6 -7,1 Z" fill={t.rocaOscura} />
      <path className="isla-roca iv-flotar" style={v({ dl: seg(-3.4) })} d="M120,288 l4,-3 5,2 -1,5 -5,1 Z" fill={t.roca} />
      {t.pasto && (
        <g fill="none" stroke={t.rocaOscura} strokeWidth="1.6" strokeLinecap="round" opacity=".85">
          <path className="iv-mecer" style={v({ dl: seg(-1) })} d="M96,228 q-4,16 2,26" />
          <path className="iv-mecer" style={v({ dl: seg(-2) })} d="M150,252 q4,14 -2,24" />
          <path className="iv-mecer" d="M226,228 q6,12 2,22" />
        </g>
      )}
    </g>
  );
}

/** Superficie de la isla con su borde iluminado */
function Superficie({ p, t, children }: { p: string; t: Tierra; children?: ReactNode }) {
  return (
    <g>
      <ellipse cx="160" cy="155" rx="141" ry="51" fill={t.rocaOscura} />
      <ellipse cx="160" cy="150" rx="140" ry="50" fill={t.superficie} />
      <g clipPath={`url(#${p}-sup)`}>
        {children}
        <ellipse cx="160" cy="150" rx="140" ry="50" fill={`url(#${p}-sup-luz)`} />
      </g>
      <ellipse cx="160" cy="150" rx="140" ry="50" fill="none" stroke={t.borde} strokeOpacity=".6" strokeWidth="1.6" />
    </g>
  );
}

/** Edificio en tres cuartos: frente, costado y techo, con ventanas de luz fría */
function Edificio({
  p, x, y, w, d, h, fachada = 'vidrio', pisos, cols, techo = '#9AA6BC', children,
}: {
  p: string; x: number; y: number; w: number; d: number; h: number;
  fachada?: 'vidrio' | 'blanco'; pisos: number; cols: number; techo?: string; children?: ReactNode;
}) {
  const dx = d * 0.62, dy = -d * 0.36;
  const frente = fachada === 'vidrio' ? `url(#${p}-vidrio)` : '#E9EDF3';
  const lado = fachada === 'vidrio' ? `url(#${p}-vidrio-lado)` : '#A9B2C2';
  const top = y - h;
  const vw = (w - 8) / cols, vh = (h - 10) / pisos;
  return (
    <g>
      <path d={`M${x},${y} l${w},0 l${dx * 1.6},${dy * 1.1} l${-w * 0.4},${-dy * 0.2} Z`} fill="#000" opacity=".22" />
      <path d={`M${x + w},${y} l${dx},${dy} v${-h} l${-dx},${-dy} Z`} fill={lado} />
      <path d={`M${x},${top} l${dx},${dy} h${w} l${-dx},${-dy} Z`} fill={techo} />
      <rect x={x} y={top} width={w} height={h} fill={frente} />
      {Array.from({ length: pisos }).map((_, f) => Array.from({ length: cols }).map((__, c) => {
        const on = (f * 7 + c * 3) % 5 !== 0;
        const parpadea = on && (f * 3 + c * 5) % 7 === 0;
        return (
          <rect
            key={`${f}-${c}`}
            className={parpadea ? 'iv-ventana' : undefined}
            x={x + 4 + c * vw + vw * 0.15}
            y={top + 6 + f * vh + vh * 0.18}
            width={vw * 0.7}
            height={vh * 0.62}
            fill={on ? '#E4EEFF' : (fachada === 'vidrio' ? '#1B2C57' : '#5C6578')}
            opacity={on ? 0.9 : 1}
            style={parpadea ? v({ dl: seg(-((f * 5 + c * 3) % 9) * 1.3) }) : undefined}
          />
        );
      }))}
      {Array.from({ length: pisos }).map((_, f) => (
        <path key={f} d={`M${x + w + dx * 0.2},${top + 8 + f * vh + dy * 0.2} l${dx * 0.6},${dy * 0.6} v${vh * 0.5} l${-dx * 0.6},${-dy * 0.6} Z`} fill="#C9DBFF" opacity={(f % 3) ? 0.32 : 0.6} />
      ))}
      {fachada === 'vidrio' && <rect x={x} y={top} width={w} height={h} fill={`url(#${p}-reflejo)`} />}
      <path d={`M${x},${y} V${top} H${x + w} l${dx},${dy}`} fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1" />
      {children}
    </g>
  );
}

function Arbol({ x, y, r = 9, c = '#2F7A45', dl = 0 }: { x: number; y: number; r?: number; c?: string; dl?: number }) {
  return (
    <g>
      <ellipse cx={x + 4} cy={y + 2} rx={r * 1.1} ry={r * 0.32} fill="#000" opacity=".22" />
      <rect x={x - 1.2} y={y - r * 0.6} width="2.4" height={r * 0.7} fill="#5A3E2B" />
      <g className="iv-mecer" style={v({ dl: seg(dl) })}>
        <circle cx={x} cy={y - r} r={r} fill={c} />
        <circle cx={x + r * 0.35} cy={y - r * 0.8} r={r * 0.6} fill="#000" opacity=".12" />
        <circle cx={x - r * 0.3} cy={y - r * 1.3} r={r * 0.5} fill="#fff" opacity=".14" />
      </g>
    </g>
  );
}

/** Persona: cuerpo, cabeza y piernas que se alternan al caminar */
function Persona({ x = 0, y = 0, c = '#3B6EFF', anda = false }: { x?: number; y?: number; c?: string; anda?: boolean }) {
  return (
    <g transform={x || y ? `translate(${x} ${y})` : undefined}>
      <ellipse cx="1" cy="0.4" rx="2.6" ry=".8" fill="#000" opacity=".25" />
      <g className={anda ? 'iv-paso' : undefined}>
        <rect x="-1.4" y="-3" width="1.2" height="3" fill="#1F2433" className={anda ? 'iv-pierna' : undefined} />
        <rect x=".2" y="-3" width="1.2" height="3" fill="#1F2433" className={anda ? 'iv-pierna iv-pierna--b' : undefined} />
        <rect x="-1.8" y="-7.4" width="3.6" height="4.8" rx="1.4" fill={c} />
        <circle cx="0" cy="-9" r="1.7" fill="#E0AC88" />
      </g>
    </g>
  );
}

function Carro({ c, largo = 11 }: { c: string; largo?: number }) {
  return (
    <g>
      <ellipse cx={largo / 2} cy="5.6" rx={largo * 0.6} ry="1.4" fill="#000" opacity=".3" />
      <rect x="0" y="0" width={largo} height="5" rx="2" fill={c} />
      <rect x={largo * 0.22} y=".9" width={largo * 0.46} height="2" rx="1" fill="#CFE0FF" opacity=".85" />
      <circle cx={largo - 0.6} cy="3.6" r=".8" fill="#FFFFFF" />
      <circle cx=".6" cy="3.6" r=".7" fill="#FF4D4D" />
    </g>
  );
}

function Farol({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx="6" ry="2" fill="#EAF2FF" opacity=".18" />
      <line x1={x} y1={y} x2={x} y2={y - 14} stroke="#3A3F4B" strokeWidth="1.4" />
      <circle cx={x} cy={y - 15} r="6" fill="#EAF2FF" opacity=".18" />
      <circle className="isla-farol" cx={x} cy={y - 15} r="2.2" fill="#F4F8FF" />
    </g>
  );
}

/** Algo que recorre un tramo recto, en bucle (carros, gente, naves) */
function Tramo({ a, b, d, dl = 0, vaiven = false, children }: { a: [number, number]; b: [number, number]; d: number; dl?: number; vaiven?: boolean; children: ReactNode }) {
  return (
    <g className={vaiven ? 'iv-vaiven' : 'iv-tramo'} style={v({ ax: a[0], ay: a[1], bx: b[0], by: b[1], d: seg(d), dl: seg(dl) })}>
      {children}
    </g>
  );
}

/** Algo que sigue una ruta curva (offset-path) */
function Ruta({ d: camino, t, dl = 0, children }: { d: string; t: number; dl?: number; children: ReactNode }) {
  return (
    <g className="iv-ruta" style={{ offsetPath: `path('${camino}')`, ...v({ d: seg(t), dl: seg(dl) }) }}>
      {children}
    </g>
  );
}

function Humo({ x, y, n = 4, t = 4, r = 4, c = '#E6ECF5' }: { x: number; y: number; n?: number; t?: number; r?: number; c?: string }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <circle key={i} className="iv-humo" cx={x} cy={y} r={r} fill={c} style={v({ d: seg(t), dl: seg(-(t / n) * i) })} />
      ))}
    </g>
  );
}

/* ---------- Contabilidad: distrito financiero ---------- */
function Contabilidad({ p, t }: { p: string; t: Tierra }) {
  return (
    <g>
      <Superficie p={p} t={t}>
        {/* andenes */}
        <path d="M10,132 L310,144 L310,176 L10,164 Z" fill="#CDD3DD" />
        <path d="M114,92 L156,92 L216,214 L174,214 Z" fill="#CDD3DD" />
        {/* calles en cruz */}
        <path d="M10,138 L310,150 L310,170 L10,158 Z" fill="#363B47" />
        <path d="M120,92 L150,92 L210,214 L180,214 Z" fill="#363B47" />
        <path d="M20,148 L300,160" stroke="#E9EDF3" strokeWidth="1.1" strokeDasharray="6 7" />
        <path d="M135,96 L195,210" stroke="#E9EDF3" strokeWidth="1.1" strokeDasharray="6 7" />
        {/* cebras */}
        <g stroke="#F4F6FA" strokeWidth="2.2" opacity=".85">
          {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={128 + i * 5} y1={136.5 + i * 0.2} x2={131 + i * 5} y2={142.5 + i * 0.2} />)}
          {[0, 1, 2, 3, 4].map((i) => <line key={`b${i}`} x1={186 + i * 0.6} y1={150 + i * 4} x2={196 + i * 0.6} y2={150.4 + i * 4} />)}
        </g>
        {/* parques en las esquinas */}
        <path d="M30,112 L112,104 L126,132 L24,138 Z" fill="#4F8F5B" />
        <path d="M212,178 L302,176 L294,198 L226,206 Z" fill="#4F8F5B" />
        <path d="M40,124 C60,120 90,122 110,118" stroke="#C9C2B0" strokeWidth="2" fill="none" />
        {/* tráfico */}
        <Tramo a={[-10, 141]} b={[320, 154]} d={7}><Carro c="#E04848" /></Tramo>
        <Tramo a={[-10, 141]} b={[320, 154]} d={7} dl={-3.6}><Carro c="#F4F6FA" largo={13} /></Tramo>
        <Tramo a={[320, 160.5]} b={[-14, 147]} d={8}><g transform="scale(-1 1) translate(-11 0)"><Carro c="#3B6EFF" /></g></Tramo>
        <Tramo a={[320, 160.5]} b={[-14, 147]} d={8} dl={-4.4}><g transform="scale(-1 1) translate(-11 0)"><Carro c="#1F2433" /></g></Tramo>
        <Tramo a={[123, 84]} b={[186, 212]} d={6.4} dl={-1.6}><Carro c="#F2B705" largo={9} /></Tramo>
        <Tramo a={[196, 214]} b={[133, 86]} d={6.8} dl={-4}><Carro c="#E9EDF3" largo={10} /></Tramo>
        {/* peatones cruzando por la cebra */}
        <Tramo a={[128, 132]} b={[156, 133]} d={5} vaiven><Persona c="#F4F6FA" anda /></Tramo>
        <Tramo a={[184, 166]} b={[178, 150]} d={4.4} dl={-2} vaiven><Persona c="#3B6EFF" anda /></Tramo>
        <Tramo a={[40, 167]} b={[100, 170]} d={9} vaiven><Persona c="#1F2433" anda /></Tramo>
        <Tramo a={[230, 170]} b={[290, 172]} d={8} dl={-3} vaiven><Persona c="#E9EDF3" anda /></Tramo>
      </Superficie>
      <Arbol x={52} y={126} dl={-1} /><Arbol x={84} y={120} r={7} dl={-2} /><Arbol x={106} y={130} r={6} />
      <Arbol x={252} y={194} dl={-1.5} /><Arbol x={280} y={188} r={7} dl={-0.5} />
      {/* semáforo */}
      <g>
        <line x1="160" y1="134" x2="160" y2="118" stroke="#2A2F3A" strokeWidth="1.4" />
        <rect x="157.5" y="112" width="5" height="8" rx="1" fill="#1A1D24" />
        <circle className="iv-semaforo" cx="160" cy="114.4" r="1.2" fill="#FF4D4D" />
        <circle className="iv-semaforo iv-semaforo--b" cx="160" cy="117.6" r="1.2" fill="#3DDC84" />
      </g>
      {/* torre de vidrio con ascensor y antena */}
      <Edificio p={p} x={160} y={128} w={46} d={34} h={150} pisos={9} cols={4}>
        <line x1={206 + 10.5} y1={128 - 6} x2={206 + 10.5} y2={128 - 150 - 6} stroke="#0D1530" strokeWidth="3" />
        <Tramo a={[216.5, 116]} b={[216.5, -10]} d={6} vaiven><rect x="-1.6" y="-3" width="3.2" height="6" fill="#F4F8FF" /><circle r="5" fill="#EAF2FF" opacity=".25" /></Tramo>
        <line x1="190" y1="-22" x2="190" y2="-44" stroke="#C9D2E0" strokeWidth="1.4" />
        <circle className="iv-baliza" cx="190" cy="-45" r="2" fill="#F4F8FF" />
        <rect x="168" y="-28" width="10" height="5" fill="#7A869E" /><rect x="196" y="-30" width="6" height="4" fill="#7A869E" />
      </Edificio>
      <Edificio p={p} x={62} y={174} w={42} d={30} h={92} pisos={6} cols={3} fachada="blanco">
        <rect x="70" y="80" width="10" height="4" fill="#8C97AD" /><rect x="84" y="78" width="6" height="5" fill="#8C97AD" />
      </Edificio>
      <Edificio p={p} x={214} y={176} w={38} d={28} h={70} pisos={4} cols={3} />
      <Farol x={128} y={182} /><Farol x={204} y={146} /><Farol x={40} y={166} />
      {/* dron de mensajería entre torres */}
      <Ruta d="M70,70 C110,40 170,40 230,86 C260,108 200,120 150,100 C110,86 60,96 70,70" t={11}>
        <g className="iv-flotar" style={v({ d: seg(1.2) })}>
          <rect x="-4" y="-1" width="8" height="2" rx="1" fill="#E9EDF3" />
          <line x1="-6" y1="-2" x2="-2" y2="-2" stroke="#9AA6BC" strokeWidth=".8" /><line x1="2" y1="-2" x2="6" y2="-2" stroke="#9AA6BC" strokeWidth=".8" />
          <rect x="-1.6" y="1" width="3.2" height="2.6" fill="#C9A26B" />
          <circle className="iv-baliza" cx="0" cy="0" r=".9" fill="#5C8CFF" />
        </g>
      </Ruta>
    </g>
  );
}

/* ---------- Nómina: campus con jardín ---------- */
function Nomina({ p, t }: { p: string; t: Tierra }) {
  const sendero = 'M24,172 C90,150 140,188 200,162 C240,146 280,156 316,150';
  return (
    <g>
      <Superficie p={p} t={t}>
        {/* textura de pasto */}
        <g fill={t.pasto} opacity=".55">
          {[[50, 120], [90, 196], [250, 196], [280, 120], [200, 108], [120, 110], [40, 150], [300, 172]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="16" ry="5" />)}
        </g>
        <path d={sendero} fill="none" stroke="#D9D4C7" strokeWidth="8" strokeLinecap="round" />
        <path d="M150,202 C150,182 160,172 168,164" fill="none" stroke="#D9D4C7" strokeWidth="6" strokeLinecap="round" />
        {/* estanque con ondas */}
        <ellipse cx="232" cy="188" rx="28" ry="9" fill="#2F5E86" />
        <ellipse cx="232" cy="187" rx="26" ry="8" fill={`url(#${p}-agua)`} />
        <ellipse className="iv-onda" cx="232" cy="187" rx="10" ry="3" fill="none" stroke="#E9F5FF" strokeWidth=".9" />
        <ellipse className="iv-onda" style={v({ dl: seg(-1.3) })} cx="232" cy="187" rx="10" ry="3" fill="none" stroke="#E9F5FF" strokeWidth=".9" />
        <ellipse className="iv-onda" style={v({ dl: seg(-2.6) })} cx="232" cy="187" rx="10" ry="3" fill="none" stroke="#E9F5FF" strokeWidth=".9" />
        {/* gente caminando por el sendero */}
        <Ruta d={sendero} t={16}><Persona c="#3B6EFF" anda /></Ruta>
        <Ruta d={sendero} t={16} dl={-5.3}><Persona c="#F4F6FA" anda /></Ruta>
        <Ruta d={sendero} t={16} dl={-10.6}><Persona c="#1F2433" anda /></Ruta>
        <Ruta d="M316,148 C280,154 240,144 200,160 C140,186 90,148 24,170" t={18} dl={-7}><Persona c="#E04848" anda /></Ruta>
        {/* entran y salen por la puerta */}
        <Tramo a={[150, 202]} b={[160, 172]} d={4.6}><Persona c="#F4F6FA" anda /></Tramo>
        <Tramo a={[161, 172]} b={[146, 204]} d={5} dl={-2.4}><Persona c="#3B6EFF" anda /></Tramo>
      </Superficie>
      {/* surtidor del estanque */}
      <g>
        <path className="iv-chorro" d="M232,186 C230,176 228,172 226,176" stroke="#E9F5FF" strokeWidth="1.2" fill="none" />
        <path className="iv-chorro" style={v({ dl: seg(-0.5) })} d="M232,186 C234,176 236,172 238,176" stroke="#E9F5FF" strokeWidth="1.2" fill="none" />
      </g>
      <Arbol x={44} y={152} dl={-0.6} /><Arbol x={66} y={166} r={7} dl={-1.8} /><Arbol x={274} y={142} r={10} dl={-1.1} /><Arbol x={292} y={162} r={7} dl={-2.3} />
      <Arbol x={202} y={204} r={6} dl={-0.2} />
      {/* oficina blanca con terraza verde */}
      <Edificio p={p} x={84} y={164} w={118} d={46} h={62} pisos={3} cols={9} fachada="blanco" techo="#C9D2E0">
        <path d="M90,100 l24,-14 h84 l-24,14 Z" fill="#5FA36A" />
        <Arbol x={110} y={96} r={4} dl={-1} /><Arbol x={140} y={92} r={4.5} dl={-2} /><Arbol x={176} y={94} r={4} />
        <Tramo a={[124, 96]} b={[168, 94]} d={9} vaiven><Persona c="#F4F6FA" anda /></Tramo>
        {/* puerta de vidrio que se ilumina al pasar la gente */}
        <rect x="136" y="146" width="16" height="18" fill="#9CC3FF" />
        <rect className="iv-puerta" x="136" y="146" width="16" height="18" fill="#F4F8FF" />
        <line x1="144" y1="146" x2="144" y2="164" stroke="#5C6578" strokeWidth=".8" />
        {/* letrero */}
        <rect x="120" y="106" width="48" height="6" rx="1" fill="#0B1020" />
        <text x="144" y="110.8" textAnchor="middle" fontSize="4.6" fontWeight="700" fill="#F4F8FF" letterSpacing=".6">NÓMINA</text>
      </Edificio>
      <Edificio p={p} x={214} y={150} w={36} d={26} h={40} pisos={2} cols={3} />
      {/* banca con dos personas conversando */}
      <rect x="196" y="190" width="14" height="3" rx="1" fill="#6A4E39" />
      <Persona x={199} y={190} c="#1F2433" /><Persona x={206} y={190} c="#F4F6FA" />
      <g className="iv-saluda"><Persona x={62} y={184} c="#3B6EFF" /></g>
      {/* pájaros */}
      <Tramo a={[-20, 40]} b={[340, 20]} d={14}>
        <g className="iv-aleteo" fill="none" stroke="#EAF2FF" strokeWidth="1"><path d="M0,0 q3,-3 6,0 q3,-3 6,0" /><path d="M10,6 q2,-2 4,0 q2,-2 4,0" /></g>
      </Tramo>
    </g>
  );
}

/* ---------- Renta: la casa de una persona natural ---------- */
function Renta({ p, t }: { p: string; t: Tierra }) {
  return (
    <g>
      <Superficie p={p} t={t}>
        <g fill={t.pasto} opacity=".5">
          {[[60, 120], [100, 200], [250, 200], [280, 130], [210, 110], [40, 160]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="18" ry="5" />)}
        </g>
        <path d="M150,204 C150,188 158,178 164,168" fill="none" stroke="#D9C9A8" strokeWidth="10" strokeLinecap="round" />
        {/* entrada del carro */}
        <path d="M206,170 L232,170 L262,206 L232,206 Z" fill="#9C9486" />
        <g transform="translate(222 176)"><Carro c="#3B6EFF" largo={16} /></g>
        {/* jardín de flores */}
        {[[56, 142], [64, 146], [72, 141], [86, 172], [94, 176], [242, 178], [270, 152], [212, 122], [104, 176]].map(([x, y], i) => (
          <circle key={i} className={i % 3 === 0 ? 'iv-flor' : undefined} style={v({ dl: seg(-i * 0.4) })} cx={x} cy={y} r="2.2" fill={['#FF8FB1', '#FFFFFF', '#FFD166', '#BFD4FF'][i % 4]} />
        ))}
        {/* el perro corre en el jardín */}
        <Ruta d="M60,180 C80,196 120,196 130,186 C140,176 110,168 80,170 C64,172 52,174 60,180" t={7}>
          <g><ellipse cx="0" cy="0" rx="3.4" ry="1.8" fill="#C98B4E" /><circle cx="3.2" cy="-1.2" r="1.4" fill="#C98B4E" /><ellipse cx="0" cy="2" rx="3" ry=".6" fill="#000" opacity=".25" /></g>
        </Ruta>
      </Superficie>
      {/* cerca */}
      <g stroke="#F1EEE7" strokeWidth="1.6">
        <path d="M44,170 C80,188 120,194 140,196 M184,198 C200,196 206,194 210,192" fill="none" />
        {[50, 66, 82, 98, 114, 130, 192, 204].map((x) => <line key={x} x1={x} y1={180 + Math.sin(x / 40) * 6} x2={x} y2={172 + Math.sin(x / 40) * 6} />)}
      </g>
      {/* árbol con columpio */}
      <Arbol x={262} y={150} r={18} c="#3C8A4A" dl={-1} />
      <g className="iv-columpio">
        <line x1="256" y1="128" x2="254" y2="148" stroke="#D9D4C7" strokeWidth=".7" /><line x1="264" y1="128" x2="262" y2="148" stroke="#D9D4C7" strokeWidth=".7" />
        <rect x="252.5" y="147.5" width="11" height="2" fill="#8C5A3C" />
      </g>
      <Arbol x={70} y={142} r={9} c="#3C8A4A" dl={-2} />
      {/* la casa */}
      <ellipse cx="166" cy="170" rx="62" ry="12" fill="#000" opacity=".22" />
      <path d="M196,166 l30,-18 v-42 l-30,18 Z" fill="#C3C8D1" />
      <rect x="116" y="124" width="80" height="42" fill="#EEF0F3" />
      <path d="M196,124 l30,-18 l-36,-34 l-30,18 Z" fill="#9C4430" />
      <path d="M110,126 L156,86 L202,126 Z" fill="#B5523B" />
      <path d="M118,120 L156,92 L194,120" fill="none" stroke="#9C4430" strokeWidth="1" opacity=".6" />
      <path d="M110,126 L156,86 L202,126" fill="none" stroke="#7A3424" strokeWidth="1.4" />
      <rect x="176" y="78" width="10" height="22" fill="#8E3B2A" /><rect x="174.5" y="76" width="13" height="3" fill="#6E2C1F" />
      <Humo x={181} y={74} n={5} t={5} r={4} />
      <circle cx="156" cy="110" r="5" fill="#E4EEFF" className="iv-luz" style={v({ dl: seg(-1) })} />
      <rect x="124" y="134" width="20" height="16" fill="#9CB6E0" />
      <rect x="124" y="134" width="20" height="16" fill="#F2F6FF" className="iv-luz" />
      <rect x="168" y="134" width="20" height="16" fill="#9CB6E0" />
      <rect x="168" y="134" width="20" height="16" fill="#F2F6FF" className="iv-luz" style={v({ dl: seg(-3.2) })} />
      <path d="M124,142 h20 M134,134 v16 M168,142 h20 M178,134 v16" stroke="#9AA6BC" strokeWidth="1" />
      <rect x="150" y="146" width="12" height="20" fill="#3B6EFF" /><circle cx="159.5" cy="157" r=".8" fill="#F2B705" />
      <path d="M204,140 l12,-7 v12 l-12,7 Z" fill="#E4EEFF" opacity=".7" className="iv-luz" style={v({ dl: seg(-5) })} />
      {/* alguien riega el jardín */}
      <g>
        <Persona x={98} y={172} c="#F4F6FA" />
        <path className="iv-agua" d="M100,165 q6,-4 10,4" stroke="#8CCBF2" strokeWidth="1" fill="none" strokeDasharray="1.4 1.6" />
      </g>
      {/* el cartero lleva una carta al buzón */}
      <rect x="138" y="190" width="7" height="5" rx="1.5" fill="#3B6EFF" /><line x1="141.5" y1="195" x2="141.5" y2="202" stroke="#6E5440" strokeWidth="1.2" />
      <rect className="iv-banderin" x="144.6" y="187" width="1" height="4" fill="#E04848" />
      <Tramo a={[204, 199]} b={[150, 201]} d={8} vaiven>
        <Persona c="#2C4A8E" anda />
        <rect x="1.6" y="-6" width="3.4" height="2.4" fill="#F4F6FA" />
      </Tramo>
      {/* mariposas */}
      <Ruta d="M80,130 C100,110 130,120 120,140 C110,156 70,150 80,130" t={6}><g className="iv-aleteo"><path d="M-1.6,0 l1.6,-1.4 1.6,1.4 -1.6,1.4 Z" fill="#FFD166" /></g></Ruta>
      <Ruta d="M230,120 C250,104 280,118 270,134 C258,150 222,140 230,120" t={7} dl={-2}><g className="iv-aleteo"><path d="M-1.6,0 l1.6,-1.4 1.6,1.4 -1.6,1.4 Z" fill="#FFFFFF" /></g></Ruta>
    </g>
  );
}

/* ---------- Personalizado: la obra donde se arma el servicio ---------- */
function Personalizado({ p, t }: { p: string; t: Tierra }) {
  return (
    <g>
      <Superficie p={p} t={t}>
        <path d="M30,160 C90,140 160,176 300,150" fill="none" stroke="#8A6B48" strokeWidth="5" strokeDasharray="3 3" opacity=".7" />
        <path d="M40,176 C100,158 170,190 290,166" fill="none" stroke="#8A6B48" strokeWidth="5" strokeDasharray="3 3" opacity=".6" />
        {/* plataforma del cohete */}
        <ellipse cx="74" cy="140" rx="24" ry="8" fill="#4A4F5C" />
        <ellipse cx="74" cy="139" rx="20" ry="6" fill="#5A606E" />
        <circle className="iv-baliza" cx="56" cy="140" r="1.2" fill="#5C8CFF" /><circle className="iv-baliza" style={v({ dl: seg(-0.6) })} cx="92" cy="140" r="1.2" fill="#5C8CFF" />
        {/* volqueta que va y viene */}
        <Tramo a={[24, 184]} b={[120, 190]} d={9} vaiven>
          <g><ellipse cx="9" cy="7" rx="11" ry="1.6" fill="#000" opacity=".3" /><rect x="0" y="0" width="12" height="6" fill="#F2B705" /><rect x="12" y="1.4" width="6" height="4.6" fill="#E3A800" /><rect x="13.2" y="2" width="3" height="2" fill="#CFE0FF" /><circle cx="3" cy="6.4" r="1.4" fill="#1F2433" /><circle cx="15" cy="6.4" r="1.4" fill="#1F2433" /></g>
        </Tramo>
        <Humo x={22} y={186} n={3} t={3} r={3} c="#D2B08A" />
      </Superficie>
      {/* módulo terminado */}
      <Edificio p={p} x={104} y={172} w={56} d={38} h={50} pisos={2} cols={4} fachada="blanco" />
      {/* módulo en obra: andamio */}
      <g fill="none" stroke="#F1F4F9" strokeWidth="1.4" opacity=".9">
        <path d="M170,170 h46 v-56 h-46 Z M170,114 l22,-13 h46 l-22,13 M216,170 l22,-13 v-56 M170,142 h46 M216,142 l22,-13" />
        <path d="M170,170 L216,114 M216,170 L170,114" strokeOpacity=".45" />
      </g>
      <rect x="170" y="142" width="46" height="28" fill="#E9EDF3" opacity=".9" />
      <path d="M216,170 l22,-13 v-28 l-22,13 Z" fill="#AEB7C6" opacity=".9" />
      {/* chispas de soldadura */}
      <g className="iv-chispa">
        <circle cx="194" cy="140" r="5" fill="#EAF2FF" opacity=".35" />
        <path d="M194,140 l-4,-3 M194,140 l3,-4 M194,140 l5,1 M194,140 l-2,4 M194,140 l4,3" stroke="#F4F8FF" strokeWidth=".8" />
      </g>
      <Persona x={198} y={142} c="#FF7A1A" />
      {/* grúa: el carro corre por la pluma y baja el módulo */}
      <rect x="252" y="40" width="7" height="132" fill="#F2B705" />
      <path d="M252,48 l7,8 M252,64 l7,8 M252,80 l7,8 M252,96 l7,8 M252,112 l7,8 M252,128 l7,8 M252,144 l7,8 M252,160 l7,8" stroke="#B88700" strokeWidth="1.3" />
      <rect x="248" y="168" width="15" height="6" fill="#3A3F4B" />
      <rect x="150" y="36" width="122" height="6" fill="#F2B705" />
      <path d="M150,42 l6,-6 M162,42 l6,-6 M174,42 l6,-6 M186,42 l6,-6 M198,42 l6,-6 M210,42 l6,-6 M222,42 l6,-6 M234,42 l6,-6" stroke="#B88700" strokeWidth="1" />
      <path d="M255,36 L255,22 L150,36 M255,22 L272,36" stroke="#D9A400" strokeWidth="1" fill="none" />
      <rect x="262" y="42" width="14" height="8" fill="#3A3F4B" />
      <rect x="248" y="44" width="15" height="10" fill="#2A2F3A" /><rect x="250" y="46" width="11" height="5" fill="#9CC3FF" />
      <circle className="iv-baliza" cx="255" cy="20" r="1.8" fill="#FF7A1A" />
      <g className="iv-carrito">
        <rect x="190" y="41" width="12" height="4" fill="#3A3F4B" />
        <g className="iv-cable"><line x1="196" y1="45" x2="196" y2="80" stroke="#8B95A8" strokeWidth="1.1" /></g>
        <g className="iv-carga">
          <path d="M184,80 l12,-6 l12,6" stroke="#8B95A8" strokeWidth=".8" fill="none" />
          <rect x="184" y="80" width="24" height="14" fill="#E9EDF3" stroke="#9AA6BC" />
          <path d="M208,80 l8,-5 v14 l-8,5 Z" fill="#AEB7C6" />
          <rect x="188" y="84" width="7" height="5" fill="#9CC3FF" /><rect x="198" y="84" width="7" height="5" fill="#9CC3FF" />
        </g>
      </g>
      {/* cohete de "Diseña tu servicio" en su plataforma, con vapor */}
      <Humo x={66} y={136} n={4} t={3.4} r={5} />
      <Humo x={84} y={136} n={4} t={3.8} r={4} />
      <g transform="translate(64 84)">
        <path d="M10,0 C17,10 20,22 20,32 H0 C0,22 3,10 10,0 Z" fill="#F4F6FA" />
        <path d="M10,0 C13,4 15,8 16,12 H4 C5,8 7,4 10,0 Z" fill="#3B6EFF" />
        <path d="M14,6 C17,14 18,22 18,32 H20 C20,22 17,10 10,0 Z" fill="#000" opacity=".12" />
        <rect x="0" y="32" width="20" height="18" fill="#E2E7EF" />
        <circle cx="10" cy="40" r="4" fill="#1B2A6B" /><circle cx="9" cy="39" r="1.4" fill="#9CC3FF" />
        <path d="M0,40 L-7,54 H0 Z M20,40 L27,54 H20 Z" fill="#3B6EFF" />
        <circle className="iv-baliza" cx="10" cy="-2" r="1.4" fill="#F4F8FF" />
      </g>
      {/* conos y obreros */}
      {[[150, 196], [228, 190], [96, 188]].map(([x, y], i) => <path key={i} d={`M${x},${y} l3,-8 l3,8 Z M${x + 1},${y - 3} h4`} fill="#FF7A1A" stroke="#fff" strokeWidth=".6" />)}
      <Tramo a={[228, 182]} b={[262, 178]} d={6} vaiven><Persona c="#FF7A1A" anda /></Tramo>
      <Tramo a={[164, 192]} b={[214, 194]} d={7} dl={-3} vaiven>
        <Persona c="#FF7A1A" anda />
        <rect x="-8" y="-9.6" width="16" height="1.6" fill="#C9A26B" />
      </Tramo>
      <Persona x={120} y={190} c="#F2B705" />
    </g>
  );
}

export function Isla({ id, className }: { id: IslaId; className?: string }) {
  const p = `isla-${id}`;
  const t = TIERRAS[id];
  return (
    <svg className={['isla', `isla--${id}`, className].filter(Boolean).join(' ')} viewBox="0 0 320 300" overflow="visible" aria-hidden="true">
      <Defs p={p} t={t} />
      <Penasco p={p} t={t} />
      {id === 'contabilidad' && <Contabilidad p={p} t={t} />}
      {id === 'nomina' && <Nomina p={p} t={t} />}
      {id === 'renta' && <Renta p={p} t={t} />}
      {id === 'personalizado' && <Personalizado p={p} t={t} />}
    </svg>
  );
}
