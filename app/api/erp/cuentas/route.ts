import { NextResponse } from 'next/server';
import { erpDb } from '@/lib/erp/db';
import { handler, ok } from '@/lib/erp/http';
import { requerir } from '@/lib/erp/session';

export const GET = handler(async () => {
  await requerir();
  const data = ok(await erpDb().from('erp_cuentas').select('*').eq('activa', true).order('codigo'));
  return NextResponse.json({ data });
});
