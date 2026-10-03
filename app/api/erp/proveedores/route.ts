import { tercerosHandlers } from '@/lib/erp/terceros';

const h = tercerosHandlers('proveedor');
export const GET = h.GET;
export const POST = h.POST;
export const PATCH = h.PATCH;
