# Stakeholders · ERP + CRM (Fase 4: Formularios, Links de Agenda y Seguridad)

## Puesta en marcha

1. **Base de datos (Supabase):**
   - Se aplican las migraciones:
     - `supabase/migrations/20261003_erp_crm.sql` (Esquema base ERP/CRM y PUC colombiano).
     - `supabase/migrations/20261022_formularios_agenda.sql` (Tablas `erp_links_agenda` y `erp_formularios` con RLS estricto).
     - `20261021_security_lockdown.sql` (RLS habilitado en tablas legacy, revocación de permisos a `anon` y `authenticated`, tablas de rate limiting `erp_login_intentos` y `erp_form_intentos`).
2. **Variables de entorno:**
   - `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`: URL del proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Llave pública anon.
   - `SUPABASE_SERVICE_ROLE_KEY`: Llave administrativa (server-side ONLY).
   - `SESSION_SECRET`: Clave HMAC obligatoria (mínimo 16 caracteres) para firma de sesiones de panel y ERP.
   - `NEXT_PUBLIC_PAGOS_RENTA`: Control de cobro en pasarela Wompi (`true` o `false`, por defecto `false`).
3. **Autenticación ERP:**
   - Algoritmo seguro `scrypt` con salt individual por usuario en `lib/erp/password.ts`.
   - Cookie segura HttpOnly `sh_session` protegida y validada en base de datos (`usuarios.activo = true`).
   - Rate limiting de login: 5 intentos fallidos en 15 minutos por IP/usuario.

---

## Rutas Públicas

| Ruta | Descripción |
|---|---|
| `/` | Portal de inicio con los 4 servicios principales flotantes |
| `/renta` | Landing de declaración de renta. Modo sin pagos: captación directa hacia agendamiento con contador |
| `/test` | Cuestionario y diagnóstico tributario (20 pasos) → resultado en `/r/[slug]` |
| `/r/[slug]` | Resultado del diagnóstico y arquetipo. CTA principal: "Agenda tu cita con un contador" |
| `/agendar` | Agendamiento directo general (`formulario = 'agendar'`) con calendario hábil y festivos colombianos |
| `/agenda/[slug]` | Página de reserva por link personalizado de contador (`formulario = 'agenda_link'`) |
| `/contabilidad` | Diagnóstico contable gratuito para empresas → registra formulario pendiente en CRM |
| `/nomina` | Servicio de nómina electrónica y prestaciones |
| `/personalizado` | Asesorías a la medida y requerimientos especiales DIAN |
| `/colaboradores` | Modelo de negocio y simulador de comisiones para contadores y vendedores |

---

## Tablas Nuevas y Esquema de Agenda

### `erp_links_agenda`
Almacena los enlaces personalizados creados por los contadores o administradores para compartir con sus clientes.
- `id` (UUID, PK)
- `usuario_id` (UUID, FK a `usuarios.id`)
- `slug` (text UNIQUE, ej: `carlos-renta-30m-abc1`)
- `titulo` (text)
- `servicio` (`renta`, `contabilidad`, `nomina`, `general`)
- `duracion_minutos` (15, 30, 45, 60)
- `activo` (boolean, default true)
- `created_at` (timestamptz)

### `erp_formularios`
Bandeja centralizada de captación y aprobación de todos los formularios públicos y solicitudes de cita.
- `id` (UUID, PK)
- `tipo_formulario` (`contabilidad`, `nomina`, `personalizado`, `renta_cita`, `renta_resultado`, `agenda_link`, `agendar`)
- `servicio` (`renta`, `contabilidad`, `nomina`, `personalizado`, `general`)
- `nombre` (text)
- `email` (text, nullable)
- `telefono` (text)
- `datos` (jsonb con respuestas detalladas: empresa, régimen, facturas/mes, etc.)
- `estado` (`pendiente`, `aprobado`, `rechazado`, default `pendiente`)
- `link_id` (UUID, nullable, FK a `erp_links_agenda.id`)
- `asignado_a` (UUID, nullable, FK a `usuarios.id`)
- `fecha_preferida` (date, nullable)
- `hora_preferida` (text, nullable)
- `notas` (text, nullable)
- `cliente_id` (UUID, nullable, FK a `erp_clientes.id`)
- `lead_id` (UUID, nullable, FK a `erp_leads.id`)
- `created_at` (timestamptz)

---

## Flujos de Agenda y Captación

1. **Links personalizados (`/agenda/[slug]`):**
   - Consulta el link en `erp_links_agenda` donde `activo = true`.
   - Selector de fecha omitiendo domingos y festivos colombianos (`lib/festivos.ts` basado en Ley Emiliani).
   - Selector de horas: 8:00 AM a 6:00 PM (L-V) y 8:00 AM a 1:00 PM (Sábados). Excluye horas ya reservadas para ese profesional mediante `/api/public/disponibilidad`.
   - Envío a `POST /api/public/cita`: crea registro en `citas` y en `erp_formularios` (`tipo_formulario = 'agenda_link'`).
   - Pantalla de éxito con opción de botón para añadir a Google Calendar.

2. **Agenda general (`/agendar`):**
   - Misma experiencia visual que el link personalizado, pero asignado de forma general al equipo (`formulario = 'agendar'`).

3. **Cita desde test de renta (`/r/[slug]`):**
   - Modal de agendamiento sin cobros de pasarela Wompi.
   - Envía a `POST /api/public/cita` con `formulario: 'renta_resultado'` y el `lead_id` correspondiente.

4. **Cita desde landing (`/renta`):**
   - Modal lateral de agendamiento rápido con campos de Tipo de Consulta.
   - Envía a `POST /api/public/cita` con `formulario: 'renta_cita'`.

5. **Formulario de contabilidad (`/contabilidad`):**
   - Registra el prospecto con `formulario: 'contabilidad'`. Queda en estado `pendiente` en la bandeja del CRM.

---

## Sistema de Aprobación de Formularios

- **Quién puede aprobar:** Usuarios con rol `admin` o `desarrollador` (`puedeAprobar(rol)` en `lib/erp/permisos.ts`).
- **Qué sucede al aprobar (`POST /api/erp/formularios/aprobar`):**
  1. Verifica permiso del usuario.
  2. Si el formulario no tiene `cliente_id`, busca en `erp_clientes` por email o teléfono; si no existe, crea un nuevo cliente con tipo `persona` o `empresa`.
  3. Si no tiene `lead_id`, busca o crea un lead comercial en `erp_leads` con etapa `ganado`.
  4. Vincula `cliente_id` y `lead_id` en el registro de `erp_formularios`.
  5. Actualiza el estado a `aprobado`.
  6. Devuelve `{ ok: true, cliente_id, lead_id }`.

---

## Control de Pagos en Renta (`PAGOS_RENTA_ACTIVOS`)

- En `lib/config.ts`:
  ```ts
  export const PAGOS_RENTA_ACTIVOS = process.env.NEXT_PUBLIC_PAGOS_RENTA === 'true';
  ```
- **Por defecto está en `false`:**
  - Fuera de temporada de renta no se cobra pasarela Wompi.
  - La ruta `/api/checkout` responde `410 Gone`.
  - `/pagos/respuesta` redirige a `/renta`.
  - La landing `/renta` y `/r/[slug]` enfocan el 100% de la conversión hacia agendamiento de cita con un contador y registro en el CRM.
- **Reactivación:** En la siguiente temporada de renta activa, basta con configurar `NEXT_PUBLIC_PAGOS_RENTA=true` en el dashboard de Vercel.

---

## Seguridad y Hardening

- **RLS activado:** 100% de tablas de usuario y de negocio (`leads`, `usuarios`, `ventas`, `orders`, `citas`, `respuestas`, `pipeline_leads`, `lead_requests`, `commissions`, `referral_events`, `app_settings`, `contadores`, `erp_*`).
- **Anon despojado:** Permisos `SELECT, INSERT, UPDATE, DELETE` revocados de `anon` y `authenticated` en tablas privadas. La única tabla de lectura pública es `arquetipos`.
- **Rutas `/api/admin/*` y `/api/pipeline`:** Todas protegidas mediante autenticación y verificación de sesión con permisos por rol.
- **Rate limiting:** Implementado en memoria por IP y endpoint (máximo 5 solicitudes / 10 minutos para formularios públicos; 5 intentos / 15 min para login).
- **Security Headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- **Acceso equipo:** Enlace discreto en el pie de página de `/renta`, `/contabilidad`, `/nomina` y `/personalizado` hacia `/admin/login`.
