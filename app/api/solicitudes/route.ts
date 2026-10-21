import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requerir, HttpError } from '@/lib/erp/session';

/* GET /api/solicitudes — list lead requests (admin, desarrollador) */
export async function GET() {
  try {
    const s = await requerir();
    if (s.rol !== 'admin' && s.rol !== 'desarrollador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('lead_requests')
      .select(`
        id, status, requested_at, resolved_at,
        pipeline_lead:pipeline_lead_id (id, full_name, stage),
        contador:contador_id (id, nombre, email),
        resolver:resolved_by (id, nombre)
      `)
      .order('requested_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Error al consultar solicitudes' }, { status: 500 });
    return NextResponse.json({ requests: data || [] });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* POST /api/solicitudes — contador requests a lead (contador_id sale de la sesión) */
export async function POST(request: Request) {
  try {
    const s = await requerir();
    if (s.rol !== 'contador' && s.rol !== 'admin' && s.rol !== 'desarrollador') {
      return NextResponse.json({ error: 'Solo los contadores pueden solicitar leads' }, { status: 403 });
    }

    const { pipeline_lead_id } = await request.json();
    if (!pipeline_lead_id) {
      return NextResponse.json({ error: 'pipeline_lead_id requerido' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    // contador_id sale de la sesión
    const contadorId = s.id;

    const { data, error } = await supabase
      .from('lead_requests')
      .insert({ pipeline_lead_id, contador_id: contadorId })
      .select('id, status')
      .single();

    if (error) return NextResponse.json({ error: 'Error al crear solicitud' }, { status: 500 });
    return NextResponse.json({ request: data });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/solicitudes — admin o desarrollador aprueba o rechaza */
export async function PATCH(request: Request) {
  try {
    const s = await requerir();
    if (s.rol !== 'admin' && s.rol !== 'desarrollador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'ID y status requeridos' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const resolvedBy = s.id;

    // Update request status
    const { error: reqError } = await supabase
      .from('lead_requests')
      .update({ status, resolved_by: resolvedBy, resolved_at: new Date().toISOString() })
      .eq('id', id);

    if (reqError) return NextResponse.json({ error: 'Error al actualizar solicitud' }, { status: 500 });

    // If approved: assign contador and change stage
    if (status === 'aprobada') {
      const { data: req } = await supabase
        .from('lead_requests')
        .select('pipeline_lead_id, contador_id')
        .eq('id', id)
        .single();

      if (req) {
        await supabase
          .from('pipeline_leads')
          .update({ assigned_contador_id: req.contador_id, stage: 'asignada', updated_at: new Date().toISOString() })
          .eq('id', req.pipeline_lead_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
