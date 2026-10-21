import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Cliente server-side de Supabase con service_role.
 * Lanza un error si falta SUPABASE_SERVICE_ROLE_KEY y jamás cae a la anon key.
 */
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Falta SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL en las variables de entorno');
  }
  if (!serviceRoleKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno');
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
