'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, qs, useData, useDebounced, type Lead, type RentaLead, type Usuario } from '../api';
import { useToast } from '../toast';
import {
  Badge, Btn, C, Card, CardHeader, ErrorMsg, Field, FilterSelect, Grid, Input, Modal, Mono, SERVICIOS, Search, Select,
  Strong, Table, TextArea, Toolbar, TrashIcon, cop, descargarCSV, fecha, useInputStyle, useT, type Tone,
} from '../ui';

const ESTADOS: Array<[Lead['estado'], string, Tone]> = [
  ['nuevo', 'Nuevo', 'sky'], ['contactado', 'Contactado', 'blue'], ['propuesta', 'Propuesta', 'yellow'],
  ['ganado', 'Ganado', 'green'], ['perdido', 'Perdido', 'gray'],
];
const ORIGEN: Record<string, string> = { manual: 'Manual', web: 'Sitio web', referido: 'Referido', renta_test: 'Test de renta', whatsapp: 'WhatsApp', otro: 'Otro' };

const waLink = (tel: string) => `https://wa.me/${tel.replace(/\D/g, '').replace(/^(?!57)(\d{10})$/, '57$1')}`;

export default function LeadsPanel({ esAdmin, puedeClientes }: { esAdmin: boolean; puedeClientes: boolean }) {
  const [vista, setVista] = useState<'crm' | 'renta'>('crm');
  const t = useT();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn small variant={vista === 'crm' ? 'link' : 'ghost'} onClick={() => setVista('crm')}>Embudo comercial</Btn>
        <Btn small variant={vista === 'renta' ? 'link' : 'ghost'} onClick={() => setVista('renta')}>Leads del test de renta</Btn>
        <span style={{ fontSize: 11, color: t.subtext, alignSelf: 'center', marginLeft: 8 }}>
          {vista === 'crm' ? 'Prospectos de todos los servicios. Los formularios del sitio llegan aquí.' : 'Personas que hicieron el test en /renta. Impórtalas como clientes.'}
        </span>
      </div>
      {vista === 'crm' ? <EmbudoCRM esAdmin={esAdmin} puedeClientes={puedeClientes} /> : <LeadsRenta puedeClientes={puedeClientes} />}
    </div>
  );
}

/* ============================================================ */
function EmbudoCRM({ esAdmin, puedeClientes }: { esAdmin: boolean; puedeClientes: boolean }) {
  const t = useT();
  const notify = useToast();
  const sel = useInputStyle();
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('todos');
  const [servicio, setServicio] = useState('todos');
  const [editar, setEditar] = useState<Lead | 'nuevo' | null>(null);
  const [convertir, setConvertir] = useState<Lead | null>(null);
  const dq = useDebounced(q);
  const { data, loading, error, reload, setData } = useData<Lead[]>(`/api/erp/leads${qs({ q: dq, servicio })}`, []);
  const { data: usuarios } = useData<Usuario[]>(esAdmin ? '/api/erp/usuarios' : null, []);

  const conteo = useMemo(() => {
    const m: Record<string, { n: number; v: number }> = {};
    for (const [e] of ESTADOS) m[e] = { n: 0, v: 0 };
    for (const l of data) { m[l.estado].n++; m[l.estado].v += Number(l.valor_estimado || 0); }
    return m;
  }, [data]);
  const filas = estado === 'todos' ? data : data.filter((l) => l.estado === estado);

  const cambiarEstado = async (l: Lead, nuevo: string) => {
    setData((x) => x.map((y) => (y.id === l.id ? { ...y, estado: nuevo as Lead['estado'] } : y)));
    try { await api('/api/erp/leads', { method: 'PATCH', body: { id: l.id, estado: nuevo } }); }
    catch (e) { notify((e as Error).message, 'error'); reload(); }
  };
  const eliminar = async (l: Lead) => {
    if (!confirm(`¿Eliminar el lead "${l.nombre}"?`)) return;
    try { await api('/api/erp/leads', { method: 'DELETE', body: { id: l.id } }); notify('Lead eliminado'); reload(); }
    catch (e) { notify((e as Error).message, 'error'); }
  };

  const exportar = () => descargarCSV(`leads-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Fecha', 'Nombre', 'Empresa', 'Correo', 'Teléfono', 'Servicio', 'Origen', 'Estado', 'Valor estimado', 'Mensaje'],
    filas.map((l) => [l.created_at.slice(0, 10), l.nombre, l.empresa, l.email, l.telefono, SERVICIOS[l.servicio], ORIGEN[l.origen], l.estado, l.valor_estimado, l.mensaje]));

  return (
    <>
      {/* Pipeline: contadores por etapa (clic = filtrar) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {ESTADOS.map(([e, label, tone]) => {
          const on = estado === e;
          const color = tone === 'green' ? t.green : tone === 'yellow' ? t.amber : tone === 'gray' ? t.subtext : t.sky;
          return (
            <button key={e} onClick={() => setEstado(on ? 'todos' : e)} style={{
              textAlign: 'left', background: on ? 'rgba(61,107,255,0.14)' : t.cardBg, border: `1px solid ${on ? 'rgba(61,107,255,0.5)' : t.border}`,
              borderRadius: 16, padding: '14px 16px', cursor: 'pointer', color: t.text, backdropFilter: 'blur(20px)', transition: 'all .2s',
            }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: t.subtext, textTransform: 'uppercase', letterSpacing: '.12em' }}>{label}</span>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--mono)', color, marginTop: 2 }}>{conteo[e].n}</div>
              <span style={{ fontSize: 11, color: t.subtext, fontFamily: 'var(--mono)' }}>{conteo[e].v ? cop(conteo[e].v) : '—'}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader
          title={estado === 'todos' ? 'Todos los leads' : `Leads · ${ESTADOS.find((x) => x[0] === estado)?.[1]}`}
          right={
            <Toolbar>
              <Search value={q} onChange={setQ} placeholder="Nombre, empresa, contacto…" />
              <FilterSelect value={servicio} onChange={setServicio} options={[['todos', 'Todos los servicios'], ...Object.entries(SERVICIOS)] as Array<[string, string]>} />
              <Btn small variant="ghost" onClick={exportar}>CSV ↓</Btn>
              <Btn variant="primary" onClick={() => setEditar('nuevo')}>+ Nuevo lead</Btn>
            </Toolbar>
          }
        />
        {error && <div style={{ padding: 16 }}><ErrorMsg>{error}</ErrorMsg></div>}
        <Table<Lead>
          rows={filas} rowKey={(l) => l.id}
          empty={loading ? 'Cargando…' : 'Sin leads. Los formularios de Contabilidad, Nómina y Servicio personalizado crean leads aquí.'}
          cols={[
            { key: 'n', label: 'Persona / Empresa', render: (l) => <Strong sub={l.empresa || fecha(l.created_at)}>{l.nombre}</Strong> },
            { key: 's', label: 'Servicio', render: (l) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                <Badge tone="blue">{SERVICIOS[l.servicio]}</Badge>
                <span style={{ fontSize: 11, color: t.subtext }}>{ORIGEN[l.origen]}</span>
              </div>
            ) },
            { key: 'e', label: 'Etapa', render: (l) => (
              <select value={l.estado} onChange={(e) => cambiarEstado(l, e.target.value)} onClick={(e) => e.stopPropagation()}
                style={{ ...sel, width: 'auto', padding: '6px 10px', fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600,
                  background: l.estado === 'ganado' ? 'rgba(78,214,161,0.15)' : l.estado === 'perdido' ? t.softBg : 'rgba(61,107,255,0.12)',
                  border: `1px solid ${l.estado === 'ganado' ? 'rgba(78,214,161,0.4)' : 'rgba(61,107,255,0.3)'}`,
                  color: l.estado === 'ganado' ? t.green : l.estado === 'perdido' ? t.subtext : t.sky }}>
                {ESTADOS.map(([v, lab]) => <option key={v} value={v} style={{ background: t.modalBg, color: t.text }}>{lab}</option>)}
              </select>
            ) },
            { key: 'c', label: 'Contacto', render: (l) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {l.telefono ? <a href={waLink(l.telefono)} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: t.green }}>{l.telefono} ↗</a> : <Mono color={t.subtext}>—</Mono>}
                <span style={{ fontSize: 11, color: t.subtext }}>{l.email || ''}</span>
              </div>
            ) },
            { key: 'v', label: 'Valor est.', align: 'right', render: (l) => <Mono color={l.valor_estimado ? t.text : t.subtext}>{l.valor_estimado ? cop(l.valor_estimado) : '—'}</Mono> },
            { key: 'r', label: 'Responsable', render: (l) => <span style={{ fontSize: 12, color: t.subtext }}>{l.responsable?.nombre || '—'}</span> },
            { key: 'a', label: 'Acciones', align: 'right', render: (l) => (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {l.cliente
                  ? <Badge tone="green">Cliente ✓</Badge>
                  : puedeClientes && <Btn small variant="link" onClick={() => setConvertir(l)}>→ Cliente</Btn>}
                <Btn small variant="soft" onClick={() => setEditar(l)}>Editar</Btn>
                {esAdmin && <Btn small variant="danger" onClick={() => eliminar(l)} title="Eliminar"><TrashIcon /></Btn>}
              </div>
            ) },
          ]}
        />
      </Card>

      <LeadModal lead={editar} usuarios={usuarios} esAdmin={esAdmin} onClose={() => setEditar(null)} onSaved={() => { setEditar(null); reload(); }} />
      <ConvertirModal
        open={Boolean(convertir)} onClose={() => setConvertir(null)}
        prefill={convertir ? { nombre: convertir.nombre, email: convertir.email || '', telefono: convertir.telefono || '', nombre_comercial: convertir.empresa || '' } : null}
        body={convertir ? { lead_id: convertir.id } : {}}
        onDone={() => { setConvertir(null); reload(); }}
      />
    </>
  );
}

/* ============================================================ */
function LeadsRenta({ puedeClientes }: { puedeClientes: boolean }) {
  const t = useT();
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [convertir, setConvertir] = useState<RentaLead | null>(null);
  const { data, loading, error, reload } = useData<RentaLead[]>('/api/erp/leads/renta', []);
  const filas = data.filter((l) => {
    if (filtro === 'pagados' && !l.pagado) return false;
    if (filtro === 'declaran' && !l.debe_declarar) return false;
    if (filtro === 'sin_importar' && l.cliente_id) return false;
    if (q) {
      const s = q.toLowerCase();
      return l.nombre.toLowerCase().includes(s) || l.cedula?.includes(s) || (l.celular || '').includes(s);
    }
    return true;
  });
  return (
    <Card>
      <CardHeader
        title={`Test de renta · ${data.length} registros`}
        right={<Toolbar>
          <Search value={q} onChange={setQ} placeholder="Nombre, cédula, celular…" />
          <FilterSelect value={filtro} onChange={setFiltro} options={[['todos', 'Todos'], ['pagados', 'Pagaron consulta'], ['declaran', 'Deben declarar'], ['sin_importar', 'Sin importar']]} />
        </Toolbar>}
      />
      {error && <div style={{ padding: 16 }}><ErrorMsg>{error}</ErrorMsg></div>}
      <Table<RentaLead>
        rows={filas} rowKey={(l) => l.id} empty={loading ? 'Cargando…' : 'Sin registros.'}
        cols={[
          { key: 'n', label: 'Persona / Cédula', render: (l) => <Strong sub={`C.C. ${l.cedula}`}>{l.nombre}</Strong> },
          { key: 'a', label: 'Arquetipo', render: (l) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Badge tone="blue">{l.arquetipos?.nombre || 'General'}</Badge>
              <span style={{ fontSize: 11, fontWeight: 600, color: l.debe_declarar ? t.danger : t.green }}>{l.debe_declarar ? 'DECLARA RENTA' : 'NO DECLARA'}</span>
            </div>
          ) },
          { key: 'c', label: 'Contacto', render: (l) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {l.celular ? <a href={waLink(l.celular)} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: t.green }}>{l.celular} ↗</a> : <Mono color={t.subtext}>—</Mono>}
              <span style={{ fontSize: 11, color: t.subtext }}>{l.correo || ''}</span>
            </div>
          ) },
          { key: 'p', label: 'Pago', render: (l) => l.pagado ? <Badge tone="green">Pagado</Badge> : <Badge tone="gray">Sin pago</Badge> },
          { key: 'f', label: 'Fecha', render: (l) => <Mono color={t.subtext}>{fecha(l.created_at)}</Mono> },
          { key: 'x', label: 'Acciones', align: 'right', render: (l) => l.cliente_id
              ? <Badge tone="green">Cliente ✓</Badge>
              : puedeClientes ? <Btn small variant="link" onClick={() => setConvertir(l)}>Importar como cliente</Btn> : null },
        ]}
      />
      <ConvertirModal
        open={Boolean(convertir)} onClose={() => setConvertir(null)}
        prefill={convertir ? { nombre: convertir.nombre, email: convertir.correo || '', telefono: convertir.celular || '', numero_documento: convertir.cedula || '', tipo_documento: 'CC' } : null}
        body={convertir ? { renta_lead_id: convertir.id } : {}}
        onDone={() => { setConvertir(null); reload(); }}
      />
    </Card>
  );
}

/* ── Crear / editar lead ─────────────────────────────────── */
function LeadModal({ lead, usuarios, esAdmin, onClose, onSaved }: {
  lead: Lead | 'nuevo' | null; usuarios: Usuario[]; esAdmin: boolean; onClose: () => void; onSaved: () => void;
}) {
  const notify = useToast();
  const [f, setF] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const editando = lead && lead !== 'nuevo' ? lead : null;

  useEffect(() => {
    if (!lead) return;
    setErr('');
    const l = lead === 'nuevo' ? null : lead;
    setF({
      nombre: l?.nombre || '', empresa: l?.empresa || '', email: l?.email || '', telefono: l?.telefono || '',
      servicio: l?.servicio || 'contabilidad', origen: l?.origen || 'manual', estado: l?.estado || 'nuevo',
      valor_estimado: l?.valor_estimado != null ? String(l.valor_estimado) : '', mensaje: l?.mensaje || '', notas: l?.notas || '',
      responsable_id: l?.responsable_id || '',
    });
  }, [lead]);

  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const guardar = async () => {
    if (!f.nombre?.trim()) { setErr('El nombre es obligatorio'); return; }
    setSaving(true); setErr('');
    try {
      const body = { ...f, valor_estimado: f.valor_estimado === '' ? null : Number(f.valor_estimado) };
      await api('/api/erp/leads', { method: editando ? 'PATCH' : 'POST', body: editando ? { ...body, id: editando.id } : body });
      notify(editando ? 'Lead actualizado' : 'Lead creado');
      onSaved();
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={Boolean(lead)} onClose={onClose} width={620} eyebrow="CRM" title={editando ? 'Editar lead' : 'Nuevo lead'}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn variant="primary" onClick={guardar} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Btn></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ErrorMsg>{err}</ErrorMsg>
        <Grid>
          <Field label="Nombre"><Input value={f.nombre || ''} onChange={(e) => set('nombre', e.target.value)} /></Field>
          <Field label="Empresa"><Input value={f.empresa || ''} onChange={(e) => set('empresa', e.target.value)} /></Field>
          <Field label="Correo"><Input type="email" value={f.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Teléfono"><Input value={f.telefono || ''} onChange={(e) => set('telefono', e.target.value)} /></Field>
          <Field label="Servicio de interés"><Select value={f.servicio || 'otro'} onChange={(e) => set('servicio', e.target.value)} options={Object.entries(SERVICIOS) as Array<[string, string]>} /></Field>
          <Field label="Origen"><Select value={f.origen || 'manual'} onChange={(e) => set('origen', e.target.value)} options={Object.entries(ORIGEN) as Array<[string, string]>} /></Field>
          <Field label="Etapa"><Select value={f.estado || 'nuevo'} onChange={(e) => set('estado', e.target.value)} options={ESTADOS.map(([v, l]) => [v, l] as [string, string])} /></Field>
          <Field label="Valor estimado (COP)"><Input type="number" min={0} value={f.valor_estimado || ''} onChange={(e) => set('valor_estimado', e.target.value)} /></Field>
          {esAdmin && (
            <Field label="Responsable" span={2}>
              <Select value={f.responsable_id || ''} onChange={(e) => set('responsable_id', e.target.value)}
                options={[['', 'Sin asignar'], ...usuarios.filter((u) => u.activo).map((u) => [u.id, `${u.nombre} · ${u.rol}`] as [string, string])]} />
            </Field>
          )}
          {editando?.mensaje && <Field label="Mensaje del formulario" span={2}><TextArea value={f.mensaje || ''} readOnly rows={3} /></Field>}
          <Field label="Notas internas" span={2}><TextArea value={f.notas || ''} onChange={(e) => set('notas', e.target.value)} /></Field>
        </Grid>
      </div>
    </Modal>
  );
}

/* ── Convertir en cliente ────────────────────────────────── */
function ConvertirModal({ open, prefill, body, onClose, onDone }: {
  open: boolean; prefill: Record<string, string> | null; body: Record<string, string>; onClose: () => void; onDone: () => void;
}) {
  const notify = useToast();
  const [f, setF] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr('');
    setF({ tipo_persona: 'natural', tipo_documento: 'CC', numero_documento: '', ciudad: '', ...(prefill || {}) });
  }, [open, prefill]);

  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const guardar = async () => {
    setSaving(true); setErr('');
    try {
      const r = await api<{ yaExistia: boolean }>('/api/erp/leads/convertir', { method: 'POST', body: { ...body, cliente: f } });
      notify(r.yaExistia ? 'Ya existía un cliente con ese documento: quedó vinculado.' : 'Cliente creado y lead marcado como ganado');
      onDone();
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} width={560} eyebrow="Leads → Clientes" title="Convertir en cliente"
      footer={<><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn variant="primary" onClick={guardar} disabled={saving}>{saving ? 'Creando…' : 'Crear cliente'}</Btn></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ErrorMsg>{err}</ErrorMsg>
        <Grid>
          <Field label="Tipo de persona">
            <Select value={f.tipo_persona || 'natural'} onChange={(e) => { set('tipo_persona', e.target.value); set('tipo_documento', e.target.value === 'juridica' ? 'NIT' : 'CC'); }}
              options={[['natural', 'Persona natural'], ['juridica', 'Persona jurídica']]} />
          </Field>
          <Field label="Tipo de documento">
            <Select value={f.tipo_documento || 'CC'} onChange={(e) => set('tipo_documento', e.target.value)} options={[['CC', 'CC'], ['NIT', 'NIT'], ['CE', 'CE'], ['PAS', 'Pasaporte'], ['PPT', 'PPT']]} />
          </Field>
          <Field label="Número de documento"><Input value={f.numero_documento || ''} onChange={(e) => set('numero_documento', e.target.value)} style={{ fontFamily: 'var(--mono)' }} /></Field>
          <Field label={f.tipo_persona === 'juridica' ? 'Razón social' : 'Nombre'}><Input value={f.nombre || ''} onChange={(e) => set('nombre', e.target.value)} /></Field>
          <Field label="Correo"><Input value={f.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Teléfono"><Input value={f.telefono || ''} onChange={(e) => set('telefono', e.target.value)} /></Field>
          <Field label="Ciudad" span={2}><Input value={f.ciudad || ''} onChange={(e) => set('ciudad', e.target.value)} /></Field>
        </Grid>
      </div>
    </Modal>
  );
}
