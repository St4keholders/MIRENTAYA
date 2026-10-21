'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import '@/app/stakeholders.css';
import { esFestivoColombia } from '@/lib/festivos';

export interface LinkAgendaData {
  id?: string;
  slug?: string;
  titulo: string;
  servicio: string;
  duracion_minutos: number;
  usuario_id?: string | null;
  profesional_nombre?: string;
}

interface Props {
  link: LinkAgendaData;
  formularioTipo?: 'agenda_link' | 'agendar';
  leadSlug?: string;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function AgendaBookingClient({
  link,
  formularioTipo = 'agenda_link',
  leadSlug = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedHora, setSelectedHora] = useState<string>('');
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [celular, setCelular] = useState('');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [citaConfirmadaData, setCitaConfirmadaData] = useState<{
    fecha: string;
    hora: string;
  } | null>(null);

  // Fondo de estrellas
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars: Array<{ x: number; y: number; r: number; a: number; t: number }> = [];
    let w = 0, h = 0, raf: number | null = null;
    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.min(Math.round((w * h) / 12000), 220) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() < 0.88 ? Math.random() * 0.7 + 0.25 : Math.random() * 1.1 + 0.8,
        a: Math.random() * 0.45 + 0.08, t: Math.random() * Math.PI * 2,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const time = performance.now() / 2600;
      for (const st of stars) {
        ctx.globalAlpha = st.a * (REDUCE ? 1 : 0.7 + 0.3 * Math.sin(time + st.t));
        ctx.fillStyle = st.r > 0.9 ? '#BFD4FF' : '#FFFFFF';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    build(); if (REDUCE) draw(); else loop();
    const onR = () => build();
    window.addEventListener('resize', onR, { passive: true });
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', onR); };
  }, []);

  // Consultar disponibilidad al cambiar la fecha seleccionada
  useEffect(() => {
    if (!selectedDate) {
      setHorasOcupadas([]);
      return;
    }
    setLoadingDisponibilidad(true);
    const params = new URLSearchParams({ fecha: selectedDate });
    if (link.usuario_id) params.set('usuario_id', link.usuario_id);

    fetch(`/api/public/disponibilidad?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        setHorasOcupadas(res.horasOcupadas || []);
      })
      .catch(() => setHorasOcupadas([]))
      .finally(() => setLoadingDisponibilidad(false));
  }, [selectedDate, link.usuario_id]);

  // Generar franjas horarias según el día seleccionado y duración
  const generarSlots = () => {
    if (!selectedDate) return [];
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const diaSemana = dateObj.getDay(); // 0 = Domingo, 6 = Sábado

    if (diaSemana === 0 || esFestivoColombia(selectedDate)) return [];

    const startMinutes = 8 * 60; // 08:00 AM
    const endMinutes = diaSemana === 6 ? 13 * 60 : 18 * 60; // Sábado hasta 13:00, L-V hasta 18:00
    const step = link.duracion_minutos || 30;

    const slots: Array<{ value: string; label: string; ocupado: boolean }> = [];

    for (let m = startMinutes; m + step <= endMinutes; m += step) {
      const hh = Math.floor(m / 60);
      const mm = m % 60;
      const hhStr = String(hh).padStart(2, '0');
      const mmStr = String(mm).padStart(2, '0');
      const val = `${hhStr}:${mmStr}`;

      const ampm = hh < 12 ? 'AM' : 'PM';
      const hh12 = hh % 12 === 0 ? 12 : hh % 12;
      const label = `${hh12}:${mmStr} ${ampm}`;

      const ocupado = horasOcupadas.includes(val);
      slots.push({ value: val, label, ocupado });
    }

    return slots;
  };

  const slots = generarSlots();

  // Calendario helpers
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedDate || !selectedHora) {
      setErrorMsg('Por favor selecciona una fecha y una hora.');
      return;
    }
    if (!nombre.trim()) {
      setErrorMsg('Por favor escribe tu nombre.');
      return;
    }
    if (!celular.trim() || celular.replace(/\D/g, '').length < 7) {
      setErrorMsg('Por favor escribe un número de teléfono válido.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formulario: formularioTipo,
          link_id: link.id || undefined,
          asignado_a: link.usuario_id || undefined,
          servicio: link.servicio || 'general',
          nombre: nombre.trim(),
          correo: correo.trim() || undefined,
          telefono: celular.trim(),
          fecha: selectedDate,
          hora: selectedHora,
          notas: notas.trim() || undefined,
          lead_slug: leadSlug || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo agendar la cita');
      }

      setCitaConfirmadaData({ fecha: selectedDate, hora: selectedHora });
      setConfirmado(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al confirmar la cita. Por favor intenta de nuevo.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const profesionalNombre = link.profesional_nombre || 'Equipo Stakeholders';

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    if (!citaConfirmadaData) return '#';
    const [y, m, d] = citaConfirmadaData.fecha.split('-').map(Number);
    const [hh, mm] = citaConfirmadaData.hora.split(':').map(Number);

    const duracion = link.duracion_minutos || 30;
    const startDate = new Date(Date.UTC(y, m - 1, d, hh + 5, mm)); // Colombia es UTC-5, sumamos 5 para UTC
    const endDate = new Date(startDate.getTime() + duracion * 60000);

    const formatGDate = (dt: Date) =>
      dt.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const dates = `${formatGDate(startDate)}/${formatGDate(endDate)}`;
    const title = encodeURIComponent(`${link.titulo} - Stakeholders`);
    const details = encodeURIComponent(
      `Asesoría con Stakeholders.\nProfesional: ${profesionalNombre}\nDuración: ${duracion} minutos.\nNos contactaremos contigo vía WhatsApp/llamada.`
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      <div className="veil" aria-hidden="true" />

      {/* Header */}
      <header
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 800,
            fontSize: 16,
            color: '#FFFFFF',
            textDecoration: 'none',
            letterSpacing: '-.02em',
          }}
        >
          STAKEHOLDERS<span style={{ color: '#3D6BFF' }}>.</span>
        </Link>
        <Link
          href="/admin/login"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
          }}
        >
          Acceso equipo
        </Link>
      </header>

      {/* Contenido Principal */}
      <main
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 16px 80px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: confirmado ? 540 : 860,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            padding: 'clamp(24px, 4vw, 40px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            transition: 'all .3s ease',
          }}
        >
          {confirmado ? (
            /* Pantalla de confirmación */
            <div style={{ textAlign: 'center', padding: '20px 8px' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(78,214,161,0.15)',
                  border: '1px solid rgba(78,214,161,0.4)',
                  color: '#4ED6A1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  margin: '0 auto 20px',
                }}
              >
                ✓
              </div>

              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  color: '#4ED6A1',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Cita Confirmada
              </span>

              <h1
                style={{
                  fontFamily: 'var(--display)',
                  fontWeight: 700,
                  fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                  margin: '0 0 14px',
                  letterSpacing: '-.03em',
                  color: '#FFFFFF',
                }}
              >
                ¡Todo listo para tu asesoría!
              </h1>

              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.6,
                  maxWidth: 440,
                  margin: '0 auto 24px',
                }}
              >
                Hemos registrado tu espacio con <strong style={{ color: '#FFFFFF' }}>{profesionalNombre}</strong> para el día <strong style={{ color: '#7DD3FC' }}>{citaConfirmadaData?.fecha}</strong> a las <strong style={{ color: '#7DD3FC' }}>{citaConfirmadaData?.hora}</strong>.
              </p>

              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '16px 20px',
                  marginBottom: 28,
                  textAlign: 'left',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ marginBottom: 6 }}>
                  • Un especialista te contactará por WhatsApp o llamada minutos antes de tu sesión.
                </div>
                <div>
                  • Puedes añadir la cita directamente a tu calendario para no olvidarla.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 24px',
                    borderRadius: 999,
                    background: '#3D6BFF',
                    color: '#FFFFFF',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    letterSpacing: '.06em',
                    boxShadow: '0 4px 20px rgba(61,107,255,0.4)',
                  }}
                >
                  📅 Añadir a Google Calendar
                </a>
                <Link
                  href="/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '12px 24px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFFFFF',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    textDecoration: 'none',
                    letterSpacing: '.06em',
                  }}
                >
                  Volver al inicio
                </Link>
              </div>
            </div>
          ) : (
            /* Vista de Agendamiento */
            <div>
              <div style={{ marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '.2em',
                      textTransform: 'uppercase',
                      color: '#7DD3FC',
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: 'rgba(125,211,252,0.1)',
                      border: '1px solid rgba(125,211,252,0.25)',
                    }}
                  >
                    {link.servicio.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '.14em',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    ⏱ {link.duracion_minutos} MINUTOS
                  </span>
                </div>

                <h1
                  style={{
                    fontFamily: 'var(--display)',
                    fontWeight: 700,
                    fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
                    margin: '0 0 8px',
                    letterSpacing: '-.03em',
                    color: '#FFFFFF',
                  }}
                >
                  {link.titulo}
                </h1>
                <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                  Asesoría personalizada con <strong style={{ color: '#FFFFFF' }}>{profesionalNombre}</strong>.
                </p>
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'rgba(255,80,80,0.12)',
                    border: '1px solid rgba(255,80,80,0.3)',
                    color: '#FF8080',
                    fontSize: 12,
                    fontFamily: 'var(--mono)',
                    marginBottom: 20,
                  }}
                >
                  ⚠️ {errorMsg}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 28,
                  alignItems: 'start',
                }}
              >
                {/* Columna Izquierda: Calendario */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '.16em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: 10,
                    }}
                  >
                    1. Selecciona el día
                  </label>

                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 14,
                      }}
                    >
                      <button
                        type="button"
                        onClick={prevMonth}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                          color: '#fff',
                          padding: '4px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        ←
                      </button>
                      <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14 }}>
                        {MESES[currentMonth]} {currentYear}
                      </span>
                      <button
                        type="button"
                        onClick={nextMonth}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                          color: '#fff',
                          padding: '4px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        →
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: 4,
                        textAlign: 'center',
                        marginBottom: 8,
                      }}
                    >
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--mono)',
                            color: i === 6 ? '#FF8080' : 'rgba(255,255,255,0.4)',
                            fontWeight: 600,
                          }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                      {Array.from({ length: startOffset }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const mm = String(currentMonth + 1).padStart(2, '0');
                        const dd = String(dayNum).padStart(2, '0');
                        const dateStr = `${currentYear}-${mm}-${dd}`;
                        const checkDate = new Date(currentYear, currentMonth, dayNum);

                        const esPasado = checkDate < today;
                        const esDomingo = checkDate.getDay() === 0;
                        const esFestivo = esFestivoColombia(dateStr);
                        const disabled = esPasado || esDomingo || esFestivo;
                        const isSelected = selectedDate === dateStr;

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setSelectedHora('');
                            }}
                            style={{
                              aspectRatio: '1',
                              borderRadius: 10,
                              background: isSelected
                                ? '#3D6BFF'
                                : disabled
                                ? 'rgba(255,255,255,0.01)'
                                : 'rgba(255,255,255,0.05)',
                              border: isSelected
                                ? '1px solid #7DD3FC'
                                : '1px solid transparent',
                              color: isSelected
                                ? '#FFFFFF'
                                : disabled
                                ? 'rgba(255,255,255,0.2)'
                                : '#FFFFFF',
                              cursor: disabled ? 'not-allowed' : 'pointer',
                              fontFamily: 'var(--mono)',
                              fontSize: 12,
                              fontWeight: isSelected ? 700 : 500,
                              transition: 'all .15s',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {dayNum}
                            {esFestivo && !esDomingo && (
                              <span style={{ fontSize: 6, color: '#FF8080' }}>Festivo</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--mono)',
                      color: 'rgba(255,255,255,0.4)',
                      marginTop: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    Lun–Vie: 8am–6pm · Sáb: 8am–1pm · Domingos y festivos colombianos cerrado.
                  </p>
                </div>

                {/* Columna Derecha: Franjas y Formulario */}
                <div>
                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        display: 'block',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        letterSpacing: '.16em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.5)',
                        marginBottom: 10,
                      }}
                    >
                      2. Horario disponible {selectedDate ? `(${selectedDate})` : ''}
                    </label>

                    {!selectedDate ? (
                      <div
                        style={{
                          padding: '24px 16px',
                          textAlign: 'center',
                          borderRadius: 14,
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px dashed rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.4)',
                          fontSize: 13,
                        }}
                      >
                        Selecciona un día en el calendario para ver las horas disponibles.
                      </div>
                    ) : loadingDisponibilidad ? (
                      <div
                        style={{
                          padding: '24px 16px',
                          textAlign: 'center',
                          color: 'rgba(255,255,255,0.5)',
                          fontSize: 13,
                        }}
                      >
                        Consultando disponibilidad…
                      </div>
                    ) : slots.length === 0 ? (
                      <div
                        style={{
                          padding: '24px 16px',
                          textAlign: 'center',
                          borderRadius: 14,
                          background: 'rgba(255,80,80,0.05)',
                          border: '1px solid rgba(255,80,80,0.2)',
                          color: '#FF8080',
                          fontSize: 13,
                        }}
                      >
                        No hay horarios de atención disponibles en esta fecha.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
                          gap: 8,
                          maxHeight: 180,
                          overflowY: 'auto',
                          paddingRight: 4,
                        }}
                      >
                        {slots.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            disabled={s.ocupado}
                            onClick={() => setSelectedHora(s.value)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 10,
                              background: selectedHora === s.value
                                ? '#3D6BFF'
                                : s.ocupado
                                ? 'rgba(255,255,255,0.02)'
                                : 'rgba(255,255,255,0.06)',
                              border: selectedHora === s.value
                                ? '1px solid #7DD3FC'
                                : '1px solid rgba(255,255,255,0.1)',
                              color: selectedHora === s.value
                                ? '#FFFFFF'
                                : s.ocupado
                                ? 'rgba(255,255,255,0.2)'
                                : '#FFFFFF',
                              fontFamily: 'var(--mono)',
                              fontSize: 11,
                              cursor: s.ocupado ? 'not-allowed' : 'pointer',
                              textDecoration: s.ocupado ? 'line-through' : 'none',
                              transition: 'all .15s',
                            }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Formulario de Datos */}
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <label
                      style={{
                        display: 'block',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        letterSpacing: '.16em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      3. Tus datos de contacto
                    </label>

                    <input
                      type="text"
                      placeholder="Nombre completo *"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 10,
                        color: '#FFFFFF',
                        fontFamily: 'var(--body)',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <input
                        type="tel"
                        placeholder="Teléfono / WhatsApp *"
                        required
                        value={celular}
                        onChange={(e) => setCelular(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 10,
                          color: '#FFFFFF',
                          fontFamily: 'var(--body)',
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 10,
                          color: '#FFFFFF',
                          fontFamily: 'var(--body)',
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <textarea
                      placeholder="Notas adicionales o qué necesitas consultar (opcional)"
                      rows={2}
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 10,
                        color: '#FFFFFF',
                        fontFamily: 'var(--body)',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'none',
                      }}
                    />

                    <button
                      type="submit"
                      disabled={submitting || !selectedDate || !selectedHora}
                      style={{
                        padding: '14px 20px',
                        borderRadius: 12,
                        background: !selectedDate || !selectedHora
                          ? 'rgba(61,107,255,0.3)'
                          : 'linear-gradient(135deg, #3D6BFF, #6B8FFF)',
                        border: 'none',
                        color: '#FFFFFF',
                        fontFamily: 'var(--mono)',
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '.1em',
                        textTransform: 'uppercase',
                        cursor: !selectedDate || !selectedHora || submitting ? 'not-allowed' : 'pointer',
                        boxShadow: selectedDate && selectedHora ? '0 4px 24px rgba(61,107,255,0.45)' : 'none',
                        marginTop: 6,
                        transition: 'all .2s',
                      }}
                    >
                      {submitting ? 'Confirmando…' : 'Confirmar Cita'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
