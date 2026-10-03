import { NextResponse } from 'next/server';
import { getSesion } from '@/lib/erp/session';
import { PERMISOS } from '@/lib/erp/permisos';

export async function GET() {
  const s = await getSesion();
  if (!s) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 });
  return NextResponse.json({ data: { id: s.id, nombre: s.nombre, email: s.email, rol: s.rol, modulos: PERMISOS[s.rol] } });
}
