import { notFound } from 'next/navigation';
import Link from 'next/link';
import { erpDb } from '@/lib/erp/db';
import AgendaBookingClient from '@/components/agenda/AgendaBookingClient';
import '@/app/stakeholders.css';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AgendaSlugPage({ params }: Props) {
  const { slug } = await params;
  if (!slug) notFound();

  const supabase = erpDb();
  const { data: link, error } = await supabase
    .from('erp_links_agenda')
    .select(`
      id,
      slug,
      titulo,
      servicio,
      duracion_minutos,
      activo,
      usuario_id,
      usuarios:usuario_id (
        id,
        nombre,
        email
      )
    `)
    .eq('slug', slug)
    .eq('activo', true)
    .maybeSingle();

  if (error || !link) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#000000',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: 36,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'rgba(255,80,80,0.12)',
              border: '1px solid rgba(255,80,80,0.3)',
              color: '#FF8080',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              margin: '0 auto 16px',
            }}
          >
            ✕
          </div>
          <h1
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: '1.5rem',
              margin: '0 0 10px',
            }}
          >
            Link de agenda no disponible
          </h1>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            Este enlace de agenda no existe, ha expirado o se encuentra temporalmente inactivo.
          </p>
          <Link
            href="/renta"
            style={{
              display: 'inline-block',
              padding: '10px 22px',
              borderRadius: 999,
              background: 'rgba(61,107,255,0.2)',
              border: '1px solid rgba(61,107,255,0.5)',
              color: '#7DD3FC',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              textDecoration: 'none',
              letterSpacing: '.06em',
            }}
          >
            Ir a la página principal →
          </Link>
        </div>
      </div>
    );
  }

  const profesionalNombre = (link.usuarios as any)?.nombre || 'Equipo Stakeholders';

  return (
    <AgendaBookingClient
      link={{
        id: link.id,
        slug: link.slug,
        titulo: link.titulo,
        servicio: link.servicio,
        duracion_minutos: link.duracion_minutos,
        usuario_id: link.usuario_id,
        profesional_nombre: profesionalNombre,
      }}
      formularioTipo="agenda_link"
    />
  );
}
