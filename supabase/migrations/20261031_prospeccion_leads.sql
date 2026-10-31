-- ─────────────────────────────────────────────────────────────────────────────
-- Prospección automática de leads (scraping)
--
-- 1. erp_prospeccion_busquedas: cola de búsquedas lanzadas desde el ERP.
--    El worker (GitHub Actions + Scrapling) toma las 'pendiente', las procesa
--    y deja los resultados en erp_leads con origen = 'scraping'.
-- 2. erp_leads: columnas nuevas para tabla (ciudad, red principal, puntaje) y
--    detalles (jsonb), trazabilidad de la fuente y exclusión (Habeas Data).
-- 3. erp_prospeccion_exclusiones: contactos que pidieron no ser contactados.
--    El worker nunca vuelve a cargar un teléfono / correo / dominio de aquí.
--
-- Idempotente: se puede correr más de una vez.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Cola de búsquedas ----------------------------------------------------------
create table if not exists erp_prospeccion_busquedas (
  id                uuid primary key default gen_random_uuid(),
  ciudad            text not null check (char_length(ciudad) between 2 and 80),
  tipo_negocio      text not null check (char_length(tipo_negocio) between 2 and 120),
  con_website       text not null default 'indiferente'
                    check (con_website in ('si', 'no', 'indiferente')),
  fuentes           text[] not null default array['google_maps', 'directorios', 'web']::text[],
  limite            integer not null default 60 check (limite between 5 and 200),
  servicio          text not null default 'contabilidad'
                    check (servicio in ('contabilidad', 'nomina', 'renta', 'personalizado', 'otro')),
  estado            text not null default 'pendiente'
                    check (estado in ('pendiente', 'procesando', 'completada', 'error', 'cancelada')),
  total_encontrados integer not null default 0,
  total_nuevos      integer not null default 0,
  total_duplicados  integer not null default 0,
  error             text,
  creado_por        uuid references usuarios(id) on delete set null,
  created_at        timestamptz not null default now(),
  started_at        timestamptz,
  finished_at       timestamptz
);
create index if not exists erp_prospeccion_busquedas_estado_idx
  on erp_prospeccion_busquedas (estado, created_at);

alter table erp_prospeccion_busquedas enable row level security;
revoke all on erp_prospeccion_busquedas from anon, authenticated;

-- 2. Columnas nuevas en erp_leads ----------------------------------------------
alter table erp_leads add column if not exists ciudad         text;
alter table erp_leads add column if not exists red_principal  text;
alter table erp_leads add column if not exists puntaje        smallint check (puntaje between 0 and 100);
alter table erp_leads add column if not exists datos          jsonb not null default '{}'::jsonb;
alter table erp_leads add column if not exists busqueda_id    uuid references erp_prospeccion_busquedas(id) on delete set null;
alter table erp_leads add column if not exists fuente_url     text;
alter table erp_leads add column if not exists fecha_captura  timestamptz;
alter table erp_leads add column if not exists opt_out        boolean not null default false;
-- Claves normalizadas para deduplicar (las llena el worker y la API)
alter table erp_leads add column if not exists telefono_norm  text;
alter table erp_leads add column if not exists email_norm     text;
alter table erp_leads add column if not exists dominio        text;

-- Nuevo origen 'scraping'
alter table erp_leads drop constraint if exists erp_leads_origen_check;
alter table erp_leads add constraint erp_leads_origen_check
  check (origen in ('manual', 'web', 'referido', 'renta_test', 'whatsapp', 'scraping', 'otro'));

create index if not exists erp_leads_telefono_norm_idx on erp_leads (telefono_norm) where telefono_norm is not null;
create index if not exists erp_leads_email_norm_idx    on erp_leads (email_norm)    where email_norm is not null;
create index if not exists erp_leads_dominio_idx       on erp_leads (dominio)       where dominio is not null;
create index if not exists erp_leads_busqueda_idx      on erp_leads (busqueda_id)   where busqueda_id is not null;
create index if not exists erp_leads_origen_idx        on erp_leads (origen);

-- Claves normalizadas calculadas por trigger: así cualquier inserción
-- (formularios web, ERP, worker) queda deduplicable sin depender del código.
create or replace function erp_normalizar_telefono_co(raw text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when d ~ '^3[0-5][0-9]{8}$' then d
    when d ~ '^60[1-8][0-9]{7}$' then d
    else null
  end
  from (
    select case
      when x like '0057%' then substr(x, 5)
      when length(x) = 12 and x like '57%' then substr(x, 3)
      else x
    end as d
    from (select regexp_replace(coalesce(raw, ''), '\D', '', 'g') as x) s
  ) t;
$$;

create or replace function erp_leads_normalizar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.telefono_norm := public.erp_normalizar_telefono_co(new.telefono);
  new.email_norm := case
    when new.email ~* '^[^\s@]+@[^\s@]+\.[a-z]{2,}$' then lower(trim(new.email))
    else null
  end;
  -- dominio: lo pone el worker; si se borra el email/teléfono no se toca
  return new;
end;
$$;

drop trigger if exists erp_leads_normalizar_trg on erp_leads;
create trigger erp_leads_normalizar_trg
  before insert or update of telefono, email on erp_leads
  for each row execute function erp_leads_normalizar();

revoke execute on function erp_normalizar_telefono_co(text) from anon, authenticated;
revoke execute on function erp_leads_normalizar() from anon, authenticated;

-- Rellenar claves normalizadas de los leads existentes (para no duplicarlos)
update erp_leads
   set telefono_norm = erp_normalizar_telefono_co(telefono),
       email_norm = case when email ~* '^[^\s@]+@[^\s@]+\.[a-z]{2,}$' then lower(trim(email)) end
 where telefono_norm is null and email_norm is null;

-- 3. Lista de exclusión (Habeas Data, Ley 1581 de 2012) -------------------------
create table if not exists erp_prospeccion_exclusiones (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('telefono', 'email', 'dominio')),
  valor       text not null,
  motivo      text,
  creado_por  uuid references usuarios(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (tipo, valor)
);
alter table erp_prospeccion_exclusiones enable row level security;
revoke all on erp_prospeccion_exclusiones from anon, authenticated;
