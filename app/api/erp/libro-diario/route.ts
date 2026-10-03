import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { handler, leerJson, likeSeguro, ok } from '@/lib/erp/http';
import { HttpError, requerir } from '@/lib/erp/session';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/* GET — líneas del libro diario con filtros */
export const GET = handler(async (req: Request) => {
  await requerir('libro');
  const p = new URL(req.url).searchParams;
  let query = erpDb().from('erp_libro_diario_v').select('*')
    .order('fecha', { ascending: false }).order('numero', { ascending: false }).order('linea_id');
  const desde = p.get('desde'); const hasta = p.get('hasta');
  if (desde && FECHA.test(desde)) query = query.gte('fecha', desde);
  if (hasta && FECHA.test(hasta)) query = query.lte('fecha', hasta);
  const tipo = p.get('tipo');
  if (tipo && tipo !== 'todos') query = query.eq('tipo', tipo);
  const cuenta = p.get('cuenta');
  if (cuenta && /^\d{1,10}$/.test(cuenta)) query = query.like('cuenta', `${cuenta}%`);
  const q = likeSeguro(p.get('q') || '');
  if (q) query = query.or(`descripcion.ilike.%${q}%,tercero_nombre.ilike.%${q}%`);
  if (p.get('anulados') !== '1') query = query.eq('anulado', false);
  const data = ok(await query.limit(5000));
  return NextResponse.json({ data });
});

/* POST — asiento manual */
export const POST = handler(async (req: Request) => {
  const s = await requerir('libro');
  const body = await leerJson<{ fecha?: string; descripcion?: string; tercero_tipo?: string; tercero_id?: string;
    lineas?: Array<{ cuenta?: string; debito?: number | string; credito?: number | string; descripcion?: string }> }>(req);
  const lineas = (body.lineas || []).map((l) => ({
    cuenta: String(l.cuenta || ''),
    debito: Math.round((Number(l.debito) || 0) * 100) / 100,
    credito: Math.round((Number(l.credito) || 0) * 100) / 100,
    descripcion: l.descripcion || '',
  })).filter((l) => l.cuenta && (l.debito > 0 || l.credito > 0));
  if (lineas.some((l) => l.debito > 0 && l.credito > 0)) throw new HttpError(400, 'Cada línea va al débito o al crédito, no a ambos');
  const d = lineas.reduce((a, l) => a + l.debito, 0);
  const c = lineas.reduce((a, l) => a + l.credito, 0);
  if (Math.abs(d - c) > 0.001) throw new HttpError(400, 'El asiento no cuadra: débitos y créditos deben ser iguales');
  const id = ok(await erpDb().rpc('erp_crear_asiento_manual', { p: { ...body, lineas, created_by: s.id } }));
  return NextResponse.json({ data: { id } });
});
