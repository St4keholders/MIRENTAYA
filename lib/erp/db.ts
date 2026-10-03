import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase para el ERP. Exige la service_role: las tablas erp_* tienen RLS
 * sin políticas, así que la clave anon (pública) nunca puede leerlas.
 */
let cached: SupabaseClient | null = null;

export function erpDb(): SupabaseClient {
  if (cached) return cached;
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://cllpslpejubqqdgnkisf.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno');
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
