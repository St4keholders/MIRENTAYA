'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/stakeholders.css';
import { formatCOP } from '@/lib/commissions';

interface Commission {
  id: string;
  role: string;
  amount: number;
  status: string;
  pct: number;
  pipeline_lead: { id: string; full_name: string } | null;
  created_at: string;
  paid_at: string | null;
}

interface ReferralEvent {
  id: string;
  event_type: string;
  contact_name: string | null;
  contact_email: string | null;
  created_at: string;
  pipeline_lead: { id: string; full_name: string; stage: string } | null;
}

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  referral_slug: string | null;
  payout_bank: string | null;
  payout_account_type: string | null;
  payout_account_number: string | null;
  payout_doc_id: string | null;
}

export default function PanelReferidoPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'links' | 'ganancias' | 'datos'>('links');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [userId, setUserId] = useState('');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [events, setEvents] = useState<ReferralEvent[]>([]);

  // Datos bancarios form
  const [payBank, setPayBank] = useState('');
  const [payType, setPayType] = useState('');
  const [payNumber, setPayNumber] = useState('');
  const [payDoc, setPayDoc] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch('/api/erp/me')
      .then((r) => {
        if (!r.ok) throw new Error('Unauth');
        return r.json();
      })
      .then((json) => {
        const u = json?.data;
        if (!u) {
          router.push('/admin/login');
          return;
        }
        if (u.rol !== 'referido') {
          router.push('/admin/login');
          return;
        }
        setUserId(u.id);
        localStorage.setItem('stakeholders_user', JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem('stakeholders_user');
        router.push('/admin/login');
      });
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    loadAll();
  }, [userId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rUsuarios, rCommissions, rEvents] = await Promise.all([
        fetch('/api/admin/usuarios'),
        fetch(`/api/comisiones?beneficiary_id=${userId}`),
        fetch(`/api/referral-events?referrer_id=${userId}`),
      ]);
      const dUsuarios = await rUsuarios.json();
      const dCommissions = await rCommissions.json();
      const dEvents = await rEvents.json();

      const me = (dUsuarios.usuarios || []).find((u: any) => u.id === userId);
      if (me) {
        setProfile(me);
        setPayBank(me.payout_bank || '');
        setPayType(me.payout_account_type || '');
        setPayNumber(me.payout_account_number || '');
        setPayDoc(me.payout_doc_id || '');
      }
      setCommissions(dCommissions.commissions || []);
      setEvents(dEvents.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveBankData = async () => {
    setSavingBank(true);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, payout_bank: payBank, payout_account_type: payType, payout_account_number: payNumber, payout_doc_id: payDoc }),
      });
      if (res.ok) showToast('Datos guardados ✓');
      else showToast('Error al guardar', false);
    } catch {
      showToast('Error', false);
    } finally {
      setSavingBank(false);
    }
  };

  const copyLink = (type: 'test' | 'agendar') => {
    const slug = profile?.referral_slug;
    if (!slug) { showToast('Sin slug asignado', false); return; }
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://mirentaya.co';
    const url = `${base}/${type}?ref=${slug}`;
    navigator.clipboard.writeText(url).then(() => showToast('Link copiado ✓'));
  };

  const totalPorPagar = commissions.filter(c => c.status === 'por_pagar').reduce((a, c) => a + c.amount, 0);
  const totalPagado = commissions.filter(c => c.status === 'pagada').reduce((a, c) => a + c.amount, 0);

  const bg = '#000';
  const border = 'rgba(255,255,255,0.08)';
  const cardBg = 'rgba(255,255,255,0.04)';
  const sub = 'rgba(255,255,255,0.45)';

  const navBtn = (t: 'links' | 'ganancias' | 'datos', label: string, count?: number) => (
    <button onClick={() => setTab(t)} style={{
      padding: '10px 16px', borderRadius: 10, fontFamily: 'var(--mono)', fontSize: 11,
      letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .2s',
      display: 'flex', alignItems: 'center', gap: 8,
      background: tab === t ? 'rgba(61,107,255,0.18)' : 'transparent',
      border: tab === t ? '1px solid rgba(61,107,255,0.5)' : '1px solid transparent',
      color: tab === t ? '#fff' : sub,
    }}>
      {label}
      {count !== undefined && <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 999, padding: '1px 6px', fontSize: 10 }}>{count}</span>}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#fff', fontFamily: 'var(--body)' }}>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: toast.ok ? 'rgba(78,214,161,0.15)' : 'rgba(255,80,80,0.15)', border: `1px solid ${toast.ok ? 'rgba(78,214,161,0.5)' : 'rgba(255,80,80,0.5)'}`, borderRadius: 12, padding: '12px 20px', backdropFilter: 'blur(16px)', fontFamily: 'var(--mono)', fontSize: 12, color: toast.ok ? '#4ED6A1' : '#FF8080' }}>
          {toast.msg}
        </div>
      )}

      {loading && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 998, background: 'rgba(10,10,14,0.9)', border: '1px solid rgba(61,107,255,0.4)', borderRadius: 999, padding: '10px 20px', backdropFilter: 'blur(16px)', fontFamily: 'var(--mono)', fontSize: 11, color: '#7DD3FC', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 14, height: 14, border: '2px solid rgba(61,107,255,0.3)', borderTopColor: '#3D6BFF', borderRadius: '50%', animation: 'spinLoading .75s linear infinite' }} />
          Cargando...
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, letterSpacing: '-.03em' }}>
            STAKEHOLDERS<span style={{ color: '#3D6BFF' }}>.</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: sub, letterSpacing: '.16em', marginLeft: 10 }}>REFERIDO</span>
          </span>
          <nav style={{ display: 'flex', gap: 6 }}>
            {navBtn('links', 'Mis Links', events.length)}
            {navBtn('ganancias', 'Ganancias')}
            {navBtn('datos', 'Datos Bancarios')}
          </nav>
        </div>
        <button onClick={async () => {
          try { await fetch('/api/erp/logout', { method: 'POST' }); } catch {}
          localStorage.removeItem('stakeholders_user');
          router.push('/admin/login');
        }}
          style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#FF8080', background: 'none', border: 'none', cursor: 'pointer' }}>
          Salir
        </button>
      </div>

      <div style={{ padding: '28px clamp(16px,4vw,40px)' }}>

        {/* Links */}
        {tab === 'links' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF' }}>Atribución first-touch</span>
              <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.1rem)', margin: '4px 0 0', letterSpacing: '-.04em' }}>Mis Links Personales</h1>
            </div>

            {profile?.referral_slug ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginBottom: 32 }}>
                  {[
                    { type: 'test' as const, label: 'Link de Test', desc: 'El contacto responde el test "¿Debo declarar renta?" y queda atribuido a ti', icon: '🎯' },
                    { type: 'agendar' as const, label: 'Link de Consulta', desc: 'El contacto agenda una consulta directamente y queda atribuido a ti', icon: '📅' },
                  ].map(({ type, label, desc, icon }) => {
                    const base = typeof window !== 'undefined' ? window.location.origin : 'https://mirentaya.co';
                    const url = `${base}/${type}?ref=${profile.referral_slug}`;
                    return (
                      <div key={type} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: 24 }}>
                        <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: '#3D6BFF', display: 'block', marginBottom: 6 }}>{label}</span>
                        <p style={{ fontSize: 13, color: sub, margin: '0 0 14px', lineHeight: 1.5 }}>{desc}</p>
                        <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: '#7DD3FC', wordBreak: 'break-all', marginBottom: 14 }}>
                          {url}
                        </div>
                        <button onClick={() => copyLink(type)}
                          style={{ width: '100%', padding: '11px', borderRadius: 12, background: 'rgba(61,107,255,0.18)', border: '1px solid rgba(61,107,255,0.45)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                          📋 Copiar link
                        </button>
                      </div>
                    );
                  })}
                </div>

                <h3 style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: '1.1rem', margin: '0 0 16px', letterSpacing: '-.02em' }}>Conversiones ({events.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {events.length === 0 && <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 30, textAlign: 'center', color: sub, fontSize: 13 }}>Sin conversiones aún. Comparte tus links y empieza a ganar.</div>}
                  {events.map((e) => (
                    <div key={e.id} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, background: e.event_type === 'test' ? 'rgba(120,160,255,0.15)' : 'rgba(78,214,161,0.15)', color: e.event_type === 'test' ? '#90B0FF' : '#4ED6A1', fontFamily: 'var(--mono)', fontSize: 11 }}>{e.event_type}</span>
                      <span style={{ flex: 1, fontSize: 13 }}>{e.contact_name || 'Anónimo'} {e.contact_email && <span style={{ color: sub }}>· {e.contact_email}</span>}</span>
                      <span style={{ fontSize: 11, color: sub, fontFamily: 'var(--mono)' }}>{new Date(e.created_at).toLocaleDateString('es-CO')}</span>
                      {e.pipeline_lead && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(78,214,161,0.12)', color: '#4ED6A1', fontFamily: 'var(--mono)', fontSize: 11 }}>→ Cliente</span>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ background: 'rgba(255,200,60,0.08)', border: '1px solid rgba(255,200,60,0.25)', borderRadius: 16, padding: 30, textAlign: 'center', color: '#FFC83C' }}>
                Tu slug de referido aún no está asignado. Contacta al administrador.
              </div>
            )}
          </>
        )}

        {/* Ganancias */}
        {tab === 'ganancias' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF' }}>Mis Comisiones</span>
              <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.1rem)', margin: '4px 0 0', letterSpacing: '-.04em' }}>Ganancias</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Por pagar', val: totalPorPagar, color: '#FFC83C', bg: 'rgba(255,200,60,0.1)', sub: '5-10% del valor de la declaración' },
                { label: 'Total pagado', val: totalPagado, color: '#4ED6A1', bg: 'rgba(78,214,161,0.1)', sub: 'Ya transferido a tu cuenta' },
              ].map((s) => (
                <div key={s.label} style={{ background: s.bg, border: `1px solid ${border}`, borderRadius: 18, padding: '22px 24px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: sub, display: 'block', marginBottom: 10 }}>{s.label}</span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '2rem', color: s.color, display: 'block' }}>{formatCOP(s.val)}</span>
                  <span style={{ fontSize: 12, color: sub, display: 'block', marginTop: 4 }}>{s.sub}</span>
                </div>
              ))}
            </div>

            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}`, background: 'rgba(255,255,255,0.03)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: sub }}>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Declaración</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>%</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Monto</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Estado</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Fecha pago</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: sub }}>Sin comisiones aún. Cuando tus referidos compren, aparecerán aquí.</td></tr>}
                  {commissions.map((c) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={{ padding: '14px 18px' }}>{c.pipeline_lead?.full_name || '—'}</td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: 12, color: sub }}>{c.pct}%</td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 15, color: '#4ED6A1' }}>{formatCOP(c.amount)}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 11, background: c.status === 'por_pagar' ? 'rgba(255,200,60,0.15)' : 'rgba(78,214,161,0.15)', color: c.status === 'por_pagar' ? '#FFC83C' : '#4ED6A1' }}>
                          {c.status === 'por_pagar' ? 'Pendiente' : 'Pagada'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: 12, color: sub }}>{c.paid_at ? new Date(c.paid_at).toLocaleDateString('es-CO') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Datos bancarios */}
        {tab === 'datos' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF' }}>Para dispersión</span>
              <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.1rem)', margin: '4px 0 0', letterSpacing: '-.04em' }}>Datos Bancarios</h1>
              <p style={{ fontSize: 13, color: sub, margin: '8px 0 0' }}>El admin usa estos datos para transferirte las comisiones cuando se confirme el pago.</p>
            </div>

            <div style={{ maxWidth: 480, background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: 28 }}>
              {[
                { label: 'Banco', val: payBank, set: setPayBank, placeholder: 'Bancolombia, Nequi, Davivienda...' },
                { label: 'Tipo de cuenta', val: payType, set: setPayType, placeholder: 'Ahorros, Corriente, Nequi...' },
                { label: 'Número de cuenta / celular', val: payNumber, set: setPayNumber, placeholder: '0000000000' },
                { label: 'Documento de identidad', val: payDoc, set: setPayDoc, placeholder: 'CC o NIT' },
              ].map(({ label, val, set, placeholder }) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: sub, marginBottom: 6 }}>{label}</label>
                  <input type="text" value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                    style={{ width: '100%', background: '#000', border: `1px solid ${border}`, borderRadius: 10, color: '#fff', padding: '11px 13px', fontFamily: 'var(--body)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <button onClick={saveBankData} disabled={savingBank}
                style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'rgba(61,107,255,0.2)', border: '1px solid rgba(61,107,255,0.5)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', letterSpacing: '.1em', transition: 'all .2s' }}>
                {savingBank ? 'Guardando...' : 'Guardar Datos Bancarios'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
