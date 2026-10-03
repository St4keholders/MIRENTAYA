import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/erp/session';

export async function POST() {
  const res = NextResponse.json({ success: true });
  clearSessionCookie(res);
  return res;
}
