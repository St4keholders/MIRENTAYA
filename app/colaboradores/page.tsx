'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import '@/app/stakeholders.css';
import { formatCOP } from '@/lib/commissions';

/* ── Componente de Barra de Distribución y Tarjetas de Márgenes ───── */
function MargenesCalculator({ initialAmount = 400000 }: { initialAmount?: number }) {
  const [amount, setAmount] = useState(initialAmount);
  const [hasRef, setHasRef] = useState(true);
  const [hasVend, setHasVend] = useState(true);

  // Porcentajes oficiales acordados
  const [pctContadorBase, setPctContadorBase] = useState(70);
  const [pctVendedor, setPctVendedor] = useState(15);
  const [pctReferido, setPctReferido] = useState(5);
  const [pctDesarrollo, setPctDesarrollo] = useState(10);
  const [showAdjust, setShowAdjust] = useState(false);

  // Si no hay referido o vendedor, su comisión se suma al contador asignado
  const effectiveRefPct = hasRef ? pctReferido : 0;
  const effectiveVendPct = hasVend ? pctVendedor : 0;
  const effectiveConPct = pctContadorBase + (hasRef ? 0 : pctReferido) + (hasVend ? 0 : pctVendedor);
  const effectivePlatPct = 100 - effectiveConPct - effectiveRefPct - effectiveVendPct - pctDesarrollo;

  // Montos en COP
  const conAmt = Math.round((amount * effectiveConPct) / 100);
  const refAmt = Math.round((amount * effectiveRefPct) / 100);
  const vendAmt = Math.round((amount * effectiveVendPct) / 100);
  const desAmt = Math.round((amount * pctDesarrollo) / 100);
  const platAmt = Math.round((amount * effectivePlatPct) / 100);

  const desAndPlatAmt = desAmt + Math.max(0, platAmt);
  const desAndPlatPct = pctDesarrollo + Math.max(0, effectivePlatPct);

  return (
    <div
      style={{
        background: 'rgba(12, 14, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 24,
        padding: 'clamp(20px, 4vw, 36px)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 700,
            fontSize: 'clamp(1.3rem, 3.5vw, 1.8rem)',
            color: '#3B6EFF',
            margin: '0 0 6px',
            letterSpacing: '-0.03em',
          }}
        >
          Calculadora de Rendimiento y Reparto
        </h3>
        <p style={{ fontSize: 14, color: 'var(--dim)', margin: 0, fontFamily: 'var(--body)' }}>
          Comisiones calculadas al 100% sobre el valor del servicio de declaración de renta
        </p>
      </div>

      {/* Input de Valor del Servicio */}
      <div style={{ marginBottom: 22 }}>
        <label
          style={{
            display: 'block',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: 'var(--dimmer)',
            marginBottom: 8,
          }}
        >
          Valor del servicio de declaración (COP)
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(59, 110, 255, 0.4)',
            borderRadius: 14,
            padding: '12px 18px',
            boxShadow: '0 0 20px rgba(59, 110, 255, 0.1)',
          }}
        >
          <span style={{ fontFamily: 'var(--mono)', fontSize: 20, color: '#4C87FF', marginRight: 10, fontWeight: 700 }}>$</span>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            step={50000}
            style={{
              width: '100%',
              background: 'transparent',
              border: 0,
              outline: 0,
              fontFamily: 'var(--mono)',
              fontSize: 'clamp(1.4rem, 3.5vw, 1.8rem)',
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          />
        </div>
      </div>

      {/* Checkboxes de Escenarios */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 26 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--display)',
            color: hasRef ? '#4ADE80' : 'var(--dimmer)',
            background: hasRef ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${hasRef ? 'rgba(74, 222, 128, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: 12,
            padding: '12px 16px',
            transition: 'all .25s var(--ease)',
          }}
        >
          <input
            type="checkbox"
            checked={hasRef}
            onChange={(e) => setHasRef(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#4ADE80', cursor: 'pointer' }}
          />
          ¿Viene por Referido? ({pctReferido}%)
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--display)',
            color: hasVend ? '#FACC15' : 'var(--dimmer)',
            background: hasVend ? 'rgba(250, 204, 21, 0.1)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${hasVend ? 'rgba(250, 204, 21, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: 12,
            padding: '12px 16px',
            transition: 'all .25s var(--ease)',
          }}
        >
          <input
            type="checkbox"
            checked={hasVend}
            onChange={(e) => setHasVend(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#FACC15', cursor: 'pointer' }}
          />
          ¿Viene por Vendedor? ({pctVendedor}%)
        </label>
      </div>

      {/* Visual Progress Bar */}
      <div
        style={{
          display: 'flex',
          height: 32,
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: 24,
          background: 'rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ width: `${effectiveConPct}%`, background: '#0284C7', transition: 'width 0.35s var(--ease)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: '#fff' }}>
          {effectiveConPct}%
        </div>
        {hasRef && (
          <div style={{ width: `${effectiveRefPct}%`, background: '#16A34A', transition: 'width 0.35s var(--ease)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: '#fff' }}>
            {effectiveRefPct}%
          </div>
        )}
        {hasVend && (
          <div style={{ width: `${effectiveVendPct}%`, background: '#CA8A04', transition: 'width 0.35s var(--ease)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: '#fff' }}>
            {effectiveVendPct}%
          </div>
        )}
        <div style={{ width: `${desAndPlatPct}%`, background: '#9333EA', transition: 'width 0.35s var(--ease)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: '#fff' }}>
          {desAndPlatPct}%
        </div>
      </div>

      {/* Tarjetas de Reparto Exactas (Mockup Admin Theme) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Contador */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.22) 0%, rgba(14, 116, 144, 0.15) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: 16,
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: '0 4px 20px rgba(2, 132, 199, 0.1)',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: '#7DD3FC' }}>
              Contador Asignado
            </div>
            <div style={{ fontSize: 13, color: 'rgba(125, 211, 252, 0.8)', marginTop: 3 }}>
              Base {effectiveConPct}% del valor del servicio
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', color: '#38BDF8', textAlign: 'right' }}>
            {formatCOP(conAmt)}
          </div>
        </div>

        {/* Referido */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.22) 0%, rgba(21, 128, 61, 0.15) 100%)',
            border: '1px solid rgba(74, 222, 128, 0.4)',
            borderRadius: 16,
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            opacity: hasRef ? 1 : 0.4,
            transition: 'opacity 0.25s',
            boxShadow: hasRef ? '0 4px 20px rgba(22, 163, 74, 0.1)' : 'none',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: '#86EFAC' }}>
              Referido
            </div>
            <div style={{ fontSize: 13, color: 'rgba(134, 239, 172, 0.8)', marginTop: 3 }}>
              {hasRef ? `Comisión ${pctReferido}% por traer el cliente` : 'No participó (sumado al contador)'}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', color: '#4ADE80', textAlign: 'right' }}>
            {formatCOP(refAmt)}
          </div>
        </div>

        {/* Vendedor */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(202, 138, 4, 0.22) 0%, rgba(161, 98, 7, 0.15) 100%)',
            border: '1px solid rgba(250, 204, 21, 0.4)',
            borderRadius: 16,
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            opacity: hasVend ? 1 : 0.4,
            transition: 'opacity 0.25s',
            boxShadow: hasVend ? '0 4px 20px rgba(202, 138, 4, 0.1)' : 'none',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: '#FDE047' }}>
              Vendedor
            </div>
            <div style={{ fontSize: 13, color: 'rgba(253, 224, 71, 0.8)', marginTop: 3 }}>
              {hasVend ? `Comisión ${pctVendedor}% por venta / atención` : 'No participó (sumado al contador)'}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', color: '#FACC15', textAlign: 'right' }}>
            {formatCOP(vendAmt)}
          </div>
        </div>

        {/* Desarrollo & Plataforma */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.22) 0%, rgba(109, 40, 217, 0.15) 100%)',
            border: '1px solid rgba(192, 132, 252, 0.4)',
            borderRadius: 16,
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: '0 4px 20px rgba(147, 51, 234, 0.1)',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: '#E9D5FF' }}>
              Desarrollo & Plataforma
            </div>
            <div style={{ fontSize: 13, color: 'rgba(233, 213, 255, 0.8)', marginTop: 3 }}>
              Fijo {desAndPlatPct}% por mantenimiento y plataforma
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', color: '#C084FC', textAlign: 'right' }}>
            {formatCOP(desAndPlatAmt)}
          </div>
        </div>
      </div>

      {/* Ajustador de porcentajes opcional */}
      <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px dashed rgba(255,255,255,0.12)' }}>
        <button
          onClick={() => setShowAdjust(!showAdjust)}
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--dim)',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'var(--display)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {showAdjust ? '▲ Ocultar ajuste de porcentajes' : '▼ Ajustar porcentajes (simular otros escenarios)'}
        </button>

        {showAdjust && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Contador (base)', val: pctContadorBase, set: setPctContadorBase },
              { label: 'Vendedor', val: pctVendedor, set: setPctVendedor },
              { label: 'Referido', val: pctReferido, set: setPctReferido },
              { label: 'Desarrollo web', val: pctDesarrollo, set: setPctDesarrollo },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--dim)' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, overflow: 'hidden' }}>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => set(Number(e.target.value) || 0)}
                    style={{ width: 64, border: 0, background: 'transparent', padding: '6px 10px', textAlign: 'right', color: '#fff', fontFamily: 'var(--mono)', fontSize: 13 }}
                  />
                  <span style={{ paddingRight: 10, color: 'var(--dimmer)', fontFamily: 'var(--mono)', fontSize: 12 }}>%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Página Principal de Colaboradores ────────────────────────────── */
export default function ColaboradoresPage() {
  const [activeRole, setActiveRole] = useState<'referido' | 'vendedor' | 'contador'>('referido');
  const [sliderVal, setSliderVal] = useState(400000);
  const [cVend, setCVend] = useState(true);
  const [cRef, setCRef] = useState(true);

  // Configurar fondo oscuro global
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;
    document.body.style.backgroundColor = '#000000';
    document.body.style.color = '#FFFFFF';
    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
    };
  }, []);

  // Animaciones reveal
  const revealRefs = useRef<HTMLElement[]>([]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const reveal = (el: HTMLElement | null, i = 0) => {
    if (el && !revealRefs.current.includes(el)) {
      (el as any).style.transitionDelay = `${Math.min(i, 6) * 0.06}s`;
      revealRefs.current.push(el);
    }
  };

  const ROLE_COLORS: Record<string, string> = {
    referido: '#4ADE80',
    vendedor: '#FACC15',
    contador: '#3B6EFF',
  };

  const TAB_COPY: Record<string, { title: string; pct: string; fn: string; note: string }> = {
    referido: {
      title: 'Referido',
      pct: '5%',
      fn: 'Traes clientes con tu link de referidos o de voz a voz, y nosotros nos encargamos del resto. Es la forma más simple de ganar: solo conectas a la persona con el equipo.',
      note: 'Comisión fija del 5% por traer al cliente. El programa de referidos está activo durante toda la temporada de renta.',
    },
    vendedor: {
      title: 'Vendedor',
      pct: '15%',
      fn: 'Atiendes al cliente y le haces seguimiento hasta cerrar la venta y reunir sus documentos. En la práctica, suele ser el mismo contador quien cumple este rol.',
      note: 'Comisión fija del 15% por venta / atención sobre el valor de la declaración.',
    },
    contador: {
      title: 'Contador',
      pct: '70%+',
      fn: 'Realizas la declaración de renta, que es el corazón del servicio. Por eso te llevas la mayor parte del valor.',
      note: 'Base del 70%. Si además cierras la venta (+15%) o traes al cliente (+5%), sumas esas comisiones. Si realizas todo el proceso tú solo, te llevas el 90%.',
    },
  };

  const calculateRoleCommission = () => {
    if (activeRole === 'referido') {
      return { amt: Math.round(sliderVal * 0.05), sub: '5% fijo por traer al cliente' };
    }
    if (activeRole === 'vendedor') {
      return { amt: Math.round(sliderVal * 0.15), sub: '15% fijo por venta / atención' };
    }
    // Contador
    let totalPct = 70;
    if (cVend) totalPct += 15;
    if (cRef) totalPct += 5;
    return { amt: Math.round((sliderVal * totalPct) / 100), sub: `${totalPct}% de esta declaración` };
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animación del Canvas de Estrellas (Idéntico a la Landing)
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let stars: Array<{ x: number; y: number; r: number; a: number; s: number; t: number }> = [];
    let w = 0, h = 0, dpr = 1;
    let starsRaf: number | null = null;

    const buildStars = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 12000);
      stars = Array.from({ length: Math.min(n, 260) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 1.6 - h * 0.3,
        r: Math.random() < 0.88 ? Math.random() * 0.7 + 0.25 : Math.random() * 1.1 + 0.8,
        a: Math.random() * 0.45 + 0.08,
        s: Math.random() * 0.55 + 0.12,
        t: Math.random() * Math.PI * 2,
      }));
    };

    let yVal = typeof window !== 'undefined' ? window.scrollY : 0;
    const drawStars = () => {
      ctx.clearRect(0, 0, w, h);
      const time = performance.now() / 2600;
      for (const st of stars) {
        let py = st.y - yVal * st.s * 0.16;
        py = (((py % (h * 1.6)) + h * 1.6) % (h * 1.6)) - h * 0.3;
        const tw = 0.7 + 0.3 * Math.sin(time + st.t);
        ctx.globalAlpha = st.a * tw;
        ctx.fillStyle = st.r > 0.9 ? '#BFD4FF' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(st.x, py, st.r, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loopStars = () => {
      drawStars();
      starsRaf = requestAnimationFrame(loopStars);
    };

    buildStars();
    loopStars();

    const handleResize = () => buildStars();
    const handleScroll = () => { yVal = window.scrollY; };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (starsRaf) cancelAnimationFrame(starsRaf);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const currentComm = calculateRoleCommission();

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#FFFFFF', position: 'relative', overflowX: 'hidden' }}>
      {/* Canvas de Estrellas del Fondo */}
      <canvas ref={canvasRef} id="stars" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Atmósfera Cósmica Idéntica a la Landing Page */}
      <div className="veil" />

      {/* HEADER NAVBAR OFICIAL */}
      <nav
        className="nav stuck"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px var(--pad)',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--line-soft)',
        }}
      >
        <Link href="/renta" className="brand" style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.28em', fontWeight: 600, color: '#fff' }}>
          STAKEHOLDERS <i style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#3B6EFF', marginLeft: 6, verticalAlign: 'middle' }} />
        </Link>
        <div className="nav-links" style={{ display: 'flex', gap: 24, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--dim)' }}>
          <Link href="/renta#pasos" style={{ color: 'var(--dim)', transition: 'color .2s' }}>CÓMO FUNCIONA</Link>
          <Link href="/colaboradores" style={{ color: '#FFFFFF', fontWeight: 600 }}>PROPUESTA</Link>
          <Link href="/renta#topes" style={{ color: 'var(--dim)', transition: 'color .2s' }}>TOPES</Link>
        </div>
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/panel/vendedor"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '7px 16px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.04)',
              color: '#FFF',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              letterSpacing: '.05em',
              transition: 'all .2s',
            }}
          >
            LOGIN
          </Link>
          <Link
            href="/agendar"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 18px',
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#000000',
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '-.01em',
              transition: 'transform .2s var(--ease)',
            }}
          >
            Agendar consulta
          </Link>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ position: 'relative', zIndex: 2, paddingTop: 100 }}>
        {/* ── HERO ─── */}
        <header style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(60px,9vw,100px) var(--pad) clamp(30px,5vw,50px)' }}>
          <div
            ref={(el) => reveal(el as any, 0)}
            className="fade"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              color: '#4C87FF',
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            Temporada de renta 2026
          </div>
          <h1
            ref={(el) => reveal(el as any, 1)}
            className="fade"
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: 'clamp(2.4rem, 7.5vw, 4.2rem)',
              lineHeight: 1.05,
              letterSpacing: '-.045em',
              margin: '0 0 20px',
            }}
          >
            Colabora con nosotros<br />y gana con cada declaración.
          </h1>
          <p
            ref={(el) => reveal(el as any, 2)}
            className="fade lead"
            style={{ fontSize: 'clamp(1.05rem, 2.3vw, 1.25rem)', color: 'var(--dim)', maxWidth: '60ch', lineHeight: 1.6 }}
          >
            Hay tres formas de sumarte (referido, vendedor o contador) y cada una tiene su propia comisión. Elige la tuya y calcula cuánto ganarías.
          </p>
        </header>

        {/* ── CÓMO FUNCIONA ─── */}
        <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(45px,6vw,65px) var(--pad)', borderTop: '1px solid var(--line-soft)' }}>
          <div ref={(el) => reveal(el as any, 0)} className="fade" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: '#4C87FF', marginBottom: 8, fontWeight: 600 }}>
            Cómo funciona
          </div>
          <h2 ref={(el) => reveal(el as any, 1)} className="fade" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.6rem,4.5vw,2.4rem)', letterSpacing: '-.04em', margin: '0 0 16px' }}>
            Así acompañamos cada declaración.
          </h2>
          <p ref={(el) => reveal(el as any, 2)} className="fade lead" style={{ fontSize: 15, color: 'var(--dim)', maxWidth: '64ch', lineHeight: 1.6, marginBottom: 32 }}>
            Antes de hablar de comisiones, esto es lo que vive cada cliente en la plataforma: cinco pasos desde que agenda hasta que recibe su declaración lista. Tu comisión depende de en qué parte de este proceso participas.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            {[
              { n: '01', t: 'Consultoría', p: '$100.000', d: 'Revisamos si la persona está obligada a declarar. Se cobra aparte de la declaración.' },
              { n: '02', t: 'Documentos', d: 'Reunimos con el cliente todo lo necesario para declarar.' },
              { n: '03', t: 'Anticipo', d: 'El cliente paga el 50% para arrancar el trabajo.' },
              { n: '04', t: 'Declaración', d: 'Un contador aliado realiza la declaración de renta.' },
              { n: '05', t: 'Entrega', d: 'Entregamos la declaración y el cliente paga el 50% final.' },
            ].map((step, i) => (
              <div
                key={step.n}
                ref={(el) => reveal(el as any, i)}
                className="fade"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--line)',
                  borderRadius: 18,
                  padding: '20px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'border-color .25s var(--ease)',
                }}
              >
                <div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: '#4C87FF', display: 'block', marginBottom: 6 }}>
                    {step.n}
                  </span>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                    {step.t}
                  </div>
                  {step.p && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: '#FACC15', marginBottom: 6 }}>
                      {step.p}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.45 }}>
                    {step.d}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ELIGE TU ROL ─── */}
        <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(45px,6vw,65px) var(--pad)', borderTop: '1px solid var(--line-soft)' }}>
          <div ref={(el) => reveal(el as any, 0)} className="fade" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: '#4C87FF', marginBottom: 8, fontWeight: 600 }}>
            Elige tu rol
          </div>
          <h2 ref={(el) => reveal(el as any, 1)} className="fade" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.6rem,4.5vw,2.4rem)', letterSpacing: '-.04em', margin: '0 0 16px' }}>
            ¿Cómo quieres colaborar?
          </h2>
          <p ref={(el) => reveal(el as any, 2)} className="fade lead" style={{ fontSize: 15, color: 'var(--dim)', maxWidth: '64ch', lineHeight: 1.6, marginBottom: 32 }}>
            Cada rol cobra sobre el valor de la declaración (la consultoría va aparte). Y no son excluyentes: puedes cumplir varios a la vez y sumar las comisiones. Un contador que además trae y atiende a su propio cliente se lleva casi todo.
          </p>

          {/* Pestañas de Roles */}
          <div ref={(el) => reveal(el as any, 3)} className="fade" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {(['referido', 'vendedor', 'contador'] as const).map((role) => {
              const active = activeRole === role;
              const color = ROLE_COLORS[role];
              const info = TAB_COPY[role];
              return (
                <button
                  key={role}
                  className="role-tab"
                  onClick={() => setActiveRole(role)}
                  style={{
                    flex: 1,
                    borderRadius: 18,
                    padding: '18px 14px',
                    border: `1px solid ${active ? color : 'var(--line)'}`,
                    background: active ? `${color}1A` : 'rgba(255, 255, 255, 0.02)',
                    textAlign: 'center',
                    fontFamily: 'var(--body)',
                    color: active ? color : 'var(--dim)',
                    boxShadow: active ? `0 0 24px ${color}20` : 'none',
                  }}
                >
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18 }}>{info.title}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, marginTop: 4, fontWeight: 700, opacity: 0.9 }}>{info.pct}</div>
                </button>
              );
            })}
          </div>

          {/* Panel Simulador */}
          <div
            ref={(el) => reveal(el as any, 4)}
            className="fade"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--line)',
              borderRadius: 24,
              padding: 'clamp(22px, 4.5vw, 32px)',
            }}
          >
            <p style={{ fontSize: 15, color: '#E2E8F0', margin: '0 0 24px', lineHeight: 1.6, fontFamily: 'var(--body)' }}>
              {TAB_COPY[activeRole].fn}
            </p>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--dimmer)' }}>
                  Valor de la declaración
                </label>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.5rem', color: ROLE_COLORS[activeRole] }}>
                  {formatCOP(sliderVal)}
                </div>
              </div>
              <input
                type="range"
                min={100000}
                max={2000000}
                step={50000}
                value={sliderVal}
                onChange={(e) => setSliderVal(Number(e.target.value))}
                style={{ accentColor: ROLE_COLORS[activeRole] }}
              />
            </div>

            {activeRole === 'contador' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, background: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 14, border: '1px solid var(--line)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: cVend ? '#FFFFFF' : 'var(--dim)', fontFamily: 'var(--display)', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={cVend}
                    onChange={(e) => setCVend(e.target.checked)}
                    style={{ accentColor: ROLE_COLORS.vendedor, width: 18, height: 18 }}
                  />
                  También cerré la venta (+15%)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, color: cRef ? '#FFFFFF' : 'var(--dim)', fontFamily: 'var(--display)', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={cRef}
                    onChange={(e) => setCRef(e.target.checked)}
                    style={{ accentColor: ROLE_COLORS.referido, width: 18, height: 18 }}
                  />
                  También traje al cliente (+5% referido)
                </label>
              </div>
            )}

            {/* Resultado Gran Número */}
            <div
              style={{
                borderRadius: 18,
                padding: '22px 26px',
                background: `${ROLE_COLORS[activeRole]}15`,
                border: `1px solid ${ROLE_COLORS[activeRole]}45`,
                marginBottom: 18,
                boxShadow: `0 0 30px ${ROLE_COLORS[activeRole]}15`,
              }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: ROLE_COLORS[activeRole], opacity: 0.9, marginBottom: 6 }}>
                Tu comisión
              </div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(2.2rem, 5.5vw, 3rem)', color: ROLE_COLORS[activeRole], letterSpacing: '-.03em' }}>
                {formatCOP(currentComm.amt)}
              </div>
              <div style={{ fontSize: 14, color: 'var(--dim)', marginTop: 6 }}>
                {currentComm.sub}
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--dim)', margin: 0, lineHeight: 1.5 }}>
              {TAB_COPY[activeRole].note}
            </p>
          </div>
        </section>

        {/* ── CALCULADORA DE MÁRGENES / TRANSPARENCIA ─── */}
        <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(45px,6vw,65px) var(--pad)', borderTop: '1px solid var(--line-soft)' }}>
          <div ref={(el) => reveal(el as any, 0)} className="fade" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: '#4C87FF', marginBottom: 8, fontWeight: 600 }}>
            Transparencia
          </div>
          <h2 ref={(el) => reveal(el as any, 1)} className="fade" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.6rem,4.5vw,2.4rem)', letterSpacing: '-.04em', margin: '0 0 16px' }}>
            ¿A dónde va cada peso?
          </h2>
          <p ref={(el) => reveal(el as any, 2)} className="fade lead" style={{ fontSize: 15, color: 'var(--dim)', maxWidth: '64ch', lineHeight: 1.6, marginBottom: 32 }}>
            Este es el reparto completo del valor de una declaración entre todos los que la hacen posible. Cuando alguno del referido o vendedor no participa, su porcentaje se suma al contador.
          </p>

          <div ref={(el) => reveal(el as any, 3)} className="fade">
            <MargenesCalculator initialAmount={400000} />
          </div>

          <p style={{ fontSize: 13, color: 'var(--dim)', marginTop: 26, textAlign: 'center', lineHeight: 1.5 }}>
            La consultoría de $100.000 se cobra aparte y no entra en este reparto.
          </p>
        </section>
      </main>

      {/* ── FOOTER ─── */}
      <footer
        style={{
          position: 'relative',
          zIndex: 2,
          borderTop: '1px solid var(--line-soft)',
          padding: 'clamp(40px, 6vw, 60px) var(--pad)',
          textAlign: 'center',
          color: 'var(--dimmer)',
          fontSize: 12,
          fontFamily: 'var(--mono)',
          letterSpacing: '.14em',
        }}
      >
        STAKEHOLDERS · Temporada de renta 2026
      </footer>
    </div>
  );
}
