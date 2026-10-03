import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { handler, leerJson, ok } from '@/lib/erp/http';
import { HttpError, requerir } from '@/lib/erp/session';

/* POST — registra un cobro (venta) o un pago (compra) */
export const POST = handler(async (req: Request) => {
  const body = await leerJson(req);
  const tipo = body.tipo;
  if (tipo !== 'cobro' && tipo !== 'pago') throw new HttpError(400, 'Tipo inválido');
  const s = await requerir(tipo === 'cobro' ? 'ventas' : 'compras');
  const payload = {
    tipo,
    venta_id: tipo === 'cobro' ? body.venta_id : undefined,
    compra_id: tipo === 'pago' ? body.compra_id : undefined,
    fecha: body.fecha, valor: body.valor, medio: body.medio, cuenta: body.cuenta,
    referencia: body.referencia, notas: body.notas, created_by: s.id,
  };
  const id = ok(await erpDb().rpc('erp_registrar_pago', { p: payload }));
  return NextResponse.json({ data: { id } });
});

/* PATCH — { id, accion: 'anular', motivo } */
export const PATCH = handler(async (req: Request) => {
  const body = await leerJson<{ id?: string; accion?: string; motivo?: string }>(req);
  if (!body.id || body.accion !== 'anular') throw new HttpError(400, 'Petición inválida');
  const db = erpDb();
  const pago = ok(await db.from('erp_pagos').select('tipo').eq('id', body.id).maybeSingle()) as { tipo: string } | null;
  if (!pago) throw new HttpError(404, 'Pago no encontrado');
  const s = await requerir(pago.tipo === 'cobro' ? 'ventas' : 'compras');
  ok(await db.rpc('erp_anular_pago', { p_id: body.id, p_usuario: s.id, p_motivo: body.motivo || null }));
  return NextResponse.json({ success: true });
});
