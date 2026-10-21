import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requerir, HttpError } from '@/lib/erp/session';
import { hashPasswordScrypt } from '@/lib/erp/password';

/* GET /api/admin/usuarios — list all users (admin, desarrollador) */
export async function GET() {
  try {
    const s = await requerir();
    if (s.rol !== 'admin' && s.rol !== 'desarrollador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo, created_at, referral_slug, payout_bank, payout_account_type, payout_account_number, payout_doc_id')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Error al consultar usuarios' }, { status: 500 });
    return NextResponse.json({ usuarios: data || [] });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* POST /api/admin/usuarios — create user (admin, desarrollador) */
export async function POST(request: Request) {
  try {
    const s = await requerir();
    if (s.rol !== 'admin' && s.rol !== 'desarrollador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { nombre, email, password, rol } = await request.json();
    if (!nombre || !email || !password || !rol) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    if (rol === 'desarrollador' && s.rol !== 'desarrollador') {
      return NextResponse.json({ error: 'Solo un desarrollador puede crear otro desarrollador' }, { status: 403 });
    }

    const supabase = supabaseAdmin();
    const referralSlug = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
    const scryptHash = await hashPasswordScrypt(password);

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        rol,
        activo: true,
        password_hash: scryptHash,
        password_algo: 'scrypt_v1',
        referral_slug: referralSlug,
      })
      .select('id, nombre, email, rol, activo, created_at, referral_slug')
      .single();

    if (error) return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
    return NextResponse.json({ usuario: data });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* PATCH /api/admin/usuarios — update user */
export async function PATCH(request: Request) {
  try {
    const s = await requerir();
    const body = await request.json();
    const { id, rol, activo, password, payout_bank, payout_account_type, payout_account_number, payout_doc_id } = body;
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const isPrivileged = s.rol === 'admin' || s.rol === 'desarrollador';
    const isReferido = s.rol === 'referido';

    if (!isPrivileged && !isReferido) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Un referido solo puede hacer PATCH de sus propios datos bancarios
    if (isReferido) {
      if (s.id !== id) {
        return NextResponse.json({ error: 'Solo puedes modificar tus propios datos' }, { status: 403 });
      }
      if (rol !== undefined || activo !== undefined || password !== undefined) {
        return NextResponse.json({ error: 'No tienes permiso para modificar estos campos' }, { status: 403 });
      }
    }

    const updates: Record<string, unknown> = {};
    if (isPrivileged) {
      if (rol !== undefined) {
        if (rol === 'desarrollador' && s.rol !== 'desarrollador') {
          return NextResponse.json({ error: 'No puedes asignar el rol de desarrollador' }, { status: 403 });
        }
        updates.rol = rol;
      }
      if (activo !== undefined) {
        if (id === s.id && activo === false) {
          return NextResponse.json({ error: 'No puedes desactivar tu propio usuario' }, { status: 400 });
        }
        updates.activo = activo;
      }
      if (password) {
        if (String(password).length < 8) {
          return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
        }
        updates.password_hash = await hashPasswordScrypt(String(password));
        updates.password_algo = 'scrypt_v1';
      }
    }

    if (payout_bank !== undefined) updates.payout_bank = payout_bank;
    if (payout_account_type !== undefined) updates.payout_account_type = payout_account_type;
    if (payout_account_number !== undefined) updates.payout_account_number = payout_account_number;
    if (payout_doc_id !== undefined) updates.payout_doc_id = payout_doc_id;

    const supabase = supabaseAdmin();
    const { error } = await supabase.from('usuarios').update(updates as any).eq('id', id);
    if (error) return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/* DELETE /api/admin/usuarios — deactivate user (admin, desarrollador) */
export async function DELETE(request: Request) {
  try {
    const s = await requerir();
    if (s.rol !== 'admin' && s.rol !== 'desarrollador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    if (id === s.id) {
      return NextResponse.json({ error: 'No puedes desactivar tu propio usuario' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { error } = await supabase.from('usuarios').update({ activo: false }).eq('id', id);
    if (error) return NextResponse.json({ error: 'Error al desactivar usuario' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
