'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/components/erp/api';
import { useToast } from '@/components/erp/toast';
import {
  useTheme,
  Card,
  Btn,
  Input,
  Select,
  Badge,
  Modal,
  EmptyState,
} from '@/components/erp/ui';

interface LinkAgenda {
  id: string;
  usuario_id: string;
  slug: string;
  titulo: string;
  servicio: string;
  duracion_minutos: number;
  activo: boolean;
  created_at: string;
  citas_count: number;
  usuarios?: {
    id: string;
    nombre: string;
    email: string;
  } | null;
}

interface Props {
  esAdmin?: boolean;
}

const SERVICIOS = [
  { value: 'general', label: 'Asesoría General' },
  { value: 'renta', label: 'Declaración de Renta' },
  { value: 'contabilidad', label: 'Contabilidad' },
  { value: 'nomina', label: 'Nómina' },
];

const DURACIONES = [
  { value: '15', label: '15 minutos' },
  { value: '30', label: '30 minutos' },
  { value: '45', label: '45 minutos' },
  { value: '60', label: '60 minutos' },
];

export default function LinksAgendaPanel({ esAdmin = false }: Props) {
  const t = useTheme();
  const toast = useToast();

  const [links, setLinks] = useState<LinkAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [verTodos, setVerTodos] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Formulario nuevo link
  const [titulo, setTitulo] = useState('');
  const [servicio, setServicio] = useState('general');
  const [duracion, setDuracion] = useState('30');
  const [slug, setSlug] = useState('');
  const [activo, setActivo] = useState(true);

  const cargarLinks = useCallback(async (mostrarLoader = false) => {
    if (mostrarLoader) setLoading(true);
    try {
      const q = verTodos && esAdmin ? '?todos=true' : '';
      const res = await api<{ items: LinkAgenda[] }>(`/api/erp/links-agenda${q}`);
      setLinks(res.items || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar links';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [verTodos, esAdmin, toast]);

  useEffect(() => {
    let cancelado = false;
    const q = verTodos && esAdmin ? '?todos=true' : '';
    api<{ items: LinkAgenda[] }>(`/api/erp/links-agenda${q}`)
      .then((res) => {
        if (!cancelado) setLinks(res.items || []);
      })
      .catch((e: unknown) => {
        if (!cancelado) {
          const msg = e instanceof Error ? e.message : 'Error al cargar links';
          toast(msg, 'error');
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [verTodos, esAdmin, toast]);

  const abrirCrear = () => {
    setTitulo('');
    setServicio('general');
    setDuracion('30');
    setSlug('');
    setActivo(true);
    setModalAbierto(true);
  };

  const guardarLink = async () => {
    if (!titulo.trim()) {
      toast('El título es requerido', 'error');
      return;
    }
    setGuardando(true);
    try {
      await api('/api/erp/links-agenda', {
        method: 'POST',
        body: JSON.stringify({
          titulo: titulo.trim(),
          servicio,
          duracion_minutos: parseInt(duracion, 10),
          slug: slug.trim() || undefined,
          activo,
        }),
      });
      toast('Link de agenda creado con éxito', 'ok');
      setModalAbierto(false);
      cargarLinks(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al crear link';
      toast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (link: LinkAgenda) => {
    try {
      await api(`/api/erp/links-agenda/${link.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !link.activo }),
      });
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, activo: !link.activo } : l))
      );
      toast(`Link ${!link.activo ? 'activado' : 'desactivado'}`, 'ok');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al actualizar';
      toast(msg, 'error');
    }
  };

  const copiarUrl = (slugLink: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/agenda/${slugLink}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast('Enlace copiado al portapapeles', 'ok');
    } else {
      toast(url, 'ok');
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {esAdmin && (
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontFamily: 'var(--mono)',
                color: t.subtext,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={verTodos}
                onChange={(e) => setVerTodos(e.target.checked)}
                style={{ accentColor: t.sky }}
              />
              Ver links de todos los usuarios
            </label>
          )}
        </div>
        <Btn onClick={abrirCrear} variant="primary">
          + Crear link de agenda
        </Btn>
      </div>

      {loading ? (
        <Card>
          <div style={{ padding: 32, textAlign: 'center', color: t.subtext }}>
            Cargando links de agenda…
          </div>
        </Card>
      ) : links.length === 0 ? (
        <EmptyState
          title="No hay links de agenda creados"
          description="Crea tu primer link de agenda para compartir con clientes y permitirles agendar citas en tus horarios disponibles."
          actionLabel="+ Crear mi primer link"
          onAction={abrirCrear}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {links.map((link) => {
            return (
              <Card key={link.id} style={{ padding: 18 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: t.text,
                        }}
                      >
                        {link.titulo}
                      </span>
                      <Badge tone="gray">{link.servicio}</Badge>
                      <Badge tone="sky">{link.duracion_minutos} min</Badge>
                      {!link.activo && <Badge tone="red">Inactivo</Badge>}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 12,
                        fontSize: 12,
                        fontFamily: 'var(--mono)',
                        color: t.subtext,
                        marginTop: 6,
                      }}
                    >
                      <span>
                        URL: <code style={{ color: t.sky }}>/agenda/{link.slug}</code>
                      </span>
                      <span>·</span>
                      <span>
                        Citas agendadas:{' '}
                        <strong style={{ color: t.text }}>{link.citas_count}</strong>
                      </span>
                      {link.usuarios && (
                        <>
                          <span>·</span>
                          <span>Usuario: {link.usuarios.nombre}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Btn
                      onClick={() => copiarUrl(link.slug)}
                      variant="ghost"
                      style={{ fontSize: 11, padding: '7px 12px' }}
                    >
                      Copiar link
                    </Btn>
                    <a
                      href={`/agenda/${link.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '7px 12px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: t.text,
                        fontSize: 11,
                        fontFamily: 'var(--mono)',
                        textDecoration: 'none',
                      }}
                    >
                      Abrir ↗
                    </a>
                    <Btn
                      onClick={() => toggleActivo(link)}
                      variant={link.activo ? 'ghost' : 'primary'}
                      style={{ fontSize: 11, padding: '7px 12px' }}
                    >
                      {link.activo ? 'Pausar' : 'Activar'}
                    </Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalAbierto}
        title="Crear link de agenda"
        onClose={() => !guardando && setModalAbierto(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontFamily: 'var(--mono)',
                color: t.subtext,
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              Título del link *
            </label>
            <Input
              placeholder="Ej. Asesoría Declaración de Renta 2026"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: 'var(--mono)',
                  color: t.subtext,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                Servicio
              </label>
              <Select
                value={servicio}
                onChange={(e) => setServicio(e.target.value)}
                options={SERVICIOS.map((s) => [s.value, s.label])}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: 'var(--mono)',
                  color: t.subtext,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                Duración
              </label>
              <Select
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                options={DURACIONES.map((d) => [d.value, d.label])}
              />
            </div>
          </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: 'var(--mono)',
                  color: t.subtext,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                Slug personalizado (opcional)
              </label>
              <Input
                placeholder="mi-asesoria-personalizada"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <span style={{ fontSize: 10, color: t.subtext, marginTop: 4, display: 'block' }}>
                Si se deja vacío, se generará uno automáticamente.
              </span>
            </div>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: t.text,
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                style={{ accentColor: t.sky }}
              />
              Link activo y disponible para reservas
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 12,
              }}
            >
              <Btn
                onClick={() => setModalAbierto(false)}
                variant="ghost"
                disabled={guardando}
              >
                Cancelar
              </Btn>
              <Btn onClick={guardarLink} variant="primary" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Crear link'}
              </Btn>
            </div>
          </div>
        </Modal>
    </div>
  );
}
