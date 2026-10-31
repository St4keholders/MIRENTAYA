import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { handler, leerJson, ok } from '@/lib/erp/http';
import { HttpError, requerir } from '@/lib/erp/session';

const UUID = /^[0-9a-f-]{36}$/i;

/** Acciones sobre una búsqueda: cancelar (si está en cola) o reintentar (si falló). */
export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requerir('prospeccion');
  const { id } = await ctx.params;
  if (!UUID.test(id)) throw new HttpError(400, 'ID inválido');
  const { accion } = await leerJson<{ accion?: string }>(req);

  const db = erpDb();
  if (accion === 'cancelar') {
    const row = ok(await db.from('erp_prospeccion_busquedas')
      .update({ estado: 'cancelada', finished_at: new Date().toISOString() })
      .eq('id', id).eq('estado', 'pendiente').select('*').maybeSingle());
    if (!row) throw new HttpError(409, 'Solo se pueden cancelar búsquedas que siguen en cola');
    return NextResponse.json({ data: row });
  }
  if (accion === 'reintentar') {
    const row = ok(await db.from('erp_prospeccion_busquedas')
      .update({ estado: 'pendiente', error: null, started_at: null, finished_at: null })
      .eq('id', id).in('estado', ['error', 'cancelada']).select('*').maybeSingle());
    if (!row) throw new HttpError(409, 'Solo se pueden reintentar búsquedas con error o canceladas');
    return NextResponse.json({ data: row });
  }
  throw new HttpError(400, 'Acción no válida');
});
