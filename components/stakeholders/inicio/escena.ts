/* ============================================================
   ESCENA DEL INICIO · horizonte planetario
   Motor imperativo (sin React): fondo con nebulosas vivas, el
   logo SH acostado como autopista de luz sobre un planeta, las
   islas sobre sus estrellas, tráfico de naves, Cosmo en primer
   plano y la cámara que lo sigue hasta la isla escogida.
   Se monta desde Horizonte.tsx y devuelve su limpieza.
   ============================================================ */

export type Servicio = {
  id: string; nodo: number; corto: string; tour: string;
  pad: [number, number]; letrero: number; lift?: number;
};

type Config = {
  z0: number; ymax: number; dz: number; kx: number; cx: number; hor: number; hy: number;
  anchoIsla: number; lift: number; anchoCinta: number; aplaste: number; base: number;
  planeta: { r: number; cy: number };
  cosmo: { x: number; y: number; w: number; rot: number };
  zoomAncho: number; zoomCentro: [number, number];
  nubes: Array<{ x: number; y: number; w: number; h: number; a: number; v: number }>;
  liftIsla: number[];
  dxIsla: number[];
};

const ESCRITORIO: Config = {
  z0: 1, ymax: 360, dz: 1 / 60, kx: 7.5, cx: 0.5, hor: 0.4, hy: 520,
  anchoIsla: 640, lift: 200, anchoCinta: 26, aplaste: 0.36, base: 1440,
  planeta: { r: 1.1, cy: 2.38 },
  cosmo: { x: 0.88, y: 0.86, w: 360, rot: -8 },
  zoomAncho: 0.46, zoomCentro: [0.33, 0.5],
  nubes: [{ x: 0.5, y: 0.28, w: 1.4, h: 0.6, a: 0.42, v: 0.03 }, { x: 0.15, y: 0.18, w: 0.8, h: 0.5, a: 0.3, v: 0.05 }, { x: 0.85, y: 0.2, w: 0.7, h: 0.5, a: 0.3, v: 0.04 }],
  liftIsla: [0, 60, -40, 90],
  dxIsla: [0, 0, 0, 0],
};

const MOVIL: Config = {
  z0: 1, ymax: 360, dz: 1 / 110, kx: 1.6, cx: 0.5, hor: 0.08, hy: 900,
  anchoIsla: 300, lift: 190, anchoCinta: 18, aplaste: 0.4, base: 430,
  planeta: { r: 1.7, cy: 1.36 },
  cosmo: { x: 0.8, y: 0.8, w: 170, rot: -8 },
  zoomAncho: 0.86, zoomCentro: [0.5, 0.3],
  nubes: [{ x: 0.5, y: 0.3, w: 2.2, h: 0.5, a: 0.42, v: 0.03 }, { x: 0.2, y: 0.15, w: 1.4, h: 0.4, a: 0.3, v: 0.05 }, { x: 0.85, y: 0.5, w: 1.3, h: 0.4, a: 0.3, v: 0.04 }],
  liftIsla: [0, 30, -20, 50],
  dxIsla: [0, 0, -0.08, 0.06],
};

const NODOS: Array<[number, number]> = [[100, 320], [148, 360], [232, 355], [280, 305], [256, 235], [200, 200], [144, 165], [120, 95], [168, 45], [252, 40], [300, 80]];
const EJES: Array<[[number, number], [number, number]]> = [[[100, 80], [100, 320]], [[300, 80], [300, 320]], [[100, 200], [300, 200]]];
const STAR = 'M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z';
const NS = 'http://www.w3.org/2000/svg';
const NEBULA = ['#2448C8', '#1A5FCF', '#3A3FB0'];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type Punto = { x: number; y: number; s: number; z: number };
type Geo = { cx: number; sy: number; ancho: number; left: number; top: number; base: Punto; punta: number };
type Cosmo = { x: number; y: number; w: number; rot: number };
type Cam = { s: number; x: number; y: number };

export type Eventos = {
  onLlegar: (i: number) => void;
  onSalir: () => void;
};

export type ControlEscena = { volar: (i: number) => void; volver: () => void; destruir: () => void };

export function iniciarEscena(root: HTMLElement, servicios: Servicio[], saludo: string, ev: Eventos): ControlEscena {
  const q = <T extends Element>(s: string) => root.querySelector(s) as T;
  const cam = q<HTMLDivElement>('.hz-cam');
  const hw = q<SVGSVGElement>('.hz-hw');
  const bg = q<HTMLCanvasElement>('.hz-bg');
  const cosmo = q<HTMLDivElement>('.hz-cosmo');
  const cosmoNave = q<HTMLDivElement>('.hz-cosmo__nave');
  const burbuja = q<HTMLDivElement>('.hz-burbuja');
  const g = bg.getContext('2d') as CanvasRenderingContext2D;
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, String(attrs[k]));
    if (parent) parent.appendChild(e);
    return e;
  };

  let W = window.innerWidth, H = window.innerHeight, U = 1, V = 1, CFG = ESCRITORIO;
  const elegirConfig = () => {
    CFG = W < 760 || W / H < 0.9 ? MOVIL : ESCRITORIO;
    V = H / (CFG === MOVIL ? 844 : 900); U = CFG === MOVIL ? W / CFG.base : Math.min(W / CFG.base, V * 1.05);
  };

  function P(lx: number, ly: number): Punto {
    const z = CFG.z0 + (CFG.ymax - ly) * CFG.dz;
    return { x: W * CFG.cx + (lx - 200) * CFG.kx * U / z, y: H * CFG.hor + CFG.hy * V / z, s: 1 / z, z };
  }

  /* curva suave por los vértices de la S */
  const S_LOGO: Array<[number, number, number]> = [];
  for (let i = 0; i < NODOS.length - 1; i++) {
    const p0 = NODOS[Math.max(0, i - 1)], p1 = NODOS[i], p2 = NODOS[i + 1], p3 = NODOS[Math.min(NODOS.length - 1, i + 2)];
    for (let k = 0; k < 28; k++) {
      const t = k / 28, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      S_LOGO.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1]), i + t]);
    }
  }
  S_LOGO.push([...NODOS[NODOS.length - 1], NODOS.length - 1]);

  /* ---------- fondo: estrellas y nebulosas vivas ---------- */
  let estrellas: Array<{ x: number; y: number; r: number; f: number; p: number }> = [];
  let texNube: HTMLCanvasElement[] = [];
  function ruido(w: number, h: number, semilla: number) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d') as CanvasRenderingContext2D; const img = x.createImageData(w, h);
    let s = semilla; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const oct = [[4, 0.5], [8, 0.25], [16, 0.15], [32, 0.1]].map(([n, a]) => ({ n, a, gr: Array.from({ length: (n + 1) * (n + 1) }, rnd) }));
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      let v = 0;
      for (const o of oct) {
        const fx = i / w * o.n, fy = j / h * o.n, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
        const G = (a: number, b: number) => o.gr[(b % (o.n + 1)) * (o.n + 1) + (a % (o.n + 1))];
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        v += o.a * lerp(lerp(G(x0, y0), G(x0 + 1, y0), sx), lerp(G(x0, y0 + 1), G(x0 + 1, y0 + 1), sx), sy);
      }
      const ex = (i / w - 0.5) * 2, ey = (j / h - 0.5) * 2, borde = clamp(1 - Math.pow(ex * ex + ey * ey, 0.9));
      const k = (j * w + i) * 4, a = clamp((v - 0.4) * 2.4) * borde;
      img.data[k] = 255; img.data[k + 1] = 255; img.data[k + 2] = 255; img.data[k + 3] = a * a * 255;
    }
    x.putImageData(img, 0, 0);
    return c;
  }
  function tintar(src: HTMLCanvasElement, color: string) {
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const x = c.getContext('2d') as CanvasRenderingContext2D;
    x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function prepararFondo() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    bg.width = W * dpr; bg.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    estrellas = Array.from({ length: Math.round(W * H / 2600) }, () => ({ x: rnd() * W, y: rnd() * H, r: rnd() < 0.08 ? 1.5 + rnd() : 0.4 + rnd() * 0.8, f: rnd() * 6.28, p: 0.2 + rnd() * 0.8 }));
    if (!texNube.length) {
      const a = ruido(256, 160, 12345), b = ruido(256, 160, 777);
      texNube = [tintar(a, NEBULA[0]), tintar(b, NEBULA[1]), tintar(a, NEBULA[2])];
    }
  }
  function pintarFondo(t: number) {
    g.globalCompositeOperation = 'source-over';
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#02030A'); grd.addColorStop(clamp(CFG.hor, 0.05, 0.95), '#0A1A44'); grd.addColorStop(1, '#03050D');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    const px = (camara.x + (camara.s - 1) * W * 0.5) * -0.04, py = (camara.y + (camara.s - 1) * H * 0.5) * -0.04;
    g.globalCompositeOperation = 'lighter';
    CFG.nubes.forEach((n, i) => {
      const tex = texNube[i % texNube.length];
      const w = W * n.w, h = H * n.h;
      const x = W * n.x + Math.sin(t * n.v + i) * W * 0.03 + px * (1 + i * 0.3), y = H * n.y + Math.cos(t * n.v * 0.8 + i) * H * 0.02 + py;
      g.globalAlpha = n.a * (0.82 + 0.18 * Math.sin(t * 0.25 + i * 2));
      g.save(); g.translate(x, y); g.rotate(Math.sin(t * 0.03 + i) * 0.08);
      g.drawImage(tex, -w / 2, -h / 2, w, h); g.restore();
    });
    g.globalAlpha = 1;
    const hy0 = H * clamp(CFG.hor, 0.08, 0.9);
    const rg = g.createRadialGradient(W * CFG.cx, hy0, 0, W * CFG.cx, hy0, Math.max(W, H) * 0.55);
    rg.addColorStop(0, 'rgba(76,135,255,.28)'); rg.addColorStop(0.4, 'rgba(59,110,255,.08)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    for (const e of estrellas) {
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.6 * e.p + e.f));
      g.globalAlpha = a * (e.r > 1.4 ? 1 : 0.8);
      g.fillStyle = e.r > 1.4 ? '#EAF2FF' : '#BFD4FF';
      g.beginPath(); g.arc(((e.x + px * e.p * 2) % W + W) % W, ((e.y + py * e.p * 2) % H + H) % H, e.r, 0, 6.283); g.fill();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  /* ---------- capas del SVG ---------- */
  const gPlaneta = el('g', { class: 'hz-planeta' }, hw);
  const gEjes = el('g', {}, hw);
  const gCinta = el('g', {}, hw);
  const cintaHalo = el('path', { class: 'hz-hw-halo' }, gCinta);
  const cintaBase = el('path', { class: 'hz-hw-base' }, gCinta);
  const cintaBordeA = el('path', { class: 'hz-hw-borde' }, gCinta);
  const cintaBordeB = el('path', { class: 'hz-hw-borde' }, gCinta);
  const cintaCentro = el('path', { class: 'hz-hw-centro' }, gCinta);
  const gPulsos = el('g', {}, hw);
  const pulsos = Array.from({ length: 5 }, () => el('ellipse', { class: 'hz-hw-pulso' }, gPulsos));
  const gEstrellas = el('g', {}, hw);
  const gRayos = el('g', {}, hw);
  const gNaves = el('g', {}, hw);
  const rutaHover = el('path', { class: 'hz-ruta' }, hw);
  const rutaPunta = el('circle', { class: 'hz-ruta-punta', r: 4 }, hw);
  const cabeza = el('circle', { class: 'hz-hw-cabeza', r: 5 }, hw);

  let proyS: Array<Punto & { k: number }> = [];
  const proyectarS = () => { proyS = S_LOGO.map(([x, y, k]) => ({ ...P(x, y), k })); };
  function cinta(hasta: number) {
    const pts = proyS.filter((p) => p.k <= hasta);
    if (pts.length < 2) { [cintaHalo, cintaBase, cintaBordeA, cintaBordeB, cintaCentro].forEach((p) => p.setAttribute('d', '')); return null; }
    const L: Array<[number, number]> = [], R: Array<[number, number]> = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let nx = -(b.y - a.y), ny = b.x - a.x; const m = Math.hypot(nx, ny) || 1; nx /= m; ny /= m;
      const w = CFG.anchoCinta * U * pts[i].s;
      L.push([pts[i].x + nx * w, pts[i].y + ny * w * CFG.aplaste]);
      R.push([pts[i].x - nx * w, pts[i].y - ny * w * CFG.aplaste]);
    }
    const linea = (arr: Array<[number, number]>) => 'M' + arr.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');
    const poly = linea(L) + ' L' + R.slice().reverse().map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L') + ' Z';
    cintaBase.setAttribute('d', poly); cintaHalo.setAttribute('d', poly);
    cintaBordeA.setAttribute('d', linea(L)); cintaBordeB.setAttribute('d', linea(R));
    cintaCentro.setAttribute('d', 'M' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L'));
    return pts[pts.length - 1];
  }
  function ejesH(op: number) {
    gEjes.innerHTML = '';
    for (const [[x1, y1], [x2, y2]] of EJES) {
      const pts: string[] = [];
      for (let i = 0; i <= 30; i++) { const p = P(lerp(x1, x2, i / 30), lerp(y1, y2, i / 30)); pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`); }
      el('path', { d: 'M' + pts.join(' L'), class: 'hz-hw-eje', style: `opacity:${op}` }, gEjes);
    }
  }
  function estrellasLogo() {
    gEstrellas.innerHTML = '';
    NODOS.forEach(([x, y], n) => {
      const p = P(x, y);
      const sede = servicios.some((s) => s.nodo === n);
      const gg = el('g', { transform: `translate(${p.x} ${p.y})`, class: 'hz-nodo' + (sede ? ' hz-nodo--sede' : ''), 'data-nodo': n }, gEstrellas);
      const r = (sede ? 34 : 14) * U * p.s;
      el('ellipse', { rx: r * 2.4, ry: r * 2.4 * CFG.aplaste, class: 'hz-nodo__halo' }, gg);
      el('path', { d: STAR, transform: `scale(${r / 9} ${(r / 9) * 0.5})`, class: 'hz-nodo__estrella' }, gg);
    });
  }

  /* ---------- planeta ---------- */
  function planeta() {
    gPlaneta.innerHTML = '';
    const R = CFG.planeta.r * W, C = CFG.planeta.cy * H;
    const defs = el('defs', {}, gPlaneta);
    const grad = (id: string, attrs: Record<string, string>, stops: Array<[string, string, string?]>) => {
      const r = el('radialGradient', { id, ...attrs }, defs);
      for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, ...(op ? { 'stop-opacity': op } : {}) }, r);
    };
    grad('hz-pl-sup', { cx: '50%', cy: '0%', r: '75%' }, [['0', '#16307A'], ['.18', '#08122E'], ['1', '#03060F']]);
    grad('hz-pl-atm', { cx: '50%', cy: '50%', r: '50%' }, [['.9', '#5C8CFF', '0'], ['.985', '#8FB3FF', '.7'], ['1', '#5C8CFF', '0']]);
    grad('hz-pl-haze', { cx: '50%', cy: '50%', r: '50%' }, [['.93', '#4C87FF', '0'], ['1', '#8FB3FF', '.55']]);
    grad('hz-pl-sombra', { cx: '50%', cy: '30%', r: '60%' }, [['0', '#000', '0'], ['1', '#000', '.6']]);
    el('circle', { cx: W / 2, cy: C, r: R * 1.04, fill: 'url(#hz-pl-atm)' }, gPlaneta);
    el('circle', { cx: W / 2, cy: C, r: R, fill: 'url(#hz-pl-sup)' }, gPlaneta);
    const cl = el('clipPath', { id: 'hz-pl-clip' }, defs); el('circle', { cx: W / 2, cy: C, r: R }, cl);
    const capa = el('g', { 'clip-path': 'url(#hz-pl-clip)' }, gPlaneta);
    el('circle', { cx: W / 2, cy: C, r: R, fill: 'url(#hz-pl-haze)' }, capa);
    el('rect', { x: 0, y: C - R, width: W, height: H, fill: 'url(#hz-pl-sombra)' }, capa);
    el('circle', { cx: W / 2, cy: C, r: R, fill: 'none', stroke: '#BFD4FF', 'stroke-opacity': '.55', 'stroke-width': 1.5 }, gPlaneta);
    let s = 3; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const lu = el('g', { class: 'hz-pl-luces' }, gPlaneta);
    for (let i = 0; i < 260; i++) {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 1.3, d = R * (0.7 + rnd() * 0.29);
      const x = W / 2 + Math.cos(a) * d, y = C + Math.sin(a) * d;
      const r = rnd() * 1.4 + 0.5, col = rnd() < 0.7 ? '#BFD4FF' : '#FFFFFF', op = (0.2 + rnd() * 0.6).toFixed(2);
      if (y < H + 10) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(2), fill: col, opacity: op }, lu);
    }
  }

  /* ---------- islas ---------- */
  const islas = servicios.map((s, i) => ({
    s, i,
    w: root.querySelector(`.hz-isla[data-i="${i}"]`) as HTMLDivElement,
    rayo: el('path', { class: 'hz-hw-rayo' }, gRayos),
    geo: null as Geo | null,
  }));
  function colocarIslas() {
    islas.forEach((it) => {
      const [x, y] = NODOS[it.s.nodo];
      const p = P(x, y);
      const ancho = CFG.anchoIsla * U * p.s;
      const lift = (CFG.lift + (CFG.liftIsla[it.i] || 0)) * U * p.s;
      const cx = p.x + (CFG.dxIsla[it.i] || 0) * W, sy = p.y - lift;
      const left = cx - ancho / 2, top = sy - ancho * 150 / 320;
      const punta = top + ancho * 300 / 320;
      it.geo = { cx, sy, ancho, left, top, base: p, punta };
      Object.assign(it.w.style, { left: `${left}px`, top: `${top}px`, width: `${ancho}px`, height: `${ancho * 300 / 320}px`, zIndex: String(Math.round(1000 - p.z * 100)) });
      it.w.style.setProperty('--s', p.s.toFixed(3));
      it.w.style.setProperty('--letrero', `${it.s.letrero}%`);
      it.w.style.setProperty('--niebla', String(clamp((p.z - 1.4) / 4)));
      it.rayo.setAttribute('d', `M${cx - ancho * 0.05},${punta - ancho * 0.03} L${cx + ancho * 0.05},${punta - ancho * 0.03} L${p.x + ancho * 0.16},${p.y} L${p.x - ancho * 0.16},${p.y} Z`);
    });
  }
  const geo = (i: number) => islas[i].geo as Geo;

  /* ---------- naves de tráfico ---------- */
  const PARES: Array<[number, number]> = [[0, 3], [3, 6], [6, 10], [0, 6], [10, 3], [6, 0]];
  const naves = PARES.map(([a, b], i) => {
    const gg = el('g', { class: 'hz-nave' }, gNaves);
    el('ellipse', { rx: 16, ry: 5, class: 'hz-nave__estela' }, gg);
    el('path', { d: 'M-8,0 Q-4,-5 6,-4 L12,0 L6,4 Q-4,5 -8,0 Z', class: 'hz-nave__casco' }, gg);
    el('circle', { cx: 5, cy: 0, r: 1.6, class: 'hz-nave__luz' }, gg);
    return { gg, a, b, t: i / PARES.length, v: 0.05 + (i % 3) * 0.015, alt: 60 + (i % 4) * 25 };
  });
  function moverNaves(dt: number) {
    for (const n of naves) {
      n.t = (n.t + dt * n.v) % 1;
      const [ax, ay] = NODOS[n.a], [bx, by] = NODOS[n.b];
      const t = n.t;
      const p = P(lerp(ax, bx, t), lerp(ay, by, t));
      const alt = Math.sin(t * Math.PI) * n.alt * U * p.s + CFG.lift * U * p.s * 0.6;
      const p2 = P(lerp(ax, bx, t + 0.01), lerp(ay, by, t + 0.01));
      const dir = p2.x >= p.x ? 1 : -1;
      const sc = Math.max(0.45, p.s * 2.6 * U);
      n.gg.setAttribute('transform', `translate(${p.x.toFixed(1)} ${(p.y - alt).toFixed(1)}) scale(${(sc * dir).toFixed(3)} ${sc.toFixed(3)})`);
      n.gg.style.opacity = String(Math.min(1, Math.sin(t * Math.PI) * 3));
    }
  }

  /* ---------- Cosmo y cámara ---------- */
  let cosmoEstado: Cosmo = { x: 0, y: 0, w: 0, rot: 0 };
  const cosmoReposo = (): Cosmo => ({ x: W * CFG.cosmo.x, y: H * CFG.cosmo.y, w: CFG.cosmo.w * U, rot: CFG.cosmo.rot });
  function ponerCosmo(st: Cosmo) {
    cosmoEstado = st;
    cosmo.style.transform = `translate(${st.x - st.w / 2}px, ${st.y - st.w * 0.3}px)`;
    cosmo.style.width = `${st.w}px`;
    cosmoNave.style.transform = `rotate(${st.rot}deg)`;
  }
  function decir(txt: string, conBoton = false) {
    burbuja.replaceChildren();
    const span = document.createElement('span'); span.textContent = txt; burbuja.appendChild(span);
    if (conBoton) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'hz-burbuja__si'; b.textContent = 'Sí, muéstrame';
      b.addEventListener('click', () => volar(0));
      burbuja.appendChild(b);
    }
    burbuja.classList.remove('is-on'); void burbuja.offsetWidth; burbuja.classList.add('is-on');
  }
  let camara: Cam = { s: 1, x: 0, y: 0 };
  function ponerCamara(c: Cam) { camara = c; cam.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.s})`; }

  /* ---------- estado ---------- */
  let fase: 'intro' | 'mapa' | 'vuelo' | 'zoom' | 'regreso' = 'intro';
  let hover = -1, tIdle = 0, invitado = false, vivo = true;
  const timers: number[] = [];
  const t0 = performance.now();
  let tPrev = t0;

  function aterrizaje(i: number) {
    const gg = geo(i), [vx, vy] = islas[i].s.pad;
    return { x: gg.left + gg.ancho * vx / 320, y: gg.top + gg.ancho * vy / 320 };
  }
  function rutaA(i: number) {
    if (i < 0) { rutaHover.setAttribute('d', ''); rutaPunta.style.opacity = '0'; return; }
    const a = cosmoEstado, b = aterrizaje(i);
    const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - H * 0.12;
    rutaHover.setAttribute('d', `M${a.x},${a.y - a.w * 0.05} Q${mx},${my} ${b.x},${b.y}`);
    rutaPunta.setAttribute('cx', String(b.x)); rutaPunta.setAttribute('cy', String(b.y)); rutaPunta.style.opacity = '1';
  }
  function estrellaSede(i: number) {
    gEstrellas.querySelectorAll<SVGGElement>('.hz-nodo--sede').forEach((n) => n.classList.toggle('is-on', i >= 0 && Number(n.dataset.nodo) === islas[i].s.nodo));
  }
  function setHover(i: number) {
    if (fase !== 'mapa' || hover === i) return;
    hover = i;
    islas.forEach((it, k) => { it.w.classList.toggle('is-hover', k === i); it.w.classList.remove('is-invita'); });
    root.classList.toggle('hay-hover', i >= 0);
    decir(i >= 0 ? `¿Te llevo a ${islas[i].s.corto}?` : saludo);
    rutaA(i); estrellaSede(i);
    tIdle = 0;
  }

  function volar(i: number) {
    if (fase === 'zoom') { volver(); timers.push(window.setTimeout(() => volar(i), quieto ? 50 : 1150)); return; }
    if (fase !== 'mapa' && fase !== 'intro') return;
    if (fase === 'intro') terminarIntro();
    fase = 'vuelo'; hover = -1;
    root.classList.remove('hay-hover'); root.classList.add('en-vuelo');
    islas.forEach((it, k) => { it.w.classList.remove('is-hover', 'is-invita'); it.w.classList.toggle('is-sel', k === i); });
    rutaA(-1); estrellaSede(-1);
    burbuja.classList.remove('is-on');
    const gg = geo(i), a = { ...cosmoEstado }, land = aterrizaje(i);
    const Z = clamp((W * CFG.zoomAncho) / gg.ancho, 1.2, 6);
    const obj = { x: W * CFG.zoomCentro[0], y: H * CFG.zoomCentro[1] };
    const camFin: Cam = { s: Z, x: obj.x - Z * gg.cx, y: obj.y - Z * (gg.top + gg.ancho * 0.36) };
    const landP = { x: camFin.x + Z * land.x, y: camFin.y + Z * land.y };
    const wFin = gg.ancho * Z * 0.17;
    const c1 = { x: lerp(a.x, land.x, 0.5) + (land.x > a.x ? -1 : 1) * W * 0.04, y: Math.min(a.y, land.y) - H * 0.18 };
    const fin = () => {
      ponerCamara(camFin);
      ponerCosmo({ x: landP.x, y: landP.y, w: wFin, rot: 0 });
      fase = 'zoom';
      root.classList.remove('en-vuelo'); root.classList.add('en-zoom');
      cosmo.classList.add('is-aterrizado');
      ev.onLlegar(i);
      decir(islas[i].s.tour);
      timers.push(window.setTimeout(() => { if (fase === 'zoom') burbuja.classList.remove('is-on'); }, 2600));
    };
    if (quieto) { fin(); return; }
    const dur = 1500, ini = performance.now();
    const paso = (now: number) => {
      if (!vivo) return;
      const t = clamp((now - ini) / dur), e = ease(t);
      const wx = (1 - e) * (1 - e) * a.x + 2 * (1 - e) * e * c1.x + e * e * land.x;
      const wy = (1 - e) * (1 - e) * a.y + 2 * (1 - e) * e * c1.y + e * e * land.y;
      const cs = lerp(1, Z, ease(clamp((t - 0.08) / 0.92)));
      const k = ease(clamp(t * 1.1));
      const qx = lerp(a.x, landP.x, k), qy = lerp(a.y, landP.y, k);
      ponerCamara({ s: cs, x: qx - cs * wx, y: qy - cs * wy });
      ponerCosmo({ x: qx, y: qy, w: lerp(a.w, wFin, easeOut(t)), rot: Math.sin(t * Math.PI) * (land.x > a.x ? 14 : -14) });
      if (t < 1) requestAnimationFrame(paso); else fin();
    };
    requestAnimationFrame(paso);
  }

  function volver() {
    if (fase !== 'zoom') return;
    fase = 'regreso';
    ev.onSalir();
    cosmo.classList.remove('is-aterrizado');
    burbuja.classList.remove('is-on');
    root.classList.remove('en-zoom'); root.classList.add('en-vuelo');
    const c0 = { ...camara }, a = { ...cosmoEstado }, b = cosmoReposo();
    const fin = () => {
      ponerCamara({ s: 1, x: 0, y: 0 }); ponerCosmo(b);
      root.classList.remove('en-vuelo');
      fase = 'mapa';
      islas.forEach((it) => it.w.classList.remove('is-sel'));
      decir(saludo); tIdle = 0; invitado = true;
    };
    if (quieto) { fin(); return; }
    const ini = performance.now(), dur = 1100;
    const paso = (now: number) => {
      if (!vivo) return;
      const t = clamp((now - ini) / dur), e = ease(t);
      ponerCamara({ s: lerp(c0.s, 1, e), x: lerp(c0.x, 0, e), y: lerp(c0.y, 0, e) });
      ponerCosmo({ x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) - Math.sin(t * Math.PI) * H * 0.06, w: lerp(a.w, b.w, e), rot: b.rot });
      if (t < 1) requestAnimationFrame(paso); else fin();
    };
    requestAnimationFrame(paso);
  }

  /* ---------- montaje ---------- */
  function montar() {
    W = window.innerWidth; H = window.innerHeight; elegirConfig();
    hw.setAttribute('width', String(W)); hw.setAttribute('height', String(H)); hw.setAttribute('viewBox', `0 0 ${W} ${H}`);
    prepararFondo(); proyectarS(); planeta(); ejesH(fase === 'intro' ? 0 : 1); estrellasLogo(); colocarIslas();
    if (fase !== 'intro') cinta(99);
    ponerCosmo(cosmoReposo());
  }
  montar();
  let tResize = 0;
  const onResize = () => {
    window.clearTimeout(tResize);
    tResize = window.setTimeout(() => {
      if (fase === 'zoom' || fase === 'vuelo' || fase === 'regreso') { root.classList.remove('en-zoom', 'en-vuelo'); ev.onSalir(); fase = 'mapa'; ponerCamara({ s: 1, x: 0, y: 0 }); islas.forEach((it) => it.w.classList.remove('is-sel')); cosmo.classList.remove('is-aterrizado'); }
      montar();
    }, 120);
  };
  window.addEventListener('resize', onResize);

  const quitar: Array<() => void> = [];
  islas.forEach((it, i) => {
    const hit = it.w.querySelector('.hz-isla__hit') as HTMLButtonElement;
    const on = () => setHover(i), off = () => setHover(-1), clic = () => volar(i);
    hit.addEventListener('mouseenter', on); hit.addEventListener('mouseleave', off);
    hit.addEventListener('focus', on); hit.addEventListener('blur', off);
    hit.addEventListener('click', clic);
    quitar.push(() => { hit.removeEventListener('mouseenter', on); hit.removeEventListener('mouseleave', off); hit.removeEventListener('focus', on); hit.removeEventListener('blur', off); hit.removeEventListener('click', clic); });
  });
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') volver(); };
  window.addEventListener('keydown', onKey);

  /* ---------- intro y bucle ---------- */
  const DUR_LOGO = quieto ? 0 : 1500;
  islas.forEach((it) => it.w.classList.add('is-oculta'));
  cosmo.classList.add('is-oculto');
  function terminarIntro() {
    cinta(99); ejesH(1); cabeza.style.opacity = '0';
    gEstrellas.querySelectorAll<SVGGElement>('.hz-nodo').forEach((n) => { n.style.opacity = '1'; });
    islas.forEach((it) => it.w.classList.remove('is-oculta'));
    cosmo.classList.remove('is-oculto');
    fase = 'mapa'; decir(saludo); tIdle = 0;
  }
  let raf = 0;
  function bucle(now: number) {
    if (!vivo) return;
    const t = (now - t0) / 1000, dtReal = (now - tPrev) / 1000, dt = Math.min(0.05, dtReal); tPrev = now;
    pintarFondo(quieto ? 0 : t);
    if (fase === 'intro') {
      const k = DUR_LOGO ? clamp((now - t0 - 300) / DUR_LOGO) : 1;
      const c = cinta(easeOut(k) * (NODOS.length - 1));
      if (c) { cabeza.setAttribute('cx', String(c.x)); cabeza.setAttribute('cy', String(c.y)); cabeza.setAttribute('r', String(7 * U * c.s + 2)); cabeza.style.opacity = k < 1 ? '1' : '0'; }
      ejesH(clamp((k - 0.6) / 0.4));
      gEstrellas.querySelectorAll<SVGGElement>('.hz-nodo').forEach((n) => { n.style.opacity = easeOut(k) * (NODOS.length - 1) >= Number(n.dataset.nodo) - 0.05 ? '1' : '0'; });
      islas.forEach((it, i) => { if (now - t0 > 300 + DUR_LOGO * 0.75 + i * 140) it.w.classList.remove('is-oculta'); });
      if (now - t0 > 300 + DUR_LOGO + 500) cosmo.classList.remove('is-oculto');
      if (now - t0 > 300 + DUR_LOGO + 900) { fase = 'mapa'; decir(saludo); tIdle = 0; }
    } else if (!quieto) {
      const n = proyS.length;
      pulsos.forEach((e, j) => {
        const p = proyS[Math.floor(((t * 0.06 + j / pulsos.length) % 1) * (n - 1))];
        e.setAttribute('cx', p.x.toFixed(1)); e.setAttribute('cy', p.y.toFixed(1));
        e.setAttribute('rx', (22 * U * p.s).toFixed(1)); e.setAttribute('ry', (22 * U * p.s * CFG.aplaste).toFixed(1));
      });
    }
    if (!quieto) moverNaves(dt); else if (t < 0.1) moverNaves(0);
    if (fase === 'mapa') {
      tIdle += dtReal;
      if (!invitado && tIdle > 3) {
        invitado = true;
        islas[0].w.classList.add('is-invita');
        estrellaSede(0);
        decir('¿Te muestro?', true);
      }
      if (hover >= 0) rutaA(hover);
    }
    raf = requestAnimationFrame(bucle);
  }
  raf = requestAnimationFrame(bucle);

  return {
    volar,
    volver,
    destruir() {
      vivo = false;
      cancelAnimationFrame(raf);
      timers.forEach((x) => window.clearTimeout(x));
      window.clearTimeout(tResize);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      quitar.forEach((f) => f());
      hw.querySelectorAll(':scope > g, :scope > path, :scope > circle').forEach((n) => n.remove());
    },
  };
}
