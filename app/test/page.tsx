'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import '@/app/stakeholders.css';
import { setRefCookie } from '@/lib/referral';

interface FormData {
  nombre: string;
  cedula: string;
  edad: number;
  ocupacion: 'empleado' | 'independiente';
  ingresoMensual: number;
  tieneDeudas: boolean;
  totalCreditos: number;
  cuotaMensualCreditos: number;
  gastoMensualTC: number;
  comproBienes: boolean;
  tipoFinanciacion: 'financiado' | 'contado' | 'mixto';
  costoTotalCompras: number;
  cuotaMensualCompras: number;
  numCuentas: number;
  frecuenciaMovimientos: 'nunca' | 'mensual' | 'semanal' | 'diario';
  tienePropiedades: boolean;
  valorPropiedades: number;
  valorVehiculos: number;
  ahorrosInversiones: number;
  celular: string;
}

const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);

/* ── Numeric Range Input (dark) ──────────────────────────────────────── */
function NumericRangeInput({
  value, onChange, min, max, step = 100000, labelHelper,
}: { value: number; onChange: (val: number) => void; min: number; max: number; step?: number; labelHelper?: string; }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 16, padding: '14px 18px', marginBottom: 14,
      }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
            Escribe o modifica ($):
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono)', fontWeight: 700 }}>$</span>
            <input
              type="number" min="0" value={value || ''} placeholder="0"
              onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
              style={{
                width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 10, color: '#FFFFFF', fontFamily: 'var(--mono)', fontWeight: 700,
                fontSize: 18, outline: 'none',
              }}
            />
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono)' }}>Valor</span>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 20, color: '#3D6BFF' }}>{formatCOP(value)}</span>
          {labelHelper && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{labelHelper}</span>}
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono)', marginBottom: 6 }}>
          <span>O desliza:</span>
          <span>{formatCOP(min)} — {formatCOP(max)}+</span>
        </div>
        <input
          type="range" min={min} max={max} step={step} value={Math.min(value, max)}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#3D6BFF', cursor: 'pointer', height: 4, borderRadius: 4 }}
        />
      </div>
    </div>
  );
}

/* ── Option Button ───────────────────────────────────────────────────── */
function OptionBtn({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '18px 14px', borderRadius: 14, textAlign: 'left', fontWeight: 600, fontSize: 15,
      transition: 'all .18s', cursor: 'pointer', fontFamily: 'var(--body)',
      background: selected ? 'rgba(61,107,255,0.18)' : 'rgba(255,255,255,0.06)',
      border: selected ? '1.5px solid #3D6BFF' : '1.5px solid rgba(255,255,255,0.10)',
      color: selected ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
    }}>
      {children}
    </button>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */
function TestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [refSlug, setRefSlug] = useState<string | null>(null);

  // Capturar y guardar cookie de referido al llegar con ?ref=
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setRefCookie(ref); // First-touch: no sobreescribe si ya existe
      setRefSlug(ref);
    }
  }, [searchParams]);

  const [form, setForm] = useState<FormData>({
    nombre: '', cedula: '', edad: 28, ocupacion: 'empleado',
    ingresoMensual: 4500000, tieneDeudas: false, totalCreditos: 0,
    cuotaMensualCreditos: 0, gastoMensualTC: 800000, comproBienes: false,
    tipoFinanciacion: 'contado', costoTotalCompras: 0, cuotaMensualCompras: 0,
    numCuentas: 2, frecuenciaMovimientos: 'mensual', tienePropiedades: false,
    valorPropiedades: 0, valorVehiculos: 0, ahorrosInversiones: 5000000, celular: '',
  });

  /* Stars canvas */
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
      const n = Math.round((w * h) / 12000);
      stars = Array.from({ length: Math.min(n, 260) }, () => ({
        x: Math.random() * w, y: Math.random() * h * 1.6 - h * 0.3,
        r: Math.random() < 0.88 ? Math.random() * 0.7 + 0.25 : Math.random() * 1.1 + 0.8,
        a: Math.random() * 0.45 + 0.08, s: Math.random() * 0.55 + 0.12,
        t: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const time = performance.now() / 2600;
      for (const st of stars) {
        const tw = REDUCE ? 1 : 0.7 + 0.3 * Math.sin(time + st.t);
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

  /* Dark body while on this page */
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#000000';
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  /* Navigation */
  const nextStep = () => {
    setErrorMsg('');
    if (step === 1 && !form.nombre.trim()) { setErrorMsg('Por favor ingresa tu nombre'); return; }
    if (step === 2 && (!form.cedula.trim() || form.cedula.length < 4)) { setErrorMsg('Ingresa un número de cédula válido'); return; }
    if (step === 6 && !form.tieneDeudas) { setStep(9); return; }
    if (step === 10 && !form.comproBienes) { setStep(14); return; }
    if (step === 11 && form.tipoFinanciacion === 'contado') { setStep(12); return; }
    if (step === 16 && !form.tienePropiedades) { setStep(19); return; }
    if (step < 20) { setStep((p) => p + 1); } else { handleSubmit(); }
  };

  const prevStep = () => {
    setErrorMsg('');
    if (step === 9 && !form.tieneDeudas) { setStep(6); return; }
    if (step === 14 && !form.comproBienes) { setStep(10); return; }
    if (step === 19 && !form.tienePropiedades) { setStep(16); return; }
    if (step > 1) setStep((p) => p - 1);
  };

  const handleSubmit = async () => {
    setLoading(true); setErrorMsg('');
    try {
      // Incluir ref slug para atribución de referido en el backend (searchParams -> state -> cookie)
      const currentRef = searchParams.get('ref') || refSlug || (typeof document !== 'undefined' ? (document.cookie.match(/(?:^|; )rentash_ref=([^;]*)/)?.[1] ? decodeURIComponent(document.cookie.match(/(?:^|; )rentash_ref=([^;]*)/)![1]) : null) : null);
      const body = { ...form, ...(currentRef ? { ref: currentRef } : {}) };
      const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el cuestionario');
      router.push(`/r/${data.slugPublico}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado');
      setLoading(false);
    }
  };

  const pct = Math.round((step / 20) * 100);

  /* Shared input style */
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.14)',
    borderRadius: 12, color: '#FFFFFF', fontSize: 17, outline: 'none',
    fontFamily: 'var(--body)', boxSizing: 'border-box',
  };

  const categoryStyle: React.CSSProperties = {
    fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase',
    color: '#3D6BFF', fontFamily: 'var(--mono)', display: 'block', marginBottom: 10,
  };

  const questionStyle: React.CSSProperties = {
    fontFamily: 'var(--display)', fontWeight: 700,
    fontSize: 'clamp(1.35rem,4.5vw,1.85rem)', color: '#FFFFFF',
    lineHeight: 1.22, marginBottom: 8, marginTop: 0,
  };

  const hintStyle: React.CSSProperties = {
    fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, marginTop: 4,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Stars canvas */}
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      {/* Veil */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'linear-gradient(180deg,rgba(0,0,0,.18) 0%,rgba(0,0,0,.35) 100%)', pointerEvents: 'none' }} />

      {/* NAV */}
      <header style={{
        position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.4)',
      }}>
        <Link href="/renta" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: '#FFFFFF', letterSpacing: '.05em' }}>
          STAKEHOLDERS<i style={{ display: 'inline-block', width: 5, height: 5, background: '#3D6BFF', borderRadius: '50%', marginLeft: 5, verticalAlign: 'middle' }} />
        </Link>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '.08em' }}>
          Paso <span style={{ color: '#3D6BFF', fontWeight: 700 }}>{step}</span> de 20
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', height: 3, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #3D6BFF, #6B8FFF)', transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
      </div>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', position: 'relative', zIndex: 10 }}>
        <div style={{
          width: '100%', maxWidth: 560,
          background: 'rgba(255,255,255,0.055)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24,
          padding: 'clamp(24px,5vw,48px)',
          boxShadow: '0 0 60px -10px rgba(61,107,255,0.12)',
        }}>
          {errorMsg && (
            <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,80,80,0.3)', color: '#FF8080', fontSize: 13 }}>
              {errorMsg}
            </div>
          )}

          {/* Step 1: Nombre */}
          {step === 1 && (
            <div>
              <span style={categoryStyle}>Identidad</span>
              <h2 style={questionStyle}>¿Cuál es tu nombre completo?</h2>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Juan Pérez" style={{ ...inputStyle, marginBottom: 8 }} autoFocus />
            </div>
          )}

          {/* Step 2: Cédula */}
          {step === 2 && (
            <div>
              <span style={categoryStyle}>Identidad</span>
              <h2 style={questionStyle}>¿Número de Cédula o NIT?</h2>
              <p style={hintStyle}>Los dos últimos dígitos determinan tu fecha límite ante la DIAN en 2026.</p>
              <input type="text" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                placeholder="Ej. 1018451219" style={{ ...inputStyle, fontFamily: 'var(--mono)', marginBottom: 8 }} autoFocus />
            </div>
          )}

          {/* Step 3: Edad */}
          {step === 3 && (
            <div>
              <span style={categoryStyle}>Identidad</span>
              <h2 style={questionStyle}>¿Cuál es tu edad?</h2>
              <p style={hintStyle}>Tu etapa de vida financiera contextualiza el arquetipo.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <input type="number" min="18" max="99" value={form.edad || ''} placeholder="28"
                  onChange={(e) => setForm({ ...form, edad: e.target.value === '' ? 0 : Number(e.target.value) })}
                  style={{ ...inputStyle, width: 110, textAlign: 'center', fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)' }} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>años</span>
              </div>
            </div>
          )}

          {/* Step 4: Ocupación */}
          {step === 4 && (
            <div>
              <span style={categoryStyle}>Identidad</span>
              <h2 style={questionStyle}>¿Cuál es tu actividad principal?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                <OptionBtn selected={form.ocupacion === 'empleado'} onClick={() => setForm({ ...form, ocupacion: 'empleado' })}>
                  <span style={{ display: 'block', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Empleado</span>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>Contrato laboral / Salario</span>
                </OptionBtn>
                <OptionBtn selected={form.ocupacion === 'independiente'} onClick={() => setForm({ ...form, ocupacion: 'independiente' })}>
                  <span style={{ display: 'block', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Independiente</span>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>Honorarios / Comercio</span>
                </OptionBtn>
              </div>
            </div>
          )}

          {/* Step 5: Ingreso Mensual */}
          {step === 5 && (
            <div>
              <span style={categoryStyle}>Ingresos</span>
              <h2 style={questionStyle}>¿Cuál es tu ingreso mensual promedio?</h2>
              <p style={hintStyle}>Escribe la cifra exacta o usa la barra deslizante.</p>
              <NumericRangeInput value={form.ingresoMensual} onChange={(v) => setForm({ ...form, ingresoMensual: v })}
                min={1000000} max={30000000} step={500000} labelHelper={`~${formatCOP(form.ingresoMensual * 12)} al año`} />
            </div>
          )}

          {/* Step 6: Deudas */}
          {step === 6 && (
            <div>
              <span style={categoryStyle}>Créditos</span>
              <h2 style={questionStyle}>¿Tuviste deudas o créditos activos el año pasado?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                <OptionBtn selected={form.tieneDeudas === true} onClick={() => setForm({ ...form, tieneDeudas: true })}>
                  <span style={{ display: 'block', textAlign: 'center', fontSize: 22, fontWeight: 700 }}>Sí</span>
                </OptionBtn>
                <OptionBtn selected={form.tieneDeudas === false} onClick={() => setForm({ ...form, tieneDeudas: false })}>
                  <span style={{ display: 'block', textAlign: 'center', fontSize: 22, fontWeight: 700 }}>No</span>
                </OptionBtn>
              </div>
            </div>
          )}

          {/* Step 7: Total Créditos */}
          {step === 7 && (
            <div>
              <span style={categoryStyle}>Créditos</span>
              <h2 style={questionStyle}>¿Monto total acumulado de esos créditos?</h2>
              <NumericRangeInput value={form.totalCreditos} onChange={(v) => setForm({ ...form, totalCreditos: v })}
                min={1000000} max={200000000} step={2000000} />
            </div>
          )}

          {/* Step 8: Cuota Créditos */}
          {step === 8 && (
            <div>
              <span style={categoryStyle}>Créditos</span>
              <h2 style={questionStyle}>¿Cuota mensual promedio de esos créditos?</h2>
              <NumericRangeInput value={form.cuotaMensualCreditos} onChange={(v) => setForm({ ...form, cuotaMensualCreditos: v })}
                min={0} max={15000000} step={200000} />
            </div>
          )}

          {/* Step 9: TC */}
          {step === 9 && (
            <div>
              <span style={categoryStyle}>Créditos</span>
              <h2 style={questionStyle}>¿Gasto mensual promedio con tarjetas de crédito?</h2>
              <NumericRangeInput value={form.gastoMensualTC} onChange={(v) => setForm({ ...form, gastoMensualTC: v })}
                min={0} max={10000000} step={200000} labelHelper={`~${formatCOP(form.gastoMensualTC * 12)} al año`} />
            </div>
          )}

          {/* Step 10: Compró Bienes */}
          {step === 10 && (
            <div>
              <span style={categoryStyle}>Compras del Año</span>
              <h2 style={questionStyle}>¿Compraste inmuebles o vehículos el año pasado?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                <OptionBtn selected={form.comproBienes === true} onClick={() => setForm({ ...form, comproBienes: true })}>
                  <span style={{ display: 'block', textAlign: 'center', fontSize: 22, fontWeight: 700 }}>Sí</span>
                </OptionBtn>
                <OptionBtn selected={form.comproBienes === false} onClick={() => setForm({ ...form, comproBienes: false })}>
                  <span style={{ display: 'block', textAlign: 'center', fontSize: 22, fontWeight: 700 }}>No</span>
                </OptionBtn>
              </div>
            </div>
          )}

          {/* Step 11: Tipo Financiación */}
          {step === 11 && (
            <div>
              <span style={categoryStyle}>Compras</span>
              <h2 style={questionStyle}>¿Cómo fue financiada la compra?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 8 }}>
                {(['contado', 'financiado', 'mixto'] as const).map((tipo) => (
                  <OptionBtn key={tipo} selected={form.tipoFinanciacion === tipo} onClick={() => setForm({ ...form, tipoFinanciacion: tipo })}>
                    <span style={{ display: 'block', textAlign: 'center', textTransform: 'capitalize', fontWeight: 700, fontSize: 15 }}>{tipo}</span>
                  </OptionBtn>
                ))}
              </div>
            </div>
          )}

          {/* Step 12: Costo Compras */}
          {step === 12 && (
            <div>
              <span style={categoryStyle}>Compras</span>
              <h2 style={questionStyle}>¿Valor total de lo comprado?</h2>
              <NumericRangeInput value={form.costoTotalCompras} onChange={(v) => setForm({ ...form, costoTotalCompras: v })}
                min={5000000} max={300000000} step={5000000} />
            </div>
          )}

          {/* Step 13: Cuota Compras */}
          {step === 13 && (
            <div>
              <span style={categoryStyle}>Compras</span>
              <h2 style={questionStyle}>¿Cuota mensual de esa financiación?</h2>
              <NumericRangeInput value={form.cuotaMensualCompras} onChange={(v) => setForm({ ...form, cuotaMensualCompras: v })}
                min={0} max={10000000} step={200000} />
            </div>
          )}

          {/* Step 14: Núm Cuentas */}
          {step === 14 && (
            <div>
              <span style={categoryStyle}>Movimientos</span>
              <h2 style={questionStyle}>¿Cuántas cuentas bancarias o billeteras manejas?</h2>
              <p style={hintStyle}>Nequi, Daviplata, Bancolombia, etc.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <input type="number" min="1" max="10" value={form.numCuentas}
                  onChange={(e) => setForm({ ...form, numCuentas: Number(e.target.value) })}
                  style={{ ...inputStyle, width: 110, textAlign: 'center', fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)' }} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>cuentas / billeteras</span>
              </div>
            </div>
          )}

          {/* Step 15: Frecuencia */}
          {step === 15 && (
            <div>
              <span style={categoryStyle}>Movimientos</span>
              <h2 style={questionStyle}>Frecuencia de transferencias entre tus propias cuentas:</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                {[
                  { id: 'nunca', label: 'Nunca' },
                  { id: 'mensual', label: '~1 vez al mes' },
                  { id: 'semanal', label: 'Varias veces por semana' },
                  { id: 'diario', label: 'Todos los días' },
                ].map((f) => (
                  <OptionBtn key={f.id} selected={form.frecuenciaMovimientos === f.id} onClick={() => setForm({ ...form, frecuenciaMovimientos: f.id as 'nunca' | 'mensual' | 'semanal' | 'diario' })}>
                    {f.label}
                  </OptionBtn>
                ))}
              </div>
            </div>
          )}

          {/* Step 16: Tiene Propiedades */}
          {step === 16 && (
            <div>
              <span style={categoryStyle}>Patrimonio</span>
              <h2 style={questionStyle}>¿Tienes propiedades o vehículos a tu nombre?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                <OptionBtn selected={form.tienePropiedades === true} onClick={() => setForm({ ...form, tienePropiedades: true })}>
                  <span style={{ display: 'block', textAlign: 'center', fontSize: 22, fontWeight: 700 }}>Sí</span>
                </OptionBtn>
                <OptionBtn selected={form.tienePropiedades === false} onClick={() => setForm({ ...form, tienePropiedades: false })}>
                  <span style={{ display: 'block', textAlign: 'center', fontSize: 22, fontWeight: 700 }}>No</span>
                </OptionBtn>
              </div>
            </div>
          )}

          {/* Step 17: Valor Propiedades */}
          {step === 17 && (
            <div>
              <span style={categoryStyle}>Patrimonio</span>
              <h2 style={questionStyle}>¿Valor estimado de tus propiedades?</h2>
              <NumericRangeInput value={form.valorPropiedades} onChange={(v) => setForm({ ...form, valorPropiedades: v })}
                min={0} max={500000000} step={10000000} />
            </div>
          )}

          {/* Step 18: Valor Vehículos */}
          {step === 18 && (
            <div>
              <span style={categoryStyle}>Patrimonio</span>
              <h2 style={questionStyle}>¿Valor estimado de tus vehículos?</h2>
              <NumericRangeInput value={form.valorVehiculos} onChange={(v) => setForm({ ...form, valorVehiculos: v })}
                min={0} max={150000000} step={5000000} />
            </div>
          )}

          {/* Step 19: Ahorros */}
          {step === 19 && (
            <div>
              <span style={categoryStyle}>Patrimonio</span>
              <h2 style={questionStyle}>¿Ahorros, CDT o inversiones en cuentas?</h2>
              <NumericRangeInput value={form.ahorrosInversiones} onChange={(v) => setForm({ ...form, ahorrosInversiones: v })}
                min={0} max={100000000} step={2000000} />
            </div>
          )}

          {/* Step 20: Celular */}
          {step === 20 && (
            <div>
              <span style={categoryStyle}>Cierre</span>
              <h2 style={questionStyle}>¿Tu número de celular o WhatsApp?</h2>
              <p style={hintStyle}>Para asociar tu resultado y permitir agendar la consultoría.</p>
              <input type="tel" value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })}
                placeholder="Ej. 3001234567" style={{ ...inputStyle, fontFamily: 'var(--mono)', marginBottom: 8 }} autoFocus />
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {step > 1 ? (
              <button type="button" onClick={prevStep} disabled={loading} style={{
                padding: '10px 16px', fontSize: 13, color: 'rgba(255,255,255,0.55)', background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--body)',
              }}>
                ← Anterior
              </button>
            ) : (
              <div />
            )}

            <button type="button" onClick={step === 20 ? handleSubmit : nextStep} disabled={loading} style={{
              padding: '13px 28px', borderRadius: 50, fontWeight: 700, fontSize: 15,
              background: loading ? 'rgba(61,107,255,0.4)' : 'linear-gradient(135deg,#3D6BFF,#6B8FFF)',
              color: '#FFFFFF', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--display)', boxShadow: '0 4px 24px -4px rgba(61,107,255,0.45)',
              transition: 'transform .15s, box-shadow .15s',
            }}>
              {loading ? 'Calculando...' : step === 20 ? 'Ver mi resultado →' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Cargando...</div>}>
      <TestContent />
    </Suspense>
  );
}
