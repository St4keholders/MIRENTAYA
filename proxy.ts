import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'sh_session';

async function verifyHmacSha256(payload: string, signatureB64Url: string, secret: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBase64 = signatureB64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = sigBase64.length % 4 ? '='.repeat(4 - (sigBase64.length % 4)) : '';
    const rawSig = Uint8Array.from(atob(sigBase64 + pad), (c) => c.charCodeAt(0));

    return await crypto.subtle.verify('HMAC', key, rawSig, enc.encode(payload));
  } catch {
    return false;
  }
}

function parsePayload(payloadB64Url: string): { exp?: number; id?: string; rol?: string } | null {
  try {
    const base64 = payloadB64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : '';
    const jsonStr = atob(base64 + pad);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acceso a la página de login
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const [payload, firma] = token.split('.');
  if (!payload || !firma) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const secret = process.env.SESSION_SECRET || '';
  if (secret.length < 16) {
    console.error('[proxy] SESSION_SECRET no configurada o muy corta.');
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const isValidSignature = await verifyHmacSha256(payload, firma, secret);
  if (!isValidSignature) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const sesion = parsePayload(payload);
  if (!sesion || !sesion.exp || sesion.exp < Math.floor(Date.now() / 1000)) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/panel/:path*'],
};
