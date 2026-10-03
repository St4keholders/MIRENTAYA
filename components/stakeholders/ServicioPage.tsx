'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Stars from './Stars';
import { SERVICIOS_INFO, type ServicioId } from './servicios';
import '@/app/stakeholders.css';
import '@/app/servicios.css';

const OTROS: Array<[string, string]> = [
  ['/contabilidad', 'Contabilidad'], ['/nomina', 'Nómina'], ['/renta', 'Renta persona natural'], ['/personalizado', 'Servicio personalizado'],
];

export default function ServicioPage({ id }: { id: ServicioId }) {
  const s = SERVICIOS_INFO[id];
  const [stuck, setStuck] = useState(false);
  const [f, setF] = useState({ nombre: '', empresa: '', email: '', telefono: '', mensaje: '', website: '' });
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok'>('idle');
  const [err, setErr] = useState('');

  useEffect(() => {
    const onS = () => setStuck(window.scrollY > 30);
    onS();
    window.addEventListener('scroll', onS, { passive: true });
    return () => window.removeEventListener('scroll', onS);
  }, []);

  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!f.nombre.trim()) return setErr('Escribe tu nombre.');
    if (!f.email.trim() && !f.telefono.trim()) return setErr('Déjanos un correo o un celular para contactarte.');
    if (s.mensajeRequerido && !f.mensaje.trim()) return setErr('Cuéntanos brevemente qué necesitas.');
    setEstado('enviando');
    try {
      const res = await fetch('/api/public/solicitud', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, servicio: id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'No pudimos enviar tu solicitud. Intenta de nuevo.');
      setEstado('ok');
    } catch (e2) {
      setErr((e2 as Error).message);
      setEstado('idle');
    }
  };

  const tick = [...s.ticker, ...s.ticker];
  return (
    <div style={{ position: 'relative', overflowX: 'clip' }}>
      <Stars />

      <header className={`nav ${stuck ? 'stuck' : ''}`}>
        <nav className="crumb" aria-label="Ruta">
          <Link href="/" className="brand">STAKEHOLDERS<i /></Link>
          <span>/</span>
          <span style={{ color: 'var(--dim)', letterSpacing: '.08em', fontFamily: 'var(--body)', fontSize: 13 }}>{s.nombre}</span>
        </nav>
        <a href="#solicitar" className="pill">Solicitar propuesta</a>
      </header>

      <main>
        <section className="svc-hero">
          <h1>{s.titulo}</h1>
          <p className="lead">{s.lead}</p>
          <div className="svc-hero__cta">
            <a href="#solicitar" className="pill pill--blue">Solicitar propuesta</a>
            <a href="#incluye" className="pill pill--ghost">Qué incluye</a>
          </div>
        </section>

        <div className="ticker ticker--auto" aria-hidden="true">
          <div className="ticker__in">
            {tick.map((w, i) => (
              <span key={i}>{w} <b>·</b></span>
            ))}
          </div>
        </div>

        <section className="svc-sec svc-split" id="incluye">
          <div>
            <h2>Qué incluye</h2>
            <p className="lead">{s.ideal}</p>
          </div>
          <ul className="incluye">
            {s.incluye.map((it) => (
              <li key={it.t}>
                <h3>{it.t}</h3>
                <p>{it.d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="svc-sec">
          <h2>Cómo empezamos</h2>
          <div className="pasos">
            {s.pasos.map((p, i) => (
              <article className="step" key={i}>
                <p className="step__n">{String(i + 1).padStart(2, '0')}</p>
                <p>{p}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="svc-sec svc-split">
          <div><h2>Preguntas frecuentes</h2></div>
          <div className="faq">
            {s.faq.map((q) => (
              <details key={q.q}>
                <summary>{q.q}</summary>
                <p>{q.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="svc-sec solicitar" id="solicitar" style={{ paddingBottom: 40 }}>
          <div className={`finder ${estado === 'ok' ? 'has-result' : ''}`}>
            {estado === 'ok' ? (
              <div className="sheet__done pop" role="status">
                <div className="sheet__check">✓</div>
                <h3>Recibimos tu solicitud</h3>
                <p className="sheet__sub" style={{ margin: 0 }}>Un contador del equipo te va a contactar para revisar tu caso.</p>
                <Link href="/" className="pill pill--ghost">Volver al inicio</Link>
              </div>
            ) : (
              <form onSubmit={enviar} noValidate>
                <h2>{s.formTitulo}</h2>
                <p className="lead">{s.formSub}</p>
                <div className="solicitar__grid">
                  <label className="fld"><span>Nombre</span><input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} autoComplete="name" /></label>
                  <label className="fld"><span>Empresa (opcional)</span><input value={f.empresa} onChange={(e) => set('empresa', e.target.value)} autoComplete="organization" /></label>
                  <label className="fld"><span>Correo</span><input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" /></label>
                  <label className="fld"><span>Celular</span><input type="tel" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} autoComplete="tel" placeholder="300 000 0000" /></label>
                  <label className="fld fld--full"><span>{s.mensajeLabel}{s.mensajeRequerido ? '' : ' (opcional)'}</span><textarea value={f.mensaje} onChange={(e) => set('mensaje', e.target.value)} /></label>
                  <label className="solicitar__hp" aria-hidden="true">Sitio web<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></label>
                </div>
                {err && <p className="fld__err" role="alert">{err}</p>}
                <button type="submit" className="pill pill--blue" disabled={estado === 'enviando'} style={{ marginTop: 6, padding: '12px 22px', fontSize: 14 }}>
                  {estado === 'enviando' ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </form>
            )}
          </div>
          <div className="svc-otros">
            {OTROS.filter(([h]) => h !== `/${id}`).map(([h, l]) => (
              <Link key={h} href={h} className="pill pill--ghost">{l}</Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="foot" style={{ marginTop: 80 }}>
        <p>Stakeholders 2026. Servicios contables y tributarios en Colombia.</p>
        <nav>
          <Link href="/">Inicio</Link>
          <a href="#solicitar">Contacto</a>
        </nav>
      </footer>
    </div>
  );
}
