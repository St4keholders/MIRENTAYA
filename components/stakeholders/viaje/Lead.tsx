/* ============================================================
   EL LEAD · empresario en estilo flat (mismas reglas que Cosmo:
   sin contornos, sin degradados en el personaje).
   Su ánimo cambia a lo largo del viaje: aterrado → feliz.
   ============================================================ */

export type Animo = 'terror' | 'miedo' | 'nervioso' | 'atento' | 'tranquilo' | 'feliz';
export type PoseBrazos = 'agitando' | 'abajo' | 'arriba' | 'agarrado' | 'saludo';

const PIEL = '#D9A07A';
const PIEL_SOMBRA = '#C38862';
const PELO = '#2A1E18';
const SACO = '#5B6273';
const SACO_OSCURO = '#474D5C';
const PANTALON = '#4A5162';
const CAMISA = '#EEF1F6';
const CORBATA = '#2E3A55';
const ZAPATO = '#1C1F28';
const BOCA = '#3A1A1A';

/** Ángulos de los brazos (grados, 0 = colgando) */
const BRAZOS: Record<PoseBrazos, [number, number]> = {
  agitando: [148, -148],
  abajo: [12, -12],
  arriba: [165, -165],
  agarrado: [52, -52],
  saludo: [12, -158],
};

function Cara({ animo }: { animo: Animo }) {
  switch (animo) {
    case 'terror':
      return (
        <g>
          {/* cejas disparadas */}
          <path d="M78,58 Q86,48 95,55" stroke={PELO} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M122,58 Q114,48 105,55" stroke={PELO} strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* ojos enormes, pupila mínima */}
          <circle cx="86" cy="72" r="10" fill="#fff" />
          <circle cx="114" cy="72" r="10" fill="#fff" />
          <circle cx="86" cy="73" r="2.4" fill="#111" />
          <circle cx="114" cy="73" r="2.4" fill="#111" />
          {/* grito */}
          <ellipse cx="100" cy="98" rx="10" ry="13" fill={BOCA} />
          <ellipse cx="100" cy="105" rx="6" ry="4" fill="#C2545A" />
          <rect x="93" y="86" width="14" height="4" rx="2" fill="#fff" />
          {/* sudor */}
          <path d="M66,62 q-5,9 0,12 q5,-3 0,-12z" fill="#9CC3FF" />
          <path d="M136,58 q-4,8 0,10 q4,-2 0,-10z" fill="#9CC3FF" />
        </g>
      );
    case 'miedo':
      return (
        <g>
          <path d="M78,60 Q87,53 95,58" stroke={PELO} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M122,60 Q113,53 105,58" stroke={PELO} strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="86" cy="73" r="8" fill="#fff" />
          <circle cx="114" cy="73" r="8" fill="#fff" />
          <circle cx="86" cy="74" r="3" fill="#111" />
          <circle cx="114" cy="74" r="3" fill="#111" />
          {/* mueca con dientes */}
          <rect x="88" y="92" width="24" height="10" rx="4" fill="#fff" />
          <path d="M88,97 h24 M94,92 v10 M100,92 v10 M106,92 v10" stroke="#C9CED8" strokeWidth="1" />
          <path d="M136,62 q-4,8 0,10 q4,-2 0,-10z" fill="#9CC3FF" />
        </g>
      );
    case 'nervioso':
      return (
        <g>
          <path d="M79,62 Q87,57 95,60" stroke={PELO} strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <path d="M121,62 Q113,57 105,60" stroke={PELO} strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <ellipse cx="87" cy="74" rx="4" ry="5" fill="#111" />
          <ellipse cx="113" cy="74" rx="4" ry="5" fill="#111" />
          <circle cx="88.4" cy="72.4" r="1.3" fill="#fff" />
          <circle cx="114.4" cy="72.4" r="1.3" fill="#fff" />
          <path d="M89,98 q4,-3 7,0 q4,3 7,0 q3,-3 6,0" stroke={BOCA} strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'atento':
      return (
        <g>
          <path d="M79,61 Q87,58 95,61" stroke={PELO} strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <path d="M121,61 Q113,58 105,61" stroke={PELO} strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <ellipse cx="87" cy="74" rx="4.2" ry="5" fill="#111" />
          <ellipse cx="113" cy="74" rx="4.2" ry="5" fill="#111" />
          <circle cx="88.6" cy="72.4" r="1.4" fill="#fff" />
          <circle cx="114.6" cy="72.4" r="1.4" fill="#fff" />
          <ellipse cx="100" cy="98" rx="4" ry="4.6" fill={BOCA} />
        </g>
      );
    case 'tranquilo':
      return (
        <g>
          <path d="M79,62 Q87,59 95,62" stroke={PELO} strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <path d="M121,62 Q113,59 105,62" stroke={PELO} strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <path d="M82,75 q5,-4 10,0" stroke="#111" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M108,75 q5,-4 10,0" stroke="#111" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M90,95 q10,9 20,0" stroke={BOCA} strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <ellipse cx="78" cy="88" rx="5" ry="3" fill="#E9877A" opacity=".45" />
          <ellipse cx="122" cy="88" rx="5" ry="3" fill="#E9877A" opacity=".45" />
        </g>
      );
    case 'feliz':
    default:
      return (
        <g>
          <path d="M79,59 Q87,54 95,58" stroke={PELO} strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <path d="M121,59 Q113,54 105,58" stroke={PELO} strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <path d="M81,76 q6,-7 12,0" stroke="#111" strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <path d="M107,76 q6,-7 12,0" stroke="#111" strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <path d="M86,91 h28 q-2,17 -14,17 q-12,0 -14,-17z" fill={BOCA} />
          <path d="M88,91 h24 v4 h-24z" fill="#fff" />
          <ellipse cx="100" cy="103" rx="6" ry="3" fill="#C2545A" />
          <ellipse cx="77" cy="88" rx="6" ry="3.4" fill="#E9877A" opacity=".55" />
          <ellipse cx="123" cy="88" rx="6" ry="3.4" fill="#E9877A" opacity=".55" />
        </g>
      );
  }
}

function Brazo({ lado, angulo }: { lado: 'izq' | 'der'; angulo: number }) {
  const x = lado === 'izq' ? 70 : 130;
  return (
    <g className={`ld-brazo ld-brazo--${lado}`} style={{ transformOrigin: `${x}px 146px`, transform: `rotate(${angulo}deg)` }}>
      <rect x={x - 9} y="140" width="18" height="62" rx="9" fill={SACO} />
      <rect x={x - 9} y="192" width="18" height="8" rx="2" fill={CAMISA} />
      <circle cx={x} cy="208" r="9" fill={PIEL} />
    </g>
  );
}

/** Empresario de cuerpo entero. Sistema de coordenadas 0 0 200 320. */
export function Lead({ animo, brazos = 'abajo', despeinado = false }: { animo: Animo; brazos?: PoseBrazos; despeinado?: boolean }) {
  const [ai, ad] = BRAZOS[brazos];
  return (
    <g className={`ld ld--${animo} ld--${brazos}`}>
      {/* piernas */}
      <g className="ld-piernas">
        <rect x="76" y="222" width="22" height="78" rx="9" fill={PANTALON} />
        <rect x="102" y="222" width="22" height="78" rx="9" fill={PANTALON} />
        <path d="M70,298 h30 v8 q0,6 -6,6 h-24 q-6,0 -6,-6z" fill={ZAPATO} />
        <path d="M100,298 h30 v8 q0,6 -6,6 h-24 q-6,0 -6,-6z" fill={ZAPATO} />
      </g>
      <Brazo lado="izq" angulo={ai} />
      {/* torso */}
      <path d="M72,138 Q100,128 128,138 L134,226 L66,226 Z" fill={SACO} />
      <path d="M88,134 L100,170 L112,134 Q100,130 88,134Z" fill={CAMISA} />
      <path d="M96,138 h8 l-2,6 h-4z" fill={CORBATA} />
      <path d="M97,144 h6 l3,30 l-6,8 l-6,-8z" fill={CORBATA} />
      <path d="M86,134 L100,172 L82,150 L80,138Z" fill={SACO_OSCURO} />
      <path d="M114,134 L100,172 L118,150 L120,138Z" fill={SACO_OSCURO} />
      <circle cx="100" cy="196" r="2.2" fill={SACO_OSCURO} />
      <Brazo lado="der" angulo={ad} />
      {/* cuello y cabeza */}
      <g className="ld-cabeza" style={{ transformOrigin: '100px 128px' }}>
        <rect x="92" y="112" width="16" height="20" rx="6" fill={PIEL_SOMBRA} />
        <ellipse cx="61" cy="80" rx="7" ry="10" fill={PIEL_SOMBRA} />
        <ellipse cx="139" cy="80" rx="7" ry="10" fill={PIEL_SOMBRA} />
        <ellipse cx="100" cy="78" rx="38" ry="42" fill={PIEL} />
        {/* pelo con raya al lado */}
        <path d="M62,70 Q60,34 100,32 Q140,32 139,70 Q132,52 112,50 Q98,58 80,52 Q66,56 62,70Z" fill={PELO} />
        {despeinado && (
          <g fill={PELO}>
            <path d="M80,40 l-6,-14 l12,10z" />
            <path d="M100,34 l2,-16 l7,15z" />
            <path d="M120,40 l10,-12 l-3,15z" />
          </g>
        )}
        <Cara animo={animo} />
      </g>
    </g>
  );
}

/** Maletín abierto y facturas (para la caída) */
export function Maletin() {
  return (
    <g>
      <rect x="0" y="10" width="64" height="44" rx="6" fill="#3A2A20" />
      <rect x="0" y="10" width="64" height="8" rx="3" fill="#2A1E16" />
      <rect x="24" y="2" width="16" height="10" rx="3" fill="none" stroke="#2A1E16" strokeWidth="4" />
      <rect x="28" y="26" width="8" height="6" rx="1.5" fill="#F0B93C" />
    </g>
  );
}

export function Factura({ tono = 0 }: { tono?: number }) {
  return (
    <g>
      <path d="M0,0 h34 l8,8 v42 h-42z" fill={tono ? '#DDE6F7' : '#F4F6FB'} />
      <path d="M34,0 v8 h8z" fill="#BFCBE3" />
      <rect x="6" y="12" width="20" height="3" rx="1.5" fill="#9AA6BF" />
      <rect x="6" y="20" width="28" height="2.4" rx="1.2" fill="#C2CADB" />
      <rect x="6" y="26" width="24" height="2.4" rx="1.2" fill="#C2CADB" />
      <rect x="6" y="32" width="28" height="2.4" rx="1.2" fill="#C2CADB" />
      <rect x="22" y="40" width="14" height="4" rx="2" fill="#3B6EFF" opacity=".7" />
    </g>
  );
}
