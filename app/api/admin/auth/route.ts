import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { crearToken, setSessionCookie } from '@/lib/erp/session';
import { verifyPassword, hashPasswordScrypt } from '@/lib/erp/password';

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

function hashIp(ip: string): string {
  const salt = process.env.SESSION_SECRET || 'stakeholders_ip_salt';
  return createHash('sha256').update(ip + salt).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const ip = getClientIp(request);
    const ipHash = hashIp(ip);

    const supabase = supabaseAdmin();
    const quinceMinutosAtras = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // 1. Validar límite de intentos fallidos (máximo 5 por email o IP en 15 minutos)
    const { count: fallosEmail } = await supabase
      .from('erp_login_intentos')
      .select('id', { count: 'exact', head: true })
      .eq('email', normalizedEmail)
      .eq('exito', false)
      .gte('created_at', quinceMinutosAtras);

    const { count: fallosIp } = await supabase
      .from('erp_login_intentos')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .eq('exito', false)
      .gte('created_at', quinceMinutosAtras);

    if ((fallosEmail ?? 0) >= 5 || (fallosIp ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Espera 15 minutos.' },
        { status: 429 }
      );
    }

    // 2. Buscar usuario por email con service_role en el servidor
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo, password_hash, password_algo, referral_slug, phone')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError || !usuario || !usuario.activo) {
      // Registrar intento fallido
      await supabase.from('erp_login_intentos').insert({
        email: normalizedEmail,
        ip_hash: ipHash,
        exito: false,
      });
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    if (!usuario.password_hash) {
      await supabase.from('erp_login_intentos').insert({
        email: normalizedEmail,
        ip_hash: ipHash,
        exito: false,
      });
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    // 3. Verificar contraseña (scrypt con migración transparente de sha256_v1)
    const { valid, needsRehash } = await verifyPassword(
      password,
      usuario.password_hash,
      usuario.password_algo
    );

    if (!valid) {
      await supabase.from('erp_login_intentos').insert({
        email: normalizedEmail,
        ip_hash: ipHash,
        exito: false,
      });
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    // 4. Registrar intento exitoso
    await supabase.from('erp_login_intentos').insert({
      email: normalizedEmail,
      ip_hash: ipHash,
      exito: true,
    });

    // 5. Migración transparente a scrypt si correspondía
    if (needsRehash) {
      try {
        const newHash = await hashPasswordScrypt(password);
        await supabase
          .from('usuarios')
          .update({ password_hash: newHash, password_algo: 'scrypt_v1' })
          .eq('id', usuario.id);
      } catch (rehashErr) {
        console.error('[auth] Error al rehashear a scrypt:', rehashErr);
      }
    }

    // 6. Preparar objeto de usuario seguro (sin password_hash ni password_algo)
    const safeUser = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      referral_slug: usuario.referral_slug,
      phone: usuario.phone,
    };

    const isHttps = request.url.startsWith('https://');
    const res = NextResponse.json({ success: true, user: safeUser });

    // 7. Crear cookie HttpOnly firmada sh_session
    try {
      const token = crearToken(safeUser);
      if (token) setSessionCookie(res, token, isHttps);
    } catch (tokenErr) {
      console.error('[auth] Error creando sesión:', tokenErr);
    }

    return res;
  } catch (err) {
    console.error('[auth] Error en proceso de login:', err);
    return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 500 });
  }
}
