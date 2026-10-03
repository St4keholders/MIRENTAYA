'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/app/stakeholders.css';
import { api } from '@/components/erp/api';
import { ToastProvider } from '@/components/erp/toast';
import { C, ThemeProvider, makeTheme } from '@/components/erp/ui';
import TercerosPanel from '@/components/erp/panels/TercerosPanel';
import DocumentosPanel from '@/components/erp/panels/DocumentosPanel';
import LibroDiarioPanel from '@/components/erp/panels/LibroDiarioPanel';
import LeadsPanel from '@/components/erp/panels/LeadsPanel';
import UsuariosPanel from '@/components/erp/panels/UsuariosPanel';
import { MODULOS, esAdmin, type Modulo } from '@/lib/erp/permisos';

interface Me { id: string; nombre: string; email: string; rol: string; modulos: Modulo[] }

const leerLS = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const escribirLS = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* sin storage */ } };

/* Íconos lineales mínimos para la barra lateral */
const ICONOS: Record<Modulo, string> = {
  clientes: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  proveedores: 'M3 9h18l-2-5H5L3 9zM4 9v11h16V9M9 20v-6h6v6',
  libro: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM20 17v4H6.5A2.5 2.5 0 0 1 4 18.5',
  compras: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zM3 6h18M16 10a4 4 0 0 1-8 0',
  ventas: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  leads: 'M22 12h-4l-3 9L9 3l-3 9H2',
  usuarios: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
};

export default function ErpDashboardPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [tab, setTab] = useState<Modulo | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = theme === 'dark';
  const t = makeTheme(isDark);

  const salir = useCallback(async () => {
    await fetch('/api/erp/logout', { method: 'POST' }).catch(() => {});
    escribirLS('stakeholders_user', null);
    router.replace('/admin/login');
  }, [router]);

  /* Sesión */
  useEffect(() => {
    if (leerLS('erp_theme') === 'light') setTheme('light');
    api<Me>('/api/erp/me')
      .then((m) => {
        setMe(m);
        const hash = window.location.hash.replace('#', '') as Modulo;
        setTab(m.modulos.includes(hash) ? hash : m.modulos[0] ?? null);
      })
      .catch(() => { escribirLS('stakeholders_user', null); router.replace('/admin/login'); });
    const onUnauth = () => { escribirLS('stakeholders_user', null); router.replace('/admin/login'); };
    window.addEventListener('erp:unauthorized', onUnauth);
    return () => window.removeEventListener('erp:unauthorized', onUnauth);
  }, [router]);

  useEffect(() => { if (tab) history.replaceState(null, '', `#${tab}`); }, [tab]);
  useEffect(() => { escribirLS('erp_theme', theme); document.body.style.backgroundColor = t.bg; }, [theme, t.bg]);

  /* Fondo de estrellas (idéntico al resto del sitio) */
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
      stars = Array.from({ length: Math.min(Math.round((w * h) / 12000), 260) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() < 0.88 ? Math.random() * 0.7 + 0.25 : Math.random() * 1.1 + 0.8,
        a: Math.random() * 0.45 + 0.08, t: Math.random() * Math.PI * 2,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      if (!isDark) return;
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
  }, [isDark]);

  const modulo = MODULOS.find((m) => m.id === tab);
  const admin = esAdmin(me?.rol);

  return (
    <ThemeProvider value={t}>
      <ToastProvider>
        <div style={{ minHeight: '100vh', backgroundColor: t.bg, color: t.text, position: 'relative', overflowX: 'clip' }}>
          <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
          {isDark && <div className="veil" aria-hidden="true" />}

          {/* ── SIDEBAR ── */}
          <aside className={`erp-sidebar ${menuOpen ? 'open' : ''}`} style={{
            width: 232, position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50, background: t.sidebarBg,
            backdropFilter: 'blur(20px)', borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', transition: 'transform .3s var(--ease)',
          }}>
            <div style={{ overflowY: 'auto' }}>
              <div style={{ padding: '24px 20px', borderBottom: `1px solid ${t.border}` }}>
                <Link href="/" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: t.text, letterSpacing: '-.03em' }}>
                  STAKEHOLDERS<span style={{ color: C.blue }}>.</span>
                </Link>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.24em', color: t.subtext, marginTop: 4, textTransform: 'uppercase' }}>ERP · CRM</div>
                {me && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999,
                      background: admin ? 'rgba(61,107,255,0.15)' : 'rgba(78,214,161,0.15)', color: admin ? t.sky : t.green,
                      border: `1px solid ${admin ? 'rgba(61,107,255,0.4)' : 'rgba(78,214,161,0.4)'}`,
                    }}>{me.rol}</span>
                    <span style={{ fontSize: 11, color: t.subtext, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me.nombre}</span>
                  </div>
                )}
              </div>

              <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {MODULOS.filter((m) => me?.modulos.includes(m.id)).map((m, i, arr) => {
                  const on = tab === m.id;
                  const sep = i > 0 && arr[i - 1].eyebrow !== m.eyebrow;
                  return (
                    <div key={m.id}>
                      {(i === 0 || sep) && (
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: t.subtext, opacity: 0.6, padding: `${i === 0 ? 0 : 12}px 14px 6px` }}>
                          {m.eyebrow}
                        </div>
                      )}
                      <button onClick={() => { setTab(m.id); setMenuOpen(false); }} style={{
                        width: '100%', padding: '11px 14px', borderRadius: 12, textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 11,
                        letterSpacing: '.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                        transition: 'all .2s', background: on ? 'rgba(61,107,255,0.18)' : 'transparent',
                        border: on ? '1px solid rgba(61,107,255,0.5)' : '1px solid transparent', color: on ? t.text : t.subtext,
                      }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: on ? 1 : 0.7 }}>
                          <path d={ICONOS[m.id]} />
                        </svg>
                        {m.label}
                      </button>
                    </div>
                  );
                })}
              </nav>
            </div>

            <div style={{ padding: '14px 16px 22px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {admin && (
                <Link href="/admin/renta" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: t.subtext, padding: '6px 4px' }}>
                  ↳ Archivo temporada renta
                </Link>
              )}
              <button onClick={salir} style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)',
                color: C.red, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
              }}>Cerrar sesión</button>
            </div>
          </aside>
          {menuOpen && <div className="erp-scrim" onClick={() => setMenuOpen(false)} />}

          {/* ── CONTENIDO ── */}
          <div className="erp-main" style={{ marginLeft: 232, minHeight: '100vh', position: 'relative', zIndex: 10, padding: '32px clamp(16px,4vw,40px) 60px' }}>
            <header className="erp-mobile-header" style={{
              display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: t.sidebarBg,
              backdropFilter: 'blur(16px)', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 40, margin: '-32px -16px 24px',
            }}>
              <button onClick={() => setMenuOpen((v) => !v)} aria-label="Menú" style={{ background: 'none', border: 'none', color: t.text, fontSize: 22, cursor: 'pointer' }}>☰</button>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15 }}>
                STAKEHOLDERS <span style={{ color: C.blue }}>/</span> {modulo?.label.toUpperCase()}
              </span>
              <span style={{ width: 22 }} />
            </header>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: C.blue, display: 'block', marginBottom: 4 }}>
                  {modulo ? `Panel administrativo · ${modulo.eyebrow}` : 'Panel administrativo'}
                </span>
                <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.2rem)', margin: 0, letterSpacing: '-.04em', color: t.text }}>
                  {modulo?.titulo || 'Cargando…'}
                </h1>
              </div>
              <button onClick={() => setTheme(isDark ? 'light' : 'dark')} style={{
                padding: '8px 14px', borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1', color: t.text, fontFamily: 'var(--mono)',
                fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>{isDark ? 'Modo Claro ☀️' : 'Modo Oscuro 🌙'}</button>
            </div>

            {!me && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 9999, background: 'linear-gradient(90deg, #3D6BFF, #4ED6A1, #7DD3FC)', backgroundSize: '200% 100%', animation: 'erpBar 1.5s infinite linear' }} />
            )}

            {me && tab === 'clientes' && <TercerosPanel key="c" tipo="cliente" />}
            {me && tab === 'proveedores' && <TercerosPanel key="p" tipo="proveedor" />}
            {me && tab === 'libro' && <LibroDiarioPanel />}
            {me && tab === 'compras' && <DocumentosPanel key="co" tipo="compra" />}
            {me && tab === 'ventas' && <DocumentosPanel key="ve" tipo="venta" />}
            {me && tab === 'leads' && <LeadsPanel esAdmin={admin} puedeClientes={me.modulos.includes('clientes')} />}
            {me && tab === 'usuarios' && <UsuariosPanel yoId={me.id} soyDev={me.rol === 'desarrollador'} />}
          </div>

          <style>{`
            @keyframes erpBar { 0% { background-position: 0% 0%; } 100% { background-position: 200% 0%; } }
            .erp-main input[type="date"] { color-scheme: ${isDark ? 'dark' : 'light'}; }
            .erp-modal input[type="date"] { color-scheme: ${isDark ? 'dark' : 'light'}; }
            .erp-scrim { position: fixed; inset: 0; z-index: 45; background: rgba(0,0,0,.55); backdrop-filter: blur(4px); }
            @media (max-width: 900px) {
              .erp-sidebar { transform: translateX(-100%); }
              .erp-sidebar.open { transform: translateX(0); box-shadow: 0 0 60px rgba(0,0,0,.6); }
              .erp-main { margin-left: 0 !important; }
              .erp-mobile-header { display: flex !important; }
              .erp-split { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 640px) {
              .erp-grid { grid-template-columns: 1fr !important; }
              .erp-grid > * { grid-column: auto !important; }
            }
          `}</style>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
