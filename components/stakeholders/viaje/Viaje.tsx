'use client';

/* ============================================================
   VIAJE POR ESTACIONES · /contabilidad
   Un scroll (o swipe) = un viaje. El scroll solo activa: cada
   sección se "ancla" (scroll-snap) y al llegar se dispara su
   animación completa, por tiempo y en menos de 1 s.

   Capas fijas (detrás del contenido, sobre las estrellas):
   - sistema solar lejano (planetas flotando, parallax)
   - planeta gigante del hero + empresario cayendo + portal SH
   - estela de velocidad al cambiar de estación
   Encima del contenido: la nave guía, su burbuja y el mapa.
   ============================================================ */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Lead, Maletin, Factura, type Animo, type PoseBrazos } from './Lead';
import { Nave, PortalSH, portalProgreso } from './Nave';
import { Planeta, PlanetaHorizonte, type Variante } from './Planeta';
import type { CosmoPose } from '../cosmo/poses';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Narración de Cosmo por estación */
const FRASES: Record<number, string> = {
  2: 'Te llevo por los cuatro principios que no negociamos.',
  3: 'Seis paradas, y en todas voy contigo.',
  4: 'Primero entiendo tu empresa. Después, los números.',
  5: '¿Cuántas facturas emites? Te llevo al planeta indicado.',
};
const FRASE_PORTAL = '¡Aguanta, ya voy por ti!';
const FRASE_RESCATE = 'Te tengo. Conmigo no vuelves a caer.';

/** Cosmo y el empresario a bordo: del miedo a la calma */
const TRIPULACION: Array<{ pose: CosmoPose; animo: Animo; brazos: PoseBrazos }> = [
  { pose: 'saludo', animo: 'miedo', brazos: 'agarrado' },
  { pose: 'saludo', animo: 'miedo', brazos: 'agarrado' },
  { pose: 'senalando', animo: 'nervioso', brazos: 'agarrado' },
  { pose: 'portal', animo: 'atento', brazos: 'abajo' },
  { pose: 'pensando', animo: 'tranquilo', brazos: 'abajo' },
  { pose: 'calculadora', animo: 'tranquilo', brazos: 'abajo' },
  { pose: 'celebrando', animo: 'feliz', brazos: 'arriba' },
];

/** Mapa lateral: un planeta por destino (sin nombres visibles) */
const MAPA: Array<{ k: number; c: string; etiqueta: string }> = [
  { k: 0, c: '#1E3A8A', etiqueta: 'Inicio' },
  { k: 2, c: '#3B6EFF', etiqueta: '¿Qué hacemos?' },
  { k: 3, c: '#8FB3F5', etiqueta: '¿Cómo trabajamos?' },
  { k: 4, c: '#24306E', etiqueta: '¿Por qué nosotros?' },
  { k: 5, c: '#D9A42F', etiqueta: 'Planes' },
  { k: 6, c: '#4C87FF', etiqueta: 'Agenda tu diagnóstico' },
];

/** Sistema solar lejano. x en % del ancho, y en altos de pantalla (la capa sube ½ pantalla por estación) */
const LEJOS: Array<{ v: Variante; s: number; x: number; y: number; anillo?: boolean; giro: number; soloEscritorio?: boolean }> = [
  { v: 'anillo', s: 64, x: 8, y: 0.15, anillo: true, giro: 70, soloEscritorio: true },
  { v: 'oro', s: 26, x: 91, y: 0.24, giro: 40 },
  { v: 'hielo', s: 96, x: 96, y: 1.14, giro: 80 },
  { v: 'piedra', s: 42, x: 2.5, y: 1.62, giro: 55 },
  { v: 'nebula', s: 130, x: 98, y: 2.02, giro: 90 },
  { v: 'oro', s: 54, x: 1.5, y: 2.42, anillo: true, giro: 60 },
  { v: 'hielo', s: 34, x: 94, y: 2.78, giro: 45, soloEscritorio: true },
  { v: 'anillo', s: 110, x: -2, y: 3.05, anillo: true, giro: 85 },
  { v: 'piedra', s: 70, x: 97, y: 3.42, giro: 65 },
];

const PAPELES: Array<{ tipo: 'f' | 'f1' | 'm'; x: number; y: number; w: number; d: number }> = [
  { tipo: 'f', x: -70, y: -10, w: 46, d: 0 },
  { tipo: 'm', x: 125, y: 38, w: 58, d: -1.2 },
  { tipo: 'f1', x: -38, y: 92, w: 38, d: -2.1 },
];

type Punto = { x: number; y: number; sc: number };

export interface ViajeOpciones {
  /** 'rescate': el empresario cae y Cosmo lo rescata (contabilidad). 'tour': la nave ya viaja desde el hero (nómina). */
  modo?: 'rescate' | 'tour';
  /** narración de Cosmo por estación */
  frases?: Record<number, string>;
  mapa?: Array<{ k: number; c: string; etiqueta: string }>;
  /** color del planeta gigante del hero */
  planeta?: Variante;
  /** estación del aterrizaje: ahí la nave guía desaparece */
  ultima?: number;
  /** contenido de la nave guía (por defecto, la nave de Cosmo con el empresario) */
  nave?: (est: number) => ReactNode;
  /** ancho base de la nave guía en px: [escritorio, móvil] */
  naveAncho?: [number, number];
  /** alto / ancho de la nave guía (para ubicar la burbuja) */
  naveProporcion?: number;
}

export function Viaje({
  modo = 'rescate', frases = FRASES, mapa = MAPA, planeta = 'hogar', ultima = 6, nave, naveAncho = [300, 220], naveProporcion = 0.6,
}: ViajeOpciones = {}) {
  const cfg = useRef({ modo, frases, ultima, naveAncho, naveProporcion });
  const [est, setEst] = useState(0);
  const lejosRef = useRef<HTMLDivElement>(null);
  const gigRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const guiaRef = useRef<HTMLDivElement>(null);
  const burbujaRef = useRef<HTMLDivElement>(null);
  const estelaRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('vj-js', 'vj-snap');
    const { frases, ultima, naveAncho, naveProporcion } = cfg.current;
    const tour = cfg.current.modo === 'tour';
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const secciones = Array.from(document.querySelectorAll<HTMLElement>('[data-estacion]'));
    const gig = gigRef.current, lead = leadRef.current, portal = portalRef.current;
    const guia = guiaRef.current, burbuja = burbujaRef.current, lejos = lejosRef.current, estela = estelaRef.current;
    if (!gig || !guia || !burbuja || !lejos || !estela) return;
    if (!tour && (!lead || !portal)) return;
    const span = burbuja.querySelector('span') as HTMLSpanElement;
    const rayo = () => guia.querySelector<SVGElement>('.nv-rayo');
    const tripulante = () => guia.querySelector<SVGElement>('.nv-tripulante');

    const S = {
      k: -1, z: 0, r: 0, s: 0,
      W: 0, H: 0, movil: false, Y0: 0, lx0: 0, ly0: 0, naveW: 300,
      vuelo: { t0: -1, de: { x: 0, y: 0, sc: 0 } as Punto },
      nave: { x: 0, y: 0, sc: 0, rot: 0 },
      rescate: { x: 0, y: 0, sc: 0 } as Punto,
      llegada: 0, texto: '', hastaBurbuja: 0,
      estela: { t0: -1, dir: 1, lineas: [] as Array<{ x: number; y: number; l: number; v: number; a: number }> },
      ultimoMov: 0, corriendo: false, last: 0, raf: 0,
    };

    /* ── medidas (al montar y al cambiar el tamaño) ── */
    const medir = () => {
      const W = window.innerWidth, H = window.innerHeight;
      const movil = W < 900;
      S.W = W; S.H = H; S.movil = movil;
      S.naveW = movil ? naveAncho[1] : naveAncho[0];
      guia.style.width = `${S.naveW}px`;
      const copia = document.querySelector<HTMLElement>('.vj-hero__copy');
      const r = copia?.getBoundingClientRect();
      const abajo = r ? r.bottom + window.scrollY : H * 0.5;
      const derecha = r ? r.right : W * 0.75;
      const D = movil ? Math.max(2.3 * W, 1.05 * H) : Math.max(1.5 * W, 1.45 * H);
      const Y0 = Math.min(H * (movil ? 0.82 : 0.76), Math.max(H * (movil ? 0.62 : 0.58), abajo + H * (movil ? 0.1 : 0.05)));
      S.Y0 = Y0;
      gig.style.setProperty('--pl', `${D}px`);
      gig.style.setProperty('--cap', `${H - Y0 + H * 0.16}px`);
      gig.style.left = `${W / 2 - D / 2}px`;
      gig.style.top = `${Y0}px`;
      S.lx0 = movil ? W * 0.8 : Math.min(W - 70, Math.max(W * 0.8, derecha + 90));
      S.ly0 = movil ? lerp(abajo, Y0, 0.45) : Y0 - H * 0.13;
      lejos.style.setProperty('--h', `${H}px`);
      if (S.k >= 0) lejos.style.transform = `translate3d(0,${-S.k * 0.5 * H}px,0)`;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      estela.width = W * dpr; estela.height = H * dpr;
      estela.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const estacionActual = () => {
      let k = 0;
      for (const s of secciones) if (s.getBoundingClientRect().top <= S.H * 0.45) k = Number(s.dataset.estacion);
      return k;
    };

    /* números del tablero: cuentan al llegar */
    const contar = (sec: Element | undefined) => {
      sec?.querySelectorAll<HTMLElement>('.vj-num').forEach((el) => {
        const to = Number(el.dataset.to) || 0;
        if (quieto) { el.textContent = String(to); return; }
        const t0 = performance.now();
        const paso = (now: number) => {
          const t = clamp01((now - t0 - 250) / 800);
          el.textContent = String(Math.round(to * easeOut(t)));
          if (t < 1) requestAnimationFrame(paso);
        };
        el.textContent = '0';
        requestAnimationFrame(paso);
      });
    };

    const cambio = (k: number, now: number, inicial: boolean) => {
      const prev = S.k;
      S.k = k;
      setEst(k);
      secciones.forEach((s) => s.classList.toggle('vj-on', Number(s.dataset.estacion) === k));
      lejos.style.transform = `translate3d(0,${-k * 0.5 * S.H}px,0)`;
      S.llegada = now;
      S.hastaBurbuja = now + (k === 1 && !tour ? 6200 : k === 0 ? 7000 : 4600);
      contar(secciones.find((s) => Number(s.dataset.estacion) === k));
      if (inicial) {
        // entra directo a una estación (enlace con #): sin rescate ni vuelo
        if (tour) { S.r = 1; if (k >= 1) S.s = 1; }
        else {
          if (k >= 1) { S.z = 1; S.r = 1; }
          if (k >= 2) S.s = 1;
        }
        S.vuelo.t0 = -1;
        return;
      }
      S.vuelo = { t0: now, de: { x: S.nave.x, y: S.nave.y, sc: S.nave.sc } };
      if (!quieto && prev >= 0) {
        S.estela.t0 = now;
        S.estela.dir = k > prev ? 1 : -1;
        const n = S.movil ? 26 : 48;
        S.estela.lineas = Array.from({ length: n }, () => ({
          x: Math.random() * S.W, y: Math.random() * S.H, l: 40 + Math.random() * 150, v: 0.6 + Math.random() * 1.4, a: 0.12 + Math.random() * 0.4,
        }));
      }
    };

    const anclaDe = (k: number): (Punto & { modo: string }) | null => {
      const sec = secciones.find((s) => Number(s.dataset.estacion) === k);
      const a = sec?.querySelector<HTMLElement>('[data-ancla-nave]');
      if (!a) return null;
      const r = a.getBoundingClientRect();
      const [scD, scM] = (a.dataset.anclaEscala || '0.5,0.42').split(',').map(Number);
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, sc: S.movil ? scM : scD, modo: (S.movil ? a.dataset.anclaMovil : a.dataset.anclaNave) || 'arriba' };
    };

    /* ── capa cercana: planeta gigante, empresario, portal ── */
    const dibujarCerca = () => {
      const { W, H, movil, r } = S;
      if (tour) {
        // la nave ya viaja: el planeta del hero solo se hunde al partir
        const h = easeInOut(S.s);
        gig.style.transform = `translate3d(0,${h * H * 0.75}px,0) rotate(${-4 * h}deg)`;
        gig.style.visibility = h >= 1 ? 'hidden' : '';
        return;
      }
      if (!lead || !portal) return;
      const e = easeInOut(S.z);
      const hunde = easeInOut(S.s);
      gig.style.transform = `translate3d(${-(S.lx0 - W / 2) * 0.3 * e}px,${H * 0.1 * e + hunde * H * 0.75}px,0) rotate(${-5 * e}deg) scale(${1 + 0.22 * e})`;
      gig.style.visibility = hunde >= 1 ? 'hidden' : '';

      // portal sobre el empresario
      const P = { x: W * 0.5, y: H * (movil ? 0.3 : 0.28) };
      const pp = r < 0.5 ? seg(r, 0.08, 0.5) * 0.6 : 0.6 + seg(r, 0.5, 0.62) * 0.4;
      const cierra = seg(r, 0.86, 0.98);
      portalProgreso(portal, pp);
      portal.style.opacity = String(Math.min(1, pp * 6) * (1 - cierra) * (1 - hunde));
      portal.style.transform = `translate3d(${P.x}px,${P.y}px,0) translate(-50%,-50%) scale(${1 - cierra * 0.6})`;

      // la nave sale del portal y se queda sobre él
      const sale = easeOut(seg(r, 0.5, 0.64));
      S.rescate = { x: P.x, y: lerp(P.y, P.y + H * 0.03, sale), sc: lerp(0.06, 1, sale) };

      // empresario: la cámara se acerca y luego el rayo lo sube
      const atrapa = easeInOut(seg(r, 0.66, 0.8));
      let x = lerp(S.lx0, W * 0.5, e);
      let y = lerp(S.ly0, H * (movil ? 0.6 : 0.63), e);
      let sc = lerp(1, movil ? 3.2 : 3.6, e);
      x = lerp(x, S.rescate.x, atrapa);
      y = lerp(y, S.rescate.y, atrapa);
      sc *= lerp(1, 0.22, atrapa);
      lead.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${sc})`;
      lead.style.opacity = String((1 - seg(r, 0.76, 0.8)) * (1 - hunde));

      const ry = rayo();
      if (ry) ry.style.opacity = String(seg(r, 0.62, 0.66) * (1 - seg(r, 0.83, 0.87)));
      const tr = tripulante();
      if (tr) tr.style.opacity = String(seg(r, 0.77, 0.82));
    };

    /* ── nave guía ── */
    let modo = 'arriba';
    const dibujarNave = (now: number, dt: number) => {
      const k = S.k;
      const sale = easeOut(seg(S.r, 0.5, 0.64));
      let obj: Punto;
      if (!tour && k <= 1) { obj = S.rescate; modo = 'arriba'; }
      else {
        const a = anclaDe(k);
        if (a) { obj = { x: a.x, y: a.y, sc: a.sc * Math.max(0.06, sale) }; modo = a.modo; }
        else obj = { x: S.nave.x, y: S.nave.y, sc: S.nave.sc };
      }
      let x = obj.x, y = obj.y, sc = obj.sc;
      const t = S.vuelo.t0 < 0 || quieto ? 1 : clamp01((now - S.vuelo.t0) / 850);
      if (t < 1) {
        const e = easeInOut(t);
        x = lerp(S.vuelo.de.x, obj.x, e);
        y = lerp(S.vuelo.de.y, obj.y, e) - Math.sin(Math.PI * t) * Math.min(110, S.H * 0.12);
        sc = lerp(S.vuelo.de.sc, obj.sc, e);
      }
      const vx = dt > 0 ? (x - S.nave.x) / dt : 0;
      const rot = quieto ? 0 : lerp(S.nave.rot, Math.max(-16, Math.min(16, vx * 9)), 0.18);
      S.nave = { x, y, sc, rot };
      guia.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${sc}) rotate(${rot}deg)`;
      const visible = tour ? k < ultima : k >= 1 && k < ultima;
      guia.style.opacity = String(visible ? seg(S.r, 0.5, 0.53) : 0);
      return t;
    };

    /* ── burbuja de Cosmo ── */
    const dibujarBurbuja = (now: number, vuelo: number) => {
      const { k, r, W, H } = S;
      let texto = '';
      let ax = S.nave.x, ay = S.nave.y, m = modo;
      const w = S.naveW * S.nave.sc, h = w * naveProporcion;
      if (!tour && k === 1 && r >= 0.1 && r < 0.5) {
        texto = FRASE_PORTAL; m = 'arriba';
        const pw = portal?.offsetWidth ?? 200;
        ax = W * 0.5; ay = H * (S.movil ? 0.3 : 0.28) - pw * 0.42;
      } else if (!tour && k === 1 && r >= 0.8 && now < S.hastaBurbuja) {
        texto = FRASE_RESCATE;
        ay = S.nave.y - h * 0.5;
      } else if ((tour || k >= 2) && k < ultima && frases[k] && vuelo > 0.8 && now < S.hastaBurbuja && now - S.llegada > (k === 0 ? 600 : 0)) {
        texto = frases[k];
        ay = S.nave.y - h * 0.5;
      }
      const on = texto !== '';
      if (on && texto !== S.texto) { span.textContent = texto; S.texto = texto; }
      burbuja.classList.toggle('vj-burbuja--on', on);
      if (!on) return;
      burbuja.dataset.modo = m;
      const bw = burbuja.offsetWidth, bh = burbuja.offsetHeight;
      let left: number, top: number;
      if (m === 'der') { left = ax + w * 0.5 + 10; top = S.nave.y - h * 0.15 - bh / 2; }
      else if (m === 'izq') { left = ax - w * 0.5 - 10 - bw; top = S.nave.y - h * 0.15 - bh / 2; }
      else { left = ax - bw / 2; top = ay - 10 - bh; }
      const minTop = S.movil ? 64 : 72;
      left = Math.max(8, Math.min(W - bw - 8, left));
      top = Math.max(minTop, Math.min(H - bh - 8, top));
      burbuja.style.setProperty('--flecha', `${Math.max(16, Math.min(bw - 16, ax - left))}px`);
      burbuja.style.transform = `translate3d(${left}px,${top}px,0)`;
    };

    /* ── estela de velocidad al viajar ── */
    const ctx = estela.getContext('2d');
    let estelaSucia = false;
    const dibujarEstela = (now: number, dt: number) => {
      if (!ctx) return;
      const t = S.estela.t0 < 0 ? 1 : (now - S.estela.t0) / 800;
      if (t >= 1) {
        if (estelaSucia) { ctx.clearRect(0, 0, S.W, S.H); estelaSucia = false; }
        return;
      }
      const fuerza = Math.sin(Math.PI * Math.min(1, t * 1.15)) ;
      ctx.clearRect(0, 0, S.W, S.H);
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.3;
      for (const ln of S.estela.lineas) {
        ln.y -= S.estela.dir * dt * ln.v * (1.2 + fuerza * 2.6);
        if (ln.y < -ln.l * 2) ln.y += S.H + ln.l * 2;
        if (ln.y > S.H + ln.l) ln.y -= S.H + ln.l * 2;
        const largo = ln.l * (0.3 + fuerza);
        ctx.strokeStyle = `rgba(191,212,255,${(ln.a * fuerza).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(ln.x, ln.y); ctx.lineTo(ln.x, ln.y + largo * S.estela.dir); ctx.stroke();
      }
      estelaSucia = true;
    };

    const frame = (now: number) => {
      const dt = Math.min(50, now - S.last);
      S.last = now;
      const k = estacionActual();
      if (k !== S.k) cambio(k, now, false);
      const paso = (v: number, objetivo: number, dur: number) =>
        quieto ? objetivo : v < objetivo ? Math.min(objetivo, v + dt / dur) : Math.max(objetivo, v - dt / dur);
      if (tour) {
        S.z = 0; S.r = 1;
        S.s = paso(S.s, S.k >= 1 ? 1 : 0, 900);
      } else {
        S.z = paso(S.z, S.k >= 1 ? 1 : 0, 850);
        S.r = S.k >= 1 ? paso(S.r, 1, 1700) : paso(S.r, 0, 380);
        S.s = paso(S.s, S.k >= 2 ? 1 : 0, 900);
      }
      dibujarCerca();
      const vuelo = dibujarNave(now, dt);
      dibujarBurbuja(now, vuelo);
      dibujarEstela(now, dt);

      const ocupado = now - S.ultimoMov < 700 || (S.z > 0 && S.z < 1) || (S.r > 0 && S.r < 1) || (S.s > 0 && S.s < 1)
        || vuelo < 1 || (S.estela.t0 >= 0 && now - S.estela.t0 < 820) || now < S.hastaBurbuja + 50;
      if (ocupado) S.raf = requestAnimationFrame(frame);
      else S.corriendo = false;
    };

    const despertar = () => {
      S.ultimoMov = performance.now();
      if (!S.corriendo) {
        S.corriendo = true;
        S.last = performance.now();
        S.raf = requestAnimationFrame(frame);
      }
    };
    const alCambiarTam = () => { medir(); despertar(); };

    /* ── escritorio: un gesto de rueda o una tecla = un viaje a la siguiente estación.
       (El scroll-snap nativo regresa al punto de partida si el gesto es corto.) */
    const anclado = window.matchMedia('(min-width: 1100px) and (min-height: 620px)');
    let bloqueo = 0;
    const viajar = (dir: number) => {
      let i = 0;
      secciones.forEach((s, j) => { if (s.getBoundingClientRect().top <= S.H * 0.3) i = j; });
      const actual = secciones[i];
      const r = actual.getBoundingClientRect();
      // dentro de una estación más alta que la pantalla (formulario) se desplaza normal
      if (dir > 0 && r.bottom > S.H + 4) return false;
      if (dir < 0 && r.top < -4) return false;
      const destino = secciones[i + dir];
      if (!destino) return false;
      window.scrollTo({ top: destino.getBoundingClientRect().top + window.scrollY, behavior: quieto ? 'auto' : 'smooth' });
      return true;
    };
    const alRodar = (ev: WheelEvent) => {
      if (ev.ctrlKey || !anclado.matches || Math.abs(ev.deltaY) < Math.abs(ev.deltaX)) return;
      const now = performance.now();
      const dir = Math.sign(ev.deltaY);
      if (!dir) return;
      if (now < bloqueo) {
        // la inercia del trackpad sigue llegando: se espera a que pare
        ev.preventDefault();
        bloqueo = Math.max(bloqueo, now + 140);
        return;
      }
      if (Math.abs(ev.deltaY) < 4) return;
      if (viajar(dir)) { ev.preventDefault(); bloqueo = now + 750; }
    };
    const alTeclear = (ev: KeyboardEvent) => {
      if (!anclado.matches || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      const el = ev.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName))) return;
      const dir = ev.key === 'ArrowDown' || ev.key === 'PageDown' || (ev.key === ' ' && !ev.shiftKey) ? 1
        : ev.key === 'ArrowUp' || ev.key === 'PageUp' || (ev.key === ' ' && ev.shiftKey) ? -1 : 0;
      if (!dir) return;
      const now = performance.now();
      if (now < bloqueo) { ev.preventDefault(); return; }
      if (viajar(dir)) { ev.preventDefault(); bloqueo = now + 600; }
    };
    window.addEventListener('wheel', alRodar, { passive: false });
    window.addEventListener('keydown', alTeclear);

    medir();
    const k0 = estacionActual();
    cambio(k0, performance.now(), true);
    if (tour) S.r = 1;
    const a0 = k0 >= (tour ? 0 : 2) ? anclaDe(k0) : null;
    if (a0) S.nave = { x: a0.x, y: a0.y, sc: a0.sc, rot: 0 };
    despertar();

    window.addEventListener('scroll', despertar, { passive: true });
    window.addEventListener('resize', alCambiarTam);
    return () => {
      cancelAnimationFrame(S.raf);
      window.removeEventListener('scroll', despertar);
      window.removeEventListener('resize', alCambiarTam);
      window.removeEventListener('wheel', alRodar);
      window.removeEventListener('keydown', alTeclear);
      html.classList.remove('vj-js', 'vj-snap');
    };
  }, []);

  const irA = (k: number) => {
    const el = document.querySelector(`[data-estacion="${k}"]`);
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el?.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'start' });
  };

  const t = TRIPULACION[est] ?? TRIPULACION[0];

  return (
    <>
      {/* mundo: detrás del contenido */}
      <div className="vj-mundo" aria-hidden="true">
        <div className="vj-lejos" ref={lejosRef}>
          {LEJOS.map((p, i) => (
            <div
              key={i}
              className={`vj-astro ${p.soloEscritorio ? 'vj-astro--escritorio' : ''}`}
              style={{ left: `${p.x}%`, ['--y' as string]: p.y, ['--s' as string]: `${p.s}px` }}
            >
              <Planeta v={p.v} anillo={p.anillo} giro={p.giro} inclinacion={-10 - (i % 3) * 6} />
            </div>
          ))}
        </div>
        <div className="vj-gigante" ref={gigRef}>
          <PlanetaHorizonte v={planeta} giro={150} rep={3} fraccion={0.3} />
        </div>
        {modo === 'rescate' && <div className="vj-portal" ref={portalRef}><PortalSH /></div>}
        {modo === 'rescate' && <div className="vj-lead" ref={leadRef}>
          <div className="vj-lead__giro">
            <svg viewBox="0 -40 200 360" overflow="visible"><Lead animo="terror" brazos="agitando" despeinado /></svg>
          </div>
          {PAPELES.map((p, i) => (
            <div key={i} className="vj-papel" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, animationDelay: `${p.d}s` }}>
              <svg viewBox="-4 -4 72 64">{p.tipo === 'm' ? <Maletin /> : <Factura tono={p.tipo === 'f1' ? 1 : 0} />}</svg>
            </div>
          ))}
        </div>}
      </div>
      <canvas className="vj-estela" ref={estelaRef} aria-hidden="true" />

      {/* nave guía: Cosmo con el empresario a bordo */}
      <div className="vj-guia" ref={guiaRef} aria-hidden="true">
        <div className="vj-guia__cuerpo">
          {nave ? nave(est) : <Nave id="guia" pose={t.pose} animo={t.animo} brazos={t.brazos} />}
        </div>
      </div>
      <div className="vj-burbuja-guia" ref={burbujaRef} aria-hidden="true"><span /></div>

      {/* mapa lateral de planetas */}
      <nav className="vj-mapa" aria-label="Recorrido">
        {mapa.map((m) => {
          const activo = est === m.k || (m.k === 0 && est === 1);
          return (
            <button
              key={m.k}
              type="button"
              className={`vj-mapa__punto ${activo ? 'vj-mapa__punto--on' : ''} ${est > m.k ? 'vj-mapa__punto--hecho' : ''}`}
              style={{ ['--c' as string]: m.c }}
              aria-label={m.etiqueta}
              aria-current={activo ? 'step' : undefined}
              onClick={() => irA(m.k)}
            />
          );
        })}
      </nav>
    </>
  );
}
