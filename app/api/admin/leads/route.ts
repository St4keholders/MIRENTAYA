import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requerir, HttpError } from '@/lib/erp/session';

/* GET /api/admin/leads — list all leads (admin, desarrollador, contador) */
export async function GET() {
  try {
    const s = await requerir();
    if (s.rol !== 'admin' && s.rol !== 'desarrollador' && s.rol !== 'contador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const supabase = supabaseAdmin();

    const { data: leads, error } = await supabase
      .from('leads')
      .select(`
        id, slug_publico, nombre, cedula, edad, ocupacion,
        celular, correo, debe_declarar, topes_superados,
        barra_patrimonio, barra_ingresos, barra_creditos, barra_movimientos,
        fecha_vencimiento, extemporaneo, estado, pagado, etapa, created_at,
        contador_id, referrer_id, seller_id, source, valor_declaracion,
        arquetipos (nombre, slug),
        contador:usuarios!leads_contador_id_fkey (id, nombre, email, rol),
        referido:usuarios!leads_referrer_id_fkey (id, nombre, email, rol, referral_slug),
        vendedor:usuarios!leads_seller_id_fkey (id, nombre, email, rol),
        respuestas (payload, version_motor, created_at),
        ventas (id, medio_contacto, fecha_consulta, estado)
      `)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Error al consultar leads' }, { status: 500 });

    const leadIds = (leads || []).map((l) => l.id).filter(Boolean);
    const ordersByLeadId: Record<string, Array<{ id: string; reference: string; status: string; amount_in_cents: number; created_at: string }>> = {};
    if (leadIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, reference, status, amount_in_cents, created_at, lead_id')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false });
      for (const o of orders || []) {
        if (o.lead_id) {
          if (!ordersByLeadId[o.lead_id]) ordersByLeadId[o.lead_id] = [];
          ordersByLeadId[o.lead_id].push({
            id: o.id,
            reference: o.reference,
            status: o.status,
            amount_in_cents: o.amount_in_cents,
            created_at: o.created_at,
          });
        }
      }
    }

    const leadsWithOrders = (leads || []).map((l) => ({
      ...l,
      orders: ordersByLeadId[l.id] || [],
    }));

    return NextResponse.json({ leads: leadsWithOrders });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/admin/leads — update lead details (admin, desarrollador, contador) */
export async function PATCH(request: Request) {
  try {
    const s = await requerir();
    if (s.rol !== 'admin' && s.rol !== 'desarrollador' && s.rol !== 'contador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id, nombre, cedula, edad, celular, correo, estado,
      contador_id, referrer_id, seller_id, source, valor_declaracion,
      pagado, etapa
    } = body;

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (nombre !== undefined) updates.nombre = nombre;
    if (cedula !== undefined) updates.cedula = cedula;
    if (edad !== undefined) updates.edad = Number(edad);
    if (celular !== undefined) updates.celular = celular;
    if (correo !== undefined) updates.correo = correo;
    if (estado !== undefined) updates.estado = estado;
    if (contador_id !== undefined) updates.contador_id = contador_id;
    if (referrer_id !== undefined) updates.referrer_id = referrer_id;
    if (seller_id !== undefined) updates.seller_id = seller_id;
    if (source !== undefined) updates.source = source;
    if (valor_declaracion !== undefined) updates.valor_declaracion = Number(valor_declaracion);
    if (pagado !== undefined) updates.pagado = Boolean(pagado);
    if (etapa !== undefined) updates.etapa = etapa;

    const supabase = supabaseAdmin();
    const { error } = await supabase.from('leads').update(updates as any).eq('id', id);

    if (error) return NextResponse.json({ error: 'Error al actualizar lead' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* DELETE /api/admin/leads — delete lead completely (solo admin) */
export async function DELETE(request: Request) {
  try {
    const s = await requerir();
    if (s.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede eliminar leads' }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const supabase = supabaseAdmin();
    await supabase.from('respuestas').delete().eq('lead_id', id);
    await supabase.from('ventas').delete().eq('lead_id', id);
    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) return NextResponse.json({ error: 'Error al eliminar lead' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
