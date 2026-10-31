"""Worker de prospección.

Toma las búsquedas en estado 'pendiente' de erp_prospeccion_busquedas, las
procesa una por una y carga los resultados en erp_leads (origen 'scraping').

Uso:
    python -m stakeholders_scraper.run            # procesa la cola
    python -m stakeholders_scraper.run --hay-cola # exit 0 si hay pendientes, 1 si no
"""
from __future__ import annotations

import argparse
import logging
import sys
import time
from datetime import datetime, timedelta, timezone

from .modelo import Prospecto
from .normalizar import formato_telefono, link_whatsapp
from .puntaje import calcular
from .supabase_io import Supabase, lista_in

log = logging.getLogger("prospeccion")
AHORA = lambda: datetime.now(timezone.utc).isoformat()  # noqa: E731
MAX_MINUTOS_POR_BUSQUEDA = 40


# ── deduplicación ────────────────────────────────────────────────────────────
def fusionar_duplicados(lista: list[Prospecto]) -> list[Prospecto]:
    """Une prospectos repetidos entre fuentes (mismo teléfono, correo, dominio o nombre)."""
    salida: list[Prospecto] = []
    indice: dict[str, Prospecto] = {}
    for p in lista:
        claves = [f"t:{t}" for t in p.telefonos] + [f"e:{e}" for e in p.emails]
        if p.dominio:
            claves.append(f"d:{p.dominio}")
        if p.clave_nombre():
            claves.append(f"n:{p.clave_nombre()}")
        existente = next((indice[k] for k in claves if k in indice), None)
        if existente:
            existente.fusionar(p)
            destino = existente
        else:
            salida.append(p)
            destino = p
        for k in claves:
            indice[k] = destino
        for t in destino.telefonos:
            indice[f"t:{t}"] = destino
        for e in destino.emails:
            indice[f"e:{e}"] = destino
    return salida


def ya_existentes(sb: Supabase, prospectos: list[Prospecto]) -> tuple[set[str], set[str], set[str]]:
    """Teléfonos, correos y dominios que ya están en erp_leads o en la lista de exclusión."""
    tels = {t for p in prospectos for t in p.telefonos}
    mails = {e for p in prospectos for e in p.emails}
    doms = {p.dominio for p in prospectos if p.dominio}
    t_db, e_db, d_db = set(), set(), set()

    def lotes(s):
        s = list(s)
        for i in range(0, len(s), 80):
            yield s[i:i + 80]

    for lote in lotes(tels):
        t_db |= {r["telefono_norm"] for r in sb.select("erp_leads", select="telefono_norm", telefono_norm=lista_in(lote))}
    for lote in lotes(mails):
        e_db |= {r["email_norm"] for r in sb.select("erp_leads", select="email_norm", email_norm=lista_in(lote))}
    for lote in lotes(doms):
        d_db |= {r["dominio"] for r in sb.select("erp_leads", select="dominio", dominio=lista_in(lote))}

    valores = list(tels | mails | doms)
    for lote in lotes(valores):
        for r in sb.select("erp_prospeccion_exclusiones", select="tipo,valor", valor=lista_in(lote)):
            {"telefono": t_db, "email": e_db, "dominio": d_db}[r["tipo"]].add(r["valor"])
    return t_db, e_db, d_db


# ── fila para erp_leads ──────────────────────────────────────────────────────
def a_fila(p: Prospecto, b: dict) -> dict:
    puntaje, detalle = calcular(p, b["tipo_negocio"])
    tel = p.telefonos[0] if p.telefonos else None
    datos = {
        "telefonos": [formato_telefono(t) for t in p.telefonos],
        "emails": p.emails,
        "whatsapp": link_whatsapp(p.celular) if p.celular else None,
        "redes": p.redes,
        "web": p.web,
        "direccion": p.direccion,
        "categoria": p.categoria,
        "calificacion": p.calificacion,
        "resenas": p.resenas,
        "contacto_dueno": p.contacto_dueno,
        "fuentes": p.fuentes,
        "puntaje_detalle": detalle,
        "busqueda": {"ciudad": b["ciudad"], "tipo_negocio": b["tipo_negocio"], "con_website": b["con_website"]},
    }
    resumen = " · ".join(x for x in [p.categoria, p.direccion, f"{p.resenas} reseñas" if p.resenas is not None else None] if x)
    return {
        "nombre": p.nombre[:160],
        "empresa": p.nombre[:160],
        "email": p.emails[0] if p.emails else None,
        "telefono": formato_telefono(tel) if tel else None,
        "servicio": b.get("servicio") or "contabilidad",
        "origen": "scraping",
        "estado": "nuevo",
        "ciudad": p.ciudad or b["ciudad"],
        "red_principal": p.red_principal,
        "puntaje": puntaje,
        "datos": datos,
        "busqueda_id": b["id"],
        "fuente_url": p.fuente_url,
        "fecha_captura": AHORA(),
        "dominio": p.dominio,
        "mensaje": f"Prospección: {b['tipo_negocio']} en {b['ciudad']}" + (f" — {resumen}" if resumen else ""),
        # Quien lanzó la búsqueda queda como responsable (así el vendedor ve sus leads)
        "responsable_id": b.get("creado_por"),
        "created_by": b.get("creado_por"),
    }


# ── una búsqueda ─────────────────────────────────────────────────────────────
def procesar(sb: Supabase, b: dict) -> None:
    # Import diferido: Scrapling solo se instala cuando hay búsquedas en cola
    from .fuentes import directorios, google_maps, web

    tipo, ciudad, limite = b["tipo_negocio"], b["ciudad"], int(b["limite"])
    fuentes = b.get("fuentes") or ["google_maps", "directorios", "web"]
    inicio = time.time()
    log.info("▶ Búsqueda %s: %s en %s (límite %d, fuentes %s)", b["id"], tipo, ciudad, limite, fuentes)

    encontrados: list[Prospecto] = []
    errores: list[str] = []
    pasos = [
        ("google_maps", lambda: google_maps.buscar(tipo, ciudad, limite)),
        ("directorios", lambda: directorios.buscar_directorios(tipo, ciudad, max(10, limite // 2))),
        ("web", lambda: directorios.buscar_sitios(tipo, ciudad, max(10, limite // 2))),
    ]
    for nombre, paso in pasos:
        if nombre not in fuentes:
            continue
        try:
            encontrados += paso()
        except Exception as e:  # noqa: BLE001 — una fuente caída no anula las demás
            log.exception("Fuente %s falló", nombre)
            errores.append(f"{nombre}: {e}"[:200])

    prospectos = fusionar_duplicados(encontrados)
    log.info("Encontrados %d (%d tras unir duplicados entre fuentes)", len(encontrados), len(prospectos))

    # Enriquecer con el sitio web propio cuando falta celular o correo
    for p in prospectos:
        if time.time() - inicio > MAX_MINUTOS_POR_BUSQUEDA * 60:
            log.warning("Tiempo máximo alcanzado: se omite el enriquecimiento restante")
            break
        if p.web and not (p.celular and p.emails):
            web.enriquecer(p)
    prospectos = fusionar_duplicados(prospectos)
    total_unicos = len(prospectos)

    # Filtro "website sí / no"
    if b["con_website"] == "si":
        prospectos = [p for p in prospectos if p.web]
    elif b["con_website"] == "no":
        prospectos = [p for p in prospectos if not p.web]

    # Sin ningún dato de contacto no sirve como lead
    prospectos = [p for p in prospectos if p.telefonos or p.emails or p.redes]

    # Deduplicar contra la base y la lista de exclusión
    t_db, e_db, d_db = ya_existentes(sb, prospectos)
    nuevos, duplicados = [], 0
    for p in prospectos:
        if any(t in t_db for t in p.telefonos) or any(e in e_db for e in p.emails) or (p.dominio and p.dominio in d_db):
            duplicados += 1
            continue
        nuevos.append(p)
        t_db.update(p.telefonos)
        e_db.update(p.emails)
        if p.dominio:
            d_db.add(p.dominio)

    nuevos.sort(key=lambda p: calcular(p, tipo)[0], reverse=True)
    nuevos = nuevos[:limite]
    filas = [a_fila(p, b) for p in nuevos]
    for i in range(0, len(filas), 50):
        sb.insert("erp_leads", filas[i:i + 50])

    estado = "completada" if (filas or not errores) else "error"
    sb.update("erp_prospeccion_busquedas", {"id": f"eq.{b['id']}"}, {
        "estado": estado,
        "total_encontrados": total_unicos,
        "total_nuevos": len(filas),
        "total_duplicados": duplicados,
        "error": "; ".join(errores)[:1000] or None,
        "finished_at": AHORA(),
    })
    log.info("✔ %s: %d nuevos, %d duplicados, %d errores de fuente (%.0fs)",
             estado, len(filas), duplicados, len(errores), time.time() - inicio)


def recuperar_colgadas(sb: Supabase) -> None:
    """Una búsqueda en 'procesando' por más de 90 min quedó huérfana (runner cancelado)."""
    limite = (datetime.now(timezone.utc) - timedelta(minutes=90)).isoformat()
    sb.update("erp_prospeccion_busquedas",
              {"estado": "eq.procesando", "started_at": f"lt.{limite}"},
              {"estado": "error", "error": "El proceso se interrumpió. Usa Reintentar.", "finished_at": AHORA()})


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--hay-cola", action="store_true")
    ap.add_argument("--max", type=int, default=3, help="máximo de búsquedas por ejecución")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    sb = Supabase()
    recuperar_colgadas(sb)
    def siguiente():
        filas = sb.select("erp_prospeccion_busquedas", select="*", estado="eq.pendiente",
                          order="created_at.asc", limit="1")
        return filas[0] if filas else None

    if args.hay_cola:
        hay = siguiente() is not None
        print(f"hay_cola={hay}")
        return 0 if hay else 1

    # Se vuelve a mirar la cola después de cada búsqueda: así también se procesan
    # las que se crean mientras el worker ya está trabajando.
    procesadas = 0
    while procesadas < args.max:
        b = siguiente()
        if not b:
            break
        procesadas += 1
        # Reclamar la búsqueda (si otro proceso la tomó, el update no devuelve filas)
        tomada = sb.update("erp_prospeccion_busquedas", {"id": f"eq.{b['id']}", "estado": "eq.pendiente"},
                           {"estado": "procesando", "started_at": AHORA()})
        if not tomada:
            continue
        try:
            procesar(sb, tomada[0])
        except Exception as e:  # noqa: BLE001
            log.exception("Búsqueda %s falló", b["id"])
            sb.update("erp_prospeccion_busquedas", {"id": f"eq.{b['id']}"},
                      {"estado": "error", "error": str(e)[:1000], "finished_at": AHORA()})
    log.info("Cola revisada: %d búsquedas procesadas", procesadas)
    return 0

if __name__ == "__main__":
    sys.exit(main())
