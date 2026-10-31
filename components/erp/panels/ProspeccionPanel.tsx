'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, qs, useData, useDebounced, type BusquedaProspeccion, type Lead } from '../api';
import { useToast } from '../toast';
import {
  Badge, Btn, Card, CardHeader, ErrorMsg, Field, FilterSelect, Grid, Input, KV, Modal, Mono, SERVICIOS, Search,
  SectionLabel, Select, Strong, Table, TextArea, Toolbar, descargarCSV, fecha, useInputStyle, useT, type Tone,
} from '../ui';
import { CON_WEBSITE, ESTADOS_BUSQUEDA, FUENTES, TIPOS_SUGERIDOS, linkWhatsApp, type Fuente } from '@/lib/erp/prospeccion';

const CIUDADES = ['Medellín', 'Bogotá', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales',
  'Envigado', 'Itagüí', 'Sabaneta', 'Bello', 'Rionegro', 'Santa Marta', 'Cúcuta', 'Ibagué', 'Villavicencio', 'Armenia'];

const TONO_BUSQUEDA: Record<BusquedaProspeccion['estado'], Tone> = {
  pendiente: 'yellow', procesando: 'sky', completada: 'green', error: 'red', cancelada: 'gray',
};
const ESTADOS_LEAD: Array<[Lead['estado'], string]> = [
  ['nuevo', 'Nuevo'], ['contactado', 'Contactado'], ['propuesta', 'Propuesta'], ['ganado', 'Ganado'], ['perdido', 'Perdido'],
];
const NOMBRE_RED: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', tiktok: 'TikTok', x: 'X', youtube: 'YouTube',
};

const NOMBRE_FUENTE: Record<string, string> = { google_maps: 'Google Maps', directorio: 'Directorio', web: 'Sitio web' };

const redDe = (url?: string | null) => {
  if (!url) return null;
  const k = Object.keys(NOMBRE_RED).find((r) => url.includes(r === 'x' ? 'x.com' : `${r}.com`)) || (url.includes('twitter.com') ? 'x' : null);
  return k ? NOMBRE_RED[k] : 'Red';
};

export default function ProspeccionPanel({ esAdmin }: { esAdmin: boolean }) {
  const t = useT();
  const [nueva, setNueva] = useState(false);
  const [busqueda, setBusqueda] = useState('todas');
  const { data: busquedas, reload: recargarBusquedas } = useData<BusquedaProspeccion[]>('/api/erp/prospeccion', []);

  // Mientras haya búsquedas en cola, refrescar cada 15 s
  const activas = busquedas.some((b) => b.estado === 'pendiente' || b.estado === 'procesando');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!activas) return;
    const id = setInterval(() => { recargarBusquedas(); setTick((x) => x + 1); }, 15000);
    return () => clearInterval(id);
  }, [activas, recargarBusquedas]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card pad>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ fontWeight: 700, color: t.text, marginBottom: 4 }}>Encuentra empresas que necesitan un contador</div>
            <span style={{ fontSize: 12, color: t.subtext, lineHeight: 1.5 }}>
              Lanza una búsqueda por ciudad y tipo de negocio. Un proceso en segundo plano revisa Google Maps, directorios y los sitios web
              de las empresas, y deja aquí los contactos ordenados por puntaje. Arranca en segundos y una búsqueda de 20 leads tarda unos 3 minutos.
            </span>
          </div>
          <Btn variant="primary" onClick={() => setNueva(true)}>+ Nueva búsqueda</Btn>
        </div>
      </Card>

      <Busquedas busquedas={busquedas} onCambio={recargarBusquedas} onVer={(id) => setBusqueda(id)} />

      <LeadsProspectados busquedas={busquedas} busqueda={busqueda} setBusqueda={setBusqueda} esAdmin={esAdmin} refrescar={tick} />

      {nueva && <NuevaBusquedaModal onClose={() => setNueva(false)} onCreada={() => { setNueva(false); recargarBusquedas(); }} />}
    </div>
  );
}

/* ── Búsquedas lanzadas ─────────────────────────────────── */
function Busquedas({ busquedas, onCambio, onVer }: {
  busquedas: BusquedaProspeccion[]; onCambio: () => void; onVer: (id: string) => void;
}) {
  const t = useT();
  const notify = useToast();
  const accion = async (b: BusquedaProspeccion, accion: 'cancelar' | 'reintentar') => {
    try { await api(`/api/erp/prospeccion/${b.id}`, { method: 'PATCH', body: { accion } }); onCambio(); }
    catch (e) { notify((e as Error).message, 'error'); }
  };
  if (!busquedas.length) return null;
  return (
    <Card>
      <CardHeader title="Búsquedas" />
      <Table<BusquedaProspeccion>
        rows={busquedas.slice(0, 10)} rowKey={(b) => b.id}
        cols={[
          { key: 'q', label: 'Búsqueda', render: (b) => (
            <Strong sub={`${fecha(b.created_at)}${b.creador ? ` · ${b.creador.nombre}` : ''} · ${CON_WEBSITE[b.con_website]}`}>
              {b.tipo_negocio} · {b.ciudad}
            </Strong>
          ) },
          { key: 'e', label: 'Estado', render: (b) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <Badge tone={TONO_BUSQUEDA[b.estado]}>{ESTADOS_BUSQUEDA[b.estado]}</Badge>
              {b.error && <span style={{ fontSize: 11, color: t.subtext, maxWidth: 260 }} title={b.error}>{b.error.slice(0, 80)}{b.error.length > 80 ? '…' : ''}</span>}
            </div>
          ) },
          { key: 'n', label: 'Resultado', render: (b) => b.estado === 'completada' || b.total_nuevos > 0
              ? <span style={{ fontSize: 12 }}><Mono bold color={t.green}>{b.total_nuevos}</Mono> nuevos <span style={{ color: t.subtext }}>· {b.total_duplicados} ya estaban</span></span>
              : <Mono color={t.subtext}>—</Mono> },
          { key: 'a', label: '', align: 'right', render: (b) => (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              {b.total_nuevos > 0 && <Btn small variant="link" onClick={() => onVer(b.id)}>Ver leads</Btn>}
              {b.estado === 'pendiente' && <Btn small variant="ghost" onClick={() => accion(b, 'cancelar')}>Cancelar</Btn>}
              {(b.estado === 'error' || b.estado === 'cancelada') && <Btn small variant="soft" onClick={() => accion(b, 'reintentar')}>Reintentar</Btn>}
            </div>
          ) },
        ]}
      />
    </Card>
  );
}

/* ── Tabla de leads prospectados ─────────────────────────── */
function LeadsProspectados({ busquedas, busqueda, setBusqueda, esAdmin, refrescar }: {
  busquedas: BusquedaProspeccion[]; busqueda: string; setBusqueda: (v: string) => void; esAdmin: boolean; refrescar: number;
}) {
  const t = useT();
  const notify = useToast();
  const sel = useInputStyle();
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('todos');
  const [orden, setOrden] = useState<'puntaje' | 'fecha'>('puntaje');
  const [detalle, setDetalle] = useState<Lead | null>(null);
  const dq = useDebounced(q);
  const url = `/api/erp/leads${qs({ origen: 'scraping', q: dq, busqueda: busqueda !== 'todas' ? busqueda : null })}`;
  const { data, loading, error, reload, setData } = useData<Lead[]>(url, []);
  useEffect(() => { if (refrescar) reload(); }, [refrescar, reload]);

  const filas = useMemo(() => {
    const f = estado === 'todos' ? data : data.filter((l) => l.estado === estado);
    return orden === 'puntaje' ? [...f].sort((a, b) => (b.puntaje ?? 0) - (a.puntaje ?? 0)) : f;
  }, [data, estado, orden]);

  const cambiarEstado = async (l: Lead, nuevo: string) => {
    setData((x) => x.map((y) => (y.id === l.id ? { ...y, estado: nuevo as Lead['estado'] } : y)));
    try { await api('/api/erp/leads', { method: 'PATCH', body: { id: l.id, estado: nuevo } }); }
    catch (e) { notify((e as Error).message, 'error'); reload(); }
  };

  const exportar = () => descargarCSV(`prospeccion-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Empresa', 'Teléfono', 'WhatsApp', 'Correo', 'Red principal', 'Ciudad', 'Estado', 'Puntaje', 'Web', 'Dirección', 'Dueño / gerente', 'Fuente'],
    filas.map((l) => [l.nombre, l.telefono, linkWhatsApp(l.telefono), l.email, l.red_principal, l.ciudad, l.estado, l.puntaje,
      l.datos?.web, l.datos?.direccion, l.datos?.contacto_dueno?.nombre, l.fuente_url]));

  const opcionesBusqueda: Array<[string, string]> = [
    ['todas', 'Todas las búsquedas'],
    ...busquedas.filter((b) => b.total_nuevos > 0).map((b) => [b.id, `${b.tipo_negocio} · ${b.ciudad} (${fecha(b.created_at)})`] as [string, string]),
  ];

  return (
    <>
    <Card>
      <CardHeader
        title={`Leads prospectados · ${filas.length}`}
        right={
          <Toolbar>
            <Search value={q} onChange={setQ} placeholder="Empresa, teléfono, correo…" />
            <FilterSelect value={busqueda} onChange={setBusqueda} options={opcionesBusqueda} />
            <FilterSelect value={estado} onChange={setEstado} options={[['todos', 'Todas las etapas'], ...ESTADOS_LEAD]} />
            <FilterSelect value={orden} onChange={(v) => setOrden(v as 'puntaje' | 'fecha')} options={[['puntaje', 'Mayor puntaje'], ['fecha', 'Más recientes']]} />
            <Btn small variant="ghost" onClick={exportar}>CSV ↓</Btn>
          </Toolbar>
        }
      />
      {error && <div style={{ padding: 16 }}><ErrorMsg>{error}</ErrorMsg></div>}
      <Table<Lead>
        rows={filas} rowKey={(l) => l.id} onRowClick={(l) => setDetalle(l)}
        empty={loading ? 'Cargando…' : 'Aún no hay leads de prospección. Lanza una búsqueda.'}
        cols={[
          { key: 'n', label: 'Empresa', render: (l) => <Strong sub={l.datos?.categoria || fecha(l.created_at)}>{l.nombre}</Strong> },
          { key: 't', label: 'Teléfono', render: (l) => {
            const wa = linkWhatsApp(l.telefono);
            return l.telefono
              ? (wa
                ? <a href={wa} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontFamily: 'var(--mono)', fontSize: 12, color: t.green }}>{l.telefono} ↗</a>
                : <Mono>{l.telefono}</Mono>)
              : <Mono color={t.subtext}>—</Mono>;
          } },
          { key: 'm', label: 'Correo', render: (l) => l.email
              ? <a href={`mailto:${l.email}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: 12, color: t.sky }}>{l.email}</a>
              : <Mono color={t.subtext}>—</Mono> },
          { key: 'r', label: 'Red principal', render: (l) => l.red_principal
              ? <a href={l.red_principal} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: 12, color: t.sky }}>{redDe(l.red_principal)} ↗</a>
              : <Mono color={t.subtext}>—</Mono> },
          { key: 'c', label: 'Ciudad', render: (l) => <span style={{ fontSize: 12 }}>{l.ciudad || '—'}</span> },
          { key: 'e', label: 'Estado', render: (l) => (
            <select value={l.estado} onChange={(e) => cambiarEstado(l, e.target.value)} onClick={(e) => e.stopPropagation()}
              style={{ ...sel, width: 'auto', padding: '6px 10px', fontSize: 11, fontFamily: 'var(--mono)' }}>
              {ESTADOS_LEAD.map(([v, lab]) => <option key={v} value={v} style={{ background: t.modalBg, color: t.text }}>{lab}</option>)}
            </select>
          ) },
          { key: 'p', label: 'Puntaje', align: 'right', render: (l) => <Puntaje valor={l.puntaje} /> },
        ]}
      />
    </Card>
    {detalle && <DetalleModal key={detalle.id} lead={detalle} esAdmin={esAdmin} onClose={() => setDetalle(null)} onCambio={() => { setDetalle(null); reload(); }} />}
    </>
  );
}

function Puntaje({ valor }: { valor?: number | null }) {
  const t = useT();
  const v = valor ?? 0;
  const color = v >= 70 ? t.green : v >= 45 ? t.amber : t.subtext;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 48, height: 6, borderRadius: 3, background: t.softBg, overflow: 'hidden' }}>
        <span style={{ display: 'block', width: `${v}%`, height: '100%', background: color }} />
      </span>
      <Mono bold color={color}>{v}</Mono>
    </span>
  );
}

/* ── Detalle del lead ────────────────────────────────────── */
function DetalleModal({ lead, esAdmin, onClose, onCambio }: { lead: Lead; esAdmin: boolean; onClose: () => void; onCambio: () => void }) {
  const t = useT();
  const notify = useToast();
  const [excluyendo, setExcluyendo] = useState(false);
  const [motivo, setMotivo] = useState('');
  const d = lead.datos || {};
  const dueno = d.contacto_dueno;
  const enlace = (href: string, texto?: string) => (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: t.sky, wordBreak: 'break-all' }}>{texto || href} ↗</a>
  );

  const excluir = async () => {
    try {
      await api('/api/erp/prospeccion/excluir', { method: 'POST', body: { lead_id: lead.id, motivo } });
      notify('Datos suprimidos. Este contacto no volverá a cargarse.');
      onCambio();
    } catch (e) { notify((e as Error).message, 'error'); }
  };

  return (
    <Modal open onClose={onClose} width={640} eyebrow={`Prospección · ${SERVICIOS[lead.servicio] || lead.servicio}`} title={lead.nombre}
      footer={excluyendo
        ? <><Btn variant="ghost" onClick={() => setExcluyendo(false)}>Volver</Btn><Btn variant="danger" onClick={excluir}>Suprimir y no volver a contactar</Btn></>
        : <><Btn variant="ghost" onClick={() => setExcluyendo(true)}>Excluir (Habeas Data)</Btn><Btn variant="primary" onClick={onClose}>Cerrar</Btn></>}>
      {excluyendo ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 13, color: t.text, lineHeight: 1.5 }}>
            Se borran el teléfono, el correo y los detalles de este lead, y su teléfono, correo y dominio quedan en la lista de exclusión:
            ninguna búsqueda futura lo volverá a cargar. Úsalo cuando el titular pida no ser contactado (Ley 1581 de 2012).
          </span>
          <Field label="Motivo"><TextArea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: pidió por WhatsApp no ser contactado" /></Field>
        </div>
      ) : (
        <div>
          <Grid>
            <div><Puntaje valor={lead.puntaje} /></div>
            <div style={{ textAlign: 'right', fontSize: 12, color: t.subtext }}>Capturado {fecha(lead.fecha_captura || lead.created_at)}</div>
          </Grid>
          {d.puntaje_detalle?.length ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {d.puntaje_detalle.map(([txt, pts]) => <Badge key={txt} tone="blue">{txt} +{pts}</Badge>)}
            </div>
          ) : null}

          <SectionLabel>Contacto de la empresa</SectionLabel>
          <KV k="Teléfonos" v={d.telefonos?.length ? d.telefonos.join(' · ') : lead.telefono} />
          <KV k="WhatsApp" v={d.whatsapp ? enlace(d.whatsapp, 'Abrir chat') : '—'} />
          <KV k="Correos" v={d.emails?.length ? d.emails.join(' · ') : lead.email} />
          <KV k="Sitio web" v={d.web ? enlace(d.web) : 'No tiene'} />
          <KV k="Dirección" v={d.direccion} />
          <KV k="Ciudad" v={lead.ciudad} />
          <KV k="Categoría" v={d.categoria} />
          {d.calificacion != null && <KV k="Google" v={`${d.calificacion} ★ · ${d.resenas ?? 0} reseñas`} />}

          <SectionLabel>Redes sociales</SectionLabel>
          {d.redes && Object.keys(d.redes).length
            ? Object.entries(d.redes).map(([red, url]) => <KV key={red} k={NOMBRE_RED[red] || red} v={enlace(url)} />)
            : <span style={{ fontSize: 12, color: t.subtext }}>No se encontraron.</span>}

          <SectionLabel>Dueño / gerente</SectionLabel>
          {dueno?.nombre ? (
            <>
              <KV k="Nombre" v={`${dueno.nombre}${dueno.cargo ? ` · ${dueno.cargo}` : ''}`} />
              {dueno.telefono && <KV k="Teléfono" v={dueno.telefono} />}
              {dueno.email && <KV k="Correo" v={dueno.email} />}
              {dueno.fuente && <KV k="Dónde se vio" v={enlace(dueno.fuente, 'Ver página')} />}
              {(dueno as { confianza?: string }).confianza === 'baja' && (
                <span style={{ fontSize: 11, color: t.amber }}>Detectado en el texto de la página: confírmalo antes de usarlo.</span>
              )}
            </>
          ) : <span style={{ fontSize: 12, color: t.subtext }}>No se identificó. Puedes buscar el representante legal en el RUES con el NIT.</span>}

          <SectionLabel>Origen</SectionLabel>
          <KV k="Fuentes" v={d.fuentes?.map((f) => NOMBRE_FUENTE[f] || f).join(', ')} />
          {lead.fuente_url && <KV k="Ficha" v={enlace(lead.fuente_url, 'Abrir')} />}
          {d.busqueda && <KV k="Búsqueda" v={`${d.busqueda.tipo_negocio} · ${d.busqueda.ciudad} · ${CON_WEBSITE[d.busqueda.con_website as keyof typeof CON_WEBSITE] || ''}`} />}
          {esAdmin && lead.notas && <KV k="Notas" v={lead.notas} />}
        </div>
      )}
    </Modal>
  );
}

/* ── Formulario corto ────────────────────────────────────── */
function NuevaBusquedaModal({ onClose, onCreada }: { onClose: () => void; onCreada: () => void }) {
  const notify = useToast();
  const t = useT();
  const [ciudad, setCiudad] = useState('Medellín');
  const [tipo, setTipo] = useState('');
  const [web, setWeb] = useState<keyof typeof CON_WEBSITE>('indiferente');
  const [fuentes, setFuentes] = useState<Fuente[]>(Object.keys(FUENTES) as Fuente[]);
  const [limite, setLimite] = useState('60');
  const [servicio, setServicio] = useState('contabilidad');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (f: Fuente) => setFuentes((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]));
  const crear = async () => {
    if (!ciudad.trim() || !tipo.trim()) { setErr('Ciudad y tipo de negocio son obligatorios'); return; }
    if (!fuentes.length) { setErr('Elige al menos una fuente'); return; }
    setSaving(true); setErr('');
    try {
      const r = await api<{ inmediato?: boolean } & BusquedaProspeccion>('/api/erp/prospeccion', {
        method: 'POST', body: { ciudad, tipo_negocio: tipo, con_website: web, fuentes, limite: Number(limite), servicio },
      });
      notify(r && (r as { inmediato?: boolean }).inmediato ? 'Búsqueda iniciada: resultados en unos minutos' : 'Búsqueda en cola: arranca en máximo 10 minutos');
      setTipo('');
      onCreada();
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} width={560} eyebrow="Prospección" title="Nueva búsqueda"
      footer={<><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn variant="primary" onClick={crear} disabled={saving}>{saving ? 'Enviando…' : 'Buscar leads'}</Btn></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ErrorMsg>{err}</ErrorMsg>
        <Grid>
          <Field label="Ciudad">
            <Input list="prosp-ciudades" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
            <datalist id="prosp-ciudades">{CIUDADES.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Tipo de negocio">
            <Input list="prosp-tipos" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Ej.: Agencia de marketing" />
            <datalist id="prosp-tipos">{TIPOS_SUGERIDOS.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Website">
            <Select value={web} onChange={(e) => setWeb(e.target.value as keyof typeof CON_WEBSITE)} options={Object.entries(CON_WEBSITE) as Array<[string, string]>} />
          </Field>
          <Field label="Cantidad máxima">
            <Select value={limite} onChange={(e) => setLimite(e.target.value)} options={[['20', '20 leads'], ['60', '60 leads'], ['120', '120 leads'], ['200', '200 leads']]} />
          </Field>
          <Field label="Servicio a ofrecer" span={2}>
            <Select value={servicio} onChange={(e) => setServicio(e.target.value)} options={Object.entries(SERVICIOS) as Array<[string, string]>} />
          </Field>
        </Grid>
        <div>
          <span style={{ fontSize: 10, color: t.subtext, textTransform: 'uppercase', fontFamily: 'var(--mono)', letterSpacing: '.14em' }}>Fuentes</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {(Object.entries(FUENTES) as Array<[Fuente, string]>).map(([k, label]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.text, cursor: 'pointer' }}>
                <input type="checkbox" checked={fuentes.includes(k)} onChange={() => toggle(k)} /> {label}
              </label>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 11, color: t.subtext, lineHeight: 1.5 }}>
          Los contactos que ya están en tus leads o que pidieron no ser contactados se omiten automáticamente.
        </span>
      </div>
    </Modal>
  );
}
