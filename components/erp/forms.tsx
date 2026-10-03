'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, type Cuenta, type Documento, type Tercero } from './api';
import { useToast } from './toast';
import {
  Btn, C, ErrorMsg, Field, Grid, Input, Modal, Select, TextArea, TrashIcon, cop, hoy, useInputStyle, useT,
} from './ui';

export type TipoTercero = 'cliente' | 'proveedor';
export type TipoDoc = 'venta' | 'compra';

const TIPOS_DOC: Array<[string, string]> = [
  ['CC', 'Cédula de ciudadanía'], ['NIT', 'NIT'], ['CE', 'Cédula de extranjería'],
  ['PAS', 'Pasaporte'], ['PPT', 'Permiso por protección temporal'], ['TI', 'Tarjeta de identidad'],
];

export const MEDIOS: Array<[string, string]> = [
  ['transferencia', 'Transferencia'], ['efectivo', 'Efectivo'], ['tarjeta', 'Tarjeta'],
  ['wompi', 'Wompi'], ['cheque', 'Cheque'], ['otro', 'Otro'],
];
export const CUENTAS_DINERO: Array<[string, string]> = [['1110', '1110 · Bancos'], ['1120', '1120 · Cuentas de ahorro'], ['1105', '1105 · Caja']];

/* ============================================================
   CLIENTE / PROVEEDOR
   ============================================================ */
type TerceroForm = Record<string, string | number | boolean>;

const vacio = (tipo: TipoTercero): TerceroForm => ({
  tipo_persona: tipo === 'cliente' ? 'natural' : 'juridica',
  tipo_documento: tipo === 'cliente' ? 'CC' : 'NIT',
  numero_documento: '', dv: '', nombre: '', nombre_comercial: '', email: '', telefono: '',
  direccion: '', ciudad: '', dias_credito: 0, responsable_iva: false, notas: '',
  banco: '', tipo_cuenta: '', numero_cuenta: '', activo: true,
});

export function TerceroModal({ tipo, open, initial, prefill, onClose, onSaved }: {
  tipo: TipoTercero; open: boolean; initial?: Tercero | null; prefill?: Partial<TerceroForm>;
  onClose: () => void; onSaved: (t: Tercero) => void;
}) {
  const t = useT();
  const notify = useToast();
  const [f, setF] = useState<TerceroForm>(vacio(tipo));
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr('');
    if (initial) {
      const base = vacio(tipo);
      for (const k of Object.keys(base)) {
        const v = (initial as unknown as Record<string, unknown>)[k];
        base[k] = v == null ? (typeof base[k] === 'boolean' ? false : '') : (v as string | number | boolean);
      }
      setF(base);
    } else {
      setF({ ...vacio(tipo), ...(prefill || {}) } as TerceroForm);
    }
  }, [open, initial, prefill, tipo]);

  const set = (k: string, v: string | number | boolean) => setF((x) => ({ ...x, [k]: v }));
  const juridica = f.tipo_persona === 'juridica';

  const guardar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!String(f.nombre).trim() || !String(f.numero_documento).trim()) {
      setErr('Nombre y número de documento son obligatorios');
      return;
    }
    setSaving(true); setErr('');
    try {
      const url = tipo === 'cliente' ? '/api/erp/clientes' : '/api/erp/proveedores';
      const body = initial ? { ...f, id: initial.id } : f;
      const row = await api<Tercero>(url, { method: initial ? 'PATCH' : 'POST', body });
      notify(initial ? 'Cambios guardados' : `${tipo === 'cliente' ? 'Cliente' : 'Proveedor'} creado`);
      onSaved(row);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const nombreTipo = tipo === 'cliente' ? 'cliente' : 'proveedor';
  return (
    <Modal
      open={open} onClose={onClose} width={640}
      eyebrow={tipo === 'cliente' ? 'Clientes' : 'Proveedores'}
      title={initial ? `Editar ${nombreTipo}` : `Nuevo ${nombreTipo}`}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={() => guardar()} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Btn>
      </>}
    >
      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ErrorMsg>{err}</ErrorMsg>
        <Grid>
          <Field label="Tipo de persona">
            <Select value={String(f.tipo_persona)} onChange={(e) => {
              set('tipo_persona', e.target.value);
              if (!initial) set('tipo_documento', e.target.value === 'juridica' ? 'NIT' : 'CC');
            }} options={[['natural', 'Persona natural'], ['juridica', 'Persona jurídica']]} />
          </Field>
          <Field label="Tipo de documento">
            <Select value={String(f.tipo_documento)} onChange={(e) => set('tipo_documento', e.target.value)} options={TIPOS_DOC} />
          </Field>
          <Field label="Número de documento">
            <div style={{ display: 'flex', gap: 8 }}>
              <Input required value={String(f.numero_documento)} onChange={(e) => set('numero_documento', e.target.value)} placeholder="Sin puntos ni guiones" style={{ fontFamily: 'var(--mono)' }} />
              {f.tipo_documento === 'NIT' && (
                <Input value={String(f.dv)} onChange={(e) => set('dv', e.target.value.slice(0, 1))} placeholder="DV" style={{ width: 56, textAlign: 'center', fontFamily: 'var(--mono)' }} />
              )}
            </div>
          </Field>
          <Field label={juridica ? 'Razón social' : 'Nombre completo'}>
            <Input required value={String(f.nombre)} onChange={(e) => set('nombre', e.target.value)} />
          </Field>
          {juridica && (
            <Field label="Nombre comercial" span={2}>
              <Input value={String(f.nombre_comercial)} onChange={(e) => set('nombre_comercial', e.target.value)} />
            </Field>
          )}
          <Field label="Correo"><Input type="email" value={String(f.email)} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Teléfono / celular"><Input value={String(f.telefono)} onChange={(e) => set('telefono', e.target.value)} /></Field>
          <Field label="Dirección"><Input value={String(f.direccion)} onChange={(e) => set('direccion', e.target.value)} /></Field>
          <Field label="Ciudad"><Input value={String(f.ciudad)} onChange={(e) => set('ciudad', e.target.value)} /></Field>
          <Field label="Días de crédito" hint="Se usa para calcular el vencimiento de cada factura">
            <Input type="number" min={0} value={Number(f.dias_credito)} onChange={(e) => set('dias_credito', Number(e.target.value))} />
          </Field>
          <Field label="Régimen IVA">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.text, padding: '9px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={Boolean(f.responsable_iva)} onChange={(e) => set('responsable_iva', e.target.checked)} />
              Responsable de IVA
            </label>
          </Field>
          {tipo === 'proveedor' && (<>
            <Field label="Banco"><Input value={String(f.banco)} onChange={(e) => set('banco', e.target.value)} /></Field>
            <Field label="Tipo de cuenta">
              <Select value={String(f.tipo_cuenta)} onChange={(e) => set('tipo_cuenta', e.target.value)} options={[['', '—'], ['ahorros', 'Ahorros'], ['corriente', 'Corriente']]} />
            </Field>
            <Field label="Número de cuenta" span={2}><Input value={String(f.numero_cuenta)} onChange={(e) => set('numero_cuenta', e.target.value)} style={{ fontFamily: 'var(--mono)' }} /></Field>
          </>)}
          <Field label="Notas" span={2}><TextArea value={String(f.notas)} onChange={(e) => set('notas', e.target.value)} /></Field>
          {initial && (
            <Field label="Estado" span={2}>
              <Select value={f.activo ? '1' : '0'} onChange={(e) => set('activo', e.target.value === '1')} options={[['1', 'Activo'], ['0', 'Inactivo (oculto de los listados)']]} />
            </Field>
          )}
        </Grid>
      </form>
    </Modal>
  );
}

/* ============================================================
   VENTA / COMPRA
   ============================================================ */
interface ItemForm { descripcion: string; cantidad: string; valor_unitario: string; iva_pct: string }
const itemVacio = (): ItemForm => ({ descripcion: '', cantidad: '1', valor_unitario: '', iva_pct: '0' });

const RETENCIONES_VENTA: Array<[string, string]> = [
  ['0', 'Sin retención'], ['4', '4% · Servicios (declarante)'], ['6', '6% · Servicios (no declarante)'],
  ['10', '10% · Honorarios (no declarante)'], ['11', '11% · Honorarios (declarante)'],
];
const RETENCIONES_COMPRA: Array<[string, string]> = [
  ['0', 'Sin retención'], ['2.5', '2,5% · Compras'], ['4', '4% · Servicios (declarante)'],
  ['6', '6% · Servicios (no declarante)'], ['10', '10% · Honorarios'], ['11', '11% · Honorarios (declarante)'],
  ['3.5', '3,5% · Arrendamientos'],
];

export function DocumentoModal({ tipo, open, terceroId, onClose, onSaved }: {
  tipo: TipoDoc; open: boolean; terceroId?: string | null; onClose: () => void; onSaved: (id: string) => void;
}) {
  const t = useT();
  const notify = useToast();
  const inputStyle = useInputStyle();
  const esVenta = tipo === 'venta';
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [nuevoTercero, setNuevoTercero] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const [tercero, setTercero] = useState('');
  const [fechaDoc, setFechaDoc] = useState(hoy());
  const [vence, setVence] = useState('');
  const [servicio, setServicio] = useState('contabilidad');
  const [numFactura, setNumFactura] = useState('');
  const [cuentaGasto, setCuentaGasto] = useState('5195');
  const [descripcion, setDescripcion] = useState('');
  const [retPct, setRetPct] = useState('0');
  const [items, setItems] = useState<ItemForm[]>([itemVacio()]);

  useEffect(() => {
    if (!open) return;
    setErr(''); setTercero(terceroId || ''); setFechaDoc(hoy()); setVence(''); setNumFactura('');
    setDescripcion(''); setRetPct('0'); setItems([itemVacio()]); setServicio('contabilidad'); setCuentaGasto('5195');
    api<Tercero[]>(esVenta ? '/api/erp/clientes' : '/api/erp/proveedores').then(setTerceros).catch((e) => setErr(e.message));
    if (!esVenta) api<Cuenta[]>('/api/erp/cuentas').then(setCuentas).catch(() => {});
  }, [open, terceroId, esVenta]);

  const terceroSel = terceros.find((x) => x.id === tercero);
  const venceSugerido = useMemo(() => {
    if (!terceroSel || !fechaDoc) return '';
    const d = new Date(fechaDoc + 'T12:00:00');
    d.setDate(d.getDate() + (terceroSel.dias_credito || 0));
    return d.toISOString().slice(0, 10);
  }, [terceroSel, fechaDoc]);

  const tot = useMemo(() => {
    let sub = 0, iva = 0;
    for (const it of items) {
      const s = Math.round((Number(it.cantidad) || 0) * (Number(it.valor_unitario) || 0) * 100) / 100;
      sub += s;
      iva += Math.round(s * (Number(it.iva_pct) || 0)) / 100;
    }
    const ret = Math.round(sub * (Number(retPct) || 0)) / 100;
    return { sub, iva, ret, total: sub + iva, neto: sub + iva - ret };
  }, [items, retPct]);

  const setItem = (i: number, k: keyof ItemForm, v: string) => setItems((x) => x.map((it, j) => (j === i ? { ...it, [k]: v } : it)));

  const guardar = async () => {
    setSaving(true); setErr('');
    try {
      const body: Record<string, unknown> = {
        [esVenta ? 'cliente_id' : 'proveedor_id']: tercero,
        fecha: fechaDoc, fecha_vencimiento: vence || null, descripcion, retencion_pct: Number(retPct) || 0, items,
      };
      if (esVenta) body.servicio = servicio;
      else { body.numero_factura = numFactura; body.cuenta_gasto = cuentaGasto; }
      const r = await api<{ id: string }>(esVenta ? '/api/erp/ventas' : '/api/erp/compras', { method: 'POST', body });
      notify(esVenta ? 'Venta registrada y contabilizada' : 'Compra registrada y contabilizada');
      onSaved(r.id);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const cuentasGasto: Array<[string, string]> = cuentas
    .filter((c) => c.clase === 5 || c.clase === 6 || ['1435', '1524', '1528'].includes(c.codigo))
    .map((c) => [c.codigo, `${c.codigo} · ${c.nombre}`]);

  const cell = { padding: '6px 4px', verticalAlign: 'top' } as const;
  return (
    <>
      <Modal
        open={open && !nuevoTercero} onClose={onClose} width={820}
        eyebrow={esVenta ? 'Ventas' : 'Compras'}
        title={esVenta ? 'Nueva factura de venta' : 'Registrar compra'}
        footer={<>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" onClick={guardar} disabled={saving || !tercero}>{saving ? 'Guardando…' : esVenta ? 'Emitir venta' : 'Registrar compra'}</Btn>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ErrorMsg>{err}</ErrorMsg>
          <Grid cols={3}>
            <Field label={esVenta ? 'Cliente' : 'Proveedor'} span={2}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Select value={tercero} onChange={(e) => setTercero(e.target.value)}
                  options={[['', esVenta ? 'Selecciona un cliente…' : 'Selecciona un proveedor…'], ...terceros.map((x) => [x.id, `${x.nombre} · ${x.tipo_documento} ${x.numero_documento}`] as [string, string])]} />
                <Btn variant="soft" small onClick={() => setNuevoTercero(true)} title="Crear nuevo">+ Nuevo</Btn>
              </div>
            </Field>
            {esVenta ? (
              <Field label="Servicio">
                <Select value={servicio} onChange={(e) => setServicio(e.target.value)} options={[['contabilidad', 'Contabilidad'], ['nomina', 'Nómina'], ['renta', 'Renta persona natural'], ['personalizado', 'Servicio personalizado'], ['otro', 'Otro']]} />
              </Field>
            ) : (
              <Field label="N° factura proveedor">
                <Input value={numFactura} onChange={(e) => setNumFactura(e.target.value)} placeholder="Ej. FE-1234" style={{ fontFamily: 'var(--mono)' }} />
              </Field>
            )}
            <Field label="Fecha"><Input type="date" value={fechaDoc} onChange={(e) => setFechaDoc(e.target.value)} /></Field>
            <Field label="Vencimiento" hint={venceSugerido && !vence ? `Por defecto: ${venceSugerido}` : undefined}>
              <Input type="date" value={vence} onChange={(e) => setVence(e.target.value)} />
            </Field>
            {!esVenta ? (
              <Field label="Cuenta de gasto (PUC)">
                <Select value={cuentaGasto} onChange={(e) => setCuentaGasto(e.target.value)} options={cuentasGasto.length ? cuentasGasto : [['5195', '5195 · Gastos diversos']]} />
              </Field>
            ) : <div />}
            <Field label="Descripción" span={2}>
              <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder={esVenta ? 'Ej. Contabilidad mensual octubre' : 'Ej. Hosting anual'} />
            </Field>
          </Grid>

          <div style={{ border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 620 }}>
                <thead>
                  <tr style={{ background: t.tableHeaderBg, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: t.tableHeaderColor }}>
                    <th style={{ padding: '10px 10px', textAlign: 'left' }}>Concepto</th>
                    <th style={{ padding: '10px 6px', textAlign: 'right', width: 80 }}>Cant.</th>
                    <th style={{ padding: '10px 6px', textAlign: 'right', width: 150 }}>Valor unit.</th>
                    <th style={{ padding: '10px 6px', textAlign: 'right', width: 90 }}>IVA</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', width: 130 }}>Subtotal</th>
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => {
                    const sub = (Number(it.cantidad) || 0) * (Number(it.valor_unitario) || 0);
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${t.tableRowBorder}` }}>
                        <td style={{ ...cell, paddingLeft: 8 }}><input value={it.descripcion} onChange={(e) => setItem(i, 'descripcion', e.target.value)} placeholder="Descripción" style={inputStyle} /></td>
                        <td style={cell}><input type="number" min={0} step="any" value={it.cantidad} onChange={(e) => setItem(i, 'cantidad', e.target.value)} style={{ ...inputStyle, textAlign: 'right', fontFamily: 'var(--mono)' }} /></td>
                        <td style={cell}><input type="number" min={0} step="any" value={it.valor_unitario} onChange={(e) => setItem(i, 'valor_unitario', e.target.value)} placeholder="0" style={{ ...inputStyle, textAlign: 'right', fontFamily: 'var(--mono)' }} /></td>
                        <td style={cell}>
                          <select value={it.iva_pct} onChange={(e) => setItem(i, 'iva_pct', e.target.value)} style={{ ...inputStyle, fontFamily: 'var(--mono)' }}>
                            {['0', '5', '19'].map((v) => <option key={v} value={v} style={{ background: t.modalBg }}>{v}%</option>)}
                          </select>
                        </td>
                        <td style={{ ...cell, paddingRight: 10, textAlign: 'right', fontFamily: 'var(--mono)', paddingTop: 15 }}>{cop(sub)}</td>
                        <td style={{ ...cell, paddingTop: 10 }}>
                          {items.length > 1 && (
                            <button type="button" onClick={() => setItems((x) => x.filter((_, j) => j !== i))} title="Quitar" style={{ background: 'none', border: 'none', color: t.danger, cursor: 'pointer', padding: 4 }}><TrashIcon /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: 10, borderTop: `1px solid ${t.tableRowBorder}` }}>
              <Btn small variant="ghost" onClick={() => setItems((x) => [...x, itemVacio()])}>+ Agregar ítem</Btn>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(240px, 320px)', gap: 20, alignItems: 'start' }} className="erp-grid">
            <Field label={esVenta ? 'Retención que te practica el cliente' : 'Retención que practicas al proveedor'}
              hint="Se calcula sobre el subtotal antes de IVA">
              <Select value={retPct} onChange={(e) => setRetPct(e.target.value)} options={esVenta ? RETENCIONES_VENTA : RETENCIONES_COMPRA} />
            </Field>
            <div style={{ background: t.softBg, borderRadius: 14, padding: '12px 16px', fontSize: 13 }}>
              {[['Subtotal', tot.sub], ['IVA', tot.iva], ['Total factura', tot.total], ['(–) Retención', -tot.ret]].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: t.subtext }}>
                  <span>{k}</span><span style={{ fontFamily: 'var(--mono)', color: t.text }}>{cop(v as number)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 6, borderTop: `1px solid ${t.border}`, fontWeight: 700 }}>
                <span>{esVenta ? 'Neto a cobrar' : 'Neto a pagar'}</span>
                <span style={{ fontFamily: 'var(--mono)', color: esVenta ? t.green : t.amber }}>{cop(tot.neto)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <TerceroModal
        tipo={esVenta ? 'cliente' : 'proveedor'} open={nuevoTercero}
        onClose={() => setNuevoTercero(false)}
        onSaved={(nt) => { setTerceros((x) => [...x, nt].sort((a, b) => a.nombre.localeCompare(b.nombre))); setTercero(nt.id); setNuevoTercero(false); }}
      />
    </>
  );
}

/* ============================================================
   COBRO / PAGO
   ============================================================ */
export function PagoModal({ documento, tipo, open, onClose, onSaved }: {
  documento: Documento | null; tipo: TipoDoc; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const notify = useToast();
  const esCobro = tipo === 'venta';
  const [fechaP, setFechaP] = useState(hoy());
  const [valor, setValor] = useState('');
  const [medio, setMedio] = useState('transferencia');
  const [cuenta, setCuenta] = useState('1110');
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !documento) return;
    setFechaP(hoy()); setValor(String(Number(documento.saldo) || '')); setMedio('transferencia');
    setCuenta('1110'); setReferencia(''); setNotas(''); setErr('');
  }, [open, documento]);

  if (!documento) return null;
  const guardar = async () => {
    setSaving(true); setErr('');
    try {
      await api('/api/erp/pagos', {
        method: 'POST',
        body: {
          tipo: esCobro ? 'cobro' : 'pago',
          [esCobro ? 'venta_id' : 'compra_id']: documento.id,
          fecha: fechaP, valor: Number(valor), medio, cuenta, referencia, notas,
        },
      });
      notify(esCobro ? 'Cobro registrado' : 'Pago registrado');
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={520}
      eyebrow={`${documento.numero} · Saldo ${cop(documento.saldo)}`}
      title={esCobro ? 'Registrar cobro' : 'Registrar pago'}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={guardar} disabled={saving || !(Number(valor) > 0)}>{saving ? 'Guardando…' : 'Registrar'}</Btn>
      </>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ErrorMsg>{err}</ErrorMsg>
        <Grid>
          <Field label="Fecha"><Input type="date" value={fechaP} onChange={(e) => setFechaP(e.target.value)} /></Field>
          <Field label="Valor">
            <Input type="number" min={0} step="any" value={valor} onChange={(e) => setValor(e.target.value)} />
          </Field>
          <Field label="Medio"><Select value={medio} onChange={(e) => { setMedio(e.target.value); if (e.target.value === 'efectivo') setCuenta('1105'); }} options={MEDIOS} /></Field>
          <Field label={esCobro ? 'Entra a' : 'Sale de'}><Select value={cuenta} onChange={(e) => setCuenta(e.target.value)} options={CUENTAS_DINERO} /></Field>
          <Field label="Referencia" span={2}><Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="N° de transacción, comprobante…" /></Field>
          <Field label="Notas" span={2}><TextArea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} /></Field>
        </Grid>
      </div>
    </Modal>
  );
}
