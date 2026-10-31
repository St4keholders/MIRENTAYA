"""Extracción de datos de contacto desde el HTML de cualquier página.

Funciona igual para el sitio web de la empresa, una ficha de directorio o una
página de contacto: busca enlaces tel:/mailto:/wa.me, correos y teléfonos en
el texto, redes sociales y datos estructurados (JSON-LD de schema.org).
"""
from __future__ import annotations

import json
import re
from urllib.parse import urljoin, urlparse

from scrapling.parser import Selector

from .modelo import Prospecto
from .normalizar import limpiar_texto, telefono_co

RE_EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
# Teléfonos colombianos escritos en texto: +57 300 123 4567, (604) 444-5566, 3001234567…
RE_TEL = re.compile(r"(?:\+?57[\s.\-]?)?\(?(?:3[0-5]\d|60[1-8])\)?[\s.\-]?\d{3}[\s.\-]?\d{4}")

REDES = {
    "instagram": re.compile(r"https?://(?:www\.)?instagram\.com/(?!p/|reel/|explore/|accounts/)[A-Za-z0-9_.]+/?", re.I),
    "facebook": re.compile(r"https?://(?:www\.|m\.|web\.)?facebook\.com/(?!sharer|share|dialog|plugins|tr\?|policies)[A-Za-z0-9_.\-/]+", re.I),
    "linkedin": re.compile(r"https?://(?:[a-z]{2}\.|www\.)?linkedin\.com/(?:company|in)/[A-Za-z0-9_\-%]+/?", re.I),
    "tiktok": re.compile(r"https?://(?:www\.)?tiktok\.com/@[A-Za-z0-9_.]+", re.I),
    "x": re.compile(r"https?://(?:www\.)?(?:twitter|x)\.com/(?!intent|share|home)[A-Za-z0-9_]+", re.I),
    "youtube": re.compile(r"https?://(?:www\.)?youtube\.com/(?:@|channel/|c/|user/)[A-Za-z0-9_\-]+", re.I),
}

CARGOS = r"(?:Gerente(?:\s+General)?|Representante\s+Legal|Director(?:a)?\s+General|CEO|Fundador(?:a)?|Propietari[oa]|Due[ñn][oa])"
NOMBRE = r"([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+(?:de\s+|del\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})"
RE_DUENO = [
    re.compile(CARGOS + r"\s*[:\-–]\s*" + NOMBRE),
    re.compile(NOMBRE + r"\s*[,\-–|]\s*" + CARGOS),
]

PALABRAS_CONTACTO = ("contacto", "contactenos", "contactanos", "contact", "nosotros", "quienes-somos", "about")


def _decodificar_cfemail(hexstr: str) -> str | None:
    """Cloudflare ofusca los correos en data-cfemail."""
    try:
        clave = int(hexstr[:2], 16)
        return "".join(chr(int(hexstr[i:i + 2], 16) ^ clave) for i in range(2, len(hexstr), 2))
    except ValueError:
        return None


def _jsonld(doc: Selector) -> list[dict]:
    salida: list[dict] = []
    for bloque in doc.css('script[type="application/ld+json"]::text').getall():
        try:
            data = json.loads(str(bloque))
        except (ValueError, TypeError):
            continue
        pila = data if isinstance(data, list) else [data]
        while pila:
            nodo = pila.pop()
            if isinstance(nodo, dict):
                salida.append(nodo)
                if isinstance(nodo.get("@graph"), list):
                    pila.extend(nodo["@graph"])
            elif isinstance(nodo, list):
                pila.extend(nodo)
    return salida


def _direccion_jsonld(addr) -> str | None:
    if isinstance(addr, str):
        return limpiar_texto(addr)
    if isinstance(addr, dict):
        partes = [addr.get(k) for k in ("streetAddress", "addressLocality", "addressRegion")]
        return limpiar_texto(", ".join(str(p) for p in partes if p))
    return None


def extraer_contactos(html: str, url: str, p: Prospecto, fuente: str) -> list[str]:
    """Agrega al prospecto todo lo que encuentre en el HTML.

    Devuelve los enlaces internos que parecen página de contacto (para visitarlos).
    """
    doc = Selector(content=html, url=url)
    hrefs = [str(h) for h in doc.css("a::attr(href)").getall()]

    for h in hrefs:
        hl = h.lower()
        if hl.startswith("tel:"):
            p.agregar_telefono(h[4:])
        elif hl.startswith("mailto:"):
            p.agregar_email(h)
        elif "wa.me/" in hl or "api.whatsapp.com" in hl or "whatsapp.com/send" in hl:
            m = re.search(r"(?:wa\.me/|phone=)(\+?\d{10,13})", h)
            if m:
                p.agregar_telefono(m.group(1))
        else:
            for red, rx in REDES.items():
                m = rx.match(h)
                if m:
                    p.agregar_red(red, m.group(0))
                    break

    for cf in doc.css("[data-cfemail]::attr(data-cfemail)").getall():
        p.agregar_email(_decodificar_cfemail(str(cf)))

    # Texto visible: correos y teléfonos escritos sin enlace
    texto = str(doc.get_all_text(separator=" ")) if hasattr(doc, "get_all_text") else ""
    for e in RE_EMAIL.findall(texto)[:20]:
        p.agregar_email(e)
    for t in RE_TEL.findall(texto)[:20]:
        if telefono_co(t):
            p.agregar_telefono(t)

    # Datos estructurados
    for nodo in _jsonld(doc):
        tipo = nodo.get("@type")
        tipos = tipo if isinstance(tipo, list) else [tipo]
        if not any(isinstance(t, str) and (t in ("Organization", "Corporation") or "Business" in t or t.endswith("Service")
                                          or t in ("Store", "Restaurant", "Dentist", "Physician", "LegalService", "ProfessionalService"))
                   for t in tipos):
            continue
        tels = nodo.get("telephone")
        for t in (tels if isinstance(tels, list) else [tels]):
            p.agregar_telefono(t)
        p.agregar_email(nodo.get("email"))
        p.direccion = p.direccion or _direccion_jsonld(nodo.get("address"))
        same = nodo.get("sameAs")
        for s in (same if isinstance(same, list) else [same]):
            if isinstance(s, str):
                for red, rx in REDES.items():
                    if rx.match(s):
                        p.agregar_red(red, s)
        url_org = nodo.get("url")
        if isinstance(url_org, str):
            p.poner_web(url_org)
        for clave in ("founder", "employee", "member"):
            persona = nodo.get(clave)
            persona = persona[0] if isinstance(persona, list) and persona else persona
            if isinstance(persona, dict) and persona.get("name") and not p.contacto_dueno:
                p.contacto_dueno = {
                    "nombre": limpiar_texto(persona.get("name"), 80),
                    "cargo": limpiar_texto(persona.get("jobTitle"), 60) or ("Fundador" if clave == "founder" else None),
                    "telefono": persona.get("telephone"),
                    "email": persona.get("email"),
                    "fuente": url,
                }

    # Dueño / gerente mencionado en el texto
    if not p.contacto_dueno and texto:
        for rx in RE_DUENO:
            m = rx.search(texto)
            if m:
                p.contacto_dueno = {"nombre": m.group(1).strip(), "cargo": None, "fuente": url, "confianza": "baja"}
                break

    p.agregar_fuente(fuente, url)

    # Enlaces internos de contacto
    base = urlparse(url).netloc
    internos: list[str] = []
    for h in hrefs:
        abs_ = urljoin(url, h)
        u = urlparse(abs_)
        if u.netloc == base and any(k in u.path.lower() for k in PALABRAS_CONTACTO) and abs_ not in internos:
            internos.append(abs_.split("#")[0])
    return internos[:3]
