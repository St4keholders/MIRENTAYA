'use client';

import { useState } from 'react';
import { api, useData, type Usuario } from '../api';
import { useToast } from '../toast';
import { Badge, Btn, Card, CardHeader, ErrorMsg, Field, Grid, Input, Modal, Mono, Select, Strong, Table, fecha, useT, type Tone } from '../ui';
import { PERMISOS, MODULOS, normalizarRol } from '@/lib/erp/permisos';

const ROLES: Array<[string, string]> = [['admin', 'Administrador'], ['contador', 'Contador'], ['vendedor', 'Vendedor'], ['referido', 'Referido'], ['desarrollador', 'Desarrollador']];
const ROL_TONE: Record<string, Tone> = { admin: 'blue', desarrollador: 'sky', contador: 'green', vendedor: 'yellow', referido: 'gray' };

const accesos = (rol: string) => {
  const r = normalizarRol(rol);
  if (!r) return '—';
  return PERMISOS[r].map((m) => MODULOS.find((x) => x.id === m)?.label).join(' · ');
};

export default function UsuariosPanel({ yoId, soyDev }: { yoId: string; soyDev: boolean }) {
  const t = useT();
  const notify = useToast();
  const { data, loading, error, reload } = useData<Usuario[]>('/api/erp/usuarios', []);
  const [f, setF] = useState({ nombre: '', email: '', password: '', rol: 'contador', phone: '' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [pwdUser, setPwdUser] = useState<Usuario | null>(null);
  const [pwd, setPwd] = useState('');

  const rolesDisponibles = soyDev ? ROLES : ROLES.filter(([r]) => r !== 'desarrollador');
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      await api('/api/erp/usuarios', { method: 'POST', body: f });
      notify('Usuario creado');
      setF({ nombre: '', email: '', password: '', rol: f.rol, phone: '' });
      reload();
    } catch (e2) { setErr((e2 as Error).message); }
    finally { setSaving(false); }
  };

  const patch = async (id: string, body: Record<string, unknown>, msg: string) => {
    try { await api('/api/erp/usuarios', { method: 'PATCH', body: { id, ...body } }); notify(msg); reload(); }
    catch (e) { notify((e as Error).message, 'error'); }
  };

  return (
    <div className="erp-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
      <Card pad>
        <h3 style={{ margin: '0 0 4px', fontSize: 17, fontFamily: 'var(--display)', letterSpacing: '-.03em' }}>Registrar usuario</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: t.subtext }}>Podrá entrar en /admin/login con su correo y contraseña.</p>
        <form onSubmit={crear} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ErrorMsg>{err}</ErrorMsg>
          <Field label="Nombre completo"><Input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} required /></Field>
          <Field label="Correo"><Input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} required /></Field>
          <Field label="Celular"><Input value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Contraseña" hint="Mínimo 8 caracteres"><Input type="password" value={f.password} onChange={(e) => set('password', e.target.value)} required minLength={8} /></Field>
          <Field label="Rol" hint={`Accede a: ${accesos(f.rol)}`}><Select value={f.rol} onChange={(e) => set('rol', e.target.value)} options={rolesDisponibles} /></Field>
          <Btn variant="primary" type="submit" disabled={saving} style={{ justifyContent: 'center', marginTop: 4 }}>{saving ? 'Creando…' : 'Crear usuario'}</Btn>
        </form>
      </Card>

      <Card>
        <CardHeader title={`Usuarios · ${data.length}`} />
        {error && <div style={{ padding: 16 }}><ErrorMsg>{error}</ErrorMsg></div>}
        <Table<Usuario>
          rows={data} rowKey={(u) => u.id} empty={loading ? 'Cargando…' : 'Sin usuarios.'}
          cols={[
            { key: 'n', label: 'Usuario', render: (u) => <Strong sub={u.email}>{u.nombre} {u.id === yoId && <Badge tone="sky">Tú</Badge>}</Strong> },
            { key: 'r', label: 'Rol', render: (u) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                {u.id === yoId || (normalizarRol(u.rol) === 'desarrollador' && !soyDev)
                  ? <Badge tone={ROL_TONE[normalizarRol(u.rol) || ''] || 'gray'}>{u.rol}</Badge>
                  : <Select value={normalizarRol(u.rol) || u.rol} onChange={(e) => patch(u.id, { rol: e.target.value }, 'Rol actualizado')} options={rolesDisponibles} style={{ width: 'auto', padding: '5px 8px', fontSize: 11, fontFamily: 'var(--mono)' }} />}
                <span style={{ fontSize: 10, color: t.subtext, maxWidth: 260 }}>{accesos(u.rol)}</span>
              </div>
            ) },
            { key: 'e', label: 'Estado', render: (u) => u.activo ? <Badge tone="green">Activo</Badge> : <Badge tone="red">Inactivo</Badge> },
            { key: 'f', label: 'Creado', render: (u) => <Mono color={t.subtext}>{fecha(u.created_at)}</Mono> },
            { key: 'a', label: 'Acciones', align: 'right', render: (u) => (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Btn small variant="soft" onClick={() => { setPwdUser(u); setPwd(''); }}>Contraseña</Btn>
                {u.id !== yoId && (u.activo
                  ? <Btn small variant="danger" onClick={() => confirm(`¿Desactivar a ${u.nombre}? No podrá iniciar sesión.`) && patch(u.id, { activo: false }, 'Usuario desactivado')}>Desactivar</Btn>
                  : <Btn small variant="link" onClick={() => patch(u.id, { activo: true }, 'Usuario reactivado')}>Activar</Btn>)}
              </div>
            ) },
          ]}
        />
      </Card>

      <Modal open={Boolean(pwdUser)} onClose={() => setPwdUser(null)} width={420} eyebrow={pwdUser?.email} title="Cambiar contraseña"
        footer={<><Btn variant="ghost" onClick={() => setPwdUser(null)}>Cancelar</Btn>
          <Btn variant="primary" disabled={pwd.length < 8} onClick={async () => { if (pwdUser) { await patch(pwdUser.id, { password: pwd }, 'Contraseña actualizada'); setPwdUser(null); } }}>Guardar</Btn></>}>
        <Grid cols={1}>
          <Field label="Nueva contraseña" hint="Mínimo 8 caracteres"><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoFocus /></Field>
        </Grid>
      </Modal>
    </div>
  );
}
