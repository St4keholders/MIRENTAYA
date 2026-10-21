import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { jsonOk, jsonError } from '@/lib/erp/http';
import { esFestivoColombia } from '@/lib/festivos';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get('fecha'); // 'YYYY-MM-DD'
  const usuarioId = searchParams.get('usuario_id'); // opcional

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return jsonError('Fecha inválida (YYYY-MM-DD)', 400);
  }

  // Verificar si es festivo o domingo
  const [y, m, d] = fecha.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (dateObj.getDay() === 0 || esFestivoColombia(fecha)) {
    return jsonOk({ horasOcupadas: [], cerrado: true });
  }

  const supabase = supabaseAdmin();
  const { data: citas, error } = await supabase
    .from('citas')
    .select('hora_consulta')
    .eq('fecha_consulta', fecha)
    .neq('estado', 'cancelada');

  if (error) {
    return jsonError('Error al consultar disponibilidad', 500);
  }

  const horasOcupadas = (citas || []).map((c) => {
    // Normalizar a formato HH:MM (ej. "08:00:00" -> "08:00")
    return (c.hora_consulta || '').slice(0, 5);
  });

  return jsonOk({ horasOcupadas, cerrado: false });
}
