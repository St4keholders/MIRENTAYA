-- ============================================================================
-- STAKEHOLDERS · ERP + CRM
-- Migración aditiva: NO toca las tablas de renta (leads, ventas, orders, ...).
-- Ejecutar completa en Supabase → SQL Editor.
--
-- Módulos:
--   erp_clientes / erp_proveedores   → terceros (cuentas por cobrar / por pagar)
--   erp_leads                        → prospectos que pueden pasar a cliente
--   erp_ventas (+items)              → facturas de venta
--   erp_compras (+items)             → facturas de compra / gastos
--   erp_pagos                        → recibos de caja (cobros) y egresos (pagos)
--   erp_asientos (+lineas)           → libro diario (partida doble, PUC)
--
-- Seguridad: RLS activado SIN políticas → solo la service_role (servidor) accede.
-- La clave anon que está en el frontend no puede leer ni escribir nada del ERP.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PLAN ÚNICO DE CUENTAS (PUC) — subconjunto básico, ampliable
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists erp_cuentas (
  codigo      text primary key,
  nombre      text not null,
  naturaleza  text not null check (naturaleza in ('debito','credito')),
  clase       smallint not null,
  activa      boolean not null default true
);

insert into erp_cuentas (codigo, nombre, naturaleza, clase) values
  ('1105','Caja','debito',1),
  ('1110','Bancos','debito',1),
  ('1120','Cuentas de ahorro','debito',1),
  ('1305','Clientes','debito',1),
  ('1330','Anticipos y avances','debito',1),
  ('1355','Anticipo de impuestos (retenciones a favor)','debito',1),
  ('1435','Mercancías no fabricadas por la empresa','debito',1),
  ('1524','Equipo de oficina','debito',1),
  ('1528','Equipo de computación y comunicación','debito',1),
  ('2205','Proveedores nacionales','credito',2),
  ('2335','Costos y gastos por pagar','credito',2),
  ('2365','Retención en la fuente por pagar','credito',2),
  ('2368','Impuesto de industria y comercio retenido','credito',2),
  ('2370','Retenciones y aportes de nómina','credito',2),
  ('2408','Impuesto sobre las ventas (IVA) por pagar','credito',2),
  ('2505','Salarios por pagar','credito',2),
  ('3105','Capital suscrito y pagado','credito',3),
  ('3605','Utilidad del ejercicio','credito',3),
  ('4135','Comercio al por mayor y al por menor','credito',4),
  ('4155','Actividades empresariales y de servicios','credito',4),
  ('4210','Ingresos financieros','credito',4),
  ('4295','Ingresos diversos','credito',4),
  ('5105','Gastos de personal','debito',5),
  ('5110','Honorarios','debito',5),
  ('5115','Impuestos','debito',5),
  ('5120','Arrendamientos','debito',5),
  ('5135','Servicios','debito',5),
  ('5145','Mantenimiento y reparaciones','debito',5),
  ('5160','Depreciaciones','debito',5),
  ('5195','Gastos diversos','debito',5),
  ('5235','Servicios (ventas)','debito',5),
  ('5240','Publicidad y propaganda','debito',5),
  ('5305','Gastos financieros','debito',5),
  ('6135','Costo de ventas — comercio','debito',6)
on conflict (codigo) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TERCEROS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists erp_clientes (
  id                uuid primary key default gen_random_uuid(),
  tipo_persona      text not null default 'natural' check (tipo_persona in ('natural','juridica')),
  tipo_documento    text not null default 'CC' check (tipo_documento in ('CC','NIT','CE','PAS','PPT','TI')),
  numero_documento  text not null,
  dv                text,
  nombre            text not null,
  nombre_comercial  text,
  email             text,
  telefono          text,
  direccion         text,
  ciudad            text,
  responsable_iva   boolean not null default false,
  dias_credito      integer not null default 0 check (dias_credito >= 0),
  notas             text,
  activo            boolean not null default true,
  created_by        uuid references usuarios(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (tipo_documento, numero_documento)
);

create table if not exists erp_proveedores (
  id                uuid primary key default gen_random_uuid(),
  tipo_persona      text not null default 'juridica' check (tipo_persona in ('natural','juridica')),
  tipo_documento    text not null default 'NIT' check (tipo_documento in ('CC','NIT','CE','PAS','PPT','TI')),
  numero_documento  text not null,
  dv                text,
  nombre            text not null,
  nombre_comercial  text,
  email             text,
  telefono          text,
  direccion         text,
  ciudad            text,
  responsable_iva   boolean not null default false,
  dias_credito      integer not null default 0 check (dias_credito >= 0),
  banco             text,
  tipo_cuenta       text,
  numero_cuenta     text,
  notas             text,
  activo            boolean not null default true,
  created_by        uuid references usuarios(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (tipo_documento, numero_documento)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. LEADS (CRM)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists erp_leads (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  empresa         text,
  email           text,
  telefono        text,
  servicio        text not null default 'otro'
                  check (servicio in ('contabilidad','nomina','renta','personalizado','otro')),
  origen          text not null default 'manual'
                  check (origen in ('manual','web','referido','renta_test','whatsapp','otro')),
  estado          text not null default 'nuevo'
                  check (estado in ('nuevo','contactado','propuesta','ganado','perdido')),
  valor_estimado  numeric(14,2),
  mensaje         text,
  notas           text,
  responsable_id  uuid references usuarios(id) on delete set null,
  cliente_id      uuid references erp_clientes(id) on delete set null,
  renta_lead_id   uuid references leads(id) on delete set null,
  created_by      uuid references usuarios(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists erp_leads_estado_idx on erp_leads (estado);
create unique index if not exists erp_leads_renta_lead_uidx on erp_leads (renta_lead_id) where renta_lead_id is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. VENTAS Y COMPRAS
-- ─────────────────────────────────────────────────────────────────────────────
create sequence if not exists erp_venta_seq;
create sequence if not exists erp_compra_seq;
create sequence if not exists erp_recibo_seq;
create sequence if not exists erp_egreso_seq;

create table if not exists erp_ventas (
  id                 uuid primary key default gen_random_uuid(),
  numero             text not null unique default ('FV-' || lpad(nextval('erp_venta_seq')::text, 5, '0')),
  cliente_id         uuid not null references erp_clientes(id) on delete restrict,
  fecha              date not null default current_date,
  fecha_vencimiento  date,
  servicio           text not null default 'otro'
                     check (servicio in ('contabilidad','nomina','renta','personalizado','otro')),
  descripcion        text,
  cuenta_ingreso     text not null default '4155' references erp_cuentas(codigo),
  subtotal           numeric(14,2) not null default 0 check (subtotal >= 0),
  iva                numeric(14,2) not null default 0 check (iva >= 0),
  retencion          numeric(14,2) not null default 0 check (retencion >= 0),
  total              numeric(14,2) generated always as (subtotal + iva) stored,
  neto               numeric(14,2) generated always as (subtotal + iva - retencion) stored,
  estado             text not null default 'emitida' check (estado in ('emitida','anulada')),
  motivo_anulacion   text,
  created_by         uuid references usuarios(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists erp_ventas_cliente_idx on erp_ventas (cliente_id);
create index if not exists erp_ventas_fecha_idx on erp_ventas (fecha);

create table if not exists erp_venta_items (
  id              bigint generated always as identity primary key,
  venta_id        uuid not null references erp_ventas(id) on delete cascade,
  descripcion     text not null,
  cantidad        numeric(12,2) not null default 1 check (cantidad > 0),
  valor_unitario  numeric(14,2) not null check (valor_unitario >= 0),
  iva_pct         numeric(5,2) not null default 0 check (iva_pct >= 0 and iva_pct <= 100),
  subtotal        numeric(14,2) generated always as (round(cantidad * valor_unitario, 2)) stored,
  iva             numeric(14,2) generated always as (round(round(cantidad * valor_unitario, 2) * iva_pct / 100, 2)) stored
);

create table if not exists erp_compras (
  id                 uuid primary key default gen_random_uuid(),
  numero             text not null unique default ('CP-' || lpad(nextval('erp_compra_seq')::text, 5, '0')),
  numero_factura     text,  -- número de la factura del proveedor
  proveedor_id       uuid not null references erp_proveedores(id) on delete restrict,
  fecha              date not null default current_date,
  fecha_vencimiento  date,
  cuenta_gasto       text not null default '5195' references erp_cuentas(codigo),
  descripcion        text,
  subtotal           numeric(14,2) not null default 0 check (subtotal >= 0),
  iva                numeric(14,2) not null default 0 check (iva >= 0),
  retencion          numeric(14,2) not null default 0 check (retencion >= 0),
  total              numeric(14,2) generated always as (subtotal + iva) stored,
  neto               numeric(14,2) generated always as (subtotal + iva - retencion) stored,
  estado             text not null default 'registrada' check (estado in ('registrada','anulada')),
  motivo_anulacion   text,
  created_by         uuid references usuarios(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists erp_compras_proveedor_idx on erp_compras (proveedor_id);
create index if not exists erp_compras_fecha_idx on erp_compras (fecha);

create table if not exists erp_compra_items (
  id              bigint generated always as identity primary key,
  compra_id       uuid not null references erp_compras(id) on delete cascade,
  descripcion     text not null,
  cantidad        numeric(12,2) not null default 1 check (cantidad > 0),
  valor_unitario  numeric(14,2) not null check (valor_unitario >= 0),
  iva_pct         numeric(5,2) not null default 0 check (iva_pct >= 0 and iva_pct <= 100),
  subtotal        numeric(14,2) generated always as (round(cantidad * valor_unitario, 2)) stored,
  iva             numeric(14,2) generated always as (round(round(cantidad * valor_unitario, 2) * iva_pct / 100, 2)) stored
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PAGOS (cobros a clientes y pagos a proveedores)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists erp_pagos (
  id            uuid primary key default gen_random_uuid(),
  numero        text not null unique,
  tipo          text not null check (tipo in ('cobro','pago')),
  venta_id      uuid references erp_ventas(id) on delete restrict,
  compra_id     uuid references erp_compras(id) on delete restrict,
  fecha         date not null default current_date,
  valor         numeric(14,2) not null check (valor > 0),
  medio         text not null default 'transferencia'
                check (medio in ('efectivo','transferencia','tarjeta','wompi','cheque','otro')),
  cuenta        text not null default '1110' references erp_cuentas(codigo), -- caja/banco
  referencia    text,
  notas         text,
  estado        text not null default 'aplicado' check (estado in ('aplicado','anulado')),
  created_by    uuid references usuarios(id) on delete set null,
  created_at    timestamptz not null default now(),
  check (
    (tipo = 'cobro' and venta_id is not null and compra_id is null) or
    (tipo = 'pago'  and compra_id is not null and venta_id is null)
  )
);
create index if not exists erp_pagos_venta_idx on erp_pagos (venta_id);
create index if not exists erp_pagos_compra_idx on erp_pagos (compra_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. LIBRO DIARIO (partida doble)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists erp_asientos (
  id              uuid primary key default gen_random_uuid(),
  numero          bigint generated always as identity unique,
  fecha           date not null default current_date,
  tipo            text not null check (tipo in ('venta','compra','cobro','pago','manual','anulacion')),
  descripcion     text not null,
  origen_tipo     text check (origen_tipo in ('venta','compra','pago')),
  origen_id       uuid,
  tercero_tipo    text check (tercero_tipo in ('cliente','proveedor')),
  tercero_id      uuid,
  tercero_nombre  text,
  anulado         boolean not null default false,
  reversa_de      uuid references erp_asientos(id) on delete set null,
  created_by      uuid references usuarios(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists erp_asientos_fecha_idx on erp_asientos (fecha);
create index if not exists erp_asientos_origen_idx on erp_asientos (origen_tipo, origen_id);

create table if not exists erp_asiento_lineas (
  id           bigint generated always as identity primary key,
  asiento_id   uuid not null references erp_asientos(id) on delete cascade,
  cuenta       text not null references erp_cuentas(codigo),
  descripcion  text,
  debito       numeric(14,2) not null default 0 check (debito >= 0),
  credito      numeric(14,2) not null default 0 check (credito >= 0),
  check (debito = 0 or credito = 0),
  check (debito > 0 or credito > 0)
);
create index if not exists erp_asiento_lineas_asiento_idx on erp_asiento_lineas (asiento_id);
create index if not exists erp_asiento_lineas_cuenta_idx on erp_asiento_lineas (cuenta);

-- Sumas iguales: se valida al final de cada transacción
create or replace function erp__check_balance() returns trigger
language plpgsql as $$
declare
  v_id uuid := coalesce(new.asiento_id, old.asiento_id);
  v_d numeric; v_c numeric;
begin
  if not exists (select 1 from erp_asientos where id = v_id) then
    return null; -- asiento borrado en cascada
  end if;
  select coalesce(sum(debito),0), coalesce(sum(credito),0) into v_d, v_c
    from erp_asiento_lineas where asiento_id = v_id;
  if v_d <> v_c then
    raise exception 'Asiento descuadrado: débitos % ≠ créditos %', v_d, v_c;
  end if;
  return null;
end $$;

drop trigger if exists erp_asiento_balance on erp_asiento_lineas;
create constraint trigger erp_asiento_balance
  after insert or update or delete on erp_asiento_lineas
  deferrable initially deferred
  for each row execute function erp__check_balance();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. FUNCIONES INTERNAS DE CONTABILIZACIÓN
-- ─────────────────────────────────────────────────────────────────────────────

-- Crea un asiento con sus líneas. p_lineas = [{cuenta, debito, credito, descripcion}]
create or replace function erp__nuevo_asiento(
  p_fecha date, p_tipo text, p_descripcion text,
  p_origen_tipo text, p_origen_id uuid,
  p_tercero_tipo text, p_tercero_id uuid, p_tercero_nombre text,
  p_created_by uuid, p_lineas jsonb, p_reversa_de uuid default null
) returns uuid
language plpgsql as $$
declare
  v_id uuid;
  l jsonb;
  v_n int := 0;
begin
  insert into erp_asientos (fecha, tipo, descripcion, origen_tipo, origen_id,
                            tercero_tipo, tercero_id, tercero_nombre, created_by, reversa_de)
  values (p_fecha, p_tipo, p_descripcion, p_origen_tipo, p_origen_id,
          p_tercero_tipo, p_tercero_id, p_tercero_nombre, p_created_by, p_reversa_de)
  returning id into v_id;

  for l in select * from jsonb_array_elements(p_lineas) loop
    if coalesce((l->>'debito')::numeric, 0) = 0 and coalesce((l->>'credito')::numeric, 0) = 0 then
      continue; -- omite líneas en cero (p.ej. IVA = 0)
    end if;
    insert into erp_asiento_lineas (asiento_id, cuenta, descripcion, debito, credito)
    values (v_id, l->>'cuenta', nullif(l->>'descripcion',''),
            round(coalesce((l->>'debito')::numeric, 0), 2),
            round(coalesce((l->>'credito')::numeric, 0), 2));
    v_n := v_n + 1;
  end loop;

  if v_n < 2 then
    raise exception 'Un asiento necesita al menos dos líneas con valor';
  end if;
  return v_id;
end $$;

-- Reversa (contra-asiento) todos los asientos vigentes de un documento
create or replace function erp__reversar(p_origen_tipo text, p_origen_id uuid, p_usuario uuid, p_motivo text)
returns void
language plpgsql as $$
declare
  a erp_asientos%rowtype;
  v_lineas jsonb;
begin
  for a in select * from erp_asientos
           where origen_tipo = p_origen_tipo and origen_id = p_origen_id
             and not anulado and tipo <> 'anulacion' loop
    select jsonb_agg(jsonb_build_object(
             'cuenta', cuenta, 'debito', credito, 'credito', debito,
             'descripcion', 'Reversa: ' || coalesce(descripcion, '')))
      into v_lineas
      from erp_asiento_lineas where asiento_id = a.id;

    perform erp__nuevo_asiento(current_date, 'anulacion',
      'Anulación asiento #' || a.numero || coalesce(' — ' || p_motivo, ''),
      a.origen_tipo, a.origen_id, a.tercero_tipo, a.tercero_id, a.tercero_nombre,
      p_usuario, v_lineas, a.id);

    update erp_asientos set anulado = true where id = a.id;
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RPCs PÚBLICAS (las llama el servidor con service_role)
-- ─────────────────────────────────────────────────────────────────────────────

-- p = {cliente_id, fecha, fecha_vencimiento, servicio, descripcion, cuenta_ingreso,
--      retencion_pct, created_by, items:[{descripcion,cantidad,valor_unitario,iva_pct}]}
create or replace function erp_crear_venta(p jsonb) returns uuid
language plpgsql as $$
declare
  v_id uuid;
  c erp_clientes%rowtype;
  v erp_ventas%rowtype;
  it jsonb;
  v_fecha date := coalesce(nullif(p->>'fecha','')::date, current_date);
  v_ret_pct numeric := coalesce(nullif(p->>'retencion_pct','')::numeric, 0);
begin
  select * into c from erp_clientes where id = (p->>'cliente_id')::uuid;
  if not found then raise exception 'Cliente no encontrado'; end if;
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 then
    raise exception 'La venta necesita al menos un ítem';
  end if;
  if v_ret_pct < 0 or v_ret_pct > 100 then raise exception 'Porcentaje de retención inválido'; end if;

  insert into erp_ventas (cliente_id, fecha, fecha_vencimiento, servicio, descripcion, cuenta_ingreso, created_by)
  values (c.id, v_fecha,
          coalesce(nullif(p->>'fecha_vencimiento','')::date, v_fecha + c.dias_credito),
          coalesce(nullif(p->>'servicio',''), 'otro'),
          nullif(p->>'descripcion',''),
          coalesce(nullif(p->>'cuenta_ingreso',''), '4155'),
          nullif(p->>'created_by','')::uuid)
  returning id into v_id;

  for it in select * from jsonb_array_elements(p->'items') loop
    insert into erp_venta_items (venta_id, descripcion, cantidad, valor_unitario, iva_pct)
    values (v_id, it->>'descripcion',
            coalesce(nullif(it->>'cantidad','')::numeric, 1),
            (it->>'valor_unitario')::numeric,
            coalesce(nullif(it->>'iva_pct','')::numeric, 0));
  end loop;

  update erp_ventas e set
    subtotal  = s.sub,
    iva       = s.iv,
    retencion = round(s.sub * v_ret_pct / 100, 2)
  from (select coalesce(sum(subtotal),0) sub, coalesce(sum(iva),0) iv
          from erp_venta_items where venta_id = v_id) s
  where e.id = v_id
  returning e.* into v;

  if v.total <= 0 then raise exception 'El total de la venta debe ser mayor a cero'; end if;

  perform erp__nuevo_asiento(v.fecha, 'venta',
    'Factura de venta ' || v.numero || coalesce(' — ' || v.descripcion, ''),
    'venta', v.id, 'cliente', c.id, c.nombre, v.created_by,
    jsonb_build_array(
      jsonb_build_object('cuenta','1305','debito', v.neto,      'descripcion','Cuenta por cobrar ' || v.numero),
      jsonb_build_object('cuenta','1355','debito', v.retencion, 'descripcion','Retención en la fuente a favor'),
      jsonb_build_object('cuenta', v.cuenta_ingreso, 'credito', v.subtotal, 'descripcion','Ingreso por servicios'),
      jsonb_build_object('cuenta','2408','credito', v.iva,      'descripcion','IVA generado')
    ));
  return v_id;
end $$;

-- p = {proveedor_id, numero_factura, fecha, fecha_vencimiento, cuenta_gasto, descripcion,
--      retencion_pct, created_by, items:[...]}
create or replace function erp_crear_compra(p jsonb) returns uuid
language plpgsql as $$
declare
  v_id uuid;
  pr erp_proveedores%rowtype;
  v erp_compras%rowtype;
  it jsonb;
  v_fecha date := coalesce(nullif(p->>'fecha','')::date, current_date);
  v_ret_pct numeric := coalesce(nullif(p->>'retencion_pct','')::numeric, 0);
begin
  select * into pr from erp_proveedores where id = (p->>'proveedor_id')::uuid;
  if not found then raise exception 'Proveedor no encontrado'; end if;
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 then
    raise exception 'La compra necesita al menos un ítem';
  end if;
  if v_ret_pct < 0 or v_ret_pct > 100 then raise exception 'Porcentaje de retención inválido'; end if;

  insert into erp_compras (proveedor_id, numero_factura, fecha, fecha_vencimiento, cuenta_gasto, descripcion, created_by)
  values (pr.id, nullif(p->>'numero_factura',''), v_fecha,
          coalesce(nullif(p->>'fecha_vencimiento','')::date, v_fecha + pr.dias_credito),
          coalesce(nullif(p->>'cuenta_gasto',''), '5195'),
          nullif(p->>'descripcion',''),
          nullif(p->>'created_by','')::uuid)
  returning id into v_id;

  for it in select * from jsonb_array_elements(p->'items') loop
    insert into erp_compra_items (compra_id, descripcion, cantidad, valor_unitario, iva_pct)
    values (v_id, it->>'descripcion',
            coalesce(nullif(it->>'cantidad','')::numeric, 1),
            (it->>'valor_unitario')::numeric,
            coalesce(nullif(it->>'iva_pct','')::numeric, 0));
  end loop;

  update erp_compras e set
    subtotal  = s.sub,
    iva       = s.iv,
    retencion = round(s.sub * v_ret_pct / 100, 2)
  from (select coalesce(sum(subtotal),0) sub, coalesce(sum(iva),0) iv
          from erp_compra_items where compra_id = v_id) s
  where e.id = v_id
  returning e.* into v;

  if v.total <= 0 then raise exception 'El total de la compra debe ser mayor a cero'; end if;

  perform erp__nuevo_asiento(v.fecha, 'compra',
    'Compra ' || v.numero || coalesce(' (fact. ' || v.numero_factura || ')', '') || coalesce(' — ' || v.descripcion, ''),
    'compra', v.id, 'proveedor', pr.id, pr.nombre, v.created_by,
    jsonb_build_array(
      jsonb_build_object('cuenta', v.cuenta_gasto, 'debito', v.subtotal, 'descripcion','Gasto / costo'),
      jsonb_build_object('cuenta','2408','debito', v.iva,       'descripcion','IVA descontable'),
      jsonb_build_object('cuenta','2365','credito', v.retencion,'descripcion','Retención en la fuente practicada'),
      jsonb_build_object('cuenta','2205','credito', v.neto,     'descripcion','Cuenta por pagar ' || v.numero)
    ));
  return v_id;
end $$;

-- p = {tipo:'cobro'|'pago', venta_id|compra_id, fecha, valor, medio, cuenta, referencia, notas, created_by}
create or replace function erp_registrar_pago(p jsonb) returns uuid
language plpgsql as $$
declare
  v_tipo text := p->>'tipo';
  v_valor numeric := round((p->>'valor')::numeric, 2);
  v_fecha date := coalesce(nullif(p->>'fecha','')::date, current_date);
  v_cuenta text := coalesce(nullif(p->>'cuenta',''), '1110');
  v_user uuid := nullif(p->>'created_by','')::uuid;
  v_id uuid;
  v_num text;
  v_saldo numeric;
  ve erp_ventas%rowtype;
  co erp_compras%rowtype;
  v_tercero text;
begin
  if v_valor is null or v_valor <= 0 then raise exception 'El valor debe ser mayor a cero'; end if;
  if v_cuenta not in ('1105','1110','1120') then raise exception 'La cuenta debe ser Caja o Bancos'; end if;

  if v_tipo = 'cobro' then
    select * into ve from erp_ventas where id = (p->>'venta_id')::uuid for update;
    if not found then raise exception 'Venta no encontrada'; end if;
    if ve.estado = 'anulada' then raise exception 'La venta está anulada'; end if;
    select ve.neto - coalesce(sum(valor),0) into v_saldo
      from erp_pagos where venta_id = ve.id and estado = 'aplicado';
    if v_valor > v_saldo then raise exception 'El cobro (%) supera el saldo pendiente (%)', v_valor, v_saldo; end if;
    select nombre into v_tercero from erp_clientes where id = ve.cliente_id;
    v_num := 'RC-' || lpad(nextval('erp_recibo_seq')::text, 5, '0');

    insert into erp_pagos (numero, tipo, venta_id, fecha, valor, medio, cuenta, referencia, notas, created_by)
    values (v_num, 'cobro', ve.id, v_fecha, v_valor, coalesce(nullif(p->>'medio',''),'transferencia'),
            v_cuenta, nullif(p->>'referencia',''), nullif(p->>'notas',''), v_user)
    returning id into v_id;

    perform erp__nuevo_asiento(v_fecha, 'cobro', 'Recibo de caja ' || v_num || ' — abono a ' || ve.numero,
      'pago', v_id, 'cliente', ve.cliente_id, v_tercero, v_user,
      jsonb_build_array(
        jsonb_build_object('cuenta', v_cuenta, 'debito', v_valor, 'descripcion', 'Ingreso de dinero'),
        jsonb_build_object('cuenta', '1305', 'credito', v_valor, 'descripcion', 'Abono ' || ve.numero)));

  elsif v_tipo = 'pago' then
    select * into co from erp_compras where id = (p->>'compra_id')::uuid for update;
    if not found then raise exception 'Compra no encontrada'; end if;
    if co.estado = 'anulada' then raise exception 'La compra está anulada'; end if;
    select co.neto - coalesce(sum(valor),0) into v_saldo
      from erp_pagos where compra_id = co.id and estado = 'aplicado';
    if v_valor > v_saldo then raise exception 'El pago (%) supera el saldo pendiente (%)', v_valor, v_saldo; end if;
    select nombre into v_tercero from erp_proveedores where id = co.proveedor_id;
    v_num := 'CE-' || lpad(nextval('erp_egreso_seq')::text, 5, '0');

    insert into erp_pagos (numero, tipo, compra_id, fecha, valor, medio, cuenta, referencia, notas, created_by)
    values (v_num, 'pago', co.id, v_fecha, v_valor, coalesce(nullif(p->>'medio',''),'transferencia'),
            v_cuenta, nullif(p->>'referencia',''), nullif(p->>'notas',''), v_user)
    returning id into v_id;

    perform erp__nuevo_asiento(v_fecha, 'pago', 'Comprobante de egreso ' || v_num || ' — pago ' || co.numero,
      'pago', v_id, 'proveedor', co.proveedor_id, v_tercero, v_user,
      jsonb_build_array(
        jsonb_build_object('cuenta', '2205', 'debito', v_valor, 'descripcion', 'Pago ' || co.numero),
        jsonb_build_object('cuenta', v_cuenta, 'credito', v_valor, 'descripcion', 'Salida de dinero')));
  else
    raise exception 'Tipo de pago inválido';
  end if;

  return v_id;
end $$;

create or replace function erp_anular_pago(p_id uuid, p_usuario uuid, p_motivo text default null)
returns void language plpgsql as $$
begin
  update erp_pagos set estado = 'anulado' where id = p_id and estado = 'aplicado';
  if not found then raise exception 'Pago no encontrado o ya anulado'; end if;
  perform erp__reversar('pago', p_id, p_usuario, p_motivo);
end $$;

create or replace function erp_anular_venta(p_id uuid, p_usuario uuid, p_motivo text default null)
returns void language plpgsql as $$
begin
  if exists (select 1 from erp_pagos where venta_id = p_id and estado = 'aplicado') then
    raise exception 'La venta tiene cobros aplicados. Anula primero los cobros.';
  end if;
  update erp_ventas set estado = 'anulada', motivo_anulacion = p_motivo, updated_at = now()
   where id = p_id and estado = 'emitida';
  if not found then raise exception 'Venta no encontrada o ya anulada'; end if;
  perform erp__reversar('venta', p_id, p_usuario, p_motivo);
end $$;

create or replace function erp_anular_compra(p_id uuid, p_usuario uuid, p_motivo text default null)
returns void language plpgsql as $$
begin
  if exists (select 1 from erp_pagos where compra_id = p_id and estado = 'aplicado') then
    raise exception 'La compra tiene pagos aplicados. Anula primero los pagos.';
  end if;
  update erp_compras set estado = 'anulada', motivo_anulacion = p_motivo, updated_at = now()
   where id = p_id and estado = 'registrada';
  if not found then raise exception 'Compra no encontrada o ya anulada'; end if;
  perform erp__reversar('compra', p_id, p_usuario, p_motivo);
end $$;

-- p = {fecha, descripcion, tercero_tipo, tercero_id, created_by, lineas:[{cuenta,debito,credito,descripcion}]}
create or replace function erp_crear_asiento_manual(p jsonb) returns uuid
language plpgsql as $$
declare
  v_nombre text;
  v_tt text := nullif(p->>'tercero_tipo','');
  v_ti uuid := nullif(p->>'tercero_id','')::uuid;
begin
  if coalesce(trim(p->>'descripcion'),'') = '' then raise exception 'La descripción es obligatoria'; end if;
  if v_tt = 'cliente' then select nombre into v_nombre from erp_clientes where id = v_ti;
  elsif v_tt = 'proveedor' then select nombre into v_nombre from erp_proveedores where id = v_ti;
  end if;
  return erp__nuevo_asiento(coalesce(nullif(p->>'fecha','')::date, current_date), 'manual',
    p->>'descripcion', null, null, v_tt, v_ti, v_nombre,
    nullif(p->>'created_by','')::uuid, p->'lineas');
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. VISTAS (security_invoker → respetan RLS)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view erp_ventas_v with (security_invoker = true) as
select v.*,
       c.nombre            as cliente_nombre,
       c.tipo_documento    as cliente_tipo_documento,
       c.numero_documento  as cliente_documento,
       coalesce(pg.cobrado, 0)                       as pagado,
       case when v.estado = 'anulada' then 0 else v.neto - coalesce(pg.cobrado, 0) end as saldo,
       case
         when v.estado = 'anulada' then 'anulada'
         when v.neto - coalesce(pg.cobrado, 0) <= 0 then 'pagada'
         when v.fecha_vencimiento is not null and v.fecha_vencimiento < current_date then 'vencida'
         when coalesce(pg.cobrado, 0) > 0 then 'parcial'
         else 'pendiente'
       end as estado_pago
from erp_ventas v
join erp_clientes c on c.id = v.cliente_id
left join (select venta_id, sum(valor) cobrado from erp_pagos where estado = 'aplicado' and venta_id is not null group by venta_id) pg
  on pg.venta_id = v.id;

create or replace view erp_compras_v with (security_invoker = true) as
select co.*,
       pr.nombre            as proveedor_nombre,
       pr.tipo_documento    as proveedor_tipo_documento,
       pr.numero_documento  as proveedor_documento,
       cu.nombre            as cuenta_gasto_nombre,
       coalesce(pg.pagado, 0) as pagado,
       case when co.estado = 'anulada' then 0 else co.neto - coalesce(pg.pagado, 0) end as saldo,
       case
         when co.estado = 'anulada' then 'anulada'
         when co.neto - coalesce(pg.pagado, 0) <= 0 then 'pagada'
         when co.fecha_vencimiento is not null and co.fecha_vencimiento < current_date then 'vencida'
         when coalesce(pg.pagado, 0) > 0 then 'parcial'
         else 'pendiente'
       end as estado_pago
from erp_compras co
join erp_proveedores pr on pr.id = co.proveedor_id
join erp_cuentas cu on cu.codigo = co.cuenta_gasto
left join (select compra_id, sum(valor) pagado from erp_pagos where estado = 'aplicado' and compra_id is not null group by compra_id) pg
  on pg.compra_id = co.id;

create or replace view erp_clientes_v with (security_invoker = true) as
select c.*,
       coalesce(s.num_ventas, 0)       as num_ventas,
       coalesce(s.total_facturado, 0)  as total_facturado,
       coalesce(s.saldo, 0)            as saldo,
       coalesce(s.saldo_vencido, 0)    as saldo_vencido,
       s.ultima_venta
from erp_clientes c
left join (
  select cliente_id,
         count(*) filter (where estado <> 'anulada')               as num_ventas,
         sum(total) filter (where estado <> 'anulada')             as total_facturado,
         sum(saldo)                                                as saldo,
         sum(saldo) filter (where estado_pago = 'vencida')         as saldo_vencido,
         max(fecha) filter (where estado <> 'anulada')             as ultima_venta
    from erp_ventas_v group by cliente_id
) s on s.cliente_id = c.id;

create or replace view erp_proveedores_v with (security_invoker = true) as
select p.*,
       coalesce(s.num_compras, 0)      as num_compras,
       coalesce(s.total_comprado, 0)   as total_comprado,
       coalesce(s.saldo, 0)            as saldo,
       coalesce(s.saldo_vencido, 0)    as saldo_vencido,
       s.ultima_compra
from erp_proveedores p
left join (
  select proveedor_id,
         count(*) filter (where estado <> 'anulada')               as num_compras,
         sum(total) filter (where estado <> 'anulada')             as total_comprado,
         sum(saldo)                                                as saldo,
         sum(saldo) filter (where estado_pago = 'vencida')         as saldo_vencido,
         max(fecha) filter (where estado <> 'anulada')             as ultima_compra
    from erp_compras_v group by proveedor_id
) s on s.proveedor_id = p.id;

-- Libro diario plano (una fila por línea) para filtrar fácil
create or replace view erp_libro_diario_v with (security_invoker = true) as
select l.id            as linea_id,
       a.id            as asiento_id,
       a.numero,
       a.fecha,
       a.tipo,
       a.descripcion,
       a.origen_tipo,
       a.origen_id,
       a.tercero_tipo,
       a.tercero_id,
       a.tercero_nombre,
       a.anulado,
       a.created_at,
       l.cuenta,
       cu.nombre       as cuenta_nombre,
       l.descripcion   as linea_descripcion,
       l.debito,
       l.credito
from erp_asiento_lineas l
join erp_asientos a on a.id = l.asiento_id
join erp_cuentas cu on cu.codigo = l.cuenta;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. SEGURIDAD
-- ─────────────────────────────────────────────────────────────────────────────
alter table erp_cuentas         enable row level security;
alter table erp_clientes        enable row level security;
alter table erp_proveedores     enable row level security;
alter table erp_leads           enable row level security;
alter table erp_ventas          enable row level security;
alter table erp_venta_items     enable row level security;
alter table erp_compras         enable row level security;
alter table erp_compra_items    enable row level security;
alter table erp_pagos           enable row level security;
alter table erp_asientos        enable row level security;
alter table erp_asiento_lineas  enable row level security;

do $$
declare r record;
begin
  -- Ni anon ni authenticated tocan el ERP: todo pasa por el servidor (service_role).
  for r in select unnest(array[
      'erp_cuentas','erp_clientes','erp_proveedores','erp_leads','erp_ventas','erp_venta_items',
      'erp_compras','erp_compra_items','erp_pagos','erp_asientos','erp_asiento_lineas',
      'erp_ventas_v','erp_compras_v','erp_clientes_v','erp_proveedores_v','erp_libro_diario_v']) as t loop
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on %I from anon', r.t);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke all on %I from authenticated', r.t);
    end if;
  end loop;

  for r in select p.oid::regprocedure as fn
             from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname like 'erp\_%' loop
    execute format('revoke execute on function %s from public', r.fn);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke execute on function %s from anon', r.fn);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke execute on function %s from authenticated', r.fn);
    end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant execute on function %s to service_role', r.fn);
    end if;
  end loop;
end $$;

-- Recargar el esquema de PostgREST para que la API vea las tablas nuevas
notify pgrst, 'reload schema';
