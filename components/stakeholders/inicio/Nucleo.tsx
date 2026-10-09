/* ============================================================
   NÚCLEO DE LA ESTACIÓN · torre central con el logo SH, de donde
   salen los brazos que sostienen el anillo de sedes.
   Coordenadas: 0 0 200 300. El anillo pasa por y = 230.
   ============================================================ */

const STAR = 'M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z';

export function Nucleo() {
  return (
    <svg className="ini3-nucleo__svg" viewBox="0 0 200 300" overflow="visible" aria-hidden="true">
      <defs>
        <linearGradient id="nc-cuerpo" x1="0" x2="1">
          <stop offset="0" stopColor="#4A62B8" />
          <stop offset=".45" stopColor="#24326E" />
          <stop offset="1" stopColor="#0B1024" />
        </linearGradient>
        <linearGradient id="nc-collar" x1="0" x2="1">
          <stop offset="0" stopColor="#5D7BE0" />
          <stop offset=".5" stopColor="#2B3C80" />
          <stop offset="1" stopColor="#0D1228" />
        </linearGradient>
        <radialGradient id="nc-cupula" cx=".35" cy=".3">
          <stop offset="0" stopColor="#DCE6FF" stopOpacity=".55" />
          <stop offset=".6" stopColor="#3B6EFF" stopOpacity=".25" />
          <stop offset="1" stopColor="#14204D" stopOpacity=".9" />
        </radialGradient>
        <radialGradient id="nc-halo">
          <stop offset="0" stopColor="#4C87FF" stopOpacity=".45" />
          <stop offset="1" stopColor="#4C87FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="150" rx="110" ry="150" fill="url(#nc-halo)" />
      {/* antena y plato */}
      <line x1="100" y1="34" x2="100" y2="4" stroke="#8B95A8" strokeWidth="2.4" />
      <circle className="ini-baliza" cx="100" cy="3" r="4" fill="#DCE6FF" />
      <path d="M118,40 q16,-14 30,-4 q-10,14 -30,4 Z" fill="#8B95A8" />
      <line x1="118" y1="40" x2="110" y2="50" stroke="#8B95A8" strokeWidth="2" />
      {/* cúpula */}
      <path d="M62,78 A38,40 0 0 1 138,78 Z" fill="url(#nc-cupula)" />
      <path d="M62,78 A38,40 0 0 1 138,78" fill="none" stroke="#8FB3FF" strokeOpacity=".6" strokeWidth="1.4" />
      <path d="M72,66 A28,30 0 0 1 90,46" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* torre */}
      <path d="M58,78 H142 V262 A42,10 0 0 1 58,262 Z" fill="url(#nc-cuerpo)" />
      <ellipse cx="100" cy="78" rx="42" ry="9" fill="#5D7BE0" />
      {/* hileras de ventanas que siguen la curva del cilindro */}
      {[100, 122, 144, 166, 188].map((y, f) => (
        <g key={y}>
          {[-30, -18, -6, 6, 18, 30].map((dx, c) => {
            const k = 1 - Math.abs(dx) / 42;
            return (
              <rect
                key={c}
                className="ini-luz"
                x={100 + dx - 3.5 * k}
                y={y + (1 - k) * 4}
                width={7 * k}
                height="9"
                rx="1"
                fill="#F0B93C"
                opacity={0.25 + 0.6 * (dx < 10 ? 1 : 0.4)}
                style={{ animationDelay: `${(f * 6 + c) * 0.37 % 5}s` }}
              />
            );
          })}
        </g>
      ))}
      {/* logo SH */}
      <g transform="translate(100 214)">
        <circle r="15" fill="#0D1330" stroke="#8FB3FF" strokeOpacity=".6" />
        <path d={STAR} fill="#4C87FF" transform="scale(1.2)" />
      </g>
      {/* collar donde se unen los brazos del anillo */}
      <path d="M44,226 H156 V238 A56,12 0 0 1 44,238 Z" fill="url(#nc-collar)" />
      <ellipse cx="100" cy="226" rx="56" ry="12" fill="#6F8CEB" />
      <ellipse cx="100" cy="226" rx="44" ry="8" fill="#2B3C80" />
      {[52, 76, 100, 124, 148].map((x, i) => (
        <circle key={x} className="ini-pista__luz" cx={x} cy={240 + (Math.abs(x - 100) < 30 ? 2 : 0)} r="2" fill="#8FB3FF" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
      {/* propulsor inferior */}
      <path d="M78,262 L86,284 H114 L122,262 Z" fill="#1B2347" />
      <ellipse className="ini-propulsor" cx="100" cy="292" rx="22" ry="10" fill="#4C87FF" opacity=".5" />
    </svg>
  );
}
