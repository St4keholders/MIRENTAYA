'use client';

/* ============================================================
   /personalizado · Diseña tu servicio
   El cliente arma su cohete con las piezas (servicios) que
   necesita. No hay nada que desplazar hasta que escoge: con
   "Cotizar servicio" el cohete despega, queda viajando por el
   espacio y aparece el formulario para agendar con un contador.
   ============================================================ */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import '@/app/stakeholders.css';
import '@/app/servicios.css';
import '@/components/stakeholders/viaje/planeta.css';
import '@/components/stakeholders/viaje/viaje.css';
import './personalizado.css';
import { Destello } from '@/components/stakeholders/viaje/Orbita';
import { Planeta } from '@/components/stakeholders/viaje/Planeta';
import { COSMO_POSES, type CosmoPose } from '@/components/stakeholders/cosmo/poses';
import { Cohete, IconoPieza, type PiezaId } from './Cohete';

type Fase = 'diseno' | 'despegue' | 'viaje';

const PIEZAS: Array<{ id: PiezaId; pieza: string; servicio: string; linea: string }> = [
  { id: 'contabilidad', pieza: 'Motor', servicio: 'Contabilidad', linea: 'Tus libros e impuestos al día, para que tu empresa avance.' },
  { id: 'nomina', pieza: 'Módulo de tripulación', servicio: 'Nómina', linea: 'Tu equipo bien pagado y protegido cada quincena.' },
  { id: 'acompanante', pieza: 'Cabina de mando', servicio: 'Contador acompañante', linea: 'Acompañamiento constante de un profesional contable.' },
  { id: 'tecnologia', pieza: 'Cono de navegación', servicio: 'Infraestructura tecnológica', linea: 'Automatizaciones con inteligencia artificial y software a la medida de tu empresa.' },
];

const STAR = 'M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z';

function Cosmo({ pose }: { pose: CosmoPose }) {
  return (
    <svg viewBox="0 49 300 435" className="ch-cosmo__svg" aria-hidden="true">
      <g dangerouslySetInnerHTML={{ __html: COSMO_POSES[pose].svg }} />
    </svg>
  );
}

const prefiereQuieto = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function PersonalizadoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const irAlForm = useRef(false);

  const [piezas, setPiezas] = useState<PiezaId[]>([]);
  const [fase, setFase] = useState<Fase>('diseno');
  const [vuelta, setVuelta] = useState(0);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [correo, setCorreo] = useState('');
  const [modalidad, setModalidad] = useState<'Virtual (Google Meet)' | 'Presencial (Medellín)'>('Virtual (Google Meet)');
  const [direccion, setDireccion] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estrellas en canvas (mismo fondo de las demás páginas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    const count = Math.min(70, Math.floor(width / 20));
    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.7 + 0.2,
      dAlpha: (Math.random() * 0.008 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
    }));
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        s.alpha += s.dAlpha;
        if (s.alpha <= 0.15 || s.alpha >= 0.85) s.dAlpha = -s.dAlpha;
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // al aparecer el formulario, el viaje baja hasta él
  useEffect(() => {
    if (fase === 'viaje' && irAlForm.current) {
      irAlForm.current = false;
      formRef.current?.scrollIntoView({ behavior: prefiereQuieto() ? 'auto' : 'smooth', block: 'start' });
    }
  }, [fase]);

  const alternar = (id: PiezaId) => {
    setPiezas((ps) => (ps.includes(id) ? ps.filter((p) => p !== id) : [...ps, id]));
  };

  const cotizar = () => {
    if (!piezas.length || fase !== 'diseno') return;
    setFase('despegue');
    irAlForm.current = true;
    window.setTimeout(() => setFase('viaje'), prefiereQuieto() ? 0 : 1250);
  };

  const hablar = () => {
    irAlForm.current = true;
    if (fase === 'viaje') {
      irAlForm.current = false;
      formRef.current?.scrollIntoView({ behavior: prefiereQuieto() ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    setFase('viaje');
  };

  const redisenar = () => {
    window.scrollTo({ top: 0, behavior: prefiereQuieto() ? 'auto' : 'smooth' });
    window.setTimeout(() => {
      setFase('diseno');
      setVuelta((v) => v + 1);
    }, prefiereQuieto() ? 0 : 650);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!nombre.trim() || !empresa.trim() || !whatsapp.trim() || !correo.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }
    if (modalidad === 'Presencial (Medellín)' && !direccion.trim()) {
      setErrorMsg('La dirección de tu oficina es obligatoria.');
      return;
    }
    if (!fechaHora.trim()) {
      setErrorMsg('Por favor indica tu fecha y hora preferida.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/diagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicio: 'personalizado',
          nombre: nombre.trim(),
          empresa: empresa.trim(),
          whatsapp: whatsapp.trim(),
          correo: correo.trim(),
          piezas: PIEZAS.filter((p) => piezas.includes(p.id)).map((p) => p.servicio),
          mensaje: mensaje.trim(),
          modalidad: modalidad === 'Presencial (Medellín)' ? 'presencial' : 'virtual',
          direccion: modalidad === 'Presencial (Medellín)' ? direccion.trim() : '',
          fecha: fechaHora,
          hora: 'Preferida',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al procesar la solicitud.');
      }
      setEnviado(true);
    } catch (err: unknown) {
      setErrorMsg((err instanceof Error && err.message) || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const enCamino = fase !== 'diseno';

  return (
    <div className="conta-page ch-page">
      <canvas ref={canvasRef} id="stars" />
      <div className="veil" aria-hidden="true" />

      <header className="conta-nav">
        <div className="conta-brand">STAKEHOLDERS / Servicio personalizado</div>
        <button type="button" className="pill pill--blue" onClick={hablar}>
          Hablar con un contador
        </button>
      </header>

      <main style={{ position: 'relative', zIndex: 2 }}>
        {/* HERO · Diseña tu servicio */}
        <section className={`ch-hero ${enCamino ? 'is-despegue' : ''}`} id="disena">
          <div className="ch-hero__in">
            <div className="ch-hero__texto">
              <span className="ch-etiqueta">Servicio personalizado</span>
              <h1>Diseña tu servicio</h1>
              <p className="ch-sub">Escoge las partes del servicio que necesitas</p>
              <p className="ch-instruccion">Toca una pieza para agregarla a tu cohete.</p>

              <div className="ch-cartas" role="group" aria-label="Piezas de tu servicio">
                {PIEZAS.map((p, i) => {
                  const on = piezas.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`ch-carta ${on ? 'is-on' : ''}`}
                      aria-pressed={on}
                      onClick={() => alternar(p.id)}
                      disabled={enCamino}
                      style={{ ['--i' as string]: i }}
                    >
                      <IconoPieza p={p.id} />
                      <span className="ch-carta__texto">
                        <span className="ch-carta__pieza">{p.pieza}</span>
                        <strong className="ch-carta__servicio">{p.servicio}</strong>
                        <span className="ch-carta__linea">{p.linea}</span>
                      </span>
                      <span className="ch-carta__check" aria-hidden="true">
                        <svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" /></svg>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="ch-acciones">
                <button
                  type="button"
                  className={`pill pill--blue vj-cta vj-cta--xl ch-cotizar ${piezas.length ? 'is-listo' : ''}`}
                  onClick={cotizar}
                  disabled={!piezas.length || enCamino}
                >
                  <Destello />
                  Cotizar servicio
                </button>
                <button type="button" className="ch-salida" onClick={hablar}>
                  Prefiero hablar con un contador
                </button>
              </div>
            </div>

            <div className="ch-hero__escena" aria-hidden="true">
              <div className="ch-plataforma" />
              <div
                key={vuelta}
                className="ch-cohete-wrap"
                onClick={(e) => {
                  if (enCamino) return;
                  const g = (e.target as Element).closest('[data-pieza]');
                  if (g) alternar(g.getAttribute('data-pieza') as PiezaId);
                }}
              >
                <Cohete id="hero" piezas={piezas} />
              </div>
              <div className="ch-humo">
                {Array.from({ length: 7 }).map((_, i) => <span key={i} style={{ ['--i' as string]: i }} />)}
              </div>
              <div className="ch-cosmo">
                <div className="vj-burbuja vj-burbuja--arriba vj-burbuja--on">
                  <span key={enCamino ? 'b' : 'a'}>
                    {enCamino ? '¡Despegamos!' : 'Tú escoges las piezas, en Stakeholders te ayudamos a reconstruirlo.'}
                  </span>
                </div>
                <Cosmo pose={enCamino ? 'celebrando' : 'senalando'} />
              </div>
            </div>
          </div>
        </section>

        {/* COTIZA TU SERVICIO · el cohete viaja y un contador te atiende */}
        <section ref={formRef} className="ch-form" id="cotiza" hidden={fase !== 'viaje'}>
          <div className="ch-form__in">
            <div className={`ch-viaje ${enviado ? 'is-fiesta' : ''}`} aria-hidden="true">
              <div className="ch-viaje__lineas">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} style={{ ['--i' as string]: i, ['--h' as string]: `${50 + ((i * 37) % 90)}px`, ['--v' as string]: `${0.55 + ((i * 13) % 7) / 10}s` }} />
                ))}
              </div>
              <div className="ch-viaje__astro ch-viaje__astro--a"><Planeta v="anillo" anillo giro={50} /></div>
              <div className="ch-viaje__astro ch-viaje__astro--b"><Planeta v="oro" giro={40} /></div>
              <div className="ch-viaje__astro ch-viaje__astro--c"><Planeta v="hielo" giro={60} /></div>
              <div className="ch-viaje__cohete">
                <Cohete id="viaje" piezas={piezas} className="ch--viaje" />
              </div>
              <div className="ch-viaje__cosmo"><Cosmo pose={enviado ? 'celebrando' : 'saludo'} /></div>
              <div className="ch-fiesta">
                {Array.from({ length: 14 }).map((_, i) => (
                  <svg key={i} viewBox="-10 -10 20 20" style={{ ['--a' as string]: `${(i / 14) * 360}deg`, ['--d' as string]: `${i * 0.04}s` }}>
                    <path d={STAR} fill={['#3B6EFF', '#BFD4FF', '#F0B93C', '#FFFFFF'][i % 4]} />
                  </svg>
                ))}
              </div>
            </div>

            <div className="diagnostic-box">
              <h2>Cotiza tu servicio</h2>
              <p className="ch-form__sub">Agenda tu cita y un contador te atenderá para armar tu plan.</p>

              {enviado ? (
                <div style={{ marginTop: '30px', textAlign: 'center', padding: '30px 10px' }}>
                  <p style={{ fontSize: '1.2rem', color: 'var(--white)' }}>
                    Solicitud enviada. Nos pondremos en contacto contigo.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="diagnostic-form">
                  <div>
                    <label className="fld-label" htmlFor="p-nombre">Nombre</label>
                    <input id="p-nombre" type="text" className="fld-input" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  </div>
                  <div>
                    <label className="fld-label" htmlFor="p-empresa">Empresa</label>
                    <input id="p-empresa" type="text" className="fld-input" required value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
                  </div>
                  <div>
                    <label className="fld-label" htmlFor="p-whatsapp">WhatsApp</label>
                    <input id="p-whatsapp" type="tel" className="fld-input" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                  </div>
                  <div>
                    <label className="fld-label" htmlFor="p-correo">Correo</label>
                    <input id="p-correo" type="email" className="fld-input" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
                  </div>
                  <div>
                    <label className="fld-label">Piezas de tu servicio</label>
                    <div className="ch-form__piezas" role="group" aria-label="Piezas de tu servicio">
                      {PIEZAS.map((p) => {
                        const on = piezas.includes(p.id);
                        return (
                          <button key={p.id} type="button" className={`modalidad-btn ch-form__pieza ${on ? 'active' : ''}`} aria-pressed={on} onClick={() => alternar(p.id)}>
                            <IconoPieza p={p.id} />
                            {p.servicio}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="fld-label">Modalidad</label>
                    <div className="modalidad-group">
                      <button type="button" className={`modalidad-btn ${modalidad === 'Virtual (Google Meet)' ? 'active' : ''}`} onClick={() => setModalidad('Virtual (Google Meet)')}>
                        Virtual (Google Meet)
                      </button>
                      <button type="button" className={`modalidad-btn ${modalidad === 'Presencial (Medellín)' ? 'active' : ''}`} onClick={() => setModalidad('Presencial (Medellín)')}>
                        Presencial (Medellín)
                      </button>
                    </div>
                  </div>
                  {modalidad === 'Presencial (Medellín)' && (
                    <div>
                      <label className="fld-label" htmlFor="p-direccion">Dirección de tu oficina</label>
                      <input id="p-direccion" type="text" className="fld-input" required value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                      <p className="fld-note">Stakeholders no tiene sede propia; la reunión presencial es en la oficina del cliente.</p>
                    </div>
                  )}
                  <div>
                    <label className="fld-label" htmlFor="p-fechahora">Fecha y hora preferida</label>
                    <input id="p-fechahora" type="text" className="fld-input" required value={fechaHora} onChange={(e) => setFechaHora(e.target.value)} />
                  </div>
                  <div>
                    <label className="fld-label" htmlFor="p-mensaje">¿Algo más que debamos saber? (opcional)</label>
                    <textarea id="p-mensaje" className="fld-input ch-form__mensaje" rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
                  </div>
                  {errorMsg && <p style={{ color: '#ff6b6b', fontSize: '.9rem', margin: '4px 0' }}>{errorMsg}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="pill pill--blue vj-cta"
                    style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', fontWeight: 700, marginTop: '10px' }}
                  >
                    <Destello />
                    Agendar mi cita
                  </button>
                </form>
              )}

              <button type="button" className="ch-salida ch-redisenar" onClick={redisenar}>
                Rediseñar mi cohete
              </button>
            </div>
          </div>

          <footer className="conta-footer">
            <nav className="conta-footer__links" style={{ margin: '0 auto' }}>
              <Link href="/contabilidad">Contabilidad</Link>
              <span>·</span>
              <Link href="/nomina">Nómina</Link>
              <span>·</span>
              <Link href="/renta">Renta persona natural</Link>
            </nav>
          </footer>
        </section>
      </main>
    </div>
  );
}
