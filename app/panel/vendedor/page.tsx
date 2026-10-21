'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/stakeholders.css';
import { formatCOP } from '@/lib/commissions';

interface PipelineLead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  stage: string;
  declaration_amount: number | null;
  source: string;
}

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
  contact_phone: string | null;
  created_at: string;
  pipeline_lead: { id: string; full_name: string; stage: string } | null;
}

const STAGE_LABELS: Record<string, string> = {
  nuevo: 'Nuevo', por_asignar: 'Por asignar', asignada: 'Asignada',
  anticipo_pagado: 'Anticipo pagado', en_declaracion: 'En declaración',
  entregada: 'Entregada', cancelada: 'Cancelada',
};

export default function PanelVendedorPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'clientes' | 'referidos' | 'comisiones'>('clientes');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [userId, setUserId] = useState('');
  const [referralSlug, setReferralSlug] = useState('');

  const [myLeads, setMyLeads] = useState<PipelineLead[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [events, setEvents] = useState<ReferralEvent[]>([]);

  // New client form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [formOpen, setFormOpen] = useState(false);

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
        if (u.rol !== 'vendedor') {
          router.push('/admin/login');
          return;
        }
        setUserId(u.id);
        setReferralSlug(u.referral_slug || '');
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
      const [rPipeline, rCommissions, rEvents] = await Promise.all([
        fetch('/api/pipeline'),
        fetch(`/api/comisiones?beneficiary_id=${userId}`),
        fetch(`/api/referral-events?referrer_id=${userId}`),
      ]);
      const dPipeline = await rPipeline.json();
      const dCommissions = await rCommissions.json();
      const dEvents = await rEvents.json();

      const all: PipelineLead[] = dPipeline.leads || [];
      setMyLeads(all.filter((l) => (l as any).seller_id === userId || (l as any).seller?.id === userId));
      setCommissions(dCommissions.commissions || []);
      setEvents(dEvents.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async () => {
    if (!newName.trim()) { showToast('Nombre requerido', false); return; }
    setLoading(true);
    try {
      const body: Record<string, unknown> = { full_name: newName, email: newEmail || null, phone: newPhone || null, seller_id: userId, source: 'vendedor' };
      if (newAmount) body.declaration_amount = Number(newAmount);
      const res = await fetch('/api/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) showToast(d.error || 'Error', false);
      else { showToast('Cliente agregado ✓'); setFormOpen(false); setNewName(''); setNewEmail(''); setNewPhone(''); setNewAmount(''); await loadAll(); }
    } catch {
      showToast('Error al crear cliente', false);
      setLoading(false);
    }
  };

  const confirmClient = async (leadId: string) => {
    setLoading(true);
    try {
      await fetch('/api/pipeline', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: leadId, stage: 'por_asignar' }) });
      showToast('Cliente marcado como confirmado ✓');
      await loadAll();
    } catch {
      showToast('Error', false);
      setLoading(false);
    }
  };

  const updateAmount = async (leadId: string, amount: string) => {
    if (!amount) return;
    setLoading(true);
    try {
      await fetch('/api/pipeline', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: leadId, declaration_amount: Number(amount) }) });
      showToast('Valor actualizado ✓');
      await loadAll();
    } catch {
      showToast('Error', false);
      setLoading(false);
    }
  };

  const copyLink = (type: 'test' | 'agendar') => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://mirentaya.co';
    const url = `${base}/${type}?ref=${referralSlug}`;
    navigator.clipboard.writeText(url).then(() => showToast('Link copiado ✓'));
  };

  const totalPorPagar = commissions.filter(c => c.status === 'por_pagar').reduce((a, c) => a + c.amount, 0);
  const totalPagado = commissions.filter(c => c.status === 'pagada').reduce((a, c) => a + c.amount, 0);

  const bg = '#000';
  const border = 'rgba(255,255,255,0.08)';
  const cardBg = 'rgba(255,255,255,0.04)';
  const sub = 'rgba(255,255,255,0.45)';

  const navBtn = (t: 'clientes' | 'referidos' | 'comisiones', label: string, count?: number) => (
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
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: sub, letterSpacing: '.16em', marginLeft: 10 }}>VENDEDOR</span>
          </span>
          <nav style={{ display: 'flex', gap: 6 }}>
            {navBtn('clientes', 'Mis Clientes', myLeads.length)}
            {navBtn('referidos', 'Referidos', events.length)}
            {navBtn('comisiones', 'Ganancias')}
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

        {/* Clientes */}
        {tab === 'clientes' && (
          <>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF' }}>Pipeline propio</span>
                <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.1rem)', margin: '4px 0 0', letterSpacing: '-.04em' }}>Mis Clientes</h1>
              </div>
              <button onClick={() => setFormOpen(true)} style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(61,107,255,0.2)', border: '1px solid rgba(61,107,255,0.5)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                + Agregar cliente
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myLeads.length === 0 && <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 40, textAlign: 'center', color: sub }}>Sin clientes. Haz clic en "Agregar cliente" para comenzar.</div>}
              {myLeads.map((l) => (
                <div key={l.id} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <span style={{ fontWeight: 600, fontSize: 15, display: 'block' }}>{l.full_name}</span>
                      <span style={{ fontSize: 12, color: sub }}>{l.email || l.phone || '—'}</span>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(61,107,255,0.12)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 11 }}>{STAGE_LABELS[l.stage] || l.stage}</span>
                    {l.declaration_amount && <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, color: '#4ED6A1' }}>{formatCOP(l.declaration_amount)}</span>}
                    {l.stage === 'nuevo' && (
                      <button onClick={() => confirmClient(l.id)}
                        style={{ padding: '7px 14px', borderRadius: 10, background: 'rgba(78,214,161,0.15)', border: '1px solid rgba(78,214,161,0.4)', color: '#4ED6A1', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>
                        Confirmar venta ✓
                      </button>
                    )}
                  </div>
                  {l.stage === 'nuevo' && !l.declaration_amount && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="number" placeholder="Valor de la declaración ($)" id={`amt-${l.id}`}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, borderRadius: 8, padding: '8px 12px', color: '#fff', fontFamily: 'var(--mono)', fontSize: 13, outline: 'none' }} />
                      <button onClick={() => updateAmount(l.id, (document.getElementById(`amt-${l.id}`) as HTMLInputElement)?.value)}
                        style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: `1px solid ${border}`, color: sub, fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>
                        Guardar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Referidos */}
        {tab === 'referidos' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF' }}>Atribución</span>
              <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.1rem)', margin: '4px 0 0', letterSpacing: '-.04em' }}>Mis Links de Referido</h1>
            </div>

            {referralSlug ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginBottom: 28 }}>
                  {[
                    { type: 'test' as const, label: 'Link de Test', desc: '¿Debo declarar renta?' },
                    { type: 'agendar' as const, label: 'Link de Agendar', desc: 'Agendar consulta directa' },
                  ].map(({ type, label, desc }) => {
                    const base = typeof window !== 'undefined' ? window.location.origin : 'https://mirentaya.co';
                    const url = `${base}/${type}?ref=${referralSlug}`;
                    return (
                      <div key={type} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 18, padding: 22 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: '#3D6BFF', display: 'block', marginBottom: 8 }}>{label}</span>
                        <p style={{ fontSize: 13, color: sub, margin: '0 0 12px' }}>{desc}</p>
                        <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`, borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: '#7DD3FC', wordBreak: 'break-all', marginBottom: 12 }}>
                          {url}
                        </div>
                        <button onClick={() => copyLink(type)}
                          style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(61,107,255,0.18)', border: '1px solid rgba(61,107,255,0.4)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', letterSpacing: '.1em' }}>
                          📋 Copiar link
                        </button>
                      </div>
                    );
                  })}
                </div>

                <h3 style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: '1.1rem', margin: '0 0 16px', letterSpacing: '-.02em' }}>Conversiones ({events.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {events.length === 0 && <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '24px', textAlign: 'center', color: sub, fontSize: 13 }}>Sin conversiones aún. Comparte tus links.</div>}
                  {events.map((e) => (
                    <div key={e.id} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, background: e.event_type === 'test' ? 'rgba(120,160,255,0.15)' : 'rgba(78,214,161,0.15)', color: e.event_type === 'test' ? '#90B0FF' : '#4ED6A1', fontFamily: 'var(--mono)', fontSize: 11 }}>{e.event_type}</span>
                      <span style={{ flex: 1, fontSize: 13 }}>{e.contact_name || 'Anónimo'}</span>
                      <span style={{ fontSize: 12, color: sub, fontFamily: 'var(--mono)' }}>{new Date(e.created_at).toLocaleDateString('es-CO')}</span>
                      {e.pipeline_lead && (
                        <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(78,214,161,0.12)', color: '#4ED6A1', fontFamily: 'var(--mono)', fontSize: 11 }}>→ Cliente</span>
                      )}
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

        {/* Comisiones */}
        {tab === 'comisiones' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF' }}>Mis Ganancias</span>
              <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.1rem)', margin: '4px 0 0', letterSpacing: '-.04em' }}>Comisiones</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Por pagar', val: totalPorPagar, color: '#FFC83C', bg: 'rgba(255,200,60,0.1)' },
                { label: 'Total pagado', val: totalPagado, color: '#4ED6A1', bg: 'rgba(78,214,161,0.1)' },
              ].map((s) => (
                <div key={s.label} style={{ background: s.bg, border: `1px solid ${border}`, borderRadius: 16, padding: '20px 22px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: sub, display: 'block', marginBottom: 8 }}>{s.label}</span>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.8rem', color: s.color }}>{formatCOP(s.val)}</span>
                </div>
              ))}
            </div>

            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}`, background: 'rgba(255,255,255,0.03)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: sub }}>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Cliente</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Rol</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>%</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Monto</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: sub }}>Sin comisiones aún.</td></tr>}
                  {commissions.map((c) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={{ padding: '14px 18px' }}>{c.pipeline_lead?.full_name || '—'}</td>
                      <td style={{ padding: '14px 18px' }}><span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(61,107,255,0.12)', border: '1px solid rgba(61,107,255,0.3)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 11 }}>{c.role}</span></td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: 12, color: sub }}>{c.pct}%</td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, color: '#4ED6A1' }}>{formatCOP(c.amount)}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 11, background: c.status === 'por_pagar' ? 'rgba(255,200,60,0.15)' : 'rgba(78,214,161,0.15)', color: c.status === 'por_pagar' ? '#FFC83C' : '#4ED6A1' }}>
                          {c.status === 'por_pagar' ? 'Por pagar' : 'Pagada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* New Client Modal */}
      {formOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }} onClick={() => setFormOpen(false)} />
          <div style={{ position: 'relative', width: 'min(100%,440px)', background: '#101014', border: `1px solid ${border}`, borderRadius: 24, padding: 28, zIndex: 1 }}>
            <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.3rem', margin: '0 0 20px', letterSpacing: '-.03em' }}>Agregar cliente</h3>
            {[
              { label: 'Nombre completo', val: newName, set: setNewName, type: 'text', required: true },
              { label: 'Correo', val: newEmail, set: setNewEmail, type: 'email', required: false },
              { label: 'Teléfono', val: newPhone, set: setNewPhone, type: 'tel', required: false },
              { label: 'Valor de la declaración ($)', val: newAmount, set: setNewAmount, type: 'number', required: false },
            ].map(({ label, val, set, type }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: sub, marginBottom: 6 }}>{label}</label>
                <input type={type} value={val} onChange={(e) => set(e.target.value)}
                  style={{ width: '100%', background: '#000', border: `1px solid ${border}`, borderRadius: 10, color: '#fff', padding: '11px 13px', fontFamily: 'var(--body)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <p style={{ fontSize: 11, color: sub, marginBottom: 16 }}>La consultoría de $100k va aparte y no se incluye en el valor.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={createClient} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(61,107,255,0.2)', border: '1px solid rgba(61,107,255,0.5)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer' }}>
                Agregar
              </button>
              <button onClick={() => setFormOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'transparent', border: `1px solid ${border}`, color: sub, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
