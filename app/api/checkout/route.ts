import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateIntegritySignature, getWompiConfig } from '@/lib/wompi';

// Función auxiliar para guardar en Supabase de forma no bloqueante (segundo plano)
async function saveOrderAsync(
  reference: string,
  amountInCents: number,
  currency: string,
  customer_email?: string | null,
  customer_name?: string | null,
  customer_phone?: string | null,
  lead_slug?: string | null,
  lead_id?: string | null
) {
  try {
    const supabase = supabaseAdmin();
    let resolvedLeadId: string | null = lead_id || null;
    if (!resolvedLeadId && lead_slug) {
      const { data: leadData } = await supabase
        .from('leads')
        .select('id')
        .eq('slug_publico', lead_slug)
        .single();
      resolvedLeadId = leadData?.id ?? null;
    }

    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        reference,
        amount_in_cents: amountInCents,
        currency,
        customer_email: customer_email || null,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        status: 'PENDING',
        lead_slug: lead_slug || null,
        lead_id: resolvedLeadId,
      });

    if (orderError) {
      console.warn('[checkout] No se pudo crear orden en Supabase:', orderError.message);
    } else {
      console.log(`✅ [checkout] Orden ${reference} creada con lead_id: ${resolvedLeadId}`);
    }
  } catch (dbErr: any) {
    console.warn('[checkout] Error de base de datos (no bloquea):', dbErr?.message);
  }
}

import { PAGOS_RENTA_ACTIVOS } from '@/lib/config';

export async function POST(request: Request) {
  if (!PAGOS_RENTA_ACTIVOS) {
    return NextResponse.json(
      { error: 'Los pagos en línea están temporalmente desactivados. Agenda tu cita directamente con un contador.' },
      { status: 410 }
    );
  }

  try {
    const { customer_email, customer_name, customer_phone, lead_slug, lead_id } = await request.json();

    const amountInCents = 5000000; // $50.000 COP en centavos
    const currency = 'COP';
    const reference = `RENTA-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 1. Iniciar guardado en Supabase en segundo plano sin bloquear la respuesta
    saveOrderAsync(
      reference,
      amountInCents,
      currency,
      customer_email,
      customer_name,
      customer_phone,
      lead_slug,
      lead_id
    );

    // 2. Generar firma y URL de Wompi de inmediato
    const signature = generateIntegritySignature(reference, amountInCents, currency);
    const { publicKey } = getWompiConfig();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mirentaya.co';
    const redirectUrl = `${siteUrl}/pagos/respuesta?reference=${reference}`;

    const checkoutUrl =
      `https://checkout.wompi.co/p/` +
      `?public-key=${encodeURIComponent(publicKey)}` +
      `&currency=${encodeURIComponent(currency)}` +
      `&amount-in-cents=${amountInCents}` +
      `&reference=${encodeURIComponent(reference)}` +
      `&signature:integrity=${signature}` +
      `&redirect-url=${encodeURIComponent(redirectUrl)}`;

    console.log('[checkout] URL generada OK →', checkoutUrl);

    return NextResponse.json({
      success: true,
      reference,
      amountInCents,
      currency,
      publicKey,
      signature,
      redirectUrl,
      checkoutUrl,
    });
  } catch (error: any) {
    console.error('[checkout] Error fatal en API checkout:', error);
    return NextResponse.json({ error: error?.message || 'Error interno del servidor' }, { status: 500 });
  }
}
