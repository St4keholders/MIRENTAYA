import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function cleanTestData() {
  console.log('🧹 Iniciando vaciado de datos de prueba en la base de datos...');

  // 1. Obtener IDs de leads existentes
  const { data: leads } = await supabase.from('leads').select('id');
  const leadIds = (leads || []).map((l) => l.id).filter(Boolean);

  if (leadIds.length > 0) {
    const { count: c1 } = await supabase.from('respuestas').delete({ count: 'exact' }).in('lead_id', leadIds);
    console.log(`✅ Respuestas de simulador (respuestas): ${c1 ?? leadIds.length} eliminados.`);

    const { count: c2 } = await supabase.from('ventas').delete({ count: 'exact' }).in('lead_id', leadIds);
    console.log(`✅ Historial de ventas (ventas): ${c2 ?? 0} eliminados.`);

    const { count: c3 } = await supabase.from('orders').delete({ count: 'exact' }).in('lead_id', leadIds);
    console.log(`✅ Órdenes de pago Wompi (orders): ${c3 ?? 0} eliminados.`);
  }

  // 2. Obtener IDs de pipeline_leads
  const { data: pLeads } = await supabase.from('pipeline_leads').select('id');
  const pLeadIds = (pLeads || []).map((p) => p.id).filter(Boolean);

  if (pLeadIds.length > 0) {
    await supabase.from('commissions').delete().in('pipeline_lead_id', pLeadIds);
    await supabase.from('lead_requests').delete().in('pipeline_lead_id', pLeadIds);
    await supabase.from('referral_events').delete().in('pipeline_lead_id', pLeadIds);
    await supabase.from('pipeline_leads').delete().in('id', pLeadIds);
    console.log(`✅ Pipeline leads y sus dependencias eliminados.`);
  }

  // 3. Borrar citas agendadas
  const { data: citas } = await supabase.from('citas').select('id');
  const citaIds = (citas || []).map((c) => c.id).filter(Boolean);
  if (citaIds.length > 0) {
    const { count: c4 } = await supabase.from('citas').delete({ count: 'exact' }).in('id', citaIds);
    console.log(`✅ Citas agendadas (citas): ${c4 ?? citaIds.length} eliminadas.`);
  }

  // 4. Borrar leads principales
  if (leadIds.length > 0) {
    const { count: c5 } = await supabase.from('leads').delete({ count: 'exact' }).in('id', leadIds);
    console.log(`✅ Leads / Clientes principales (leads): ${c5 ?? leadIds.length} eliminados.`);
  }

  console.log('\n📊 Verificando estado final de las tablas de clientes:');
  const checkTables = ['leads', 'pipeline_leads', 'respuestas', 'ventas', 'orders', 'commissions', 'lead_requests', 'referral_events', 'citas'];
  for (const t of checkTables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(` - ${t}: ${count ?? 0} registros ${error ? `(Error: ${error.message})` : ''}`);
  }

  console.log('\n✨ Vaciado de clientes de prueba completado con éxito.');
}

cleanTestData().catch((err) => {
  console.error('Fatal error during test data cleanup:', err);
  process.exit(1);
});
