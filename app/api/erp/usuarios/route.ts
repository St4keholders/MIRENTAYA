import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { erpDb } from '@/lib/erp/db';
import { handler, leerJson, ok } from '@/lib/erp/http';
import { normalizarRol } from '@/lib/erp/permisos';
import { HttpError, requerir } from '@/lib/erp/session';

/* Mismo esquema de hash que usa la función authenticate_user existente */
const hashPwd = (pwd: string) => createHash('sha256').update(pwd + 'stakeholders2026').digest('hex');
const ROLES = ['admin', 'contador', 'vendedor', 'referido', 'desarrollador'];
const COLS = 'id, nombre, email, rol, activo, created_at, referral_slug, phone';

const slugDe = (nombre: string) =>
  nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '').slice(0, 24) +
  '-' + Math.random().toString(36).slice(2, 6);

export const GET = handler(async () => {
  await requerir('usuarios');
  const data = ok(await erpDb().from('usuarios').select(COLS).order('created_at', { ascending: false }));
  return NextResponse.json({ data });
});

export const POST = handler(async (req: Request) => {
  const s = await requerir('usuarios');
  const { nombre, email, password, rol, phone } = await leerJson<Record<string, string>>(req);
  if (!nombre?.trim() || !email?.trim() || !password || !rol) throw new HttpError(400, 'Nombre, correo, contraseña y rol son obligatorios');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new HttpError(400, 'Correo inválido');
  if (password.length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres');
  if (!ROLES.includes(rol)) throw new HttpError(400, 'Rol inválido');
  if (rol === 'desarrollador' && normalizarRol(s.rol) !== 'desarrollador') throw new HttpError(403, 'Solo un desarrollador puede crear otro desarrollador');
  const data = ok(await erpDb().from('usuarios').insert({
    nombre: nombre.trim(), email: email.toLowerCase().trim(), rol, activo: true,
    password_hash: hashPwd(password), referral_slug: slugDe(nombre), phone: phone?.trim() || null,
  }).select(COLS).single());
  return NextResponse.json({ data });
});

export const PATCH = handler(async (req: Request) => {
  const s = await requerir('usuarios');
  const { id, rol, activo, password, nombre, phone } = await leerJson<Record<string, unknown>>(req);
  if (!id) throw new HttpError(400, 'ID requerido');
  const upd: Record<string, unknown> = {};
  if (rol !== undefined) {
    if (!ROLES.includes(String(rol))) throw new HttpError(400, 'Rol inválido');
    if (rol === 'desarrollador' && normalizarRol(s.rol) !== 'desarrollador') throw new HttpError(403, 'No puedes asignar ese rol');
    upd.rol = rol;
  }
  if (activo !== undefined) {
    if (id === s.id && activo === false) throw new HttpError(400, 'No puedes desactivar tu propio usuario');
    upd.activo = Boolean(activo);
  }
  if (typeof nombre === 'string' && nombre.trim()) upd.nombre = nombre.trim();
  if (phone !== undefined) upd.phone = phone ? String(phone).trim() : null;
  if (password) {
    if (String(password).length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres');
    upd.password_hash = hashPwd(String(password));
  }
  const data = ok(await erpDb().from('usuarios').update(upd).eq('id', id as string).select(COLS).single());
  return NextResponse.json({ data });
});
