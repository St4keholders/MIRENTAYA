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
  assigned_contador: { id: string; nombre: string } | null;
}

interface LeadRequest {
  id: string;
  status: string;
  pipeline_lead: { id: string; full_name: string } | null;
  requested_at: string;
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

const STAGE_LABELS: Record<string, string> = {
  nuevo: 'Nuevo', por_asignar: 'Por asignar', asignada: 'Asignada',
  anticipo_pagado: 'Anticipo pagado', en_declaracion: 'En declaración',
  entregada: 'Entregada', cancelada: 'Cancelada',
};

export default function PanelContadorPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'crm' | 'pool' | 'comisiones'>('crm');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [userId, setUserId] = useState('');

  const [crmLeads, setCrmLeads] = useState<PipelineLead[]>([]);
  const [poolLeads, setPoolLeads] = useState<PipelineLead[]>([]);
  const [requests, setRequests] = useState<LeadRequest[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);

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
        if (u.rol !== 'contador') {
          router.push('/admin/dashboard');
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
      const [rPipeline, rRequests, rCommissions] = await Promise.all([
        fetch('/api/pipeline'),
        fetch('/api/solicitudes'),
        fetch(`/api/comisiones?beneficiary_id=${userId}`),
      ]);
      const dPipeline = await rPipeline.json();
      const dRequests = await rRequests.json();
      const dCommissions = await rCommissions.json();

      const all: PipelineLead[] = dPipeline.leads || [];
      setCrmLeads(all.filter((l) => l.assigned_contador?.id === userId));
      setPoolLeads(all.filter((l) => l.stage === 'por_asignar' && !l.assigned_contador));
      setRequests((dRequests.requests || []).filter((r: LeadRequest) => r.status === 'pendiente'));
      setCommissions(dCommissions.commissions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const requestLead = async (leadId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_lead_id: leadId, contador_id: userId }),
      });
      const d = await res.json();
      if (!res.ok) showToast(d.error || 'Error', false);
      else showToast('Solicitud enviada al admin ✓');
      await loadAll();
    } catch {
      showToast('Error al enviar solicitud', false);
      setLoading(false);
    }
  };

  const totalPorPagar = commissions.filter(c => c.status === 'por_pagar').reduce((a, c) => a + c.amount, 0);
  const totalPagado = commissions.filter(c => c.status === 'pagada').reduce((a, c) => a + c.amount, 0);

  const bg = '#000';
  const border = 'rgba(255,255,255,0.08)';
  const cardBg = 'rgba(255,255,255,0.04)';
  const sub = 'rgba(255,255,255,0.45)';

  const navBtn = (t: 'crm' | 'pool' | 'comisiones', label: string, count?: number) => (
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
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          background: toast.ok ? 'rgba(78,214,161,0.15)' : 'rgba(255,80,80,0.15)',
          border: `1px solid ${toast.ok ? 'rgba(78,214,161,0.5)' : 'rgba(255,80,80,0.5)'}`,
          borderRadius: 12, padding: '12px 20px', backdropFilter: 'blur(16px)',
          fontFamily: 'var(--mono)', fontSize: 12, color: toast.ok ? '#4ED6A1' : '#FF8080',
        }}>{toast.msg}</div>
      )}

      {loading && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 998, background: 'rgba(10,10,14,0.9)', border: '1px solid rgba(61,107,255,0.4)', borderRadius: 999, padding: '10px 20px', backdropFilter: 'blur(16px)', fontFamily: 'var(--mono)', fontSize: 11, color: '#7DD3FC', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 14, height: 14, border: '2px solid rgba(61,107,255,0.3)', borderTopColor: '#3D6BFF', borderRadius: '50%', animation: 'spinLoading .75s linear infinite' }} />
          Cargando...
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, letterSpacing: '-.03em' }}>
            STAKEHOLDERS<span style={{ color: '#3D6BFF' }}>.</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: sub, letterSpacing: '.16em', marginLeft: 10 }}>CONTADOR</span>
          </span>
          <nav style={{ display: 'flex', gap: 6 }}>
            {navBtn('crm', 'Mi CRM', crmLeads.length)}
            {navBtn('pool', 'Pool', poolLeads.length)}
            {navBtn('comisiones', 'Mis Ganancias')}
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

        {/* CRM */}
        {tab === 'crm' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF' }}>Clientes Asignados</span>
              <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.1rem)', margin: '4px 0 0', letterSpacing: '-.04em' }}>Mi CRM</h1>
            </div>
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}`, background: 'rgba(255,255,255,0.03)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: sub }}>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Cliente</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Contacto</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Stage</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Valor declaración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crmLeads.length === 0 && <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: sub }}>No tienes clientes asignados aún.</td></tr>}
                    {crmLeads.map((l) => (
                      <tr key={l.id} style={{ borderBottom: `1px solid ${border}` }}>
                        <td style={{ padding: '14px 18px', fontWeight: 600 }}>{l.full_name}</td>
                        <td style={{ padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: 12, color: sub }}>{l.email || l.phone || '—'}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(61,107,255,0.12)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 11 }}>{STAGE_LABELS[l.stage] || l.stage}</span>
                        </td>
                        <td style={{ padding: '14px 18px', fontFamily: 'var(--mono)', fontWeight: 700, color: '#4ED6A1' }}>
                          {l.declaration_amount ? formatCOP(l.declaration_amount) : <span style={{ color: sub }}>Pendiente</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pool */}
        {tab === 'pool' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF' }}>Disponibles para tomar</span>
              <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.1rem)', margin: '4px 0 0', letterSpacing: '-.04em' }}>Pool de Leads</h1>
              <p style={{ fontSize: 13, color: sub, margin: '8px 0 0', maxWidth: '55ch' }}>Estos leads están disponibles. Haz clic en <strong>"Pedir lead"</strong> y el admin lo aprobará para asignártelo.</p>
            </div>

            {requests.length > 0 && (
              <div style={{ background: 'rgba(255,200,60,0.08)', border: '1px solid rgba(255,200,60,0.25)', borderRadius: 14, padding: '12px 18px', marginBottom: 16, fontSize: 13, color: '#FFC83C' }}>
                Tienes {requests.length} solicitud(es) pendiente(s) de aprobación.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {poolLeads.length === 0 && <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 40, textAlign: 'center', color: sub }}>Sin leads disponibles en el pool.</div>}
              {poolLeads.map((l) => (
                <div key={l.id} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <span style={{ fontWeight: 600, display: 'block', fontSize: 15 }}>{l.full_name}</span>
                    <span style={{ fontSize: 12, color: sub }}>{l.email || l.phone || '—'} · {l.source}</span>
                  </div>
                  {l.declaration_amount && (
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, color: '#4ED6A1' }}>{formatCOP(l.declaration_amount)}</span>
                  )}
                  <button onClick={() => requestLead(l.id)}
                    style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(61,107,255,0.18)', border: '1px solid rgba(61,107,255,0.5)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                    Pedir lead →
                  </button>
                </div>
              ))}
            </div>
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
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(61,107,255,0.12)', border: '1px solid rgba(61,107,255,0.3)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 11 }}>{c.role}</span>
                      </td>
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
    </div>
  );
}
