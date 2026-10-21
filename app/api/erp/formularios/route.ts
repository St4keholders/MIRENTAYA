import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { handler, likeSeguro, ok } from '@/lib/erp/http';
import { requerir } from '@/lib/erp/session';

/**
 * GET /api/erp/formularios
 * Lista los formularios recibidos en la web con filtros:
 * - estado (por defecto 'pendiente', o 'todos', 'aprobado', 'descartado')
 * - servicio
 * - formulario
 * - q (nombre, email, telefono, empresa)
 * - desde, hasta
 * Vendedores y referidos reciben solo sus filas asignadas (responsable_id = su id).
 */
export const GET = handler(async (req: Request) => {
  const s = await requerir('formularios');
  const url = new URL(req.url);
  const estado = url.searchParams.get('estado') || 'pendiente';
  const servicio = url.searchParams.get('servicio');
  const formulario = url.searchParams.get('formulario');
  const q = url.searchParams.get('q');
  const desde = url.searchParams.get('desde');
  const hasta = url.searchParams.get('hasta');

  const db = erpDb();
  let query = db
    .from('erp_formularios')
    .select(`
      id, formulario, servicio, nombre, empresa, email, telefono,
      modalidad, direccion, cita_at, fecha_preferida, mensaje, datos,
      estado, motivo_descarte, responsable_id, link_id, cliente_id,
      legacy_lead_id, aprobado_por, aprobado_at, ip_hash, created_at, updated_at,
      responsable:usuarios!erp_formularios_responsable_id_fkey (id, nombre, email, rol),
      cliente:erp_clientes!erp_formularios_cliente_id_fkey (id, nombre, numero_documento),
      link:erp_links_agenda!erp_formularios_link_id_fkey (id, slug, titulo)
    `)
    .order('created_at', { ascending: false });

  // Restricción por rol: vendedor y referido ven solo los suyos
  if (s.rol === 'vendedor' || s.rol === 'referido') {
    query = query.eq('responsable_id', s.id);
  }

  if (estado && estado !== 'todos') {
    query = query.eq('estado', estado);
  }
  if (servicio) {
    query = query.eq('servicio', servicio);
  }
  if (formulario) {
    query = query.eq('formulario', formulario);
  }
  if (desde) {
    query = query.gte('created_at', desde);
  }
  if (hasta) {
    query = query.lte('created_at', hasta);
  }
  if (q) {
    const lk = likeSeguro(q);
    query = query.or(`nombre.ilike.%${lk}%,email.ilike.%${lk}%,telefono.ilike.%${lk}%,empresa.ilike.%${lk}%`);
  }

  const data = ok(await query);

  // Obtener estadísticas rápidas para las tarjetas
  let statsQuery = db.from('erp_formularios').select('estado, created_at');
  if (s.rol === 'vendedor' || s.rol === 'referido') {
    statsQuery = statsQuery.eq('responsable_id', s.id);
  }
  const allRows = ok(await statsQuery) as Array<{ estado: string; created_at: string }>;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const inicioMesIso = inicioMes.toISOString();

  const pendientesCount = allRows.filter((r) => r.estado === 'pendiente').length;
  const aprobadosMes = allRows.filter((r) => r.estado === 'aprobado' && r.created_at >= inicioMesIso).length;
  const descartadosMes = allRows.filter((r) => r.estado === 'descartado' && r.created_at >= inicioMesIso).length;

  return NextResponse.json({
    data,
    stats: {
      pendientes: pendientesCount,
      aprobadosMes,
      descartadosMes,
    },
  });
});
