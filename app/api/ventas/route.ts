import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { registrarFormulario } from '@/lib/erp/formularios';
import { validarLimiteFormulario } from '@/lib/erp/rateLimit';

const corto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}));

    // 1. Honeypot
    if (corto(rawBody.website, 200)) {
      return NextResponse.json({ success: true });
    }

    // 2. Límite de tasa
    const { permitido, ipHash } = await validarLimiteFormulario(request, 'ventas');
    if (!permitido) {
      return NextResponse.json(
        { error: 'Has enviado demasiadas solicitudes. Espera 10 minutos.' },
        { status: 429 }
      );
    }

    const leadSlug = corto(rawBody.leadSlug, 80);
    const contadorId = rawBody.contadorId;
    const fechaConsulta = corto(rawBody.fechaConsulta, 80);
    const medioContacto = corto(rawBody.medioContacto, 80) || 'whatsapp';

    if (!leadSlug || !fechaConsulta) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Buscar el lead por slug_publico
    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .select('id, nombre, correo, celular, seller_id, referrer_id')
      .eq('slug_publico', leadSlug)
      .single();

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    // Insertar venta en estado agendado
    const { data: venta, error: ventaErr } = await supabase
      .from('ventas')
      .insert({
        lead_id: lead.id,
        contador_id: contadorId ? Number(contadorId) : null,
        abono_consulta: 100000,
        pago_confirmado: false,
        fecha_consulta: fechaConsulta,
        medio_contacto: medioContacto,
        estado: 'agendado',
      })
      .select('id')
      .single();

    if (ventaErr || !venta) {
      console.error('Error al registrar venta:', ventaErr);
      return NextResponse.json({ error: 'Error al registrar la cita' }, { status: 500 });
    }

    // Actualizar estado del lead a 'agendado'
    await supabase.from('leads').update({ estado: 'agendado' }).eq('id', lead.id);

    // Registrar en erp_formularios
    try {
      await registrarFormulario({
        formulario: 'renta_resultado',
        servicio: 'renta',
        nombre: lead.nombre,
        email: lead.correo,
        telefono: lead.celular,
        fecha_preferida: fechaConsulta,
        mensaje: `Medio: ${medioContacto}`,
        responsable_id: lead.seller_id || lead.referrer_id || null,
        legacy_lead_id: lead.id,
        ip_hash: ipHash,
      });
    } catch (formErr) {
      console.error('[api/ventas] Error registrando en erp_formularios:', formErr);
    }

    return NextResponse.json({ success: true, ventaId: venta.id });
  } catch (error) {
    console.error('Error en agendamiento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
