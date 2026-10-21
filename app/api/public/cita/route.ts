import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { registrarFormulario, type TipoFormulario, type ServicioFormulario } from '@/lib/erp/formularios';
import { resolveReferrer } from '@/lib/resolveReferrer';
import { validarLimiteFormulario } from '@/lib/erp/rateLimit';

const corto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // 1. Honeypot anti-bots
    if (corto(body.website, 200)) {
      return NextResponse.json({ success: true, message: 'Recibido' });
    }

    // 2. Límite de tasa por IP (5 cada 10 min)
    const { permitido, ipHash } = await validarLimiteFormulario(request, 'public_cita');
    if (!permitido) {
      return NextResponse.json(
        { error: 'Has enviado demasiadas solicitudes. Espera 10 minutos.' },
        { status: 429 }
      );
    }

    const nombre = corto(body.nombre, 120);
    const email = corto(body.email || body.correo, 160);
    const telefono = corto(body.telefono || body.celular || body.whatsapp, 40);
    const mensaje = corto(body.mensaje, 2000);
    const modalidad = body.modalidad === 'presencial' ? 'presencial' : body.modalidad === 'virtual' ? 'virtual' : null;
    const direccion = corto(body.direccion, 200);

    let rawServicio = corto(body.servicio, 40);
    if (!['contabilidad', 'nomina', 'renta', 'personalizado', 'otro'].includes(rawServicio)) {
      rawServicio = 'otro';
    }
    const servicio = rawServicio as ServicioFormulario;

    const fechaPreferida = corto(body.fecha_preferida || body.fecha, 80);
    const hora = corto(body.hora, 40);
    const citaAtStr = body.cita_at ? new Date(body.cita_at).toISOString() : null;

    const slugResultado = corto(body.slug, 80);
    const linkSlug = corto(body.link, 60);
    const refParam = corto(body.ref, 60);

    if (!nombre) {
      return NextResponse.json({ error: 'Por favor ingresa tu nombre completo.' }, { status: 400 });
    }
    if (!email && !telefono) {
      return NextResponse.json({ error: 'Déjanos al menos un correo o WhatsApp para contactarte.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    let responsableId: string | null = null;
    let linkId: string | null = null;
    let legacyLeadId: string | null = null;

    // 3. Resolver link de agenda si viene indicado
    if (linkSlug) {
      const { data: linkRow } = await supabase
        .from('erp_links_agenda')
        .select('id, usuario_id, servicio, activo')
        .eq('slug', linkSlug)
        .maybeSingle();

      if (linkRow) {
        if (!linkRow.activo) {
          return NextResponse.json({ error: 'Este link de agenda ya no está disponible.' }, { status: 410 });
        }
        linkId = linkRow.id;
        responsableId = linkRow.usuario_id;
      }
    }

    // 4. Si no hay responsable pero hay ref o cookie rentash_ref
    if (!responsableId) {
      const cookieHeader = request.headers.get('cookie') || '';
      const cookieRefMatch = cookieHeader.match(/(?:^|; )rentash_ref=([^;]*)/);
      const refSlug = refParam || (cookieRefMatch ? decodeURIComponent(cookieRefMatch[1]) : null);
      if (refSlug) {
        const resolved = await resolveReferrer(refSlug);
        if (resolved) {
          responsableId = resolved.id;
        }
      }
    }

    // 5. Si viene de un resultado de renta (/r/[slug])
    if (slugResultado) {
      const { data: leadRow } = await supabase
        .from('leads')
        .select('id, referrer_id, seller_id')
        .eq('slug_publico', slugResultado)
        .maybeSingle();

      if (leadRow) {
        legacyLeadId = leadRow.id;
        if (!responsableId) {
          responsableId = leadRow.seller_id || leadRow.referrer_id || null;
        }
      }
    }

    // 6. Determinar tipo de formulario
    let tipoFormulario: TipoFormulario = 'agendar';
    if (linkId) {
      tipoFormulario = 'link_agenda';
    } else if (slugResultado) {
      tipoFormulario = 'renta_resultado';
    } else if (body.formulario === 'renta_cita') {
      tipoFormulario = 'renta_cita';
    } else if (body.formulario === 'agendar') {
      tipoFormulario = 'agendar';
    } else if (servicio === 'renta') {
      tipoFormulario = 'renta_cita';
    }

    // 7. Registrar en erp_formularios
    const regResult = await registrarFormulario({
      formulario: tipoFormulario,
      servicio,
      nombre,
      empresa: corto(body.empresa, 160) || null,
      email: email || null,
      telefono: telefono || null,
      modalidad,
      direccion: direccion || null,
      cita_at: citaAtStr,
      fecha_preferida: fechaPreferida || (hora ? `${fechaPreferida} ${hora}` : null),
      mensaje: mensaje || null,
      datos: body.datos || {},
      responsable_id: responsableId,
      link_id: linkId,
      legacy_lead_id: legacyLeadId,
      ip_hash: ipHash,
    });

    // 8. Escribir en tabla histórica `citas` para compatibilidad
    try {
      await supabase.from('citas').insert({
        nombre,
        correo: email || '',
        celular: telefono || '',
        fecha_consulta: fechaPreferida || (citaAtStr ? citaAtStr.slice(0, 10) : 'Sin fecha'),
        hora_consulta: hora || (citaAtStr ? citaAtStr.slice(11, 16) : 'Sin hora'),
        medio_contacto: modalidad === 'presencial' ? `Presencial: ${direccion}` : 'Virtual (Google Meet / WhatsApp)',
        estado: 'agendado',
      });
    } catch (citaErr) {
      console.error('[public/cita] Error escribiendo en citas legadas:', citaErr);
    }

    return NextResponse.json({
      success: true,
      id: regResult.id,
      nombre,
      cita_at: citaAtStr,
    });
  } catch (error: any) {
    console.error('[public/cita] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al procesar tu solicitud. Por favor intenta de nuevo.' },
      { status: 500 }
    );
  }
}
