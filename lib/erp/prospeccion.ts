/**
 * Utilidades compartidas del módulo de prospección (servidor y cliente).
 * La misma lógica de normalización existe en scraper/stakeholders_scraper/normalizar.py:
 * si cambias una, cambia la otra.
 */

export const FUENTES = {
  google_maps: 'Google Maps',
  directorios: 'Directorios (Páginas Amarillas y similares)',
  web: 'Sitios web de las empresas',
} as const;
export type Fuente = keyof typeof FUENTES;

export const CON_WEBSITE = { indiferente: 'Con o sin website', si: 'Solo con website', no: 'Solo sin website' } as const;
export type ConWebsite = keyof typeof CON_WEBSITE;

export const ESTADOS_BUSQUEDA = {
  pendiente: 'En cola',
  procesando: 'Buscando…',
  completada: 'Completada',
  error: 'Error',
  cancelada: 'Cancelada',
} as const;

/** Tipos de empresa de servicios sugeridos en el formulario (el campo es libre). */
export const TIPOS_SUGERIDOS = [
  'Agencia de marketing', 'Empresa de software', 'Consultoría', 'Agencia de viajes', 'Clínica odontológica',
  'Centro estético', 'Gimnasio', 'Empresa de vigilancia', 'Empresa de aseo', 'Transporte de carga',
  'Logística', 'Agencia de publicidad', 'Arquitectura', 'Ingeniería', 'Abogados', 'Restaurante',
  'Academia / instituto', 'Laboratorio clínico', 'Veterinaria', 'Taller automotriz',
];

/**
 * Normaliza un teléfono colombiano a 10 dígitos.
 *  - Celular: 3XXXXXXXXX
 *  - Fijo (marcación 2021+): 60X + 7 dígitos
 * Devuelve null si no parece un número colombiano válido.
 */
export function normalizarTelefonoCO(raw: string | null | undefined): { numero: string; tipo: 'celular' | 'fijo' } | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('0057')) d = d.slice(4);
  if (d.length === 12 && d.startsWith('57')) d = d.slice(2);
  if (d.length === 10 && /^3[0-5]\d{8}$/.test(d)) return { numero: d, tipo: 'celular' };
  if (d.length === 10 && /^60[1-8]\d{7}$/.test(d)) return { numero: d, tipo: 'fijo' };
  return null;
}

export function linkWhatsApp(raw: string | null | undefined): string | null {
  const t = normalizarTelefonoCO(raw);
  return t && t.tipo === 'celular' ? `https://wa.me/57${t.numero}` : null;
}

export function normalizarEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const e = String(raw).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) ? e : null;
}

export function dominioDe(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '').toLowerCase() || null;
  } catch {
    return null;
  }
}

/** Forma del jsonb `erp_leads.datos` que llena el worker. Todo es opcional. */
export interface DatosProspecto {
  telefonos?: string[];
  emails?: string[];
  whatsapp?: string | null;
  redes?: Record<string, string>;
  web?: string | null;
  direccion?: string | null;
  categoria?: string | null;
  calificacion?: number | null;
  resenas?: number | null;
  contacto_dueno?: { nombre?: string | null; cargo?: string | null; telefono?: string | null; email?: string | null; fuente?: string | null } | null;
  fuentes?: string[];
  puntaje_detalle?: Array<[string, number]>;
  busqueda?: { ciudad: string; tipo_negocio: string; con_website: string } | null;
}
