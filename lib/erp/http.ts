import { NextResponse } from 'next/server';
import { HttpError } from './session';

type PgLikeError = { message?: string; code?: string; details?: string };

/** Traduce errores de Postgres / PostgREST a mensajes legibles. */
export function mensajeError(err: unknown): string {
  const e = err as PgLikeError;
  const msg = e?.message || 'Error interno';
  if (e?.code === '23505') return 'Ya existe un registro con ese número de documento.';
  if (e?.code === '23503') return 'El registro está siendo usado por otros documentos y no se puede eliminar.';
  if (e?.code === '23514') return 'Algún valor no es válido. Revisa los campos.';
  if (e?.code === '22P02') return 'Formato de dato inválido.';
  if (e?.code === 'PGRST205' || /schema cache|does not exist/i.test(msg))
    return 'Las tablas del ERP aún no existen. Ejecuta la migración supabase/migrations/20261003_erp_crm.sql en Supabase.';
  return msg;
}

/** Envuelve un handler: maneja HttpError y errores de BD de forma uniforme. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error('[erp]', err);
      return NextResponse.json({ error: mensajeError(err) }, { status: 400 });
    }
  };
}

/** Lanza si Supabase devolvió error. */
export function ok<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

export async function leerJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Cuerpo de la petición inválido');
  }
}

/** Copia solo las claves permitidas, convirtiendo '' en null. */
export function pick(body: Record<string, unknown>, keys: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (k in body) {
      const v = body[k];
      out[k] = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v;
    }
  }
  return out;
}

/** Escapa texto para usarlo dentro de un filtro .or() de PostgREST */
export function likeSeguro(q: string): string {
  return q.replace(/[%,()*\\]/g, ' ').trim().slice(0, 80);
}
