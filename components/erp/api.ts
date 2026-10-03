'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* ── Tipos de datos del ERP ──────────────────────────────── */
export interface Tercero {
  id: string;
  tipo_persona: 'natural' | 'juridica';
  tipo_documento: string;
  numero_documento: string;
  dv: string | null;
  nombre: string;
  nombre_comercial: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  responsable_iva: boolean;
  dias_credito: number;
  notas: string | null;
  activo: boolean;
  banco?: string | null;
  tipo_cuenta?: string | null;
  numero_cuenta?: string | null;
  created_at: string;
  // agregados de la vista
  num_ventas?: number; total_facturado?: number; ultima_venta?: string | null;
  num_compras?: number; total_comprado?: number; ultima_compra?: string | null;
  saldo: number;
  saldo_vencido: number;
}

export interface Documento {
  id: string;
  numero: string;
  fecha: string;
  fecha_vencimiento: string | null;
  descripcion: string | null;
  subtotal: number;
  iva: number;
  retencion: number;
  total: number;
  neto: number;
  estado: string;
  motivo_anulacion: string | null;
  pagado: number;
  saldo: number;
  estado_pago: 'pendiente' | 'parcial' | 'pagada' | 'vencida' | 'anulada';
  created_at: string;
  // venta
  cliente_id?: string; cliente_nombre?: string; cliente_documento?: string; servicio?: string; cuenta_ingreso?: string;
  // compra
  proveedor_id?: string; proveedor_nombre?: string; proveedor_documento?: string; numero_factura?: string | null;
  cuenta_gasto?: string; cuenta_gasto_nombre?: string;
}

export interface Item {
  id: number;
  descripcion: string;
  cantidad: number;
  valor_unitario: number;
  iva_pct: number;
  subtotal: number;
  iva: number;
}

export interface Pago {
  id: string;
  numero: string;
  tipo: 'cobro' | 'pago';
  venta_id: string | null;
  compra_id: string | null;
  fecha: string;
  valor: number;
  medio: string;
  cuenta: string;
  referencia: string | null;
  notas: string | null;
  estado: 'aplicado' | 'anulado';
  created_at: string;
}

export interface LineaLibro {
  linea_id: number;
  asiento_id: string;
  numero: number;
  fecha: string;
  tipo: string;
  descripcion: string;
  origen_tipo: string | null;
  origen_id: string | null;
  tercero_tipo: string | null;
  tercero_id: string | null;
  tercero_nombre: string | null;
  anulado: boolean;
  cuenta: string;
  cuenta_nombre: string;
  linea_descripcion: string | null;
  debito: number;
  credito: number;
}

export interface Cuenta { codigo: string; nombre: string; naturaleza: string; clase: number }

export interface Lead {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string | null;
  telefono: string | null;
  servicio: string;
  origen: string;
  estado: 'nuevo' | 'contactado' | 'propuesta' | 'ganado' | 'perdido';
  valor_estimado: number | null;
  mensaje: string | null;
  notas: string | null;
  responsable_id: string | null;
  cliente_id: string | null;
  renta_lead_id: string | null;
  created_at: string;
  responsable?: { id: string; nombre: string } | null;
  cliente?: { id: string; nombre: string } | null;
}

export interface RentaLead {
  id: string;
  nombre: string;
  cedula: string;
  celular: string | null;
  correo: string | null;
  debe_declarar: boolean;
  pagado?: boolean;
  created_at: string;
  arquetipos?: { nombre: string } | null;
  erp_lead_id: string | null;
  cliente_id: string | null;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  created_at: string;
  referral_slug: string | null;
  phone: string | null;
}

/* ── Cliente HTTP ────────────────────────────────────────── */
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('erp:unauthorized'));
  }
  if (!res.ok) throw new ApiError(res.status, json.error || `Error ${res.status}`);
  return (json.data ?? json) as T;
}

export const qs = (params: Record<string, string | undefined | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
};

/** Carga datos y recarga cuando cambia la URL. Ignora respuestas viejas. */
export function useData<T>(url: string | null, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState('');
  const seq = useRef(0);

  const reload = useCallback(async () => {
    if (!url) return;
    const my = ++seq.current;
    setLoading(true);
    try {
      const d = await api<T>(url);
      if (my === seq.current) { setData(d); setError(''); }
    } catch (e) {
      if (my === seq.current) setError((e as Error).message);
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload, setData };
}

/** Debounce simple para cajas de búsqueda */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}
