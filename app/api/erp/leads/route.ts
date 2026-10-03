import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { handler, leerJson, likeSeguro, ok, pick } from '@/lib/erp/http';
import { esAdmin, normalizarRol } from '@/lib/erp/permisos';
import { HttpError, requerir, type Sesion } from '@/lib/erp/session';

const CAMPOS = ['nombre', 'empresa', 'email', 'telefono', 'servicio', 'origen', 'estado',
  'valor_estimado', 'mensaje', 'notas', 'responsable_id'] as const;

/** Vendedores y referidos solo ven/gestionan sus propios leads */
const soloPropios = (s: Sesion) => {
  const r = normalizarRol(s.rol);
  return r === 'vendedor' || r === 'referido';
};

function limpiar(body: Record<string, unknown>) {
  const d = pick(body, CAMPOS);
  if ('valor_estimado' in d) d.valor_estimado = d.valor_estimado == null ? null : Number(d.valor_estimado) || 0;
  return d;
}

export const GET = handler(async (req: Request) => {
  const s = await requerir('leads');
  const p = new URL(req.url).searchParams;
  let query = erpDb().from('erp_leads')
    .select('*, responsable:usuarios!erp_leads_responsable_id_fkey(id,nombre), cliente:erp_clientes(id,nombre)')
    .order('created_at', { ascending: false });
  if (soloPropios(s)) query = query.or(`responsable_id.eq.${s.id},created_by.eq.${s.id}`);
  const estado = p.get('estado');
  if (estado && estado !== 'todos') query = query.eq('estado', estado);
  const servicio = p.get('servicio');
  if (servicio && servicio !== 'todos') query = query.eq('servicio', servicio);
  const q = likeSeguro(p.get('q') || '');
  if (q) query = query.or(`nombre.ilike.%${q}%,empresa.ilike.%${q}%,email.ilike.%${q}%,telefono.ilike.%${q}%`);
  const data = ok(await query.limit(2000));
  return NextResponse.json({ data });
});

export const POST = handler(async (req: Request) => {
  const s = await requerir('leads');
  const d = limpiar(await leerJson(req));
  if (!d.nombre) throw new HttpError(400, 'El nombre es obligatorio');
  if (soloPropios(s)) d.responsable_id = s.id;
  const row = ok(await erpDb().from('erp_leads').insert({ ...d, created_by: s.id }).select('*').single());
  return NextResponse.json({ data: row });
});

export const PATCH = handler(async (req: Request) => {
  const s = await requerir('leads');
  const body = await leerJson(req);
  if (!body.id) throw new HttpError(400, 'ID requerido');
  const d = limpiar(body);
  if (soloPropios(s)) delete d.responsable_id;
  let query = erpDb().from('erp_leads').update({ ...d, updated_at: new Date().toISOString() }).eq('id', body.id as string);
  if (soloPropios(s)) query = query.or(`responsable_id.eq.${s.id},created_by.eq.${s.id}`);
  const row = ok(await query.select('*').maybeSingle());
  if (!row) throw new HttpError(404, 'Lead no encontrado');
  return NextResponse.json({ data: row });
});

export const DELETE = handler(async (req: Request) => {
  const s = await requerir('leads');
  if (!esAdmin(s.rol)) throw new HttpError(403, 'Solo un administrador puede eliminar leads');
  const { id } = await leerJson<{ id?: string }>(req);
  if (!id) throw new HttpError(400, 'ID requerido');
  ok(await erpDb().from('erp_leads').delete().eq('id', id));
  return NextResponse.json({ success: true });
});
