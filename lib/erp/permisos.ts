/* Permisos del ERP por rol — compartido entre cliente y servidor */

export type Rol = 'desarrollador' | 'admin' | 'contador' | 'vendedor' | 'referido';

export type Modulo =
  | 'clientes'
  | 'proveedores'
  | 'libro'
  | 'compras'
  | 'ventas'
  | 'formularios'
  | 'leads'
  | 'prospeccion'
  | 'links'
  | 'usuarios';

export const MODULOS: Array<{ id: Modulo; label: string; titulo: string; eyebrow: string }> = [
  { id: 'clientes', label: 'Clientes', titulo: 'Clientes & Cuentas por Cobrar', eyebrow: 'Terceros' },
  { id: 'proveedores', label: 'Proveedores', titulo: 'Proveedores & Cuentas por Pagar', eyebrow: 'Terceros' },
  { id: 'libro', label: 'Libro Diario', titulo: 'Libro Diario', eyebrow: 'Contabilidad' },
  { id: 'compras', label: 'Compras', titulo: 'Compras', eyebrow: 'Operación' },
  { id: 'ventas', label: 'Ventas', titulo: 'Ventas', eyebrow: 'Operación' },
  { id: 'formularios', label: 'Formularios', titulo: 'Formularios', eyebrow: 'CRM' },
  { id: 'leads', label: 'Leads', titulo: 'Leads', eyebrow: 'CRM' },
  { id: 'prospeccion', label: 'Prospección', titulo: 'Prospección de leads', eyebrow: 'CRM' },
  { id: 'links', label: 'Mis links', titulo: 'Mis links de agenda', eyebrow: 'CRM' },
  { id: 'usuarios', label: 'Usuarios', titulo: 'Usuarios y Permisos', eyebrow: 'Configuración' },
];

const TODOS: Modulo[] = ['clientes', 'proveedores', 'libro', 'compras', 'ventas', 'formularios', 'leads', 'prospeccion', 'links', 'usuarios'];

export const PERMISOS: Record<Rol, Modulo[]> = {
  desarrollador: TODOS,
  admin: TODOS,
  contador: ['clientes', 'proveedores', 'libro', 'compras', 'ventas', 'formularios', 'leads', 'prospeccion', 'links'],
  vendedor: ['clientes', 'ventas', 'formularios', 'leads', 'prospeccion', 'links'],
  referido: ['formularios', 'leads', 'links'],
};

export function normalizarRol(rol: string | null | undefined): Rol | null {
  if (!rol) return null;
  const r = rol.toLowerCase();
  if (r === 'developer' || r === 'desarrollador' || r === 'dev') return 'desarrollador';
  if (r === 'admin' || r === 'contador' || r === 'vendedor' || r === 'referido') return r;
  return null;
}

export function puede(rol: string | null | undefined, modulo: Modulo): boolean {
  const r = normalizarRol(rol);
  return r ? PERMISOS[r].includes(modulo) : false;
}

export function puedeAprobar(rol: string | null | undefined): boolean {
  const r = normalizarRol(rol);
  return r === 'admin' || r === 'desarrollador' || r === 'contador';
}

export function esAdmin(rol: string | null | undefined): boolean {
  const r = normalizarRol(rol);
  return r === 'admin' || r === 'desarrollador';
}
