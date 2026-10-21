'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AgendaBookingClient from '@/components/agenda/AgendaBookingClient';
import { setRefCookie } from '@/lib/referral';

function AgendarPageContent() {
  const searchParams = useSearchParams();
  const leadSlug = searchParams.get('lead') || '';

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setRefCookie(ref);
  }, [searchParams]);

  return (
    <AgendaBookingClient
      link={{
        titulo: 'Reserva tu Consultoría Contable',
        servicio: 'renta',
        duracion_minutos: 30,
        usuario_id: null,
        profesional_nombre: 'Equipo de Contadores Stakeholders',
      }}
      formularioTipo="agendar"
      leadSlug={leadSlug}
    />
  );
}

export default function AgendarPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--mono)',
            fontSize: 12,
          }}
        >
          Cargando agenda…
        </div>
      }
    >
      <AgendarPageContent />
    </Suspense>
  );
}
