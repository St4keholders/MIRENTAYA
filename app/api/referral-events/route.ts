import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resolveReferrer } from '@/lib/resolveReferrer';
import { requerir, HttpError } from '@/lib/erp/session';

/* GET /api/referral-events — list events for a referrer (usuario ve solo los suyos; admin/dev ven todos) */
export async function GET(request: Request) {
  try {
    const s = await requerir();
    const { searchParams } = new URL(request.url);
    const requestedReferrerId = searchParams.get('referrer_id');

    const supabase = supabaseAdmin();
    let query = supabase
      .from('referral_events')
      .select(`
        id, event_type, contact_name, contact_email, contact_phone, created_at,
        pipeline_lead:pipeline_lead_id (id, full_name, stage)
      `)
      .order('created_at', { ascending: false });

    if (s.rol !== 'admin' && s.rol !== 'desarrollador') {
      query = query.eq('referrer_id', s.id);
    } else if (requestedReferrerId) {
      query = query.eq('referrer_id', requestedReferrerId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'Error al consultar eventos de referidos' }, { status: 500 });
    return NextResponse.json({ events: data || [] });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* POST /api/referral-events — record a referral event (public route) */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { referrer_slug, event_type, contact_name, contact_email, contact_phone } = body;

    if (!referrer_slug || !event_type)
      return NextResponse.json({ error: 'Slug y tipo requeridos' }, { status: 400 });

    const supabase = supabaseAdmin();

    // Resolve exact slug → referrer_id
    const user = await resolveReferrer(referrer_slug);
    if (!user) return NextResponse.json({ error: 'Referido no encontrado' }, { status: 404 });

    const { data, error } = await supabase
      .from('referral_events')
      .insert({ referrer_id: user.id, event_type, contact_name, contact_email, contact_phone })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: 'Error al registrar evento' }, { status: 500 });
    return NextResponse.json({ event: data, referrer_id: user.id });
  } catch (e) {
    console.error('[referral-events] Error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
