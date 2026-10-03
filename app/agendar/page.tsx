'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import '@/app/stakeholders.css';
import { setRefCookie } from '@/lib/referral';

/* ── Componente de Calendario Interactivo ────────────────────────────────── */
function CustomCalendar({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Obtener primer día y total de días del mes actual
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // En JavaScript getDay(): 0 = Domingo, 1 = Lunes. Queremos 0 = Lunes, 6 = Domingo
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

  const isToday = (d: number) => {
    return (
      d === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isPast = (d: number) => {
    const checkDate = new Date(currentYear, currentMonth, d);
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return checkDate < startToday;
  };

  const isSunday = (d: number) => {
    const checkDate = new Date(currentYear, currentMonth, d);
    return checkDate.getDay() === 0; // 0 = Domingo
  };

  const formatDateStr = (d: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)', padding: 16,
    }}>
      {/* Header del mes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button
          type="button"
          onClick={prevMonth}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#fff', padding: '4px 10px', cursor: 'pointer', fontSize: 13,
          }}
        >
          ←
        </button>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>
          {monthNames[currentMonth]} {currentYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#fff', padding: '4px 10px', cursor: 'pointer', fontSize: 13,
          }}
        >
          →
        </button>
      </div>

      {/* Días de la semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 8 }}>
        {daysOfWeek.map((day, idx) => (
          <span key={day} style={{
            fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase',
            color: idx === 6 ? '#FF8080' : 'rgba(255,255,255,0.4)', fontWeight: 600,
          }}>
            {day}
          </span>
        ))}
      </div>

      {/* Rejilla de días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {/* Espacios vacíos del inicio del mes */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Días del mes */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = formatDateStr(dayNum);
          const selected = selectedDate === dateStr;
          const disabled = isPast(dayNum) || isSunday(dayNum);
          const sunday = isSunday(dayNum);

          return (
            <button
              key={dayNum}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(dateStr)}
              style={{
                aspectRatio: '1', borderRadius: 10,
                background: selected
                  ? '#3D6BFF'
                  : isToday(dayNum)
                  ? 'rgba(61,107,255,0.2)'
                  : sunday
                  ? 'rgba(255,80,80,0.06)'
                  : 'rgba(255,255,255,0.04)',
                border: selected
                  ? '1px solid #7DD3FC'
                  : isToday(dayNum)
                  ? '1px solid rgba(61,107,255,0.5)'
                  : '1px solid transparent',
                color: selected
                  ? '#FFFFFF'
                  : disabled
                  ? 'rgba(255,255,255,0.2)'
                  : '#FFFFFF',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--mono)', fontSize: 12, fontWeight: selected || isToday(dayNum) ? 700 : 500,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: selected ? '0 0 12px rgba(61,107,255,0.6)' : 'none',
                transition: 'all .15s', opacity: disabled ? 0.4 : 1,
              }}
            >
              {dayNum}
              {sunday && <span style={{ fontSize: 7, color: '#FF8080', textTransform: 'uppercase' }}>Cerrado</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Agendar Component ─────────────────────────────────────────── */
function AgendarContent() {
  const searchParams = useSearchParams();
  const leadSlug = searchParams.get('lead') || '';

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [celular, setCelular] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(todayStr);
  const [hora, setHora] = useState('08:00');
  const [medioContacto, setMedioContacto] = useState<'llamada' | 'videollamada' | 'whatsapp'>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Capturar cookie de referido si viene con ?ref=
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setRefCookie(ref);
  }, [searchParams]);

  // Generar franjas horarias según el día seleccionado:
  // Lunes a Viernes: 8am a 4pm (08:00 - 16:00)
  // Sábado: 8am a 2pm (08:00 - 14:00)
  // Domingo: Cerrado (sin franjas)
  const getAvailableSlots = (dateString: string) => {
    if (!dateString) return [];
    const dateObj = new Date(`${dateString}T12:00:00Z`);
    const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 6 = Sábado

    if (dayOfWeek === 0) return []; // Domingo no atendemos

    const endHour = dayOfWeek === 6 ? 14 : 16; // Sábado hasta 14:00, L-V hasta 16:00
    const slots = [];
    for (let h = 8; h <= endHour; h++) {
      const hh = String(h).padStart(2, '0');
      const label = h < 12 ? `${hh}:00 AM` : h === 12 ? '12:00 PM' : `${String(h - 12).padStart(2, '0')}:00 PM`;
      slots.push({ value: `${hh}:00`, label });
    }
    return slots;
  };

  const availableSlots = getAvailableSlots(fecha);

  // Asegurar que si la hora seleccionada no está disponible para el nuevo día, resetear a la primera
  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.some((s) => s.value === hora)) {
      setHora(availableSlots[0].value);
    }
  }, [fecha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !celular.trim() || !fecha) {
      setErrorMsg('Por favor completa tu nombre, celular y fecha de cita');
      return;
    }

    if (availableSlots.length === 0) {
      setErrorMsg('Los domingos no atendemos. Selecciona un día entre Lunes y Sábado.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const refParam = searchParams.get('ref') || (typeof document !== 'undefined' ? (document.cookie.match(/(?:^|; )rentash_ref=([^;]*)/)?.[1] ? decodeURIComponent(document.cookie.match(/(?:^|; )rentash_ref=([^;]*)/)![1]) : null) : null);
      const fechaConsulta = `${fecha}T${hora}:00Z`;

      // Registrar cita y generar cobro en paralelo para máxima velocidad
      const agendarPromise = fetch('/api/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim() || `${celular.trim()}@stakeholders.app`,
          celular: celular.trim(),
          fecha: fechaConsulta,
          hora,
          medio_contacto: medioContacto,
          ref: refParam || undefined,
        }),
      }).catch((err) => console.warn('[Agendar] Error agendando:', err));

      const checkoutPromise = fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_slug: leadSlug || undefined,
          customer_name: nombre.trim(),
          customer_email: correo.trim() || undefined,
          customer_phone: celular.trim(),
        }),
      });

      const [, checkoutRes] = await Promise.all([agendarPromise, checkoutPromise]);

      if (checkoutRes && checkoutRes.ok) {
        const checkoutData = await checkoutRes.json();
        if (checkoutData.checkoutUrl) {
          window.location.href = checkoutData.checkoutUrl;
          return;
        }
      }
      throw new Error('No se pudo generar la pasarela de pago');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al agendar';
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 580, width: '100%', borderRadius: 24,
      background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(24px, 5vw, 36px)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.6)', color: '#FFFFFF', position: 'relative', zIndex: 10,
    }}>
      {/* Badge */}
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em',
        textTransform: 'uppercase', color: '#7DD3FC', display: 'inline-block',
        padding: '4px 10px', borderRadius: 999, background: 'rgba(125,211,252,0.1)',
        border: '1px solid rgba(125,211,252,0.25)', marginBottom: 14,
      }}>
        Agendamiento Directo
      </span>

      <h1 style={{
        fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
        margin: '0 0 8px', letterSpacing: '-.03em', lineHeight: 1.15, color: '#FFFFFF',
      }}>
        Reserva tu Consultoría Contable
      </h1>

      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', lineHeight: 1.5 }}>
        1 hora de asesoría personalizada con un contador experto por <strong style={{ color: '#4ED6A1' }}>$50.000 COP</strong>. El monto pagado se abona al valor final de tu declaración.
      </p>

      {errorMsg && (
        <div style={{
          padding: '12px 16px', borderRadius: 12, background: 'rgba(255,80,80,0.12)',
          border: '1px solid rgba(255,80,80,0.3)', color: '#FF8080', fontSize: 12,
          fontFamily: 'var(--mono)', marginBottom: 18,
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Datos Personales */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
            Nombre Completo *
          </label>
          <input
            type="text"
            required
            placeholder="Ej. María Fernanda Gómez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#FFFFFF', fontSize: 14, fontFamily: 'var(--body)', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              Celular (WhatsApp) *
            </label>
            <input
              type="tel"
              required
              placeholder="300 123 4567"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF', fontSize: 14, fontFamily: 'var(--mono)', outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="cliente@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#FFFFFF', fontSize: 14, fontFamily: 'var(--body)', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* CALENDARIO INTERACTIVO VISUAL */}
        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            <span>Selecciona la Fecha de la Cita *</span>
            <span style={{ color: '#4ED6A1' }}>L-V: 8am-4pm | Sáb: 8am-2pm</span>
          </label>
          <CustomCalendar selectedDate={fecha} onSelectDate={setFecha} />
        </div>

        {/* FRANJAS HORARIAS DISPONIBLES */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            Hora de Atención Disponible
          </label>
          {availableSlots.length === 0 ? (
            <div style={{
              padding: '12px', borderRadius: 12, background: 'rgba(255,80,80,0.1)',
              border: '1px solid rgba(255,80,80,0.25)', color: '#FF8080', fontSize: 12, textAlign: 'center',
            }}>
              🚫 Los domingos no atendemos. Selecciona un día entre Lunes y Sábado.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
              {availableSlots.map((slot) => {
                const active = hora === slot.value;
                return (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setHora(slot.value)}
                    style={{
                      padding: '8px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                      background: active ? '#4ED6A1' : 'rgba(255,255,255,0.04)',
                      border: active ? '1px solid #7DD3FC' : '1px solid rgba(255,255,255,0.08)',
                      color: active ? '#000000' : 'rgba(255,255,255,0.85)',
                      fontFamily: 'var(--mono)', fontSize: 11, fontWeight: active ? 700 : 500,
                      boxShadow: active ? '0 0 12px rgba(78,214,161,0.5)' : 'none',
                      transition: 'all .15s',
                    }}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Medio de Contacto */}
        <div>
          <label style={{ display: 'block', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            Canal de Atención Preferido
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { id: 'whatsapp', label: '💬 WhatsApp', sub: 'Mensajes / Audio' },
              { id: 'videollamada', label: '💻 Videollamada', sub: 'Meet / Zoom' },
              { id: 'llamada', label: '📞 Llamada', sub: 'Telefónica' },
            ].map((item) => {
              const active = medioContacto === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMedioContacto(item.id as any)}
                  style={{
                    padding: '10px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    background: active ? 'rgba(61,107,255,0.2)' : 'rgba(255,255,255,0.04)',
                    border: active ? '1px solid #3D6BFF' : '1px solid rgba(255,255,255,0.08)',
                    color: active ? '#7DD3FC' : 'rgba(255,255,255,0.7)', transition: 'all .15s',
                  }}
                >
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700 }}>{item.label}</span>
                  <span style={{ display: 'block', fontSize: 9, opacity: 0.7, marginTop: 2, fontFamily: 'var(--mono)' }}>{item.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resumen de cobro */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4,
        }}>
          <div>
            <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Valor Consultoría</span>
            <span style={{ fontSize: 10, color: '#4ED6A1', fontFamily: 'var(--mono)' }}>Abonable a tu declaración</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: '#4ED6A1' }}>
            $50.000 COP
          </span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || availableSlots.length === 0}
          style={{
            width: '100%', padding: '15px', borderRadius: 14,
            background: loading || availableSlots.length === 0 ? 'rgba(61,107,255,0.4)' : 'linear-gradient(135deg, #3D6BFF, #6B8FFF)',
            color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 15,
            fontFamily: 'var(--display)', cursor: loading || availableSlots.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 30px -4px rgba(61,107,255,0.5)', transition: 'transform .15s',
            marginTop: 6,
          }}
        >
          {loading ? 'Generando pasarela...' : 'Ir a Pagar ($50.000 COP) →'}
        </button>
      </form>
    </div>
  );
}

export default function AgendarPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars: Array<{ x: number; y: number; r: number; a: number; s: number; t: number }> = [];
    let w = 0, h = 0, dpr = 1, raf: number | null = null;

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 10000);
      stars = Array.from({ length: Math.min(n, 260) }, () => ({
        x: Math.random() * w, y: Math.random() * h * 1.5,
        r: Math.random() < 0.88 ? Math.random() * 0.75 + 0.3 : Math.random() * 1.2 + 0.8,
        a: Math.random() * 0.5 + 0.1, s: Math.random() * 0.55 + 0.12,
        t: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const time = performance.now() / 2400;
      for (const st of stars) {
        const tw = REDUCE ? 1 : 0.65 + 0.35 * Math.sin(time + st.t);
        ctx.globalAlpha = st.a * tw;
        ctx.fillStyle = st.r > 0.9 ? '#BFD4FF' : '#FFFFFF';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => { draw(); raf = requestAnimationFrame(loop); };

    build();
    REDUCE ? draw() : loop();

    const onResize = () => build();
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: '#000000', color: '#FFFFFF',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 16px', position: 'relative', overflow: 'hidden',
    }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(120% 70% at 50% 0%, rgba(59,110,255,.18) 0%, rgba(0,0,0,0) 65%)',
      }} />

      <header style={{ position: 'relative', zIndex: 10, marginBottom: 24, textAlign: 'center' }}>
        <Link href="/renta" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: '#FFFFFF', textDecoration: 'none', letterSpacing: '-.03em' }}>
          STAKEHOLDERS<span style={{ color: '#3D6BFF' }}>.</span>
        </Link>
      </header>

      <Suspense fallback={<div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono)', fontSize: 13, position: 'relative', zIndex: 10 }}>Cargando formulario...</div>}>
        <AgendarContent />
      </Suspense>
    </div>
  );
}
