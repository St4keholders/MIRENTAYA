import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { crearToken, setSessionCookie } from '@/lib/erp/session';

function hashPwd(pwd: string) {
  return createHash('sha256').update(pwd + 'stakeholders2026').digest('hex');
}

const SUPABASE_URL = 'https://cllpslpejubqqdgnkisf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbHBzbHBlanVicXFkZ25raXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTAwNzgsImV4cCI6MjEwMDEyNjA3OH0.NWBADZJfBIP8XTG4iMMEDug43msf0OlZze7riBD-96s';

/* POST /api/admin/auth — login via SECURITY DEFINER RPC (bypassa RLS) */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password)
      return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
    const supabase = createClient(url, anonKey, { auth: { persistSession: false } });

    // Llama a la función SQL SECURITY DEFINER que bypassa RLS
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_email: email.toLowerCase().trim(),
      p_password_hash: hashPwd(password),
    });

    if (error) {
      console.error('[auth] RPC error:', error.message);
      return NextResponse.json({ error: 'Error interno al autenticar' }, { status: 500 });
    }

    // La función SQL devuelve { error: "..." } o { success: true, user: {...} }
    if (data?.error) {
      return NextResponse.json({ error: data.error }, { status: 401 });
    }

    const res = NextResponse.json({ success: true, user: data.user });
    // Sesión segura (cookie HttpOnly firmada) para el ERP
    try {
      const token = data.user ? crearToken(data.user) : null;
      if (token) setSessionCookie(res, token);
    } catch (e) {
      console.error('[auth] No se pudo crear la sesión del ERP:', e);
    }
    return res;
  } catch (err) {
    console.error('[auth] Error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
