/* ============================================================
   CONSTELACIÓN · "STAKEHOLDERS" escrito con estrellas unidas por
   líneas, como una constelación al fondo del inicio.
   Cada letra vive en una cuadrícula de 4 × 6.
   ============================================================ */

type Trazo = Array<[number, number]>;

const LETRAS: Record<string, Trazo[]> = {
  S: [[[4, 0.4], [3, 0], [1, 0], [0, 1], [0, 2.2], [1, 3], [3, 3], [4, 3.8], [4, 5], [3, 6], [1, 6], [0, 5.6]]],
  T: [[[0, 0], [2, 0], [4, 0]], [[2, 0], [2, 3], [2, 6]]],
  A: [[[0, 6], [1, 3], [2, 0], [3, 3], [4, 6]], [[1, 3], [3, 3]]],
  K: [[[0, 0], [0, 3], [0, 6]], [[4, 0], [0, 3.4], [4, 6]]],
  E: [[[4, 0], [0, 0], [0, 3], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
  H: [[[0, 0], [0, 3], [0, 6]], [[4, 0], [4, 3], [4, 6]], [[0, 3], [4, 3]]],
  O: [[[1, 0], [3, 0], [4, 1.5], [4, 4.5], [3, 6], [1, 6], [0, 4.5], [0, 1.5], [1, 0]]],
  L: [[[0, 0], [0, 3], [0, 6], [4, 6]]],
  D: [[[0, 0], [0, 6], [2.6, 6], [4, 4.4], [4, 1.6], [2.6, 0], [0, 0]]],
  R: [[[0, 6], [0, 3], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[2, 3], [4, 6]]],
};

const PALABRA = 'STAKEHOLDERS';
const PASO = 6.2; // ancho de letra + espacio

export function Constelacion({ className = '' }: { className?: string }) {
  const lineas: string[] = [];
  const estrellas = new Map<string, [number, number]>();
  PALABRA.split('').forEach((ch, i) => {
    const ox = i * PASO;
    for (const t of LETRAS[ch] ?? []) {
      lineas.push(t.map(([x, y], k) => `${k ? 'L' : 'M'}${(ox + x).toFixed(2)},${y}`).join(' '));
      for (const [x, y] of t) estrellas.set(`${(ox + x).toFixed(2)},${y}`, [ox + x, y]);
    }
  });
  const ancho = (PALABRA.length - 1) * PASO + 4;
  return (
    <svg className={`ini-constelacion ${className}`} viewBox={`-1 -1 ${ancho + 2} 8`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path d={lineas.join(' ')} fill="none" className="ini-constelacion__lineas" />
      {[...estrellas.values()].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 7 === 0 ? 0.2 : 0.13}
          className="ini-constelacion__estrella"
          style={{ animationDelay: `${(i * 0.37) % 4}s` }}
        />
      ))}
    </svg>
  );
}
