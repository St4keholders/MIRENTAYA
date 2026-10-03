/* Contenido de las páginas de servicio */

export type ServicioId = 'contabilidad' | 'nomina' | 'personalizado';

export interface ServicioInfo {
  id: ServicioId;
  nombre: string;
  titulo: string;
  lead: string;
  ticker: string[];
  incluye: Array<{ t: string; d: string }>;
  pasos: string[];
  ideal: string;
  faq: Array<{ q: string; a: string }>;
  formTitulo: string;
  formSub: string;
  mensajeLabel: string;
  mensajeRequerido?: boolean;
}

export const SERVICIOS_INFO: Record<ServicioId, ServicioInfo> = {
  contabilidad: {
    id: 'contabilidad',
    nombre: 'Contabilidad',
    titulo: 'Tu contabilidad al día, sin sustos con la DIAN',
    lead: 'Llevamos los libros de tu empresa o negocio, presentamos tus impuestos a tiempo y te entregamos números que sí puedes leer para tomar decisiones.',
    ticker: ['Libros contables', 'IVA', 'Retención en la fuente', 'ICA', 'Información exógena', 'Estados financieros', 'NIIF para pymes'],
    incluye: [
      { t: 'Registro contable mensual', d: 'Causamos compras, ventas, gastos y bancos cada mes, con soportes organizados.' },
      { t: 'Declaraciones tributarias', d: 'IVA, retención en la fuente, ICA y renta de la empresa, presentadas antes del vencimiento.' },
      { t: 'Información exógena', d: 'Preparamos y reportamos los medios magnéticos que te exige la DIAN y el municipio.' },
      { t: 'Estados financieros', d: 'Balance, estado de resultados y flujo de caja bajo NIIF para pymes, con una lectura en lenguaje claro.' },
      { t: 'Calendario tributario', d: 'Te avisamos con anticipación qué vence, cuánto vas a pagar y qué documentos necesitamos.' },
      { t: 'Acompañamiento', d: 'Respondemos requerimientos de la DIAN y te asesoramos antes de decisiones con impacto fiscal.' },
    ],
    pasos: [
      'Agendamos una llamada y revisamos cómo está hoy tu contabilidad.',
      'Te enviamos una propuesta con alcance y honorarios.',
      'Recibimos tu información y ponemos los libros al día.',
      'Cada mes te entregamos impuestos presentados y un informe corto.',
    ],
    ideal: 'Empresas SAS, pymes y personas naturales con negocio que facturan y necesitan cumplir sin tener un contador de planta.',
    faq: [
      { q: '¿Pueden recibir una contabilidad atrasada?', a: 'Sí. Primero hacemos un diagnóstico, ponemos al día los periodos pendientes y luego seguimos con el servicio mensual.' },
      { q: '¿Cómo les envío los documentos?', a: 'Por correo o una carpeta compartida. Las facturas electrónicas las tomamos directamente del reporte de la DIAN.' },
      { q: '¿Trabajan con personas naturales con negocio?', a: 'Sí. Llevamos la contabilidad de personas naturales comerciantes y profesionales independientes obligados a llevar libros.' },
    ],
    formTitulo: 'Cuéntanos de tu negocio',
    formSub: 'Te contactamos para entender tu negocio y enviarte una propuesta.',
    mensajeLabel: 'A qué se dedica tu empresa y cuántas facturas manejas al mes',
  },
  nomina: {
    id: 'nomina',
    nombre: 'Nómina',
    titulo: 'Nómina electrónica sin errores, cada quincena',
    lead: 'Liquidamos la nómina de tu equipo, la transmitimos a la DIAN y pagamos la seguridad social a tiempo. Tú solo apruebas.',
    ticker: ['Nómina electrónica', 'PILA', 'Prima', 'Cesantías', 'Vacaciones', 'Liquidaciones', 'Certificados laborales'],
    incluye: [
      { t: 'Liquidación de nómina', d: 'Salarios, horas extra, recargos, auxilio de transporte, deducciones y novedades del periodo.' },
      { t: 'Nómina electrónica DIAN', d: 'Generamos y transmitimos el documento soporte de nómina electrónica cada mes.' },
      { t: 'Seguridad social (PILA)', d: 'Liquidamos aportes a salud, pensión, ARL y parafiscales y preparamos la planilla de pago.' },
      { t: 'Prestaciones sociales', d: 'Prima, cesantías, intereses a las cesantías y vacaciones calculadas y provisionadas.' },
      { t: 'Ingresos y retiros', d: 'Contratos, afiliaciones y liquidaciones finales cuando alguien sale de la empresa.' },
      { t: 'Certificados', d: 'Desprendibles de pago, certificados laborales y de ingresos y retenciones para tu equipo.' },
    ],
    pasos: [
      'Nos cuentas cuántas personas tienes y cómo les pagas hoy.',
      'Cargamos la información del equipo y las condiciones de cada contrato.',
      'Antes de cada pago te enviamos la nómina para que la apruebes.',
      'Transmitimos a la DIAN, pagamos la PILA y entregamos desprendibles.',
    ],
    ideal: 'Empresas y empleadores que quieren dejar de liquidar la nómina en hojas de cálculo y olvidarse de los vencimientos.',
    faq: [
      { q: '¿Tengo que transmitir nómina electrónica?', a: 'La mayoría de empleadores que declaran impuestos está obligada. Te confirmamos si aplica a tu caso y nos encargamos de la transmisión.' },
      { q: '¿También manejan empleadas domésticas?', a: 'Sí. Liquidamos el salario, la seguridad social y las prestaciones de trabajadores del servicio doméstico.' },
      { q: '¿Qué pasa si hay una incapacidad o licencia?', a: 'La reportas como novedad, la liquidamos en la nómina y te indicamos cómo hacer el cobro ante la EPS o la ARL.' },
    ],
    formTitulo: 'Cotiza tu nómina',
    formSub: 'Con el número de personas y la forma de pago podemos cotizarte.',
    mensajeLabel: 'Cuántas personas tienes en nómina y cada cuánto les pagas',
  },
  personalizado: {
    id: 'personalizado',
    nombre: 'Servicio personalizado',
    titulo: 'Un caso que no cabe en un paquete',
    lead: 'Sucesiones, constitución de empresas, saneamiento de deudas con la DIAN, devoluciones de saldos a favor o planeación tributaria. Lo revisamos contigo y armamos el plan.',
    ticker: ['Constitución de empresas', 'Devoluciones', 'Requerimientos DIAN', 'Planeación tributaria', 'Sucesiones', 'Auditoría'],
    incluye: [
      { t: 'Constitución de empresas', d: 'SAS, registro en Cámara de Comercio, RUT y habilitación como facturador electrónico.' },
      { t: 'Requerimientos y sanciones', d: 'Respondemos emplazamientos y requerimientos de la DIAN y buscamos reducir sanciones.' },
      { t: 'Devoluciones y saldos a favor', d: 'Solicitamos la devolución o compensación de saldos a favor en renta e IVA.' },
      { t: 'Planeación tributaria', d: 'Revisamos tu estructura para pagar lo justo, dentro de la ley, antes de que cierre el año.' },
      { t: 'Declaraciones atrasadas', d: 'Presentamos años pendientes de renta, IVA o retención y calculamos la sanción mínima.' },
      { t: 'Revisoría y auditoría', d: 'Revisión de estados financieros y procesos contables cuando lo pide un socio, un banco o la ley.' },
    ],
    pasos: [
      'Nos describes tu caso en el formulario.',
      'Un contador te llama para entender el contexto y los documentos.',
      'Recibes una propuesta con alcance, tiempos y honorarios.',
      'Ejecutamos y te mantenemos al tanto de cada avance.',
    ],
    ideal: 'Personas y empresas con un trámite o problema puntual, o que necesitan una segunda opinión de un contador.',
    faq: [
      { q: '¿Qué documentos necesito?', a: 'Depende del caso. En la primera llamada te decimos exactamente cuáles y cómo enviarlos.' },
      { q: '¿Atienden en cualquier ciudad?', a: 'Sí. Trabajamos de forma remota con clientes en todo Colombia.' },
      { q: '¿Firman los trámites?', a: 'Los trámites que lo requieren los firma un contador público con tarjeta profesional vigente.' },
    ],
    formTitulo: 'Describe tu caso',
    formSub: 'Entre más contexto nos des, más precisa será la propuesta.',
    mensajeLabel: 'Qué necesitas resolver',
    mensajeRequerido: true,
  },
};
