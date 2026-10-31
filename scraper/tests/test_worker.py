from stakeholders_scraper.extraer import extraer_contactos
from stakeholders_scraper.fuentes.google_maps import _leer_ficha
from stakeholders_scraper.modelo import Prospecto
from stakeholders_scraper.normalizar import email_valido, link_whatsapp, telefono_co
from stakeholders_scraper.puntaje import calcular
from stakeholders_scraper.run import a_fila, fusionar_duplicados


def test_telefonos_colombianos():
    assert telefono_co("+57 300 123 4567") == ("3001234567", "celular")
    assert telefono_co("(604) 444-5566") == ("6044445566", "fijo")
    assert telefono_co("0057 315 000 1122") == ("3150001122", "celular")
    assert telefono_co("444 5566") is None          # fijo sin indicativo: ambiguo
    assert telefono_co("1-800-555-0199") is None
    assert link_whatsapp("300 123 4567") == "https://wa.me/573001234567"
    assert link_whatsapp("604 444 5566") is None     # fijo: sin WhatsApp


def test_emails():
    assert email_valido("mailto:Info@Empresa.co?subject=hola") == "info@empresa.co"
    assert email_valido("logo@2x.png") is None
    assert email_valido("usuario@example.com") is None
    assert email_valido("no-es-correo") is None


HTML_SITIO = """
<html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"ProfessionalService","name":"Agencia Brillo SAS",
 "telephone":"+57 604 321 0000","email":"hola@brillo.co","url":"https://brillo.co",
 "address":{"streetAddress":"Cra 43A #1-50","addressLocality":"Medellín"},
 "founder":{"@type":"Person","name":"Laura Gómez","jobTitle":"CEO"},
 "sameAs":["https://www.instagram.com/agenciabrillo/","https://www.linkedin.com/company/brillo"]}
</script></head><body>
<a href="https://wa.me/573104445566">Escríbenos</a>
<a href="/contactenos">Contacto</a>
<a href="https://www.facebook.com/sharer/sharer.php?u=x">compartir</a>
<p>Ventas: ventas@brillo.co · Tel 311 222 3344</p>
<span data-cfemail="543c3b38351436263d3838357a373b">[email protected]</span>
</body></html>
"""


def test_extraer_sitio_completo():
    p = Prospecto(nombre="Brillo")
    internos = extraer_contactos(HTML_SITIO, "https://brillo.co/", p, "web")
    assert p.telefonos[0].startswith("3")             # celulares primero
    assert set(p.telefonos) == {"3104445566", "3112223344", "6043210000"}
    assert "hola@brillo.co" in p.emails and "ventas@brillo.co" in p.emails
    assert p.redes["instagram"].startswith("https://www.instagram.com/agenciabrillo")
    assert "facebook" not in p.redes                   # enlaces de "compartir" no cuentan
    assert p.contacto_dueno["nombre"] == "Laura Gómez"
    assert p.direccion.startswith("Cra 43A")
    assert internos == ["https://brillo.co/contactenos"]


def test_ficha_google_maps():
    html = """<html><body><h1>Clínica Dental Sonríe</h1>
    <button jsaction="pane.rating.category">Odontólogo</button>
    <span aria-label="4,7 estrellas"></span><span aria-label="38 reseñas"></span>
    <button data-item-id="address" aria-label="Dirección: Cl. 10 #40-20, El Poblado, Medellín"></button>
    <button data-item-id="phone:tel:3009998877"></button>
    </body></html>"""
    p = _leer_ficha(html, "https://www.google.com/maps/place/x?hl=es", "Medellín")
    assert p.nombre == "Clínica Dental Sonríe"
    assert p.telefonos == ["3009998877"]
    assert p.resenas == 38 and p.calificacion == 4.7
    assert p.direccion.startswith("Cl. 10")
    assert p.web is None
    assert p.fuentes == ["google_maps"]


def test_fusion_y_puntaje():
    a = Prospecto(nombre="Clínica Sonríe", telefonos=["3009998877"], resenas=38, categoria="Odontólogo")
    a.fuentes = ["google_maps"]
    b = Prospecto(nombre="Clinica Sonrie SAS")
    b.agregar_telefono("300 999 8877")
    b.agregar_email("citas@sonrie.co")
    b.fuentes = ["directorio"]
    unidos = fusionar_duplicados([a, b])
    assert len(unidos) == 1
    p = unidos[0]
    assert p.emails == ["citas@sonrie.co"] and set(p.fuentes) == {"google_maps", "directorio"}
    puntos, detalle = calcular(p, "Clínica odontológica")
    # celular 30 + correo 20 + sin web 10 + pocas reseñas 10 + servicios 10
    assert puntos == 80, detalle
    fila = a_fila(p, {"id": "b1", "tipo_negocio": "Clínica odontológica", "ciudad": "Medellín",
                       "con_website": "indiferente", "servicio": "contabilidad"})
    assert fila["telefono"] == "+57 300 999 8877"
    assert fila["datos"]["whatsapp"] == "https://wa.me/573009998877"
    assert fila["origen"] == "scraping" and fila["puntaje"] == 80
