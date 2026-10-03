'use client';

import { useMemo, useState } from 'react';
import { qs, useData, useDebounced, type Documento } from '../api';
import { DocumentoDetalleModal } from '../detalles';
import { DocumentoModal, PagoModal, type TipoDoc } from '../forms';
import {
  Badge, Btn, C, Card, CardHeader, ESTADO_PAGO, ErrorMsg, FilterSelect, Input, Mono, SERVICIOS, Search, Stat, Stats,
  Strong, Table, Toolbar, cop, descargarCSV, fecha, useT,
} from '../ui';

const inicioMes = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

/** Panel de Ventas o de Compras */
export default function DocumentosPanel({ tipo }: { tipo: TipoDoc }) {
  const t = useT();
  const esVenta = tipo === 'venta';
  const [q, setQ] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estado, setEstado] = useState('todos');
  const [servicio, setServicio] = useState('todos');
  const [nuevo, setNuevo] = useState(false);
  const [detalle, setDetalle] = useState<string | null>(null);
  const [pagoDoc, setPagoDoc] = useState<Documento | null>(null);
  const dq = useDebounced(q);

  const url = `/api/erp/${esVenta ? 'ventas' : 'compras'}${qs({ q: dq, desde, hasta, estado_pago: estado, servicio: esVenta ? servicio : null })}`;
  const { data, loading, error, reload } = useData<Documento[]>(url, []);

  const kpi = useMemo(() => {
    const vig = data.filter((d) => d.estado !== 'anulada');
    return {
      n: vig.length,
      total: vig.reduce((a, d) => a + Number(d.total), 0),
      pagado: vig.reduce((a, d) => a + Number(d.pagado), 0),
      saldo: vig.reduce((a, d) => a + Number(d.saldo), 0),
      iva: vig.reduce((a, d) => a + Number(d.iva), 0),
      vencidas: vig.filter((d) => d.estado_pago === 'vencida').length,
    };
  }, [data]);

  const exportar = () => descargarCSV(
    `${esVenta ? 'ventas' : 'compras'}-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Número', 'Fecha', 'Vence', esVenta ? 'Cliente' : 'Proveedor', 'Documento', esVenta ? 'Servicio' : 'Factura prov.', 'Descripción',
     'Subtotal', 'IVA', 'Retención', 'Total', esVenta ? 'Cobrado' : 'Pagado', 'Saldo', 'Estado'],
    data.map((d) => [d.numero, d.fecha, d.fecha_vencimiento, esVenta ? d.cliente_nombre : d.proveedor_nombre,
      esVenta ? d.cliente_documento : d.proveedor_documento, esVenta ? SERVICIOS[d.servicio || ''] : d.numero_factura, d.descripcion,
      Number(d.subtotal), Number(d.iva), Number(d.retencion), Number(d.total), Number(d.pagado), Number(d.saldo), ESTADO_PAGO[d.estado_pago]?.[0]]),
  );

  const filtrosActivos = desde || hasta || estado !== 'todos' || servicio !== 'todos' || q;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Stats>
        <Stat label={esVenta ? 'Total vendido' : 'Total comprado'} value={cop(kpi.total)} color={esVenta ? t.cyan : t.amber} hint={`${kpi.n} documento(s) ${filtrosActivos ? 'en el filtro' : ''}`} />
        <Stat label={esVenta ? 'Cobrado' : 'Pagado'} value={cop(kpi.pagado)} color={t.green} />
        <Stat label={esVenta ? 'Por cobrar' : 'Por pagar'} value={cop(kpi.saldo)} color={kpi.saldo > 0 ? t.amber : t.subtext} hint={kpi.vencidas ? `${kpi.vencidas} vencida(s)` : 'Sin vencidas'} />
        <Stat label={esVenta ? 'IVA generado' : 'IVA descontable'} value={cop(kpi.iva)} color={t.text} />
      </Stats>

      <Card>
        <CardHeader
          title={esVenta ? 'Facturas de venta' : 'Compras y gastos'}
          right={
            <Toolbar>
              <Btn small variant="ghost" onClick={exportar}>CSV ↓</Btn>
              <Btn variant="primary" onClick={() => setNuevo(true)}>{esVenta ? '+ Nueva venta' : '+ Registrar compra'}</Btn>
            </Toolbar>
          }
        />
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}` }}>
          <Toolbar>
            <Search value={q} onChange={setQ} placeholder={esVenta ? 'Número, cliente, documento…' : 'Número, proveedor, documento…'} />
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={{ width: 150, fontSize: 12 }} title="Desde" />
            <span style={{ color: t.subtext, fontSize: 12 }}>a</span>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={{ width: 150, fontSize: 12 }} title="Hasta" />
            <FilterSelect value={estado} onChange={setEstado} options={[['todos', 'Todos los estados'], ['pendiente', 'Pendiente'], ['parcial', 'Abono parcial'], ['vencida', 'Vencida'], ['pagada', 'Pagada'], ['anulada', 'Anulada']]} />
            {esVenta && (
              <FilterSelect value={servicio} onChange={setServicio} options={[['todos', 'Todos los servicios'], ...Object.entries(SERVICIOS)] as Array<[string, string]>} />
            )}
            <Btn small variant="ghost" onClick={() => { setDesde(inicioMes()); setHasta(''); }}>Este mes</Btn>
            {filtrosActivos && <Btn small variant="ghost" onClick={() => { setQ(''); setDesde(''); setHasta(''); setEstado('todos'); setServicio('todos'); }}>Limpiar</Btn>}
          </Toolbar>
        </div>
        {error && <div style={{ padding: 16 }}><ErrorMsg>{error}</ErrorMsg></div>}
        <Table<Documento>
          rows={data} rowKey={(d) => d.id} onRowClick={(d) => setDetalle(d.id)}
          empty={loading ? 'Cargando…' : filtrosActivos ? 'Ningún documento coincide con el filtro.' : esVenta ? 'Aún no hay ventas registradas.' : 'Aún no hay compras registradas.'}
          cols={[
            { key: 'n', label: 'Número / Fecha', render: (d) => <Strong sub={fecha(d.fecha)}><Mono bold>{d.numero}</Mono></Strong> },
            { key: 't', label: esVenta ? 'Cliente' : 'Proveedor', render: (d) => (
              <Strong sub={esVenta ? d.cliente_documento : `${d.proveedor_documento}${d.numero_factura ? ' · Fact. ' + d.numero_factura : ''}`}>
                {esVenta ? d.cliente_nombre : d.proveedor_nombre}
              </Strong>
            ) },
            { key: 'c', label: esVenta ? 'Servicio' : 'Cuenta', render: (d) => esVenta
                ? <Badge tone="blue">{SERVICIOS[d.servicio || 'otro']}</Badge>
                : <span style={{ fontSize: 12 }}><Mono color={t.sky}>{d.cuenta_gasto}</Mono> <span style={{ color: t.subtext }}>{d.cuenta_gasto_nombre}</span></span> },
            { key: 'v', label: 'Vence', render: (d) => <Mono color={d.estado_pago === 'vencida' ? t.danger : t.subtext}>{fecha(d.fecha_vencimiento)}</Mono> },
            { key: 'to', label: 'Total', align: 'right', render: (d) => <Mono>{cop(d.total)}</Mono> },
            { key: 's', label: 'Saldo', align: 'right', render: (d) => <Mono bold color={Number(d.saldo) > 0 ? t.amber : t.subtext}>{cop(d.saldo)}</Mono> },
            { key: 'e', label: 'Estado', render: (d) => { const [l, tone] = ESTADO_PAGO[d.estado_pago]; return <Badge tone={tone}>{l}</Badge>; } },
            { key: 'a', label: 'Acciones', align: 'right', render: (d) => (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                {d.estado !== 'anulada' && Number(d.saldo) > 0 && (
                  <Btn small variant="link" onClick={(e) => { e.stopPropagation(); setPagoDoc(d); }}>{esVenta ? 'Cobrar' : 'Pagar'}</Btn>
                )}
                <Btn small variant="soft">Ver</Btn>
              </div>
            ) },
          ]}
        />
      </Card>

      <DocumentoModal tipo={tipo} open={nuevo} onClose={() => setNuevo(false)}
        onSaved={(id) => { setNuevo(false); reload(); setDetalle(id); }} />
      <DocumentoDetalleModal tipo={tipo} id={detalle} onClose={() => setDetalle(null)} onChanged={reload} />
      <PagoModal tipo={tipo} documento={pagoDoc} open={Boolean(pagoDoc)} onClose={() => setPagoDoc(null)}
        onSaved={() => { setPagoDoc(null); reload(); }} />
    </div>
  );
}
