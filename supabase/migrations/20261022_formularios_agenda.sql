-- Migración Fase 4: Formularios del CRM y Links de Agenda

-- 1. Tabla de links de agenda personales
create table if not exists erp_links_agenda (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references usuarios(id) on delete cascade,
  slug        text not null unique check (slug ~ '^[a-z0-9-]{3,48}$'),
  titulo      text not null,                       -- lo ve la persona: "Agenda con Juan"
  servicio    text not null default 'otro'
              check (servicio in ('contabilidad','nomina','renta','personalizado','otro')),
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists erp_links_agenda_user_idx on erp_links_agenda (usuario_id);
create index if not exists erp_links_agenda_slug_idx on erp_links_agenda (slug);
alter table erp_links_agenda enable row level security;
revoke all on erp_links_agenda from anon, authenticated;

-- 2. Tabla centralizada de formularios del CRM
create table if not exists erp_formularios (
  id              uuid primary key default gen_random_uuid(),
  formulario      text not null check (formulario in (
                    'contabilidad','nomina','personalizado','inicio',
                    'renta_cita','renta_resultado','renta_test','link_agenda','agendar')),
  servicio        text not null default 'otro'
                  check (servicio in ('contabilidad','nomina','renta','personalizado','otro')),
  nombre          text not null,
  empresa         text,
  email           text,
  telefono        text,
  modalidad       text check (modalidad in ('virtual','presencial')),
  direccion       text,
  cita_at         timestamptz,          -- cuando hay día y hora exactos (links de agenda)
  fecha_preferida text,                 -- texto libre de los formularios actuales
  mensaje         text,
  datos           jsonb not null default '{}'::jsonb,  -- todos los campos extra (facturas, trabajadores, piezas, interés, motivo…)
  estado          text not null default 'pendiente'
                  check (estado in ('pendiente','aprobado','descartado')),
  motivo_descarte text,
  responsable_id  uuid references usuarios(id) on delete set null,  -- dueño del link o referido
  link_id         uuid references erp_links_agenda(id) on delete set null,
  cliente_id      uuid references erp_clientes(id) on delete set null,
  legacy_lead_id  uuid references leads(id) on delete set null,     -- fila en la tabla vieja 'leads', si existe
  aprobado_por    uuid references usuarios(id) on delete set null,
  aprobado_at     timestamptz,
  ip_hash         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists erp_formularios_estado_idx on erp_formularios (estado, created_at desc);
create index if not exists erp_formularios_resp_idx on erp_formularios (responsable_id);
create index if not exists erp_formularios_link_idx on erp_formularios (link_id);
alter table erp_formularios enable row level security;
revoke all on erp_formularios from anon, authenticated;
