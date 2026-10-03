import { documentosHandlers } from '@/lib/erp/documentos';

const h = documentosHandlers('venta');
export const GET = h.DETALLE;
export const PATCH = h.ACCION;
