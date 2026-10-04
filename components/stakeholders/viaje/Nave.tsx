/* ============================================================
   NAVE DE COSMO · platillo casi negro con la constelación SH en
   luces, cúpula con Cosmo y el lead, rayo de rescate y patas.
   Sistema de coordenadas: 0 0 400 240 (el rayo sale por debajo).
   ============================================================ */

import { COSMO_POSES, type CosmoPose } from '../cosmo/poses';
import { Lead, type Animo, type PoseBrazos } from './Lead';

const STAR = 'M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z';

/* Mini constelación SH sobre el casco (mismos vértices del logo, aplanados) */
const SH_CASCO: Array<[number, number]> = [
  [96, 156], [126, 166], [168, 165], [192, 158], [208, 150], [232, 148], [272, 150], [302, 144],
];

export function Nave({
  id,
  pose = 'saludo',
  animo = 'nervioso',
  brazos = 'agarrado',
  conLead = true,
  conCosmo = true,
  rayo = false,
}: {
  id: string;
  pose?: CosmoPose;
  animo?: Animo;
  brazos?: PoseBrazos;
  conLead?: boolean;
  conCosmo?: boolean;
  rayo?: boolean;
}) {
  const c = COSMO_POSES[pose];
  return (
    <svg className="nv" viewBox="0 0 400 240" overflow="visible" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-cupula`}>
          <path d="M98,136 A102,102 0 0 1 302,136 Z" />
        </clipPath>
        <linearGradient id={`${id}-rayo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4C87FF" stopOpacity=".85" />
          <stop offset=".55" stopColor="#3B6EFF" stopOpacity=".28" />
          <stop offset="1" stopColor="#3B6EFF" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-brillo`}>
          <stop offset="0" stopColor="#4C87FF" stopOpacity=".9" />
          <stop offset="1" stopColor="#4C87FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* rayo de rescate */}
      <polygon className="nv-rayo" points="180,184 220,184 320,660 80,660" fill={`url(#${id}-rayo)`} style={{ opacity: rayo ? 1 : 0 }} />

      {/* patas de aterrizaje */}
      <g className="nv-patas" stroke="#2A3150" strokeWidth="6" strokeLinecap="round">
        <line x1="130" y1="170" x2="104" y2="226" />
        <line x1="270" y1="170" x2="296" y2="226" />
        <line x1="200" y1="186" x2="200" y2="230" />
        <g stroke="#3B6EFF" strokeWidth="5"><line x1="92" y1="228" x2="116" y2="228" /><line x1="284" y1="228" x2="308" y2="228" /><line x1="188" y1="232" x2="212" y2="232" /></g>
      </g>

      {/* cúpula: fondo, tripulación y vidrio */}
      <path d="M98,136 A102,102 0 0 1 302,136 Z" fill="#0D1330" />
      <g clipPath={`url(#${id}-cupula)`}>
        {conCosmo && (
          <svg x="98" y="12" width="138" height="177" viewBox="58 92 184 236" overflow="visible">
            <g dangerouslySetInnerHTML={{ __html: c.svg }} />
          </svg>
        )}
        {conLead && (
          <g className="nv-tripulante" transform="translate(186 26) scale(.64)">
            <Lead animo={animo} brazos={brazos} />
          </g>
        )}
      </g>
      <path d="M98,136 A102,102 0 0 1 302,136 Z" fill="#BFD4FF" fillOpacity=".07" stroke="#BFD4FF" strokeOpacity=".45" strokeWidth="2" />
      <path d="M116,108 A86,86 0 0 1 150,62" stroke="#fff" strokeOpacity=".3" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* casco */}
      <ellipse cx="200" cy="140" rx="156" ry="18" fill="#161C36" />
      <ellipse cx="200" cy="152" rx="190" ry="32" fill="#0B0F1E" />
      <ellipse cx="200" cy="152" rx="190" ry="32" fill="none" stroke="#3B6EFF" strokeOpacity=".6" strokeWidth="2.4" />
      <ellipse cx="200" cy="176" rx="98" ry="14" fill="#070A14" />
      <circle className="nv-emisor" cx="200" cy="182" r="22" fill={`url(#${id}-brillo)`} />
      <circle cx="200" cy="182" r="7" fill="#BFD4FF" />

      {/* constelación SH en luces */}
      <polyline points={SH_CASCO.map((p) => p.join(',')).join(' ')} fill="none" stroke="#BFD4FF" strokeOpacity=".55" strokeWidth="1.4" />
      {SH_CASCO.map(([x, y], i) => (
        <circle key={i} className="nv-luz" cx={x} cy={y} r="2.6" fill="#fff" style={{ animationDelay: `${i * -0.35}s` }} />
      ))}
      <path d={STAR} fill="#3B6EFF" transform="translate(84 152) scale(1.2)" />
      <path d={STAR} fill="#3B6EFF" transform="translate(316 140) scale(1.7)" />
    </svg>
  );
}

/* ============================================================
   PORTAL SH · el logo constelación se arma estrella por estrella
   y se abre como portal. Se controla con portalProgreso(root, p).
   ============================================================ */
const NODOS: Array<[number, number]> = [
  [100, 320], [148, 360], [232, 355], [280, 305], [256, 235], [200, 200], [144, 165], [120, 95], [168, 45], [252, 40], [300, 80],
];
const S_PATH = 'M100,320 L148,360 L232,355 L280,305 L256,235 L144,165 L120,95 L168,45 L252,40 L300,80';
const EJES = [
  [100, 80, 100, 320], [300, 80, 300, 320], [80, 80, 120, 80], [80, 320, 120, 320],
  [280, 80, 320, 80], [280, 320, 320, 320], [100, 200, 300, 200],
];

export function PortalSH() {
  return (
    <svg className="ps" viewBox="0 0 400 400" overflow="visible" aria-hidden="true">
      <defs>
        <radialGradient id="ps-vortice">
          <stop offset="0" stopColor="#000" />
          <stop offset=".55" stopColor="#0D1330" />
          <stop offset=".82" stopColor="#3B6EFF" stopOpacity=".55" />
          <stop offset="1" stopColor="#3B6EFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* vórtice (se abre al final) */}
      <g className="ps-vortice" style={{ transformOrigin: '200px 200px' }}>
        <circle cx="200" cy="200" r="190" fill="url(#ps-vortice)" />
        {[170, 140, 110, 80].map((r, i) => (
          <circle key={r} className="ps-anillo" cx="200" cy="200" r={r} fill="none" stroke={i % 2 ? '#BFD4FF' : '#3B6EFF'} strokeOpacity=".5" strokeWidth="2" strokeDasharray="6 14" style={{ animationDuration: `${6 + i * 2}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }} />
        ))}
      </g>
      {/* logo */}
      <g className="ps-logo" style={{ transformOrigin: '200px 200px' }}>
        <g stroke="#fff" strokeOpacity=".38" strokeWidth="1.4" strokeLinecap="round">
          {EJES.map(([x1, y1, x2, y2], i) => (
            <line key={i} className="ps-eje" x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
          ))}
        </g>
        <path className="ps-s" d={S_PATH} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
        {NODOS.map(([x, y], i) => (
          <g key={i} className="ps-nodo" style={{ transformOrigin: `${x}px ${y}px`, opacity: 0 }}>
            <circle cx={x} cy={y} r="10" fill="none" stroke="#fff" strokeOpacity=".35" />
            <circle cx={x} cy={y} r={i === 5 ? 6 : 5} fill="#fff" />
          </g>
        ))}
        <path className="ps-estrella" d={STAR} fill="#3B6EFF" transform="translate(100 320) scale(1.9)" style={{ opacity: 0 }} />
        <path className="ps-estrella" d={STAR} fill="#3B6EFF" transform="translate(300 80) scale(3)" style={{ opacity: 0 }} />
      </g>
    </svg>
  );
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Avanza la animación del portal: 0 = nada, .55 = logo completo, 1 = portal abierto */
export function portalProgreso(root: Element | null, p: number) {
  if (!root) return;
  const nodos = root.querySelectorAll<SVGGElement>('.ps-nodo');
  nodos.forEach((n, i) => {
    const t = easeOut(seg(p, 0.02 + i * 0.022, 0.1 + i * 0.022));
    n.style.opacity = String(t);
    n.style.transform = `scale(${0.2 + t * 0.8})`;
  });
  root.querySelectorAll<SVGLineElement>('.ps-eje').forEach((l) => {
    l.style.strokeDashoffset = String(1 - seg(p, 0.05, 0.3));
  });
  const s = root.querySelector<SVGPathElement>('.ps-s');
  if (s) s.style.strokeDashoffset = String(1 - easeOut(seg(p, 0.12, 0.45)));
  root.querySelectorAll<SVGPathElement>('.ps-estrella').forEach((e, i) => {
    const t = easeOut(seg(p, 0.38 + i * 0.06, 0.52 + i * 0.06));
    e.style.opacity = String(t);
  });
  // apertura: el logo gira y se encoge hacia el centro mientras el vórtice crece
  const ab = easeOut(seg(p, 0.58, 0.92));
  const logo = root.querySelector<SVGGElement>('.ps-logo');
  if (logo) {
    logo.style.transform = `rotate(${ab * 160}deg) scale(${1 - ab * 0.75})`;
    logo.style.opacity = String(1 - seg(p, 0.8, 0.96));
  }
  const v = root.querySelector<SVGGElement>('.ps-vortice');
  if (v) {
    v.style.opacity = String(seg(p, 0.5, 0.7));
    v.style.transform = `scale(${0.15 + ab * 0.85})`;
  }
}
