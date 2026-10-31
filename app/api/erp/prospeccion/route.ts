import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { handler, leerJson, ok } from '@/lib/erp/http';
import { HttpError, requerir } from '@/lib/erp/session';
import { normalizarRol } from '@/lib/erp/permisos';
import { dispararWorker } from '@/lib/erp/prospeccion-server';
import { CON_WEBSITE, FUENTES, type ConWebsite, type Fuente } from '@/lib/erp/prospeccion';

const SERVICIOS = ['contabilidad', 'nomina', 'renta', 'personalizado', 'otro'];
const MAX_EN_COLA = 3;

const texto = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** Lista las últimas búsquedas con sus conteos. */
const soloPropias = (rol: string) => ['vendedor', 'referido'].includes(normalizarRol(rol) || '');

export const GET = handler(async () => {
  const s = await requerir('prospeccion');
  let query = erpDb()
    .from('erp_prospeccion_busquedas')
    .select('*, creador:usuarios!erp_prospeccion_busquedas_creado_por_fkey(id,nombre)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (soloPropias(s.rol)) query = query.eq('creado_por', s.id);
  const data = ok(await query);
  return NextResponse.json({ data });
});

/** Encola una búsqueda nueva. El worker de GitHub Actions la procesa. */
export const POST = handler(async (req: Request) => {
  const s = await requerir('prospeccion');
  const b = await leerJson(req);

  const ciudad = texto(b.ciudad, 80);
  const tipo_negocio = texto(b.tipo_negocio, 120);
  if (ciudad.length < 2) throw new HttpError(400, 'Indica la ciudad');
  if (tipo_negocio.length < 2) throw new HttpError(400, 'Indica el tipo de negocio');

  const con_website: ConWebsite = (typeof b.con_website === 'string' && b.con_website in CON_WEBSITE)
    ? (b.con_website as ConWebsite) : 'indiferente';
  const fuentes = (Array.isArray(b.fuentes) ? b.fuentes : Object.keys(FUENTES))
    .filter((f): f is Fuente => typeof f === 'string' && f in FUENTES);
  if (!fuentes.length) throw new HttpError(400, 'Elige al menos una fuente');
  const limite = Math.min(200, Math.max(5, Math.round(Number(b.limite) || 60)));
  const servicio = typeof b.servicio === 'string' && SERVICIOS.includes(b.servicio) ? b.servicio : 'contabilidad';

  const db = erpDb();
  const { count } = await db
    .from('erp_prospeccion_busquedas')
    .select('id', { count: 'exact', head: true })
    .in('estado', ['pendiente', 'procesando']);
  if ((count ?? 0) >= MAX_EN_COLA) {
    throw new HttpError(429, `Ya hay ${count} búsquedas en cola. Espera a que terminen.`);
  }

  const row = ok(await db
    .from('erp_prospeccion_busquedas')
    .insert({ ciudad, tipo_negocio, con_website, fuentes, limite, servicio, creado_por: s.id })
    .select('*')
    .single());

  // Arranque inmediato (si hay token); si no, la toma el ciclo programado
  const inmediato = await dispararWorker();

  return NextResponse.json({ data: row, inmediato });
});
