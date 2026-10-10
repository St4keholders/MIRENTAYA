'use client';

/* ============================================================
   INICIO · mapa de la constelación Stakeholders
   El mapa es la constelación del logo SH, centrado y quieto; el
   espacio a su alrededor fluye sin parar. Los cuatro servicios
   son sus estrellas principales y las líneas del logo, las rutas.
   La nave de Cosmo marca dónde estás: al escoger un servicio
   viaja por la ruta, la cámara la sigue y hace zoom, la estrella
   se vuelve la sede y aparece un panel con Entrar / Volver.
   ============================================================ */

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Stars from '../Stars';
import { Nave } from '../viaje/Nave';
import { Destello } from '../viaje/Orbita';
import { Sede, type SedeId } from './Sedes';
import { Constelacion } from './Constelacion';
import { Espacio } from './Espacio';
import '@/app/stakeholders.css';
import '@/app/servicios.css';
import '@/components/stakeholders/viaje/planeta.css';
import '@/components/stakeholders/viaje/viaje.css';
import './inicio.css';

/* Vértices de la constelación del logo SH (trazo de la S, de abajo arriba) */
const NODOS: Array<[number, number]> = [
  [100, 320], [148, 360], [232, 355], [280, 305], [256, 235], [200, 200], [144, 165], [120, 95], [168, 45], [252, 40], [300, 80],
];
const CASA = 5; // centro del logo: "usted está aquí"
const S_PATH = `M${NODOS.map((p) => p.join(',')).join(' L')}`;
const EJES = 'M100,80 V320 M300,80 V320 M80,80 H120 M80,320 H120 M280,80 H320 M280,320 H320 M100,200 H300';
const MENORES = [[60, 140], [340, 250], [210, 110], [70, 380], [330, 370], [180, 280], [40, 40], [360, 20], [230, 160], [320, 180]];

const SERVICIOS: Array<{
  id: SedeId; nodo: number; href: string; t: string; lado: 'izq' | 'der';
  linea: string; detalle: string; tour: string; pad: [number, number];
}> = [
  {
    id: 'contabilidad', nodo: 0, href: '/contabilidad', t: 'SERVICIO DE CONTABILIDAD', lado: 'izq', pad: [82, 60],
    linea: 'Un contador y un auxiliar asignados a tu empresa llevan tus libros, presentan tus impuestos y se reúnen contigo cada semana.',
    detalle: 'Adentro encuentras cómo trabajamos y los planes, y puedes agendar tu diagnóstico o hablar con un contador.',
    tour: 'Si quieres conocer nuestros servicios de contabilidad, este es tu planeta.',
  },
  {
    id: 'nomina', nodo: 3, href: '/nomina', t: 'SERVICIO DE NÓMINA', lado: 'der', pad: [6.3, 64.3],
    linea: 'Liquidamos la nómina de tu equipo cada quincena y lo mantenemos afiliado a salud, pensión, ARL y caja de compensación.',
    detalle: 'Adentro ves cómo funciona cada quincena y puedes agendar tu cita o hablar con un contador.',
    tour: 'Si quieres conocer nuestros servicios de nómina, este es tu planeta.',
  },
  {
    id: 'renta', nodo: 6, href: '/renta', t: 'RENTA PERSONA NATURAL', lado: 'izq', pad: [83, 68.7],
    linea: 'Te ayudamos con tu declaración de renta: descubre si este año te toca declarar y hasta cuándo tienes plazo.',
    detalle: 'Adentro haces un test corto y, si lo necesitas, agendas tu cita con un contador.',
    tour: 'Si eres persona natural y quieres saber si debes declarar renta, este es tu planeta.',
  },
  {
    id: 'personalizado', nodo: 10, href: '/personalizado', t: 'SERVICIO PERSONALIZADO', lado: 'der', pad: [9.6, 72.2],
    linea: 'Junta en un solo servicio lo que tu empresa necesita: contabilidad, nómina, contador acompañante e infraestructura tecnológica.',
    detalle: 'Adentro armas tu servicio pieza por pieza y agendas tu cita con un contador.',
    tour: 'Si quieres un servicio hecho a tu medida, este es tu planeta.',
  },
];

const TITULO = 'Un área contable completa, fuera de tu oficina';
const SALUDO = '¿Qué servicio quieres conocer?';
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Vértices por los que pasa la nave para ir de un nodo a otro siguiendo la ruta */
const ruta = (a: number, b: number) => {
  const r: number[] = [];
  const paso = b >= a ? 1 : -1;
  for (let i = a; i !== b + paso; i += paso) r.push(i);
  return r;
};

type Geo = { W: number; H: number; k: number; movil: boolean; z: number; sw: number; cy: number };

export default function Inicio() {
  const [in_, setIn] = useState(false);
  const [geo, setGeo] = useState<Geo>({ W: 1200, H: 800, k: 1.4, movil: false, z: 3.1, sw: 280, cy: 520 });
  const [fase, setFase] = useState<'mapa' | 'viaje' | 'zoom' | 'tour'>('mapa');
  const [sel, setSel] = useState<number | null>(null);
  const [burbuja, setBurbuja] = useState(SALUDO);
  const [impulso, setImpulso] = useState(0);

  const escenaRef = useRef<HTMLDivElement>(null);
  const capaRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<HTMLDivElement>(null);
  const naveRef = useRef<HTMLDivElement>(null);
  const entrarRef = useRef<HTMLAnchorElement>(null);
  const ctl = useRef({ nodo: CASA, ocupado: false, timers: [] as number[], geo });

  useEffect(() => {
    const id = requestAnimationFrame(() => setIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* medidas del mapa */
  useEffect(() => {
    const medir = () => {
      const el = escenaRef.current;
      if (!el) return;
      const W = el.offsetWidth, H = el.offsetHeight;
      const movil = W < 700;
      // el mapa ocupa el espacio que queda debajo de los textos, centrado ahí
      const arriba = (capaRef.current?.offsetHeight ?? H * 0.35) + (movil ? 18 : 26);
      const libre = Math.max(260, H - arriba - (movil ? 26 : 34));
      const cy = arriba + libre / 2;
      const k = Math.min((W * (movil ? 0.84 : 0.72)) / 300, (libre * 0.96) / 330);
      const sw = movil ? Math.min(210, W * 0.52) : Math.min(300, W * 0.24);
      const g = { W, H, k, movil, z: movil ? 2.5 : 3.1, sw, cy };
      ctl.current.geo = g;
      setGeo(g);
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  const local = useCallback((n: number): [number, number] => {
    const [x, y] = NODOS[n];
    return [(x - 200) * geo.k, (y - 200) * geo.k];
  }, [geo.k]);

  const despues = (ms: number, fn: () => void) => { ctl.current.timers.push(window.setTimeout(fn, ms)); };
  const limpiar = () => { ctl.current.timers.forEach((t) => window.clearTimeout(t)); ctl.current.timers = []; };

  /** Mueve la nave en coordenadas del mapa (px locales) */
  const mover = (puntos: Array<[number, number, number]>, dur: number) => {
    const nave = naveRef.current;
    if (!nave) return;
    const fin = puntos[puntos.length - 1];
    const tf = (p: [number, number, number]) => `translate(${p[0]}px, ${p[1]}px) scale(${p[2]})`;
    if (quieto() || dur < 20) { nave.style.transform = tf(fin); return; }
    const a = nave.animate([{ transform: nave.style.transform || tf(puntos[0]) }, ...puntos.map((p) => ({ transform: tf(p) }))], { duration: dur, easing: 'cubic-bezier(.45,0,.25,1)' });
    nave.style.transform = tf(fin);
    a.onfinish = () => a.cancel();
  };

  const camara = (z: number, n: number | null, dur: number) => {
    const m = mapaRef.current;
    if (!m) return;
    const g = ctl.current.geo;
    let dx = 0, dy = 0;
    if (n !== null) {
      const [x, y] = NODOS[n];
      const tx = g.movil ? g.W * 0.5 : g.W * 0.33;
      const ty = g.movil ? g.H * 0.34 : g.H * 0.52;
      dx = tx - g.W / 2 - (x - 200) * g.k * z;
      dy = ty - g.cy - (y - 200) * g.k * z;
    }
    m.style.transitionDuration = `${quieto() ? 0 : dur}ms`;
    m.style.transform = `translate(${dx}px, ${dy}px) scale(${z})`;
  };

  /* la nave arranca en el centro del logo */
  useEffect(() => {
    const nave = naveRef.current;
    if (!nave) return;
    const [x, y] = local(ctl.current.nodo);
    if (fase === 'mapa' || fase === 'tour') nave.style.transform = `translate(${x}px, ${y}px) scale(1)`;
    // al cambiar el tamaño con zoom activo, recoloca la cámara
    if (fase === 'zoom' && sel !== null) camara(geo.z, SERVICIOS[sel].nodo, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo]);

  /** Clic en un servicio: Cosmo viaja por la ruta, la cámara lo sigue y hace zoom */
  const escoger = (i: number) => {
    const C = ctl.current;
    if (C.ocupado && fase !== 'tour') return;
    limpiar();
    C.ocupado = true;
    const s = SERVICIOS[i];
    const camino = ruta(C.nodo, s.nodo);
    let largo = 0;
    for (let j = 1; j < camino.length; j++) {
      const [ax, ay] = NODOS[camino[j - 1]], [bx, by] = NODOS[camino[j]];
      largo += Math.hypot(bx - ax, by - ay);
    }
    const tViaje = quieto() ? 0 : Math.min(800, 260 + largo * 1.6);
    setSel(i);
    setFase('viaje');
    setImpulso(1);
    mover(camino.map((n) => [...local(n), 1] as [number, number, number]), tViaje);
    camara(geo.z, s.nodo, tViaje + 520);
    C.nodo = s.nodo;
    despues(tViaje, () => {
      // se acopla en la plataforma de la sede
      const [x, y] = local(s.nodo);
      const w = geo.sw / geo.z, h = w * (230 / 240);
      const px = x - w / 2 + (w * s.pad[0]) / 100;
      const py = y - h / 2 + (h * s.pad[1]) / 100 - 9 / geo.z;
      mover([[px, py, 0.62]], 360);
      setFase('zoom');
      setImpulso(0);
    });
    despues(tViaje + 560, () => { C.ocupado = false; entrarRef.current?.focus({ preventScroll: true }); });
  };

  const volver = useCallback(() => {
    const C = ctl.current;
    if (sel === null) return;
    limpiar();
    C.ocupado = true;
    setFase('mapa');
    camara(1, null, 650);
    mover([[...local(C.nodo), 1]], 420);
    despues(650, () => { C.ocupado = false; setSel(null); });
  }, [sel, local]);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape' && fase === 'zoom') volver(); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [fase, volver]);

  /** "Elige lo que necesitas resolver": Cosmo recorre los cuatro planetas */
  const recorrer = () => {
    const C = ctl.current;
    if (C.ocupado) return;
    if (fase === 'zoom') { volver(); return; }
    limpiar();
    C.ocupado = true;
    setFase('tour');
    let t = 0;
    SERVICIOS.forEach((s, i) => {
      despues(t, () => {
        const camino = ruta(C.nodo, s.nodo);
        mover(camino.map((n) => [...local(n), 1] as [number, number, number]), quieto() ? 0 : 700);
        C.nodo = s.nodo;
        setSel(i);
        setImpulso(1);
        setBurbuja('');
      });
      despues(t + 720, () => { setImpulso(0); setBurbuja(s.tour); });
      t += 3000;
    });
    despues(t, () => {
      const camino = ruta(C.nodo, CASA);
      mover(camino.map((n) => [...local(n), 1] as [number, number, number]), quieto() ? 0 : 700);
      C.nodo = CASA;
      setSel(null);
      setBurbuja('');
    });
    despues(t + 750, () => { setFase('mapa'); setBurbuja(SALUDO); C.ocupado = false; });
  };

  useEffect(() => () => limpiar(), []);

  const activo = sel !== null ? SERVICIOS[sel] : null;
  const verBurbuja = in_ && burbuja !== '' && (fase === 'mapa' || fase === 'tour');
  const xNodo = NODOS[sel !== null ? SERVICIOS[sel].nodo : CASA][0];
  const ladoBurbuja = xNodo < 200 ? 'der' : xNodo > 200 ? 'izq' : 'centro';

  return (
    <div className={`ini ini--${fase}`}>
      <Stars />
      <section ref={escenaRef} className={`mp is-${fase}`} aria-label="Mapa de servicios">
        <Espacio impulso={impulso} />

        <div className="mp-mapa" ref={mapaRef} style={{ top: geo.cy }}>

            {/* rutas: la constelación del logo */}
            <svg
              className="mp-rutas"
              viewBox="0 0 400 400"
              style={{ width: 400 * geo.k, height: 400 * geo.k, left: -200 * geo.k, top: -200 * geo.k }}
              aria-hidden="true"
            >
              <path d={EJES} className="mp-ejes" />
              <path d={S_PATH} className="mp-ruta" />
              <path d={S_PATH} className="mp-ruta__pulso" pathLength={1} />
              <path d={S_PATH} className="mp-ruta__pulso mp-ruta__pulso--b" pathLength={1} />
              {NODOS.map(([x, y], n) => (SERVICIOS.some((s) => s.nodo === n) ? null : (
                <g key={n} className="mp-menor" style={{ animationDelay: `${n * -0.6}s` }}>
                  <circle cx={x} cy={y} r="7" className="mp-menor__halo" />
                  <circle cx={x} cy={y} r={n === CASA ? 3.4 : 2.4} className="mp-menor__punto" />
                </g>
              )))}
              {MENORES.map(([x, y], n) => <circle key={`m${n}`} cx={x} cy={y} r="1.2" className="mp-polvo" style={{ animationDelay: `${n * -0.9}s` }} />)}
            </svg>

            {/* sedes: aparecen al hacer zoom sobre su estrella */}
            {SERVICIOS.map((s, i) => {
              const [x, y] = local(s.nodo);
              const w = geo.sw / geo.z;
              return (
                <div
                  key={`sede-${s.id}`}
                  className={`mp-sede ${sel === i && fase === 'zoom' ? 'is-on' : ''}`}
                  style={{ width: w, height: w * (230 / 240), left: x - w / 2, top: y - (w * (230 / 240)) / 2 }}
                  aria-hidden="true"
                >
                  <Sede id={s.id} />
                </div>
              );
            })}

            {/* estrellas principales: los servicios */}
            {SERVICIOS.map((s, i) => {
              const [x, y] = local(s.nodo);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={['mp-nodo', `mp-nodo--${s.lado}`, sel === i ? 'is-sel' : '', fase === 'tour' && sel === i ? 'is-tour' : ''].join(' ')}
                  style={{ left: x, top: y, ['--i' as string]: i }}
                  onClick={() => escoger(i)}
                  aria-label={s.t}
                >
                  <span className="mp-nodo__halo" aria-hidden="true" />
                  <span className="mp-nodo__orbita" aria-hidden="true" />
                  <span className="mp-nodo__nucleo" aria-hidden="true" />
                  <svg className="mp-nodo__destello" viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z" /></svg>
                  <span className="mp-nodo__nombre" aria-hidden="true">{s.t}</span>
                </button>
              );
            })}

            {/* Cosmo: "usted está aquí" */}
            <div className="mp-nave" ref={naveRef} aria-hidden="true">
              <div className="mp-nave__cuerpo">
                <div className={`vj-burbuja vj-burbuja--arriba mp-burbuja mp-burbuja--${ladoBurbuja} ${verBurbuja ? 'vj-burbuja--on' : ''}`}>
                  <span key={burbuja}>{burbuja || SALUDO}</span>
                </div>
                <Nave id="mapa" conLead={false} pose={fase === 'mapa' ? 'saludo' : 'senalando'} />
              </div>
            </div>
        </div>

          {/* panel del servicio escogido */}
          <div className={`mp-panel ${fase === 'zoom' && activo ? 'is-on' : ''}`} role="region" aria-live="polite" aria-label={activo?.t ?? 'Servicio'}>
            {activo && (
              <>
                <h2 className="mp-panel__titulo">{activo.t}</h2>
                <p className="mp-panel__linea">{activo.linea}</p>
                <p className="mp-panel__detalle">{activo.detalle}</p>
                <div className="mp-panel__botones">
                  <Link ref={entrarRef} href={activo.href} className="pill pill--blue vj-cta" tabIndex={fase === 'zoom' ? 0 : -1}>
                    <Destello />
                    Entrar
                  </Link>
                  <button type="button" className="mp-panel__volver" onClick={volver} tabIndex={fase === 'zoom' ? 0 : -1}>
                    Volver al mapa
                  </button>
                </div>
              </>
            )}
          </div>

        {/* textos: pequeños y centrados, encima del mapa */}
        <div className="ini__capa" ref={capaRef}>
          <span className="home__brand">STAKEHOLDERS<i /></span>
          <div className={`ini__copy ${in_ ? 'is-in' : ''}`}>
            <h1 aria-label={TITULO}>
              {TITULO.split(' ').map((w, i) => (
                <Fragment key={i}>
                  <span className="w" aria-hidden="true">
                    <span className="wi" style={{ transitionDelay: `${i * 55}ms` }}>{w}</span>
                  </span>{' '}
                </Fragment>
              ))}
            </h1>
            <h2 className="lead fade" style={{ transitionDelay: '.45s' }}>
              Contadores públicos que llevan la contabilidad y la nómina de tu empresa. Y si eres persona natural, también te ayudamos con tu declaración de renta.
            </h2>
            <div className="fade" style={{ transitionDelay: '.65s' }}>
              <button type="button" className="home__cta-btn ini__cta" onClick={recorrer}>
                <span>Elige lo que necesitas resolver</span>
                <span className="home__cta-arrow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
          <p className="ini__instruccion">Escoge una sede y Cosmo te lleva</p>
        </div>
      </section>

      <footer className="ini__pie">
        <Constelacion />
        <div className="home__foot">
          <span>Stakeholders 2026 · Colombia</span>
          <Link href="/admin/login">Acceso equipo</Link>
        </div>
      </footer>
    </div>
  );
}
