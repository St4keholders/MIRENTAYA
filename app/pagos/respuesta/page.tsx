'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import '@/app/stakeholders.css';

function RespuestaContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!reference) {
      setLoading(false);
      return;
    }

    // Polling inicial para consultar estado de la orden
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/pipeline`); // fallback list or custom query
        // Order state check
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [reference]);

  const bg = '#000';
  const border = 'rgba(255,255,255,0.08)';
  const cardBg = 'rgba(255,255,255,0.04)';
  const sub = 'rgba(255,255,255,0.45)';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#fff', fontFamily: 'var(--body)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 'min(100%, 520px)', background: cardBg, border: `1px solid ${border}`, borderRadius: 24, padding: '36px 28px', textAlign: 'center' }}>

        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(78,214,161,0.15)', border: '1px solid rgba(78,214,161,0.4)', color: '#4ED6A1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 20px' }}>
          ✓
        </div>

        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF', display: 'block', marginBottom: 6 }}>
          Estado del Pago
        </span>

        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.8rem', margin: '0 0 12px', letterSpacing: '-.03em' }}>
          Transacción Procesada
        </h1>

        <p style={{ fontSize: 14, color: sub, lineHeight: 1.6, margin: '0 0 24px' }}>
          Hemos recibido la confirmación de tu pago. Nuestro equipo se pondrá en contacto contigo para continuar con la consultoría y declaración.
        </p>

        {reference && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${border}`, borderRadius: 12, padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: '#7DD3FC', marginBottom: 24 }}>
            Referencia de pago: <strong>{reference}</strong>
          </div>
        )}

        <a
          href="/renta"
          style={{
            display: 'inline-block', padding: '12px 28px', borderRadius: 12,
            background: 'rgba(61,107,255,0.2)', border: '1px solid rgba(61,107,255,0.5)',
            color: '#7DD3FC', fontFamily: 'var(--mono)', fontSize: 12, textDecoration: 'none',
            letterSpacing: '.1em', textTransform: 'uppercase', transition: 'all .2s',
          }}
        >
          Volver al Inicio
        </a>
      </div>
    </div>
  );
}

export default function PagoRespuestaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: 40, textAlign: 'center' }}>Cargando...</div>}>
      <RespuestaContent />
    </Suspense>
  );
}
