'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, qs, useData, useDebounced, type FormularioRegistro } from '../api';
import { useToast } from '../toast';
import {
  Badge,
  Btn,
  Card,
  CardHeader,
  ErrorMsg,
  Field,
  FilterSelect,
  Grid,
  Input,
  KV,
  Modal,
  Search,
  Select,
  Table,
  Toolbar,
  descargarCSV,
  fecha,
  useT,
  type Tone,
} from '../ui';

const SERVICIOS_MAP: Record<string, string> = {
  contabilidad: 'Contabilidad',
  nomina: 'Nómina',
  renta: 'Renta',
  personalizado: 'Personalizado',
  otro: 'Otro',
};

const ORIGEN_MAP: Record<string, string> = {
  contabilidad: 'Contabilidad',
  nomina: 'Nómina',
  personalizado: 'Personalizado',
  inicio: 'Inicio',
  renta_cita: 'Renta: cita',
  renta_resultado: 'Renta: resultado del test',
  renta_test: 'Renta: test',
  link_agenda: 'Link de agenda',
  agendar: 'Agendar',
};

const ESTADOS_MAP: Record<string, [string, Tone]> = {
  pendiente: ['Pendiente', 'sky'],
  aprobado: ['Aprobado', 'green'],
  descartado: ['Descartado', 'gray'],
};

const waLink = (tel: string) => `https://wa.me/${tel.replace(/\D/g, '').replace(/^(?!57)(\d{10})$/, '57$1')}`;

export default function FormulariosPanel({
  puedeAprobar,
  onVerCliente,
}: {
  puedeAprobar: boolean;
  onVerCliente?: (clienteId: string) => void;
}) {
  const t = useT();
  const notify = useToast();
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [servicio, setServicio] = useState('todos');
  const [formulario, setFormulario] = useState('todos');
  const [detalle, setDetalle] = useState<FormularioRegistro | null>(null);
  const [aprobarModal, setAprobarModal] = useState<FormularioRegistro | null>(null);
  const [descartarModal, setDescartarModal] = useState<FormularioRegistro | null>(null);
  const [motivoDescarte, setMotivoDescarte] = useState('');

  const dq = useDebounced(q);
  const params: Record<string, string> = { estado, q: dq };
  if (servicio !== 'todos') params.servicio = servicio;
  if (formulario !== 'todos') params.formulario = formulario;

  const { data: resData, loading, reload } = useData<{
    data: FormularioRegistro[];
    stats: { pendientes: number; aprobadosMes: number; descartadosMes: number };
  }>(`/api/erp/formularios${qs(params)}`, {
    data: [],
    stats: { pendientes: 0, aprobadosMes: 0, descartadosMes: 0 },
  });

  const formularios = resData?.data || [];
  const stats = resData?.stats || { pendientes: 0, aprobadosMes: 0, descartadosMes: 0 };

  const formatearFechaHora = (citaAt: string | null, fechaPref: string | null) => {
    if (citaAt) {
      try {
        const d = new Date(citaAt);
        return d.toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          dateStyle: 'short',
          timeStyle: 'short',
        });
      } catch {
        return citaAt;
      }
    }
    return fechaPref || '—';
  };

  const descartar = async () => {
    if (!descartarModal) return;
    try {
      await api(`/api/erp/formularios/${descartarModal.id}`, {
        method: 'PATCH',
        body: { estado: 'descartado', motivo_descarte: motivoDescarte.trim() },
      });
      notify('Formulario descartado');
      setDescartarModal(null);
      setMotivoDescarte('');
      if (detalle?.id === descartarModal.id) setDetalle(null);
      reload();
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };

  const restaurar = async (f: FormularioRegistro) => {
    try {
      await api(`/api/erp/formularios/${f.id}`, {
        method: 'PATCH',
        body: { estado: 'pendiente' },
      });
      notify('Formulario devuelto a pendientes');
      if (detalle?.id === f.id) setDetalle(null);
      reload();
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };

  const exportarCSV = () => {
    descargarCSV(
      `formularios-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Fecha', 'Nombre', 'Empresa', 'Correo', 'Teléfono', 'Servicio', 'Origen', 'Cita', 'Estado', 'Mensaje'],
      formularios.map((f) => [
        f.created_at.slice(0, 10),
        f.nombre,
        f.empresa || '',
        f.email || '',
        f.telefono || '',
        SERVICIOS_MAP[f.servicio] || f.servicio,
        f.link?.titulo ? `Link: ${f.link.titulo}` : ORIGEN_MAP[f.formulario] || f.formulario,
        formatearFechaHora(f.cita_at, f.fecha_preferida),
        f.estado,
        f.mensaje || '',
      ])
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Tarjetas superiores de resumen ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <button
          onClick={() => setEstado('pendiente')}
          style={{
            textAlign: 'left',
            background: estado === 'pendiente' ? 'rgba(255,255,255,0.08)' : t.cardBg,
            border: `1px solid ${estado === 'pendiente' ? 'rgba(255,255,255,0.22)' : t.border}`,
            borderRadius: 16,
            padding: '16px 18px',
            cursor: 'pointer',
            color: t.text,
            backdropFilter: 'blur(20px)',
            transition: 'all .2s',
          }}
        >
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: t.subtext, textTransform: 'uppercase', letterSpacing: '.12em' }}>
            Pendientes
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--mono)', color: t.sky, marginTop: 4 }}>
            {stats.pendientes}
          </div>
          <span style={{ fontSize: 11, color: t.subtext }}>Por revisar y aprobar</span>
        </button>

        <button
          onClick={() => setEstado('aprobado')}
          style={{
            textAlign: 'left',
            background: estado === 'aprobado' ? 'rgba(255,255,255,0.08)' : t.cardBg,
            border: `1px solid ${estado === 'aprobado' ? 'rgba(255,255,255,0.22)' : t.border}`,
            borderRadius: 16,
            padding: '16px 18px',
            cursor: 'pointer',
            color: t.text,
            backdropFilter: 'blur(20px)',
            transition: 'all .2s',
          }}
        >
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: t.subtext, textTransform: 'uppercase', letterSpacing: '.12em' }}>
            Aprobados este mes
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--mono)', color: t.green, marginTop: 4 }}>
            {stats.aprobadosMes}
          </div>
          <span style={{ fontSize: 11, color: t.subtext }}>Convertidos en Clientes</span>
        </button>

        <button
          onClick={() => setEstado('descartado')}
          style={{
            textAlign: 'left',
            background: estado === 'descartado' ? 'rgba(255,255,255,0.08)' : t.cardBg,
            border: `1px solid ${estado === 'descartado' ? 'rgba(255,255,255,0.22)' : t.border}`,
            borderRadius: 16,
            padding: '16px 18px',
            cursor: 'pointer',
            color: t.text,
            backdropFilter: 'blur(20px)',
            transition: 'all .2s',
          }}
        >
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: t.subtext, textTransform: 'uppercase', letterSpacing: '.12em' }}>
            Descartados este mes
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--mono)', color: t.subtext, marginTop: 4 }}>
            {stats.descartadosMes}
          </div>
          <span style={{ fontSize: 11, color: t.subtext }}>No interesados o spam</span>
        </button>
      </div>

      {/* ── Tabla y Toolbar ── */}
      <Card>
        <CardHeader
          title={`Formularios recibidos (${formularios.length})`}
          right={
            <Toolbar>
              <Search value={q} onChange={setQ} placeholder="Nombre, empresa, contacto…" />
              <FilterSelect
                value={estado}
                onChange={setEstado}
                options={[
                  ['todos', 'Todos los estados'],
                  ['pendiente', 'Pendientes'],
                  ['aprobado', 'Aprobados'],
                  ['descartado', 'Descartados'],
                ]}
              />
              <FilterSelect
                value={servicio}
                onChange={setServicio}
                options={[
                  ['todos', 'Todos los servicios'],
                  ['contabilidad', 'Contabilidad'],
                  ['nomina', 'Nómina'],
                  ['renta', 'Renta'],
                  ['personalizado', 'Personalizado'],
                  ['otro', 'Otro'],
                ]}
              />
              <FilterSelect
                value={formulario}
                onChange={setFormulario}
                options={[
                  ['todos', 'Todos los orígenes'],
                  ['contabilidad', 'Contabilidad'],
                  ['nomina', 'Nómina'],
                  ['personalizado', 'Personalizado'],
                  ['inicio', 'Inicio'],
                  ['renta_cita', 'Renta: cita'],
                  ['renta_resultado', 'Renta: resultado del test'],
                  ['renta_test', 'Renta: test'],
                  ['link_agenda', 'Link de agenda'],
                  ['agendar', 'Agendar'],
                ]}
              />
              <Btn small variant="ghost" onClick={exportarCSV}>
                CSV ↓
              </Btn>
            </Toolbar>
          }
        />

        <Table<FormularioRegistro>
          rows={formularios}
          rowKey={(f) => f.id}
          onRowClick={(f) => setDetalle(f)}
          empty="Aún no hay formularios. Aquí llega todo lo que la gente registra en la web."
          cols={[
            {
              key: 'fecha',
              label: 'Fecha',
              render: (f) => (
                <span style={{ whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 11, color: t.subtext }}>
                  {fecha(f.created_at)}
                </span>
              ),
            },
            {
              key: 'nombre',
              label: 'Nombre / Empresa',
              render: (f) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{f.nombre}</div>
                  {f.empresa && <div style={{ fontSize: 11, color: t.subtext }}>{f.empresa}</div>}
                </div>
              ),
            },
            {
              key: 'contacto',
              label: 'Contacto',
              render: (f) => (
                <div>
                  {f.telefono && (
                    <a
                      href={waLink(f.telefono)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: t.green, display: 'block', fontSize: 11, fontFamily: 'var(--mono)' }}
                    >
                      {f.telefono} ↗
                    </a>
                  )}
                  {f.email && (
                    <span style={{ fontSize: 11, color: t.subtext, display: 'block' }}>{f.email}</span>
                  )}
                </div>
              ),
            },
            {
              key: 'servicio',
              label: 'Servicio',
              render: (f) => (
                <Badge tone="blue">{SERVICIOS_MAP[f.servicio] || f.servicio}</Badge>
              ),
            },
            {
              key: 'origen',
              label: 'Origen',
              render: (f) => {
                const origenTexto = f.link?.titulo
                  ? `Link: ${f.link.titulo}`
                  : ORIGEN_MAP[f.formulario] || f.formulario;
                return <span style={{ fontSize: 11, color: t.subtext }}>{origenTexto}</span>;
              },
            },
            {
              key: 'cita',
              label: 'Cita agendada',
              render: (f) => (
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: t.text }}>
                  {formatearFechaHora(f.cita_at, f.fecha_preferida)}
                </span>
              ),
            },
            {
              key: 'estado',
              label: 'Estado',
              render: (f) => {
                const [estLabel, estTone] = ESTADOS_MAP[f.estado] || ['Pendiente', 'sky'];
                return <Badge tone={estTone}>{estLabel}</Badge>;
              },
            },
          ]}
        />
      </Card>

      {/* ── Modal Detalle del Formulario ── */}
      {detalle && (
        <Modal
          open={Boolean(detalle)}
          onClose={() => setDetalle(null)}
          width={640}
          eyebrow="Formulario web"
          title={detalle.nombre}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div>
                {detalle.estado === 'descartado' && puedeAprobar && (
                  <Btn variant="ghost" small onClick={() => restaurar(detalle)}>
                    Restaurar a pendiente
                  </Btn>
                )}
                {detalle.estado === 'pendiente' && puedeAprobar && (
                  <Btn variant="ghost" small onClick={() => setDescartarModal(detalle)}>
                    Descartar
                  </Btn>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="ghost" onClick={() => setDetalle(null)}>
                  Cerrar
                </Btn>
                {detalle.estado === 'aprobado' && detalle.cliente_id && onVerCliente && (
                  <Btn
                    variant="primary"
                    onClick={() => {
                      onVerCliente(detalle.cliente_id!);
                      setDetalle(null);
                    }}
                  >
                    Ver cliente en Terceros →
                  </Btn>
                )}
                {detalle.estado === 'pendiente' && puedeAprobar && (
                  <Btn
                    variant="primary"
                    onClick={() => {
                      setAprobarModal(detalle);
                      setDetalle(null);
                    }}
                  >
                    Aprobar y crear cliente
                  </Btn>
                )}
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Grid cols={2}>
              <KV k="Servicio" v={<Badge tone="blue">{SERVICIOS_MAP[detalle.servicio] || detalle.servicio}</Badge>} />
              <KV
                k="Origen"
                v={detalle.link?.titulo ? `Link de agenda: ${detalle.link.titulo}` : ORIGEN_MAP[detalle.formulario] || detalle.formulario}
              />
              <KV k="Empresa" v={detalle.empresa || '—'} />
              <KV
                k="WhatsApp"
                v={
                  detalle.telefono ? (
                    <a href={waLink(detalle.telefono)} target="_blank" rel="noopener noreferrer" style={{ color: t.green }}>
                      {detalle.telefono} ↗
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
              <KV k="Correo electrónico" v={detalle.email || '—'} />
              <KV k="Fecha y hora de cita" v={formatearFechaHora(detalle.cita_at, detalle.fecha_preferida)} />
              <KV k="Modalidad" v={detalle.modalidad ? (detalle.modalidad === 'presencial' ? 'Presencial Medellín' : 'Virtual') : '—'} />
              <KV k="Dirección" v={detalle.direccion || '—'} />
              <KV k="Fecha de registro" v={new Date(detalle.created_at).toLocaleString('es-CO')} />
              <KV
                k="Estado"
                v={
                  <Badge tone={ESTADOS_MAP[detalle.estado]?.[1] || 'sky'}>
                    {ESTADOS_MAP[detalle.estado]?.[0] || detalle.estado}
                  </Badge>
                }
              />
            </Grid>

            {detalle.mensaje && (
              <div style={{ background: t.cardBg, padding: '12px 14px', borderRadius: 12, border: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: t.subtext, textTransform: 'uppercase', letterSpacing: '.12em', display: 'block', marginBottom: 6 }}>
                  Mensaje / Notas
                </span>
                <p style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{detalle.mensaje}</p>
              </div>
            )}

            {detalle.datos && Object.keys(detalle.datos).length > 0 && (
              <div style={{ background: t.cardBg, padding: '12px 14px', borderRadius: 12, border: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: t.subtext, textTransform: 'uppercase', letterSpacing: '.12em', display: 'block', marginBottom: 8 }}>
                  Datos adicionales del formulario
                </span>
                <Grid cols={2}>
                  {Object.entries(detalle.datos).map(([key, val]) => (
                    <KV key={key} k={key} v={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')} />
                  ))}
                </Grid>
              </div>
            )}

            {detalle.estado === 'descartado' && detalle.motivo_descarte && (
              <div style={{ background: 'rgba(255,80,80,0.1)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,80,80,0.2)' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: '#FF8080', textTransform: 'uppercase', letterSpacing: '.12em', display: 'block', marginBottom: 4 }}>
                  Motivo de descarte
                </span>
                <p style={{ margin: 0, fontSize: 12, color: t.text }}>{detalle.motivo_descarte}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Modal Aprobar y Crear Cliente ── */}
      {aprobarModal && (
        <AprobarFormularioModal
          formulario={aprobarModal}
          onClose={() => setAprobarModal(null)}
          onDone={() => {
            setAprobarModal(null);
            notify('¡Formulario aprobado y cliente registrado!');
            reload();
          }}
        />
      )}

      {/* ── Modal Descartar Formulario ── */}
      {descartarModal && (
        <Modal
          open={Boolean(descartarModal)}
          onClose={() => setDescartarModal(null)}
          width={450}
          eyebrow="Confirmar descarte"
          title="Descartar formulario"
          footer={
            <>
              <Btn variant="ghost" onClick={() => setDescartarModal(null)}>
                Cancelar
              </Btn>
              <Btn variant="primary" onClick={descartar}>
                Confirmar descarte
              </Btn>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: t.subtext }}>
              Indica por qué se descarta el registro de <strong>{descartarModal.nombre}</strong>:
            </p>
            <Field label="Motivo del descarte">
              <Input
                value={motivoDescarte}
                onChange={(e) => setMotivoDescarte(e.target.value)}
                placeholder="Ej. Número equivocado, no responde, spam..."
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Modal Aprobar y Convertir en Cliente ────────────────── */
function AprobarFormularioModal({
  formulario,
  onClose,
  onDone,
}: {
  formulario: FormularioRegistro;
  onClose: () => void;
  onDone: () => void;
}) {
  const [f, setF] = useState<Record<string, string>>({
    tipo_persona: formulario.empresa ? 'juridica' : 'natural',
    tipo_documento: formulario.empresa ? 'NIT' : 'CC',
    numero_documento: '',
    nombre: formulario.empresa || formulario.nombre,
    email: formulario.email || '',
    telefono: formulario.telefono || '',
    direccion: formulario.direccion || '',
    ciudad: 'Medellín',
  });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));

  const aprobar = async () => {
    if (!f.numero_documento.trim()) {
      setErr('El número de documento es obligatorio para facturación.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await api('/api/erp/formularios/aprobar', {
        method: 'POST',
        body: {
          formulario_id: formulario.id,
          cliente: f,
        },
      });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      width={560}
      eyebrow="Formularios → Clientes"
      title="Aprobar y crear cliente"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn variant="primary" onClick={aprobar} disabled={saving}>
            {saving ? 'Aprobando…' : 'Aprobar y crear cliente'}
          </Btn>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ErrorMsg>{err}</ErrorMsg>
        <Grid>
          <Field label="Tipo de persona">
            <Select
              value={f.tipo_persona || 'natural'}
              onChange={(e) => {
                set('tipo_persona', e.target.value);
                set('tipo_documento', e.target.value === 'juridica' ? 'NIT' : 'CC');
                if (e.target.value === 'natural' && formulario.nombre) {
                  set('nombre', formulario.nombre);
                }
              }}
              options={[
                ['natural', 'Persona natural'],
                ['juridica', 'Persona jurídica'],
              ]}
            />
          </Field>
          <Field label="Tipo de documento">
            <Select
              value={f.tipo_documento || 'CC'}
              onChange={(e) => set('tipo_documento', e.target.value)}
              options={[
                ['CC', 'CC'],
                ['NIT', 'NIT'],
                ['CE', 'CE'],
                ['PAS', 'Pasaporte'],
                ['PPT', 'PPT'],
              ]}
            />
          </Field>
          <Field label="Número de documento">
            <Input
              value={f.numero_documento || ''}
              onChange={(e) => set('numero_documento', e.target.value)}
              placeholder="Requerido para facturación"
              style={{ fontFamily: 'var(--mono)' }}
            />
          </Field>
          <Field label={f.tipo_persona === 'juridica' ? 'Razón social' : 'Nombre completo'}>
            <Input value={f.nombre || ''} onChange={(e) => set('nombre', e.target.value)} />
          </Field>
          <Field label="Correo electrónico">
            <Input value={f.email || ''} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Teléfono / WhatsApp">
            <Input value={f.telefono || ''} onChange={(e) => set('telefono', e.target.value)} />
          </Field>
          <Field label="Dirección" span={2}>
            <Input value={f.direccion || ''} onChange={(e) => set('direccion', e.target.value)} />
          </Field>
          <Field label="Ciudad" span={2}>
            <Input value={f.ciudad || ''} onChange={(e) => set('ciudad', e.target.value)} />
          </Field>
        </Grid>
      </div>
    </Modal>
  );
}
