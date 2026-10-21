/**
 * Configuración global de la aplicación.
 * Cuando PAGOS_RENTA_ACTIVOS es false (por defecto fuera de temporada):
 * - No se cobran pagos por pasarela Wompi.
 * - Toda la captación va a agendamiento con contador y registro en el CRM.
 */
export const PAGOS_RENTA_ACTIVOS = process.env.NEXT_PUBLIC_PAGOS_RENTA === 'true';
