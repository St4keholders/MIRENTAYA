import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export function hashIp(ip: string): string {
  const salt = process.env.SESSION_SECRET || 'stakeholders_ip_salt';
  return createHash('sha256').update(ip + salt).digest('hex');
}

/**
 * Valida el límite de envíos de formularios públicos: máximo 5 envíos por IP cada 10 minutos.
 */
export async function validarLimiteFormulario(
  req: Request,
  formulario: string
): Promise<{ permitido: boolean; ipHash: string }> {
  const ip = getClientIp(req);
  const ipHash = hashIp(ip);

  try {
    const supabase = supabaseAdmin();
    const diezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from('erp_form_intentos')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', diezMinutosAtras);

    if ((count ?? 0) >= 5) {
      return { permitido: false, ipHash };
    }

    await supabase.from('erp_form_intentos').insert({
      ip_hash: ipHash,
      formulario,
    });

    return { permitido: true, ipHash };
  } catch (err) {
    console.error('[rateLimit] Error al validar erp_form_intentos:', err);
    return { permitido: true, ipHash };
  }
}
