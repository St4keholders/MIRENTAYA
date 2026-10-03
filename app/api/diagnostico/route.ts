import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const {
      nombre,
      empresa,
      whatsapp,
      correo,
      facturas,
      modalidad,
      direccion,
      fecha,
      hora,
      plan,
    } = payload;

    // Validación de campos requeridos
    if (!nombre?.trim() || !empresa?.trim() || !whatsapp?.trim() || !correo?.trim()) {
      return NextResponse.json(
        { error: 'Por favor completa todos tus datos de contacto y empresa.' },
        { status: 400 }
      );
    }

    if (!facturas) {
      return NextResponse.json(
        { error: 'Por favor selecciona el rango aproximado de facturas de venta al mes.' },
        { status: 400 }
      );
    }

    if (!modalidad || (modalidad !== 'virtual' && modalidad !== 'presencial')) {
      return NextResponse.json(
        { error: 'Por favor selecciona la modalidad de reunión (Virtual o Presencial).' },
        { status: 400 }
      );
    }

    if (modalidad === 'presencial' && !direccion?.trim()) {
      return NextResponse.json(
        { error: 'Para la modalidad presencial en Medellín, la dirección de tu oficina es obligatoria.' },
        { status: 400 }
      );
    }

    if (!fecha || !hora) {
      return NextResponse.json(
        { error: 'Por favor selecciona una fecha y hora preferida para tu diagnóstico.' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    const medioContactoStr =
      modalidad === 'presencial'
        ? `Presencial Medellín: ${direccion.trim()}`
        : 'Virtual (Google Meet)';

    const detalleNotas = [
      `Empresa: ${empresa.trim()}`,
      `Facturas/mes: ${facturas}`,
      plan ? `Plan sugerido: ${plan}` : null,
      `Modalidad: ${modalidad}`,
      modalidad === 'presencial' ? `Dirección: ${direccion.trim()}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    // 1. Guardar en tabla `citas`
    const { error: citaErr } = await supabase.from('citas').insert({
      nombre: `${nombre.trim()} (${empresa.trim()})`,
      correo: correo.trim(),
      celular: whatsapp.trim(),
      fecha_consulta: fecha,
      hora_consulta: hora,
      medio_contacto: `${medioContactoStr} [${detalleNotas}]`,
      estado: 'agendado',
    });

    if (citaErr) {
      console.error('[api/diagnostico] Error al registrar cita:', citaErr);
    }

    // 2. Guardar en tabla `leads`
    let leadId: string | null = null;
    try {
      const { data: leadData, error: leadErr } = await supabase
        .from('leads')
        .insert({
          nombre: `${nombre.trim()} - ${empresa.trim()}`,
          cedula: 'Empresa',
          edad: 0,
          ocupacion: 'empresa',
          celular: whatsapp.trim(),
          correo: correo.trim(),
          debe_declarar: true,
          topes_superados: [facturas],
          barra_patrimonio: 0,
          barra_ingresos: 0,
          barra_creditos: 0,
          barra_movimientos: 0,
          estado: 'diagnostico_solicitado',
          source: 'contabilidad_diagnostico',
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
        full_name: `${nombre.trim()} (${empresa.trim()})`,
        email: correo.trim(),
        phone: whatsapp.trim(),
        source: 'contabilidad_diagnostico',
        lead_id: leadId,
        stage: 'diagnostico',
      });
    } catch (e) {
      console.error('[api/diagnostico] Error en pipeline_leads:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Diagnóstico gratis agendado con éxito. Un contador de nuestro equipo se comunicará contigo para confirmar.',
    });
  } catch (error) {
    console.error('[api/diagnostico] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al procesar tu solicitud. Por favor intenta de nuevo.' },
      { status: 500 }
    );
  }
}
