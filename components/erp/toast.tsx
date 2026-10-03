'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { C, useT } from './ui';

type Notify = (msg: string, kind?: 'ok' | 'error') => void;
const ToastCtx = createContext<Notify>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const [items, setItems] = useState<Array<{ id: number; msg: string; kind: 'ok' | 'error' }>>([]);
  const notify = useCallback<Notify>((msg, kind = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, msg, kind }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), kind === 'error' ? 6000 : 3200);
  }, []);
  return (
    <ToastCtx.Provider value={notify}>
      {children}
      <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 'calc(100vw - 40px)' }}>
        {items.map((i) => (
          <div key={i.id} className="pop" style={{
            padding: '12px 16px', borderRadius: 12, fontSize: 13, maxWidth: 380,
            background: t.modalBg, color: t.text, backdropFilter: 'blur(14px)',
            border: `1px solid ${i.kind === 'ok' ? 'rgba(78,214,161,0.4)' : 'rgba(255,80,80,0.4)'}`,
            boxShadow: '0 12px 40px rgba(0,0,0,.35)',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ color: i.kind === 'ok' ? C.green : C.red, fontFamily: 'var(--mono)' }}>{i.kind === 'ok' ? '✓' : '!'}</span>
            <span>{i.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
