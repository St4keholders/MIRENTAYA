import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { normalizarRol, puede, type Modulo, type Rol } from './permisos';

/**
 * Sesión firmada (HMAC-SHA256) en cookie HttpOnly.
 * Secreto: SESSION_SECRET o, si no existe, SUPABASE_SERVICE_ROLE_KEY (ya configurada en Vercel).
 */
export const SESSION_COOKIE = 'sh_session';
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 horas

export interface Sesion {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  exp: number;
}

function secreto(): string {
  const s = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (s.length < 16) {
    throw new Error('Falta SESSION_SECRET (o SUPABASE_SERVICE_ROLE_KEY) en las variables de entorno');
  }
  return s;
}

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function firmar(payload: string): string {
  return b64url(createHmac('sha256', secreto()).update(payload).digest());
}

export function crearToken(user: { id: string; nombre: string; email: string; rol: string }): string | null {
  const rol = normalizarRol(user.rol);
  if (!rol) return null;
  const sesion: Sesion = {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const payload = b64url(JSON.stringify(sesion));
  return `${payload}.${firmar(payload)}`;
}

export function leerToken(token: string | undefined | null): Sesion | null {
  if (!token) return null;
  const [payload, firma] = token.split('.');
  if (!payload || !firma) return null;
  let esperada: string;
  try {
    esperada = firmar(payload);
  } catch {
    return null;
  }
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(fromB64url(payload).toString('utf8')) as Sesion;
    if (!s.exp || s.exp < Math.floor(Date.now() / 1000)) return null;
    return s;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function getSesion(): Promise<Sesion | null> {
  const store = await cookies();
  return leerToken(store.get(SESSION_COOKIE)?.value);
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Exige sesión válida y (opcional) acceso a un módulo. Lanza HttpError. */
export async function requerir(modulo?: Modulo): Promise<Sesion> {
  const s = await getSesion();
  if (!s) throw new HttpError(401, 'Sesión expirada. Vuelve a iniciar sesión.');
  if (modulo && !puede(s.rol, modulo)) throw new HttpError(403, 'No tienes permiso para este módulo.');
  return s;
}
