'use client';

/* ============================================================
   INICIO · Horizonte planetario
   Las cuatro sedes son islas vivas suspendidas sobre un planeta,
   unidas por el logo SH acostado como autopista de luz. Cosmo
   espera en primer plano; al escoger una isla, la cámara lo sigue
   hasta que aterriza y aparece la hoja con el servicio.
   El motor de la escena vive en escena.ts.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Nave } from '../viaje/Nave';
import { Isla, type IslaId } from './Islas';
import { HablarContador } from './HablarContador';
import { iniciarEscena, type ControlEscena, type Servicio } from './escena';
import '@/app/stakeholders.css';
import './islas.css';
import './horizonte.css';

type Sede = Servicio & {
  id: IslaId; href: string; t: string; eyebrow: string; adelanto: string;
  linea: string; beneficios: [string, string, string]; detalle: string; fila: string;
};

const SEDES: Sede[] = [
  {
    id: 'contabilidad', nodo: 0, href: '/contabilidad', t: 'SERVICIO DE CONTABILIDAD', corto: 'Contabilidad', fila: 'Contabilidad',
    eyebrow: 'Para empresas', pad: [262, 194], letrero: -12,
    adelanto: 'Tus libros e impuestos al día',
    linea: 'Un contador y un auxiliar asignados a tu empresa llevan tus libros, presentan tus impuestos y se reúnen contigo cada semana.',
    beneficios: ['Contabilidad con tecnología propia', 'Planes según el tamaño de tu operación', 'Reunión presencial en tu oficina'],
    detalle: 'Adentro encuentras cómo trabajamos y los planes, y puedes agendar tu diagnóstico o hablar con un contador.',
    tour: 'Si quieres conocer nuestro servicio de contabilidad, esta es tu sede.',
  },
  {
    id: 'nomina', nodo: 3, href: '/nomina', t: 'SERVICIO DE NÓMINA', corto: 'Nómina', fila: 'Nómina',
    eyebrow: 'Para empresas con equipo', pad: [266, 178], letrero: 26,
    adelanto: 'Tu equipo bien pagado y protegido cada quincena',
    linea: 'Liquidamos la nómina de tu equipo cada quincena y lo mantenemos afiliado a salud, pensión, ARL y caja de compensación.',
    beneficios: ['Nómina electrónica reportada a la DIAN', 'Comprobante de pago para cada trabajador', 'Tu planilla PILA lista para pagar'],
    detalle: 'Adentro ves cómo funciona cada quincena y puedes agendar tu cita o hablar con un contador.',
    tour: 'Si quieres conocer nuestro servicio de nómina, esta es tu sede.',
  },
  {
    id: 'renta', nodo: 6, href: '/renta', t: 'RENTA PERSONA NATURAL', corto: 'Renta persona natural', fila: 'Renta persona natural',
    eyebrow: 'Para personas naturales', pad: [250, 196], letrero: 20,
    adelanto: '¿Te toca declarar este año? Descúbrelo',
    linea: 'Te ayudamos con tu declaración de renta: descubre si este año te toca declarar y hasta cuándo tienes plazo.',
    beneficios: ['Descubre tu arquetipo tributario', 'Tu fecha límite según los últimos dígitos de tu cédula', 'Cita con un contador si la necesitas'],
    detalle: 'Adentro haces un test corto y, si lo necesitas, agendas tu cita con un contador.',
    tour: 'Si eres persona natural y quieres saber si debes declarar renta, esta es tu sede.',
  },
  {
    id: 'personalizado', nodo: 10, href: '/personalizado', t: 'SERVICIO PERSONALIZADO', corto: 'Servicio personalizado', fila: 'Servicio personalizado',
    eyebrow: 'A la medida de tu empresa', pad: [138, 198], letrero: 4,
    adelanto: 'Arma tu servicio pieza por pieza',
    linea: 'Junta en un solo servicio lo que tu empresa necesita: contabilidad, nómina, contador acompañante e infraestructura tecnológica.',
    beneficios: ['Escoges solo las piezas que necesitas', 'Un contador te atiende para armar tu plan', 'Recibes tu cotización en la cita'],
    detalle: 'Adentro armas tu servicio pieza por pieza y agendas tu cita con un contador.',
    tour: 'Si quieres un servicio hecho a tu medida, esta es tu sede.',
  },
];

const TITULO = 'Un área contable completa, fuera de tu oficina';
const SALUDO = '¡Hola! Soy Cosmo. ¿Qué servicio quieres conocer?';

function IconoTel() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15.5v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L9.5 10.6a16 16 0 0 0 4 4l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.6 2z" />
    </svg>
  );
}
function Flecha() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export default function Horizonte() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ctl = useRef<ControlEscena | null>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [tarjeta, setTarjeta] = useState(0);
  const [abierta, setAbierta] = useState(false);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const c = iniciarEscena(root, SEDES, SALUDO, {
      onLlegar: (i) => { setTarjeta(i); setAbierta(true); },
      onSalir: () => setAbierta(false),
    });
    ctl.current = c;
    return () => { c.destruir(); ctl.current = null; };
  }, []);

  useEffect(() => {
    if (abierta) tituloRef.current?.focus({ preventScroll: true });
  }, [abierta]);

  const s = SEDES[tarjeta];

  return (
    <div ref={rootRef} className="hz">
      <canvas className="hz-bg" aria-hidden="true" />
      <div className="hz-cam">
        <svg className="hz-hw" aria-hidden="true">
          <defs>
            <linearGradient id="hz-hwGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8FB3FF" stopOpacity=".25" /><stop offset="1" stopColor="#4C87FF" stopOpacity=".55" /></linearGradient>
            <radialGradient id="hz-nodoHalo"><stop offset="0" stopColor="#CFE0FF" stopOpacity=".9" /><stop offset=".35" stopColor="#4C87FF" stopOpacity=".45" /><stop offset="1" stopColor="#3B6EFF" stopOpacity="0" /></radialGradient>
            <linearGradient id="hz-rayoGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8FB3FF" stopOpacity=".05" /><stop offset="1" stopColor="#CFE0FF" stopOpacity=".7" /></linearGradient>
          </defs>
        </svg>
        {SEDES.map((sede, i) => (
          <div key={sede.id} className="hz-isla is-oculta" data-i={i}>
            <div className="hz-isla__cuerpo"><div className="hz-isla__flota"><Isla id={sede.id} /></div></div>
            <div className="hz-isla__letrero" aria-hidden="true">
              <span className="hz-isla__t">{sede.t}</span>
              <span className="hz-isla__l">{sede.adelanto}</span>
            </div>
            <button type="button" className="hz-isla__hit" aria-label={`${sede.t}: ${sede.adelanto}`} />
          </div>
        ))}
      </div>

      <div className="hz-cosmo is-oculto" aria-live="polite">
        <div className="hz-cosmo__flota"><div className="hz-cosmo__nave"><Nave id="hz" conLead={false} pose="saludo" /></div></div>
        <div className="hz-burbuja" />
      </div>

      <header className="hz-hd">
        <Link className="hz-logo" href="/" aria-label="Stakeholders, inicio">
          <svg viewBox="80 30 240 340" aria-hidden="true"><polyline points="100,320 148,360 232,355 280,305 256,235 200,200 144,165 120,95 168,45 252,40 300,80" fill="none" stroke="#8FB3FF" strokeWidth="14" strokeLinejoin="round" /><circle cx="100" cy="320" r="22" fill="#fff" /><circle cx="300" cy="80" r="22" fill="#fff" /></svg>
          STAKEHOLDERS
        </Link>
        <button type="button" className="hz-cta" onClick={() => setModal(true)}><IconoTel />Hablar con un contador</button>
      </header>

      <div className="hz-copy">
        <h1>{TITULO}</h1>
        <p>Escoge una sede y Cosmo te lleva</p>
      </div>

      <nav className="hz-fila" aria-label="Servicios">
        {SEDES.map((sede, i) => (
          <span key={sede.id} className="hz-fila__item">
            {i > 0 && <span className="hz-fila__sep" aria-hidden="true">·</span>}
            <Link href={sede.href}>{sede.fila}</Link>
          </span>
        ))}
      </nav>

      <footer className="hz-pie">
        <span>Stakeholders 2026 · Colombia</span>
        <span className="hz-pie__const" aria-hidden="true">{'STAKEHOLDERS'.split('').map((c, i) => <i key={i}>{c}</i>)}</span>
        <Link href="/admin/login">Acceso equipo</Link>
      </footer>

      <aside className={`hz-tarjeta ${abierta ? 'is-on' : ''}`} aria-hidden={!abierta} role="region" aria-label={s.t}>
        <div className="hz-tarjeta__eyebrow">{s.eyebrow}</div>
        <h2 className="hz-tarjeta__titulo" ref={tituloRef} tabIndex={-1}>{s.t}</h2>
        <p className="hz-tarjeta__parrafo">{s.linea}</p>
        <ul className="hz-tarjeta__beneficios">
          {s.beneficios.map((b) => (
            <li key={b}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" /><path d="M6 10.4l2.6 2.6L14.2 7.4" /></svg>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="hz-tarjeta__detalle">{s.detalle}</p>
        <div className="hz-tarjeta__botones">
          <Link className="hz-cta hz-tarjeta__entrar" href={s.href} tabIndex={abierta ? 0 : -1}>Entrar<Flecha /></Link>
          <button type="button" className="hz-tarjeta__volver" onClick={() => ctl.current?.volver()} tabIndex={abierta ? 0 : -1}>Volver al mapa</button>
        </div>
      </aside>

      <HablarContador abierto={modal} onCerrar={() => setModal(false)} interes={abierta ? s.id : undefined} />
    </div>
  );
}
