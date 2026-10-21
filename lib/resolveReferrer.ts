import { supabaseAdmin } from '@/lib/supabase-admin';

export interface ResolvedReferrer {
  id: string;
  rol: string;
  referral_slug?: string;
}

/**
 * Resuelve un slug de referido a un usuario real en la base de datos `usuarios`.
 * Coincidencia EXACTA por `referral_slug`.
 * No escribe en la tabla `usuarios` ni realiza coincidencias difusas.
 */
export async function resolveReferrer(refSlug: string | null | undefined): Promise<ResolvedReferrer | null> {
  if (!refSlug || typeof refSlug !== 'string') return null;
  const cleanRef = refSlug.trim();
  if (!cleanRef) return null;

  try {
    const supabase = supabaseAdmin();
    const { data: userBySlug } = await supabase
      .from('usuarios')
      .select('id, rol, referral_slug, activo')
      .eq('referral_slug', cleanRef)
      .eq('activo', true)
      .maybeSingle();

    if (userBySlug) {
      return {
        id: userBySlug.id,
        rol: userBySlug.rol,
        referral_slug: userBySlug.referral_slug || undefined,
      };
    }
  } catch (e) {
    console.error('[resolveReferrer] Error buscando por referral_slug:', e);
  }

  return null;
}
