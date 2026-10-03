import { NextResponse } from 'next/server';
import { erpDb } from './db';
import { handler, leerJson, likeSeguro, ok } from './http';
import { HttpError, requerir } from './session';

/** Handlers compartidos por Ventas y Compras. */
type Tipo = 'venta' | 'compra';

const cfg = {
  venta: { vista: 'erp_ventas_v', items: 'erp_venta_items', itemsFk: 'venta_id', modulo: 'ventas',
           rpcCrear: 'erp_crear_venta', rpcAnular: 'erp_anular_venta', tercero: 'cliente_id',
           terceroNombre: 'cliente_nombre', terceroDoc: 'cliente_documento', pagosFk: 'venta_id' },
  compra: { vista: 'erp_compras_v', items: 'erp_compra_items', itemsFk: 'compra_id', modulo: 'compras',
            rpcCrear: 'erp_crear_compra', rpcAnular: 'erp_anular_compra', tercero: 'proveedor_id',
            terceroNombre: 'proveedor_nombre', terceroDoc: 'proveedor_documento', pagosFk: 'compra_id' },
} as const;

interface ItemIn { descripcion?: string; cantidad?: number | string; valor_unitario?: number | string; iva_pct?: number | string }

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function documentosHandlers(tipo: Tipo) {
  const c = cfg[tipo];

  const GET = handler(async (req: Request) => {
    await requerir(c.modulo);
    const p = new URL(req.url).searchParams;
    let query = erpDb().from(c.vista).select('*').order('fecha', { ascending: false }).order('numero', { ascending: false });
    const desde = p.get('desde'); const hasta = p.get('hasta');
    if (desde && FECHA.test(desde)) query = query.gte('fecha', desde);
    if (hasta && FECHA.test(hasta)) query = query.lte('fecha', hasta);
    const estado = p.get('estado_pago');
    if (estado && estado !== 'todos') query = query.eq('estado_pago', estado);
    const servicio = p.get('servicio');
    if (tipo === 'venta' && servicio && servicio !== 'todos') query = query.eq('servicio', servicio);
    const tercero = p.get('tercero_id');
    if (tercero) query = query.eq(c.tercero, tercero);
    const q = likeSeguro(p.get('q') || '');
    if (q) query = query.or(`numero.ilike.%${q}%,${c.terceroNombre}.ilike.%${q}%,${c.terceroDoc}.ilike.%${q}%,descripcion.ilike.%${q}%`);
    const data = ok(await query.limit(2000));
    return NextResponse.json({ data });
  });

  const POST = handler(async (req: Request) => {
    const s = await requerir(c.modulo);
    const body = await leerJson<Record<string, unknown> & { items?: ItemIn[] }>(req);
    if (!body[c.tercero]) throw new HttpError(400, tipo === 'venta' ? 'Selecciona un cliente' : 'Selecciona un proveedor');
    const items = (body.items || [])
      .map((it) => ({
        descripcion: String(it.descripcion || '').trim(),
        cantidad: Number(it.cantidad) || 1,
        valor_unitario: Number(it.valor_unitario) || 0,
        iva_pct: Number(it.iva_pct) || 0,
      }))
      .filter((it) => it.descripcion && it.valor_unitario > 0);
    if (!items.length) throw new HttpError(400, 'Agrega al menos un ítem con descripción y valor');

    const payload = { ...body, items, created_by: s.id };
    const id = ok(await erpDb().rpc(c.rpcCrear, { p: payload }));
    return NextResponse.json({ data: { id } });
  });

  const DETALLE = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requerir(c.modulo);
    const { id } = await ctx.params;
    const db = erpDb();
    const doc = ok(await db.from(c.vista).select('*').eq('id', id).maybeSingle());
    if (!doc) throw new HttpError(404, 'Documento no encontrado');
    const items = ok(await db.from(c.items).select('*').eq(c.itemsFk, id).order('id'));
    const pagos = ok(await db.from('erp_pagos').select('*').eq(c.pagosFk, id).order('fecha', { ascending: false }));
    const asientos = ok(await db.from('erp_libro_diario_v').select('*').eq('origen_id', id).order('numero').order('linea_id'));
    return NextResponse.json({ data: { documento: doc, items, pagos, asientos } });
  });

  /** PATCH /[id] { accion: 'anular', motivo } */
  const ACCION = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const s = await requerir(c.modulo);
    const { id } = await ctx.params;
    const body = await leerJson<{ accion?: string; motivo?: string }>(req);
    if (body.accion !== 'anular') throw new HttpError(400, 'Acción no soportada');
    ok(await erpDb().rpc(c.rpcAnular, { p_id: id, p_usuario: s.id, p_motivo: body.motivo || null }));
    return NextResponse.json({ success: true });
  });

  return { GET, POST, DETALLE, ACCION };
}
