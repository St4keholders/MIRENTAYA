-- ─────────────────────────────────────────────────────────────────────────────
-- Limpieza de seguridad (auditoría 2026-10-31 con los advisors de Supabase)
--
-- La app nunca usa la llave anon contra la base: todo pasa por rutas del
-- servidor con service_role. Por eso anon / authenticated no necesitan
-- ejecutar funciones ni escribir en ninguna tabla.
-- Idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. CRÍTICO: funciones SECURITY DEFINER ejecutables con la llave pública.
--    list_leads() y list_usuarios() devolvían leads y usuarios completos a
--    cualquiera que llamara /rest/v1/rpc/... con la anon key (que es pública).
revoke execute on function public.list_leads()                  from public, anon, authenticated;
revoke execute on function public.list_usuarios()               from public, anon, authenticated;
revoke execute on function public.generate_commissions(uuid)    from public, anon, authenticated;
grant  execute on function public.list_leads()                  to service_role;
grant  execute on function public.list_usuarios()               to service_role;
grant  execute on function public.generate_commissions(uuid)    to service_role;

-- Funciones de trigger / utilitarias: tampoco tienen por qué ser llamables desde afuera
revoke execute on function public.generate_referral_slug(text)  from public, anon, authenticated;
revoke execute on function public.after_anticipo_paid()         from public, anon, authenticated;
revoke execute on function public.on_anticipo_paid()            from public, anon, authenticated;
revoke execute on function public.auto_referral_slug()          from public, anon, authenticated;
grant  execute on function public.generate_referral_slug(text)  to service_role;

-- 2. search_path fijo en todas las funciones (evita secuestro por search_path)
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in (
         'generate_commissions', 'on_anticipo_paid', 'after_anticipo_paid', 'generate_referral_slug',
         'auto_referral_slug', 'erp__check_balance', 'erp__nuevo_asiento', 'erp__reversar',
         'erp_crear_venta', 'erp_crear_compra', 'erp_registrar_pago', 'erp_anular_pago',
         'erp_anular_venta', 'erp_anular_compra', 'erp_crear_asiento_manual',
         'list_leads', 'list_usuarios', 'authenticate_user')
  loop
    execute format('alter function %s set search_path = public, pg_temp', f.sig);
  end loop;
end $$;

-- 3. Políticas abiertas a anon que sobrevivieron a la migración 20261021.
--    Hoy no se aplican porque los privilegios están revocados, pero se
--    reactivarían con un simple GRANT. Se eliminan.
do $$
declare pol record;
begin
  for pol in
    select tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and 'anon' = any(roles)
       and tablename not in ('arquetipos', 'calendario_vencimientos', 'parametros_fiscales', 'contadores')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- Políticas basadas en Supabase Auth (auth.uid()) que la app no usa: la sesión
-- es propia (cookie firmada). Con authenticated revocado no aplican; se quitan
-- las que permiten escritura para no dejar puertas a futuro.
drop policy if exists "referral_events_insert" on public.referral_events;
drop policy if exists "Permitir lectura autenticada de citas" on public.citas;

-- 4. Catálogos públicos: solo lectura
revoke insert, update, delete, truncate, references, trigger
  on public.arquetipos, public.calendario_vencimientos, public.parametros_fiscales, public.contadores
  from anon, authenticated;

-- 5. Tablas nuevas que se creen en public no deben heredar permisos para anon
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
