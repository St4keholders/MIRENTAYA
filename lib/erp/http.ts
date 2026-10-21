import { NextResponse } from 'next/server';
import { HttpError } from './session';

type PgLikeError = { message?: string; code?: string; details?: string };

/** Traduce errores controlados de Postgres / PostgREST a mensajes legibles sin exponer datos crudos del motor */
export function mensajeError(err: unknown): string {
  const e = err as PgLikeError;
  if (e?.code === '23505') return 'Ya existe un registro con ese número de documento o identificador.';
  if (e?.code === '23503') return 'El registro está siendo utilizado y no se puede modificar o eliminar.';
  if (e?.code === '23514') return 'Algún valor ingresado no cumple con las reglas requeridas. Revisa los campos.';
  if (e?.code === '22P02') return 'El formato de uno de los datos enviados no es válido.';
  
  // No devolver mensajes crudos de la base de datos al cliente
  return 'Ocurrió un error al procesar la solicitud en el servidor.';
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
      console.error('[erp] Error interno en servidor:', err);
      const isClientError = (err as PgLikeError)?.code?.startsWith('23') || (err as PgLikeError)?.code === '22P02';
      return NextResponse.json(
        { error: mensajeError(err) },
        { status: isClientError ? 400 : 500 }
      );
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

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** Escapa texto para usarlo dentro de un filtro .or() de PostgREST */
export function likeSeguro(q: string): string {
  return q.replace(/[%,()*\\]/g, ' ').trim().slice(0, 80);
}
