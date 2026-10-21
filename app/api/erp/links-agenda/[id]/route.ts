import { NextRequest } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { jsonOk, jsonError } from '@/lib/erp/http';
import { obtenerSesionERP } from '@/lib/erp/session';
import { esAdmin } from '@/lib/erp/permisos';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await obtenerSesionERP();
  if (!me) return jsonError('No autenticado', 401);

  const { id } = await params;
  if (!id) return jsonError('ID requerido', 400);

  const supabase = erpDb();

  // Verificar pertenencia o admin
  const { data: link, error: errFetch } = await supabase
    .from('erp_links_agenda')
    .select('id, usuario_id')
    .eq('id', id)
    .maybeSingle();

  if (errFetch || !link) {
    return jsonError('Link no encontrado', 404);
  }

  if (link.usuario_id !== me.id && !esAdmin(me.rol)) {
    return jsonError('No tienes permiso para modificar este link', 403);
  }

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, any> = {};

  if (typeof body.titulo === 'string') updates.titulo = body.titulo.trim().slice(0, 100);
  if (typeof body.servicio === 'string') updates.servicio = body.servicio.trim();
  if (body.duracion_minutos !== undefined) updates.duracion_minutos = parseInt(body.duracion_minutos, 10) || 30;
  if (body.activo !== undefined) updates.activo = Boolean(body.activo);
  if (typeof body.slug === 'string' && body.slug.trim()) {
    const slugLimpio = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    updates.slug = slugLimpio;
  }

  const { data, error } = await supabase
    .from('erp_links_agenda')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return jsonError(`Error al actualizar link: ${error.message}`, 500);
  }

  return jsonOk(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await obtenerSesionERP();
  if (!me) return jsonError('No autenticado', 401);

  const { id } = await params;
  if (!id) return jsonError('ID requerido', 400);

  const supabase = erpDb();
  const { data: link } = await supabase
    .from('erp_links_agenda')
    .select('id, usuario_id')
    .eq('id', id)
    .maybeSingle();

  if (!link) return jsonError('Link no encontrado', 404);
  if (link.usuario_id !== me.id && !esAdmin(me.rol)) {
    return jsonError('No tienes permiso', 403);
  }

  const { error } = await supabase
    .from('erp_links_agenda')
    .delete()
    .eq('id', id);

  if (error) return jsonError(`Error al eliminar: ${error.message}`, 500);

  return jsonOk({ ok: true });
}
