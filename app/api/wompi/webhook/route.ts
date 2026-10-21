import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyEventChecksum } from '@/lib/wompi';

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'active',
    endpoint: '/api/wompi/webhook',
    message: 'El endpoint de Webhook para eventos de Wompi está activo y escuchando peticiones POST de Wompi.',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Extraer los datos del evento de Wompi
    const event = body?.event;
    const transaction = body?.data?.transaction;

    if (event !== 'transaction.updated' || !transaction) {
      return NextResponse.json({ message: 'Evento ignorado' }, { status: 200 });
    }

    const {
      id: transactionId,
      reference,
      status,
      amount_in_cents: transactionAmountInCents,
      payment_method_type,
    } = transaction;

    console.log(`[wompi-webhook] Evento recibido: Ref ${reference} | Estado: ${status} | Trans: ${transactionId}`);

    // 2. Verificar la firma de integridad de Wompi (CRÍTICO: 401 si no es válida)
    const isValid = verifyEventChecksum(body);
    if (!isValid) {
      console.warn(`⚠️ Signature de Wompi inválida para referencia ${reference}`);
      return NextResponse.json({ error: 'Firma de integridad inválida' }, { status: 401 });
    }

    const supabase = supabaseAdmin();

    // 3. Buscar la orden por referencia y validar coincidencia de monto
    const { data: order, error: orderFetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('reference', reference)
      .maybeSingle();

    if (orderFetchError || !order) {
      console.error(`Orden no encontrada para referencia ${reference}:`, orderFetchError);
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (Number(order.amount_in_cents) !== Number(transactionAmountInCents)) {
      console.error(
        `Discrepancia de monto en orden ${reference}: esperado ${order.amount_in_cents}, recibido ${transactionAmountInCents}`
      );
      return NextResponse.json({ error: 'Monto de transacción no coincide con la orden' }, { status: 400 });
    }

    // 4. Idempotencia: si la orden ya está APPROVED, no repetir efectos secundarios
    if (order.status === 'APPROVED') {
      console.log(`ℹ️ Orden ${reference} ya procesada anteriormente como APPROVED (idempotente)`);
      return NextResponse.json({ success: true, status: 'APPROVED', message: 'Orden ya procesada' });
    }

    // 5. Actualizar estado de la orden
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        wompi_transaction_id: transactionId,
        payment_method_type: payment_method_type || null,
        updated_at: new Date().toISOString(),
      })
      .eq('reference', reference);

    if (updateError) {
      console.error(`Error actualizando orden ${reference}:`, updateError);
      return NextResponse.json({ error: 'Error actualizando orden' }, { status: 500 });
    }

    // 6. Si el pago fue APROBADO → marcar el lead como pagado y avanzar etapa
    if (status === 'APPROVED') {
      let leadId = order.lead_id;

      // Solo se vincula por orders.lead_id u orders.lead_slug (se eliminan fallbacks por email/teléfono/nombre)
      if (!leadId && order.lead_slug) {
        const { data: leadData } = await supabase
          .from('leads')
          .select('id')
          .eq('slug_publico', order.lead_slug)
          .maybeSingle();
        leadId = leadData?.id ?? null;
      }

      if (leadId) {
        if (!order.lead_id) {
          await supabase.from('orders').update({ lead_id: leadId }).eq('reference', reference);
        }

        // Leer datos actuales del lead para verificar referrer
        const { data: currentLead } = await supabase
          .from('leads')
          .select('referrer_id, seller_id')
          .eq('id', leadId)
          .maybeSingle();

        let sellerIdToSet: string | null | undefined = undefined;
        if (currentLead?.referrer_id && !currentLead?.seller_id) {
          const { data: referrerUser } = await supabase
            .from('usuarios')
            .select('id, rol')
            .eq('id', currentLead.referrer_id)
            .maybeSingle();
          if (referrerUser?.rol === 'vendedor') {
            sellerIdToSet = referrerUser.id;
            console.log(`🔗 Asignando seller_id = referrer_id (vendedor) para lead ${leadId}`);
          }
        }

        const updatePayload: Record<string, unknown> = {
          pagado: true,
          etapa: 'documentos',
          estado: 'agendado',
        };
        if (sellerIdToSet !== undefined) {
          updatePayload.seller_id = sellerIdToSet;
        }

        await supabase.from('leads').update(updatePayload as any).eq('id', leadId);

        // Actualizar etapa en pipeline_leads también
        await supabase
          .from('pipeline_leads')
          .update({ stage: 'documentos', updated_at: new Date().toISOString() })
          .eq('lead_id', leadId);

        console.log(`✅ Lead ${leadId} marcado como PAGADO, etapa → documentos`);
      } else {
        console.warn(`⚠️ No se pudo vincular la orden ${reference} con ningún lead.`);
      }
    }

    console.log(`✅ Orden ${reference} actualizada a estado: ${status}`);
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Error procesando webhook de Wompi:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
