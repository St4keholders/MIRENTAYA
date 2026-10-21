'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/stakeholders.css';
import { calcCommissions, formatCOP, DEFAULT_SETTINGS, type AppSettings } from '@/lib/commissions';

/* ── Types ─────────────────────────────────────────────────────────── */
type Stage = 'nuevo' | 'por_asignar' | 'asignada' | 'anticipo_pagado' | 'en_declaracion' | 'entregada' | 'cancelada';

interface PipelineLead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string;
  stage: Stage;
  declaration_amount: number | null;
  anticipo_paid_at: string | null;
  created_at: string;
  referrer: { id: string; nombre: string; email: string } | null;
  seller: { id: string; nombre: string; email: string } | null;
  assigned_contador: { id: string; nombre: string; email: string } | null;
}

interface LeadRequest {
  id: string;
  status: string;
  requested_at: string;
  resolved_at: string | null;
  pipeline_lead: { id: string; full_name: string; stage: string } | null;
  contador: { id: string; nombre: string; email: string } | null;
  resolver: { id: string; nombre: string } | null;
}

interface Commission {
  id: string;
  role: string;
  base_amount: number;
  pct: number;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  pipeline_lead: { id: string; full_name: string; declaration_amount: number } | null;
  beneficiary: { id: string; nombre: string; email: string; rol: string } | null;
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  por_asignar: 'Por asignar',
  asignada: 'Asignada',
  anticipo_pagado: 'Anticipo pagado',
  en_declaracion: 'En declaración',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
};

const STAGE_COLORS: Record<string, string> = {
  nuevo: 'rgba(255,200,60,0.15)',
  por_asignar: 'rgba(120,160,255,0.15)',
  asignada: 'rgba(61,107,255,0.15)',
  anticipo_pagado: 'rgba(78,214,161,0.15)',
  en_declaracion: 'rgba(200,120,255,0.15)',
  entregada: 'rgba(78,214,161,0.25)',
  cancelada: 'rgba(255,80,80,0.15)',
};

const STAGE_TEXT: Record<string, string> = {
  nuevo: '#FFC83C',
  por_asignar: '#90B0FF',
  asignada: '#7DD3FC',
  anticipo_pagado: '#4ED6A1',
  en_declaracion: '#D48AFF',
  entregada: '#4ED6A1',
  cancelada: '#FF8080',
};

/* ── Commission Bar Component ──────────────────────────────────────── */
function CommissionBar({ amount, settings, hasRef, hasVend }: { amount: number; settings: AppSettings; hasRef: boolean; hasVend: boolean }) {
  const b = calcCommissions(amount, settings, hasRef, hasVend);
  const bars = [
    { label: 'Contador', pct: b.pct_contador, color: '#4ED6A1', amt: b.contador },
    { label: 'Referido', pct: b.pct_referido, color: '#F0A63C', amt: b.referido },
    { label: 'Vendedor', pct: b.pct_vendedor, color: '#7DD3FC', amt: b.vendedor },
    { label: 'Desarrollo', pct: b.pct_desarrollo, color: '#A78BFA', amt: b.desarrollo },
    { label: 'Plataforma', pct: b.pct_plataforma, color: 'rgba(255,255,255,0.2)', amt: b.plataforma },
  ].filter((x) => x.pct > 0);

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', height: 24, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        {bars.map((bar) => (
          <div
            key={bar.label}
            title={`${bar.label}: ${bar.pct}% = ${formatCOP(bar.amt)}`}
            style={{ width: `${Math.max(bar.pct, 0)}%`, background: bar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: 'var(--mono)', color: '#000', fontWeight: 700, overflow: 'hidden' }}
          >
            {bar.pct >= 10 ? `${bar.pct}%` : ''}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
        {bars.map((bar) => (
          <span key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'var(--mono)', color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: bar.color, display: 'inline-block' }} />
            {bar.label} {formatCOP(bar.amt)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */
type Tab = 'pipeline' | 'solicitudes' | 'comisiones' | 'ajustes';

export default function AdminPipelinePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('pipeline');
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Pipeline leads
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editingLead, setEditingLead] = useState<PipelineLead | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editStage, setEditStage] = useState<Stage>('nuevo');
  const [editContador, setEditContador] = useState('');

  // Solicitudes
  const [requests, setRequests] = useState<LeadRequest[]>([]);

  // Comisiones
  const [commissions, setCommissions] = useState<Commission[]>([]);

  // Ajustes
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ajustesSaving, setAjustesSaving] = useState(false);

  // Autenticacion
  const [userId, setUserId] = useState('');

  useEffect(() => {
    fetch('/api/erp/me')
      .then((r) => {
        if (!r.ok) throw new Error('Unauth');
        return r.json();
      })
      .then((json) => {
        const u = json?.data;
        if (!u || (u.rol !== 'admin' && u.rol !== 'desarrollador')) {
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

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async (t: Tab = tab) => {
    setLoading(true);
    setLoadMsg('Cargando...');
    try {
      if (t === 'pipeline') {
        const [rLeads, rUsers] = await Promise.all([fetch('/api/pipeline'), fetch('/api/admin/usuarios')]);
        const dLeads = await rLeads.json();
        const dUsers = await rUsers.json();
        setLeads(dLeads.leads || []);
        setUsuarios((dUsers.usuarios || []).filter((u: Usuario) => u.rol === 'contador'));
      } else if (t === 'solicitudes') {
        const r = await fetch('/api/solicitudes');
        const d = await r.json();
        setRequests(d.requests || []);
      } else if (t === 'comisiones') {
        const r = await fetch('/api/comisiones');
        const d = await r.json();
        setCommissions(d.commissions || []);
      } else if (t === 'ajustes') {
        const r = await fetch('/api/ajustes');
        const d = await r.json();
        if (d.settings) setSettings(d.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(tab); }, [tab]);

  // ── Pipeline handlers
  const openEditLead = (lead: PipelineLead) => {
    setEditingLead(lead);
    setEditAmount(lead.declaration_amount?.toString() || '');
    setEditStage(lead.stage);
    setEditContador(lead.assigned_contador?.id || '');
  };

  const saveLead = async () => {
    if (!editingLead) return;
    setLoading(true);
    try {
      await fetch('/api/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLead.id,
          stage: editStage,
          declaration_amount: editAmount ? Number(editAmount) : null,
          assigned_contador_id: editContador || null,
        }),
      });
      setEditingLead(null);
      showToast('Lead actualizado ✓');
      await load('pipeline');
    } catch {
      showToast('Error al guardar', false);
      setLoading(false);
    }
  };

  // ── Solicitudes handlers
  const resolveRequest = async (id: string, status: 'aprobada' | 'rechazada') => {
    setLoading(true);
    try {
      await fetch('/api/solicitudes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, resolved_by: userId }),
      });
      showToast(status === 'aprobada' ? 'Solicitud aprobada ✓' : 'Solicitud rechazada');
      await load('solicitudes');
    } catch {
      showToast('Error', false);
      setLoading(false);
    }
  };

  // ── Comisiones handlers
  const markPaid = async (id: string) => {
    setLoading(true);
    try {
      await fetch('/api/comisiones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'pagada' }),
      });
      showToast('Comisión marcada como pagada ✓');
      await load('comisiones');
    } catch {
      showToast('Error', false);
      setLoading(false);
    }
  };

  // ── Ajustes handler
  const saveSettings = async () => {
    setAjustesSaving(true);
    try {
      await fetch('/api/ajustes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      showToast('Ajustes guardados ✓');
    } catch {
      showToast('Error al guardar', false);
    } finally {
      setAjustesSaving(false);
    }
  };

  const previewSettings = calcCommissions(400000, settings, true, true);
  const totalPct = settings.pct_contador + settings.pct_vendedor + settings.pct_desarrollo + settings.pct_ref_bajo;

  /* ── Render ───────────────────────────────────────────────────────── */
  const bg = '#000';
  const border = 'rgba(255,255,255,0.08)';
  const cardBg = 'rgba(255,255,255,0.04)';
  const sub = 'rgba(255,255,255,0.45)';

  const navBtn = (t: Tab, label: string, count?: number) => (
    <button
      onClick={() => setTab(t)}
      style={{
        padding: '10px 16px', borderRadius: 10, fontFamily: 'var(--mono)', fontSize: 11,
        letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .2s',
        display: 'flex', alignItems: 'center', gap: 8,
        background: tab === t ? 'rgba(61,107,255,0.18)' : 'transparent',
        border: tab === t ? '1px solid rgba(61,107,255,0.5)' : '1px solid transparent',
        color: tab === t ? '#fff' : sub,
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 999, padding: '1px 6px', fontSize: 10 }}>{count}</span>
      )}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#fff', fontFamily: 'var(--body)', padding: 0 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          background: toast.ok ? 'rgba(78,214,161,0.15)' : 'rgba(255,80,80,0.15)',
          border: `1px solid ${toast.ok ? 'rgba(78,214,161,0.5)' : 'rgba(255,80,80,0.5)'}`,
          borderRadius: 12, padding: '12px 20px', backdropFilter: 'blur(16px)',
          fontFamily: 'var(--mono)', fontSize: 12, color: toast.ok ? '#4ED6A1' : '#FF8080',
          animation: 'popIn .3s cubic-bezier(.34,1.42,.5,1) both',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 998,
          background: 'rgba(10,10,14,0.9)', border: '1px solid rgba(61,107,255,0.4)',
          borderRadius: 999, padding: '10px 20px', backdropFilter: 'blur(16px)',
          fontFamily: 'var(--mono)', fontSize: 11, color: '#7DD3FC', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 14, height: 14, border: '2px solid rgba(61,107,255,0.3)', borderTopColor: '#3D6BFF', borderRadius: '50%', animation: 'spinLoading .75s linear infinite' }} />
          {loadMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, letterSpacing: '-.03em' }}>
            STAKEHOLDERS<span style={{ color: '#3D6BFF' }}>.</span>
          </span>
          <nav style={{ display: 'flex', gap: 6 }}>
            {navBtn('pipeline', 'Pipeline', leads.length)}
            {navBtn('solicitudes', 'Solicitudes', requests.filter(r => r.status === 'pendiente').length)}
            {navBtn('comisiones', 'Comisiones', commissions.filter(c => c.status === 'por_pagar').length)}
            {navBtn('ajustes', 'Ajustes')}
          </nav>
        </div>
        <button
          onClick={() => router.push('/admin/dashboard')}
          style={{ fontFamily: 'var(--mono)', fontSize: 11, color: sub, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '.12em' }}
        >
          ← CRM
        </button>
      </div>

      <div style={{ padding: '28px clamp(16px,4vw,40px)' }}>

        {/* ── PIPELINE TAB ── */}
        {tab === 'pipeline' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF' }}>Gestión de Clientes</span>
              <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.1rem)', margin: '4px 0 0', letterSpacing: '-.04em' }}>Pipeline de Clientes</h1>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}`, background: 'rgba(255,255,255,0.03)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: sub }}>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Cliente</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Fuente</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Stage</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Valor declaración</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Contador</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Reparto</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: sub }}>Sin clientes en el pipeline.</td></tr>
                    )}
                    {leads.map((lead) => (
                      <tr key={lead.id} style={{ borderBottom: `1px solid ${border}`, transition: 'background .15s' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontWeight: 600, display: 'block' }}>{lead.full_name}</span>
                          <span style={{ fontSize: 11, color: sub, fontFamily: 'var(--mono)' }}>{lead.email || lead.phone || '—'}</span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', fontFamily: 'var(--mono)', fontSize: 11, color: sub }}>{lead.source}</span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 8, background: STAGE_COLORS[lead.stage] || 'rgba(255,255,255,0.08)', color: STAGE_TEXT[lead.stage] || '#fff', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600 }}>
                            {STAGE_LABELS[lead.stage] || lead.stage}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700 }}>
                          {lead.declaration_amount ? formatCOP(lead.declaration_amount) : <span style={{ color: sub }}>Sin definir</span>}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {lead.assigned_contador ? (
                            <span style={{ fontSize: 12 }}>{lead.assigned_contador.nombre}</span>
                          ) : (
                            <span style={{ color: sub, fontSize: 12 }}>Sin asignar</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', maxWidth: 200 }}>
                          {lead.declaration_amount ? (
                            <CommissionBar amount={lead.declaration_amount} settings={settings} hasRef={!!lead.referrer} hasVend={!!lead.seller} />
                          ) : <span style={{ color: sub, fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            onClick={() => openEditLead(lead)}
                            style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(61,107,255,0.15)', border: '1px solid rgba(61,107,255,0.35)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── SOLICITUDES TAB ── */}
        {tab === 'solicitudes' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF' }}>Contadores</span>
              <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.1rem)', margin: '4px 0 0', letterSpacing: '-.04em' }}>Solicitudes de Lead</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {requests.length === 0 && (
                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 40, textAlign: 'center', color: sub }}>Sin solicitudes pendientes.</div>
              )}
              {requests.map((req) => (
                <div key={req.id} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <span style={{ fontWeight: 600, display: 'block' }}>{req.pipeline_lead?.full_name || '—'}</span>
                    <span style={{ fontSize: 12, color: sub }}>Solicitado por <strong style={{ color: '#7DD3FC' }}>{req.contador?.nombre}</strong></span>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
                    background: req.status === 'pendiente' ? 'rgba(255,200,60,0.15)' : req.status === 'aprobada' ? 'rgba(78,214,161,0.15)' : 'rgba(255,80,80,0.15)',
                    color: req.status === 'pendiente' ? '#FFC83C' : req.status === 'aprobada' ? '#4ED6A1' : '#FF8080',
                  }}>
                    {req.status}
                  </span>
                  <span style={{ fontSize: 11, color: sub, fontFamily: 'var(--mono)' }}>{new Date(req.requested_at).toLocaleDateString('es-CO')}</span>
                  {req.status === 'pendiente' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => resolveRequest(req.id, 'aprobada')}
                        style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(78,214,161,0.15)', border: '1px solid rgba(78,214,161,0.4)', color: '#4ED6A1', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>
                        Aprobar ✓
                      </button>
                      <button onClick={() => resolveRequest(req.id, 'rechazada')}
                        style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', color: '#FF8080', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── COMISIONES TAB ── */}
        {tab === 'comisiones' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF' }}>Cola de Pagos</span>
              <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.1rem)', margin: '4px 0 0', letterSpacing: '-.04em' }}>Comisiones</h1>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}`, background: 'rgba(255,255,255,0.03)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: sub }}>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Beneficiario</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Rol</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Cliente</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Base</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>%</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Monto</th>
                      <th style={{ padding: '14px 18px', textAlign: 'left' }}>Estado</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.length === 0 && (
                      <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: sub }}>Sin comisiones generadas.</td></tr>
                    )}
                    {commissions.map((c) => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${border}` }}>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontWeight: 600, display: 'block' }}>{c.beneficiary?.nombre || '—'}</span>
                          <span style={{ fontSize: 11, color: sub, fontFamily: 'var(--mono)' }}>{c.beneficiary?.email}</span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(61,107,255,0.12)', border: '1px solid rgba(61,107,255,0.3)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 11 }}>{c.role}</span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 12 }}>{c.pipeline_lead?.full_name || '—'}</td>
                        <td style={{ padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: 12 }}>{formatCOP(c.base_amount)}</td>
                        <td style={{ padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: 12 }}>{c.pct}%</td>
                        <td style={{ padding: '14px 18px', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, color: '#4ED6A1' }}>{formatCOP(c.amount)}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 11,
                            background: c.status === 'por_pagar' ? 'rgba(255,200,60,0.15)' : 'rgba(78,214,161,0.15)',
                            color: c.status === 'por_pagar' ? '#FFC83C' : '#4ED6A1',
                          }}>
                            {c.status === 'por_pagar' ? 'Por pagar' : 'Pagada'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          {c.status === 'por_pagar' && (
                            <button onClick={() => markPaid(c.id)}
                              style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(78,214,161,0.15)', border: '1px solid rgba(78,214,161,0.4)', color: '#4ED6A1', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}>
                              Marcar pagada ✓
                            </button>
                          )}
                          {c.status === 'pagada' && (
                            <span style={{ fontSize: 11, color: sub, fontFamily: 'var(--mono)' }}>{c.paid_at ? new Date(c.paid_at).toLocaleDateString('es-CO') : '—'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── AJUSTES TAB ── */}
        {tab === 'ajustes' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF' }}>Motor de Comisiones</span>
              <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.1rem)', margin: '4px 0 0', letterSpacing: '-.04em' }}>Ajustes de Porcentajes</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,480px) 1fr', gap: 24, alignItems: 'start' }}>
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: '1.1rem', margin: '0 0 20px', letterSpacing: '-.02em' }}>Parámetros del reparto</h3>

                {[
                  { key: 'tope', label: 'Tope del referido ($)', prefix: '$' },
                  { key: 'pct_contador', label: 'Contador — base (%)', suffix: '%' },
                  { key: 'pct_vendedor', label: 'Vendedor (%)', suffix: '%' },
                  { key: 'pct_desarrollo', label: 'Desarrollo (%)', suffix: '%' },
                  { key: 'pct_ref_bajo', label: 'Referido bajo el tope (%)', suffix: '%' },
                  { key: 'pct_ref_sobre', label: 'Referido sobre el tope (%)', suffix: '%' },
                ].map(({ key, label, prefix, suffix }) => (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: sub, marginBottom: 6 }}>{label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
                      {prefix && <span style={{ padding: '10px 12px', fontFamily: 'var(--mono)', color: sub, fontSize: 13 }}>{prefix}</span>}
                      <input
                        type="number"
                        value={(settings as any)[key]}
                        onChange={(e) => setSettings({ ...settings, [key]: Number(e.target.value) })}
                        style={{ flex: 1, border: 0, outline: 0, background: 'transparent', padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 15, color: '#fff' }}
                      />
                      {suffix && <span style={{ padding: '10px 12px', fontFamily: 'var(--mono)', color: sub, fontSize: 13 }}>{suffix}</span>}
                    </div>
                  </div>
                ))}

                {totalPct > 95 && (
                  <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#FF8080' }}>
                    ⚠️ Los porcentajes base suman {totalPct}%, verificar que el total no supere 100%.
                  </div>
                )}

                <button
                  onClick={saveSettings}
                  disabled={ajustesSaving}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(61,107,255,0.2)', border: '1px solid rgba(61,107,255,0.5)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '.1em', cursor: 'pointer', transition: 'all .2s' }}
                >
                  {ajustesSaving ? 'Guardando...' : 'Guardar Ajustes'}
                </button>
              </div>

              {/* Previsualización */}
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: '1.1rem', margin: '0 0 6px', letterSpacing: '-.02em' }}>Previsualización</h3>
                <p style={{ fontSize: 12, color: sub, margin: '0 0 20px' }}>Ejemplo con declaración de {formatCOP(400000)}, referido + vendedor activos</p>
                <CommissionBar amount={400000} settings={settings} hasRef={true} hasVend={true} />

                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Contador', val: previewSettings.contador, pct: previewSettings.pct_contador, color: '#4ED6A1' },
                    { label: 'Referido', val: previewSettings.referido, pct: previewSettings.pct_referido, color: '#F0A63C' },
                    { label: 'Vendedor', val: previewSettings.vendedor, pct: previewSettings.pct_vendedor, color: '#7DD3FC' },
                    { label: 'Desarrollo', val: previewSettings.desarrollo, pct: previewSettings.pct_desarrollo, color: '#A78BFA' },
                    { label: 'Plataforma', val: previewSettings.plataforma, pct: previewSettings.pct_plataforma, color: 'rgba(255,255,255,0.3)' },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: row.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13 }}>{row.label}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: sub }}>{row.pct}%</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: row.color, width: 100, textAlign: 'right' }}>{formatCOP(row.val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Lead Modal */}
      {editingLead && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }} onClick={() => setEditingLead(null)} />
          <div style={{ position: 'relative', width: 'min(100%,480px)', background: '#101014', border: `1px solid ${border}`, borderRadius: 24, padding: 28, zIndex: 1, animation: 'sheetin .4s cubic-bezier(.34,1.42,.5,1) both' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.4rem', margin: '0 0 20px', letterSpacing: '-.03em' }}>Editar: {editingLead.full_name}</h3>

            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: sub, marginBottom: 6 }}>Stage</span>
              <select value={editStage} onChange={(e) => setEditStage(e.target.value as Stage)}
                style={{ width: '100%', background: '#000', border: `1px solid ${border}`, borderRadius: 10, color: '#fff', padding: '11px 13px', fontFamily: 'var(--body)', fontSize: 14, outline: 'none' }}>
                {Object.entries(STAGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: sub, marginBottom: 6 }}>Valor de la declaración ($)</span>
              <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} placeholder="Ej. 450000"
                style={{ width: '100%', background: '#000', border: `1px solid ${border}`, borderRadius: 10, color: '#fff', padding: '11px 13px', fontFamily: 'var(--mono)', fontSize: 14, outline: 'none' }} />
              <span style={{ fontSize: 11, color: sub, marginTop: 4, display: 'block' }}>La consultoría de $100k va aparte y no se incluye aquí.</span>
            </label>

            <label style={{ display: 'block', marginBottom: 20 }}>
              <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: sub, marginBottom: 6 }}>Asignar Contador</span>
              <select value={editContador} onChange={(e) => setEditContador(e.target.value)}
                style={{ width: '100%', background: '#000', border: `1px solid ${border}`, borderRadius: 10, color: '#fff', padding: '11px 13px', fontFamily: 'var(--body)', fontSize: 14, outline: 'none' }}>
                <option value="">Sin asignar</option>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </label>

            {editAmount && Number(editAmount) > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: sub, margin: '0 0 8px', fontFamily: 'var(--mono)' }}>Previsualización del reparto:</p>
                <CommissionBar amount={Number(editAmount)} settings={settings} hasRef={!!editingLead.referrer} hasVend={!!editingLead.seller} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveLead} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(61,107,255,0.2)', border: '1px solid rgba(61,107,255,0.5)', color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer' }}>
                Guardar Cambios
              </button>
              <button onClick={() => setEditingLead(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'transparent', border: `1px solid ${border}`, color: sub, fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
