'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, qs, useData, useDebounced, type Cuenta, type LineaLibro, type Tercero } from '../api';
import { useToast } from '../toast';
import {
  Badge, Btn, C, Card, CardHeader, ErrorMsg, Field, FilterSelect, Grid, Input, Modal, Mono, Search, Select, Stat, Stats,
  Toolbar, TrashIcon, cop, descargarCSV, fecha, hoy, useInputStyle, useT, type Tone,
} from '../ui';

const TIPOS: Record<string, [string, Tone]> = {
  venta: ['Venta', 'blue'], compra: ['Compra', 'yellow'], cobro: ['Cobro', 'green'],
  pago: ['Pago', 'sky'], manual: ['Manual', 'gray'], anulacion: ['Anulación', 'red'],
};

interface Asiento { id: string; numero: number; fecha: string; tipo: string; descripcion: string; tercero: string | null; anulado: boolean; lineas: LineaLibro[] }

export default function LibroDiarioPanel() {
  const t = useT();
  const [vista, setVista] = useState<'diario' | 'saldos'>('diario');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [cuenta, setCuenta] = useState('');
  const [q, setQ] = useState('');
  const [anulados, setAnulados] = useState(false);
  const [manual, setManual] = useState(false);
  const dq = useDebounced(q);

  const { data: cuentas } = useData<Cuenta[]>('/api/erp/cuentas', []);
  const url = `/api/erp/libro-diario${qs({ desde, hasta, tipo, cuenta, q: dq, anulados: anulados ? '1' : null })}`;
  const { data, loading, error, reload } = useData<LineaLibro[]>(url, []);

  const asientos = useMemo<Asiento[]>(() => {
    const m = new Map<string, Asiento>();
    for (const l of data) {
      if (!m.has(l.asiento_id)) m.set(l.asiento_id, { id: l.asiento_id, numero: l.numero, fecha: l.fecha, tipo: l.tipo, descripcion: l.descripcion, tercero: l.tercero_nombre, anulado: l.anulado, lineas: [] });
      m.get(l.asiento_id)!.lineas.push(l);
    }
    return [...m.values()];
  }, [data]);

  const tot = useMemo(() => ({
    d: data.reduce((a, l) => a + Number(l.debito), 0),
    c: data.reduce((a, l) => a + Number(l.credito), 0),
  }), [data]);

  const saldos = useMemo(() => {
    const m = new Map<string, { cuenta: string; nombre: string; d: number; c: number }>();
    for (const l of data) {
      const x = m.get(l.cuenta) || { cuenta: l.cuenta, nombre: l.cuenta_nombre, d: 0, c: 0 };
      x.d += Number(l.debito); x.c += Number(l.credito);
      m.set(l.cuenta, x);
    }
    return [...m.values()].sort((a, b) => a.cuenta.localeCompare(b.cuenta));
  }, [data]);

  const caja = saldos.filter((s) => ['1105', '1110', '1120'].includes(s.cuenta)).reduce((a, s) => a + s.d - s.c, 0);
  const cuadra = Math.abs(tot.d - tot.c) < 0.01;

  const exportar = () => descargarCSV(`libro-diario-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Asiento', 'Fecha', 'Tipo', 'Descripción', 'Tercero', 'Cuenta', 'Nombre cuenta', 'Débito', 'Crédito'],
    data.map((l) => [l.numero, l.fecha, TIPOS[l.tipo]?.[0] || l.tipo, l.descripcion, l.tercero_nombre, l.cuenta, l.cuenta_nombre, Number(l.debito), Number(l.credito)]));

  const cuentaOpts: Array<[string, string]> = [['', 'Todas las cuentas'], ...cuentas.map((c) => [c.codigo, `${c.codigo} · ${c.nombre}`] as [string, string])];
  const filtros = desde || hasta || tipo !== 'todos' || cuenta || q;
  const th = { padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: t.tableHeaderColor, fontWeight: 600 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Stats>
        <Stat label="Asientos" value={asientos.length} color={t.text} hint={filtros ? 'En el filtro actual' : 'Todos los registrados'} />
        <Stat label="Sumas débito" value={cop(tot.d)} color={t.cyan} />
        <Stat label="Sumas crédito" value={cop(tot.c)} color={t.cyan} hint={cuadra ? '✓ Sumas iguales' : '⚠ Diferencia ' + cop(tot.d - tot.c)} />
        <Stat label="Disponible (caja y bancos)" value={cop(caja)} color={caja >= 0 ? t.green : t.danger} hint={filtros ? 'Movimiento del filtro' : 'Saldo acumulado'} />
      </Stats>

      <Card>
        <CardHeader
          title={
            <div style={{ display: 'flex', gap: 6 }}>
              {(['diario', 'saldos'] as const).map((v) => (
                <Btn key={v} small variant={vista === v ? 'link' : 'ghost'} onClick={() => setVista(v)}>
                  {v === 'diario' ? 'Libro diario' : 'Saldos por cuenta'}
                </Btn>
              ))}
            </div>
          }
          right={
            <Toolbar>
              <Btn small variant="ghost" onClick={exportar}>CSV ↓</Btn>
              <Btn variant="primary" onClick={() => setManual(true)}>+ Asiento manual</Btn>
            </Toolbar>
          }
        />
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}` }}>
          <Toolbar>
            <Search value={q} onChange={setQ} placeholder="Descripción o tercero…" />
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={{ width: 150, fontSize: 12 }} />
            <span style={{ color: t.subtext, fontSize: 12 }}>a</span>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={{ width: 150, fontSize: 12 }} />
            <FilterSelect value={tipo} onChange={setTipo} options={[['todos', 'Todos los tipos'], ...Object.entries(TIPOS).map(([k, [l]]) => [k, l] as [string, string])]} />
            <FilterSelect value={cuenta} onChange={setCuenta} options={cuentaOpts} />
            <Btn small variant={anulados ? 'link' : 'ghost'} onClick={() => setAnulados((v) => !v)}>Ver reversados</Btn>
            {filtros && <Btn small variant="ghost" onClick={() => { setDesde(''); setHasta(''); setTipo('todos'); setCuenta(''); setQ(''); }}>Limpiar</Btn>}
          </Toolbar>
        </div>
        {error && <div style={{ padding: 16 }}><ErrorMsg>{error}</ErrorMsg></div>}

        {vista === 'diario' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
              <thead>
                <tr style={{ background: t.tableHeaderBg, borderBottom: `1px solid ${t.border}`, textAlign: 'left' }}>
                  <th style={{ ...th, width: 90 }}>Asiento</th>
                  <th style={{ ...th, width: 110 }}>Fecha</th>
                  <th style={th}>Cuenta / Concepto</th>
                  <th style={{ ...th, textAlign: 'right', width: 150 }}>Débito</th>
                  <th style={{ ...th, textAlign: 'right', width: 150 }}>Crédito</th>
                </tr>
              </thead>
              <tbody>
                {asientos.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: t.subtext }}>{loading ? 'Cargando…' : 'Sin movimientos. Las ventas, compras y pagos se contabilizan aquí automáticamente.'}</td></tr>
                )}
                {asientos.map((a) => {
                  const [tl, tone] = TIPOS[a.tipo] || [a.tipo, 'gray'];
                  return [
                    <tr key={a.id} style={{ borderTop: `1px solid ${t.border}`, background: t.isDark ? 'rgba(255,255,255,0.02)' : '#FAFBFD', opacity: a.anulado ? 0.5 : 1 }}>
                      <td style={{ padding: '12px 16px' }}><Mono bold>#{a.numero}</Mono></td>
                      <td style={{ padding: '12px 16px' }}><Mono color={t.subtext}>{fecha(a.fecha)}</Mono></td>
                      <td colSpan={3} style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Badge tone={tone}>{tl}</Badge>
                          <span style={{ fontWeight: 600 }}>{a.descripcion}</span>
                          {a.tercero && <span style={{ color: t.subtext, fontSize: 12 }}>· {a.tercero}</span>}
                          {a.anulado && <Badge tone="gray">Reversado</Badge>}
                        </div>
                      </td>
                    </tr>,
                    ...a.lineas.map((l) => (
                      <tr key={l.linea_id} style={{ borderTop: `1px solid ${t.tableRowBorder}`, opacity: a.anulado ? 0.5 : 1 }}>
                        <td /><td />
                        <td style={{ padding: '7px 16px', paddingLeft: Number(l.credito) > 0 ? 44 : 16 }}>
                          <Mono color={t.sky}>{l.cuenta}</Mono> <span>{l.cuenta_nombre}</span>
                          {l.linea_descripcion && <span style={{ color: t.subtext, fontSize: 11 }}> — {l.linea_descripcion}</span>}
                        </td>
                        <td style={{ padding: '7px 16px', textAlign: 'right' }}>{Number(l.debito) > 0 && <Mono>{cop(l.debito)}</Mono>}</td>
                        <td style={{ padding: '7px 16px', textAlign: 'right' }}>{Number(l.credito) > 0 && <Mono>{cop(l.credito)}</Mono>}</td>
                      </tr>
                    )),
                  ];
                })}
              </tbody>
              {asientos.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${t.border}`, background: t.tableHeaderBg }}>
                    <td colSpan={3} style={{ padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', color: t.subtext }}>
                      Sumas {cuadra ? <span style={{ color: t.green }}>· iguales ✓</span> : <span style={{ color: t.danger }}>· descuadre</span>}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}><Mono bold>{cop(tot.d)}</Mono></td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}><Mono bold>{cop(tot.c)}</Mono></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
              <thead>
                <tr style={{ background: t.tableHeaderBg, textAlign: 'left' }}>
                  <th style={th}>Cuenta</th>
                  <th style={{ ...th, textAlign: 'right' }}>Débitos</th>
                  <th style={{ ...th, textAlign: 'right' }}>Créditos</th>
                  <th style={{ ...th, textAlign: 'right' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {saldos.length === 0 && <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: t.subtext }}>Sin movimientos.</td></tr>}
                {saldos.map((s) => {
                  const nat = cuentas.find((c) => c.codigo === s.cuenta)?.naturaleza || 'debito';
                  const saldo = nat === 'debito' ? s.d - s.c : s.c - s.d;
                  return (
                    <tr key={s.cuenta} style={{ borderTop: `1px solid ${t.tableRowBorder}`, cursor: 'pointer' }} onClick={() => { setCuenta(s.cuenta); setVista('diario'); }}>
                      <td style={{ padding: '10px 16px' }}><Mono color={t.sky}>{s.cuenta}</Mono> {s.nombre}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}><Mono>{cop(s.d)}</Mono></td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}><Mono>{cop(s.c)}</Mono></td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}><Mono bold color={saldo < 0 ? t.danger : t.text}>{cop(saldo)}</Mono></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AsientoManualModal open={manual} cuentas={cuentas} onClose={() => setManual(false)} onSaved={() => { setManual(false); reload(); }} />
    </div>
  );
}

/* ── Asiento manual ──────────────────────────────────────── */
interface LineaForm { cuenta: string; debito: string; credito: string; descripcion: string }
const lineaVacia = (): LineaForm => ({ cuenta: '', debito: '', credito: '', descripcion: '' });

function AsientoManualModal({ open, cuentas, onClose, onSaved }: { open: boolean; cuentas: Cuenta[]; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const notify = useToast();
  const s = useInputStyle();
  const [fechaA, setFechaA] = useState(hoy());
  const [descripcion, setDescripcion] = useState('');
  const [terceroTipo, setTerceroTipo] = useState('');
  const [terceroId, setTerceroId] = useState('');
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [lineas, setLineas] = useState<LineaForm[]>([lineaVacia(), lineaVacia()]);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFechaA(hoy()); setDescripcion(''); setTerceroTipo(''); setTerceroId(''); setLineas([lineaVacia(), lineaVacia()]); setErr('');
  }, [open]);

  useEffect(() => {
    setTerceroId('');
    if (!terceroTipo) { setTerceros([]); return; }
    api<Tercero[]>(terceroTipo === 'cliente' ? '/api/erp/clientes' : '/api/erp/proveedores').then(setTerceros).catch(() => setTerceros([]));
  }, [terceroTipo]);

  const d = lineas.reduce((a, l) => a + (Number(l.debito) || 0), 0);
  const c = lineas.reduce((a, l) => a + (Number(l.credito) || 0), 0);
  const cuadra = d > 0 && Math.abs(d - c) < 0.005;
  const setL = (i: number, k: keyof LineaForm, v: string) => setLineas((x) => x.map((l, j) => {
    if (j !== i) return l;
    const n = { ...l, [k]: v };
    if (k === 'debito' && Number(v) > 0) n.credito = '';
    if (k === 'credito' && Number(v) > 0) n.debito = '';
    return n;
  }));

  const guardar = async () => {
    setSaving(true); setErr('');
    try {
      await api('/api/erp/libro-diario', { method: 'POST', body: { fecha: fechaA, descripcion, tercero_tipo: terceroTipo || null, tercero_id: terceroId || null, lineas } });
      notify('Asiento registrado');
      onSaved();
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} width={820} eyebrow="Libro diario" title="Asiento contable manual"
      footer={<>
        <span style={{ marginRight: 'auto', fontFamily: 'var(--mono)', fontSize: 12, color: cuadra ? t.green : t.amber, alignSelf: 'center' }}>
          {cuadra ? '✓ Cuadrado' : `Diferencia: ${cop(d - c)}`}
        </span>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={guardar} disabled={saving || !cuadra || !descripcion.trim()}>{saving ? 'Guardando…' : 'Registrar asiento'}</Btn>
      </>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ErrorMsg>{err}</ErrorMsg>
        <Grid cols={3}>
          <Field label="Fecha"><Input type="date" value={fechaA} onChange={(e) => setFechaA(e.target.value)} /></Field>
          <Field label="Descripción" span={2}><Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej. Aporte de capital, nómina de octubre, ajuste…" /></Field>
          <Field label="Tercero (opcional)">
            <Select value={terceroTipo} onChange={(e) => setTerceroTipo(e.target.value)} options={[['', 'Sin tercero'], ['cliente', 'Cliente'], ['proveedor', 'Proveedor']]} />
          </Field>
          {terceroTipo && (
            <Field label={terceroTipo === 'cliente' ? 'Cliente' : 'Proveedor'} span={2}>
              <Select value={terceroId} onChange={(e) => setTerceroId(e.target.value)} options={[['', 'Selecciona…'], ...terceros.map((x) => [x.id, x.nombre] as [string, string])]} />
            </Field>
          )}
        </Grid>
        <div style={{ border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
              <thead>
                <tr style={{ background: t.tableHeaderBg, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: t.tableHeaderColor, textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Cuenta</th><th style={{ padding: 10 }}>Detalle</th>
                  <th style={{ padding: 10, textAlign: 'right', width: 140 }}>Débito</th><th style={{ padding: 10, textAlign: 'right', width: 140 }}>Crédito</th><th style={{ width: 36 }} />
                </tr>
              </thead>
              <tbody>
                {lineas.map((l, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${t.tableRowBorder}` }}>
                    <td style={{ padding: 6, minWidth: 220 }}>
                      <select value={l.cuenta} onChange={(e) => setL(i, 'cuenta', e.target.value)} style={s}>
                        <option value="" style={{ background: t.modalBg }}>Cuenta…</option>
                        {cuentas.map((c) => <option key={c.codigo} value={c.codigo} style={{ background: t.modalBg }}>{c.codigo} · {c.nombre}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 6 }}><input value={l.descripcion} onChange={(e) => setL(i, 'descripcion', e.target.value)} style={s} /></td>
                    <td style={{ padding: 6 }}><input type="number" min={0} step="any" value={l.debito} onChange={(e) => setL(i, 'debito', e.target.value)} style={{ ...s, textAlign: 'right', fontFamily: 'var(--mono)' }} /></td>
                    <td style={{ padding: 6 }}><input type="number" min={0} step="any" value={l.credito} onChange={(e) => setL(i, 'credito', e.target.value)} style={{ ...s, textAlign: 'right', fontFamily: 'var(--mono)' }} /></td>
                    <td style={{ padding: 6 }}>{lineas.length > 2 && <button onClick={() => setLineas((x) => x.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: t.danger, cursor: 'pointer' }}><TrashIcon /></button>}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `1px solid ${t.border}`, background: t.tableHeaderBg }}>
                  <td colSpan={2} style={{ padding: 10 }}><Btn small variant="ghost" onClick={() => setLineas((x) => [...x, lineaVacia()])}>+ Línea</Btn></td>
                  <td style={{ padding: 10, textAlign: 'right' }}><Mono bold>{cop(d)}</Mono></td>
                  <td style={{ padding: 10, textAlign: 'right' }}><Mono bold>{cop(c)}</Mono></td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
