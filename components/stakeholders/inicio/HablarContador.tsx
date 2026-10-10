'use client';

/* Formulario de agendamiento "Hablar con un contador" del inicio.
   Va a /api/diagnostico con servicio 'inicio' y el servicio de interés. */

import { useEffect, useRef, useState } from 'react';

export type Interes = 'contabilidad' | 'nomina' | 'renta' | 'personalizado' | 'otro';

const INTERESES: Array<{ id: Interes; t: string }> = [
  { id: 'contabilidad', t: 'Contabilidad' },
  { id: 'nomina', t: 'Nómina' },
  { id: 'renta', t: 'Renta persona natural' },
  { id: 'personalizado', t: 'Servicio personalizado' },
  { id: 'otro', t: 'Aún no lo sé' },
];

type Modalidad = 'virtual' | 'presencial';

export function HablarContador({ abierto, onCerrar, interes }: { abierto: boolean; onCerrar: () => void; interes?: Interes }) {
  if (!abierto) return null;
  return <Formulario onCerrar={onCerrar} interesInicial={interes ?? 'otro'} />;
}

function Formulario({ onCerrar, interesInicial }: { onCerrar: () => void; interesInicial: Interes }) {
  const primero = useRef<HTMLInputElement>(null);
  const [interes, setInteres] = useState<Interes>(interesInicial);
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [correo, setCorreo] = useState('');
  const [modalidad, setModalidad] = useState<Modalidad>('virtual');
  const [direccion, setDireccion] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    primero.current?.focus();
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previo; };
  }, []);

  const esPersona = interes === 'renta';

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim() || !whatsapp.trim() || !correo.trim() || (!esPersona && !empresa.trim())) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }
    if (modalidad === 'presencial' && !direccion.trim()) {
      setError('La dirección de tu oficina es obligatoria.');
      return;
    }
    if (!fechaHora.trim()) {
      setError('Por favor indica tu fecha y hora preferida.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/diagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicio: 'inicio',
          interes,
          nombre: nombre.trim(),
          empresa: empresa.trim() || 'Persona natural',
          whatsapp: whatsapp.trim(),
          correo: correo.trim(),
          mensaje: mensaje.trim(),
          modalidad,
          direccion: modalidad === 'presencial' ? direccion.trim() : '',
          fecha: fechaHora.trim(),
          hora: 'Preferida',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al procesar la solicitud.');
      }
      setEnviado(true);
    } catch (err: unknown) {
      setError((err instanceof Error && err.message) || 'Error de conexión.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="hz-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hz-modal-titulo"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onCerrar(); } }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="hz-modal__caja diagnostic-box">
        <button type="button" className="hz-modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <h2 id="hz-modal-titulo">Habla con un contador</h2>
        <p className="hz-modal__sub">Agenda tu cita y un contador de nuestro equipo te atenderá.</p>

        {enviado ? (
          <div className="hz-modal__ok">
            <p>Solicitud enviada. Nos pondremos en contacto contigo para confirmar tu cita.</p>
            <button type="button" className="hz-cta" onClick={onCerrar}>Volver al inicio</button>
          </div>
        ) : (
          <form onSubmit={enviar} className="diagnostic-form hz-modal__form">
            <div>
              <span className="fld-label" id="hz-f-interes">¿Qué servicio te interesa?</span>
              <div className="hz-modal__chips" role="radiogroup" aria-labelledby="hz-f-interes">
                {INTERESES.map((it) => (
                  <button key={it.id} type="button" role="radio" aria-checked={interes === it.id} className={`modalidad-btn ${interes === it.id ? 'active' : ''}`} onClick={() => setInteres(it.id)}>
                    {it.t}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-row-2">
              <div>
                <label className="fld-label" htmlFor="hz-f-nombre">Nombre</label>
                <input ref={primero} id="hz-f-nombre" type="text" className="fld-input" required autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div>
                <label className="fld-label" htmlFor="hz-f-empresa">{esPersona ? 'Empresa (opcional)' : 'Empresa'}</label>
                <input id="hz-f-empresa" type="text" className="fld-input" required={!esPersona} autoComplete="organization" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
              </div>
            </div>
            <div className="form-row-2">
              <div>
                <label className="fld-label" htmlFor="hz-f-whatsapp">WhatsApp</label>
                <input id="hz-f-whatsapp" type="tel" className="fld-input" required autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>
              <div>
                <label className="fld-label" htmlFor="hz-f-correo">Correo</label>
                <input id="hz-f-correo" type="email" className="fld-input" required autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
              </div>
            </div>
            <div>
              <span className="fld-label">Modalidad</span>
              <div className="modalidad-group">
                <button type="button" className={`modalidad-btn ${modalidad === 'virtual' ? 'active' : ''}`} onClick={() => setModalidad('virtual')}>Virtual (Google Meet)</button>
                <button type="button" className={`modalidad-btn ${modalidad === 'presencial' ? 'active' : ''}`} onClick={() => setModalidad('presencial')}>Presencial (Medellín)</button>
              </div>
            </div>
            {modalidad === 'presencial' && (
              <div>
                <label className="fld-label" htmlFor="hz-f-direccion">Dirección de tu oficina</label>
                <input id="hz-f-direccion" type="text" className="fld-input" required value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                <p className="fld-note">Stakeholders no tiene sede propia; la reunión presencial es en la oficina del cliente.</p>
              </div>
            )}
            <div>
              <label className="fld-label" htmlFor="hz-f-fecha">Fecha y hora preferida</label>
              <input id="hz-f-fecha" type="text" className="fld-input" required placeholder="Ej.: martes en la mañana" value={fechaHora} onChange={(e) => setFechaHora(e.target.value)} />
            </div>
            <div>
              <label className="fld-label" htmlFor="hz-f-mensaje">¿Algo más que debamos saber? (opcional)</label>
              <textarea id="hz-f-mensaje" className="fld-input" rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
            </div>
            {error && <p className="hz-modal__error" role="alert">{error}</p>}
            <button type="submit" disabled={enviando} className="hz-cta hz-modal__enviar">
              {enviando ? 'Enviando…' : 'Agendar mi cita'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
