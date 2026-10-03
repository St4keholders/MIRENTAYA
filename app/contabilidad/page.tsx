'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import '@/app/stakeholders.css';
import '@/app/servicios.css';

interface Plan {
  nombre: string;
  facturas: 'Hasta 30' | '31 a 100' | '101 a 500' | 'Más de 500';
  precio: string;
  ideal: string;
}

const PLANES: Plan[] = [
  {
    nombre: 'Arranque',
    facturas: 'Hasta 30',
    precio: '$750.000',
    ideal: 'Empresas de servicios que están comenzando',
  },
  {
    nombre: 'Crecimiento',
    facturas: '31 a 100',
    precio: '$1.000.000',
    ideal: 'Manufactura o servicios frecuentes con ventas en crecimiento',
  },
  {
    nombre: 'Consolidación',
    facturas: '101 a 500',
    precio: '$1.500.000',
    ideal: 'Empresas con operación estable y alto movimiento',
  },
  {
    nombre: 'Escala',
    facturas: 'Más de 500',
    precio: '$2.000.000',
    ideal: 'Operaciones de gran volumen + automatizaciones con IA y software a la medida',
  },
];

export default function ContabilidadPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [correo, setCorreo] = useState('');
  const [facturas, setFacturas] = useState<'Hasta 30' | '31 a 100' | '101 a 500' | 'Más de 500'>('Hasta 30');
  const [modalidad, setModalidad] = useState<'Virtual (Google Meet)' | 'Presencial (Medellín)'>('Virtual (Google Meet)');
  const [direccion, setDireccion] = useState('');
  const [fechaHora, setFechaHora] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Botón flotante
  const [showFloat, setShowFloat] = useState(false);

  // Animación de estrellas en canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
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

  // Botón flotante al hacer scroll
  useEffect(() => {
    const onScroll = () => {
      setShowFloat(window.scrollY > 350);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToFormulario = (rangoFacturas?: 'Hasta 30' | '31 a 100' | '101 a 500' | 'Más de 500') => {
    if (rangoFacturas) {
      setFacturas(rangoFacturas);
    }
    const el = document.getElementById('formulario');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToPrecios = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('precios');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
          nombre: nombre.trim(),
          empresa: empresa.trim(),
          whatsapp: whatsapp.trim(),
          correo: correo.trim(),
          facturas,
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
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="conta-page">
      <canvas ref={canvasRef} id="stars" />
      <div className="veil" aria-hidden="true" />

      {/* 2.1 BARRA SUPERIOR */}
      <header className="conta-nav">
        <div className="conta-brand">
          STAKEHOLDERS / Contabilidad
        </div>
        <button
          type="button"
          className="pill pill--blue"
          onClick={() => scrollToFormulario()}
        >
          Agenda tu diagnóstico
        </button>
      </header>

      {/* BOTÓN FLOTANTE "AGENDAR DIAGNÓSTICO" */}
      <div className={`conta-float-btn ${showFloat ? 'visible' : ''}`}>
        <button
          type="button"
          className="pill pill--blue"
          onClick={() => scrollToFormulario()}
        >
          Agendar diagnóstico
        </button>
      </div>

      <main style={{ position: 'relative', zIndex: 2 }}>
        {/* 2.2 HERO */}
        <section className="conta-hero">
          <h1>Un equipo contable que no te deja solo</h1>
          <h2>
            Un contador y un auxiliar asignados a tu empresa llevan tus libros, presentan tus impuestos y se reúnen contigo cada semana para revisar cómo va tu negocio.
          </h2>

          <div className="conta-hero__actions">
            <button
              type="button"
              className="pill pill--blue"
              onClick={() => scrollToFormulario()}
            >
              Agenda tu diagnóstico gratis
            </button>
            <a
              href="#precios"
              onClick={scrollToPrecios}
              className="pill pill--ghost"
            >
              Ver planes
            </a>
          </div>

          <p className="conta-trust-line">
            Contadores con tarjeta profesional · +10 empresas activas · Presencial en Medellín o virtual por Google Meet
          </p>
        </section>

        {/* 2.3 CINTA DE SERVICIOS */}
        <div className="conta-ribbon" aria-hidden="true">
          <div className="conta-ribbon__track">
            <span>Libros contables</span>
            <b>·</b>
            <span>IVA</span>
            <b>·</b>
            <span>Retención en la fuente</span>
            <b>·</b>
            <span>ICA</span>
            <b>·</b>
            <span>Información exógena</span>
            <b>·</b>
            <span>Estados financieros</span>
            <b>·</b>
            <span>NIIF para pymes</span>
            <b>·</b>
            <span>Libros contables</span>
            <b>·</b>
            <span>IVA</span>
            <b>·</b>
            <span>Retención en la fuente</span>
            <b>·</b>
            <span>ICA</span>
            <b>·</b>
            <span>Información exógena</span>
            <b>·</b>
            <span>Estados financieros</span>
            <b>·</b>
            <span>NIIF para pymes</span>
          </div>
        </div>

        {/* 2.4 ¿QUÉ? — SERVICIO Y PRINCIPIOS */}
        <section className="conta-section" id="que">
          <div className="conta-section__head">
            <h2>Todo lo contable de tu empresa, en un solo equipo</h2>
            <p>
              Nos encargamos de la teneduría de libros, la presentación de impuestos y tus estados financieros. Para trabajar así, tenemos cuatro principios que no negociamos.
            </p>
          </div>

          <div className="principles-grid">
            <div className="principle-card">
              <h3>Acompañamiento completo.</h3>
              <p>
                No desaparecemos entre declaración y declaración. Nos reunimos contigo cada semana.
              </p>
            </div>

            <div className="principle-card">
              <h3>Servicio personalizado.</h3>
              <p>
                Antes de proponerte nada, entendemos cómo funciona tu empresa. Tu sistema contable se diseña para ti, no se copia de otro cliente.
              </p>
            </div>

            <div className="principle-card">
              <h3>Impuestos al día.</h3>
              <p>
                Calendario tributario bajo control para que cada obligación se presente a tiempo y sin sanciones.
              </p>
            </div>

            <div className="principle-card">
              <h3>Reducción de costos.</h3>
              <p>
                Una estructura contable y tributaria bien planteada te ayuda a pagar lo justo, ni un peso de más.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="pill pill--blue"
            onClick={() => scrollToFormulario()}
          >
            Quiero mi diagnóstico gratis
          </button>
        </section>

        {/* 2.5 ¿CÓMO? — FORMA DE TRABAJAR */}
        <section className="conta-section" id="como" style={{ borderTop: '1px solid var(--line-soft)' }}>
          <div className="conta-section__head">
            <h2>Así trabajamos contigo, desde el primer día</h2>
          </div>

          <div className="timeline-grid">
            <div className="timeline-item">
              <div className="timeline-item__step">1</div>
              <div>
                <p>
                  <strong>Diagnóstico gratis.</strong> Conocemos tu empresa, presencial en Medellín o por Google Meet.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-item__step">2</div>
              <div>
                <p>
                  <strong>Propuesta.</strong> Te mostramos el plan y la estructura que tu empresa necesita.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-item__step">3</div>
              <div>
                <p>
                  <strong>Inicio de operación.</strong> Aceptas y arrancamos. Tu información se organiza en Drive, siempre a tu alcance.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-item__step">4</div>
              <div>
                <p>
                  <strong>Reunión semanal.</strong> Revisamos contigo cómo va el negocio.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-item__step">5</div>
              <div>
                <p>
                  <strong>Cierre mensual.</strong> Libros cerrados y obligaciones presentadas.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-item__step">6</div>
              <div>
                <p>
                  <strong>Reporte.</strong> Números claros para tomar decisiones.
                </p>
              </div>
            </div>
          </div>

          <div className="team-callout">
            <p>
              <strong>Tu equipo:</strong> Cada empresa tiene un contador y un auxiliar asignados. Siempre sabes con quién hablas.
            </p>
          </div>

          <div className="innovation-block">
            <p>
              <strong>Contabilidad con tecnología propia.</strong> Contamos con un área de tecnología que desarrolla automatizaciones con inteligencia artificial y software interno a la medida de tu empresa. <em>(Incluido en el plan Escala.)</em>
            </p>
          </div>

          <button
            type="button"
            className="pill pill--blue"
            onClick={() => scrollToFormulario()}
          >
            Agenda tu diagnóstico
          </button>
        </section>

        {/* 2.6 ¿POR QUÉ? — IDENTIFICACIÓN Y PRUEBA */}
        <section className="conta-section" id="por-que" style={{ borderTop: '1px solid var(--line-soft)' }}>
          <div className="quote-highlight">
            <blockquote>
              &ldquo;Un buen contador o te hace millonario o te quiebra.&rdquo;
            </blockquote>
          </div>

          <p className="why-story">
            Muchas empresas llegan a nosotros con un sistema contable y tributario que nunca se pensó para ellas, porque nadie se tomó el tiempo de entender cómo funcionan. Ese error no se ve el primer mes, pero se paga con el tiempo. Por eso nosotros empezamos al revés: primero conocemos tu empresa, después planteamos los números.
          </p>

          <div className="counters-grid">
            <div className="counter-box">
              <div className="counter-box__val">+10 empresas activas</div>
            </div>

            <div className="counter-box">
              <div className="counter-box__val">+5 años de experiencia profesional</div>
            </div>

            <div className="counter-box">
              <div className="counter-box__val">2 años acompañando pymes</div>
            </div>

            <div className="counter-box">
              <div className="counter-box__val">Reunión semanal con cada cliente</div>
            </div>
          </div>

          <button
            type="button"
            className="pill pill--blue"
            onClick={() => scrollToFormulario()}
          >
            Empieza con un diagnóstico gratis
          </button>
        </section>

        {/* 2.7 PRECIOS */}
        <section className="conta-section" id="precios" style={{ borderTop: '1px solid var(--line-soft)' }}>
          <div className="conta-section__head">
            <h2>Planes según el tamaño de tu operación</h2>
            <p>
              El plan depende de cuántas facturas de venta emites al mes, porque eso define el volumen de trabajo con la DIAN y en tus compras.
            </p>
          </div>

          <div className="pricing-grid">
            {PLANES.map((plan) => (
              <div key={plan.nombre} className="plan-card">
                <div>
                  <h3 className="plan-card__name">{plan.nombre}</h3>
                  <div className="plan-card__invoices">
                    Facturas de venta / mes: {plan.facturas}
                  </div>
                  <div className="plan-card__price">
                    <span className="plan-card__amount">{plan.precio}</span>
                  </div>
                  <p className="plan-card__ideal">
                    {plan.ideal}
                  </p>
                </div>

                <button
                  type="button"
                  className="pill pill--ghost"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}
                  onClick={() => scrollToFormulario(plan.facturas)}
                >
                  Agendar diagnóstico con este plan
                </button>
              </div>
            ))}
          </div>

          <p style={{ marginTop: '28px', color: '#D0D4DC', fontSize: '1rem', lineHeight: 1.6 }}>
            Todos los planes incluyen: contador y auxiliar asignados, reunión semanal, cierre mensual, impuestos y estados financieros.
          </p>

          <p className="pricing-note">
            ¿No sabes cuál es el tuyo? En el diagnóstico lo definimos juntos.
          </p>
        </section>

        {/* 2.8 CTA FINAL + FORMULARIO */}
        <section className="diagnostic-section" id="formulario">
          <div className="diagnostic-box">
            <h2>Hablemos de tu empresa</h2>
            <p style={{ color: 'var(--dim)', marginTop: '10px', fontSize: '1.05rem', lineHeight: 1.55 }}>
              El diagnóstico es gratis y sin compromiso. Elige si lo hacemos en tu oficina o por videollamada.
            </p>

            {enviado ? (
              <div style={{ marginTop: '30px', textAlign: 'center', padding: '30px 10px' }}>
                <p style={{ fontSize: '1.2rem', color: 'var(--white)' }}>
                  Solicitud enviada. Nos pondremos en contacto contigo.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="diagnostic-form">
                <div>
                  <label className="fld-label" htmlFor="f-nombre">
                    Nombre
                  </label>
                  <input
                    id="f-nombre"
                    type="text"
                    className="fld-input"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div>
                  <label className="fld-label" htmlFor="f-empresa">
                    Empresa
                  </label>
                  <input
                    id="f-empresa"
                    type="text"
                    className="fld-input"
                    required
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                  />
                </div>

                <div>
                  <label className="fld-label" htmlFor="f-whatsapp">
                    WhatsApp
                  </label>
                  <input
                    id="f-whatsapp"
                    type="tel"
                    className="fld-input"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>

                <div>
                  <label className="fld-label" htmlFor="f-correo">
                    Correo
                  </label>
                  <input
                    id="f-correo"
                    type="email"
                    className="fld-input"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="fld-label" htmlFor="f-facturas">
                    Facturas de venta al mes
                  </label>
                  <select
                    id="f-facturas"
                    className="fld-select"
                    value={facturas}
                    onChange={(e) => setFacturas(e.target.value as any)}
                  >
                    <option value="Hasta 30">Hasta 30</option>
                    <option value="31 a 100">31 a 100</option>
                    <option value="101 a 500">101 a 500</option>
                    <option value="Más de 500">Más de 500</option>
                  </select>
                </div>

                <div>
                  <label className="fld-label">
                    Modalidad
                  </label>
                  <div className="modalidad-group">
                    <button
                      type="button"
                      className={`modalidad-btn ${modalidad === 'Virtual (Google Meet)' ? 'active' : ''}`}
                      onClick={() => setModalidad('Virtual (Google Meet)')}
                    >
                      Virtual (Google Meet)
                    </button>
                    <button
                      type="button"
                      className={`modalidad-btn ${modalidad === 'Presencial (Medellín)' ? 'active' : ''}`}
                      onClick={() => setModalidad('Presencial (Medellín)')}
                    >
                      Presencial (Medellín)
                    </button>
                  </div>
                </div>

                {modalidad === 'Presencial (Medellín)' && (
                  <div>
                    <label className="fld-label" htmlFor="f-direccion">
                      Dirección de tu oficina
                    </label>
                    <input
                      id="f-direccion"
                      type="text"
                      className="fld-input"
                      required
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                    />
                    <p className="fld-note">
                      Stakeholders no tiene sede propia; la reunión presencial es en la oficina del cliente.
                    </p>
                  </div>
                )}

                <div>
                  <label className="fld-label" htmlFor="f-fechahora">
                    Fecha y hora preferida
                  </label>
                  <input
                    id="f-fechahora"
                    type="text"
                    className="fld-input"
                    required
                    value={fechaHora}
                    onChange={(e) => setFechaHora(e.target.value)}
                  />
                </div>

                {errorMsg && (
                  <p style={{ color: '#ff6b6b', fontSize: '.9rem', margin: '4px 0' }}>
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="pill pill--blue"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: 700,
                    marginTop: '10px',
                  }}
                >
                  Agendar mi diagnóstico gratis
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* 2.9 FOOTER */}
      <footer className="conta-footer">
        <nav className="conta-footer__links" style={{ margin: '0 auto' }}>
          <Link href="/nomina">Nómina</Link>
          <span>·</span>
          <Link href="/renta">Renta persona natural</Link>
          <span>·</span>
          <Link href="/personalizado">Servicio personalizado</Link>
        </nav>
      </footer>
    </div>
  );
}
