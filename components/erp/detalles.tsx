'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, type Documento, type Item, type LineaLibro, type Pago, type Tercero } from './api';
import { DocumentoModal, PagoModal, TerceroModal, type TipoDoc, type TipoTercero } from './forms';
import { useToast } from './toast';
import {
  Badge, Btn, C, ESTADO_PAGO, KV, Modal, Mono, SERVICIOS, SectionLabel, Stat, Stats, Table, cop, fecha, useT, type Tone,
} from './ui';

const MEDIO_LABEL: Record<string, string> = {
  transferencia: 'Transferencia', efectivo: 'Efectivo', tarjeta: 'Tarjeta', wompi: 'Wompi', cheque: 'Cheque', otro: 'Otro',
};

/* ── Tabla de pagos reutilizable ─────────────────────────── */
function TablaPagos({ pagos, onAnular }: { pagos: Pago[]; onAnular?: (p: Pago) => void }) {
  const t = useT();
  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <Table<Pago>
        rows={pagos} rowKey={(p) => p.id} empty="Sin pagos registrados."
        cols={[
          { key: 'n', label: 'Comprobante', render: (p) => <Mono bold>{p.numero}</Mono> },
          { key: 'f', label: 'Fecha', render: (p) => <Mono color={t.subtext}>{fecha(p.fecha)}</Mono> },
          { key: 'm', label: 'Medio', render: (p) => <span style={{ fontSize: 12 }}>{MEDIO_LABEL[p.medio] || p.medio}{p.referencia ? <span style={{ color: t.subtext }}> · {p.referencia}</span> : null}</span> },
          { key: 'v', label: 'Valor', align: 'right', render: (p) => <Mono bold color={p.estado === 'anulado' ? t.subtext : t.green}>{p.estado === 'anulado' ? <s>{cop(p.valor)}</s> : cop(p.valor)}</Mono> },
          { key: 'a', label: '', align: 'right', render: (p) => p.estado === 'anulado'
              ? <Badge tone="gray">Anulado</Badge>
              : onAnular ? <Btn small variant="danger" onClick={(e) => { e.stopPropagation(); onAnular(p); }}>Anular</Btn> : null },
        ]}
      />
    </div>
  );
}

/* ── Asientos contables de un documento ──────────────────── */
export function TablaAsientos({ lineas }: { lineas: LineaLibro[] }) {
  const t = useT();
  if (!lineas.length) return <p style={{ fontSize: 12, color: t.subtext, margin: 0 }}>Sin asientos.</p>;
  const grupos = new Map<string, LineaLibro[]>();
  for (const l of lineas) {
    if (!grupos.has(l.asiento_id)) grupos.set(l.asiento_id, []);
    grupos.get(l.asiento_id)!.push(l);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[...grupos.values()].map((ls) => (
        <div key={ls[0].asiento_id} style={{ border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', opacity: ls[0].anulado ? 0.55 : 1 }}>
          <div style={{ padding: '8px 12px', background: t.tableHeaderBg, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
            <span><Mono bold>#{ls[0].numero}</Mono> <span style={{ color: t.subtext }}>· {fecha(ls[0].fecha)} · {ls[0].descripcion}</span></span>
            {ls[0].anulado && <Badge tone="gray">Reversado</Badge>}
          </div>
          {ls.map((l) => (
            <div key={l.linea_id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 110px 110px', gap: 8, padding: '6px 12px', fontSize: 12, borderTop: `1px solid ${t.tableRowBorder}` }}>
              <span style={{ paddingLeft: l.credito > 0 ? 18 : 0 }}><Mono color={t.sky}>{l.cuenta}</Mono> {l.cuenta_nombre}</span>
              <span style={{ textAlign: 'right' }}>{l.debito > 0 ? <Mono>{cop(l.debito)}</Mono> : ''}</span>
              <span style={{ textAlign: 'right' }}>{l.credito > 0 ? <Mono>{cop(l.credito)}</Mono> : ''}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   DETALLE DE VENTA / COMPRA
   ============================================================ */
export function DocumentoDetalleModal({ tipo, id, onClose, onChanged }: {
  tipo: TipoDoc; id: string | null; onClose: () => void; onChanged: () => void;
}) {
  const t = useT();
  const notify = useToast();
  const esVenta = tipo === 'venta';
  const [data, setData] = useState<{ documento: Documento; items: Item[]; pagos: Pago[]; asientos: LineaLibro[] } | null>(null);
  const [err, setErr] = useState('');
  const [pagoOpen, setPagoOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setData(await api(`/api/erp/${esVenta ? 'ventas' : 'compras'}/${id}`));
      setErr('');
    } catch (e) { setErr((e as Error).message); }
  }, [id, esVenta]);

  useEffect(() => { setData(null); load(); }, [load]);

  const anularDoc = async () => {
    if (!data) return;
    const motivo = prompt(`Motivo de anulación de ${data.documento.numero}:`);
    if (motivo === null) return;
    setBusy(true);
    try {
      await api(`/api/erp/${esVenta ? 'ventas' : 'compras'}/${data.documento.id}`, { method: 'PATCH', body: { accion: 'anular', motivo } });
      notify('Documento anulado. Se generó el contra-asiento en el libro diario.');
      await load(); onChanged();
    } catch (e) { notify((e as Error).message, 'error'); }
    finally { setBusy(false); }
  };

  const anularPago = async (p: Pago) => {
    if (!confirm(`¿Anular ${p.numero} por ${cop(p.valor)}? Se reversará el asiento contable.`)) return;
    try {
      await api('/api/erp/pagos', { method: 'PATCH', body: { id: p.id, accion: 'anular' } });
      notify('Pago anulado');
      await load(); onChanged();
    } catch (e) { notify((e as Error).message, 'error'); }
  };

  const d = data?.documento;
  const [estadoLabel, estadoTone]: [string, Tone] = (d && ESTADO_PAGO[d.estado_pago]) || ['—', 'gray'];
  return (
    <>
      <Modal open={Boolean(id) && !pagoOpen} onClose={onClose} width={760}
        eyebrow={esVenta ? 'Factura de venta' : 'Compra'}
        title={d ? <span>{d.numero} <span style={{ color: t.subtext, fontWeight: 500 }}>· {esVenta ? d.cliente_nombre : d.proveedor_nombre}</span></span> : 'Cargando…'}
        footer={d && <>
          {d.estado !== 'anulada' && <Btn variant="danger" onClick={anularDoc} disabled={busy}>Anular documento</Btn>}
          <span style={{ flex: 1 }} />
          {d.estado !== 'anulada' && Number(d.saldo) > 0 && (
            <Btn variant="primary" onClick={() => setPagoOpen(true)}>{esVenta ? 'Registrar cobro' : 'Registrar pago'}</Btn>
          )}
          <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        </>}
      >
        {err && <p style={{ color: t.danger }}>{err}</p>}
        {d && data && (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <Badge tone={estadoTone}>{estadoLabel}</Badge>
              {esVenta && d.servicio && <Badge tone="blue">{SERVICIOS[d.servicio] || d.servicio}</Badge>}
              {!esVenta && d.cuenta_gasto && <Badge tone="blue">{d.cuenta_gasto} · {d.cuenta_gasto_nombre}</Badge>}
            </div>
            <Stats>
              <Stat label="Total factura" value={cop(d.total)} color={t.text} />
              <Stat label={esVenta ? 'Cobrado' : 'Pagado'} value={cop(d.pagado)} color={t.green} />
              <Stat label="Saldo" value={cop(d.saldo)} color={Number(d.saldo) > 0 ? t.amber : t.green} />
            </Stats>

            <div className="erp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 6 }}>
              <div>
                <SectionLabel>Datos</SectionLabel>
                <KV k="Fecha" v={fecha(d.fecha)} />
                <KV k="Vencimiento" v={fecha(d.fecha_vencimiento)} />
                <KV k={esVenta ? 'Cliente' : 'Proveedor'} v={<>{esVenta ? d.cliente_nombre : d.proveedor_nombre}<br /><Mono color={t.subtext}>{esVenta ? d.cliente_documento : d.proveedor_documento}</Mono></>} />
                {!esVenta && <KV k="N° factura proveedor" v={d.numero_factura || '—'} />}
                <KV k="Descripción" v={d.descripcion || '—'} />
                {d.estado === 'anulada' && <KV k="Motivo anulación" v={d.motivo_anulacion || '—'} />}
              </div>
              <div>
                <SectionLabel>Liquidación</SectionLabel>
                <KV k="Subtotal" v={<Mono>{cop(d.subtotal)}</Mono>} />
                <KV k="IVA" v={<Mono>{cop(d.iva)}</Mono>} />
                <KV k="Total" v={<Mono>{cop(d.total)}</Mono>} />
                <KV k="(–) Retención en la fuente" v={<Mono>{cop(d.retencion)}</Mono>} />
                <KV k={esVenta ? 'Neto a cobrar' : 'Neto a pagar'} v={<Mono bold>{cop(d.neto)}</Mono>} />
              </div>
            </div>

            <SectionLabel>Ítems</SectionLabel>
            <div style={{ border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <Table<Item>
                rows={data.items} rowKey={(i) => String(i.id)}
                cols={[
                  { key: 'd', label: 'Concepto', render: (i) => i.descripcion },
                  { key: 'c', label: 'Cant.', align: 'right', render: (i) => <Mono>{Number(i.cantidad)}</Mono> },
                  { key: 'u', label: 'Valor unit.', align: 'right', render: (i) => <Mono>{cop(i.valor_unitario)}</Mono> },
                  { key: 'i', label: 'IVA', align: 'right', render: (i) => <Mono color={t.subtext}>{Number(i.iva_pct)}%</Mono> },
                  { key: 's', label: 'Subtotal', align: 'right', render: (i) => <Mono bold>{cop(i.subtotal)}</Mono> },
                ]}
              />
            </div>

            <SectionLabel>{esVenta ? 'Cobros' : 'Pagos'}</SectionLabel>
            <TablaPagos pagos={data.pagos} onAnular={anularPago} />

            <SectionLabel>Contabilización (libro diario)</SectionLabel>
            <TablaAsientos lineas={data.asientos} />
          </div>
        )}
      </Modal>
      <PagoModal
        tipo={tipo} documento={d || null} open={pagoOpen}
        onClose={() => setPagoOpen(false)}
        onSaved={async () => { setPagoOpen(false); await load(); onChanged(); }}
      />
    </>
  );
}

/* ============================================================
   DETALLE DE CLIENTE / PROVEEDOR (estado de cuenta)
   ============================================================ */
export function TerceroDetalleModal({ tipo, id, onClose, onChanged }: {
  tipo: TipoTercero; id: string | null; onClose: () => void; onChanged: () => void;
}) {
  const t = useT();
  const esCliente = tipo === 'cliente';
  const tipoDoc: TipoDoc = esCliente ? 'venta' : 'compra';
  const [data, setData] = useState<{ tercero: Tercero; documentos: Documento[]; pagos: Pago[] } | null>(null);
  const [err, setErr] = useState('');
  const [editar, setEditar] = useState(false);
  const [nuevoDoc, setNuevoDoc] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const [pagoDoc, setPagoDoc] = useState<Documento | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await api<Record<string, unknown>>(`/api/erp/${esCliente ? 'clientes' : 'proveedores'}/${id}`);
      setData({ tercero: r[tipo] as Tercero, documentos: r.documentos as Documento[], pagos: r.pagos as Pago[] });
      setErr('');
    } catch (e) { setErr((e as Error).message); }
  }, [id, esCliente, tipo]);

  useEffect(() => { setData(null); load(); }, [load]);

  const refrescar = async () => { await load(); onChanged(); };
  const x = data?.tercero;
  const abierto = Boolean(id) && !editar && !nuevoDoc && !docId && !pagoDoc;
  const docsVigentes = data?.documentos.filter((d) => d.estado !== 'anulada') || [];
  const facturado = docsVigentes.reduce((a, d) => a + Number(d.total), 0);

  return (
    <>
      <Modal open={abierto} onClose={onClose} width={1040}
        eyebrow={esCliente ? 'Cliente · Estado de cuenta' : 'Proveedor · Estado de cuenta'}
        title={x ? x.nombre : 'Cargando…'}
        footer={x && <>
          <Btn variant="ghost" onClick={() => setEditar(true)}>Editar datos</Btn>
          <span style={{ flex: 1 }} />
          <Btn variant="primary" onClick={() => setNuevoDoc(true)}>{esCliente ? '+ Nueva venta' : '+ Nueva compra'}</Btn>
        </>}
      >
        {err && <p style={{ color: t.danger }}>{err}</p>}
        {x && data && (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <Badge tone="blue">{x.tipo_documento} {x.numero_documento}{x.dv ? `-${x.dv}` : ''}</Badge>
              <Badge tone="gray">{x.tipo_persona === 'juridica' ? 'Persona jurídica' : 'Persona natural'}</Badge>
              {x.responsable_iva && <Badge tone="sky">Responsable de IVA</Badge>}
              {!x.activo && <Badge tone="red">Inactivo</Badge>}
            </div>
            <Stats>
              <Stat label={esCliente ? 'Total facturado' : 'Total comprado'} value={cop(facturado)} color={t.text} hint={`${docsVigentes.length} documento(s)`} />
              <Stat label={esCliente ? 'Por cobrar' : 'Por pagar'} value={cop(x.saldo)} color={Number(x.saldo) > 0 ? t.amber : t.green} />
              <Stat label="Vencido" value={cop(x.saldo_vencido)} color={Number(x.saldo_vencido) > 0 ? t.danger : t.subtext} />
            </Stats>

            <div className="erp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <SectionLabel>Contacto</SectionLabel>
                <KV k="Correo" v={x.email ? <a href={`mailto:${x.email}`} style={{ color: t.sky }}>{x.email}</a> : '—'} />
                <KV k="Teléfono" v={x.telefono ? <a href={`https://wa.me/${x.telefono.replace(/\D/g, '').replace(/^(?!57)(\d{10})$/, '57$1')}`} target="_blank" rel="noreferrer" style={{ color: t.sky }}>{x.telefono}</a> : '—'} />
                <KV k="Dirección" v={[x.direccion, x.ciudad].filter(Boolean).join(', ') || '—'} />
              </div>
              <div>
                <SectionLabel>Condiciones</SectionLabel>
                <KV k="Días de crédito" v={`${x.dias_credito} días`} />
                {!esCliente && <KV k="Cuenta bancaria" v={x.numero_cuenta ? `${x.banco || ''} ${x.tipo_cuenta || ''} · ${x.numero_cuenta}` : '—'} />}
                <KV k="Notas" v={x.notas || '—'} />
              </div>
            </div>

            <SectionLabel>{esCliente ? 'Ventas' : 'Compras'}</SectionLabel>
            <div style={{ border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <Table<Documento>
                rows={data.documentos} rowKey={(d) => d.id} onRowClick={(d) => setDocId(d.id)}
                empty={esCliente ? 'Este cliente aún no tiene ventas.' : 'Este proveedor aún no tiene compras.'}
                cols={[
                  { key: 'n', label: 'Número', render: (d) => <Mono bold>{d.numero}</Mono> },
                  { key: 'f', label: 'Fecha', render: (d) => <Mono color={t.subtext}>{fecha(d.fecha)}</Mono> },
                  { key: 'v', label: 'Vence', render: (d) => <Mono color={t.subtext}>{fecha(d.fecha_vencimiento)}</Mono> },
                  { key: 'd', label: 'Descripción', render: (d) => <span style={{ fontSize: 12 }}>{d.descripcion || (esCliente && d.servicio ? SERVICIOS[d.servicio] : '—')}</span> },
                  { key: 't', label: 'Total', align: 'right', render: (d) => <Mono>{cop(d.total)}</Mono> },
                  { key: 's', label: 'Saldo', align: 'right', render: (d) => <Mono bold color={Number(d.saldo) > 0 ? t.amber : t.subtext}>{cop(d.saldo)}</Mono> },
                  { key: 'e', label: 'Estado', render: (d) => { const [l, tone] = ESTADO_PAGO[d.estado_pago]; return <Badge tone={tone}>{l}</Badge>; } },
                  { key: 'a', label: '', align: 'right', render: (d) => d.estado !== 'anulada' && Number(d.saldo) > 0
                      ? <Btn small variant="link" onClick={(e) => { e.stopPropagation(); setPagoDoc(d); }}>{esCliente ? 'Cobrar' : 'Pagar'}</Btn> : null },
                ]}
              />
            </div>

            <SectionLabel>{esCliente ? 'Cobros recibidos' : 'Pagos realizados'}</SectionLabel>
            <TablaPagos pagos={data.pagos} />
          </div>
        )}
      </Modal>

      <TerceroModal tipo={tipo} open={editar} initial={x || null} onClose={() => setEditar(false)}
        onSaved={async () => { setEditar(false); await refrescar(); }} />
      <DocumentoModal tipo={tipoDoc} open={nuevoDoc} terceroId={id} onClose={() => setNuevoDoc(false)}
        onSaved={async (nid) => { setNuevoDoc(false); await refrescar(); setDocId(nid); }} />
      <DocumentoDetalleModal tipo={tipoDoc} id={docId} onClose={() => setDocId(null)} onChanged={refrescar} />
      <PagoModal tipo={tipoDoc} documento={pagoDoc} open={Boolean(pagoDoc)} onClose={() => setPagoDoc(null)}
        onSaved={async () => { setPagoDoc(null); await refrescar(); }} />
    </>
  );
}
