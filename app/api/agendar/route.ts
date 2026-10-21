import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resolveReferrer } from '@/lib/resolveReferrer';
import { registrarFormulario } from '@/lib/erp/formularios';
import { validarLimiteFormulario } from '@/lib/erp/rateLimit';

const corto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}));

    // 1. Honeypot anti-bots
    if (corto(rawBody.website, 200)) {
      return NextResponse.json({ success: true });
    }

    // 2. Límite de tasa por IP
    const { permitido, ipHash } = await validarLimiteFormulario(request, 'agendar');
    if (!permitido) {
      return NextResponse.json(
        { error: 'Has enviado demasiadas solicitudes. Espera 10 minutos.' },
        { status: 429 }
      );
    }

    const nombre = corto(rawBody.nombre, 120);
    const correo = corto(rawBody.correo || rawBody.email, 160);
    const celular = corto(rawBody.celular || rawBody.telefono, 40);
    const fecha = corto(rawBody.fecha, 80);
    const hora = corto(rawBody.hora, 40);
    const medioContacto = corto(rawBody.medio_contacto, 100) || 'llamada';
    const ref = corto(rawBody.ref, 60);

    if (!nombre || !correo || !celular || !fecha) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados.' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // 3. Resolver referido (desde payload ref o cookie)
    let referrerId: string | null = null;
    let referrerRol: string | null = null;
    try {
      const cookieStore = await cookies();
      const refSlug = ref || cookieStore.get('rentash_ref')?.value;
      if (refSlug) {
        const resolved = await resolveReferrer(refSlug);
        if (resolved) {
          referrerId = resolved.id;
          referrerRol = resolved.rol;
        }
      }
    } catch (e) {
      console.error('[api/agendar] Error al verificar referido:', e);
    }

    const isVendedor = referrerRol === 'vendedor';

    // 4. Insertar en tabla histórica `citas`
    const { error: citaErr } = await supabase
      .from('citas')
      .insert({
        nombre,
        correo,
        celular,
        fecha_consulta: fecha,
        hora_consulta: hora || 'Sin hora específica',
        medio_contacto: medioContacto,
        estado: 'agendado',
      });

    if (citaErr) {
      console.error('Error al registrar cita en Supabase:', citaErr);
    }

    // 5. Crear registro en tabla histórica `leads`
    let leadId: string | null = null;
    try {
      const { data: leadData, error: leadErr } = await supabase
        .from('leads')
        .insert({
          nombre,
          cedula: 'Pendiente',
          edad: 0,
          ocupacion: 'empleado',
          celular,
          correo,
          debe_declarar: true,
          topes_superados: [],
          barra_patrimonio: 0,
          barra_ingresos: 0,
          barra_creditos: 0,
          barra_movimientos: 0,
          estado: 'agendado',
          referrer_id: referrerId,
          seller_id: isVendedor ? referrerId : null,
          source: referrerId ? 'referido' : 'directo',
        })
        .select('id')
        .single();

      if (leadData) leadId = leadData.id;
      if (leadErr) console.error('Error insertando en leads:', leadErr);
    } catch (e) {
      console.error('Error en bloque leads:', e);
    }

    // 6. Crear registro en `pipeline_leads`
    let pipelineLeadId: string | null = null;
    try {
      const { data: pLead } = await supabase
        .from('pipeline_leads')
        .insert({
          full_name: nombre,
          email: correo,
          phone: celular,
          source: referrerId ? 'referido' : 'directo',
          referrer_id: referrerId,
          seller_id: isVendedor ? referrerId : null,
          lead_id: leadId,
          stage: 'consultoria',
        })
        .select('id')
        .single();
      if (pLead) pipelineLeadId = pLead.id;
    } catch (e) {
      console.error('Error insertando en pipeline_leads:', e);
    }

    // 7. Registrar evento de referido si existía slug
    if (referrerId) {
      try {
        await supabase.from('referral_events').insert({
          referrer_id: referrerId,
          event_type: 'consultoria',
          contact_name: nombre,
          contact_email: correo,
          contact_phone: celular,
          pipeline_lead_id: pipelineLeadId,
        });
      } catch (e) {
        console.error('Error insertando referral_event:', e);
      }
    }

    // 8. Registrar en erp_formularios
    try {
      await registrarFormulario({
        formulario: 'agendar',
        servicio: 'renta',
        nombre,
        email: correo,
        telefono: celular,
        fecha_preferida: `${fecha} ${hora || ''}`.trim(),
        mensaje: `Medio: ${medioContacto}`,
        responsable_id: isVendedor ? referrerId : null,
        legacy_lead_id: leadId,
        ip_hash: ipHash,
      });
    } catch (formErr) {
      console.error('[api/agendar] Error insertando erp_formularios:', formErr);
    }

    return NextResponse.json({ success: true, leadId });
  } catch (error) {
    console.error('Error en API agendar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
