'use client';

/* ============================================================
   RUTA + CARRUSEL · la nave viaja entre marcas (estrellas,
   planetas, faros) y la tarjeta activa se centra.
   El progreso lo entrega la escena con rutaProgreso(root, p).
   ============================================================ */

import type { ReactNode } from 'react';
import { Nave } from './Nave';
import type { CosmoPose } from '../cosmo/poses';
import type { Animo, PoseBrazos } from './Lead';
import { clamp01 } from './motor';

const STAR = 'M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z';

export interface ItemRuta {
  key: string;
  marca: 'estrella' | 'planeta' | 'faro';
  tamano?: number;
  color?: string;
  etiqueta?: string;
  contenido: ReactNode;
}

function Marca({ it, i }: { it: ItemRuta; i: number }) {
  const t = it.tamano ?? 30;
  if (it.marca === 'estrella') {
    return (
      <svg viewBox="-12 -12 24 24" width={t} height={t} overflow="visible">
        <circle r="11" fill={i % 2 ? '#BFD4FF' : '#3B6EFF'} opacity=".18" className="rc-halo" />
        <path d={STAR} fill={i % 2 ? '#FFFFFF' : '#3B6EFF'} />
      </svg>
    );
  }
  if (it.marca === 'faro') {
    return (
      <svg viewBox="-16 -20 32 40" width={t} height={t * 1.25} overflow="visible">
        <circle r="13" cy="-8" fill="none" stroke="#3B6EFF" strokeOpacity=".6" className="rc-onda" />
        <line x1="0" y1="-6" x2="0" y2="16" stroke="#8B9099" strokeWidth="2.4" />
        <path d="M-8,18 L0,8 L8,18Z" fill="#2A3150" />
        <circle cy="-8" r="4.5" fill="#F0B93C" />
      </svg>
    );
  }
  const color = it.color ?? '#1B2A6B';
  return (
    <svg viewBox="-30 -30 60 60" width={t} height={t} overflow="visible">
      <circle r="22" fill={color} />
      <circle r="22" fill="#000" opacity=".22" style={{ clipPath: 'inset(0 0 0 50%)' }} />
      <circle cx="-8" cy="-7" r="4" fill="#fff" opacity=".12" />
      <circle cx="6" cy="9" r="2.6" fill="#fff" opacity=".1" />
      <ellipse rx="30" ry="7" fill="none" stroke="#BFD4FF" strokeOpacity=".45" strokeWidth="1.6" transform="rotate(-18)" />
      {it.etiqueta && (
        <text y="4.5" textAnchor="middle" fontSize="13" fontWeight="600" fill="#fff" fontFamily="var(--mono)">{it.etiqueta}</text>
      )}
    </svg>
  );
}

export function RutaCarrusel({
  id,
  items,
  pose,
  animo,
  brazos = 'agarrado',
  frase,
  grilla = false,
  onIr,
  etiquetaPuntos,
}: {
  id: string;
  items: ItemRuta[];
  pose: CosmoPose;
  animo: Animo;
  brazos?: PoseBrazos;
  frase: string;
  /** en escritorio todas las tarjetas visibles (precios) */
  grilla?: boolean;
  onIr: (i: number) => void;
  etiquetaPuntos: string;
}) {
  const n = items.length;
  return (
    <div className={`rc ${grilla ? 'rc--grilla' : ''}`} data-n={n} id={id}>
      <div className="rc-ruta">
        <svg className="rc-linea" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
          <path
            d={items.map((_, i) => `${i ? 'L' : 'M'}${posX(i, n) * 10},${posY(i)}`).join(' ')}
            fill="none" stroke="#BFD4FF" strokeOpacity=".28" strokeWidth="2" strokeDasharray="4 10" vectorEffect="non-scaling-stroke"
          />
          <path
            className="rc-linea-hecha"
            d={items.map((_, i) => `${i ? 'L' : 'M'}${posX(i, n) * 10},${posY(i)}`).join(' ')}
            fill="none" stroke="#3B6EFF" strokeWidth="2.4" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray="1" strokeDashoffset="1"
          />
        </svg>
        {items.map((it, i) => (
          <div key={it.key} className="rc-marca" style={{ left: `${posX(i, n)}%`, top: `${posY(i)}%` }}>
            <Marca it={it} i={i} />
          </div>
        ))}
        <div className="rc-nave">
          <div className="vj-burbuja rc-burbuja" aria-hidden="true"><span>{frase}</span></div>
          <div className="rc-nave-cuerpo">
            <Nave id={`${id}-nave`} pose={pose} animo={animo} brazos={brazos} />
          </div>
        </div>
      </div>

      <div className="rc-ventana">
        <div className="rc-pista">
          {items.map((it) => (
            <div key={it.key} className="rc-slide">{it.contenido}</div>
          ))}
        </div>
      </div>

      <div className="rc-puntos" role="group" aria-label={etiquetaPuntos}>
        {items.map((it, i) => (
          <button key={it.key} type="button" className="rc-punto" aria-label={`${i + 1} de ${n}`} onClick={() => onIr(i)} />
        ))}
      </div>
    </div>
  );
}

/* posiciones de las marcas en la ruta (en %). En modo grilla, centradas sobre cada columna. */
export const posX = (i: number, n: number, grilla = false) =>
  grilla ? ((i + 0.5) / n) * 100 : n === 1 ? 50 : 6 + (i * 88) / (n - 1);
const pathD = (n: number, grilla: boolean) =>
  Array.from({ length: n }, (_, i) => `${i ? 'L' : 'M'}${posX(i, n, grilla) * 10},${posY(i)}`).join(' ');
export const posY = (i: number) => (i % 2 ? 62 : 38);

/** Índice flotante con pausas en cada tarjeta */
export function indiceConPausa(p: number, n: number) {
  const s = clamp01(p) * (n - 1);
  const i = Math.min(n - 2, Math.floor(s));
  if (n < 2) return 0;
  const t = s - i;
  const e = clamp01((t - 0.22) / 0.56);
  return i + e * e * (3 - 2 * e);
}

/** p de la escena en el que la tarjeta i queda centrada */
export const progresoDe = (i: number, n: number) => (n < 2 ? 0 : i / (n - 1));

const estado = new WeakMap<Element, { f: number; vel: number; grilla: boolean }>();

/** Actualiza ruta y carrusel. p: 0..1 del tramo del carrusel. */
export function rutaProgreso(root: HTMLElement | null, p: number, t: number, mostrarFrase: boolean, swipe = false) {
  if (!root) return;
  const n = Number(root.dataset.n) || 1;
  const ventana = root.querySelector<HTMLElement>('.rc-ventana');
  const s0 = root.querySelector<HTMLElement>('.rc-slide');
  const enGrilla = root.classList.contains('rc--grilla') && window.innerWidth >= 1000;
  // modo swipe: el índice sale del desplazamiento horizontal de la ventana
  const conSwipe = swipe && !enGrilla && ventana && s0;
  root.classList.toggle('rc--swipe', Boolean(conSwipe));
  const f = conSwipe
    ? Math.max(0, Math.min(n - 1, ventana.scrollLeft / (s0.offsetWidth + 20)))
    : indiceConPausa(p, n);
  const grilla = root.classList.contains('rc--grilla') && window.innerWidth >= 1000;
  const st = estado.get(root) ?? { f, vel: 0, grilla: !grilla };
  if (st.grilla !== grilla) {
    // reacomoda marcas y línea al cambiar entre carrusel y grilla
    st.grilla = grilla;
    root.querySelectorAll<HTMLElement>('.rc-marca').forEach((m, i) => { m.style.left = `${posX(i, n, grilla)}%`; });
    root.querySelectorAll<SVGPathElement>('.rc-linea path').forEach((pth) => pth.setAttribute('d', pathD(n, grilla)));
  }
  st.vel += (f - st.f - st.vel) * 0.3;
  st.f = f;
  estado.set(root, st);
  const activo = Math.round(f);

  // nave sobre la ruta (interpola entre marcas)
  const i0 = Math.floor(f), i1 = Math.min(n - 1, i0 + 1), k = f - i0;
  const x = posX(i0, n, grilla) + (posX(i1, n, grilla) - posX(i0, n, grilla)) * k;
  const y = posY(i0) + (posY(i1) - posY(i0)) * k;
  const nave = root.querySelector<HTMLElement>('.rc-nave');
  if (nave) {
    nave.style.left = `${x}%`;
    nave.style.top = `${y}%`;
    const tilt = Math.max(-14, Math.min(14, st.vel * 160));
    const bob = Math.sin(t * 2.2) * 4;
    const cuerpo = nave.querySelector<HTMLElement>('.rc-nave-cuerpo');
    if (cuerpo) cuerpo.style.transform = `translateY(${bob}px) rotate(${tilt}deg)`;
  }
  const burbuja = root.querySelector<HTMLElement>('.rc-burbuja');
  if (burbuja) {
    burbuja.classList.toggle('vj-burbuja--on', mostrarFrase);
    burbuja.classList.toggle('rc-burbuja--izq', x > 58);
    burbuja.style.translate = '';
    if (mostrarFrase) {
      const r = burbuja.getBoundingClientRect();
      const vw = window.innerWidth;
      const dx = r.right > vw - 8 ? vw - 8 - r.right : r.left < 8 ? 8 - r.left : 0;
      if (dx) burbuja.style.translate = `${dx}px 0`;
    }
  }
  const hecha = root.querySelector<SVGPathElement>('.rc-linea-hecha');
  if (hecha) hecha.style.strokeDashoffset = String(1 - f / Math.max(1, n - 1));

  root.querySelectorAll<HTMLElement>('.rc-marca').forEach((m, i) => {
    const d = Math.abs(i - f);
    m.classList.toggle('rc-marca--on', i === activo);
    m.classList.toggle('rc-marca--hecha', i < f - 0.5);
    m.style.transform = `translate(-50%,-50%) scale(${1 + Math.max(0, 1 - d) * 0.35})`;
  });

  // carrusel
  const pista = root.querySelector<HTMLElement>('.rc-pista');
  const slides = root.querySelectorAll<HTMLElement>('.rc-slide');
  if (pista && slides.length) {
    if (grilla || conSwipe) {
      pista.style.transform = '';
      slides.forEach((s, i) => {
        s.style.opacity = ''; s.style.transform = '';
        s.classList.toggle('rc-slide--on', i === activo);
      });
    } else {
      const w = slides[0].offsetWidth;
      const gap = parseFloat(getComputedStyle(pista).columnGap || '20') || 20;
      const vw = (pista.parentElement as HTMLElement).offsetWidth;
      pista.style.transform = `translate3d(${vw / 2 - (f * (w + gap) + w / 2)}px,0,0)`;
      slides.forEach((s, i) => {
        const d = Math.min(1, Math.abs(i - f));
        s.style.opacity = String(1 - d * 0.62);
        s.style.transform = `scale(${1 - d * 0.07})`;
        s.classList.toggle('rc-slide--on', i === activo);
      });
    }
  }
  root.querySelectorAll<HTMLElement>('.rc-punto').forEach((b, i) => b.classList.toggle('rc-punto--on', i === activo));
}
