import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data: contadores, error } = await supabase
      .from('contadores')
      .select('id, nombre, credencial, especialidad')
      .eq('activo', true);

    if (error) {
      console.error('Error consultando contadores:', error);
      return NextResponse.json({ contadores: [] });
    }

    return NextResponse.json({ contadores });
  } catch (error) {
    console.error('Error fetching contadores:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
