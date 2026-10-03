import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { mensajeError } from '@/lib/erp/http';

const SERVICIOS = ['contabilidad', 'nomina', 'renta', 'personalizado', 'otro'];
const corto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/* POST — formulario público de las páginas de servicio → crea un lead en el CRM */
export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    if (corto(b.website, 200)) return NextResponse.json({ success: true }); // honeypot anti-bots
    const nombre = corto(b.nombre, 120);
    const email = corto(b.email, 160);
    const telefono = corto(b.telefono, 40);
    const servicio = SERVICIOS.includes(b.servicio) ? b.servicio : 'otro';
    if (!nombre) return NextResponse.json({ error: 'Escribe tu nombre' }, { status: 400 });
    if (!email && !telefono) return NextResponse.json({ error: 'Déjanos un correo o un celular para contactarte' }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });

    const { error } = await erpDb().from('erp_leads').insert({
      nombre, email: email || null, telefono: telefono || null, servicio, origen: 'web',
      empresa: corto(b.empresa, 160) || null,
      mensaje: corto(b.mensaje, 2000) || null,
    });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[solicitud]', err);
    return NextResponse.json({ error: mensajeError(err) }, { status: 500 });
  }
}
