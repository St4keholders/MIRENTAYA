import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { handler, leerJson, ok, pick } from '@/lib/erp/http';
import { HttpError, requerir } from '@/lib/erp/session';

const CAMPOS_CLIENTE = ['tipo_persona', 'tipo_documento', 'numero_documento', 'dv', 'nombre', 'nombre_comercial',
  'email', 'telefono', 'direccion', 'ciudad', 'responsable_iva', 'dias_credito', 'notas'] as const;

/**
 * POST — convierte un lead en cliente.
 * body: { lead_id?, renta_lead_id?, cliente: {...} }
 * Si ya existe un cliente con el mismo documento, se vincula en lugar de duplicarlo.
 */
export const POST = handler(async (req: Request) => {
  const s = await requerir('leads');
  await requerir('clientes').catch(() => { throw new HttpError(403, 'Tu rol no puede crear clientes'); });
  const body = await leerJson<{ lead_id?: string; renta_lead_id?: string; cliente?: Record<string, unknown> }>(req);
  const datos = pick(body.cliente || {}, CAMPOS_CLIENTE);
  if (!datos.nombre) throw new HttpError(400, 'El nombre es obligatorio');
  if (!datos.numero_documento) throw new HttpError(400, 'El número de documento es obligatorio para crear el cliente');
  datos.numero_documento = String(datos.numero_documento).replace(/[^0-9A-Za-z]/g, '');
  datos.tipo_documento = datos.tipo_documento || 'CC';
  if ('dias_credito' in datos) datos.dias_credito = Math.max(0, Number(datos.dias_credito) || 0);

  const db = erpDb();
  let cliente = ok(await db.from('erp_clientes').select('*')
    .eq('tipo_documento', datos.tipo_documento as string)
    .eq('numero_documento', datos.numero_documento as string).maybeSingle()) as { id: string } | null;
  const yaExistia = Boolean(cliente);
  if (!cliente) {
    cliente = ok(await db.from('erp_clientes').insert({ ...datos, created_by: s.id }).select('*').single()) as { id: string };
  }

  const ahora = new Date().toISOString();
  if (body.lead_id) {
    ok(await db.from('erp_leads').update({ estado: 'ganado', cliente_id: cliente.id, updated_at: ahora }).eq('id', body.lead_id));
  } else if (body.renta_lead_id) {
    const existente = ok(await db.from('erp_leads').select('id').eq('renta_lead_id', body.renta_lead_id).maybeSingle()) as { id: string } | null;
    if (existente) {
      ok(await db.from('erp_leads').update({ estado: 'ganado', cliente_id: cliente.id, updated_at: ahora }).eq('id', existente.id));
    } else {
      ok(await db.from('erp_leads').insert({
        nombre: datos.nombre, email: datos.email ?? null, telefono: datos.telefono ?? null,
        servicio: 'renta', origen: 'renta_test', estado: 'ganado',
        renta_lead_id: body.renta_lead_id, cliente_id: cliente.id, created_by: s.id,
      }));
    }
  }
  return NextResponse.json({ data: { cliente, yaExistia } });
});
