import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { erpDb } from './db';
import { normalizarRol, puede, type Modulo, type Rol } from './permisos';

/**
 * Sesión firmada (HMAC-SHA256) en cookie HttpOnly.
 * Secreto: SESSION_SECRET obligatoria.
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
  const s = process.env.SESSION_SECRET || '';
  if (s.length < 16) {
    throw new Error('Falta SESSION_SECRET en las variables de entorno (mínimo 16 caracteres)');
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

export function setSessionCookie(res: NextResponse, token: string, requestIsHttps?: boolean) {
  const isSecure = process.env.NODE_ENV === 'production' || Boolean(requestIsHttps);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isSecure,
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

export const obtenerSesionERP = getSesion;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** 
 * Exige sesión válida y (opcional) acceso a un módulo.
 * Revalida siempre `usuarios.activo` y `usuarios.rol` en la base de datos.
 * Lanza HttpError.
 */
export async function requerir(modulo?: Modulo): Promise<Sesion> {
  const s = await getSesion();
  if (!s) throw new HttpError(401, 'Sesión expirada. Vuelve a iniciar sesión.');

  // Consulta el estado real del usuario en la base de datos
  const db = erpDb();
  const { data: usuario, error } = await db
    .from('usuarios')
    .select('id, activo, rol')
    .eq('id', s.id)
    .maybeSingle();

  if (error || !usuario || !usuario.activo) {
    throw new HttpError(401, 'Usuario inactivo o sesión no válida.');
  }

  const rolActual = normalizarRol(usuario.rol);
  if (!rolActual) {
    throw new HttpError(403, 'Rol de usuario no reconocido.');
  }
  s.rol = rolActual;

  if (modulo && !puede(s.rol, modulo)) {
    throw new HttpError(403, 'No tienes permiso para este módulo.');
  }
  return s;
}

/** Exige que la sesión tenga uno de los roles autorizados */
export async function requerirRol(rolesPermitidos: Rol[]): Promise<Sesion> {
  const s = await requerir();
  if (!rolesPermitidos.includes(s.rol)) {
    throw new HttpError(403, 'No tienes permiso para realizar esta acción.');
  }
  return s;
}
