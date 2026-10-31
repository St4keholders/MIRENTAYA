import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { handler, leerJson, ok } from '@/lib/erp/http';
import { HttpError, requerir } from '@/lib/erp/session';
import { normalizarRol } from '@/lib/erp/permisos';

/**
 * Habeas Data (Ley 1581 de 2012): el contacto pidió no ser contactado o que se
 * supriman sus datos. Se borran los datos de contacto del lead, se marca opt_out
 * y su teléfono / correo / dominio pasan a la lista de exclusión, para que el
 * scraper nunca lo vuelva a cargar.
 */
export const POST = handler(async (req: Request) => {
  const s = await requerir('prospeccion');
  const { lead_id, motivo } = await leerJson<{ lead_id?: string; motivo?: string }>(req);
  if (!lead_id) throw new HttpError(400, 'lead_id requerido');

  const db = erpDb();
  const lead = ok(await db.from('erp_leads')
    .select('id, nombre, telefono_norm, email_norm, dominio, notas, responsable_id, created_by')
    .eq('id', lead_id).maybeSingle());
  if (!lead) throw new HttpError(404, 'Lead no encontrado');
  if (['vendedor', 'referido'].includes(normalizarRol(s.rol) || '')
      && lead.responsable_id !== s.id && lead.created_by !== s.id) {
    throw new HttpError(404, 'Lead no encontrado');
  }

  const motivoTxt = (typeof motivo === 'string' ? motivo.trim().slice(0, 300) : '') || 'Solicitud del titular';
  const exclusiones = [
    lead.telefono_norm && { tipo: 'telefono', valor: lead.telefono_norm },
    lead.email_norm && { tipo: 'email', valor: lead.email_norm },
    lead.dominio && { tipo: 'dominio', valor: lead.dominio },
  ].filter(Boolean).map((x) => ({ ...(x as { tipo: string; valor: string }), motivo: motivoTxt, creado_por: s.id }));

  if (exclusiones.length) {
    ok(await db.from('erp_prospeccion_exclusiones').upsert(exclusiones, { onConflict: 'tipo,valor', ignoreDuplicates: true }));
  }

  const fechaHoy = new Date().toISOString().slice(0, 10);
  ok(await db.from('erp_leads').update({
    opt_out: true,
    estado: 'perdido',
    email: null,
    telefono: null,
    red_principal: null,
    datos: {},
    notas: `${lead.notas ? `${lead.notas}\n` : ''}[${fechaHoy}] Excluido por Habeas Data: ${motivoTxt}`,
    updated_at: new Date().toISOString(),
  }).eq('id', lead_id));

  return NextResponse.json({ success: true, exclusiones: exclusiones.length });
});
