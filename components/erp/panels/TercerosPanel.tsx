'use client';

import { useMemo, useState } from 'react';
import { qs, useData, useDebounced, type Tercero } from '../api';
import { TerceroDetalleModal } from '../detalles';
import { TerceroModal, type TipoTercero } from '../forms';
import {
  Badge, Btn, C, Card, CardHeader, ErrorMsg, Mono, Search, Stat, Stats, Strong, Table, Toolbar,
  cop, descargarCSV, fecha, useT,
} from '../ui';

/** Clientes (cuentas por cobrar) y Proveedores (cuentas por pagar) */
export default function TercerosPanel({ tipo }: { tipo: TipoTercero }) {
  const t = useT();
  const esCliente = tipo === 'cliente';
  const [q, setQ] = useState('');
  const [inactivos, setInactivos] = useState(false);
  const [soloSaldo, setSoloSaldo] = useState(false);
  const [nuevo, setNuevo] = useState(false);
  const [detalle, setDetalle] = useState<string | null>(null);
  const dq = useDebounced(q);

  const url = `/api/erp/${esCliente ? 'clientes' : 'proveedores'}${qs({ q: dq, inactivos: inactivos ? '1' : null })}`;
  const { data, loading, error, reload } = useData<Tercero[]>(url, []);

  const filas = useMemo(() => (soloSaldo ? data.filter((x) => Number(x.saldo) > 0) : data), [data, soloSaldo]);
  const kpi = useMemo(() => ({
    total: data.length,
    saldo: data.reduce((a, x) => a + Number(x.saldo || 0), 0),
    vencido: data.reduce((a, x) => a + Number(x.saldo_vencido || 0), 0),
    conSaldo: data.filter((x) => Number(x.saldo) > 0).length,
    movido: data.reduce((a, x) => a + Number((esCliente ? x.total_facturado : x.total_comprado) || 0), 0),
  }), [data, esCliente]);

  const exportar = () => descargarCSV(
    `${esCliente ? 'clientes' : 'proveedores'}-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Tipo doc', 'Documento', 'Nombre', 'Correo', 'Teléfono', 'Ciudad', esCliente ? 'Facturado' : 'Comprado', 'Saldo', 'Vencido'],
    filas.map((x) => [x.tipo_documento, x.numero_documento, x.nombre, x.email, x.telefono, x.ciudad,
      Number((esCliente ? x.total_facturado : x.total_comprado) || 0), Number(x.saldo), Number(x.saldo_vencido)]),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Stats>
        <Stat label={esCliente ? 'Clientes activos' : 'Proveedores activos'} value={kpi.total} color={t.text} hint={`${kpi.conSaldo} con saldo pendiente`} />
        <Stat label={esCliente ? 'Cuentas por cobrar' : 'Cuentas por pagar'} value={cop(kpi.saldo)} color={esCliente ? t.cyan : t.amber} hint="Saldo total pendiente" />
        <Stat label="Cartera vencida" value={cop(kpi.vencido)} color={kpi.vencido > 0 ? t.danger : t.subtext} hint="Facturas con vencimiento pasado" />
        <Stat label={esCliente ? 'Facturado histórico' : 'Comprado histórico'} value={cop(kpi.movido)} color={t.green} />
      </Stats>

      <Card>
        <CardHeader
          title={esCliente ? 'Listado de clientes' : 'Listado de proveedores'}
          right={
            <Toolbar>
              <Search value={q} onChange={setQ} placeholder="Nombre, documento o correo…" />
              <Btn small variant={soloSaldo ? 'link' : 'ghost'} onClick={() => setSoloSaldo((v) => !v)}>Con saldo</Btn>
              <Btn small variant={inactivos ? 'link' : 'ghost'} onClick={() => setInactivos((v) => !v)}>Inactivos</Btn>
              <Btn small variant="ghost" onClick={exportar}>CSV ↓</Btn>
              <Btn variant="primary" onClick={() => setNuevo(true)}>{esCliente ? '+ Nuevo cliente' : '+ Nuevo proveedor'}</Btn>
            </Toolbar>
          }
        />
        {error && <div style={{ padding: 16 }}><ErrorMsg>{error}</ErrorMsg></div>}
        <Table<Tercero>
          rows={filas} rowKey={(x) => x.id} onRowClick={(x) => setDetalle(x.id)}
          empty={loading ? 'Cargando…' : esCliente ? 'Aún no hay clientes. Crea el primero o convierte un lead.' : 'Aún no hay proveedores registrados.'}
          cols={[
            { key: 'n', label: esCliente ? 'Cliente / Documento' : 'Proveedor / Documento', render: (x) => (
              <Strong sub={`${x.tipo_documento} ${x.numero_documento}${x.dv ? '-' + x.dv : ''}`}>
                {x.nombre} {!x.activo && <Badge tone="red">Inactivo</Badge>}
              </Strong>
            ) },
            { key: 'c', label: 'Contacto', render: (x) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Mono>{x.telefono || '—'}</Mono>
                <span style={{ fontSize: 11, color: t.subtext }}>{x.email || ''}</span>
              </div>
            ) },
            { key: 'd', label: esCliente ? 'Ventas' : 'Compras', align: 'center', render: (x) => <Mono>{esCliente ? x.num_ventas : x.num_compras}</Mono> },
            { key: 'u', label: 'Último mov.', render: (x) => <Mono color={t.subtext}>{fecha(esCliente ? x.ultima_venta : x.ultima_compra)}</Mono> },
            { key: 'f', label: esCliente ? 'Facturado' : 'Comprado', align: 'right', render: (x) => <Mono>{cop(esCliente ? x.total_facturado : x.total_comprado)}</Mono> },
            { key: 's', label: esCliente ? 'Por cobrar' : 'Por pagar', align: 'right', render: (x) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <Mono bold color={Number(x.saldo) > 0 ? (esCliente ? t.cyan : t.amber) : t.subtext}>{cop(x.saldo)}</Mono>
                {Number(x.saldo_vencido) > 0 && <span style={{ fontSize: 10, color: t.danger, fontFamily: 'var(--mono)' }}>Vencido {cop(x.saldo_vencido)}</span>}
              </div>
            ) },
            { key: 'a', label: '', align: 'right', render: () => <Btn small variant="link">Abrir →</Btn> },
          ]}
        />
      </Card>

      <TerceroModal tipo={tipo} open={nuevo} onClose={() => setNuevo(false)}
        onSaved={(x) => { setNuevo(false); reload(); setDetalle(x.id); }} />
      <TerceroDetalleModal tipo={tipo} id={detalle} onClose={() => setDetalle(null)} onChanged={reload} />
    </div>
  );
}
