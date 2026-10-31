# Prospección de leads (scraping)

Módulo del ERP para encontrar empresas que necesitan un contador y cargarlas en `erp_leads`.

## Cómo funciona

```
ERP › Prospección › "Nueva búsqueda"  (ciudad, tipo de negocio, website sí/no)
        │  POST /api/erp/prospeccion
        ▼
erp_prospeccion_busquedas  (estado = pendiente)
        │  GitHub Actions revisa la cola cada 10 min (.github/workflows/prospeccion.yml)
        ▼
scraper/ (Python + Scrapling)
  1. Google Maps (navegador real)  → nombre, teléfono, web, dirección, categoría, reseñas
  2. Directorios (Páginas Amarillas, Infoisinfo, Cylex, Empresite) vía buscador
  3. Sitios web de empresas → home + página de contacto: correos, celulares, WhatsApp,
     redes, JSON-LD, dueño/gerente si aparece
  4. Une duplicados entre fuentes, filtra website sí/no, descarta lo que no tiene contacto
  5. Descarta lo que ya está en erp_leads o en la lista de exclusión
  6. Calcula el puntaje y guarda en erp_leads (origen = 'scraping')
```

## Qué va en la tabla y qué en los detalles

| Tabla (`erp_leads`) | Detalles (`erp_leads.datos`, jsonb) |
|---|---|
| nombre / empresa, teléfono, correo, red principal, ciudad, estado, puntaje | todos los teléfonos y correos, link de WhatsApp, todas las redes, web, dirección, categoría, calificación y reseñas de Google, contacto del dueño/gerente, fuentes, desglose del puntaje, búsqueda que lo generó |

Además: `fuente_url`, `fecha_captura`, `busqueda_id`, `opt_out` y las claves normalizadas `telefono_norm`, `email_norm`, `dominio` (las dos primeras las calcula un trigger en la base, para cualquier lead, venga de donde venga).

## Puntaje (0–100)

Prioriza por necesidad, no por volumen.

- **Contactabilidad (hasta 60):** celular con WhatsApp +30 (o solo fijo +10), correo +20, red social +10.
- **Necesidad (hasta 40):** sin sitio web +10, pocas reseñas en Google (< 60) +10, empresa de servicios +10, dueño/gerente identificado +10.

El desglose se ve en el detalle de cada lead. Para ajustar los pesos: `scraper/stakeholders_scraper/puntaje.py`.

## Puesta en marcha

1. Migraciones (ya aplicadas en producción el 2026-10-31):
   - `supabase/migrations/20261031_limpieza_seguridad.sql`
   - `supabase/migrations/20261031_prospeccion_leads.sql`
2. Secrets del repositorio en GitHub (Settings → Secrets and variables → Actions):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Hacer merge a `main`: GitHub solo ejecuta workflows programados desde la rama principal.
4. Opcional, para que la búsqueda arranque al instante en vez de esperar hasta 10 min:
   en Vercel agregar `GITHUB_DISPATCH_TOKEN` (token fine-grained del repo con permiso *Actions: read & write*).

## Habeas Data (Ley 1581 de 2012)

- En el detalle del lead, **Excluir (Habeas Data)** borra teléfono, correo y detalles,
  marca `opt_out` y guarda teléfono, correo y dominio en `erp_prospeccion_exclusiones`.
  Ninguna búsqueda futura lo vuelve a cargar.
- Solo se cargan datos publicados por las propias empresas (fichas públicas, sitios web).
- Usar los contactos para ofrecer el servicio de forma individual, no para envíos masivos,
  e informar la política de tratamiento de datos en el primer contacto.

## Límites conocidos

- Google Maps cambia su HTML con frecuencia. Si una búsqueda termina con 0 resultados de
  Google, revisar el log del workflow en GitHub → Actions → "Prospección de leads".
- El buscador (DuckDuckGo) puede limitar peticiones si se lanzan muchas búsquedas seguidas.
  Por eso hay máximo 3 búsquedas en cola a la vez.
- El dueño/gerente solo aparece si la empresa lo publica. El RUES exige captcha, así que no se
  consulta automáticamente.

## Probar el worker

```bash
cd scraper
pip install -r requirements.txt pytest
python -m pytest tests          # pruebas sin red
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python -m stakeholders_scraper.run --hay-cola
```
