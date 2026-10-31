"""Directorios empresariales y sitios web encontrados por buscador.

Cada sector publica en su propio canal, así que en vez de amarrarse a un solo
directorio se usa un buscador (DuckDuckGo HTML, sin JavaScript) con filtros
`site:` hacia los directorios colombianos con datos de contacto, y una
búsqueda abierta para encontrar los sitios web propios de las empresas.
"""
from __future__ import annotations

import logging
import re
import time
from urllib.parse import parse_qs, quote_plus, unquote, urlparse

from scrapling.fetchers import Fetcher
from scrapling.parser import Selector

from ..extraer import extraer_contactos
from ..modelo import Prospecto
from ..normalizar import dominio_de, es_sitio_propio, limpiar_texto

log = logging.getLogger(__name__)

# Directorios con fichas públicas de empresas colombianas
DIRECTORIOS = {
    "paginasamarillas.com.co": "/empresas/",
    "infoisinfo.com.co": "/",
    "cylex.com.co": "/",
    "empresite.eleconomistaamerica.co": "/",
}

# Resultados que no son empresas (noticias, portales, redes, gobierno…)
NO_EMPRESA = (
    "wikipedia.org", "gov.co", "eltiempo.com", "elcolombiano.com", "semana.com", "computrabajo",
    "elempleo.com", "indeed.com", "tripadvisor", "booking.com", "mercadolibre", "olx", "rappi",
    "doctoralia", "yelp", "foursquare", "duckduckgo.com",
) + tuple(DIRECTORIOS)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"


def _ddg(consulta: str, paginas: int = 2) -> list[str]:
    """Devuelve URLs de resultados orgánicos de DuckDuckGo HTML."""
    urls: list[str] = []
    for pagina in range(paginas):
        q = quote_plus(consulta)
        url = f"https://html.duckduckgo.com/html/?q={q}&kl=co-es" + (f"&s={pagina * 30}" if pagina else "")
        try:
            r = Fetcher.get(url, timeout=20, stealthy_headers=True, headers={"User-Agent": UA}, retries=1)
        except Exception as e:  # noqa: BLE001
            log.info("Buscador falló (%s): %s", consulta, e)
            break
        nuevos = 0
        for h in r.css("a.result__a::attr(href)").getall():
            h = str(h)
            if "uddg=" in h:
                h = unquote(parse_qs(urlparse(h if h.startswith("http") else "https:" + h).query).get("uddg", [""])[0])
            if h.startswith("http") and h not in urls:
                urls.append(h)
                nuevos += 1
        if not nuevos:
            break
        time.sleep(2.5)  # no saturar el buscador
    return urls


def _nombre_pagina(doc: Selector) -> str | None:
    for sel in ('meta[property="og:site_name"]::attr(content)', "h1::text", 'meta[property="og:title"]::attr(content)', "title::text"):
        v = doc.css(sel).get()
        if v:
            # "Empresa XYZ | Contacto - Medellín" -> "Empresa XYZ"
            return limpiar_texto(re.split(r"\s[|\-–—·:]\s", str(v))[0], 120)
    return None


def _web_en_ficha(doc: Selector, dominio_directorio: str) -> str | None:
    for a in doc.css("a"):
        href = str(a.attrib.get("href") or "")
        texto = (str(a.get_all_text()) + " " + str(a.attrib.get("title") or "")).lower()
        if href.startswith("http") and dominio_directorio not in href and es_sitio_propio(href) \
                and re.search(r"sitio web|p[aá]gina web|\bweb\b|visitar", texto):
            return href
    return None


def _descargar(url: str) -> tuple[str, str] | None:
    try:
        r = Fetcher.get(url, timeout=20, stealthy_headers=True, follow_redirects=True, retries=1)
    except Exception as e:  # noqa: BLE001
        log.info("No se pudo abrir %s: %s", url, e)
        return None
    if r.status >= 400:
        log.info("%s respondió %s", url, r.status)
        return None
    return r.html_content, str(r.url)


def buscar_directorios(tipo: str, ciudad: str, limite: int) -> list[Prospecto]:
    resultados: list[Prospecto] = []
    for dominio, ruta in DIRECTORIOS.items():
        if len(resultados) >= limite:
            break
        filtro = f"site:{dominio}{ruta if ruta != '/' else ''}"
        for url in _ddg(f'{filtro} {tipo} {ciudad}'):
            if len(resultados) >= limite:
                break
            if dominio not in url:
                continue
            got = _descargar(url)
            if not got:
                continue
            html, final = got
            doc = Selector(content=html, url=final)
            nombre = _nombre_pagina(doc)
            if not nombre:
                continue
            p = Prospecto(nombre=nombre, ciudad=ciudad)
            extraer_contactos(html, final, p, "directorio")
            p.poner_web(_web_en_ficha(doc, dominio))
            if p.telefonos or p.emails or p.web:
                resultados.append(p)
            time.sleep(1.2)
    log.info("Directorios: %d fichas para '%s' en %s", len(resultados), tipo, ciudad)
    return resultados


def buscar_sitios(tipo: str, ciudad: str, limite: int) -> list[Prospecto]:
    """Sitios web propios de empresas (se enriquecen después con fuentes.web)."""
    resultados: list[Prospecto] = []
    vistos: set[str] = set()
    for consulta in (f"{tipo} {ciudad} contacto", f"{tipo} en {ciudad} Colombia empresa"):
        for url in _ddg(consulta):
            dom = dominio_de(url)
            if not dom or dom in vistos or not es_sitio_propio(url) or any(x in dom for x in NO_EMPRESA):
                continue
            vistos.add(dom)
            got = _descargar(f"https://{urlparse(url).netloc}/")
            if not got:
                continue
            html, final = got
            nombre = _nombre_pagina(Selector(content=html, url=final))
            if not nombre:
                continue
            p = Prospecto(nombre=nombre, ciudad=ciudad, web=f"https://{urlparse(final).netloc}/")
            extraer_contactos(html, final, p, "web")
            resultados.append(p)
            if len(resultados) >= limite:
                return resultados
            time.sleep(1.0)
    log.info("Sitios web: %d empresas para '%s' en %s", len(resultados), tipo, ciudad)
    return resultados
