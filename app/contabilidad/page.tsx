'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import '@/app/stakeholders.css';
import '@/app/servicios.css';

interface PlanInfo {
  name: string;
  invoices: 'Hasta 30' | '31 a 100' | '101 a 500' | 'Más de 500';
  price: string;
  ideal: string;
  featured?: boolean;
}

const PLANS: PlanInfo[] = [
  {
    name: 'Arranque',
    invoices: 'Hasta 30',
    price: '$750.000',
    ideal: 'Empresas de servicios que están comenzando',
  },
  {
    name: 'Crecimiento',
    invoices: '31 a 100',
    price: '$1.000.000',
    ideal: 'Manufactura o servicios frecuentes con ventas en crecimiento',
    featured: true,
  },
  {
    name: 'Consolidación',
    invoices: '101 a 500',
    price: '$1.500.000',
    ideal: 'Empresas con operación estable y alto movimiento',
  },
  {
    name: 'Escala',
    invoices: 'Más de 500',
    price: '$2.000.000',
    ideal: 'Operaciones de gran volumen + automatizaciones con IA y software a la medida',
  },
];

const TIME_SLOTS = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

export default function ContabilidadPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [correo, setCorreo] = useState('');
  const [facturas, setFacturas] = useState<'Hasta 30' | '31 a 100' | '101 a 500' | 'Más de 500'>('Hasta 30');
  const [selectedPlan, setSelectedPlan] = useState<string>('Arranque');
  const [modalidad, setModalidad] = useState<'virtual' | 'presencial'>('virtual');
  const [direccion, setDireccion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('09:00 AM');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Floating CTA visibility
  const [showFloatCta, setShowFloatCta] = useState(false);

  // Min date for booking: tomorrow
  const [minDateStr, setMinDateStr] = useState('');

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setMinDateStr(`${yyyy}-${mm}-${dd}`);
    setFecha(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Stars canvas animation
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

    const count = Math.min(80, Math.floor(width / 18));
    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.3 + 0.3,
      alpha: Math.random() * 0.7 + 0.2,
      dAlpha: (Math.random() * 0.01 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
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

  // Scroll listener for floating CTA
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 400) {
        setShowFloatCta(true);
      } else {
        setShowFloatCta(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToDiagnostico = (planName?: string, planInvoices?: 'Hasta 30' | '31 a 100' | '101 a 500' | 'Más de 500') => {
    if (planName) {
      setSelectedPlan(planName);
    }
    if (planInvoices) {
      setFacturas(planInvoices);
    }
    const target = document.getElementById('diagnostico');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToPrecios = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('precios');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nombre.trim() || !empresa.trim() || !whatsapp.trim() || !correo.trim()) {
      setErrorMsg('Por favor completa todos los campos de contacto y empresa.');
      return;
    }

    if (modalidad === 'presencial' && !direccion.trim()) {
      setErrorMsg('La dirección de tu oficina en Medellín es obligatoria para la modalidad presencial.');
      return;
    }

    if (!fecha || !hora) {
      setErrorMsg('Por favor selecciona una fecha y hora preferida para el diagnóstico.');
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
          plan: selectedPlan,
          modalidad,
          direccion: modalidad === 'presencial' ? direccion.trim() : '',
          fecha,
          hora,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Ocurrió un error al agendar tu diagnóstico.');
      } else {
        setSuccessMsg(
          data.message ||
            'Diagnóstico gratis agendado con éxito. Un contador de nuestro equipo se comunicará contigo para confirmar.'
        );
      }
    } catch (err) {
      console.error('Error enviando diagnóstico:', err);
      setErrorMsg('Error de conexión. Por favor verifica tus datos e intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="conta-page">
      {/* Atmósfera de estrellas y velo radial */}
      <canvas ref={canvasRef} id="stars" />
      <div className="veil" aria-hidden="true" />

      {/* 2.1 BARRA SUPERIOR */}
      <header className="conta-nav">
        <Link href="/" className="conta-brand">
          STAKEHOLDERS <span>/</span> Contabilidad
        </Link>
        <button
          type="button"
          className="pill pill--blue"
          onClick={() => scrollToDiagnostico()}
        >
          Agenda tu diagnóstico
        </button>
      </header>

      {/* BOTÓN FLOTANTE AL HACER SCROLL */}
      <div className={`conta-float-btn ${showFloatCta ? 'visible' : ''}`}>
        <button
          type="button"
          className="pill pill--blue"
          onClick={() => scrollToDiagnostico()}
          style={{ padding: '12px 22px', fontSize: '14px', fontWeight: 700 }}
        >
          Agendar diagnóstico gratis →
        </button>
      </div>

      <main style={{ position: 'relative', zIndex: 2 }}>
        {/* 2.2 HERO */}
        <section className="conta-hero">
          <div className="conta-hero__eyebrow">
            <span>Diagnóstico gratis sin compromiso</span>
          </div>
          <h1>Un equipo contable que no te deja solo</h1>
          <h2>
            Un contador y un auxiliar asignados a tu empresa llevan tus libros, presentan tus impuestos y se reúnen contigo cada semana para revisar cómo va tu negocio.
          </h2>

          <div className="conta-hero__actions">
            <button
              type="button"
              className="pill pill--blue"
              onClick={() => scrollToDiagnostico()}
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
        <section className="conta-section" id="servicio">
          <div className="conta-section__head">
            <h2>Todo lo contable de tu empresa, en un solo equipo</h2>
            <p>
              Nos encargamos de la teneduría de libros, la presentación de impuestos y tus estados financieros. Para trabajar así, tenemos cuatro principios que no negociamos.
            </p>
          </div>

          <div className="principles-grid">
            <div className="principle-card">
              <span className="principle-card__num">Principio 01</span>
              <h3>Acompañamiento completo</h3>
              <p>
                No desaparecemos entre declaración y declaración. Nos reunimos contigo cada semana.
              </p>
            </div>

            <div className="principle-card">
              <span className="principle-card__num">Principio 02</span>
              <h3>Servicio personalizado</h3>
              <p>
                Antes de proponerte nada, entendemos cómo funciona tu empresa. Tu sistema contable se diseña para ti, no se copia de otro cliente.
              </p>
            </div>

            <div className="principle-card">
              <span className="principle-card__num">Principio 03</span>
              <h3>Impuestos al día</h3>
              <p>
                Calendario tributario bajo control para que cada obligación se presente a tiempo y sin sanciones.
              </p>
            </div>

            <div className="principle-card">
              <span className="principle-card__num">Principio 04</span>
              <h3>Reducción de costos</h3>
              <p>
                Una estructura contable y tributaria bien planteada te ayuda a pagar lo justo, ni un peso de más.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="pill pill--blue"
            onClick={() => scrollToDiagnostico()}
          >
            Quiero mi diagnóstico gratis
          </button>
        </section>

        {/* 2.5 ¿CÓMO? — FORMA DE TRABAJAR */}
        <section className="conta-section" id="como-trabajamos" style={{ borderTop: '1px solid var(--line-soft)' }}>
          <div className="conta-section__head">
            <h2>Así trabajamos contigo, desde el primer día</h2>
          </div>

          {/* Línea de tiempo de 6 pasos */}
          <div className="timeline-grid">
            <div className="timeline-item">
              <div className="timeline-item__step">01</div>
              <div>
                <h4>Diagnóstico gratis</h4>
                <p>Conocemos tu empresa, presencial en Medellín o por Google Meet.</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-item__step">02</div>
              <div>
                <h4>Propuesta</h4>
                <p>Te mostramos el plan y la estructura que tu empresa necesita.</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-item__step">03</div>
              <div>
                <h4>Inicio de operación</h4>
                <p>Aceptas y arrancamos. Tu información se organiza en Drive, siempre a tu alcance.</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-item__step">04</div>
              <div>
                <h4>Reunión semanal</h4>
                <p>Revisamos contigo cómo va el negocio.</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-item__step">05</div>
              <div>
                <h4>Cierre mensual</h4>
                <p>Libros cerrados y obligaciones presentadas.</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-item__step">06</div>
              <div>
                <h4>Reporte</h4>
                <p>Números claros para tomar decisiones.</p>
              </div>
            </div>
          </div>

          {/* Bloque Tu equipo */}
          <div className="team-callout">
            <div className="team-callout__icon">👥</div>
            <p>
              <strong>Tu equipo:</strong> Cada empresa tiene un contador y un auxiliar asignados. Siempre sabes con quién hablas.
            </p>
          </div>

          {/* Bloque innovación */}
          <div className="innovation-block">
            <span className="innovation-block__tag">Tecnología propia</span>
            <h3>Contabilidad con tecnología propia</h3>
            <p>
              Contamos con un área de tecnología que desarrolla automatizaciones con inteligencia artificial y software interno a la medida de tu empresa.
            </p>
            <em>(Incluido en el plan Escala.)</em>
          </div>

          <button
            type="button"
            className="pill pill--blue"
            onClick={() => scrollToDiagnostico()}
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
              <div className="counter-box__val">+10</div>
              <div className="counter-box__lbl">Empresas activas</div>
            </div>

            <div className="counter-box">
              <div className="counter-box__val">+5</div>
              <div className="counter-box__lbl">Años de experiencia profesional</div>
            </div>

            <div className="counter-box">
              <div className="counter-box__val">2</div>
              <div className="counter-box__lbl">Años acompañando pymes</div>
            </div>

            <div className="counter-box">
              <div className="counter-box__val">Semanal</div>
              <div className="counter-box__lbl">Reunión con cada cliente</div>
            </div>
          </div>

          <button
            type="button"
            className="pill pill--blue"
            onClick={() => scrollToDiagnostico()}
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
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`plan-card ${p.featured ? 'plan-card--featured' : ''}`}
              >
                <div>
                  <div className="plan-card__header">
                    <h3 className="plan-card__name">{p.name}</h3>
                    <p className="plan-card__ideal">{p.ideal}</p>
                  </div>

                  <div className="plan-card__invoices">
                    <span>Facturas de venta / mes: <strong>{p.invoices}</strong></span>
                  </div>

                  <div className="plan-card__price">
                    <span className="plan-card__amount">{p.price}</span>
                    <span className="plan-card__period">COP / mes</span>
                  </div>

                  <div className="plan-features-list">
                    ✓ Contador y auxiliar asignados<br />
                    ✓ Reunión semanal<br />
                    ✓ Cierre mensual<br />
                    ✓ Impuestos y estados financieros
                    {p.name === 'Escala' && (
                      <>
                        <br />
                        ✓ Automatizaciones con IA y software a medida
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className={`pill ${p.featured ? 'pill--blue' : 'pill--ghost'}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => scrollToDiagnostico(p.name, p.invoices)}
                >
                  Agendar diagnóstico con este plan
                </button>
              </div>
            ))}
          </div>

          <p className="pricing-note">
            ¿No sabes cuál es el tuyo? En el diagnóstico lo definimos juntos.
          </p>
        </section>

        {/* 2.8 CTA FINAL + FORMULARIO */}
        <section className="diagnostic-section" id="diagnostico">
          <div className="diagnostic-box">
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', letterSpacing: '-.035em' }}>
              Hablemos de tu empresa
            </h2>
            <p style={{ color: 'var(--dim)', marginTop: '10px', fontSize: '1.05rem', lineHeight: 1.55 }}>
              El diagnóstico es gratis y sin compromiso. Elige si lo hacemos en tu oficina o por videollamada.
            </p>

            {successMsg ? (
              <div style={{ marginTop: '32px', textAlign: 'center', padding: '36px 20px' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(59,110,255,.15)',
                    border: '1px solid var(--blue)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 28,
                    color: 'var(--blue-hi)',
                    margin: '0 auto 18px',
                  }}
                >
                  ✓
                </div>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '10px' }}>¡Diagnóstico Agendado!</h3>
                <p style={{ color: '#D0D4DC', maxWidth: '48ch', margin: '0 auto', lineHeight: 1.6 }}>
                  {successMsg}
                </p>
                <button
                  type="button"
                  className="pill pill--ghost"
                  style={{ marginTop: '24px' }}
                  onClick={() => setSuccessMsg('')}
                >
                  Agendar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="diagnostic-form">
                <div className="form-row-2">
                  <div>
                    <label className="fld-label" htmlFor="nombre">
                      Nombre completo *
                    </label>
                    <input
                      id="nombre"
                      type="text"
                      className="fld-input"
                      placeholder="Tu nombre y apellido"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="fld-label" htmlFor="empresa">
                      Empresa *
                    </label>
                    <input
                      id="empresa"
                      type="text"
                      className="fld-input"
                      placeholder="Nombre de tu empresa o negocio"
                      required
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div>
                    <label className="fld-label" htmlFor="whatsapp">
                      WhatsApp / Celular *
                    </label>
                    <input
                      id="whatsapp"
                      type="tel"
                      className="fld-input"
                      placeholder="Ej. 300 123 4567"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="fld-label" htmlFor="correo">
                      Correo corporativo o personal *
                    </label>
                    <input
                      id="correo"
                      type="email"
                      className="fld-input"
                      placeholder="ejemplo@tuempresa.com"
                      required
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="fld-label" htmlFor="facturas">
                    Facturas de venta al mes (estimado) *
                  </label>
                  <select
                    id="facturas"
                    className="fld-select"
                    value={facturas}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setFacturas(val);
                      const matchingPlan = PLANS.find((p) => p.invoices === val);
                      if (matchingPlan) setSelectedPlan(matchingPlan.name);
                    }}
                  >
                    <option value="Hasta 30">Hasta 30 facturas / mes (Plan Arranque)</option>
                    <option value="31 a 100">31 a 100 facturas / mes (Plan Crecimiento)</option>
                    <option value="101 a 500">101 a 500 facturas / mes (Plan Consolidación)</option>
                    <option value="Más de 500">Más de 500 facturas / mes (Plan Escala)</option>
                  </select>
                </div>

                <div>
                  <label className="fld-label">
                    Modalidad de reunión *
                  </label>
                  <div className="modalidad-group">
                    <button
                      type="button"
                      className={`modalidad-btn ${modalidad === 'virtual' ? 'active' : ''}`}
                      onClick={() => setModalidad('virtual')}
                    >
                      💻 Virtual (Google Meet)
                    </button>
                    <button
                      type="button"
                      className={`modalidad-btn ${modalidad === 'presencial' ? 'active' : ''}`}
                      onClick={() => setModalidad('presencial')}
                    >
                      📍 Presencial (Medellín)
                    </button>
                  </div>
                </div>

                {modalidad === 'presencial' && (
                  <div>
                    <label className="fld-label" htmlFor="direccion">
                      Dirección de tu oficina en Medellín *
                    </label>
                    <input
                      id="direccion"
                      type="text"
                      className="fld-input"
                      placeholder="Ej. Cra 43A # 1-50, El Poblado"
                      required
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                    />
                    <p className="fld-note">
                      * Stakeholders no tiene sede propia; la reunión presencial es en la oficina del cliente.
                    </p>
                  </div>
                )}

                <div className="form-row-2">
                  <div>
                    <label className="fld-label" htmlFor="fecha">
                      Fecha preferida *
                    </label>
                    <input
                      id="fecha"
                      type="date"
                      min={minDateStr}
                      className="fld-input"
                      required
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="fld-label" htmlFor="hora">
                      Hora preferida *
                    </label>
                    <select
                      id="hora"
                      className="fld-select"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    marginTop: '8px',
                  }}
                >
                  {submitting ? 'Agendando tu diagnóstico...' : 'Agendar mi diagnóstico gratis'}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* 2.9 FOOTER */}
      <footer className="conta-footer">
        <div className="conta-footer__brand">
          STAKEHOLDERS 2026 · Área Contable
        </div>
        <nav className="conta-footer__links">
          <Link href="/nomina">Nómina</Link>
          <Link href="/renta">Renta persona natural</Link>
          <Link href="/personalizado">Servicio personalizado</Link>
        </nav>
      </footer>
    </div>
  );
}
