"""Normalización de datos de contacto colombianos.

Debe comportarse igual que lib/erp/prospeccion.ts y que la función SQL
erp_normalizar_telefono_co (migración 20261031_prospeccion_leads.sql).
"""
from __future__ import annotations

import re
from urllib.parse import urlparse

_RE_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[a-z]{2,}$", re.I)

# Correos que aparecen en plantillas, ejemplos o servicios de terceros
_EMAILS_BASURA = (
    "example.com", "ejemplo.com", "dominio.com", "tudominio.com", "sentry.io", "wixpress.com",
    "sentry-next.wixpress.com", "godaddy.com", "domain.com", "email.com", "correo.com",
)
_EXT_IMAGEN = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg")

# Dominios que no son el sitio propio de la empresa
DOMINIOS_NO_EMPRESA = (
    "facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com", "tiktok.com",
    "youtube.com", "wa.me", "whatsapp.com", "api.whatsapp.com", "google.com", "goo.gl",
    "maps.app.goo.gl", "paginasamarillas.com.co", "linktr.ee", "bit.ly", "wix.com",
)


def telefono_co(raw: str | None) -> tuple[str, str] | None:
    """Devuelve (numero_10_digitos, 'celular' | 'fijo') o None."""
    if not raw:
        return None
    d = re.sub(r"\D", "", str(raw))
    if d.startswith("0057"):
        d = d[4:]
    if len(d) == 12 and d.startswith("57"):
        d = d[2:]
    if len(d) == 10 and re.fullmatch(r"3[0-5]\d{8}", d):
        return d, "celular"
    if len(d) == 10 and re.fullmatch(r"60[1-8]\d{7}", d):
        return d, "fijo"
    return None


def formato_telefono(numero: str) -> str:
    """3001234567 -> +57 300 123 4567 ; 6044445566 -> +57 604 444 5566"""
    return f"+57 {numero[:3]} {numero[3:6]} {numero[6:]}"


def link_whatsapp(raw: str | None) -> str | None:
    t = telefono_co(raw)
    return f"https://wa.me/57{t[0]}" if t and t[1] == "celular" else None


def email_valido(raw: str | None) -> str | None:
    if not raw:
        return None
    e = str(raw).strip().strip(".,;:").lower()
    if e.startswith("mailto:"):
        e = e[7:].split("?")[0]
    if not _RE_EMAIL.match(e):
        return None
    dominio = e.split("@", 1)[1]
    if dominio.endswith(_EXT_IMAGEN) or any(dominio == b or dominio.endswith("." + b) for b in _EMAILS_BASURA):
        return None
    return e


def dominio_de(url: str | None) -> str | None:
    if not url:
        return None
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url
    try:
        host = (urlparse(url).hostname or "").lower()
    except ValueError:
        return None
    host = host[4:] if host.startswith("www.") else host
    return host or None


def es_sitio_propio(url: str | None) -> bool:
    d = dominio_de(url)
    if not d:
        return False
    return not any(d == x or d.endswith("." + x) for x in DOMINIOS_NO_EMPRESA)


def limpiar_texto(v: str | None, maximo: int = 200) -> str | None:
    if not v:
        return None
    t = re.sub(r"\s+", " ", str(v)).strip()
    return t[:maximo] or None
