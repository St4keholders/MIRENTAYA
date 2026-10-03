'use client';

/* ============================================================
   Primitivas visuales del ERP — mismos tokens del panel original
   (negro, glass, azul #3D6BFF, verde #4ED6A1, mono JetBrains)
   ============================================================ */

import { createContext, useContext, useEffect, type CSSProperties, type ReactNode } from 'react';

export const C = {
  blue: '#3D6BFF',
  green: '#4ED6A1',
  greenLight: '#16A34A',
  yellow: '#FBBF24',
  red: '#FF8080',
  sky: '#7DD3FC',
  skyLight: '#0284C7',
  cyan: '#38BDF8',
};

export function makeTheme(isDark: boolean) {
  return {
    isDark,
    bg: isDark ? '#000000' : '#F8FAFC',
    text: isDark ? '#FFFFFF' : '#0F172A',
    subtext: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    sidebarBg: isDark ? 'rgba(10,10,14,0.75)' : '#FFFFFF',
    tableHeaderBg: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
    tableHeaderColor: isDark ? 'rgba(255,255,255,0.5)' : '#475569',
    tableRowBorder: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    rowHover: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)',
    inputBg: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
    inputBorder: isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1',
    inputColor: isDark ? '#FFFFFF' : '#0F172A',
    modalBg: isDark ? '#101014' : '#FFFFFF',
    softBg: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
    green: isDark ? C.green : C.greenLight,
    sky: isDark ? C.sky : C.skyLight,
    amber: isDark ? C.yellow : '#B45309',
    danger: isDark ? C.red : '#DC2626',
    cyan: isDark ? C.cyan : '#0284C7',
  };
}
export type Theme = ReturnType<typeof makeTheme>;

const ThemeCtx = createContext<Theme>(makeTheme(true));
export const ThemeProvider = ThemeCtx.Provider;
export const useT = () => useContext(ThemeCtx);

/* ── Formato ─────────────────────────────────────────────── */
export const cop = (v: number | string | null | undefined) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);

export const fecha = (v: string | null | undefined) => {
  if (!v) return '—';
  const d = new Date(v.length === 10 ? v + 'T12:00:00' : v);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const hoy = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/* ── Layout ──────────────────────────────────────────────── */
export function Card({ children, style, pad = false }: { children: ReactNode; style?: CSSProperties; pad?: boolean }) {
  const t = useT();
  return (
    <div style={{
      background: t.cardBg, backdropFilter: 'blur(20px)', border: `1px solid ${t.border}`, borderRadius: 20,
      overflow: 'hidden', boxShadow: t.isDark ? '0 0 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
      padding: pad ? 20 : 0, ...style,
    }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, right }: { title: ReactNode; right?: ReactNode }) {
  const t = useT();
  return (
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ fontWeight: 700, color: t.text }}>{title}</div>
      {right}
    </div>
  );
}

export function Stats({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>{children}</div>;
}

export function Stat({ label, value, hint, color }: { label: string; value: ReactNode; hint?: string; color?: string }) {
  const t = useT();
  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, backdropFilter: 'blur(20px)' }}>
      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: t.subtext, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || t.cyan, fontFamily: 'var(--mono)', marginTop: 6, letterSpacing: '-.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
      {hint && <span style={{ fontSize: 11, color: t.subtext }}>{hint}</span>}
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>;
}

/* ── Tabla ───────────────────────────────────────────────── */
export interface Col<R> {
  key: string;
  label: string;
  render: (row: R) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
}

export function Table<R>({ cols, rows, rowKey, onRowClick, empty = 'Sin registros.', footer }: {
  cols: Col<R>[]; rows: R[]; rowKey: (r: R) => string; onRowClick?: (r: R) => void; empty?: string; footer?: ReactNode;
}) {
  const t = useT();
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
        <thead>
          <tr style={{ background: t.tableHeaderBg, borderBottom: `1px solid ${t.border}`, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: t.tableHeaderColor }}>
            {cols.map((c) => (
              <th key={c.key} style={{ padding: '16px 18px', textAlign: c.align || 'left', width: c.width, whiteSpace: 'nowrap', fontWeight: 600 }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={cols.length} style={{ padding: 40, textAlign: 'center', color: t.subtext, fontSize: 14 }}>{empty}</td></tr>
          ) : rows.map((r) => (
            <tr
              key={rowKey(r)}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              style={{ borderBottom: `1px solid ${t.tableRowBorder}`, transition: 'background .15s', cursor: onRowClick ? 'pointer' : 'default' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.rowHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {cols.map((c) => (
                <td key={c.key} style={{ padding: '14px 18px', textAlign: c.align || 'left', color: t.text, verticalAlign: 'middle' }}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}

export function Strong({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  const t = useT();
  return (
    <div>
      <span style={{ fontWeight: 700, color: t.text, display: 'block' }}>{children}</span>
      {sub && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: t.subtext }}>{sub}</span>}
    </div>
  );
}

export function Mono({ children, color, bold }: { children: ReactNode; color?: string; bold?: boolean }) {
  const t = useT();
  return <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: color || t.text, fontWeight: bold ? 700 : 400, whiteSpace: 'nowrap' }}>{children}</span>;
}

/* ── Badges ──────────────────────────────────────────────── */
export type Tone = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'sky';

export function Badge({ children, tone = 'blue' }: { children: ReactNode; tone?: Tone }) {
  const t = useT();
  const map: Record<Tone, [string, string, string]> = {
    blue: ['rgba(61,107,255,0.12)', 'rgba(61,107,255,0.3)', t.sky],
    sky: ['rgba(56,189,248,0.12)', 'rgba(56,189,248,0.3)', t.sky],
    green: ['rgba(78,214,161,0.15)', 'rgba(78,214,161,0.3)', t.green],
    yellow: ['rgba(251,191,36,0.14)', 'rgba(251,191,36,0.35)', t.isDark ? C.yellow : '#B45309'],
    red: ['rgba(255,80,80,0.14)', 'rgba(255,80,80,0.3)', t.isDark ? C.red : '#DC2626'],
    gray: [t.softBg, t.border, t.subtext],
  };
  const [bg, bd, fg] = map[tone];
  return (
    <span style={{ padding: '3px 9px', borderRadius: 999, background: bg, border: `1px solid ${bd}`, color: fg, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block', fontFamily: 'var(--mono)' }}>
      {children}
    </span>
  );
}

export const ESTADO_PAGO: Record<string, [string, Tone]> = {
  pendiente: ['Pendiente', 'yellow'],
  parcial: ['Abono parcial', 'sky'],
  pagada: ['Pagada', 'green'],
  vencida: ['Vencida', 'red'],
  anulada: ['Anulada', 'gray'],
};

export const SERVICIOS: Record<string, string> = {
  contabilidad: 'Contabilidad',
  nomina: 'Nómina',
  renta: 'Renta persona natural',
  personalizado: 'Servicio personalizado',
  otro: 'Otro',
};

/* ── Botones ─────────────────────────────────────────────── */
type BtnVariant = 'primary' | 'ghost' | 'soft' | 'danger' | 'link';

export function Btn({ children, onClick, variant = 'soft', type = 'button', disabled, small, title, style }: {
  children: ReactNode; onClick?: (e: React.MouseEvent) => void; variant?: BtnVariant; type?: 'button' | 'submit';
  disabled?: boolean; small?: boolean; title?: string; style?: CSSProperties;
}) {
  const t = useT();
  const base: CSSProperties = {
    padding: small ? '5px 10px' : '9px 16px', borderRadius: small ? 8 : 10, fontFamily: small ? 'var(--mono)' : 'var(--display)',
    fontSize: small ? 11 : 13, fontWeight: small ? 500 : 600, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
    transition: 'transform .2s, box-shadow .2s, background .2s', letterSpacing: small ? 0 : '-.01em',
  };
  const v: Record<BtnVariant, CSSProperties> = {
    primary: { background: C.blue, color: '#fff', border: '1px solid transparent', boxShadow: '0 8px 30px -10px rgba(59,110,255,.7)' },
    ghost: { background: 'transparent', color: t.text, border: `1px solid ${t.inputBorder}` },
    soft: { background: t.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0', color: t.text, border: `1px solid ${t.inputBorder}` },
    danger: { background: 'rgba(255,80,80,0.14)', color: t.isDark ? C.red : '#DC2626', border: '1px solid rgba(255,80,80,0.3)' },
    link: { background: 'rgba(61,107,255,0.12)', color: t.sky, border: '1px solid rgba(61,107,255,0.3)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} style={{ ...base, ...v[variant], ...style }}>
      {children}
    </button>
  );
}

/* ── Formularios ─────────────────────────────────────────── */
export function useInputStyle(): CSSProperties {
  const t = useT();
  return {
    width: '100%', padding: '9px 12px', borderRadius: 10, background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    color: t.inputColor, fontSize: 13, fontFamily: 'var(--body)', outline: 'none', boxSizing: 'border-box',
  };
}

export function Field({ label, children, span = 1, hint }: { label: string; children: ReactNode; span?: 1 | 2; hint?: string }) {
  const t = useT();
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: span === 2 ? '1 / -1' : undefined, minWidth: 0 }}>
      <span style={{ fontSize: 10, color: t.subtext, textTransform: 'uppercase', fontFamily: 'var(--mono)', letterSpacing: '.14em' }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: t.subtext }}>{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const s = useInputStyle();
  return <input {...props} style={{ ...s, ...(props.type === 'number' ? { fontFamily: 'var(--mono)' } : {}), ...props.style }} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const s = useInputStyle();
  return <textarea rows={3} {...props} style={{ ...s, resize: 'vertical', ...props.style }} />;
}

export function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: Array<[string, string]> }) {
  const s = useInputStyle();
  const t = useT();
  return (
    <select {...props} style={{ ...s, cursor: 'pointer', ...props.style }}>
      {options.map(([v, l]) => <option key={v} value={v} style={{ background: t.modalBg, color: t.text }}>{l}</option>)}
    </select>
  );
}

export function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return <Select value={value} onChange={(e) => onChange(e.target.value)} options={options} style={{ width: 'auto', minWidth: 150, fontSize: 12 }} />;
}

export function Search({ value, onChange, placeholder = 'Buscar…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: 240, fontSize: 12 }} type="search" />;
}

export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: number }) {
  return <div className="erp-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 14 }}>{children}</div>;
}

export function ErrorMsg({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', color: C.red, fontSize: 13 }}>
      {children}
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────── */
export function Modal({ open, onClose, title, eyebrow, children, footer, width = 560 }: {
  open: boolean; onClose: () => void; title: ReactNode; eyebrow?: string; children: ReactNode; footer?: ReactNode; width?: number;
}) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div className="erp-modal" style={{
        background: t.modalBg, border: `1px solid ${t.border}`, borderRadius: 20, width: '100%', maxWidth: width,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column', color: t.text,
        boxShadow: '0 0 0 1px rgba(255,255,255,.04), 0 0 100px -24px rgba(59,110,255,.6)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '22px 24px 14px' }}>
          <div style={{ minWidth: 0 }}>
            {eyebrow && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: C.blue, display: 'block', marginBottom: 4 }}>{eyebrow}</span>}
            <h3 style={{ margin: 0, fontSize: 20, fontFamily: 'var(--display)', letterSpacing: '-.03em', fontWeight: 700 }}>{title}</h3>
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{ width: 32, height: 32, flexShrink: 0, borderRadius: '50%', border: `1px solid ${t.border}`, background: 'transparent', color: t.subtext, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ padding: '4px 24px 20px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Fila clave/valor ────────────────────────────────────── */
export function KV({ k, v }: { k: string; v: ReactNode }) {
  const t = useT();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: `1px solid ${t.tableRowBorder}`, fontSize: 13 }}>
      <span style={{ color: t.subtext, fontSize: 12 }}>{k}</span>
      <span style={{ color: t.text, textAlign: 'right', fontWeight: 500, wordBreak: 'break-word' }}>{v ?? '—'}</span>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.18em', color: C.blue, display: 'block', margin: '18px 0 8px' }}>{children}</span>;
}

export const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

/** Exporta filas a CSV (Excel abre UTF-8 con BOM) */
export function descargarCSV(nombre: string, cabeceras: string[], filas: Array<Array<string | number | null | undefined>>) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '﻿' + [cabeceras, ...filas].map((f) => f.map(esc).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
