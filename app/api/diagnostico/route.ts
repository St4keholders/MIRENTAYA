import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { erpDb } from '@/lib/erp/db';
import { registrarFormulario, type TipoFormulario, type ServicioFormulario } from '@/lib/erp/formularios';
import { validarLimiteFormulario } from '@/lib/erp/rateLimit';

const TRABAJADORES = ['1 a 5', '6 a 20', '21 a 50', 'Más de 50'];
const MOTIVOS = ['Adquirir el servicio', 'Hablar con un contador'];
const PIEZAS = ['Contabilidad', 'Nómina', 'Contador acompañante', 'Infraestructura tecnológica'];
// inicio: el botón "Hablar con un contador" pregunta qué servicio le interesa
const INTERESES: Record<string, string> = {
  contabilidad: 'Contabilidad',
  nomina: 'Nómina',
  renta: 'Renta persona natural',
  personalizado: 'Servicio personalizado',
  otro: 'Aún no lo sabe',
};

const corto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));

    // 1. Honeypot anti-bots
    if (corto(payload.website, 200)) {
      return NextResponse.json({ success: true });
    }

    // 2. Límite de tasa por IP (máximo 5 cada 10 min)
    const { permitido, ipHash } = await validarLimiteFormulario(request, 'diagnostico');
    if (!permitido) {
      return NextResponse.json(
        { error: 'Has enviado demasiadas solicitudes. Espera 10 minutos.' },
        { status: 429 }
      );
    }

    const nombre = corto(payload.nombre, 120);
    const empresa = corto(payload.empresa, 160);
    const whatsapp = corto(payload.whatsapp, 40);
    const correo = corto(payload.correo, 160);
    const facturas = corto(payload.facturas, 80);
    const modalidad =
      payload.modalidad === 'presencial' ? 'presencial' : payload.modalidad === 'virtual' ? 'virtual' : null;
    const direccion = corto(payload.direccion, 200);
    const fecha = corto(payload.fecha, 80);
    const hora = corto(payload.hora, 40);
    const plan = corto(payload.plan, 80);
    const servicio = corto(payload.servicio, 40);
    const trabajadores = corto(payload.trabajadores, 40);
    const motivo = corto(payload.motivo, 80);
    const piezas = payload.piezas;
    const mensaje = corto(payload.mensaje, 2000);
    const interes = corto(payload.interes, 40);

    const esNomina = servicio === 'nomina';
    const esPersonalizado = servicio === 'personalizado';
    const esInicio = servicio === 'inicio';
    const interesOk = interes in INTERESES ? interes : 'otro';
    const piezasOk: string[] = Array.isArray(piezas)
      ? piezas.filter((p: unknown) => typeof p === 'string' && PIEZAS.includes(p))
      : [];
    const mensajeOk = mensaje;

    // Validación de campos requeridos
    if (!nombre || !empresa || !whatsapp || !correo) {
      return NextResponse.json(
        { error: 'Por favor completa todos tus datos de contacto y empresa.' },
        { status: 400 }
      );
    }

    if (esNomina && !TRABAJADORES.includes(trabajadores)) {
      return NextResponse.json(
        { error: 'Por favor selecciona cuántos trabajadores tienes.' },
        { status: 400 }
      );
    }

    if (!esNomina && !esPersonalizado && !esInicio && !facturas) {
      return NextResponse.json(
        { error: 'Por favor selecciona el rango aproximado de facturas de venta al mes.' },
        { status: 400 }
      );
    }

    if (modalidad === 'presencial' && !direccion) {
      return NextResponse.json(
        { error: 'Para la modalidad presencial en Medellín, la dirección de tu oficina es obligatoria.' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    const medioContactoStr =
      modalidad === 'presencial' ? `Presencial Medellín: ${direccion}` : 'Virtual (Google Meet)';

    const detalleNotas = [
      esNomina
        ? 'Servicio: Nómina'
        : esPersonalizado
        ? 'Servicio: Personalizado'
        : esInicio
        ? `Inicio · Hablar con un contador · Interés: ${INTERESES[interesOk]}`
        : null,
      `Empresa: ${empresa}`,
      esNomina
        ? `Trabajadores: ${trabajadores}`
        : esPersonalizado
        ? `Piezas: ${piezasOk.join(', ') || 'por definir con el contador'}`
        : esInicio
        ? null
        : `Facturas/mes: ${facturas}`,
      esNomina && MOTIVOS.includes(motivo) ? `Necesita: ${motivo}` : null,
      (esPersonalizado || esInicio) && mensajeOk ? `Mensaje: ${mensajeOk}` : null,
      plan ? `Plan sugerido: ${plan}` : null,
      `Modalidad: ${modalidad || 'virtual'}`,
      modalidad === 'presencial' ? `Dirección: ${direccion}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    // 1. Guardar en tabla histórica `citas`
    try {
      await supabase.from('citas').insert({
        nombre: `${nombre} (${empresa})`,
        correo,
        celular: whatsapp,
        fecha_consulta: fecha || 'Por coordinar',
        hora_consulta: hora || 'Preferida',
        medio_contacto: `${medioContactoStr} [${detalleNotas}]`,
        estado: 'agendado',
      });
    } catch (citaErr) {
      console.error('[api/diagnostico] Error al registrar cita legada:', citaErr);
    }

    // 2. Guardar en tabla histórica `leads`
    let leadId: string | null = null;
    const topesSuperados = [
      esNomina
        ? `Trabajadores: ${trabajadores}`
        : esPersonalizado
        ? `Piezas: ${piezasOk.join(', ') || 'por definir'}`
        : esInicio
        ? `Interés: ${INTERESES[interesOk]}`
        : facturas,
    ].filter(Boolean) as string[];

    const leadSource = esNomina
      ? 'nomina_cita'
      : esPersonalizado
      ? 'personalizado_cita'
      : esInicio
      ? 'inicio_cita'
      : 'contabilidad_diagnostico';

    try {
      const { data: leadData, error: leadErr } = await supabase
        .from('leads')
        .insert({
          nombre: `${nombre} - ${empresa}`,
          cedula: 'Empresa',
          edad: 0,
          ocupacion: 'empresa',
          celular: whatsapp,
          correo,
          debe_declarar: true,
          topes_superados: topesSuperados,
          barra_patrimonio: 0,
          barra_ingresos: 0,
          barra_creditos: 0,
          barra_movimientos: 0,
          estado: 'diagnostico_solicitado',
          source: leadSource,
        })
        .select('id')
        .single();

      if (leadData) leadId = leadData.id;
      if (leadErr) console.error('[api/diagnostico] Error insertando en leads:', leadErr);
    } catch (e) {
      console.error('[api/diagnostico] Error en bloque leads:', e);
    }

    // 3. Guardar en `pipeline_leads`
    try {
      await supabase.from('pipeline_leads').insert({
        full_name: `${nombre} (${empresa})`,
        email: correo,
        phone: whatsapp,
        source: leadSource,
        lead_id: leadId,
        stage: 'diagnostico',
      });
    } catch (e) {
      console.error('[api/diagnostico] Error en pipeline_leads:', e);
    }

    // 4. Nómina, personalizado e inicio: también en `erp_leads`
    if (esNomina || esPersonalizado || esInicio) {
      try {
        const { error: crmErr } = await erpDb().from('erp_leads').insert({
          nombre,
          empresa,
          email: correo,
          telefono: whatsapp,
          servicio: esNomina ? 'nomina' : esPersonalizado ? 'personalizado' : interesOk,
          origen: 'web',
          mensaje: `${detalleNotas} | Cita: ${fecha}`,
        });
        if (crmErr) console.error('[api/diagnostico] Error en erp_leads:', crmErr);
      } catch (e) {
        console.error('[api/diagnostico] Error en erp_leads:', e);
      }
    }

    // 5. Registrar en la tabla `erp_formularios` (pestaña Formularios del CRM)
    let tipoFormulario: TipoFormulario = 'contabilidad';
    let servicioFinal: ServicioFormulario = 'contabilidad';

    if (esNomina) {
      tipoFormulario = 'nomina';
      servicioFinal = 'nomina';
    } else if (esPersonalizado) {
      tipoFormulario = 'personalizado';
      servicioFinal = 'personalizado';
    } else if (esInicio) {
      tipoFormulario = 'inicio';
      servicioFinal = ['contabilidad', 'nomina', 'renta', 'personalizado'].includes(interesOk)
        ? (interesOk as ServicioFormulario)
        : 'otro';
    }

    await registrarFormulario({
      formulario: tipoFormulario,
      servicio: servicioFinal,
      nombre,
      empresa,
      email: correo,
      telefono: whatsapp,
      modalidad,
      direccion: direccion || null,
      fecha_preferida: fecha ? `${fecha} ${hora || ''}`.trim() : null,
      mensaje: detalleNotas,
      datos: {
        facturas,
        plan,
        trabajadores: trabajadores || null,
        motivo: motivo || null,
        piezas: piezasOk.length > 0 ? piezasOk : null,
        interes: interesOk || null,
      },
      legacy_lead_id: leadId,
      ip_hash: ipHash,
    });

    return NextResponse.json({
      success: true,
      message:
        'Diagnóstico gratis agendado con éxito. Un contador de nuestro equipo se comunicará contigo para confirmar.',
    });
  } catch (error) {
    console.error('[api/diagnostico] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al procesar tu solicitud. Por favor intenta de nuevo.' },
      { status: 500 }
    );
  }
}
