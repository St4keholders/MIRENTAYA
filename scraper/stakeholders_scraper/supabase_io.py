"""Cliente mínimo de la API REST de Supabase (PostgREST) con la service_role."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request


class Supabase:
    def __init__(self, url: str | None = None, key: str | None = None):
        self.url = (url or os.environ["SUPABASE_URL"]).rstrip("/") + "/rest/v1"
        self.key = key or os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    def _req(self, metodo: str, ruta: str, params: dict | None = None, cuerpo=None, prefer: str | None = None):
        q = ("?" + urllib.parse.urlencode(params, safe="(),.*:")) if params else ""
        data = json.dumps(cuerpo, ensure_ascii=False, default=str).encode() if cuerpo is not None else None
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        req = urllib.request.Request(self.url + ruta + q, data=data, method=metodo, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                txt = r.read().decode()
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"Supabase {metodo} {ruta}: {e.code} {e.read().decode()[:500]}") from None
        return json.loads(txt) if txt else None

    # ── helpers ─────────────────────────────────────────────────────────────
    def select(self, tabla: str, **params):
        return self._req("GET", f"/{tabla}", params) or []

    def insert(self, tabla: str, filas: list[dict]):
        return self._req("POST", f"/{tabla}", cuerpo=filas, prefer="return=representation") or []

    def update(self, tabla: str, filtros: dict, valores: dict):
        return self._req("PATCH", f"/{tabla}", filtros, valores, prefer="return=representation") or []


def lista_in(valores) -> str:
    """Formatea valores para un filtro in.(…) de PostgREST."""
    limpios = [str(v).replace('"', "") for v in valores if v]
    return "in.(" + ",".join(f'"{v}"' for v in limpios) + ")"
