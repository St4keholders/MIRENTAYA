import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requerir, HttpError } from '@/lib/erp/session';

/* GET /api/comisiones — list commissions (usuario ve solo las suyas; admin/dev ven todas) */
export async function GET(request: Request) {
  try {
    const s = await requerir();
    const { searchParams } = new URL(request.url);
    const requestedBeneficiaryId = searchParams.get('beneficiary_id');

    const supabase = supabaseAdmin();
    let query = supabase
      .from('commissions')
      .select(`
        id, role, base_amount, pct, amount, status, created_at, paid_at,
        pipeline_lead:pipeline_lead_id (id, full_name, declaration_amount, stage),
        beneficiary:beneficiary_id (id, nombre, email, rol)
      `)
      .order('created_at', { ascending: false });

    // Si no es admin o desarrollador, solo puede ver sus propias comisiones
    if (s.rol !== 'admin' && s.rol !== 'desarrollador') {
      query = query.eq('beneficiary_id', s.id);
    } else if (requestedBeneficiaryId) {
      query = query.eq('beneficiary_id', requestedBeneficiaryId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'Error al consultar comisiones' }, { status: 500 });
    return NextResponse.json({ commissions: data || [] });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/comisiones — mark commission as paid (admin, desarrollador) */
export async function PATCH(request: Request) {
  try {
    const s = await requerir();
    if (s.rol !== 'admin' && s.rol !== 'desarrollador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: 'ID y status requeridos' }, { status: 400 });

    const supabase = supabaseAdmin();
    const updates: Record<string, unknown> = { status };
    if (status === 'pagada') updates.paid_at = new Date().toISOString();

    const { error } = await supabase.from('commissions').update(updates as any).eq('id', id);
    if (error) return NextResponse.json({ error: 'Error al actualizar comisión' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
