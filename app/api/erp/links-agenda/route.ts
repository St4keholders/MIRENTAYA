import { NextRequest } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { jsonOk, jsonError } from '@/lib/erp/http';
import { obtenerSesionERP } from '@/lib/erp/session';
import { esAdmin } from '@/lib/erp/permisos';

function slugificar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export async function GET(req: NextRequest) {
  const me = await obtenerSesionERP();
  if (!me) return jsonError('No autenticado', 401);

  const { searchParams } = new URL(req.url);
  const verTodos = searchParams.get('todos') === 'true';

  const supabase = erpDb();
  let query = supabase
    .from('erp_links_agenda')
    .select(`
      id,
      usuario_id,
      slug,
      titulo,
      servicio,
      duracion_minutos,
      activo,
      created_at,
      usuarios:usuario_id (
        id,
        nombre,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (!verTodos || !esAdmin(me.rol)) {
    query = query.eq('usuario_id', me.id);
  }

  const { data: links, error } = await query;
  if (error) {
    return jsonError(`Error al consultar links: ${error.message}`, 500);
  }

  // Obtenemos conteo de citas asociadas a cada link desde la tabla citas (o erp_formularios)
  const linkIds = (links || []).map((l) => l.id);
  const conteosMap: Record<string, number> = {};

  if (linkIds.length > 0) {
    const { data: citas } = await supabase
      .from('erp_formularios')
      .select('link_id')
      .in('link_id', linkIds);

    if (citas) {
      for (const c of citas) {
        if (c.link_id) {
          conteosMap[c.link_id] = (conteosMap[c.link_id] || 0) + 1;
        }
      }
    }
  }

  const items = (links || []).map((l) => ({
    ...l,
    citas_count: conteosMap[l.id] || 0,
  }));

  return jsonOk({ items });
}

export async function POST(req: NextRequest) {
  const me = await obtenerSesionERP();
  if (!me) return jsonError('No autenticado', 401);

  const body = await req.json().catch(() => ({}));
  const titulo = typeof body.titulo === 'string' ? body.titulo.trim().slice(0, 100) : '';
  const servicio = typeof body.servicio === 'string' ? body.servicio.trim() : 'general';
  const duracion = parseInt(body.duracion_minutos, 10) || 30;
  const activo = body.activo !== false;

  if (!titulo) {
    return jsonError('El título es requerido', 400);
  }

  const supabase = erpDb();

  // Generar o limpiar slug
  let slug = '';
  if (typeof body.slug === 'string' && body.slug.trim()) {
    slug = slugificar(body.slug.trim());
  }

  if (!slug) {
    const baseSlug = `${slugificar(me.nombre.split(' ')[0] || 'asesoria')}-${slugificar(servicio)}-${duracion}m`;
    const aleatorio = Math.random().toString(36).substring(2, 6);
    slug = `${baseSlug}-${aleatorio}`;
  }

  // Verificar unicidad de slug
  const { data: existente } = await supabase
    .from('erp_links_agenda')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existente) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const { data, error } = await supabase
    .from('erp_links_agenda')
    .insert({
      usuario_id: me.id,
      slug,
      titulo,
      servicio,
      duracion_minutos: duracion,
      activo,
    })
    .select()
    .single();

  if (error) {
    return jsonError(`Error al crear link: ${error.message}`, 500);
  }

  return jsonOk(data, 201);
}
