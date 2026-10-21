import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { handler, leerJson, ok } from '@/lib/erp/http';
import { HttpError, requerir } from '@/lib/erp/session';
import { puedeAprobar } from '@/lib/erp/permisos';

interface RouteProps {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/erp/formularios/[id]
 * Descartar un formulario con motivo o devolverlo a pendiente.
 * Solo admin, desarrollador y contador (puedeAprobar).
 */
export const PATCH = handler(async (req: Request, context?: unknown) => {
  const s = await requerir('formularios');
  if (!puedeAprobar(s.rol)) {
    throw new HttpError(403, 'No tienes permiso para modificar el estado de los formularios.');
  }

  const { id } = await (context as RouteProps).params;
  if (!id) throw new HttpError(400, 'ID requerido');

  const body = await leerJson<{ estado?: string; motivo_descarte?: string }>(req);
  const estado = body.estado;
  if (estado !== 'descartado' && estado !== 'pendiente') {
    throw new HttpError(400, "El estado solo puede cambiarse a 'descartado' o 'pendiente'.");
  }

  const db = erpDb();
  const ahora = new Date().toISOString();
  const updates: Record<string, unknown> = {
    estado,
    updated_at: ahora,
  };

  if (estado === 'descartado') {
    updates.motivo_descarte = body.motivo_descarte?.trim() || null;
  } else if (estado === 'pendiente') {
    updates.motivo_descarte = null;
    updates.cliente_id = null;
    updates.aprobado_por = null;
    updates.aprobado_at = null;
  }

  const data = ok(
    await db.from('erp_formularios').update(updates).eq('id', id).select('*').single()
  );

  return NextResponse.json({ data });
});
