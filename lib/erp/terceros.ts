import { NextResponse } from 'next/server';
import { erpDb } from './db';
import { handler, leerJson, likeSeguro, ok, pick } from './http';
import { HttpError, requerir } from './session';

/** Handlers compartidos por Clientes y Proveedores (misma estructura de tercero). */
type Tipo = 'cliente' | 'proveedor';

const CAMPOS_BASE = [
  'tipo_persona', 'tipo_documento', 'numero_documento', 'dv', 'nombre', 'nombre_comercial',
  'email', 'telefono', 'direccion', 'ciudad', 'responsable_iva', 'dias_credito', 'notas', 'activo',
] as const;
const CAMPOS_PROV = [...CAMPOS_BASE, 'banco', 'tipo_cuenta', 'numero_cuenta'] as const;

const cfg = {
  cliente: { tabla: 'erp_clientes', vista: 'erp_clientes_v', modulo: 'clientes', campos: CAMPOS_BASE,
             docs: 'erp_ventas_v', fk: 'cliente_id', pagosFk: 'venta_id', key: 'cliente' },
  proveedor: { tabla: 'erp_proveedores', vista: 'erp_proveedores_v', modulo: 'proveedores', campos: CAMPOS_PROV,
               docs: 'erp_compras_v', fk: 'proveedor_id', pagosFk: 'compra_id', key: 'proveedor' },
} as const;

function limpiar(tipo: Tipo, body: Record<string, unknown>, creando: boolean) {
  const data = pick(body, cfg[tipo].campos);
  if (creando) {
    if (!data.nombre) throw new HttpError(400, 'El nombre es obligatorio');
    if (!data.numero_documento) throw new HttpError(400, 'El número de documento es obligatorio');
  }
  if (data.numero_documento) data.numero_documento = String(data.numero_documento).replace(/[^0-9A-Za-z]/g, '');
  if ('dias_credito' in data) data.dias_credito = Math.max(0, Number(data.dias_credito) || 0);
  if ('responsable_iva' in data) data.responsable_iva = Boolean(data.responsable_iva);
  if ('activo' in data) data.activo = data.activo !== false;
  return data;
}

export function tercerosHandlers(tipo: Tipo) {
  const c = cfg[tipo];

  const GET = handler(async (req: Request) => {
    await requerir(c.modulo);
    const url = new URL(req.url);
    const q = likeSeguro(url.searchParams.get('q') || '');
    const incluirInactivos = url.searchParams.get('inactivos') === '1';
    let query = erpDb().from(c.vista).select('*').order('nombre');
    if (!incluirInactivos) query = query.eq('activo', true);
    if (q) query = query.or(`nombre.ilike.%${q}%,numero_documento.ilike.%${q}%,email.ilike.%${q}%,nombre_comercial.ilike.%${q}%`);
    const data = ok(await query.limit(1000));
    return NextResponse.json({ data });
  });

  const POST = handler(async (req: Request) => {
    const s = await requerir(c.modulo);
    const body = await leerJson(req);
    const data = { ...limpiar(tipo, body, true), created_by: s.id };
    const row = ok(await erpDb().from(c.tabla).insert(data).select('*').single());
    return NextResponse.json({ data: row });
  });

  const PATCH = handler(async (req: Request) => {
    await requerir(c.modulo);
    const body = await leerJson(req);
    if (!body.id) throw new HttpError(400, 'ID requerido');
    const data = { ...limpiar(tipo, body, false), updated_at: new Date().toISOString() };
    const row = ok(await erpDb().from(c.tabla).update(data).eq('id', body.id as string).select('*').single());
    return NextResponse.json({ data: row });
  });

  /** Detalle: datos del tercero + documentos + pagos (estado de cuenta) */
  const DETALLE = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requerir(c.modulo);
    const { id } = await ctx.params;
    const db = erpDb();
    const tercero = ok(await db.from(c.vista).select('*').eq('id', id).maybeSingle());
    if (!tercero) throw new HttpError(404, 'No encontrado');
    const documentos = ok(await db.from(c.docs).select('*').eq(c.fk, id).order('fecha', { ascending: false }));
    const ids = (documentos as Array<{ id: string }>).map((d) => d.id);
    const pagos = ids.length
      ? ok(await db.from('erp_pagos').select('*').in(c.pagosFk, ids).order('fecha', { ascending: false }))
      : [];
    return NextResponse.json({ data: { [c.key]: tercero, documentos, pagos } });
  });

  return { GET, POST, PATCH, DETALLE };
}
