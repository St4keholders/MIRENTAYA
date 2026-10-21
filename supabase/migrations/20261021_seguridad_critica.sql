-- Migración Fase 4: Seguridad Crítica
-- 1. Contraseñas seguras y tabla de intentos de login
alter table if exists usuarios add column if not exists password_algo text not null default 'sha256_v1';

create table if not exists erp_login_intentos (
  id bigint generated always as identity primary key,
  email text not null,
  ip_hash text not null,
  exito boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists erp_login_intentos_idx on erp_login_intentos (email, created_at desc);
create index if not exists erp_login_intentos_ip_idx on erp_login_intentos (ip_hash, created_at desc);
alter table erp_login_intentos enable row level security;
revoke all on erp_login_intentos from anon, authenticated;

-- 2. Límite de intentos para formularios públicos
create table if not exists erp_form_intentos (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  formulario text not null,
  created_at timestamptz not null default now()
);

create index if not exists erp_form_intentos_idx on erp_form_intentos (ip_hash, created_at desc);
alter table erp_form_intentos enable row level security;
revoke all on erp_form_intentos from anon, authenticated;

-- 3. RLS de tablas viejas y revocación de accesos anon
alter table if exists leads enable row level security;
alter table if exists usuarios enable row level security;
alter table if exists ventas enable row level security;
alter table if exists orders enable row level security;
alter table if exists citas enable row level security;
alter table if exists respuestas enable row level security;
alter table if exists pipeline_leads enable row level security;
alter table if exists lead_requests enable row level security;
alter table if exists commissions enable row level security;
alter table if exists referral_events enable row level security;
alter table if exists app_settings enable row level security;
alter table if exists contadores enable row level security;

-- Eliminar políticas inseguras de anon en tablas viejas
drop policy if exists "anon lee usuarios admin" on usuarios;
drop policy if exists "anon actualiza usuarios" on usuarios;
drop policy if exists "anon gestiona usuarios" on usuarios;

drop policy if exists "anon lee leads admin" on leads;
drop policy if exists "anon actualiza leads" on leads;
drop policy if exists "anon actualiza pagado etapa" on leads;
drop policy if exists "anon insert leads" on leads;
drop policy if exists "anon inserta leads" on leads;

drop policy if exists "anon actualiza ventas" on ventas;
drop policy if exists "anon inserta ventas" on ventas;
drop policy if exists "anon lee ventas admin" on ventas;

drop policy if exists "anon insert respuestas" on respuestas;
drop policy if exists "anon inserta respuestas" on respuestas;
drop policy if exists "anon lee respuestas" on respuestas;
drop policy if exists "anon puede crear respuestas" on respuestas;

drop policy if exists "anon insert citas" on citas;
drop policy if exists "anon lee citas" on citas;
drop policy if exists "anon puede crear citas" on citas;
drop policy if exists "Permitir insercion publica de citas" on citas;
drop policy if exists "Permitir lectura autenticada de citas" on citas;

drop policy if exists "anon puede actualizar ordenes" on orders;
drop policy if exists "anon puede crear ordenes" on orders;

drop policy if exists "anon insert pipeline_leads" on pipeline_leads;

-- Revocar privilegios directos a anon y authenticated en tablas de backend
revoke all on leads, usuarios, ventas, orders, citas, respuestas, pipeline_leads, lead_requests, commissions, referral_events, app_settings, contadores from anon, authenticated;

-- arquetipos es contenido de catálogo público para el test
grant select on arquetipos to anon, authenticated;

-- Revocar ejecución de authenticate_user para anon y authenticated
revoke execute on function authenticate_user from anon, authenticated;
