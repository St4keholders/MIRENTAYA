import { erpDb } from './db';
import { ok } from './http';

export type TipoFormulario =
  | 'contabilidad'
  | 'nomina'
  | 'personalizado'
  | 'inicio'
  | 'renta_cita'
  | 'renta_resultado'
  | 'renta_test'
  | 'link_agenda'
  | 'agendar';

export type ServicioFormulario = 'contabilidad' | 'nomina' | 'renta' | 'personalizado' | 'otro';

export interface RegistrarFormularioInput {
  formulario: TipoFormulario;
  servicio?: ServicioFormulario;
  nombre: string;
  empresa?: string | null;
  email?: string | null;
  telefono?: string | null;
  modalidad?: 'virtual' | 'presencial' | null;
  direccion?: string | null;
  cita_at?: string | null;
  fecha_preferida?: string | null;
  mensaje?: string | null;
  datos?: Record<string, unknown>;
  responsable_id?: string | null;
  link_id?: string | null;
  legacy_lead_id?: string | null;
  ip_hash?: string | null;
}

export async function registrarFormulario(input: RegistrarFormularioInput): Promise<{ id: string }> {
  const db = erpDb();

  const insertData = {
    formulario: input.formulario,
    servicio: input.servicio || 'otro',
    nombre: input.nombre.trim(),
    empresa: input.empresa ? input.empresa.trim() : null,
    email: input.email ? input.email.trim() : null,
    telefono: input.telefono ? input.telefono.trim() : null,
    modalidad: input.modalidad || null,
    direccion: input.direccion ? input.direccion.trim() : null,
    cita_at: input.cita_at || null,
    fecha_preferida: input.fecha_preferida ? input.fecha_preferida.trim() : null,
    mensaje: input.mensaje ? input.mensaje.trim() : null,
    datos: input.datos || {},
    responsable_id: input.responsable_id || null,
    link_id: input.link_id || null,
    legacy_lead_id: input.legacy_lead_id || null,
    ip_hash: input.ip_hash || null,
    estado: 'pendiente',
  };

  const data = ok(
    await db.from('erp_formularios').insert(insertData).select('id').single()
  ) as { id: string };

  return data;
}
