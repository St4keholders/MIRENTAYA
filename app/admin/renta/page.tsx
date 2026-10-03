'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CalculadoraComisiones from '@/components/stakeholders/CalculadoraComisiones';
import '@/app/stakeholders.css';

/* ── Interfaces ─────────────────────────────────────────────────────── */
interface UserSession {
  id: string;
  nombre: string;
  email: string;
  rol: 'desarrollador' | 'contador' | 'admin' | 'vendedor' | 'referido';
  referral_slug?: string;
}

interface UsuarioData {
  id: string;
  nombre: string;
  email: string;
  rol: 'desarrollador' | 'contador' | 'admin' | 'vendedor' | 'referido';
  activo: boolean;
  created_at: string;
  referral_slug?: string;
}

interface LeadData {
  id: string;
  slug_publico: string;
  nombre: string;
  cedula: string;
  edad: number;
  ocupacion: string;
  celular: string;
  correo?: string;
  debe_declarar: boolean;
  topes_superados: string[];
  barra_patrimonio: number;
  barra_ingresos: number;
  barra_creditos: number;
  barra_movimientos: number;
  fecha_vencimiento: string;
  extemporaneo: boolean;
  estado: 'nuevo' | 'contactado' | 'agendado' | 'perdido';
  pagado?: boolean;
  etapa?: 'consultoria' | 'documentos' | 'anticipo' | 'declaracion' | 'entrega';
  valor_declaracion?: number;
  source?: string;
  created_at: string;
  contador_id?: string;
  referrer_id?: string;
  seller_id?: string;
  arquetipos?: { nombre: string; slug: string };
  contador?: { id: string; nombre: string; email: string };
  referido?: { id: string; nombre: string; email: string; referral_slug?: string };
  vendedor?: { id: string; nombre: string; email: string };
  respuestas?: Array<{ payload: Record<string, any>; version_motor: string; created_at: string }>;
  ventas?: Array<{ id: string; medio_contacto?: string; fecha_consulta?: string; estado?: string }>;
  orders?: Array<{ id: string; reference: string; status: string; amount_in_cents: number; created_at: string }>;
}

interface VentasReporte {
  resumen: {
    totalVentasBrutas: number;
    totalCostosComisiones: number;
    totalUtilidadPlataforma: number;
    totalComisionesContadores: number;
    totalComisionesVendedores: number;
    totalComisionesReferidos: number;
    totalDesarrollo: number;
    totalVentasConfirmadas: number;
  };
  ventas: Array<{
    id: string;
    nombre: string;
    cedula: string;
    source: string;
    valorDeclaracion: number;
    valorConsultoria: number;
    totalVentaCliente: number;
    contadorNombre: string;
    referidoNombre: string;
    vendedorNombre: string;
    amtContador: number;
    amtReferido: number;
    amtVendedor: number;
    amtDesarrollo: number;
    amtPlataforma: number;
  }>;
}

/* Format COP Currency */
const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);

/* Trash Icon */
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export default function AdminRentaArchivoPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* Auth & Tabs */
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'crm' | 'leads' | 'usuarios' | 'ventas' | 'links' | 'calculadora'>('crm');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  /* Global Loading Indicator */
  const [globalLoading, setGlobalLoading] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>('Cargando sistema...');

  /* Data States */
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);
  const [reporteVentas, setReporteVentas] = useState<VentasReporte | null>(null);

  /* Filters */
  const [filterArquetipo, setFilterArquetipo] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');

  /* Modals */
  const [selectedRespuestasLead, setSelectedRespuestasLead] = useState<LeadData | null>(null);
  const [editingLead, setEditingLead] = useState<LeadData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedLinkText, setCopiedLinkText] = useState<string | null>(null);

  /* Form Edit Lead state */
  const [editNombre, setEditNombre] = useState('');
  const [editCedula, setEditCedula] = useState('');
  const [editEdad, setEditEdad] = useState(28);
  const [editCelular, setEditCelular] = useState('');
  const [editCorreo, setEditCorreo] = useState('');
  const [editEstado, setEditEstado] = useState<'nuevo' | 'contactado' | 'agendado' | 'perdido'>('nuevo');
  const [editPagado, setEditPagado] = useState(false);
  const [editEtapa, setEditEtapa] = useState<'consultoria' | 'documentos' | 'anticipo' | 'declaracion' | 'entrega'>('consultoria');
  const [editValorDeclaracion, setEditValorDeclaracion] = useState(0);

  /* Form Nuevo Usuario */
  const [newUserNombre, setNewUserNombre] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRol, setNewUserRol] = useState<'admin' | 'contador' | 'vendedor' | 'referido'>('contador');
  const [userMsg, setUserMsg] = useState<{ text: string; error?: boolean } | null>(null);

  /* Roles Helper Flags */
  const role = currentUser?.rol || 'admin';
  const isDevOrAdmin = role === 'desarrollador' || role === 'admin';
  const isContador = role === 'contador';
  const isVendedor = role === 'vendedor';
  const isReferido = role === 'referido';

  /* Theme Tokens */
  const isDark = theme === 'dark';
  const t = {
    bg: isDark ? '#000000' : '#F8FAFC',
    text: isDark ? '#FFFFFF' : '#0F172A',
    subtext: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    sidebarBg: isDark ? 'rgba(10,10,14,0.75)' : '#FFFFFF',
    tableHeaderBg: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
    tableHeaderColor: isDark ? 'rgba(255,255,255,0.5)' : '#475569',
    tableRowBorder: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    inputBg: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
    inputBorder: isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1',
    inputColor: isDark ? '#FFFFFF' : '#0F172A',
    modalBg: isDark ? '#101014' : '#FFFFFF',
  };

  /* Check User session on load */
  useEffect(() => {
    const raw = localStorage.getItem('stakeholders_user');
    if (raw) {
      try {
        const parsed: UserSession = JSON.parse(raw);
        setCurrentUser(parsed);
      } catch {
        localStorage.removeItem('stakeholders_user');
        router.replace('/admin/login');
      }
    } else {
      router.replace('/admin/login');
    }
  }, []);

  /* Star Canvas background */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars: Array<{ x: number; y: number; r: number; a: number; t: number }> = [];
    let w = 0, h = 0, dpr = 1, raf: number | null = null;
    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 12000);
      stars = Array.from({ length: Math.min(n, 260) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() < 0.88 ? Math.random() * 0.7 + 0.25 : Math.random() * 1.1 + 0.8,
        a: Math.random() * 0.45 + 0.08, t: Math.random() * Math.PI * 2,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      if (!isDark) return;
      const time = performance.now() / 2600;
      for (const st of stars) {
        ctx.globalAlpha = st.a * (REDUCE ? 1 : 0.7 + 0.3 * Math.sin(time + st.t));
        ctx.fillStyle = st.r > 0.9 ? '#BFD4FF' : '#FFFFFF';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    build(); REDUCE ? draw() : loop();
    const onR = () => build();
    window.addEventListener('resize', onR, { passive: true });
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', onR); };
  }, [isDark]);

  /* Fetch Data */
  const loadData = async (msg = 'Cargando datos...') => {
    setLoadingText(msg);
    setGlobalLoading(true);
    try {
      const [resLeads, resUsuarios, resVentas] = await Promise.all([
        fetch('/api/admin/leads'),
        fetch('/api/admin/usuarios'),
        fetch('/api/admin/ventas'),
      ]);

      const dataLeads = await resLeads.json();
      const dataUsuarios = await resUsuarios.json();
      const dataVentas = await resVentas.json();

      if (dataLeads.leads) setLeads(dataLeads.leads);
      if (dataUsuarios.usuarios) setUsuarios(dataUsuarios.usuarios);
      if (!dataVentas.error) setReporteVentas(dataVentas);
    } catch (error) {
      console.error('Error cargando información:', error);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) loadData();
  }, [currentUser]);

  /* Actions */
  const handleLogout = () => {
    localStorage.removeItem('stakeholders_user');
    router.push('/admin/login');
  };

  const handleUpdateAssignment = async (leadId: string, field: 'contador_id' | 'referrer_id' | 'seller_id' | 'source', value: string | null) => {
    setLoadingText('Actualizando asignación...');
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, [field]: value }),
      });
      if (res.ok) {
        await loadData('Asignación guardada');
      }
    } catch (err) {
      console.error('Error asignando:', err);
      setGlobalLoading(false);
    }
  };

  const handleUpdateEtapaLead = async (leadId: string, etapa: string) => {
    setLoadingText('Actualizando etapa...');
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, etapa }),
      });
      if (res.ok) {
        await loadData('Etapa actualizada');
      }
    } catch (err) {
      console.error('Error actualizando etapa:', err);
      setGlobalLoading(false);
    }
  };

  const handleUpdatePagadoLead = async (leadId: string, pagado: boolean) => {
    setLoadingText('Actualizando estado de pago...');
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, pagado }),
      });
      if (res.ok) {
        await loadData('Estado de pago actualizado');
      }
    } catch (err) {
      console.error('Error actualizando pago:', err);
      setGlobalLoading(false);
    }
  };

  const handleRemoveFromCRM = async (leadId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este cliente?')) return;
    setLoadingText('Eliminando cliente...');
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId }),
      });
      if (res.ok) {
        await loadData('Cliente eliminado');
      }
    } catch (err) {
      console.error('Error eliminando lead:', err);
      setGlobalLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg(null);
    if (!newUserNombre || !newUserEmail || !newUserPassword) {
      setUserMsg({ text: 'Completa todos los campos obligatorios', error: true });
      return;
    }
    setLoadingText('Creando nuevo usuario...');
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newUserNombre,
          email: newUserEmail,
          password: newUserPassword,
          rol: newUserRol,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserMsg({ text: data.error || 'Error al crear usuario', error: true });
      } else {
        setUserMsg({ text: '✅ Usuario creado con éxito' });
        setNewUserNombre('');
        setNewUserEmail('');
        setNewUserPassword('');
        await loadData('Usuario agregado');
      }
    } catch (err) {
      console.error('Error creando usuario:', err);
      setUserMsg({ text: 'Error de conexión', error: true });
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleUpdateLeadValorDeclaracion = async (leadId: string, val: number) => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, valor_declaracion: val }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Error actualizando valor declaración:', err);
    }
  };

  const handleOpenEditLead = (lead: LeadData) => {
    setEditingLead(lead);
    setEditNombre(lead.nombre);
    setEditCedula(lead.cedula);
    setEditEdad(lead.edad);
    setEditCelular(lead.celular || '');
    setEditCorreo(lead.correo || '');
    setEditEstado(lead.estado);
    setEditPagado(Boolean(lead.pagado));
    setEditEtapa(lead.etapa || 'consultoria');
    setEditValorDeclaracion(lead.valor_declaracion || 0);
  };

  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setLoadingText('Guardando cambios...');
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLead.id,
          nombre: editNombre,
          cedula: editCedula,
          edad: editEdad,
          celular: editCelular,
          correo: editCorreo,
          estado: editEstado,
          pagado: editPagado,
          etapa: editEtapa,
          valor_declaracion: editValorDeclaracion,
        }),
      });
      if (res.ok) {
        setEditingLead(null);
        await loadData('Cambios guardados');
      }
    } catch (err) {
      console.error('Error editando lead:', err);
      setGlobalLoading(false);
    }
  };

  /* Filter Logic based on user role */
  const crmLeads = leads.filter((lead) => {
    if (!lead.pagado) return false;
    if (isDevOrAdmin) return true;
    if (isContador) return lead.contador_id === currentUser?.id;
    if (isVendedor) return lead.seller_id === currentUser?.id || lead.referrer_id === currentUser?.id;
    if (isReferido) return lead.referrer_id === currentUser?.id;
    return false;
  });

  const finalCrmLeads = crmLeads.filter((lead) => {
    if (filterArquetipo !== 'todos' && lead.arquetipos?.slug !== filterArquetipo) return false;
    if (filterEstado !== 'todos' && lead.estado !== filterEstado) return false;
    return true;
  });

  const finalAllLeads = leads.filter((lead) => {
    if (filterArquetipo !== 'todos' && lead.arquetipos?.slug !== filterArquetipo) return false;
    if (filterEstado !== 'todos' && lead.estado !== filterEstado) return false;
    return true;
  });

  /* Personal Sales & Commissions filtering for non-admins */
  const misVentasDetalle = (reporteVentas?.ventas || []).filter((v) => {
    if (isDevOrAdmin) return true;
    const lead = leads.find((l) => l.id === v.id);
    if (isContador) return lead?.contador_id === currentUser?.id;
    if (isVendedor) return lead?.seller_id === currentUser?.id || lead?.referrer_id === currentUser?.id;
    if (isReferido) return lead?.referrer_id === currentUser?.id;
    return false;
  });

  const miComisionTotalCalculada = misVentasDetalle.reduce((sum, v) => {
    const lead = leads.find((l) => l.id === v.id);
    if (isContador || lead?.contador_id === currentUser?.id) return sum + v.amtContador;
    if (lead?.seller_id === currentUser?.id) return sum + v.amtVendedor;
    if (lead?.referrer_id === currentUser?.id) return sum + v.amtReferido;
    return sum + (isDevOrAdmin ? v.amtPlataforma : 0);
  }, 0);

  /* Calculate user referral links */
  const userSlug = currentUser?.referral_slug || currentUser?.nombre?.toLowerCase().replace(/[^a-z0-9]/g, '') || currentUser?.id.substring(0, 6);
  const testLink = typeof window !== 'undefined' ? `${window.location.origin}/test?ref=${userSlug}` : `https://mirentaya.co/test?ref=${userSlug}`;
  const agendarLink = typeof window !== 'undefined' ? `${window.location.origin}/agendar?ref=${userSlug}` : `https://mirentaya.co/agendar?ref=${userSlug}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLinkText(label);
    setTimeout(() => setCopiedLinkText(null), 3000);
  };

  const renderEtapaBadge = (etapa?: string) => {
    const map: Record<string, string> = {
      consultoria: '01. Consultoría ($100k)',
      documentos: '02. Documentos',
      anticipo: '03. Anticipo (50%)',
      declaracion: '04. Declaración',
      entrega: '05. Entrega Final',
    };
    return (
      <span style={{
        padding: '4px 10px', borderRadius: 8, background: 'rgba(78,214,161,0.15)',
        border: '1px solid rgba(78,214,161,0.3)', color: isDark ? '#4ED6A1' : '#16A34A',
        fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600,
      }}>
        {map[etapa || 'consultoria'] || '01. Consultoría ($100k)'}
      </span>
    );
  };

  const renderMedioContacto = (lead: LeadData) => {
    const medio = lead.ventas?.[0]?.medio_contacto;
    if (!medio) return <span style={{ fontSize: 11, color: t.subtext }}>Sin especificar</span>;
    if (medio === 'videollamada') return <span style={{ fontSize: 11, color: '#7DD3FC', fontWeight: 600 }}>Videollamada</span>;
    if (medio === 'whatsapp') return <span style={{ fontSize: 11, color: '#4ED6A1', fontWeight: 600 }}>WhatsApp</span>;
    return <span style={{ fontSize: 11, color: '#FBBF24', fontWeight: 600 }}>Llamada</span>;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, color: t.text, position: 'relative', overflowX: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Global Loading Indicator ── */}
      {globalLoading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 4, zIndex: 9999,
          background: 'linear-gradient(90deg, #3D6BFF, #4ED6A1, #7DD3FC)',
          backgroundSize: '200% 100%', animation: 'loadingBar 1.5s infinite linear',
        }}>
          <style>{`
            @keyframes loadingBar {
              0% { background-position: 0% 0%; }
              100% { background-position: 200% 0%; }
            }
          `}</style>
        </div>
      )}

      {/* ── SIDEBAR NAV ── */}
      <aside
        style={{
          width: 220, position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
          background: t.sidebarBg, backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', transition: 'transform 0.3s ease',
        }}
        className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}
      >
        <div>
          {/* Brand */}
          <div style={{ padding: '24px 20px', borderBottom: `1px solid ${t.border}` }}>
            <Link href="/" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: t.text, textDecoration: 'none', letterSpacing: '-.03em' }}>
              STAKEHOLDERS<span style={{ color: '#3D6BFF' }}>.</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: 999,
                background: isDevOrAdmin ? 'rgba(61,107,255,0.15)' : 'rgba(78,214,161,0.15)',
                color: isDevOrAdmin ? (isDark ? '#7DD3FC' : '#0284C7') : (isDark ? '#4ED6A1' : '#16A34A'),
                border: `1px solid ${isDevOrAdmin ? 'rgba(61,107,255,0.4)' : 'rgba(78,214,161,0.4)'}`,
              }}>
                {currentUser?.rol || 'Admin'}
              </span>
              <span style={{ fontSize: 11, color: t.subtext, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.nombre}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* 1. CRM */}
            <button
              onClick={() => { setActiveTab('crm'); setMobileMenuOpen(false); }}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all .2s',
                background: activeTab === 'crm' ? 'rgba(61,107,255,0.18)' : 'transparent',
                border: activeTab === 'crm' ? '1px solid rgba(61,107,255,0.5)' : '1px solid transparent',
                color: activeTab === 'crm' ? t.text : t.subtext,
              }}
            >
              CRM
              <span style={{ fontSize: 10, opacity: 0.7, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 999 }}>
                {crmLeads.length}
              </span>
            </button>

            {/* 2. VENTAS */}
            <button
              onClick={() => { setActiveTab('ventas'); setMobileMenuOpen(false); }}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all .2s',
                background: activeTab === 'ventas' ? 'rgba(61,107,255,0.18)' : 'transparent',
                border: activeTab === 'ventas' ? '1px solid rgba(61,107,255,0.5)' : '1px solid transparent',
                color: activeTab === 'ventas' ? t.text : t.subtext,
              }}
            >
              VENTAS
            </button>

            {/* 3. REFERIDOS */}
            {(isReferido || isVendedor || isDevOrAdmin) && (
              <button
                onClick={() => { setActiveTab('links'); setMobileMenuOpen(false); }}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                  fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all .2s',
                  background: activeTab === 'links' ? 'rgba(61,107,255,0.18)' : 'transparent',
                  border: activeTab === 'links' ? '1px solid rgba(61,107,255,0.5)' : '1px solid transparent',
                  color: activeTab === 'links' ? t.text : t.subtext,
                }}
              >
                REFERIDOS
              </button>
            )}

            {/* 4. MARGENES */}
            <button
              onClick={() => { setActiveTab('calculadora'); setMobileMenuOpen(false); }}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all .2s',
                background: activeTab === 'calculadora' ? 'rgba(61,107,255,0.18)' : 'transparent',
                border: activeTab === 'calculadora' ? '1px solid rgba(61,107,255,0.5)' : '1px solid transparent',
                color: activeTab === 'calculadora' ? t.text : t.subtext,
              }}
            >
              MARGENES
            </button>

            {/* 5. USUARIOS */}
            {isDevOrAdmin && (
              <button
                onClick={() => { setActiveTab('usuarios'); setMobileMenuOpen(false); }}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                  fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all .2s',
                  background: activeTab === 'usuarios' ? 'rgba(61,107,255,0.18)' : 'transparent',
                  border: activeTab === 'usuarios' ? '1px solid rgba(61,107,255,0.5)' : '1px solid transparent',
                  color: activeTab === 'usuarios' ? t.text : t.subtext,
                }}
              >
                USUARIOS
                <span style={{ fontSize: 10, opacity: 0.7, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 999 }}>
                  {usuarios.length}
                </span>
              </button>
            )}

            {/* 6. LEADS */}
            {(isDevOrAdmin || isContador) && (
              <button
                onClick={() => { setActiveTab('leads'); setMobileMenuOpen(false); }}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                  fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all .2s',
                  background: activeTab === 'leads' ? 'rgba(61,107,255,0.18)' : 'transparent',
                  border: activeTab === 'leads' ? '1px solid rgba(61,107,255,0.5)' : '1px solid transparent',
                  color: activeTab === 'leads' ? t.text : t.subtext,
                }}
              >
                LEADS
                <span style={{ fontSize: 10, opacity: 0.7, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 999 }}>
                  {leads.length}
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* Logout */}
        <div style={{ padding: '16px 16px 24px', borderTop: `1px solid ${t.border}` }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)',
              color: '#FF8080', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.12em',
              textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center',
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{ flex: 1, marginLeft: 220, minHeight: '100vh', position: 'relative', zIndex: 10, padding: '32px clamp(16px,4vw,40px)' }} className="admin-main">

        {/* Mobile Header Bar */}
        <header className="mobile-header" style={{
          display: 'none', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: t.sidebarBg, backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 40, margin: '-32px -16px 24px',
        }}>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: t.text, fontSize: 22, cursor: 'pointer' }}>
            ☰
          </button>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16 }}>
            STAKEHOLDERS <span style={{ color: '#3D6BFF' }}>/</span> {activeTab.toUpperCase()}
          </span>
          <span style={{ width: 22 }} />
        </header>

        {/* Top Bar with Theme Switcher */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#3D6BFF', display: 'block', marginBottom: 4 }}>
              Archivo · Temporada de renta 2026 · <Link href="/admin/dashboard" style={{ color: '#3D6BFF', textDecoration: 'underline' }}>Volver al ERP</Link>
            </span>
            <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.2rem)', margin: 0, letterSpacing: '-.04em', color: t.text }}>
              {activeTab === 'crm' && 'CRM — Clientes Pagados'}
              {activeTab === 'ventas' && (isDevOrAdmin ? 'Reporte de Ventas & Finanzas' : 'Mis Ventas & Comisiones')}
              {activeTab === 'links' && 'Mis Links de Referidos'}
              {activeTab === 'calculadora' && 'Calculadora de Comisiones'}
              {activeTab === 'leads' && 'Todos los Leads Registrados'}
              {activeTab === 'usuarios' && 'Usuarios y Permisos'}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              style={{
                padding: '8px 14px', borderRadius: 999,
                background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                color: t.text, fontFamily: 'var(--mono)', fontSize: 11,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'all .2s',
              }}
            >
              {isDark ? 'Modo Claro ☀️' : 'Modo Oscuro 🌙'}
            </button>

            {/* Filters */}
            {(activeTab === 'crm' || activeTab === 'leads') && (
              <>
                <select
                  value={filterArquetipo}
                  onChange={(e) => setFilterArquetipo(e.target.value)}
                  style={{
                    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    borderRadius: 10, color: t.inputColor, padding: '8px 12px', fontSize: 12, fontFamily: 'var(--body)', outline: 'none',
                  }}
                >
                  <option value="todos" style={{ background: t.modalBg, color: t.text }}>Todos los Arquetipos</option>
                  <option value="emperador" style={{ background: t.modalBg, color: t.text }}>El Emperador</option>
                  <option value="mago" style={{ background: t.modalBg, color: t.text }}>El Mago</option>
                  <option value="gladiador" style={{ background: t.modalBg, color: t.text }}>El Gladiador</option>
                  <option value="malabarista" style={{ background: t.modalBg, color: t.text }}>El Malabarista</option>
                  <option value="mochilero" style={{ background: t.modalBg, color: t.text }}>El Mochilero</option>
                  <option value="sonador" style={{ background: t.modalBg, color: t.text }}>El Soñador</option>
                </select>

                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  style={{
                    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    borderRadius: 10, color: t.inputColor, padding: '8px 12px', fontSize: 12, fontFamily: 'var(--body)', outline: 'none',
                  }}
                >
                  <option value="todos" style={{ background: t.modalBg, color: t.text }}>Todos los Estados</option>
                  <option value="nuevo" style={{ background: t.modalBg, color: t.text }}>Nuevo</option>
                  <option value="contactado" style={{ background: t.modalBg, color: t.text }}>Contactado</option>
                  <option value="agendado" style={{ background: t.modalBg, color: t.text }}>Agendado</option>
                  <option value="perdido" style={{ background: t.modalBg, color: t.text }}>Perdido</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* ── TAB 1: CRM (SOLO CLIENTES PAGADOS) ── */}
        {activeTab === 'crm' && (
          <div style={{
            background: t.cardBg, backdropFilter: 'blur(20px)',
            border: `1px solid ${t.border}`, borderRadius: 20,
            overflow: 'hidden', boxShadow: isDark ? '0 0 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: t.tableHeaderBg, borderBottom: `1px solid ${t.border}`, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: t.tableHeaderColor }}>
                    <th style={{ padding: '16px 18px' }}>Persona / Cédula</th>
                    <th style={{ padding: '16px 18px' }}>Arquetipo &amp; Finanzas</th>
                    <th style={{ padding: '16px 18px' }}>Etapa Embudo</th>
                    {isDevOrAdmin && <th style={{ padding: '16px 18px' }}>Referido / Vendedor / Contador</th>}
                    {!isDevOrAdmin && <th style={{ padding: '16px 18px' }}>Asignación</th>}
                    <th style={{ padding: '16px 18px' }}>Contacto</th>
                    <th style={{ padding: '16px 18px' }}>Vencimiento</th>
                    <th style={{ padding: '16px 18px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {finalCrmLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: t.subtext, fontSize: 14 }}>
                        No hay clientes pagados registrados en este momento.
                      </td>
                    </tr>
                  ) : (
                    finalCrmLeads.map((lead) => (
                      <tr key={lead.id} style={{ borderBottom: `1px solid ${t.tableRowBorder}`, transition: 'background .15s' }}>
                        {/* Persona */}
                        <td style={{ padding: '16px 18px' }}>
                          <span style={{ fontWeight: 700, color: t.text, display: 'block' }}>{lead.nombre}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: t.subtext }}>
                            C.C. {lead.cedula}
                          </span>
                        </td>

                        {/* Arquetipo */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 999, background: 'rgba(61,107,255,0.12)',
                              border: '1px solid rgba(61,107,255,0.3)', color: isDark ? '#7DD3FC' : '#0284C7', fontSize: 11, fontWeight: 600, width: 'fit-content',
                            }}>
                              {lead.arquetipos?.nombre || 'General'}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: lead.debe_declarar ? '#FF8080' : (isDark ? '#4ED6A1' : '#16A34A') }}>
                              {lead.debe_declarar ? 'DECLARA RENTA' : 'NO DECLARA'}
                            </span>
                          </div>
                        </td>

                        {/* Etapa Embudo (Pipeline) */}
                        <td style={{ padding: '16px 18px' }}>
                          {isDevOrAdmin || isContador ? (
                            <select
                              value={lead.etapa || 'consultoria'}
                              onChange={(e) => handleUpdateEtapaLead(lead.id, e.target.value)}
                              style={{
                                background: 'rgba(14,124,102,0.15)',
                                border: '1px solid rgba(14,124,102,0.4)',
                                borderRadius: 8, color: isDark ? '#4ED6A1' : '#0E7C66', padding: '6px 10px', fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600, outline: 'none',
                              }}
                            >
                              <option value="consultoria" style={{ background: t.modalBg, color: t.text }}>01. Consultoría ($100k)</option>
                              <option value="documentos" style={{ background: t.modalBg, color: t.text }}>02. Documentos</option>
                              <option value="anticipo" style={{ background: t.modalBg, color: t.text }}>03. Anticipo (50%)</option>
                              <option value="declaracion" style={{ background: t.modalBg, color: t.text }}>04. Declaración</option>
                              <option value="entrega" style={{ background: t.modalBg, color: t.text }}>05. Entrega Final</option>
                            </select>
                          ) : (
                            renderEtapaBadge(lead.etapa)
                          )}
                        </td>

                        {/* Múltiple Asignación (Referido / Vendedor / Contador) */}
                        {isDevOrAdmin ? (
                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {/* Referido */}
                              <select
                                value={lead.referrer_id || ''}
                                onChange={(e) => handleUpdateAssignment(lead.id, 'referrer_id', e.target.value || null)}
                                style={{
                                  background: lead.referrer_id ? 'rgba(78,214,161,0.12)' : t.inputBg,
                                  border: `1px solid ${lead.referrer_id ? 'rgba(78,214,161,0.4)' : t.inputBorder}`,
                                  borderRadius: 6, color: t.inputColor, padding: '3px 6px', fontSize: 10, fontFamily: 'var(--body)', outline: 'none',
                                }}
                              >
                                <option value="" style={{ background: t.modalBg, color: t.text }}>Ref: Sin asignar</option>
                                {usuarios.filter(u => u.rol === 'referido' || u.rol === 'vendedor' || u.rol === 'admin').map(u => (
                                  <option key={u.id} value={u.id} style={{ background: t.modalBg, color: t.text }}>Ref: {u.nombre}</option>
                                ))}
                              </select>

                              {/* Vendedor */}
                              <select
                                value={lead.seller_id || ''}
                                onChange={(e) => handleUpdateAssignment(lead.id, 'seller_id', e.target.value || null)}
                                style={{
                                  background: lead.seller_id ? 'rgba(251,191,36,0.12)' : t.inputBg,
                                  border: `1px solid ${lead.seller_id ? 'rgba(251,191,36,0.4)' : t.inputBorder}`,
                                  borderRadius: 6, color: t.inputColor, padding: '3px 6px', fontSize: 10, fontFamily: 'var(--body)', outline: 'none',
                                }}
                              >
                                <option value="" style={{ background: t.modalBg, color: t.text }}>Vend: Sin asignar</option>
                                {usuarios.filter(u => u.rol === 'vendedor' || u.rol === 'admin').map(u => (
                                  <option key={u.id} value={u.id} style={{ background: t.modalBg, color: t.text }}>Vend: {u.nombre}</option>
                                ))}
                              </select>

                              {/* Contador */}
                              <select
                                value={lead.contador_id || ''}
                                onChange={(e) => handleUpdateAssignment(lead.id, 'contador_id', e.target.value || null)}
                                style={{
                                  background: lead.contador_id ? 'rgba(61,107,255,0.15)' : t.inputBg,
                                  border: `1px solid ${lead.contador_id ? 'rgba(61,107,255,0.4)' : t.inputBorder}`,
                                  borderRadius: 6, color: t.inputColor, padding: '3px 6px', fontSize: 10, fontFamily: 'var(--body)', outline: 'none',
                                }}
                              >
                                <option value="" style={{ background: t.modalBg, color: t.text }}>Cont: Sin asignar</option>
                                {usuarios.filter(u => u.rol === 'contador' || u.rol === 'admin').map(u => (
                                  <option key={u.id} value={u.id} style={{ background: t.modalBg, color: t.text }}>Cont: {u.nombre}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                        ) : (
                          <td style={{ padding: '16px 18px', fontSize: 11, color: t.subtext }}>
                            <div>Contador: {lead.contador?.nombre || 'Sin asignar'}</div>
                            {lead.vendedor?.nombre && <div>Vendedor: {lead.vendedor.nombre}</div>}
                          </td>
                        )}

                        {/* Contacto */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: t.text }}>
                              {lead.celular || 'Sin celular'}
                            </span>
                            {renderMedioContacto(lead)}
                          </div>
                        </td>

                        {/* Vencimiento */}
                        <td style={{ padding: '16px 18px', fontFamily: 'var(--mono)', fontSize: 11, color: t.subtext }}>
                          {lead.fecha_vencimiento || 'Sin fecha'}
                        </td>

                        {/* Acciones CRM */}
                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                            <Link
                              href={`/r/${lead.slug_publico}`}
                              target="_blank"
                              style={{
                                padding: '5px 10px', borderRadius: 8, background: 'rgba(61,107,255,0.12)',
                                border: '1px solid rgba(61,107,255,0.3)', color: isDark ? '#7DD3FC' : '#0284C7',
                                fontFamily: 'var(--mono)', fontSize: 11, textDecoration: 'none',
                              }}
                            >
                              Resultado ↗
                            </Link>

                            {(isDevOrAdmin || isContador) && (
                              <button
                                onClick={() => setSelectedRespuestasLead(lead)}
                                style={{
                                  padding: '5px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                                  border: `1px solid ${t.inputBorder}`, color: t.text,
                                  fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                                }}
                              >
                                Finanzas
                              </button>
                            )}

                            {isDevOrAdmin && (
                              <>
                                <button
                                  onClick={() => handleOpenEditLead(lead)}
                                  style={{
                                    padding: '5px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                                    border: `1px solid ${t.inputBorder}`, color: t.text,
                                    fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                                  }}
                                >
                                  Editar
                                </button>

                                <button
                                  onClick={() => handleRemoveFromCRM(lead.id)}
                                  title="Eliminar de mi CRM"
                                  style={{
                                    padding: '5px 10px', borderRadius: 8, background: 'rgba(255,80,80,0.14)',
                                    border: '1px solid rgba(255,80,80,0.3)', color: '#FF8080',
                                    fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                  }}
                                >
                                  <TrashIcon />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: REPORTE DE VENTAS & FINANZAS ── */}
        {activeTab === 'ventas' && reporteVentas && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Tarjetas de Resumen Financiero */}
            {isDevOrAdmin ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: t.subtext, textTransform: 'uppercase' }}>Valor Declaraciones Totales</span>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace', marginTop: 6 }}>
                    {formatCOP(reporteVentas.resumen.totalVentasBrutas)}
                  </div>
                  <span style={{ fontSize: 11, color: t.subtext }}>Suma valor de declaraciones</span>
                </div>

                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: t.subtext, textTransform: 'uppercase' }}>Costos Comisiones Totales</span>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#FBBF24', fontFamily: 'monospace', marginTop: 6 }}>
                    {formatCOP(reporteVentas.resumen.totalCostosComisiones)}
                  </div>
                  <span style={{ fontSize: 11, color: t.subtext }}>Contadores + Vendedores + Referidos</span>
                </div>

                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: t.subtext, textTransform: 'uppercase' }}>Desarrollo &amp; Plataforma (10%)</span>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#4ED6A1', fontFamily: 'monospace', marginTop: 6 }}>
                    {formatCOP(reporteVentas.resumen.totalUtilidadPlataforma)}
                  </div>
                  <span style={{ fontSize: 11, color: t.subtext }}>Fijo 10% desarrollo y mantenimiento</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: t.subtext, textTransform: 'uppercase' }}>Mis Ventas Confirmadas</span>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace', marginTop: 6 }}>
                    {misVentasDetalle.length} Clientes
                  </div>
                  <span style={{ fontSize: 11, color: t.subtext }}>Declaraciones asignadas</span>
                </div>

                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: t.subtext, textTransform: 'uppercase' }}>Mi Comisión Acumulada</span>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#4ED6A1', fontFamily: 'monospace', marginTop: 6 }}>
                    {formatCOP(miComisionTotalCalculada)}
                  </div>
                  <span style={{ fontSize: 11, color: t.subtext }}>Ganancia acumulada total</span>
                </div>
              </div>
            )}

            {/* Tabla de Desglose por Cliente */}
            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, fontWeight: 700 }}>
                {isDevOrAdmin ? 'Desglose Financiero por Cliente Confirmado' : 'Mis Clientes y Comisiones Asignadas'}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: t.tableHeaderBg, borderBottom: `1px solid ${t.border}`, fontFamily: 'var(--mono)', textTransform: 'uppercase', color: t.tableHeaderColor, fontSize: 10, letterSpacing: '.08em' }}>
                      <th style={{ padding: '14px 16px', textAlign: 'left', width: '18%' }}>Cliente</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', width: '14%' }}>Valor Declaración</th>
                      {isDevOrAdmin ? (
                        <>
                          <th style={{ padding: '14px 16px', textAlign: 'left', width: '15%' }}>Contador (70%)</th>
                          <th style={{ padding: '14px 16px', textAlign: 'left', width: '15%' }}>Vendedor (15%)</th>
                          <th style={{ padding: '14px 16px', textAlign: 'left', width: '13%' }}>Referido (5%)</th>
                          <th style={{ padding: '14px 16px', textAlign: 'left', width: '15%' }}>Desarrollo (10%)</th>
                          <th style={{ padding: '14px 16px', textAlign: 'right', width: '10%' }}>Acciones</th>
                        </>
                      ) : (
                        <>
                          <th style={{ padding: '14px 16px', textAlign: 'left', width: '35%' }}>Valor Declaración</th>
                          <th style={{ padding: '14px 16px', textAlign: 'right', width: '35%' }}>Mi Comisión Ganada</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {misVentasDetalle.map((v) => {
                      const miAmt = isContador
                        ? v.amtContador
                        : isVendedor
                        ? v.amtVendedor
                        : isReferido
                        ? v.amtReferido
                        : v.amtContador;

                      const originalLead = leads.find((l) => l.id === v.id);

                      return (
                        <tr key={v.id} style={{ borderBottom: `1px solid ${t.tableRowBorder}` }}>
                          {/* Cliente */}
                          <td style={{ padding: '14px 16px', textAlign: 'left' }}>
                            <span style={{ fontWeight: 700, color: t.text, display: 'block' }}>{v.nombre}</span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: t.subtext }}>C.C. {v.cedula}</span>
                          </td>

                          {/* Valor Declaración (Editable por Contador / Admin) */}
                          <td style={{ padding: '14px 16px', textAlign: 'left' }}>
                            {isDevOrAdmin || isContador ? (
                              <input
                                type="number"
                                key={`${v.id}-${v.valorDeclaracion}`}
                                defaultValue={v.valorDeclaracion || ''}
                                placeholder="$0 (Definir)"
                                onBlur={(e) => {
                                  const num = Number(e.target.value) || 0;
                                  if (num !== v.valorDeclaracion) {
                                    handleUpdateLeadValorDeclaracion(v.id, num);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                style={{
                                  width: 120, padding: '6px 10px', borderRadius: 8,
                                  background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                                  border: `1px solid ${t.inputBorder}`, color: '#38BDF8',
                                  fontFamily: 'monospace', fontWeight: 700, fontSize: 13, outline: 'none',
                                }}
                              />
                            ) : (
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38BDF8', display: 'block' }}>
                                {formatCOP(v.valorDeclaracion)}
                              </span>
                            )}
                          </td>

                          {isDevOrAdmin ? (
                            <>
                              {/* Contador */}
                              <td style={{ padding: '14px 16px', textAlign: 'left' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: t.text, display: 'block' }}>
                                  {formatCOP(v.amtContador)}
                                </span>
                                <span style={{ fontSize: 10, color: t.subtext }}>{v.contadorNombre}</span>
                              </td>

                              {/* Vendedor */}
                              <td style={{ padding: '14px 16px', textAlign: 'left' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#FBBF24', display: 'block' }}>
                                  {formatCOP(v.amtVendedor)}
                                </span>
                                <span style={{ fontSize: 10, color: t.subtext }}>{v.vendedorNombre}</span>
                              </td>

                              {/* Referido */}
                              <td style={{ padding: '14px 16px', textAlign: 'left' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4ED6A1', display: 'block' }}>
                                  {formatCOP(v.amtReferido)}
                                </span>
                                <span style={{ fontSize: 10, color: t.subtext }}>{v.referidoNombre}</span>
                              </td>

                              {/* Desarrollo & Mantenimiento */}
                              <td style={{ padding: '14px 16px', textAlign: 'left' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#C084FC', display: 'block' }}>
                                  {formatCOP(v.amtDesarrollo)}
                                </span>
                                <span style={{ fontSize: 10, color: t.subtext }}>Plataforma: {formatCOP(v.amtPlataforma)}</span>
                              </td>

                              {/* Acciones */}
                              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                {originalLead && (
                                  <button
                                    onClick={() => handleOpenEditLead(originalLead)}
                                    style={{
                                      padding: '5px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                                      border: `1px solid ${t.inputBorder}`, color: t.text,
                                      fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                                    }}
                                  >
                                    Editar ✏️
                                  </button>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '14px 16px', textAlign: 'left', fontFamily: 'monospace' }}>
                                {formatCOP(v.valorDeclaracion)}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#4ED6A1', fontWeight: 700 }}>
                                {formatCOP(miAmt)}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: MIS LINKS DE REFERIDO ── */}
        {activeTab === 'links' && (
          <div style={{ maxWidth: 650, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 20, padding: 24 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#7DD3FC', fontFamily: 'var(--display)' }}>
                1. Link de Referido para Cuestionario / Test
              </h3>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: t.subtext }}>
                Comparte este enlace para que las personas realicen el test tributario. Tu código de referido se registrará automáticamente.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  readOnly
                  value={testLink}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    color: t.inputColor, fontSize: 13, fontFamily: 'monospace',
                  }}
                />
                <button
                  onClick={() => copyToClipboard(testLink, 'test')}
                  style={{
                    padding: '10px 18px', borderRadius: 10, background: '#3D6BFF',
                    color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {copiedLinkText === 'test' ? '¡Copiado! ✓' : 'Copiar Link'}
                </button>
              </div>
            </div>

            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 20, padding: 24 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#4ED6A1', fontFamily: 'var(--display)' }}>
                2. Link de Referido Directo a Agendar Asesoría
              </h3>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: t.subtext }}>
                Comparte este enlace para llevar al cliente directamente a agendar y pagar la consultoría ($100.000 COP).
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  readOnly
                  value={agendarLink}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    color: t.inputColor, fontSize: 13, fontFamily: 'monospace',
                  }}
                />
                <button
                  onClick={() => copyToClipboard(agendarLink, 'agendar')}
                  style={{
                    padding: '10px 18px', borderRadius: 10, background: '#0E7C66',
                    color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {copiedLinkText === 'agendar' ? '¡Copiado! ✓' : 'Copiar Link'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: CALCULADORA DE COMISIONES ── */}
        {activeTab === 'calculadora' && <CalculadoraComisiones isDark={isDark} />}

        {/* ── TAB 5: LEADS (ADMINS Y CONTADORES) ── */}
        {activeTab === 'leads' && (isDevOrAdmin || isContador) && (
          <div style={{
            background: t.cardBg, backdropFilter: 'blur(20px)',
            border: `1px solid ${t.border}`, borderRadius: 20,
            overflow: 'hidden', boxShadow: isDark ? '0 0 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: t.tableHeaderBg, borderBottom: `1px solid ${t.border}`, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: t.tableHeaderColor }}>
                    <th style={{ padding: '16px 18px' }}>Persona</th>
                    <th style={{ padding: '16px 18px' }}>Contacto</th>
                    <th style={{ padding: '16px 18px' }}>Arquetipo</th>
                    <th style={{ padding: '16px 18px' }}>Estado de Pago</th>
                    <th style={{ padding: '16px 18px' }}>Etapa Embudo</th>
                    <th style={{ padding: '16px 18px' }}>Asignar Contador</th>
                    <th style={{ padding: '16px 18px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {finalAllLeads.map((lead) => (
                    <tr key={lead.id} style={{ borderBottom: `1px solid ${t.tableRowBorder}`, transition: 'background .15s' }}>
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{ fontWeight: 700, color: t.text, display: 'block' }}>{lead.nombre}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: t.subtext }}>
                          C.C. {lead.cedula} ({lead.edad} años)
                        </span>
                      </td>

                      <td style={{ padding: '16px 18px', fontFamily: 'var(--mono)', fontSize: 11 }}>
                        <span style={{ display: 'block', color: t.text }}>{lead.celular || 'Sin celular'}</span>
                        <span style={{ color: t.subtext }}>{lead.correo || 'Sin correo'}</span>
                      </td>

                      <td style={{ padding: '16px 18px' }}>
                        <span style={{ color: isDark ? '#7DD3FC' : '#0284C7', fontWeight: 600 }}>{lead.arquetipos?.nombre || 'General'}</span>
                      </td>

                      {/* Estado de Pago */}
                      <td style={{ padding: '16px 18px' }}>
                        {isDevOrAdmin ? (
                          <select
                            value={lead.pagado ? 'true' : 'false'}
                            onChange={(e) => handleUpdatePagadoLead(lead.id, e.target.value === 'true')}
                            style={{
                              background: lead.pagado ? 'rgba(78,214,161,0.18)' : 'rgba(255,80,80,0.12)',
                              border: lead.pagado ? '1px solid rgba(78,214,161,0.5)' : '1px solid rgba(255,80,80,0.3)',
                              borderRadius: 8, color: lead.pagado ? (isDark ? '#4ED6A1' : '#16A34A') : '#FF8080',
                              padding: '6px 10px', fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 700, outline: 'none',
                            }}
                          >
                            <option value="false" style={{ background: t.modalBg, color: t.text }}>❌ No Pagado</option>
                            <option value="true" style={{ background: t.modalBg, color: t.text }}>✅ PAGADO (Pasa a CRM)</option>
                          </select>
                        ) : (
                          <span style={{
                            padding: '4px 10px', borderRadius: 8,
                            background: lead.pagado ? 'rgba(78,214,161,0.18)' : 'rgba(255,80,80,0.12)',
                            color: lead.pagado ? (isDark ? '#4ED6A1' : '#16A34A') : '#FF8080',
                            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                          }}>
                            {lead.pagado ? 'PAGADO' : 'No Pagado'}
                          </span>
                        )}
                      </td>

                      {/* Etapa */}
                      <td style={{ padding: '16px 18px' }}>
                        {renderEtapaBadge(lead.etapa)}
                      </td>

                      {/* Asignar Contador */}
                      <td style={{ padding: '16px 18px' }}>
                        {isDevOrAdmin ? (
                          <select
                            value={lead.contador_id || ''}
                            onChange={(e) => handleUpdateAssignment(lead.id, 'contador_id', e.target.value || null)}
                            style={{
                              background: lead.contador_id ? 'rgba(61,107,255,0.18)' : t.inputBg,
                              border: lead.contador_id ? '1px solid rgba(61,107,255,0.5)' : `1px solid ${t.inputBorder}`,
                              borderRadius: 8, color: t.inputColor, padding: '4px 8px', fontSize: 11, fontFamily: 'var(--body)', outline: 'none',
                            }}
                          >
                            <option value="" style={{ background: t.modalBg, color: t.text }}>Sin asignar</option>
                            {usuarios.map((u) => (
                              <option key={u.id} value={u.id} style={{ background: t.modalBg, color: t.text }}>
                                {u.nombre} ({u.rol})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: 11, color: t.subtext }}>{lead.contador?.nombre || 'Sin asignar'}</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                          <Link
                            href={`/r/${lead.slug_publico}`}
                            target="_blank"
                            style={{
                              padding: '5px 10px', borderRadius: 8, background: 'rgba(61,107,255,0.12)',
                              border: '1px solid rgba(61,107,255,0.3)', color: isDark ? '#7DD3FC' : '#0284C7',
                              fontFamily: 'var(--mono)', fontSize: 11, textDecoration: 'none',
                            }}
                          >
                            Resultado ↗
                          </Link>

                          <button
                            onClick={() => setSelectedRespuestasLead(lead)}
                            style={{
                              padding: '5px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                              border: `1px solid ${t.inputBorder}`, color: t.text,
                              fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                            }}
                          >
                            Finanzas
                          </button>

                          {isDevOrAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditLead(lead)}
                                style={{
                                  padding: '5px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                                  border: `1px solid ${t.inputBorder}`, color: t.text,
                                  fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                                }}
                              >
                                Editar
                              </button>

                              <button
                                onClick={() => handleRemoveFromCRM(lead.id)}
                                title="Eliminar Lead"
                                style={{
                                  padding: '5px 10px', borderRadius: 8, background: 'rgba(255,80,80,0.14)',
                                  border: '1px solid rgba(255,80,80,0.3)', color: '#FF8080',
                                  fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                }}
                              >
                                <TrashIcon />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 6: USUARIOS (SOLO ADMINS) ── */}
        {activeTab === 'usuarios' && isDevOrAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Form Crear Usuario */}
            <div style={{
              background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 20, padding: 24,
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, color: t.text, fontFamily: 'var(--display)' }}>
                Crear Nuevo Usuario
              </h3>
              {userMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 12,
                  background: userMsg.error ? 'rgba(255,80,80,0.14)' : 'rgba(78,214,161,0.14)',
                  border: `1px solid ${userMsg.error ? 'rgba(255,80,80,0.3)' : 'rgba(78,214,161,0.3)'}`,
                  color: userMsg.error ? '#FF8080' : '#4ED6A1',
                }}>
                  {userMsg.text}
                </div>
              )}
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', color: t.subtext, marginBottom: 4 }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserNombre}
                    onChange={(e) => setNewUserNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputColor, fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', color: t.subtext, marginBottom: 4 }}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputColor, fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', color: t.subtext, marginBottom: 4 }}>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputColor, fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', color: t.subtext, marginBottom: 4 }}>
                    Rol / Nivel de Permisos
                  </label>
                  <select
                    value={newUserRol}
                    onChange={(e) => setNewUserRol(e.target.value as any)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputColor, fontSize: 13,
                    }}
                  >
                    <option value="contador" style={{ background: t.modalBg, color: t.text }}>Contador (Declaraciones asignadas)</option>
                    <option value="vendedor" style={{ background: t.modalBg, color: t.text }}>Vendedor (Clientes propios + Referidos)</option>
                    <option value="referido" style={{ background: t.modalBg, color: t.text }}>Referido (Links de atracción)</option>
                    <option value="admin" style={{ background: t.modalBg, color: t.text }}>Administrador (Control total)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  style={{
                    marginTop: 8, padding: '12px', borderRadius: 10,
                    background: '#3D6BFF', color: '#fff', border: 'none',
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--body)',
                  }}
                >
                  + Crear Usuario
                </button>
              </form>
            </div>

            {/* Lista Usuarios */}
            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 20, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, color: t.text, fontFamily: 'var(--display)' }}>
                Usuarios en Stakeholders ({usuarios.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {usuarios.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      padding: '12px 16px', borderRadius: 12,
                      background: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9',
                      border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{u.nombre}</div>
                      <div style={{ fontSize: 12, color: t.subtext }}>{u.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 999, fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase',
                        background: 'rgba(61,107,255,0.14)', color: isDark ? '#7DD3FC' : '#0284C7', border: '1px solid rgba(61,107,255,0.3)',
                      }}>
                        {u.rol}
                      </span>
                      <span style={{ fontSize: 11, color: u.activo ? (isDark ? '#4ED6A1' : '#16A34A') : '#FF8080' }}>
                        {u.activo ? 'Activo ✓' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL FINANZAS / RESPUESTAS TEST ── */}
      {selectedRespuestasLead && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: t.modalBg, border: `1px solid ${t.border}`, borderRadius: 20,
            maxWidth: 600, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 24, color: t.text,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--display)' }}>Finanzas del Test</h3>
                <p style={{ margin: 0, fontSize: 12, color: t.subtext }}>Cliente: {selectedRespuestasLead.nombre}</p>
              </div>
              <button onClick={() => setSelectedRespuestasLead(null)} style={{ background: 'none', border: 'none', color: t.text, fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ── Información de Pago (solo admin/contador) ── */}
              {(isDevOrAdmin || isContador) && (() => {
                const orders = selectedRespuestasLead.orders || [];
                // Priorizar la orden APPROVED; si no, la más reciente
                const approvedOrder = orders.find(o => o.status === 'APPROVED');
                const displayOrder = approvedOrder || orders[0];
                return (
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: isDark ? 'rgba(61,107,255,0.08)' : 'rgba(61,107,255,0.05)', border: '1px solid rgba(61,107,255,0.25)' }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase' as const, color: '#3D6BFF', display: 'block', marginBottom: 10, letterSpacing: '.14em' }}>
                      Información de Pago — Consultoría
                    </span>
                    {displayOrder ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontSize: 11, color: t.subtext }}>Referencia de pago</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: isDark ? '#7DD3FC' : '#0284C7', letterSpacing: '.04em' }}>
                            {displayOrder.reference}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontSize: 11, color: t.subtext }}>Estado del pago</span>
                          <span style={{
                            padding: '3px 10px', borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
                            background: displayOrder.status === 'APPROVED' ? 'rgba(78,214,161,0.15)' : displayOrder.status === 'DECLINED' ? 'rgba(255,80,80,0.15)' : 'rgba(255,200,60,0.15)',
                            color: displayOrder.status === 'APPROVED' ? '#4ED6A1' : displayOrder.status === 'DECLINED' ? '#FF8080' : '#FFC83C',
                          }}>
                            {displayOrder.status === 'APPROVED' ? '✅ APROBADO' : displayOrder.status === 'DECLINED' ? '❌ DECLINADO' : displayOrder.status === 'PENDING' ? '⏳ PENDIENTE' : displayOrder.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontSize: 11, color: t.subtext }}>Monto</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: t.text }}>
                            {formatCOP(displayOrder.amount_in_cents / 100)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontSize: 11, color: t.subtext }}>Fecha</span>
                          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: t.subtext }}>
                            {new Date(displayOrder.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: t.subtext, margin: 0 }}>Sin orden de pago registrada para este cliente.</p>
                    )}
                  </div>
                );
              })()}

              {/* Indicadores de puntuación */}
              <div>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', color: t.subtext, display: 'block', marginBottom: 8 }}>
                  Puntuación de Barras de Arquetipo
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }}>
                    <span style={{ fontSize: 10, color: t.subtext, display: 'block' }}>Patrimonio</span>
                    <strong style={{ fontSize: 15, color: '#F0B93C' }}>{selectedRespuestasLead.barra_patrimonio}/100</strong>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }}>
                    <span style={{ fontSize: 10, color: t.subtext, display: 'block' }}>Ingresos</span>
                    <strong style={{ fontSize: 15, color: '#4ED6A1' }}>{selectedRespuestasLead.barra_ingresos}/100</strong>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }}>
                    <span style={{ fontSize: 10, color: t.subtext, display: 'block' }}>Créditos</span>
                    <strong style={{ fontSize: 15, color: '#FF6B8A' }}>{selectedRespuestasLead.barra_creditos}/100</strong>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }}>
                    <span style={{ fontSize: 10, color: t.subtext, display: 'block' }}>Movimientos</span>
                    <strong style={{ fontSize: 15, color: '#7DD3FC' }}>{selectedRespuestasLead.barra_movimientos}/100</strong>
                  </div>
                </div>
              </div>

              {/* Respuestas detalladas del cuestionario */}
              <div>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', color: '#3D6BFF', display: 'block', marginBottom: 8 }}>
                  Respuestas Detalladas del Test Tributario
                </span>
                {selectedRespuestasLead.respuestas?.[0]?.payload ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                    {Object.entries(selectedRespuestasLead.respuestas[0].payload).map(([key, val]) => (
                      <div key={key} style={{ padding: '10px 14px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: t.subtext, textTransform: 'uppercase' }}>
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontWeight: 600, color: t.text, textAlign: 'right' }}>
                          {typeof val === 'number' && (key.toLowerCase().includes('ingreso') || key.toLowerCase().includes('deuda') || key.toLowerCase().includes('valor') || key.toLowerCase().includes('costo') || key.toLowerCase().includes('patrimonio') || key.toLowerCase().includes('monto'))
                            ? formatCOP(val)
                            : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 16, textAlign: 'center', color: t.subtext, fontSize: 12, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}>
                    No hay datos detallados de respuestas registrados en el payload para este cliente.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                onClick={() => setSelectedRespuestasLead(null)}
                style={{ padding: '8px 16px', borderRadius: 8, background: '#3D6BFF', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR LEAD ── */}
      {editingLead && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: t.modalBg, border: `1px solid ${t.border}`, borderRadius: 20,
            maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24, color: t.text,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--display)' }}>Editar Cliente</h3>
              <button onClick={() => setEditingLead(null)} style={{ background: 'none', border: 'none', color: t.text, fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveEditLead} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: t.subtext, textTransform: 'uppercase' }}>Nombre</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputColor }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: t.subtext, textTransform: 'uppercase' }}>Cédula</label>
                <input
                  type="text"
                  value={editCedula}
                  onChange={(e) => setEditCedula(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputColor }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: t.subtext, textTransform: 'uppercase' }}>Celular</label>
                <input
                  type="text"
                  value={editCelular}
                  onChange={(e) => setEditCelular(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputColor }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: t.subtext, textTransform: 'uppercase' }}>Valor Declaración (COP)</label>
                <input
                  type="number"
                  value={editValorDeclaracion}
                  onChange={(e) => setEditValorDeclaracion(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputColor, fontFamily: 'monospace', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: t.subtext, textTransform: 'uppercase' }}>Estado de Pago</label>
                <select
                  value={editPagado ? 'true' : 'false'}
                  onChange={(e) => setEditPagado(e.target.value === 'true')}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputColor }}
                >
                  <option value="false" style={{ background: t.modalBg, color: t.text }}>❌ No Pagado</option>
                  <option value="true" style={{ background: t.modalBg, color: t.text }}>✅ PAGADO (CRM)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${t.inputBorder}`, color: t.text, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#3D6BFF', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
