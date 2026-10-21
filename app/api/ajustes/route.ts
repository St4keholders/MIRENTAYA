import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requerir, HttpError } from '@/lib/erp/session';

/* GET /api/ajustes — get app settings (cualquier sesión válida) */
export async function GET() {
  try {
    await requerir();

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', true)
      .single();

    if (error) return NextResponse.json({ error: 'Error al consultar ajustes' }, { status: 500 });
    return NextResponse.json({ settings: data });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/ajustes — update app settings (admin, desarrollador) */
export async function PATCH(request: Request) {
  try {
    const s = await requerir();
    if (s.rol !== 'admin' && s.rol !== 'desarrollador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { tope, pct_contador, pct_vendedor, pct_desarrollo, pct_ref_bajo, pct_ref_sobre } = body;

    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from('app_settings')
      .update({ tope, pct_contador, pct_vendedor, pct_desarrollo, pct_ref_bajo, pct_ref_sobre } as any)
      .eq('id', true);

    if (error) return NextResponse.json({ error: 'Error al actualizar ajustes' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
