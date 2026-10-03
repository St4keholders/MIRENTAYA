import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/admin/clean-data
 * Endpoint administrativo para vaciar todos los datos de prueba de clientes.
 */
export async function POST() {
  try {
    const supabase = supabaseAdmin();

    const results: Record<string, number> = {};

    // 1. Leads e hijos
    const { data: leads } = await supabase.from('leads').select('id');
    const leadIds = (leads || []).map((l) => l.id).filter(Boolean);

    if (leadIds.length > 0) {
      const { count: cResp } = await supabase.from('respuestas').delete({ count: 'exact' }).in('lead_id', leadIds);
      results['respuestas'] = cResp ?? leadIds.length;

      const { count: cVentas } = await supabase.from('ventas').delete({ count: 'exact' }).in('lead_id', leadIds);
      results['ventas'] = cVentas ?? 0;

      const { count: cOrders } = await supabase.from('orders').delete({ count: 'exact' }).in('lead_id', leadIds);
      results['orders'] = cOrders ?? 0;
    }

    // 2. Pipeline leads
    const { data: pLeads } = await supabase.from('pipeline_leads').select('id');
    const pLeadIds = (pLeads || []).map((p) => p.id).filter(Boolean);

    if (pLeadIds.length > 0) {
      await supabase.from('commissions').delete().in('pipeline_lead_id', pLeadIds);
      await supabase.from('lead_requests').delete().in('pipeline_lead_id', pLeadIds);
      await supabase.from('referral_events').delete().in('pipeline_lead_id', pLeadIds);
      const { count: cPipe } = await supabase.from('pipeline_leads').delete({ count: 'exact' }).in('id', pLeadIds);
      results['pipeline_leads'] = cPipe ?? pLeadIds.length;
    }

    // 3. Citas
    const { data: citas } = await supabase.from('citas').select('id');
    const citaIds = (citas || []).map((c) => c.id).filter(Boolean);
    if (citaIds.length > 0) {
      const { count: cCitas } = await supabase.from('citas').delete({ count: 'exact' }).in('id', citaIds);
      results['citas'] = cCitas ?? citaIds.length;
    }

    // 4. Leads
    if (leadIds.length > 0) {
      const { count: cLeads } = await supabase.from('leads').delete({ count: 'exact' }).in('id', leadIds);
      results['leads'] = cLeads ?? leadIds.length;
    }

    return NextResponse.json({
      success: true,
      message: 'Vaciado de clientes de prueba completado exitosamente.',
      deletedRecords: results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error interno al vaciar datos' },
      { status: 500 }
    );
  }
}
