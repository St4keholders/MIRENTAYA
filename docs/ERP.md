# Stakeholders · ERP + CRM

## Puesta en marcha (una sola vez)

1. **Base de datos.** En Supabase → SQL Editor, pega y ejecuta completo
   `supabase/migrations/20261003_erp_crm.sql`. Es aditivo: no toca las tablas de renta
   (`leads`, `ventas`, `orders`, `usuarios`…). Se puede ejecutar dos veces sin problema.
2. **Variables de entorno.** El ERP usa `SUPABASE_SERVICE_ROLE_KEY`, que ya está en Vercel.
   Opcional: crea `SESSION_SECRET` (cadena aleatoria de 32+ caracteres) para firmar las
   sesiones; si no existe se usa la service role key.
3. **Desplegar** la rama. Los usuarios existentes deben volver a iniciar sesión una vez
   (la sesión ahora es una cookie segura, no `localStorage`).

## Rutas públicas

| Ruta | Qué es |
|---|---|
| `/` | Nuevo inicio: 4 servicios flotantes |
| `/contabilidad`, `/nomina`, `/personalizado` | Páginas de servicio con formulario → crea un lead |
| `/renta` | El landing anterior de renta, sin cambios (test, agendar, resultados, Wompi siguen igual) |

## Panel (`/admin/dashboard`)

| Módulo | Función |
|---|---|
| Clientes | Terceros + cuentas por cobrar. Clic en un cliente → estado de cuenta, ventas, cobros |
| Proveedores | Igual, cuentas por pagar |
| Libro diario | Todos los asientos (partida doble, PUC). Filtros, saldos por cuenta, asiento manual, CSV |
| Compras | Facturas de compra / gastos, pagos a proveedores |
| Ventas | Facturas de venta, cobros |
| Leads | Embudo comercial + importación de los leads del test de renta |
| Usuarios | Alta, roles, activar/desactivar, cambio de contraseña |

El panel anterior quedó archivado en `/admin/renta`.

### Contabilización automática

| Evento | Débito | Crédito |
|---|---|---|
| Venta | 1305 Clientes (neto) · 1355 Retención a favor | 4155 Ingresos · 2408 IVA |
| Cobro | 1105/1110/1120 Caja o bancos | 1305 Clientes |
| Compra | Cuenta de gasto elegida · 2408 IVA descontable | 2365 Retención por pagar · 2205 Proveedores |
| Pago | 2205 Proveedores | Caja o bancos |
| Anulación | Contra-asiento exacto del original (no se borra nada) | |

Un documento con pagos aplicados no se puede anular hasta anular sus pagos.

### Permisos por rol

| Rol | Módulos |
|---|---|
| admin, desarrollador | Todos |
| contador | Todos menos Usuarios |
| vendedor | Clientes, Ventas, Leads (solo sus leads) |
| referido | Leads (solo sus leads) |

Los permisos se validan en el servidor (`lib/erp/permisos.ts`), no solo en la interfaz.

## Seguridad

- Las tablas `erp_*` tienen RLS activado sin políticas: la clave anon pública no puede leerlas.
- Toda la API `/api/erp/*` exige la cookie firmada `sh_session` (HttpOnly, 12 h).
- Pendiente fuera de este alcance: las rutas antiguas `/api/admin/*` (usadas por `/admin/renta`)
  siguen sin autenticación, igual que antes.
