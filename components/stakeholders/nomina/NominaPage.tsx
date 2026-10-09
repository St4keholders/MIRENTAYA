'use client';

/* ============================================================
   /nomina · Seminario de nómina con Cosmo
   Golden circle: ¿Qué hacemos? → ¿Cómo lo hacemos? → ¿Por qué
   nosotros? → Agenda tu cita. Un scroll = una estación, igual
   que /contabilidad (reutiliza el motor del viaje).
   ============================================================ */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import '@/app/stakeholders.css';
import '@/app/servicios.css';
import '@/components/stakeholders/viaje/planeta.css';
import '@/components/stakeholders/viaje/viaje.css';
import './nomina.css';
import { Viaje } from '@/components/stakeholders/viaje/Viaje';
import { Destello } from '@/components/stakeholders/viaje/Orbita';
import { Aterrizaje } from '@/components/stakeholders/viaje/Aterrizaje';
import { Planeta } from '@/components/stakeholders/viaje/Planeta';
import { NaveTour } from './NaveTour';
import { EscenaOxigeno, EscenaCuerda, EscenaProvisiones } from './Rescates';

type Trabajadores = '1 a 5' | '6 a 20' | '21 a 50' | 'Más de 50';
type Motivo = 'Adquirir el servicio' | 'Hablar con un contador';

const FRASES: Record<number, string> = {
  0: 'Bienvenidos al seminario de nómina.',
  1: 'Miren por la ventana: así se ve un equipo sin protección.',
  2: 'Esto pasa cada quincena en nuestra sala de control.',
  3: 'Un equipo bien pagado llega más lejos.',
};

const MAPA = [
  { k: 0, c: '#D9A42F', etiqueta: 'Inicio' },
  { k: 1, c: '#B88A1E', etiqueta: '¿Qué hacemos?' },
  { k: 2, c: '#8FB3F5', etiqueta: '¿Cómo lo hacemos?' },
  { k: 3, c: '#3B6EFF', etiqueta: '¿Por qué nosotros?' },
  { k: 4, c: '#4C87FF', etiqueta: 'Agenda tu cita' },
];

const RESCATES = [
  {
    titulo: 'Salud y pensión',
    texto: 'Que tenga médico hoy y pensión mañana. Lo afiliamos a salud, pensión y caja de compensación.',
    Escena: EscenaOxigeno,
  },
  {
    titulo: 'Riesgos laborales (ARL)',
    texto: 'Que esté cubierto si tiene un accidente trabajando.',
    Escena: EscenaCuerda,
  },
  {
    titulo: 'Prestaciones y liquidaciones',
    texto: 'Prima, cesantías y vacaciones bien calculadas, y su liquidación correcta cuando se retira.',
    Escena: EscenaProvisiones,
  },
];

/* el ciclo quincenal: 1-4 arriba (→), 5-7 abajo (←); f = momento en que la luz pasa por cada paso */
const PASOS = [
  { t: 'Revisamos los contratos y afiliaciones de todo tu equipo.', c: 1, r: 1, f: 0 },
  { t: 'Cada semana revisamos que se cumpla lo acordado en cada contrato: horarios, horas extra y novedades.', c: 2, r: 1, f: 0.093 },
  { t: 'Calculamos lo que le corresponde a cada persona.', c: 3, r: 1, f: 0.185 },
  { t: 'Tú revisas y apruebas antes de pagar.', c: 4, r: 1, f: 0.278 },
  { t: 'Reportamos la nómina a la DIAN.', c: 4, r: 2, f: 0.5 },
  { t: 'Pagas la seguridad social con la planilla (PILA) que te dejamos lista.', c: 3, r: 2, f: 0.593 },
  { t: 'Cada trabajador recibe su comprobante de pago.', c: 2, r: 2, f: 0.685 },
];

/* del caos al orden */
const PAPELES = [
  { mal: 'Horas extra perdidas', bien: '1ª quincena · Pagado ✓', x: -112, y: -112, r: -16 },
  { mal: 'Pago incompleto', bien: '2ª quincena · Pagado ✓', x: 100, y: -50, r: 13 },
  { mal: 'Cuentas a mano', bien: '3ª quincena · Pagado ✓', x: -96, y: 52, r: 10 },
  { mal: 'Novedades sin registrar', bien: '4ª quincena · Pagado ✓', x: 92, y: 120, r: -14 },
];

function Botones({ ir }: { ir: (m: Motivo) => void }) {
  return (
    <div className="nm-botones">
      <button type="button" className="pill pill--blue vj-cta" onClick={() => ir('Adquirir el servicio')}>
        <Destello />
        Adquirir el servicio
      </button>
      <button type="button" className="pill vj-cta vj-cta--sec" onClick={() => ir('Hablar con un contador')}>
        Hablar con un contador
      </button>
    </div>
  );
}

export default function NominaPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [correo, setCorreo] = useState('');
  const [trabajadores, setTrabajadores] = useState<Trabajadores>('1 a 5');
  const [motivo, setMotivo] = useState<Motivo>('Adquirir el servicio');
  const [modalidad, setModalidad] = useState<'Virtual (Google Meet)' | 'Presencial (Medellín)'>('Virtual (Google Meet)');
  const [direccion, setDireccion] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showFloat, setShowFloat] = useState(false);

  // Estrellas en canvas (mismo fondo de /contabilidad)
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

  useEffect(() => {
    const onScroll = () => setShowFloat(window.scrollY > 350);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const irAlFormulario = (m?: Motivo) => {
    if (m) setMotivo(m);
    document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          servicio: 'nomina',
          nombre: nombre.trim(),
          empresa: empresa.trim(),
          whatsapp: whatsapp.trim(),
          correo: correo.trim(),
          trabajadores,
          motivo,
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

  return (
    <div className="conta-page nm-page">
      <canvas ref={canvasRef} id="stars" />
      <div className="veil" aria-hidden="true" />

      <header className="conta-nav">
        <div className="conta-brand">STAKEHOLDERS / Nómina</div>
        <button type="button" className="pill pill--blue" onClick={() => irAlFormulario('Adquirir el servicio')}>
          Adquirir el servicio
        </button>
      </header>

      <div className={`conta-float-btn ${showFloat ? 'visible' : ''}`}>
        <button type="button" className="pill pill--blue" onClick={() => irAlFormulario('Hablar con un contador')}>
          Hablar con un contador
        </button>
      </div>

      <Viaje
        modo="tour"
        frases={FRASES}
        mapa={MAPA}
        planeta="oro"
        ultima={4}
        naveAncho={[520, 300]}
        naveProporcion={0.41}
        nave={() => <NaveTour id="tour" />}
      />

      <main style={{ position: 'relative', zIndex: 2 }}>
        {/* HERO · la nave del seminario frente al planeta */}
        <section className="vj-est vj-hero nm-hero" id="inicio" data-estacion="0">
          <div className="vj-hero__copy">
            <h1>Gestionamos la nómina de tu empresa</h1>
            <p className="nm-desliza">
              Desliza para conocer cómo
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </p>
            <Botones ir={irAlFormulario} />
            <div className="nm-hero__nave" aria-hidden="true">
              <div className="vj-ancla" data-ancla-nave="der" data-ancla-movil="arriba" data-ancla-escala="1,1" />
            </div>
          </div>
        </section>

        {/* ¿QUÉ HACEMOS? · los tres rescates, antes y después */}
        <section className="vj-est nm-que" id="que" data-estacion="1">
          <div className="vj-est__in">
            <div className="nm-cab">
              <div className="nm-cab__texto">
                <h2>Tu equipo, bien pagado y protegido</h2>
                <p>Calculamos el pago de cada trabajador cada quincena y nos aseguramos de que esté afiliado a todo lo que exige la ley.</p>
                <Botones ir={irAlFormulario} />
              </div>
              <div className="nm-cab__astro" aria-hidden="true">
                <div className="vj-ancla" data-ancla-nave="der" data-ancla-movil="der" data-ancla-escala="0.36,0.4" />
                <Planeta v="oro" giro={60} inclinacion={-14} />
              </div>
            </div>

            <div className="nm-rescates">
              <svg className="nm-rescates__orbita" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,16 Q50,0 100,16" />
              </svg>
              {RESCATES.map(({ titulo, texto, Escena }, i) => (
                <article key={titulo} className="nm-rescate" style={{ ['--i' as string]: i }}>
                  <div className="nm-rescate__escena"><Escena /></div>
                  <div className="nm-chip" aria-hidden="true">
                    <span className="nm-chip__mal">Sin protección</span>
                    <span className="nm-chip__bien">Protegido ✓</span>
                  </div>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ¿CÓMO LO HACEMOS? · el ciclo quincenal */}
        <section className="vj-est nm-como" id="como" data-estacion="2">
          <div className="vj-est__in">
            <div className="nm-cab nm-cab--como">
              <div className="nm-cab__texto">
                <h2>Así funciona cada quincena</h2>
                <Botones ir={irAlFormulario} />
              </div>
              <div className="nm-cab__astro" aria-hidden="true">
                <div className="vj-ancla" data-ancla-nave="izq" data-ancla-movil="izq" data-ancla-escala="0.36,0.4" />
              </div>
            </div>

            <div className="nm-ciclo" role="list">
              <svg className="nm-ciclo__pista" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path className="nm-ciclo__via" d="M12.5,25 H87.5 C99,25 99,75 87.5,75 H12.5 C1,75 1,25 12.5,25" />
              </svg>
              {PASOS.map((p, i) => (
                <div
                  role="listitem"
                  key={i}
                  className={`nm-paso ${i === 3 ? 'nm-paso--tu' : ''}`}
                  style={{ gridColumn: p.c, gridRow: p.r, ['--i' as string]: i, ['--f' as string]: p.f }}
                >
                  <span className="nm-paso__n" aria-hidden="true">{i + 1}</span>
                  <p>{p.t}</p>
                  {i === 6 && (
                    <svg className="nm-recibo" viewBox="0 0 24 30" aria-hidden="true">
                      <path d="M2,2 H22 V28 L18,25 L14,28 L10,25 L6,28 L2,25 Z" />
                      <path d="M6,9 H18 M6,14 H18 M6,19 H13" />
                    </svg>
                  )}
                </div>
              ))}
              <div className="nm-ciclo__giro" aria-hidden="true" style={{ gridColumn: 1, gridRow: 2 }}>
                <Planeta v="hielo" giro={40} inclinacion={-10} />
                <svg viewBox="0 0 48 48"><path d="M38,24 A14,14 0 1 1 33.9,14.1" /><path d="M34,6 V14.5 H25.5" /></svg>
              </div>
            </div>
          </div>
        </section>

        {/* ¿POR QUÉ NOSOTROS? · del caos al orden */}
        <section className="vj-est nm-porque" id="por-que" data-estacion="3">
          <div className="vj-est__in nm-porque__in">
            <div className="nm-cab__texto">
              <h2>Cada quincena, un pago más. Sin dramas.</h2>
              <p>Organizamos tu nómina con un proceso claro, para que pagarle a tu equipo sea un trámite simple: sin horas extra perdidas ni pagos incompletos.</p>
              <Botones ir={irAlFormulario} />
            </div>
            <div className="nm-orden" aria-hidden="true">
              <div className="vj-ancla" data-ancla-nave="der" data-ancla-movil="der" data-ancla-escala="0.36,0.4" />
              {PAPELES.map((p, i) => (
                <div
                  key={p.mal}
                  className="nm-hoja"
                  style={{ ['--i' as string]: i, ['--x' as string]: `${p.x}px`, ['--y' as string]: `${p.y}px`, ['--r' as string]: `${p.r}deg`, ['--y1' as string]: `${(i - 1.5) * 64}px` }}
                >
                  <span className="nm-hoja__mal">{p.mal}</span>
                  <span className="nm-hoja__bien">{p.bien}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AGENDA TU CITA · aterrizaje + formulario */}
        <section className="vj-est diagnostic-section vj-form" id="agenda" data-estacion="4">
          <div className="vj-form-grid">
            <Aterrizaje celebrar={enviado} frases={null} className="nm-aterrizaje" nave={<NaveTour id="aterriza-tour" conCosmo={false} />} />
            <div className="diagnostic-box">
              <h2>Agenda tu cita y recibe tu cotización</h2>

              {enviado ? (
                <div style={{ marginTop: '30px', textAlign: 'center', padding: '30px 10px' }}>
                  <p style={{ fontSize: '1.2rem', color: 'var(--white)' }}>
                    Solicitud enviada. Nos pondremos en contacto contigo.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="diagnostic-form">
                  <div>
                    <label className="fld-label" htmlFor="n-nombre">Nombre</label>
                    <input id="n-nombre" type="text" className="fld-input" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  </div>
                  <div>
                    <label className="fld-label" htmlFor="n-empresa">Empresa</label>
                    <input id="n-empresa" type="text" className="fld-input" required value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
                  </div>
                  <div>
                    <label className="fld-label" htmlFor="n-whatsapp">WhatsApp</label>
                    <input id="n-whatsapp" type="tel" className="fld-input" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                  </div>
                  <div>
                    <label className="fld-label" htmlFor="n-correo">Correo</label>
                    <input id="n-correo" type="email" className="fld-input" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
                  </div>
                  <div>
                    <label className="fld-label" htmlFor="n-trabajadores">¿Cuántos trabajadores tienes?</label>
                    <select id="n-trabajadores" className="fld-select" value={trabajadores} onChange={(e) => setTrabajadores(e.target.value as Trabajadores)}>
                      <option value="1 a 5">1 a 5</option>
                      <option value="6 a 20">6 a 20</option>
                      <option value="21 a 50">21 a 50</option>
                      <option value="Más de 50">Más de 50</option>
                    </select>
                  </div>
                  <div>
                    <label className="fld-label">¿Qué necesitas?</label>
                    <div className="modalidad-group">
                      {(['Adquirir el servicio', 'Hablar con un contador'] as Motivo[]).map((m) => (
                        <button key={m} type="button" className={`modalidad-btn ${motivo === m ? 'active' : ''}`} onClick={() => setMotivo(m)}>
                          {m}
                        </button>
                      ))}
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
                      <label className="fld-label" htmlFor="n-direccion">Dirección de tu oficina</label>
                      <input id="n-direccion" type="text" className="fld-input" required value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                      <p className="fld-note">Stakeholders no tiene sede propia; la reunión presencial es en la oficina del cliente.</p>
                    </div>
                  )}
                  <div>
                    <label className="fld-label" htmlFor="n-fechahora">Fecha y hora preferida</label>
                    <input id="n-fechahora" type="text" className="fld-input" required value={fechaHora} onChange={(e) => setFechaHora(e.target.value)} />
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
            </div>
          </div>

          <footer className="conta-footer">
            <nav className="conta-footer__links" style={{ margin: '0 auto' }}>
              <Link href="/contabilidad">Contabilidad</Link>
              <span>·</span>
              <Link href="/renta">Renta persona natural</Link>
              <span>·</span>
              <Link href="/personalizado">Servicio personalizado</Link>
            </nav>
          </footer>
        </section>
      </main>
    </div>
  );
}
