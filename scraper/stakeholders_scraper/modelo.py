from __future__ import annotations

from dataclasses import dataclass, field

from .normalizar import dominio_de, email_valido, es_sitio_propio, limpiar_texto, telefono_co

REDES_ORDEN = ("instagram", "facebook", "linkedin", "tiktok", "x", "youtube")


@dataclass
class Prospecto:
    """Un negocio encontrado. Se va enriqueciendo a medida que pasa por las fuentes."""

    nombre: str
    ciudad: str | None = None
    telefonos: list[str] = field(default_factory=list)  # 10 dígitos, normalizados
    emails: list[str] = field(default_factory=list)
    web: str | None = None
    redes: dict[str, str] = field(default_factory=dict)
    direccion: str | None = None
    categoria: str | None = None
    calificacion: float | None = None
    resenas: int | None = None
    contacto_dueno: dict | None = None
    fuentes: list[str] = field(default_factory=list)
    fuente_url: str | None = None

    # ── mutadores con validación ───────────────────────────────────────────
    def agregar_telefono(self, raw: str | None) -> None:
        t = telefono_co(raw)
        if t and t[0] not in self.telefonos:
            # Los celulares primero: son los que sirven para WhatsApp
            if t[1] == "celular":
                self.telefonos.insert(0, t[0])
            else:
                self.telefonos.append(t[0])

    def agregar_email(self, raw: str | None) -> None:
        e = email_valido(raw)
        if e and e not in self.emails:
            self.emails.append(e)

    def agregar_red(self, red: str, url: str) -> None:
        if red not in self.redes and url:
            self.redes[red] = url.split("?")[0]

    def poner_web(self, url: str | None) -> None:
        if not self.web and url and es_sitio_propio(url):
            self.web = url if url.startswith("http") else f"https://{url}"

    def agregar_fuente(self, fuente: str, url: str | None = None) -> None:
        if fuente not in self.fuentes:
            self.fuentes.append(fuente)
        if url and not self.fuente_url:
            self.fuente_url = url

    def fusionar(self, otro: "Prospecto") -> None:
        for t in otro.telefonos:
            self.agregar_telefono(t)
        for e in otro.emails:
            self.agregar_email(e)
        for r, u in otro.redes.items():
            self.agregar_red(r, u)
        self.poner_web(otro.web)
        self.direccion = self.direccion or otro.direccion
        self.categoria = self.categoria or otro.categoria
        self.calificacion = self.calificacion if self.calificacion is not None else otro.calificacion
        self.resenas = self.resenas if self.resenas is not None else otro.resenas
        self.contacto_dueno = self.contacto_dueno or otro.contacto_dueno
        for f in otro.fuentes:
            self.agregar_fuente(f)
        self.fuente_url = self.fuente_url or otro.fuente_url

    # ── claves ─────────────────────────────────────────────────────────────
    @property
    def dominio(self) -> str | None:
        return dominio_de(self.web) if self.web else None

    @property
    def celular(self) -> str | None:
        return next((t for t in self.telefonos if t.startswith("3")), None)

    @property
    def red_principal(self) -> str | None:
        for r in REDES_ORDEN:
            if r in self.redes:
                return self.redes[r]
        return None

    def clave_nombre(self) -> str:
        n = (limpiar_texto(self.nombre, 120) or "").lower()
        return "".join(ch for ch in n if ch.isalnum())
