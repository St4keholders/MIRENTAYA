import { documentosHandlers } from '@/lib/erp/documentos';

const h = documentosHandlers('compra');
export const GET = h.GET;
export const POST = h.POST;
