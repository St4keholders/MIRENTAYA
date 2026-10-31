"""Puntaje 0-100 de un prospecto.

Dos mitades, para priorizar por necesidad real y no por volumen:

* Contactabilidad (hasta 60): ¿podemos hablar con ellos hoy mismo?
* Necesidad (hasta 40): señales de que una empresa de servicios pequeña,
  sin estructura administrativa propia, necesita un contador externo.

Cada punto queda explicado en datos.puntaje_detalle para que el equipo
comercial entienda por qué un lead está arriba.
"""
from __future__ import annotations

from .modelo import Prospecto

PALABRAS_SERVICIOS = (
    "servicio", "agencia", "consult", "asesor", "clínica", "clinica", "odont", "estétic", "estetic",
    "software", "marketing", "publicidad", "logíst", "logist", "transporte", "vigilancia", "seguridad",
    "aseo", "limpieza", "ingenier", "arquitect", "abogad", "jurídic", "juridic", "academia", "instituto",
    "laboratorio", "veterinar", "taller", "gimnasio", "spa", "salón", "salon", "diseño", "diseno",
    "eventos", "viajes", "turismo", "inmobiliari", "mantenimiento", "fotograf", "imprenta",
)


def es_servicios(p: Prospecto, tipo_buscado: str) -> bool:
    texto = f"{p.categoria or ''} {tipo_buscado} {p.nombre}".lower()
    return any(k in texto for k in PALABRAS_SERVICIOS)


def calcular(p: Prospecto, tipo_buscado: str) -> tuple[int, list[tuple[str, int]]]:
    det: list[tuple[str, int]] = []

    # Contactabilidad
    if p.celular:
        det.append(("Celular con WhatsApp", 30))
    elif p.telefonos:
        det.append(("Solo teléfono fijo", 10))
    if p.emails:
        det.append(("Correo de contacto", 20))
    if p.redes:
        det.append(("Red social activa", 10))

    # Necesidad
    if not p.web:
        det.append(("Sin sitio web (estructura administrativa liviana)", 10))
    if p.resenas is not None and p.resenas < 60:
        det.append(("Negocio pequeño (pocas reseñas)", 10))
    if es_servicios(p, tipo_buscado):
        det.append(("Empresa de servicios", 10))
    if p.contacto_dueno and p.contacto_dueno.get("nombre"):
        det.append(("Se identificó al dueño / gerente", 10))

    return min(100, sum(v for _, v in det)), det
