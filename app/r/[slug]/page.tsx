import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import ResultClientView from './ResultClientView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = supabaseAdmin();

  const { data: lead } = await supabase
    .from('leads')
    .select('nombre, arquetipos(nombre, tagline)')
    .eq('slug_publico', slug)
    .maybeSingle();

  if (!lead) return { title: 'Resultado no encontrado | Renta 2026' };

  const arq = lead.arquetipos as { nombre?: string; tagline?: string } | null;
  return {
    title: `${lead.nombre} es ${arq?.nombre || 'un Arquetipo Tributario'} | Renta 2026`,
    description: arq?.tagline || 'Descubre tu arquetipo financiero y si debes declarar renta ante la DIAN.',
  };
}

export default async function ResultPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = supabaseAdmin();

  // Fetch lead with arquetipo details
  const { data: lead, error } = await supabase
    .from('leads')
    .select(`
      id,
      slug_publico,
      nombre,
      celular,
      correo,
      debe_declarar,
      topes_superados,
      barra_patrimonio,
      barra_ingresos,
      barra_creditos,
      barra_movimientos,
      fecha_vencimiento,
      extemporaneo,
      arquetipos (
        slug,
        nombre,
        tagline,
        descripcion,
        url_imagen,
        url_video
      )
    `)
    .eq('slug_publico', slug)
    .maybeSingle();

  if (error || !lead) {
    notFound();
  }

  return <ResultClientView lead={lead as any} />;
}
