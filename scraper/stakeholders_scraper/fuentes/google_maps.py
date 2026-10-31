"""Google Maps con navegador real (Scrapling StealthySession).

1. Abre la búsqueda "{tipo} en {ciudad}, Colombia" y hace scroll en la lista
   de resultados hasta juntar `limite` fichas o llegar al final.
2. Abre cada ficha y lee nombre, teléfono, sitio web, dirección, categoría,
   calificación y número de reseñas.

Google cambia su HTML con frecuencia: los selectores usan los atributos
`data-item-id` / `aria-label`, que son los más estables. Si un día deja de
encontrar resultados, revisar el log del workflow (se guarda captura de la
página en artifacts).
"""
from __future__ import annotations

import logging
import re
import time
from urllib.parse import quote_plus

from scrapling.fetchers import StealthySession
from scrapling.parser import Selector

from ..modelo import Prospecto
from ..normalizar import limpiar_texto

log = logging.getLogger(__name__)

FEED = 'div[role="feed"]'


def _aceptar_consentimiento(page) -> None:
    if "consent." not in page.url:
        return
    for texto in ("Aceptar todo", "Accept all", "Rechazar todo", "Reject all"):
        try:
            page.get_by_role("button", name=texto).first.click(timeout=3000)
            page.wait_for_load_state("domcontentloaded")
            return
        except Exception:  # noqa: BLE001
            continue


def _scroll_resultados(limite: int):
    def accion(page):
        _aceptar_consentimiento(page)
        try:
            page.wait_for_selector(FEED, timeout=15000)
        except Exception:  # noqa: BLE001 — una sola ficha abre directo el detalle
            return
        vistos, quietos = 0, 0
        for _ in range(60):
            page.eval_on_selector(FEED, "el => el.scrollBy(0, el.scrollHeight)")
            time.sleep(1.4)
            n = page.locator(f'{FEED} a[href*="/maps/place/"]').count()
            fin = page.locator("text=/Llegaste al final|You've reached the end/").count() > 0
            if n >= limite or fin:
                break
            quietos = quietos + 1 if n == vistos else 0
            if quietos >= 4:
                break
            vistos = n
    return accion


def _numero(texto: str | None) -> float | None:
    if not texto:
        return None
    m = re.search(r"\d+(?:[.,]\d+)?", texto.replace("\xa0", " "))
    return float(m.group(0).replace(",", ".")) if m else None


def _leer_ficha(html: str, url: str, ciudad: str) -> Prospecto | None:
    doc = Selector(content=html, url=url)
    nombre = limpiar_texto(doc.css("h1::text").get(), 160)
    if not nombre:
        return None
    p = Prospecto(nombre=nombre, ciudad=ciudad)

    for item in doc.css('[data-item-id^="phone:tel:"]::attr(data-item-id)').getall():
        p.agregar_telefono(str(item).split("phone:tel:", 1)[1])
    web = doc.css('a[data-item-id="authority"]::attr(href)').get()
    if web:
        p.poner_web(str(web))
    dir_ = doc.css('button[data-item-id="address"]::attr(aria-label)').get()
    if dir_:
        p.direccion = limpiar_texto(re.sub(r"^(Dirección|Address):\s*", "", str(dir_)))
    p.categoria = limpiar_texto(doc.css('button[jsaction*="category"]::text').get(), 80)

    resenas_txt = doc.css('[aria-label*="reseña"]::attr(aria-label), [aria-label*="review"]::attr(aria-label)').get()
    resenas = _numero(str(resenas_txt).replace(".", "").replace(",", "")) if resenas_txt else None
    p.resenas = int(resenas) if resenas is not None else None
    estrellas_txt = doc.css('[aria-label*="estrellas"]::attr(aria-label), [aria-label*="stars"]::attr(aria-label)').get()
    p.calificacion = _numero(str(estrellas_txt)) if estrellas_txt else None

    p.agregar_fuente("google_maps", url.split("?")[0])
    return p


def buscar(tipo: str, ciudad: str, limite: int) -> list[Prospecto]:
    consulta = quote_plus(f"{tipo} en {ciudad}, Colombia")
    url = f"https://www.google.com/maps/search/{consulta}?hl=es"
    resultados: list[Prospecto] = []

    with StealthySession(headless=True, locale="es-CO", timezone_id="America/Bogota",
                         disable_resources=False, timeout=45000) as s:
        lista = s.fetch(url, page_action=_scroll_resultados(limite), network_idle=False, wait=1500)
        enlaces: list[str] = []
        for h in lista.css('a[href*="/maps/place/"]::attr(href)').getall():
            h = str(h)
            if h.startswith("/"):
                h = "https://www.google.com" + h
            if h not in enlaces:
                enlaces.append(h)
        log.info("Google Maps: %d fichas en la lista para '%s'", len(enlaces), consulta)

        # Si la búsqueda abrió directamente una ficha única
        if not enlaces and lista.css("h1::text").get():
            p = _leer_ficha(lista.html_content, str(lista.url), ciudad)
            return [p] if p else []

        for i, enlace in enumerate(enlaces[:limite]):
            try:
                r = s.fetch(enlace, wait_selector="h1", timeout=30000, wait=800)
                p = _leer_ficha(r.html_content, enlace, ciudad)
                if p:
                    resultados.append(p)
            except Exception as e:  # noqa: BLE001
                log.info("Ficha %d falló: %s", i, e)
            time.sleep(0.8)
    return resultados
