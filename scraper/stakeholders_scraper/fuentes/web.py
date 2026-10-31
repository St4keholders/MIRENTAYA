"""Enriquecimiento visitando el sitio web propio de la empresa."""
from __future__ import annotations

import logging

from scrapling.fetchers import Fetcher

from ..extraer import extraer_contactos
from ..modelo import Prospecto

log = logging.getLogger(__name__)


def descargar(url: str, timeout: int = 20) -> str | None:
    try:
        r = Fetcher.get(url, timeout=timeout, follow_redirects=True, stealthy_headers=True, retries=1)
    except Exception as e:  # noqa: BLE001 — un sitio caído no debe tumbar la búsqueda
        log.info("No se pudo abrir %s: %s", url, e)
        return None
    if getattr(r, "status", 0) >= 400:
        return None
    body = r.body
    return body.decode("utf-8", "ignore") if isinstance(body, (bytes, bytearray)) else str(body)


def enriquecer(p: Prospecto, max_paginas: int = 3) -> None:
    """Abre el home y hasta 2 páginas de contacto; agrega todo lo que encuentre."""
    if not p.web:
        return
    visitadas: set[str] = set()
    cola = [p.web]
    while cola and len(visitadas) < max_paginas:
        url = cola.pop(0)
        if url in visitadas:
            continue
        visitadas.add(url)
        html = descargar(url)
        if not html:
            continue
        internos = extraer_contactos(html, url, p, "web")
        # Si ya tenemos celular y correo, no hace falta seguir
        if p.celular and p.emails:
            break
        cola.extend(i for i in internos if i not in visitadas)
