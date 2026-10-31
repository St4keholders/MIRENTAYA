import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { calcularResultado, RespuestasCuestionario } from '@/lib/motor';
import { resolveReferrer } from '@/lib/resolveReferrer';
import { registrarFormulario } from '@/lib/erp/formularios';
import { validarLimiteFormulario } from '@/lib/erp/rateLimit';

const corto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}));

    // 1. Honeypot anti-bots
    if (corto(rawBody.website, 200)) {
      return NextResponse.json({ success: true, slugPublico: 'demo-slug' });
    }

    // 2. Límite de envíos por IP (máximo 5 cada 10 min)
    const { permitido, ipHash } = await validarLimiteFormulario(request, 'leads');
    if (!permitido) {
      return NextResponse.json(
        { error: 'Has enviado demasiadas solicitudes. Espera 10 minutos.' },
        { status: 429 }
      );
    }

    const payload = rawBody as RespuestasCuestionario & {
      ref?: string;
      correo?: string;
      email?: string;
    };

    const nombre = corto(payload.nombre, 120);
    const cedula = corto(payload.cedula, 40);
    const edad = Number(payload.edad) || 0;
    const celular = corto(payload.celular, 40);
    const correo = corto(payload.correo || payload.email, 160);
    const ocupacion = corto(payload.ocupacion, 40) || 'empleado';

    if (!nombre || !cedula || !edad) {
      return NextResponse.json({ error: 'Datos incompletos: Nombre, cédula y edad son obligatorios' }, { status: 400 });
    }

    // Calcular resultado con el motor
    const resultado = calcularResultado({
      ...payload,
      nombre,
      cedula,
      edad,
      celular,
      ocupacion: ocupacion as 'empleado' | 'independiente',
    });

    const supabase = supabaseAdmin();

    // Obtener ID de arquetipo en la BD
    const { data: arqData } = await supabase
      .from('arquetipos')
      .select('id')
      .eq('slug', resultado.arquetipoSlug)
      .maybeSingle();

    const arquetipoId = arqData?.id ?? null;

    // 3. Resolver referrer_id desde el slug de referido (pasado por el cliente o cookie)
    let referrerId: string | null = null;
    let referrerRol: string | null = null;
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/(?:^|; )rentash_ref=([^;]*)/);
    const refToResolve = corto(payload.ref, 60) || (cookieMatch ? decodeURIComponent(cookieMatch[1]) : null);

    if (refToResolve) {
      const resolved = await resolveReferrer(refToResolve);
      if (resolved) {
        referrerId = resolved.id;
        referrerRol = resolved.rol;
      }
    }

    // 4. Insertar Lead con referrer_id resuelto
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert({
        nombre,
        cedula,
        edad,
        ocupacion,
        celular: celular || null,
        correo: correo || null,
        arquetipo_id: arquetipoId,
        debe_declarar: resultado.debeDeclarar,
        topes_superados: resultado.topesSuperados,
        barra_patrimonio: resultado.barraPatrimonio,
        barra_ingresos: resultado.barraIngresos,
        barra_creditos: resultado.barraCreditos,
        barra_movimientos: resultado.barraMovimientos,
        fecha_vencimiento: resultado.fechaVencimiento,
        extemporaneo: resultado.extemporaneo,
        estado: 'nuevo',
        referrer_id: referrerId,
        seller_id: referrerRol === 'vendedor' ? referrerId : null,
        source: referrerId ? 'referido' : 'directo',
      })
      .select('id, slug_publico')
      .single();

    if (leadError || !leadData) {
      console.error('Error insertando lead:', leadError);
      return NextResponse.json(
        { error: 'Error guardando resultado en la base de datos' },
        { status: 500 }
      );
    }

    // 5. Insertar Respuestas para trazabilidad y recálculo
    try {
      await supabase.from('respuestas').insert({
        lead_id: leadData.id,
        payload: JSON.parse(JSON.stringify(payload)),
        version_motor: 'v1.0',
      });
    } catch (respErr) {
      console.error('[api/leads] Error insertando respuestas:', respErr);
    }

    // 6. Auto-crear entrada en pipeline_leads (ARREGLO DE BUG: celular NO en el campo email)
    let pipelineLeadId: string | null = null;
    try {
      const { data: pLead } = await supabase.from('pipeline_leads').insert({
        full_name: nombre,
        email: correo || null, // Corregido: ya no pone el celular en email
        phone: celular || null,
        source: referrerId ? 'referido' : 'formulario',
        stage: 'consultoria',
        lead_id: leadData.id,
        referrer_id: referrerId,
        seller_id: referrerRol === 'vendedor' ? referrerId : null,
      }).select('id').maybeSingle();
      if (pLead) pipelineLeadId = pLead.id;
    } catch (e) {
      console.error('[api/leads] Error insertando pipeline_leads:', e);
    }

    // 7. Registrar evento de referido si existía
    if (referrerId) {
      try {
        await supabase.from('referral_events').insert({
          referrer_id: referrerId,
          event_type: 'test',
          contact_name: nombre,
          contact_email: correo || null,
          contact_phone: celular || null,
          pipeline_lead_id: pipelineLeadId,
        });
      } catch (e) {
        console.error('[api/leads] Error insertando referral_event:', e);
      }
    }

    // 8. Registrar en erp_formularios (formulario renta_test)
    try {
      await registrarFormulario({
        formulario: 'renta_test',
        servicio: 'renta',
        nombre,
        email: correo || null,
        telefono: celular || null,
        mensaje: `Resultado: ${resultado.debeDeclarar ? 'Debe declarar' : 'No debe declarar'} - Arquetipo: ${resultado.arquetipoSlug}`,
        datos: {
          arquetipo: resultado.arquetipoSlug,
          debe_declarar: resultado.debeDeclarar,
          topes_superados: resultado.topesSuperados,
        },
        responsable_id: referrerRol === 'vendedor' ? referrerId : null,
        legacy_lead_id: leadData.id,
        ip_hash: ipHash,
      });
    } catch (formErr) {
      console.error('[api/leads] Error registrando en erp_formularios:', formErr);
    }

    return NextResponse.json({
      success: true,
      slugPublico: leadData.slug_publico,
    });
  } catch (error: any) {
    console.error('Error procesando cuestionario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
