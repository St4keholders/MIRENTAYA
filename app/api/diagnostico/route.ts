import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { erpDb } from '@/lib/erp/db';

const TRABAJADORES = ['1 a 5', '6 a 20', '21 a 50', 'Más de 50'];
const MOTIVOS = ['Adquirir el servicio', 'Hablar con un contador'];
const PIEZAS = ['Contabilidad', 'Nómina', 'Contador acompañante', 'Infraestructura tecnológica'];
// inicio: el botón "Hablar con un contador" pregunta qué servicio le interesa
const INTERESES: Record<string, string> = {
  contabilidad: 'Contabilidad', nomina: 'Nómina', renta: 'Renta persona natural', personalizado: 'Servicio personalizado', otro: 'Aún no lo sabe',
};

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
      servicio,
      trabajadores,
      motivo,
      piezas,
      mensaje,
      interes,
    } = payload;
    // /nomina usa el mismo agendamiento, con trabajadores en lugar de facturas
    const esNomina = servicio === 'nomina';
    // /personalizado: el cliente arma su servicio con las piezas que escoge
    const esPersonalizado = servicio === 'personalizado';
    const esInicio = servicio === 'inicio';
    const interesOk = typeof interes === 'string' && interes in INTERESES ? interes : 'otro';
    const piezasOk: string[] = Array.isArray(piezas) ? piezas.filter((p: unknown) => typeof p === 'string' && PIEZAS.includes(p)) : [];
    const mensajeOk = typeof mensaje === 'string' ? mensaje.trim().slice(0, 2000) : '';

    // Validación de campos requeridos
    if (!nombre?.trim() || !empresa?.trim() || !whatsapp?.trim() || !correo?.trim()) {
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
      esNomina ? 'Servicio: Nómina' : esPersonalizado ? 'Servicio: Personalizado' : esInicio ? `Inicio · Hablar con un contador · Interés: ${INTERESES[interesOk]}` : null,
      `Empresa: ${empresa.trim()}`,
      esNomina ? `Trabajadores: ${trabajadores}` : esPersonalizado ? `Piezas: ${piezasOk.join(', ') || 'por definir con el contador'}` : esInicio ? null : `Facturas/mes: ${facturas}`,
      esNomina && MOTIVOS.includes(motivo) ? `Necesita: ${motivo}` : null,
      (esPersonalizado || esInicio) && mensajeOk ? `Mensaje: ${mensajeOk}` : null,
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
          topes_superados: [esNomina ? `Trabajadores: ${trabajadores}` : esPersonalizado ? `Piezas: ${piezasOk.join(', ') || 'por definir'}` : esInicio ? `Interés: ${INTERESES[interesOk]}` : facturas],
          barra_patrimonio: 0,
          barra_ingresos: 0,
          barra_creditos: 0,
          barra_movimientos: 0,
          estado: 'diagnostico_solicitado',
          source: esNomina ? 'nomina_cita' : esPersonalizado ? 'personalizado_cita' : esInicio ? 'inicio_cita' : 'contabilidad_diagnostico',
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
        source: esNomina ? 'nomina_cita' : esPersonalizado ? 'personalizado_cita' : esInicio ? 'inicio_cita' : 'contabilidad_diagnostico',
        lead_id: leadId,
        stage: 'diagnostico',
      });
    } catch (e) {
      console.error('[api/diagnostico] Error en pipeline_leads:', e);
    }

    // 4. Nómina, personalizado e inicio: también quedan en los leads del CRM con su servicio
    if (esNomina || esPersonalizado || esInicio) {
      try {
        const { error: crmErr } = await erpDb().from('erp_leads').insert({
          nombre: nombre.trim(),
          empresa: empresa.trim(),
          email: correo.trim(),
          telefono: whatsapp.trim(),
          servicio: esNomina ? 'nomina' : esPersonalizado ? 'personalizado' : interesOk,
          origen: 'web',
          mensaje: `${detalleNotas} | Cita: ${fecha}`,
        });
        if (crmErr) console.error('[api/diagnostico] Error en erp_leads:', crmErr);
      } catch (e) {
        console.error('[api/diagnostico] Error en erp_leads:', e);
      }
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
