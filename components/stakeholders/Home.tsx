'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import Stars from './Stars';
import '@/app/stakeholders.css';
import '@/app/servicios.css';

const OPCIONES = [
  { href: '/contabilidad', t: 'Contabilidad', d: 'Libros, impuestos y estados financieros de tu empresa.', x: '28%', y: '15%', d0: '7.5s', dl: '0s', dx: '5px', in: '.55s' },
  { href: '/nomina', t: 'Nómina', d: 'Liquidación, nómina electrónica y seguridad social de tu equipo.', x: '74%', y: '37%', d0: '8.5s', dl: '-2s', dx: '-4px', in: '.7s' },
  { href: '/renta', t: 'Renta persona natural', d: 'Descubre si debes declarar y hasta cuándo tienes plazo.', x: '31%', y: '62%', d0: '7s', dl: '-4s', dx: '-5px', in: '.85s' },
  { href: '/personalizado', t: 'Servicio personalizado', d: 'Trámites y casos puntuales, revisados por un contador.', x: '71%', y: '86%', d0: '9s', dl: '-1s', dx: '4px', in: '1s' },
];

const TITULO = 'Un área contable completa, fuera de tu oficina';

export default function Home() {
  const [in_, setIn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100svh' }}>
      <Stars />
      <main className="home">
        <span className="home__brand">STAKEHOLDERS<i /></span>

        <div className={`home__copy ${in_ ? 'is-in' : ''}`}>
          <h1 aria-label={TITULO}>
            {TITULO.split(' ').map((w, i) => (
              <Fragment key={i}>
                <span className="w" aria-hidden="true">
                  <span className="wi" style={{ transitionDelay: `${i * 55}ms` }}>{w}</span>
                </span>{' '}
              </Fragment>
            ))}
          </h1>
          <h2 className="lead fade" style={{ transitionDelay: '.45s', fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)', lineHeight: 1.55, fontWeight: 400, color: 'var(--dim)', marginTop: '20px' }}>
            Contadores públicos que llevan la contabilidad y la nómina de tu empresa. Y si eres persona natural, también te ayudamos con tu declaración de renta.
          </h2>
          <div className="home__cta-wrap fade" style={{ transitionDelay: '.65s', marginTop: '26px' }}>
            <a href="#servicios" className="home__cta-btn">
              <span>Elige lo que necesitas resolver</span>
              <span className="home__cta-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <nav className="orbit" id="servicios" aria-label="Servicios">
          <svg className="orbit__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={OPCIONES.map((o) => `${parseFloat(o.x)},${parseFloat(o.y)}`).join(' ')} />
          </svg>
          {OPCIONES.map((o) => (
            <div key={o.href} className="opt" style={{ '--x': o.x, '--y': o.y, '--in': o.in } as React.CSSProperties}>
              <div className="opt__float" style={{ '--d': o.d0, '--dl': o.dl, '--dx': o.dx } as React.CSSProperties}>
                <Link href={o.href} className="opt__card">
                  <div>
                    <div className="opt__t">{o.t}</div>
                    <p className="opt__d">{o.d}</p>
                  </div>
                  <span className="opt__go" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </nav>

        <p className="home__mark" aria-hidden="true">STAKEHOLDERS</p>
        <div className="home__foot">
          <span>Stakeholders 2026 · Colombia</span>
          <Link href="/admin/login">Acceso equipo</Link>
        </div>
      </main>
    </div>
  );
}
