import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { handler, leerJson, ok, pick } from '@/lib/erp/http';
import { HttpError, requerir } from '@/lib/erp/session';
import { puedeAprobar } from '@/lib/erp/permisos';

const CAMPOS_CLIENTE = [
  'tipo_persona',
  'tipo_documento',
  'numero_documento',
  'dv',
  'nombre',
  'nombre_comercial',
  'email',
  'telefono',
  'direccion',
  'ciudad',
  'responsable_iva',
  'dias_credito',
  'notas',
] as const;

/**
 * POST /api/erp/formularios/aprobar
 * Aprueba un formulario recibido y lo vincula / crea como Cliente facturable.
 * Solo admin, desarrollador y contador (puedeAprobar).
 */
export const POST = handler(async (req: Request) => {
  const s = await requerir('formularios');
  if (!puedeAprobar(s.rol)) {
    throw new HttpError(403, 'No tienes permiso para aprobar formularios y crear clientes.');
  }

  const body = await leerJson<{
    formulario_id?: string;
    cliente?: Record<string, unknown>;
  }>(req);

  if (!body.formulario_id) {
    throw new HttpError(400, 'formulario_id requerido');
  }

  const datos = pick(body.cliente || {}, CAMPOS_CLIENTE);
  if (!datos.nombre) throw new HttpError(400, 'El nombre del cliente es obligatorio');
  if (!datos.numero_documento) throw new HttpError(400, 'El número de documento es obligatorio para facturación');

  datos.numero_documento = String(datos.numero_documento).replace(/[^0-9A-Za-z]/g, '');
  datos.tipo_documento = datos.tipo_documento || 'CC';
  if ('dias_credito' in datos) datos.dias_credito = Math.max(0, Number(datos.dias_credito) || 0);

  const db = erpDb();

  // 1. Verificar si el formulario existe
  const formulario = ok(
    await db.from('erp_formularios').select('*').eq('id', body.formulario_id).maybeSingle()
  ) as Record<string, unknown> | null;

  if (!formulario) {
    throw new HttpError(404, 'Formulario no encontrado');
  }

  // 2. Buscar o crear cliente
  let cliente = ok(
    await db
      .from('erp_clientes')
      .select('*')
      .eq('tipo_documento', datos.tipo_documento as string)
      .eq('numero_documento', datos.numero_documento as string)
      .maybeSingle()
  ) as { id: string } | null;

  const yaExistia = Boolean(cliente);
  if (!cliente) {
    cliente = ok(
      await db
        .from('erp_clientes')
        .insert({
          ...datos,
          created_by: s.id,
        })
        .select('*')
        .single()
    ) as { id: string };
  }

  // 3. Marcar el formulario como aprobado
  const ahora = new Date().toISOString();
  ok(
    await db
      .from('erp_formularios')
      .update({
        estado: 'aprobado',
        cliente_id: cliente.id,
        aprobado_por: s.id,
        aprobado_at: ahora,
        updated_at: ahora,
      })
      .eq('id', body.formulario_id)
  );

  return NextResponse.json({
    data: {
      formulario_id: body.formulario_id,
      cliente,
      yaExistia,
    },
  });
});
