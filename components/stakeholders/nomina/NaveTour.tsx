/* ============================================================
   NAVE DEL SEMINARIO · crucero de pasajeros con una fila de
   ventanas llenas de empresarios elegantes y Cosmo como guía en
   la cabina delantera. Sistema de coordenadas: 0 0 640 260.
   Mismo estilo flat de Cosmo y el lead: sin contornos.
   ============================================================ */

import { COSMO_POSES, type CosmoPose } from '../cosmo/poses';

const STAR = 'M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z';

const PIELES = ['#E0AC88', '#8D5A3B', '#F1C7A5', '#C68B65', '#A86F4C', '#EBC09C', '#6E4630'];
const PELOS = ['#2A1E18', '#120D0B', '#6B4423', '#2A1E18', '#9A9A9A', '#3B2A1E', '#120D0B'];
const SACOS = ['#1F2433', '#2B3550', '#3A2F3F', '#1C2B2A', '#262A36', '#40364A', '#1F2433'];
const DETALLES = ['#3B6EFF', '#B33A3A', '#F0B93C', '#BFD4FF', '#3B6EFF', '#F0B93C', '#B33A3A'];
/** 0 corto · 1 moño (mujer) · 2 melena · 3 calvo con barba · 4 canas · 5 cola · 6 rizos */
const PEINADOS = [0, 1, 3, 2, 4, 5, 6];

const VENTANAS = [104, 160, 216, 272, 328, 384, 440];

function Pasajero({ i, cx, cy }: { i: number; cx: number; cy: number }) {
  const piel = PIELES[i % PIELES.length];
  const pelo = PELOS[i % PELOS.length];
  const saco = SACOS[i % SACOS.length];
  const det = DETALLES[i % DETALLES.length];
  const peinado = PEINADOS[i % PEINADOS.length];
  const mujer = peinado === 1 || peinado === 2 || peinado === 5;
  const hy = cy - 3;
  return (
    <g className="nt-pas" style={{ animationDelay: `${i * -0.7}s` }}>
      {/* pelo de atrás */}
      {peinado === 2 && <path d={`M${cx - 12},${hy} Q${cx - 14},${hy + 18} ${cx - 9},${hy + 20} H${cx + 9} Q${cx + 14},${hy + 18} ${cx + 12},${hy} Z`} fill={pelo} />}
      {peinado === 5 && <ellipse cx={cx + 10} cy={hy + 6} rx="4" ry="8" fill={pelo} transform={`rotate(20 ${cx + 10} ${hy + 6})`} />}
      {/* hombros: saco, camisa y corbata / collar */}
      <path d={`M${cx - 20},${cy + 26} Q${cx - 18},${cy + 10} ${cx},${cy + 10} Q${cx + 18},${cy + 10} ${cx + 20},${cy + 26} Z`} fill={saco} />
      <path d={`M${cx - 6},${cy + 10} L${cx},${cy + 20} L${cx + 6},${cy + 10} Z`} fill="#EEF1F6" />
      {mujer
        ? <g fill="#F5F0E6">{[-4, 0, 4].map((d) => <circle key={d} cx={cx + d} cy={cy + 12 + Math.abs(d) * -0.3} r="1.3" />)}</g>
        : i % 3 === 1
          ? <path d={`M${cx - 4},${cy + 10} L${cx + 4},${cy + 13} L${cx + 4},${cy + 9} L${cx - 4},${cy + 12} Z`} fill={det} />
          : <path d={`M${cx - 1.6},${cy + 10} L${cx + 1.6},${cy + 10} L${cx + 2.4},${cy + 19} L${cx},${cy + 22} L${cx - 2.4},${cy + 19} Z`} fill={det} />}
      {/* cuello y cabeza */}
      <rect x={cx - 3.5} y={hy + 8} width="7" height="6" fill={piel} />
      <circle cx={cx} cy={hy} r="11" fill={piel} />
      {/* peinados */}
      {peinado === 0 && <path d={`M${cx - 11},${hy - 1} Q${cx - 11},${hy - 13} ${cx},${hy - 12} Q${cx + 11},${hy - 13} ${cx + 11},${hy - 1} Q${cx + 4},${hy - 7} ${cx - 11},${hy - 1} Z`} fill={pelo} />}
      {peinado === 1 && <><path d={`M${cx - 11},${hy} Q${cx - 12},${hy - 13} ${cx},${hy - 12} Q${cx + 12},${hy - 13} ${cx + 11},${hy} Q${cx},${hy - 9} ${cx - 11},${hy} Z`} fill={pelo} /><circle cx={cx} cy={hy - 13} r="5" fill={pelo} /></>}
      {peinado === 2 && <path d={`M${cx - 12},${hy + 2} Q${cx - 13},${hy - 13} ${cx},${hy - 12} Q${cx + 13},${hy - 13} ${cx + 12},${hy + 2} Q${cx + 6},${hy - 8} ${cx - 12},${hy + 2} Z`} fill={pelo} />}
      {peinado === 3 && <path d={`M${cx - 9},${hy + 3} Q${cx - 8},${hy + 12} ${cx},${hy + 12} Q${cx + 8},${hy + 12} ${cx + 9},${hy + 3} Q${cx},${hy + 8} ${cx - 9},${hy + 3} Z`} fill={pelo} />}
      {peinado === 4 && <path d={`M${cx - 11},${hy - 1} Q${cx - 10},${hy - 12} ${cx},${hy - 12} Q${cx + 10},${hy - 12} ${cx + 11},${hy - 1} Q${cx + 2},${hy - 9} ${cx - 11},${hy - 1} Z`} fill={pelo} />}
      {peinado === 5 && <path d={`M${cx - 11},${hy} Q${cx - 11},${hy - 13} ${cx},${hy - 12} Q${cx + 11},${hy - 13} ${cx + 11},${hy} Q${cx + 2},${hy - 8} ${cx - 11},${hy} Z`} fill={pelo} />}
      {peinado === 6 && <g fill={pelo}>{[-9, -4, 1, 6, 10].map((d, k) => <circle key={k} cx={cx + d} cy={hy - 9 + Math.abs(d) * 0.25} r="4.4" />)}</g>}
      {/* cara */}
      <circle cx={cx - 3.8} cy={hy + 1} r="1.4" fill="#1C1F28" />
      <circle cx={cx + 3.8} cy={hy + 1} r="1.4" fill="#1C1F28" />
      <path d={`M${cx - 3},${hy + 5.5} Q${cx},${hy + 8} ${cx + 3},${hy + 5.5}`} stroke="#3A1A1A" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {mujer && <circle cx={cx - 11} cy={hy + 3} r="1.3" fill="#F0B93C" />}
    </g>
  );
}

export function NaveTour({ id, pose = 'senalando', conCosmo = true }: { id: string; pose?: CosmoPose; conCosmo?: boolean }) {
  const c = COSMO_POSES[pose];
  return (
    <svg className="nt" viewBox="0 0 640 260" overflow="visible" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-cabina`}><path d="M462,108 A70,70 0 0 1 602,108 Z" /></clipPath>
        {VENTANAS.map((x, i) => (
          <clipPath key={i} id={`${id}-v${i}`}><circle cx={x} cy="146" r="22" /></clipPath>
        ))}
        <radialGradient id={`${id}-fuego`} cx="1" cy=".5" r="1">
          <stop offset="0" stopColor="#BFD4FF" />
          <stop offset=".35" stopColor="#4C87FF" stopOpacity=".9" />
          <stop offset="1" stopColor="#3B6EFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* propulsores */}
      <g className="nt-fuego">
        <ellipse cx="22" cy="132" rx="38" ry="10" fill={`url(#${id}-fuego)`} />
        <ellipse cx="22" cy="164" rx="38" ry="10" fill={`url(#${id}-fuego)`} />
      </g>
      <rect x="34" y="122" width="22" height="20" rx="5" fill="#161C36" />
      <rect x="34" y="154" width="22" height="20" rx="5" fill="#161C36" />

      {/* aletas */}
      <path d="M96,104 L70,58 L104,58 L150,104 Z" fill="#161C36" />
      <path d="M96,190 L70,226 L104,226 L150,190 Z" fill="#161C36" />
      <path d="M78,64 L100,64" stroke="#3B6EFF" strokeWidth="4" strokeLinecap="round" />

      {/* cabina de Cosmo (detrás del casco) */}
      <path d="M462,108 A70,70 0 0 1 602,108 Z" fill="#0D1330" />
      {conCosmo && (
        <g clipPath={`url(#${id}-cabina)`}>
          <svg x="466" y="40" width="132" height="191" viewBox="0 49 300 435" overflow="visible">
            <g dangerouslySetInnerHTML={{ __html: c.svg }} />
          </svg>
        </g>
      )}
      <path d="M462,108 A70,70 0 0 1 602,108 Z" fill="#BFD4FF" fillOpacity=".07" stroke="#BFD4FF" strokeOpacity=".45" strokeWidth="2" />
      <path d="M476,92 A56,56 0 0 1 506,56" stroke="#fff" strokeOpacity=".3" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* casco */}
      <path d="M70,104 H500 C576,104 628,126 632,148 C628,170 576,194 500,194 H70 C50,194 40,176 40,149 C40,122 50,104 70,104 Z" fill="#0B0F1E" />
      <path d="M70,104 H500 C576,104 628,126 632,148 C628,170 576,194 500,194 H70 C50,194 40,176 40,149 C40,122 50,104 70,104 Z" fill="none" stroke="#3B6EFF" strokeOpacity=".6" strokeWidth="2.4" />
      <path d="M72,112 H498 C560,112 600,126 612,138" stroke="#BFD4FF" strokeOpacity=".16" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="60" y="178" width="470" height="6" rx="3" fill="#161C36" />

      {/* ventanas con pasajeros */}
      {VENTANAS.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="146" r="25" fill="#161C36" />
          <circle cx={x} cy="146" r="22" fill="#14204D" />
          <g clipPath={`url(#${id}-v${i})`}>
            <Pasajero i={i} cx={x} cy={146} />
          </g>
          <circle cx={x} cy="146" r="22" fill="#BFD4FF" fillOpacity=".06" stroke="#BFD4FF" strokeOpacity=".4" strokeWidth="1.6" />
          <path d={`M${x - 13},${134} A16,16 0 0 1 ${x - 3},${127}`} stroke="#fff" strokeOpacity=".35" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </g>
      ))}

      {/* luces SH en la quilla */}
      {[90, 150, 210, 270, 330, 390, 450, 510].map((x, i) => (
        <circle key={x} className="nv-luz" cx={x} cy="181" r="2.4" fill="#fff" style={{ animationDelay: `${i * -0.3}s` }} />
      ))}
      <path d={STAR} fill="#3B6EFF" transform="translate(560 160) scale(1.5)" />
      <path d={STAR} fill="#F0B93C" transform="translate(84 84) scale(1.1)" />
    </svg>
  );
}
