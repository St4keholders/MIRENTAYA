-- Nuevo estado 'descartado' para leads: el prospecto no aplica (no es cliente
-- objetivo, dato errado, duplicado, etc.). Distinto de 'perdido', que es un
-- lead que sí se trabajó y no se cerró.
-- Idempotente.

alter table erp_leads drop constraint if exists erp_leads_estado_check;
alter table erp_leads add constraint erp_leads_estado_check
  check (estado in ('nuevo', 'contactado', 'propuesta', 'ganado', 'perdido', 'descartado'));
