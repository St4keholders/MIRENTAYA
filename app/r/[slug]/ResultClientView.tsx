'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ARCHETYPES, ASSET_BASE } from '@/components/stakeholders/archetypes';
import { trackLead } from '@/components/MetaPixel';

const FADE_STYLE = `
@keyframes fadeOutScreen {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
.intro-fading {
  animation: fadeOutScreen 0.7s cubic-bezier(.22,1,.36,1) forwards;
  pointer-events: none;
}
`;
import '@/app/stakeholders.css';

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/* ── Types ──────────────────────────────────────────────────────────── */
interface Arquetipo {
  slug: string;
  nombre: string;
  tagline: string;
  descripcion: string;
  url_imagen: string;
  url_video: string;
}

interface LeadData {
  id: string;
  slug_publico: string;
  nombre: string;
  celular?: string;
  correo?: string;
  debe_declarar: boolean;
  topes_superados: string[];
  barra_patrimonio: number;
  barra_ingresos: number;
  barra_creditos: number;
  barra_movimientos: number;
  fecha_vencimiento: string;
  extemporaneo: boolean;
  arquetipos: Arquetipo;
}

const SLUG_IDX: Record<string, number> = {
  emperor: 0, emperador: 0, mago: 1, gladiador: 2,
  malabarista: 3, mochilero: 4, sonador: 5,
};

/* ── StatBar: bar fill using div ────────────────────────────────────── */
function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 44px', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: 'var(--mono)', fontStyle: 'normal', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </span>
      <span style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', display: 'block' }}>
        <div style={{ height: '100%', borderRadius: 99, background: color, width: `${value}%` }} />
      </span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>
        {value}/100
      </span>
    </div>
  );
}

/* ── IntroOverlay: fullscreen video on result load ─────────────────── */
function IntroOverlay({
  src, accent, done, onEnd, onError,
}: { src: string; accent: string; done: boolean; onEnd: () => void; onError: () => void }) {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  const skip = () => {
    setFading(true);
    setTimeout(() => { setHidden(true); onEnd(); }, 700);
  };

  useEffect(() => { if (done && !fading) skip(); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (hidden) return null;

  return (
    <>
      <style>{FADE_STYLE}</style>
      <div
        className={fading ? 'intro-fading' : ''}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <video
          src={src}
          autoPlay
          muted
          playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          onEnded={skip}
          onError={onError}
        />
        <button
          onClick={skip}
          style={{
            position: 'absolute', bottom: 28, right: 24, zIndex: 10,
            background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.28)', borderRadius: 999,
            color: '#fff', fontFamily: 'var(--mono)', fontSize: 11,
            letterSpacing: '.18em', textTransform: 'uppercase',
            padding: '10px 20px', cursor: 'pointer',
            boxShadow: `0 4px 24px -4px ${accent}66`,
          }}
        >
          Saltar video ✕
        </button>
      </div>
    </>
  );
}

/* ── Component ──────────────────────────────────────────────────────── */
export default function ResultClientView({ lead }: { lead: LeadData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  const [introEnded, setIntroEnded] = useState(false);
  const [introError, setIntroError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlaying, setModalPlaying] = useState(false);
  const [modalReversed, setModalReversed] = useState(false);
  const [copied, setCopied] = useState(false);

  /* Agendar Modal state */
  const [agendarOpen, setAgendarOpen] = useState(false);
  const [agNombre, setAgNombre] = useState('');
  const [agCorreo, setAgCorreo] = useState('');
  const [agTel, setAgTel] = useState('');
  const [agMedio, setAgMedio] = useState<'llamada' | 'videollamada' | 'whatsapp'>('llamada');
  const [agDateSelected, setAgDateSelected] = useState<Date | null>(null);
  const [agHoraSelected, setAgHoraSelected] = useState('');
  const [calViewDate, setCalViewDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [agSubmitting, setAgSubmitting] = useState(false);
  const [agErr, setAgErr] = useState('');
  const [agDoneTxt, setAgDoneTxt] = useState('');

  const arquetipo = lead.arquetipos;
  const arqData = ARCHETYPES[SLUG_IDX[arquetipo?.slug ?? ''] ?? 5];
  const videoSrc = ASSET_BASE + arqData.vid;

  /* Stars canvas */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars: Array<{ x: number; y: number; r: number; a: number; t: number }> = [];
    let w = 0, h = 0, dpr = 1, raf: number | null = null;
    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 12000);
      stars = Array.from({ length: Math.min(n, 260) }, () => ({
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
    build(); REDUCE ? draw() : loop();
    const onR = () => build();
    window.addEventListener('resize', onR, { passive: true });
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', onR); };
  }, []);

  /* Dark body */
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#000';
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  /* Meta Pixel — Lead: dedup por slug para no inflar conversiones
     en recargas, visitas repetidas o links compartidos desde el mismo dispositivo. */
  useEffect(() => {
    const key = `lead_sent_${lead.slug_publico}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch {
      // Safari en privado puede romper localStorage;
      // preferimos un falso positivo ocasional a perder la conversión real.
    }
    trackLead();
  }, [lead.slug_publico]);

  /* Modal Card */
  const handleOpenCard = () => {
    setModalReversed(false); setModalPlaying(false); setModalOpen(true);
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (modalVideoRef.current) {
        modalVideoRef.current.src = videoSrc;
        modalVideoRef.current.currentTime = 0;
        modalVideoRef.current.muted = false;
        const p = modalVideoRef.current.play();
        if (p) p.then(() => setModalPlaying(true)).catch(() => {
          if (modalVideoRef.current) { modalVideoRef.current.muted = true; modalVideoRef.current.play().then(() => setModalPlaying(true)).catch(handleRevealInfo); }
        });
      }
    }, 60);
  };

  const handleRevealInfo = () => {
    setModalPlaying(false); setModalReversed(true);
    if (modalVideoRef.current) modalVideoRef.current.pause();
  };

  const handleCloseModal = () => {
    if (modalVideoRef.current) { modalVideoRef.current.pause(); modalVideoRef.current.src = ''; }
    setModalOpen(false); setModalPlaying(false); setModalReversed(false);
    document.body.style.overflow = '';
  };

  /* Agendar Modal helpers */
  const handleOpenAgendar = () => {
    setAgNombre(lead.nombre || '');
    setAgCorreo(lead.correo || '');
    setAgTel(lead.celular || '');
    setAgMedio('llamada');
    setAgDateSelected(null);
    setAgHoraSelected('');
    setAgErr('');
    setAgDoneTxt('');
    setAgSubmitting(false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCalViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

    setAgendarOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseAgendar = () => {
    setAgendarOpen(false);
    document.body.style.overflow = '';
  };

  const getSlotsForDate = (date: Date) => {
    const d = date.getDay();
    if (d === 0) return [];
    const end = d === 6 ? 14 : 18;
    const out: string[] = [];
    for (let h = 8; h < end; h++) {
      out.push(`${String(h).padStart(2, '0')}:00`);
      out.push(`${String(h).padStart(2, '0')}:30`);
    }
    return out;
  };

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today && date.getDay() !== 0;
  };

  const handleSelectDate = (date: Date) => {
    setAgDateSelected(date);
    const slots = getSlotsForDate(date);
    setAgHoraSelected(slots.length > 0 ? slots[0] : '');
  };

  const handleSubmitAgendar = async () => {
    setAgErr('');
    if (!agNombre.trim()) {
      setAgErr('Escribe tu nombre.');
      return;
    }
    if (!agDateSelected) {
      setAgErr('Elige una fecha disponible para tu consulta.');
      return;
    }
    if (agTel.replace(/\D/g, '').length < 7) {
      setAgErr('Revisa tu número de contacto.');
      return;
    }

    setAgSubmitting(true);

    try {
      const year = agDateSelected.getFullYear();
      const month = String(agDateSelected.getMonth() + 1).padStart(2, '0');
      const day = String(agDateSelected.getDate()).padStart(2, '0');
      const formattedDateStr = `${year}-${month}-${day}`;
      const fechaConsulta = `${formattedDateStr}T${agHoraSelected || '08:00'}:00Z`;

      setAgDoneTxt(`Gracias, ${agNombre.trim().split(' ')[0]}. Redirigiendo al pago de tu consultoría...`);

      // Guardar cita y generar checkout de forma paralela para acelerar la redirección
      const ventasPromise = fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadSlug: lead.slug_publico,
          fechaConsulta,
          medioContacto: agMedio,
        }),
      }).catch((err) => console.warn('[ResultClientView] Error guardando cita:', err));

      const checkoutPromise = fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_slug: lead.slug_publico,
          customer_name: agNombre,
          customer_email: agCorreo || undefined,
          customer_phone: agTel,
        }),
      });

      const [, checkoutRes] = await Promise.all([ventasPromise, checkoutPromise]);

      if (checkoutRes && checkoutRes.ok) {
        const dataCheckout = await checkoutRes.json();
        if (dataCheckout.checkoutUrl) {
          window.location.href = dataCheckout.checkoutUrl;
          return;
        }
      }
      throw new Error('No se pudo generar enlace de cobro');
    } catch (err) {
      console.error('Error agendando cita:', err);
      setAgErr('Error de conexión. Por favor intenta de nuevo.');
      setAgSubmitting(false);
    }
  };

  const renderCalendarDays = () => {
    const year = calViewDate.getFullYear();
    const month = calViewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const leadEmptyDays = (firstDay.getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const elements: React.ReactNode[] = [];

    for (let i = 0; i < leadEmptyDays; i++) {
      elements.push(<div key={`empty-${i}`} className="cal__day empty" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const ok = isDateAvailable(date);
      const isSelected = agDateSelected && date.getTime() === agDateSelected.getTime();

      elements.push(
        <button
          key={`day-${d}`}
          type="button"
          disabled={!ok}
          className={`cal__day ${ok ? 'on' : 'off'} ${isSelected ? 'sel' : ''}`}
          onClick={() => ok && handleSelectDate(date)}
        >
          {d}
        </button>
      );
    }

    return elements;
  };

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const canPrevMonth =
    calViewDate.getFullYear() > todayDate.getFullYear() ||
    (calViewDate.getFullYear() === todayDate.getFullYear() && calViewDate.getMonth() > todayDate.getMonth());
  const limitDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + 3, 1);
  const canNextMonth = calViewDate < limitDate;

  /* Share */
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `${lead.nombre} es ${arqData.n}`, url }); } catch { copyUrl(url); }
    } else { copyUrl(url); }
  };
  const copyUrl = (u: string) => { navigator.clipboard.writeText(u); setCopied(true); setTimeout(() => setCopied(false), 3000); };

  const formattedFecha = lead.fecha_vencimiento
    ? new Date(lead.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const modalClasses = ['modal', modalOpen ? 'open' : '', modalPlaying ? 'playing' : '', modalReversed ? 'reversed' : ''].filter(Boolean).join(' ');

  /* Shared styles */
  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.10)', borderRadius: 22,
    padding: 'clamp(20px,5vw,36px)', marginBottom: 20,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', position: 'relative' }}>
      <canvas ref={canvasRef} id="stars" aria-hidden="true" />
      <div className="veil" aria-hidden="true" />

      {/* NAV */}
      <header className="nav stuck" style={{ zIndex: 60 }}>
        <Link href="/renta" className="brand">STAKEHOLDERS<i /></Link>
        <button onClick={handleShare} style={{
          fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase' as const,
          color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 999, padding: '8px 14px', cursor: 'pointer', background: 'none',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {copied ? '¡Copiado! ✓' : 'Compartir 🔗'}
        </button>
      </header>

      <main style={{ position: 'relative', zIndex: 2, paddingTop: 88, paddingBottom: 72, maxWidth: 580, margin: '0 auto', padding: '88px 20px 72px' }}>

        {/* ── Archetype card with glow ── */}
        <div
          className="card-slot on"
          style={{
            '--hA': arqData.hA, '--hB': arqData.hB,
            '--c2': arqData.c2, '--accent': arqData.accent, '--glow': '0.75',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            position: 'relative', padding: '28px 0 72px', marginBottom: '-40px',
          } as React.CSSProperties}
        >
          <div className="splash" />
          <div
            className="card"
            style={{
              transform: 'none', width: 'min(76vw, 290px)', cursor: 'pointer',
              boxShadow: `0 20px 50px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.08), 0 0 60px -18px ${arqData.accent}`,
            }}
          >
            {arquetipo?.url_imagen && <img src={arquetipo.url_imagen} alt={arqData.n} />}
            <button className="card__hit" onClick={handleOpenCard} aria-label={`Ver más sobre ${arqData.n}`} />
            <span className="card__more">Clic para conocer más</span>
            <span className="card__name">{arqData.n}</span>
          </div>
        </div>

        {/* ── Bars + archetype title card ── */}
        <div style={{ ...card, boxShadow: `0 0 50px -10px ${arqData.accent}28`, position: 'relative', zIndex: 5 }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase' as const, color: arqData.accent, display: 'block', marginBottom: 8 }}>
              Carta de Arquetipo
            </span>
            <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,5.5vw,2.2rem)', letterSpacing: '-.04em', color: '#fff', margin: '0 0 8px', lineHeight: 1.1 }}>
              {arqData.n}
            </h2>
            <p style={{ fontFamily: 'var(--body)', fontSize: 14, color: arqData.accent, margin: 0, fontStyle: 'italic', opacity: 0.9, lineHeight: 1.45 }}>
              &quot;{arqData.f}&quot;
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <StatBar label="PATRIMONIO" value={lead.barra_patrimonio} color="#F0B93C" />
            <StatBar label="INGRESOS" value={lead.barra_ingresos} color="#4ED6A1" />
            <StatBar label="CRÉDITOS" value={lead.barra_creditos} color="#FF6B8A" />
            <StatBar label="MOVIMIENTOS" value={lead.barra_movimientos} color="#7DD3FC" />
          </div>

          <button onClick={handleOpenCard} className="pill pill--ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 18, fontSize: 13 }}>
            Ver perfil completo del arquetipo
          </button>
        </div>

        {/* ── Veredicto legal ── */}
        <div style={card}>
          {/* Nombre + badge */}
          <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.2rem,4.5vw,1.6rem)', letterSpacing: '-.03em', color: '#fff', margin: '0 0 12px', lineHeight: 1.2 }}>
            {lead.nombre}
          </h3>

          {lead.debe_declarar ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px',
              borderRadius: 999, background: 'rgba(255,80,80,0.18)', border: '1px solid rgba(255,100,100,0.35)',
              color: '#FF8080', fontSize: 12, fontWeight: 600, fontFamily: 'var(--body)', marginBottom: 20,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF5050', flexShrink: 0 }} />
              Estás obligado a declarar Renta
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px',
              borderRadius: 999, background: 'rgba(78,214,161,0.15)', border: '1px solid rgba(78,214,161,0.3)',
              color: '#4ED6A1', fontSize: 12, fontWeight: 600, fontFamily: 'var(--body)', marginBottom: 20,
            }}>
              No superaste los topes obligatorios
            </span>
          )}

          {/* Fecha */}
          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>
              Fecha límite de presentación de declaración de renta
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(1.1rem,4vw,1.5rem)', color: '#3D6BFF', margin: 0, letterSpacing: '-.01em' }}>
              {formattedFecha}
            </p>
            {lead.extemporaneo && (
              <p style={{ fontFamily: 'var(--body)', fontSize: 12, color: '#FF8080', margin: '6px 0 0', fontWeight: 600 }}>
                ⚠️ Ya estás en extemporaneidad
              </p>
            )}
          </div>

          {/* Topes */}
          {lead.topes_superados?.length > 0 ? (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>
                Topes legales que activaron tu obligación:
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lead.topes_superados.map((tope, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--body)', lineHeight: 1.5 }}>
                    <span style={{ color: '#FF8080', fontWeight: 700, marginTop: 2, flexShrink: 0 }}>•</span>
                    {tope}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>
              Tus ingresos, consumos, consignaciones y patrimonio se mantuvieron por debajo de los umbrales de la DIAN para el año gravable 2025.
            </p>
          )}

          {/* Disclaimer */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontFamily: 'var(--body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.7 }}>
              <strong style={{ color: 'rgba(255,255,255,0.65)', display: 'block', marginBottom: 4 }}>📌 Disclaimer:</strong>
              Este resultado es un estimado orientativo basado en lo que nos contaste. Lo mejor siempre será confirmarlo con un contador titulado profesional.
            </p>
          </div>
        </div>

        {/* ── CTA Agendar ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(61,107,255,0.15), rgba(61,107,255,0.05))',
          border: '1px solid rgba(61,107,255,0.35)', borderRadius: 22,
          padding: 'clamp(20px,5vw,36px)', marginBottom: 24,
        }}>
          <h4 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.1rem,4vw,1.4rem)', color: '#fff', margin: '0 0 8px', letterSpacing: '-.03em' }}>
            {lead.debe_declarar ? 'Agenda con un Contador' : 'Confírmalo con un Contador'}
          </h4>
          <p style={{ fontFamily: 'var(--body)', fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '0 0 8px', lineHeight: 1.55 }}>
            {lead.debe_declarar
              ? 'Garantiza que tu declaración se presente sin errores y a tiempo.'
              : 'Una revisión experta te certifica si estás libre de declarar.'}
          </p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#3D6BFF', margin: '0 0 20px', letterSpacing: '.06em' }}>
            $50.000 COP · Abonables al servicio
          </p>
          <button onClick={handleOpenAgendar} className="pill pill--blue" type="button">
            Agendar Asesoría →
          </button>
        </div>

        {/* ── Footer links ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={handleShare} className="pill pill--ghost" style={{ fontSize: 12 }}>
            {copied ? '¡Enlace Copiado! ✓' : 'Compartir Resultado 📤'}
          </button>
          <Link href="/test" className="pill pill--ghost" style={{ fontSize: 12 }}>
            Repetir el test →
          </Link>
        </div>
      </main>

      {/* ── Fullscreen intro video overlay ── */}
      {!introError && (
        <IntroOverlay
          src={videoSrc}
          accent={arqData.accent}
          done={introEnded}
          onEnd={() => setIntroEnded(true)}
          onError={() => setIntroError(true)}
        />
      )}

      {/* ── Modal Card (video + flip info) ── */}
      <div
        className={modalClasses}
        style={{ '--accent': arqData.accent, '--c2': arqData.c2 } as React.CSSProperties}
      >
        <div className="modal__bg" onClick={handleCloseModal} />
        <div className="modal__card">
          <button className="modal__close" onClick={handleCloseModal} aria-label="Cerrar">✕</button>
          <div className="modal__stage">
            {arquetipo?.url_imagen && <img src={arquetipo.url_imagen} alt={arqData.n} />}
            <video ref={modalVideoRef} playsInline loop={false} onEnded={handleRevealInfo} />
            <div className="modal__load">
              <i /><span className="modal__loadtxt">Cargando...</span>
              <button className="modal__skip" onClick={handleRevealInfo}>Ver info</button>
            </div>
          </div>
          <div className="modal__info">
            <h3 style={{ fontFamily: 'var(--display)', letterSpacing: '-.03em' }}>{arqData.n}</h3>
            <p className="modal__frase" style={{ fontFamily: 'var(--body)' }}>{arqData.f}</p>
            <p className="modal__text" style={{ fontFamily: 'var(--body)' }} dangerouslySetInnerHTML={{ __html: arqData.t }} />
            <div className="bars" style={{ marginTop: 20 }}>
              {[
                { label: 'INGRESOS', val: arqData.b.INGRESOS },
                { label: 'DEUDA', val: arqData.b.DEUDA },
                { label: 'AHORRO', val: arqData.b.AHORRO },
                { label: 'MOVS', val: arqData.b.MOVS },
              ].map(({ label, val }) => (
                <div key={label} className="bar">
                  <i>{label}</i>
                  <span><b style={{ '--v': val } as React.CSSProperties} /></span>
                  <u>{Math.round(val * 100)}</u>
                </div>
              ))}
            </div>
            <span className="verdict">{arqData.v}</span>
          </div>
        </div>
      </div>

      {/* ── MODAL AGENDAR CONSULTA (POPUP DE RESULTADO) ── */}
      <div
        className={`sheet ${agendarOpen ? 'open' : ''}`}
        id="agendar-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ag-title"
      >
        <div className="sheet__bg" onClick={handleCloseAgendar} />
        <div className="sheet__card">
          <button className="sheet__close" onClick={handleCloseAgendar} aria-label="Cerrar">
            ✕
          </button>

          {!agDoneTxt ? (
            <div className="sheet__body" id="ag-form">
              <p className="sheet__eyebrow">Stakeholders</p>
              <h3 id="ag-title">Agendar consulta</h3>
              <p className="sheet__sub">Déjanos tus datos y elige un horario. Un contador del equipo confirma contigo.</p>

              <label className="fld">
                <span>Nombre completo</span>
                <input
                  id="ag-nombre"
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre"
                  value={agNombre}
                  onChange={(e) => setAgNombre(e.target.value)}
                />
              </label>

              <label className="fld">
                <span>Correo</span>
                <input
                  id="ag-correo"
                  type="email"
                  autoComplete="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={agCorreo}
                  onChange={(e) => setAgCorreo(e.target.value)}
                />
              </label>

              <label className="fld">
                <span>Número de contacto</span>
                <input
                  id="ag-tel"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="300 000 0000"
                  value={agTel}
                  onChange={(e) => setAgTel(e.target.value)}
                />
              </label>

              <label className="fld">
                <span>Método de contacto</span>
                <select
                  id="ag-medio"
                  value={agMedio}
                  onChange={(e) => setAgMedio(e.target.value as any)}
                >
                  <option value="llamada">Llamada</option>
                  <option value="videollamada">Reunión virtual</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </label>

              <div className="fld">
                <span>Fecha de la consulta</span>
                <div className="cal" id="ag-cal">
                  <div className="cal__nav">
                    <button
                      className="cal__arrow"
                      id="cal-prev"
                      aria-label="Mes anterior"
                      type="button"
                      disabled={!canPrevMonth}
                      onClick={() =>
                        setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() - 1, 1))
                      }
                    >
                      ‹
                    </button>
                    <p className="cal__month" id="cal-month">
                      {MESES_NOMBRES[calViewDate.getMonth()]} {calViewDate.getFullYear()}
                    </p>
                    <button
                      className="cal__arrow"
                      id="cal-next"
                      aria-label="Mes siguiente"
                      type="button"
                      disabled={!canNextMonth}
                      onClick={() =>
                        setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() + 1, 1))
                      }
                    >
                      ›
                    </button>
                  </div>
                  <div className="cal__dow">
                    <span>L</span>
                    <span>M</span>
                    <span>M</span>
                    <span>J</span>
                    <span>V</span>
                    <span>S</span>
                    <span>D</span>
                  </div>
                  <div className="cal__grid" id="cal-grid">
                    {renderCalendarDays()}
                  </div>
                  <p className="cal__legend">Lun a vie 8:00–18:00 · Sáb 8:00–14:00 · Domingos cerrado</p>
                </div>
              </div>

              {agDateSelected && getSlotsForDate(agDateSelected).length > 0 && (
                <label className="fld" id="ag-hora-wrap">
                  <span>Hora</span>
                  <select
                    id="ag-hora"
                    value={agHoraSelected}
                    onChange={(e) => setAgHoraSelected(e.target.value)}
                  >
                    {getSlotsForDate(agDateSelected).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {agErr && (
                <p className="fld__err" id="ag-err">
                  {agErr}
                </p>
              )}

              <button
                className="pill pill--blue sheet__submit"
                id="ag-submit"
                type="button"
                disabled={agSubmitting}
                onClick={handleSubmitAgendar}
              >
                {agSubmitting ? 'Solicitando...' : 'Solicitar consulta'}
              </button>
            </div>
          ) : (
            <div className="sheet__done" id="ag-done">
              <div className="sheet__check" aria-hidden="true">
                ✓
              </div>
              <h3>Solicitud enviada</h3>
              <p className="sheet__sub" id="ag-done-txt">
                {agDoneTxt}
              </p>
              <button className="pill pill--ghost" onClick={handleCloseAgendar} type="button">
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
