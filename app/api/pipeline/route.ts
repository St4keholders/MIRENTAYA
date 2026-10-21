import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requerir, HttpError } from '@/lib/erp/session';

/* GET /api/pipeline — list pipeline_leads (admin, desarrollador, contador) */
export async function GET() {
  try {
    const s = await requerir();
    if (s.rol !== 'admin' && s.rol !== 'desarrollador' && s.rol !== 'contador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('pipeline_leads')
      .select(`
        id, full_name, email, phone, source, stage,
        declaration_amount, anticipo_paid_at, created_at, updated_at,
        referrer:referrer_id (id, nombre, email, rol),
        seller:seller_id (id, nombre, email, rol),
        assigned_contador:assigned_contador_id (id, nombre, email)
      `)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Error al consultar pipeline' }, { status: 500 });
    return NextResponse.json({ leads: data || [] });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* POST /api/pipeline — create a new pipeline lead (vendedor, admin, desarrollador) */
export async function POST(request: Request) {
  try {
    const s = await requerir();
    if (s.rol !== 'vendedor' && s.rol !== 'admin' && s.rol !== 'desarrollador') {
      return NextResponse.json({ error: 'Solo vendedores pueden registrar leads en el pipeline' }, { status: 403 });
    }

    const body = await request.json();
    const { full_name, email, phone, source = 'vendedor' } = body;
    if (!full_name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

    const supabase = supabaseAdmin();
    // seller_id sale de la sesión, NUNCA del body
    const sellerId = s.id;

    const { data, error } = await supabase
      .from('pipeline_leads')
      .insert({
        full_name,
        email,
        phone,
        seller_id: sellerId,
        source,
        created_by: sellerId,
      })
      .select('id, full_name, stage')
      .single();

    if (error) return NextResponse.json({ error: 'Error al registrar lead en el pipeline' }, { status: 500 });
    return NextResponse.json({ lead: data });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/pipeline — update stage, declaration_amount, assign contador (admin, desarrollador, contador) */
export async function PATCH(request: Request) {
  try {
    const s = await requerir();
    if (s.rol !== 'admin' && s.rol !== 'desarrollador' && s.rol !== 'contador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { id, stage, declaration_amount, assigned_contador_id } = body;
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (stage !== undefined) updates.stage = stage;
    if (declaration_amount !== undefined) updates.declaration_amount = Number(declaration_amount);
    if (assigned_contador_id !== undefined) updates.assigned_contador_id = assigned_contador_id;

    const supabase = supabaseAdmin();
    const { error } = await supabase.from('pipeline_leads').update(updates as any).eq('id', id);
    if (error) return NextResponse.json({ error: 'Error al actualizar lead del pipeline' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
