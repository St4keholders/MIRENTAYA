import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { handler, ok } from '@/lib/erp/http';
import { requerir } from '@/lib/erp/session';

/* GET — leads del test de renta para importarlos al CRM */
export const GET = handler(async () => {
  const s = await requerir('leads');
  const db = erpDb();

  let query = db.from('leads')
    .select('id, nombre, cedula, celular, correo, debe_declarar, pagado, created_at, referrer_id, seller_id, arquetipos (nombre)')
    .order('created_at', { ascending: false })
    .limit(2000);

  // Vendedor y referido ven SOLO los leads donde son referrer_id o seller_id
  if (s.rol === 'vendedor') {
    query = query.or(`seller_id.eq.${s.id},referrer_id.eq.${s.id}`);
  } else if (s.rol === 'referido') {
    query = query.eq('referrer_id', s.id);
  }

  const leads = ok(await query) as Array<Record<string, unknown>>;
  const vinculados = ok(await db.from('erp_leads').select('id, renta_lead_id, cliente_id').not('renta_lead_id', 'is', null)) as
    Array<{ id: string; renta_lead_id: string; cliente_id: string | null }>;
  const mapa = new Map(vinculados.map((v) => [v.renta_lead_id, v]));
  const data = leads.map((l) => ({
    ...l,
    erp_lead_id: mapa.get(l.id as string)?.id ?? null,
    cliente_id: mapa.get(l.id as string)?.cliente_id ?? null,
  }));
  return NextResponse.json({ data });
});
