'use client';

/* ============================================================
   COSMO · acompañante flotante de /contabilidad
   - Un solo Cosmo fijo en el margen libre de cada sección.
   - Cambia de pose por sección con un "salto" por portal.
   - Se inclina con la velocidad del scroll; las nebulosas del
     traje se encienden cuando se mueve.
   - Se inclina hacia el mouse, habla con burbujas, al clic gira
     y lleva al formulario, celebra cuando se envía.
   - Pantallas angostas: modo compacto (esquina inferior izq.),
     aparece unos segundos en cada sección.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { COSMO_POSES, type CosmoPose } from './poses';
import './cosmo.css';

type Side = 'left' | 'right';
interface Escena {
  sel: string;
  pose: CosmoPose;
  side: Side;
  frase: string;
  /** 'children' = unión de los hijos (contenido real); 'self' = la caja de la sección */
  bounds?: 'children' | 'self';
  /** Cosmo baja acompañando el avance de la sección */
  seguir?: boolean;
}

const ESCENAS: Escena[] = [
  { sel: '.conta-hero', pose: 'saludo', side: 'right', frase: '¡Hola! Soy Cosmo, tu contador de otra galaxia.' },
  { sel: '#que', pose: 'senalando', side: 'left', frase: 'Estos cuatro principios no se negocian.' },
  { sel: '#como', pose: 'portal', side: 'right', frase: 'Viajemos paso a paso, desde el diagnóstico.', seguir: true },
  { sel: '#por-que', pose: 'pensando', side: 'left', frase: 'Primero entiendo tu empresa. Después, los números.' },
  { sel: '#precios', pose: 'calculadora', side: 'right', frase: '¿Cuántas facturas emites al mes? Con eso calculo tu plan.' },
  { sel: '#formulario', pose: 'saludo', side: 'left', frase: 'Te visito en tu oficina o nos vemos por Meet.', bounds: 'self' },
];
const FRASE_HOVER = '¿Agendamos tu diagnóstico gratis?';
const FRASE_LISTO = '¡Listo! Nos vemos muy pronto.';

/* Todas las poses comparten coordenadas: un solo marco para que los pies no salten */
const VIEWBOX = '0 49 300 435';
const RATIO = 435 / 300;
const NAV_H = 80;
const MIN_MARGEN = 118; // por debajo: modo compacto
const COMPACT_W = 82;

const STAR = 'M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z';
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Caja { top: number; bottom: number; left: number; right: number }

export default function Cosmo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const warpRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);

  const [pose, setPose] = useState<CosmoPose>('portal');
  const [side, setSide] = useState<Side>('right');
  const [compact, setCompact] = useState(false);
  const [frase, setFrase] = useState('');
  const [burbuja, setBurbuja] = useState(false);
  const [visible, setVisible] = useState(false);

  // estado mutable que no necesita re-render
  const st = useRef({
    reduce: false,
    cajas: [] as Array<Caja | null>,
    activa: -1,
    mostrada: -1,
    warping: false,
    celebrado: false,
    hover: false,
    planHover: '' as string,
    lastY: 0, lastT: 0, vel: 0, energy: 0, tilt: 0,
    mouseX: -1, lean: 0,
    x: 0, y: 0, w: 160,
    raf: 0,
    bubbleTimer: 0 as number | ReturnType<typeof setTimeout>,
    peekTimer: 0 as number | ReturnType<typeof setTimeout>,
    compact: false,
  });

  /* ── Medición de las secciones (coordenadas de página) ── */
  const medir = useCallback(() => {
    const s = st.current;
    s.cajas = ESCENAS.map((e) => {
      const el = document.querySelector<HTMLElement>(e.sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const box: Caja = { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right };
      if (e.bounds !== 'self') {
        let l = Infinity, rr = -Infinity;
        for (const c of Array.from(el.children) as HTMLElement[]) {
          const cs = getComputedStyle(c);
          if (cs.position === 'absolute' || cs.position === 'fixed' || cs.display === 'none') continue;
          const cr = c.getBoundingClientRect();
          if (cr.width === 0) continue;
          l = Math.min(l, cr.left); rr = Math.max(rr, cr.right);
        }
        if (l < rr) { box.left = l; box.right = rr; }
      }
      return box;
    });
  }, []);

  /* ── Burbuja ── */
  const decir = useCallback((texto: string, ms = 4200) => {
    const s = st.current;
    setFrase(texto);
    setBurbuja(true);
    clearTimeout(s.bubbleTimer as number);
    if (ms > 0) s.bubbleTimer = setTimeout(() => { if (!st.current.hover) setBurbuja(false); }, ms);
  }, []);

  /* ── Estallido de estrellas ── */
  const estallar = useCallback((n = 12, fuerza = 1) => {
    const s = st.current;
    const box = burstRef.current;
    if (s.reduce || !box) return;
    const colores = ['#3B6EFF', '#BFD4FF', '#F0B93C', '#FFFFFF'];
    for (let i = 0; i < n; i++) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      el.setAttribute('viewBox', '-10 -10 20 20');
      el.setAttribute('class', 'cz-spark');
      const size = 6 + Math.random() * 10;
      el.style.width = el.style.height = `${size}px`;
      el.innerHTML = `<path d="${STAR}" fill="${colores[i % colores.length]}"/>`;
      box.appendChild(el);
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.6;
      const dist = (60 + Math.random() * 70) * fuerza;
      const a = el.animate(
        [
          { transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(1) rotate(${Math.random() * 180}deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(calc(-50% + ${Math.cos(ang) * dist * 1.25}px), calc(-50% + ${Math.sin(ang) * dist * 1.25 + 30}px)) scale(.4) rotate(220deg)`, opacity: 0 },
        ],
        { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.22,1,.36,1)' },
      );
      a.onfinish = () => el.remove();
    }
  }, []);

  const pulsoPortal = useCallback(() => {
    const p = portalRef.current;
    if (!p || st.current.reduce) return;
    p.animate(
      [
        { transform: 'translateX(-50%) scale(.1, .1)', opacity: 0 },
        { transform: 'translateX(-50%) scale(1, 1)', opacity: 1, offset: 0.35 },
        { transform: 'translateX(-50%) scale(1.25, 1.1)', opacity: 0 },
      ],
      { duration: 900, easing: 'cubic-bezier(.22,1,.36,1)' },
    );
  }, []);

  /* ── Posición objetivo según la sección activa ── */
  const objetivo = useCallback((i: number) => {
    const s = st.current;
    const vw = window.innerWidth, vh = window.innerHeight;
    const e = ESCENAS[i], c = s.cajas[i];
    if (!c) return null;
    const margen = e.side === 'right' ? vw - c.right : c.left;
    // ¿cabe en el margen? si no, modo compacto
    if (margen < MIN_MARGEN || vw < 900) {
      const w = COMPACT_W, h = w * RATIO;
      return { compact: true, w, x: 14, y: vh - h - 14, margen: vw };
    }
    const w = clamp(margen - 30, 96, Math.min(240, (vh - NAV_H - 40) / RATIO));
    const h = w * RATIO;
    const x = e.side === 'right' ? c.right + (margen - w) / 2 : (margen - w) / 2;
    let y = vh * 0.54 - h / 2;
    if (e.seguir) {
      const prog = clamp((scrollY + vh * 0.55 - c.top) / (c.bottom - c.top), 0, 1);
      y = vh * 0.2 + prog * (vh * 0.8 - h - vh * 0.2);
    }
    y = clamp(y, NAV_H, vh - h - 20);
    return { compact: false, w, x, y, margen };
  }, []);

  const aplicarPos = useCallback((t: { w: number; x: number; y: number; margen: number; compact: boolean }, animar: boolean) => {
    const el = rootRef.current;
    if (!el) return;
    const s = st.current;
    s.x = t.x; s.y = t.y; s.w = t.w;
    el.style.transition = animar ? '' : 'none';
    el.style.setProperty('--cz-w', `${t.w}px`);
    // la burbuja cabe en el margen libre: nunca tapa el contenido
    if (!t.compact) {
      const vw = window.innerWidth;
      const bw = clamp(t.margen - 20, 130, 280);
      const izquierda = t.x < vw / 2;
      el.style.setProperty('--cz-bw', `${bw}px`);
      el.style.setProperty('--cz-bx', `${izquierda ? 10 - t.x : t.x + t.w - (vw - 10)}px`);
    }
    el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0)`;
    if (!animar) void el.offsetWidth; // aplica sin transición
    if (!animar) el.style.transition = '';
  }, []);

  /* ── Modo compacto: aparece unos segundos ── */
  const asomar = useCallback((ms = 4200) => {
    const s = st.current;
    setVisible(true);
    clearTimeout(s.peekTimer as number);
    if (ms > 0) s.peekTimer = setTimeout(() => { if (!st.current.hover) setVisible(false); }, ms);
  }, []);

  /* ── Cambio de sección: salto por portal ── */
  const irA = useCallback(async (i: number, entrada = false) => {
    const s = st.current;
    if (s.warping) return;
    const t = objetivo(i);
    if (!t) return;
    const e = ESCENAS[i];
    const nuevaPose: CosmoPose = i === ESCENAS.length - 1 && s.celebrado ? 'celebrando' : e.pose;
    const warp = warpRef.current;
    s.warping = true;
    s.mostrada = i;

    let salida: Animation | null = null;
    if (!entrada && warp && !s.reduce) {
      setBurbuja(false);
      salida = warp.animate(
        [
          { transform: 'scale(1) rotate(0deg)', opacity: 1, filter: 'blur(0px)' },
          { transform: 'scale(.12) rotate(-30deg)', opacity: 0, filter: 'blur(4px)' },
        ],
        { duration: 300, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' },
      );
      await salida.finished.catch(() => {});
      estallar(10, 0.7);
    }

    // reubicar mientras está invisible
    s.compact = t.compact;
    setCompact(t.compact);
    setSide(e.side);
    setPose(nuevaPose);
    aplicarPos(t, false);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    if (warp) {
      if (s.reduce) {
        salida?.cancel();
      } else {
        pulsoPortal();
        const llegada = warp.animate(
          entrada
            ? [
                { transform: 'translateY(40%) scale(.4)', opacity: 0, filter: 'blur(3px)' },
                { transform: 'translateY(-4%) scale(1.06)', opacity: 1, filter: 'blur(0px)', offset: 0.7 },
                { transform: 'translateY(0) scale(1)', opacity: 1, filter: 'blur(0px)' },
              ]
            : [
                { transform: 'scale(.12) rotate(30deg)', opacity: 0, filter: 'blur(4px)' },
                { transform: 'scale(1.08) rotate(-4deg)', opacity: 1, filter: 'blur(0px)', offset: 0.7 },
                { transform: 'scale(1) rotate(0deg)', opacity: 1, filter: 'blur(0px)' },
              ],
          { duration: entrada ? 900 : 520, easing: 'cubic-bezier(.34,1.42,.5,1)', fill: 'forwards' },
        );
        // la salida quedó fija en opacidad 0 (fill: forwards): se libera ya que la llegada la tapa
        salida?.cancel();
        await llegada.finished.catch(() => {});
        llegada.cancel();
        estallar(entrada ? 14 : 8, entrada ? 1 : 0.6);
      }
    }
    s.warping = false;
    if (!s.compact) setVisible(true);
    if (s.compact) asomar(i === 0 || i === ESCENAS.length - 1 ? 5200 : 3800);
    decir(s.celebrado && i === ESCENAS.length - 1 ? FRASE_LISTO : e.frase);

    // si mientras saltaba cambió la sección, seguir
    if (s.activa !== s.mostrada && s.activa >= 0) irA(s.activa);
  }, [objetivo, aplicarPos, estallar, pulsoPortal, decir, asomar]);

  /* ── Bucle: sección activa, velocidad, inclinación, seguimiento ── */
  useEffect(() => {
    const s = st.current;
    s.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    medir();
    s.lastY = scrollY; s.lastT = performance.now();

    const activaAhora = () => {
      const linea = scrollY + window.innerHeight * 0.55;
      let idx = 0;
      s.cajas.forEach((c, i) => { if (c && c.top <= linea) idx = i; });
      return idx;
    };

    const tick = () => {
      const now = performance.now();
      const dt = Math.max(1, now - s.lastT);
      const dy = scrollY - s.lastY;
      s.lastY = scrollY; s.lastT = now;
      const v = dy / dt; // px/ms
      s.vel += (v - s.vel) * 0.2;
      const targetEnergy = clamp(Math.abs(s.vel) / 2.2, 0, 1);
      s.energy += (targetEnergy - s.energy) * (targetEnergy > s.energy ? 0.35 : 0.06);
      const targetTilt = s.reduce ? 0 : clamp(-s.vel * 5, -9, 9);
      s.tilt += (targetTilt - s.tilt) * 0.15;
      // inclinación hacia el mouse
      let targetLean = 0;
      if (!s.reduce && !s.compact && s.mouseX >= 0) {
        const cx = s.x + s.w / 2;
        targetLean = clamp((s.mouseX - cx) / window.innerWidth, -0.5, 0.5);
      }
      s.lean += (targetLean - s.lean) * 0.08;

      const el = rootRef.current;
      if (el) {
        el.style.setProperty('--cz-energy', s.energy.toFixed(3));
        el.style.setProperty('--cz-tilt', `${(s.tilt + s.lean * 8).toFixed(2)}deg`);
        el.style.setProperty('--cz-lean', `${(s.lean * 22).toFixed(1)}px`);
      }

      const i = activaAhora();
      if (i !== s.activa) {
        s.activa = i;
        if (!s.warping && s.mostrada !== -1) irA(i);
      } else if (!s.warping && s.mostrada === i) {
        const t = objetivo(i);
        if (t && t.compact === s.compact) aplicarPos(t, true); // seguir / ajustar suave
        else if (t && t.compact !== s.compact) irA(i);
      }

      const quieto = Math.abs(s.vel) < 0.002 && s.energy < 0.01 && Math.abs(s.tilt) < 0.05 && Math.abs(s.lean - targetLean) < 0.002;
      s.raf = quieto ? 0 : requestAnimationFrame(tick);
    };
    const despertar = () => { if (!s.raf) s.raf = requestAnimationFrame(tick); };

    const onScroll = () => despertar();
    const onResize = () => { medir(); despertar(); };
    const onMove = (ev: PointerEvent) => { if (ev.pointerType === 'mouse') { s.mouseX = ev.clientX; despertar(); } };
    const onLeave = () => { s.mouseX = -1; despertar(); };

    // Planes: la burbuja muestra el plan bajo el mouse
    const onOver = (ev: Event) => {
      const card = (ev.target as HTMLElement).closest?.('.plan-card');
      if (!card || s.activa !== 4) return;
      const nombre = card.querySelector('.plan-card__name')?.textContent?.trim();
      const fact = card.querySelector('.plan-card__invoices')?.textContent?.replace(/\s+/g, ' ').trim();
      const key = `${nombre}|${fact}`;
      if (!nombre || key === s.planHover) return;
      s.planHover = key;
      const rango = (fact?.split(':').pop() || '').trim();
      const r = rango ? rango.charAt(0).toLowerCase() + rango.slice(1) : '';
      decir(r ? `Plan ${nombre}: ${r} facturas de venta al mes.` : `Plan ${nombre}.`, 3600);
    };
    const onOut = (ev: Event) => {
      const card = (ev.target as HTMLElement).closest?.('.plan-card');
      const to = (ev as MouseEvent).relatedTarget as HTMLElement | null;
      if (card && !card.contains(to)) s.planHover = '';
    };

    // Formulario enviado
    const onCelebrar = () => {
      s.celebrado = true;
      setPose('celebrando');
      if (s.compact) asomar(6500);
      decir(FRASE_LISTO, 6500);
      estallar(18, 1.3);
      setTimeout(() => estallar(14, 1), 380);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerout', onOut, { passive: true });
    window.addEventListener('cosmo:celebrar', onCelebrar);
    // re-medir cuando cargan fuentes/imágenes y cambia el alto de la página
    const ro = new ResizeObserver(() => { medir(); despertar(); });
    ro.observe(document.body);

    // Entrada: sale del portal
    const inicio = setTimeout(() => {
      medir();
      s.activa = activaAhora();
      setVisible(true);
      irA(s.activa, true);
      despertar();
    }, 450);

    return () => {
      clearTimeout(inicio);
      cancelAnimationFrame(s.raf);
      clearTimeout(s.bubbleTimer as number);
      clearTimeout(s.peekTimer as number);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      window.removeEventListener('cosmo:celebrar', onCelebrar);
      ro.disconnect();
    };
  }, [medir, irA, objetivo, aplicarPos, decir, estallar, asomar]);

  /* ── Interacción directa ── */
  const onEnter = () => {
    const s = st.current;
    s.hover = true;
    decir(s.celebrado ? FRASE_LISTO : FRASE_HOVER, 0);
  };
  const onLeaveBody = () => {
    const s = st.current;
    s.hover = false;
    clearTimeout(s.bubbleTimer as number);
    s.bubbleTimer = setTimeout(() => setBurbuja(false), 900);
    if (s.compact) asomar(2500);
  };
  const onClick = async () => {
    const s = st.current;
    const warp = warpRef.current;
    estallar(16, 1.1);
    if (warp && !s.reduce) {
      await warp.animate(
        [
          { transform: 'rotate(0deg) scale(1)' },
          { transform: 'rotate(-12deg) scale(1.08)', offset: 0.2 },
          { transform: 'rotate(372deg) scale(1.08)', offset: 0.8 },
          { transform: 'rotate(360deg) scale(1)' },
        ],
        { duration: 720, easing: 'cubic-bezier(.22,1,.36,1)' },
      ).finished.catch(() => {});
    }
    const form = document.getElementById('formulario');
    if (form) {
      form.scrollIntoView({ behavior: s.reduce ? 'auto' : 'smooth', block: 'start' });
      setTimeout(() => document.getElementById('f-nombre')?.focus({ preventScroll: true }), 900);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`cz ${compact ? 'cz--compact' : ''} ${visible ? 'cz--on' : ''}`}
      data-side={side}
      aria-hidden={false}
    >
      <div className="cz-glow" aria-hidden="true" />
      <div className="cz-burst" ref={burstRef} aria-hidden="true" />
      <div className={`cz-bubble ${burbuja && frase ? 'cz-bubble--on' : ''}`} aria-hidden="true">
        <span key={frase}>{frase}</span>
      </div>
      <button
        type="button"
        className="cz-body"
        onClick={onClick}
        onPointerEnter={onEnter}
        onPointerLeave={onLeaveBody}
        onFocus={onEnter}
        onBlur={onLeaveBody}
        aria-label="Cosmo: agenda tu diagnóstico gratis"
      >
        <div className="cz-float">
          <div className="cz-warp" ref={warpRef}>
            <div className="cz-tilt">
              <div className="cz-portal" ref={portalRef} />
              {(Object.keys(COSMO_POSES) as CosmoPose[]).map((k) => (
                <svg
                  key={k}
                  className={`cz-pose ${pose === k ? 'cz-pose--on' : ''}`}
                  viewBox={VIEWBOX}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: COSMO_POSES[k].svg }}
                />
              ))}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
