// Íconos y emoticones propios de la app, en SVG (se ven igual en cualquier dispositivo).
// Todos dibujados en una grilla de 64x64. Para sumar uno: una entrada nueva en ICONOS.

const T = '#2b2233'; // trazo oscuro
const P = '#ffcf6b'; // piel / amarillo cara
const PS = '#e8a93a'; // sombra de piel

const cara = (extra) => (
  <>
    <circle cx="32" cy="32" r="27" fill={P} />
    <path d="M10 38a24 24 0 0 0 44 0a27 27 0 0 1-44 0z" fill={PS} opacity=".55" />
    {extra}
  </>
);

const mano = (dedos) => (
  <>
    <path d={dedos} fill={P} stroke={T} strokeWidth="2.5" strokeLinejoin="round" />
  </>
);

export const ICONOS = {
  // ---------- Emoticones ----------
  fuckyou: (
    <>
      {/* puño con el dedo del medio levantado */}
      <rect x="27" y="4" width="10" height="30" rx="5" fill={P} stroke={T} strokeWidth="2.5" />
      <path d="M14 30c0-3 2-5 5-5h26c3 0 5 2 5 5v14c0 9-7 16-16 16h-4c-9 0-16-7-16-16z" fill={P} stroke={T} strokeWidth="2.5" />
      <path d="M19 25v9M27 34v-4M37 30v4M45 25v9" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 38c4 3 9 3 12 0" stroke={T} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M29 8h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".6" />
    </>
  ),
  risa: cara(
    <>
      <path d="M17 24q5-6 10 0M37 24q5-6 10 0" stroke={T} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M16 34h32q-2 16-16 16t-16-16z" fill="#7a2232" />
      <path d="M22 44q10 6 20 0q-3 6-10 6t-10-6z" fill="#ff7a8a" />
      <path d="M8 26q-4 6 0 12M56 26q4 6 0 12" stroke="#4fc3f7" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>,
  ),
  llanto: cara(
    <>
      <path d="M18 26q5-3 9 0M37 26q5-3 9 0" stroke={T} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M22 46q10-9 20 0" stroke={T} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M20 29v22M44 29v22" stroke="#4fc3f7" strokeWidth="5" strokeLinecap="round" />
    </>,
  ),
  enojo: (
    <>
      <circle cx="32" cy="32" r="27" fill="#ff6b5b" />
      <path d="M15 22l12 5M49 22l-12 5" stroke={T} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="23" cy="31" r="3.5" fill={T} />
      <circle cx="41" cy="31" r="3.5" fill={T} />
      <path d="M22 47q10-8 20 0" stroke={T} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M50 6l-3 6 6-2-3 6" stroke={T} strokeWidth="2" fill="none" />
    </>
  ),
  beso: cara(
    <>
      <path d="M18 27q5-4 9 0" stroke={T} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="42" cy="27" r="3.5" fill={T} />
      <path d="M30 38q6 2 0 5q6 2 0 6" stroke={T} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M48 44c0-3 4-3 4 0c0-3 4-3 4 0c0 3-4 6-4 6s-4-3-4-6z" fill="#ff3d6e" />
    </>,
  ),
  corazon: <path d="M32 56S6 40 6 22C6 12 13 7 20 7c6 0 10 4 12 8c2-4 6-8 12-8c7 0 14 5 14 15c0 18-26 34-26 34z" fill="#ff3d6e" stroke="#c2185b" strokeWidth="2.5" />,
  fuego: (
    <>
      <path d="M32 60c-13 0-21-9-21-20c0-12 10-17 10-28c6 4 9 9 9 15c3-3 4-7 4-12c10 6 19 15 19 26c0 11-8 19-21 19z" fill="#ff7a1a" />
      <path d="M32 60c-7 0-11-5-11-11c0-7 7-10 8-17c6 5 13 10 13 17c0 6-4 11-10 11z" fill="#ffd54a" />
    </>
  ),
  aplauso: (
    <>
      {mano('M16 50l-6-20c-1-3 3-5 5-2l6 10-3-16c-1-3 4-4 5-1l4 14v-18c0-3 5-3 5 0v20l3-12c1-3 5-2 5 1l-3 18c-1 8-6 13-14 13c-3 0-5-3-7-7z')}
      <path d="M44 10l4-6M50 16l7-2M48 24l7 3" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  facha: cara(
    <>
      <path d="M10 25h44v4c0 6-4 9-9 9s-9-3-10-8h-6c-1 5-5 8-10 8s-9-3-9-9z" fill={T} />
      <path d="M14 27l6 0M39 27l6 0" stroke="#fff" strokeWidth="2" opacity=".5" strokeLinecap="round" />
      <path d="M22 46q12 6 22-4" stroke={T} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>,
  ),
  pulgar: mano('M20 58h-8V30h8zM22 30l10-20c2-4 8-3 8 2l-2 12h14c4 0 6 4 5 7l-5 20c-1 4-4 7-8 7H22z'),
  sorpresa: cara(
    <>
      <circle cx="22" cy="25" r="5" fill="#fff" stroke={T} strokeWidth="2.5" />
      <circle cx="42" cy="25" r="5" fill="#fff" stroke={T} strokeWidth="2.5" />
      <circle cx="22" cy="25" r="2" fill={T} />
      <circle cx="42" cy="25" r="2" fill={T} />
      <ellipse cx="32" cy="45" rx="6" ry="8" fill="#7a2232" />
    </>,
  ),
  caca: (
    <>
      <path d="M12 52c-4 0-6-6-1-9c-3-4 0-9 5-9c-1-5 4-9 9-7c1-5 6-10 12-9c-3 4 2 6 5 9c5 1 7 6 4 9c5 1 8 7 4 11c3 4 0 8-5 8H16c-2 0-4-1-4-3z" fill="#8d5a3b" stroke="#5e3a24" strokeWidth="2.5" />
      <circle cx="25" cy="40" r="3.5" fill="#fff" />
      <circle cx="39" cy="40" r="3.5" fill="#fff" />
      <circle cx="25" cy="40" r="1.6" fill={T} />
      <circle cx="39" cy="40" r="1.6" fill={T} />
      <path d="M26 48q6 4 12 0" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  ojitos: cara(
    <>
      <path d="M16 26q6-5 12 0M36 26q6-5 12 0" stroke={T} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M24 42q8 5 16 0" stroke={T} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="16" cy="36" rx="5" ry="3" fill="#ff8aa0" opacity=".8" />
      <ellipse cx="48" cy="36" rx="5" ry="3" fill="#ff8aa0" opacity=".8" />
    </>,
  ),

  // ---------- Juegos ----------
  barco: (
    <>
      <path d="M30 6v26H14z" fill="#ffb703" />
      <path d="M34 12v20h14z" fill="#8ecae6" />
      <path d="M32 6v28" stroke={T} strokeWidth="2.5" />
      <path d="M6 36h52l-8 14H14z" fill="#e63946" stroke={T} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M4 56c5 0 5-3 10-3s5 3 10 3 5-3 10-3 5 3 10 3 5-3 10-3 5 3 6 3" stroke="#219ebc" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </>
  ),
  horca: (
    <>
      <path d="M10 58h30M18 58V8h26v8" stroke="#8d5a3b" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="44" cy="24" r="7" fill="none" stroke={T} strokeWidth="3" />
      <path d="M44 31v14M44 35l-7 7M44 35l7 7M44 45l-6 9M44 45l6 9" stroke={T} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  sandia: (
    <>
      <path d="M6 22h52a26 26 0 0 1-52 0z" fill="#2e9e4f" />
      <path d="M10 22h44a22 22 0 0 1-44 0z" fill="#e9fbe1" />
      <path d="M13 22h38a19 19 0 0 1-38 0z" fill="#ff4d5e" />
      <path d="M24 30l1 4M32 32v4M40 30l-1 4M28 38l1 3M36 38l-1 3" stroke={T} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  dados: (
    <>
      <rect x="6" y="20" width="30" height="30" rx="7" fill="#fff" stroke={T} strokeWidth="2.5" transform="rotate(-12 21 35)" />
      <circle cx="14" cy="30" r="3" fill={T} />
      <circle cx="21" cy="36" r="3" fill={T} />
      <circle cx="28" cy="42" r="3" fill={T} />
      <rect x="30" y="10" width="28" height="28" rx="7" fill="#e63946" stroke={T} strokeWidth="2.5" transform="rotate(14 44 24)" />
      <circle cx="39" cy="19" r="3" fill="#fff" />
      <circle cx="49" cy="29" r="3" fill="#fff" />
    </>
  ),
  uno: (
    <>
      <rect x="6" y="14" width="28" height="40" rx="5" fill="#1e88e5" stroke="#fff" strokeWidth="3" transform="rotate(-14 20 34)" />
      <rect x="20" y="10" width="28" height="40" rx="5" fill="#fbc02d" stroke="#fff" strokeWidth="3" transform="rotate(-2 34 30)" />
      <rect x="32" y="10" width="28" height="40" rx="5" fill="#e53935" stroke="#fff" strokeWidth="3" transform="rotate(12 46 30)" />
      <ellipse cx="46" cy="30" rx="9" ry="14" fill="#fff" transform="rotate(30 46 30)" />
      <path d="M42 24h8M46 22v16" stroke="#e53935" strokeWidth="3.5" strokeLinecap="round" transform="rotate(12 46 30)" />
    </>
  ),
  chinchon: (
    <>
      <rect x="6" y="16" width="26" height="38" rx="5" fill="#fffaf0" stroke={T} strokeWidth="2.5" transform="rotate(-14 19 35)" />
      <rect x="20" y="12" width="26" height="38" rx="5" fill="#fffaf0" stroke={T} strokeWidth="2.5" transform="rotate(-2 33 31)" />
      <rect x="32" y="12" width="26" height="38" rx="5" fill="#f3e5ff" stroke={T} strokeWidth="2.5" transform="rotate(12 45 31)" />
      <circle cx="33" cy="30" r="6" fill="#ffc83d" stroke="#b8860b" strokeWidth="2" />
      <path d="M38 34l-3-12 6 6 4-9 4 9 6-6-3 12z" fill="#7b1fa2" stroke="#3b0a4f" strokeWidth="1.8" strokeLinejoin="round" transform="rotate(12 45 31)" />
      <circle cx="46" cy="38" r="5" fill="#ffe0c2" stroke="#3b0a4f" strokeWidth="1.5" transform="rotate(12 45 31)" />
    </>
  ),
  tateti: (
    <>
      <path d="M24 8v48M40 8v48M8 24h48M8 40h48" stroke={T} strokeWidth="4" strokeLinecap="round" />
      <path d="M11 11l9 9M20 11l-9 9" stroke="#e63946" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="32" r="5" fill="none" stroke="#219ebc" strokeWidth="4" />
      <path d="M43 43l9 9M52 43l-9 9" stroke="#e63946" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  cajitas: (
    <>
      <rect x="12" y="12" width="20" height="20" fill="#ffb703" opacity=".7" />
      <rect x="32" y="32" width="20" height="20" fill="#219ebc" opacity=".7" />
      <path d="M12 12h40M12 32h40M12 12v40M32 12v20M32 32v20" stroke={T} strokeWidth="3.5" strokeLinecap="round" />
      {[12, 32, 52].map((x) => [12, 32, 52].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill={T} />))}
    </>
  ),
  mastermind: (
    <>
      <rect x="6" y="10" width="52" height="44" rx="8" fill="#8d5a3b" stroke={T} strokeWidth="2.5" />
      <circle cx="16" cy="24" r="5" fill="#e53935" /><circle cx="28" cy="24" r="5" fill="#1e88e5" /><circle cx="40" cy="24" r="5" fill="#fdd835" />
      <circle cx="16" cy="40" r="5" fill="#43a047" /><circle cx="28" cy="40" r="5" fill="#e53935" /><circle cx="40" cy="40" r="5" fill="#8e24aa" />
      <circle cx="51" cy="21" r="2.5" fill="#111" /><circle cx="51" cy="28" r="2.5" fill="#fff" /><circle cx="51" cy="40" r="2.5" fill="#111" />
    </>
  ),
  escaleras: (
    <>
      <rect x="6" y="6" width="52" height="52" rx="6" fill="#ffe0a3" stroke={T} strokeWidth="2.5" />
      <path d="M16 50L34 14M24 54L42 18M19 44l8 4M23 36l8 4M27 28l8 4M31 20l8 4" stroke="#8d5524" strokeWidth="3" strokeLinecap="round" />
      <path d="M48 14c-8 6 6 12-2 18s6 12-2 20" fill="none" stroke="#43a047" strokeWidth="5" strokeLinecap="round" />
      <circle cx="48" cy="13" r="4" fill="#43a047" />
    </>
  ),
  caballos: (
    <>
      <path d="M14 34c0-7 6-10 14-10h10l9-11 4 2-2 7 7 7-3 3-7-3-2 7c0 5-3 8-8 8H24l-4 10h-5l1-11c-2-2-2-5-2-9z" fill="#8d5524" stroke={T} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="24" y="24" width="11" height="8" rx="2" fill="#f2b705" stroke={T} strokeWidth="1.5" />
    </>
  ),
  backgammon: (
    <>
      <rect x="4" y="8" width="56" height="48" rx="6" fill="#6d4c2f" stroke={T} strokeWidth="2.5" />
      <path d="M8 12l5 18 5-18zM18 12l5 18 5-18zM36 52l5-18 5 18zM46 52l5-18 5 18z" fill="#e8d3a9" />
      <path d="M8 52l5-18 5 18zM46 12l5 18 5-18z" fill="#a33b2a" />
      <circle cx="13" cy="16" r="4" fill="#fff" stroke={T} strokeWidth="1.5" /><circle cx="51" cy="48" r="4" fill="#222" stroke="#fff" strokeWidth="1.5" />
    </>
  ),
  sudoku: (
    <>
      <rect x="8" y="8" width="48" height="48" rx="4" fill="#fff" stroke={T} strokeWidth="3" />
      <path d="M24 8v48M40 8v48M8 24h48M8 40h48" stroke={T} strokeWidth="2" />
      <text x="16" y="21" fontSize="11" fontWeight="900" textAnchor="middle" fill={T}>5</text>
      <text x="48" y="37" fontSize="11" fontWeight="900" textAnchor="middle" fill="#1e88e5">3</text>
      <text x="32" y="53" fontSize="11" fontWeight="900" textAnchor="middle" fill={T}>9</text>
    </>
  ),
  quoridor: (
    <>
      <rect x="6" y="6" width="52" height="52" rx="6" fill="#5d4037" />
      {[0, 1, 2].map((f) => [0, 1, 2].map((c) => <rect key={`${f}${c}`} x={10 + c * 16} y={10 + f * 16} width="12" height="12" rx="2" fill="#d7b98e" />))}
      <rect x="9" y="23" width="28" height="3" rx="1.5" fill="#ffcc80" />
      <rect x="39" y="25" width="3" height="28" rx="1.5" fill="#ffcc80" />
      <circle cx="32" cy="48" r="5" fill="#e63946" stroke="#fff" strokeWidth="1.5" /><circle cx="32" cy="16" r="5" fill="#219ebc" stroke="#fff" strokeWidth="1.5" />
    </>
  ),
  dibujar: (
    <>
      <rect x="6" y="10" width="44" height="36" rx="4" fill="#fff" stroke={T} strokeWidth="2.5" />
      <path d="M12 38c6-12 12-12 16-4s10 6 16-8" fill="none" stroke="#e53935" strokeWidth="3" strokeLinecap="round" />
      <path d="M42 50l14-24 4 2-14 24-6 3z" fill="#ffb703" stroke={T} strokeWidth="2" strokeLinejoin="round" />
    </>
  ),
  monopoly: (
    <>
      <rect x="6" y="6" width="52" height="52" rx="4" fill="#dff0d8" stroke="#1b5e20" strokeWidth="3" />
      <path d="M6 18h52M6 46h52M18 6v52M46 6v52" stroke="#1b5e20" strokeWidth="2" />
      <rect x="6" y="6" width="12" height="5" fill="#7b1e3a" /><rect x="46" y="6" width="12" height="5" fill="#e53935" /><rect x="6" y="46" width="12" height="5" fill="#43a047" />
      <rect x="22" y="27" width="20" height="10" fill="#c62828" stroke="#fff" strokeWidth="1.5" transform="rotate(-8 32 32)" />
      <path d="M28 46l4-4 4 4v6h-8z" fill="#2e7d32" />
    </>
  ),
  cartas: (
    <>
      <rect x="8" y="12" width="28" height="40" rx="5" fill="#fff" stroke={T} strokeWidth="2.5" transform="rotate(-12 22 32)" />
      <rect x="26" y="10" width="28" height="40" rx="5" fill="#fffaf0" stroke={T} strokeWidth="2.5" transform="rotate(10 40 30)" />
      <circle cx="40" cy="30" r="8" fill="#ffc83d" stroke="#b8860b" strokeWidth="2.5" />
    </>
  ),
  cuatro: (
    <>
      <rect x="6" y="10" width="52" height="46" rx="6" fill="#2a6fdb" />
      {[0, 1, 2, 3].flatMap((f) => [0, 1, 2, 3].map((c) => (
        <circle key={`${f}${c}`} cx={14 + c * 12} cy={18 + f * 11} r="4.5" fill={(f === 3 - c) ? '#ffd54a' : (f + c) % 3 === 0 ? '#ff4d5e' : '#0d3b8a'} />
      )))}
    </>
  ),
  ppt: (
    <>
      <circle cx="18" cy="20" r="11" fill="#9aa5b1" stroke={T} strokeWidth="2.5" />
      <rect x="34" y="8" width="22" height="26" rx="2" fill="#fff" stroke={T} strokeWidth="2.5" />
      <path d="M38 15h14M38 21h14M38 27h9" stroke="#9aa5b1" strokeWidth="2" />
      <circle cx="22" cy="50" r="6" fill="none" stroke="#e63946" strokeWidth="3" />
      <circle cx="40" cy="50" r="6" fill="none" stroke="#e63946" strokeWidth="3" />
      <path d="M26 46l18-12M36 46L18 34" stroke={T} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  damas: (
    <>
      <rect x="6" y="6" width="52" height="52" rx="4" fill="#f3e3c3" />
      <path d="M6 6h13v13H6zM32 6h13v13H32zM19 19h13v13H19zM45 19h13v13H45zM6 32h13v13H6zM32 32h13v13H32zM19 45h13v13H19zM45 45h13v13H45z" fill="#8d5a3b" />
      <circle cx="25.5" cy="25.5" r="5" fill="#e63946" stroke={T} strokeWidth="1.5" />
      <circle cx="38.5" cy="38.5" r="5" fill="#222" stroke="#fff" strokeWidth="1.5" />
    </>
  ),
  memo: (
    <>
      <rect x="6" y="8" width="22" height="22" rx="4" fill="#7b5cff" />
      <rect x="36" y="8" width="22" height="22" rx="4" fill="#fff" stroke={T} strokeWidth="2.5" />
      <path d="M47 26s-7-4-7-9c0-3 2-4 4-4s3 2 3 2 1-2 3-2 4 1 4 4c0 5-7 9-7 9z" fill="#ff3d6e" />
      <rect x="6" y="36" width="22" height="22" rx="4" fill="#fff" stroke={T} strokeWidth="2.5" />
      <path d="M17 54s-7-4-7-9c0-3 2-4 4-4s3 2 3 2 1-2 3-2 4 1 4 4c0 5-7 9-7 9z" fill="#ff3d6e" />
      <rect x="36" y="36" width="22" height="22" rx="4" fill="#7b5cff" />
      <path d="M12 14l10 10M42 42l10 10" stroke="#fff" strokeWidth="2" opacity=".35" />
    </>
  ),
  palabras: (
    <>
      {['#6aaa64', '#c9b458', '#787c7e'].map((c, i) => <rect key={i} x={4 + i * 20} y="20" width="17" height="24" rx="3" fill={c} />)}
      <text x="12.5" y="38" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="15" fill="#fff" textAnchor="middle">S</text>
      <text x="32.5" y="38" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="15" fill="#fff" textAnchor="middle">T</text>
      <text x="52.5" y="38" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="15" fill="#fff" textAnchor="middle">P</text>
    </>
  ),

  domino: (
    <>
      <rect x="8" y="14" width="24" height="44" rx="5" fill="#fffdf7" stroke={T} strokeWidth="2.5" transform="rotate(-14 20 36)" />
      <path d="M10 37l20-5" stroke={T} strokeWidth="2" transform="rotate(-14 20 36)" />
      {[[16, 24], [24, 28], [20, 46], [14, 50], [26, 50]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.6" fill={T} transform="rotate(-14 20 36)" />)}
      <rect x="32" y="6" width="24" height="44" rx="5" fill="#fffdf7" stroke={T} strokeWidth="2.5" transform="rotate(10 44 28)" />
      <path d="M32 28h24" stroke={T} strokeWidth="2" transform="rotate(10 44 28)" />
      {[[38, 13], [50, 13], [44, 18], [38, 38], [50, 38], [38, 44], [50, 44]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.6" fill={T} transform="rotate(10 44 28)" />)}
    </>
  ),
  ludo: (
    <>
      <rect x="6" y="6" width="52" height="52" rx="6" fill="#fff" stroke={T} strokeWidth="2.5" />
      <path d="M6 6h20v20H6z" fill="#e63946" />
      <path d="M38 6h20v20H38z" fill="#2a9d4f" />
      <path d="M6 38h20v20H6z" fill="#2a6fdb" />
      <path d="M38 38h20v20H38z" fill="#ffc83d" />
      <path d="M26 26h12v12H26z" fill="#eee" />
      <path d="M26 26l6 6 6-6zM26 38l6-6 6 6z" fill="#ccc" />
      <circle cx="16" cy="16" r="5" fill="#fff" />
      <circle cx="48" cy="48" r="5" fill="#fff" />
    </>
  ),
  quien: (
    <>
      <rect x="6" y="10" width="24" height="30" rx="4" fill="#ffe3ec" stroke={T} strokeWidth="2.5" />
      <path d="M11 22l3-8 4 6 4-6 3 8" fill="#f29a3a" stroke={T} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="18" cy="26" r="7" fill="#f29a3a" stroke={T} strokeWidth="1.5" />
      <circle cx="15.5" cy="25" r="1.3" fill={T} />
      <circle cx="20.5" cy="25" r="1.3" fill={T} />
      <rect x="34" y="10" width="24" height="30" rx="4" fill="#e3f0ff" stroke={T} strokeWidth="2.5" />
      <ellipse cx="46" cy="27" rx="8" ry="7" fill="#d9a066" stroke={T} strokeWidth="1.5" />
      <path d="M38 22q-4 6 0 10M54 22q4 6 0 10" stroke="#a8743c" strokeWidth="3" fill="none" />
      <ellipse cx="46" cy="30" rx="2.5" ry="1.8" fill="#f08aa0" />
      <text x="32" y="58" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="18" fill="#7b5cff" textAnchor="middle">?</text>
    </>
  ),
  pool: (
    <>
      <rect x="4" y="12" width="56" height="40" rx="8" fill="#1f7a4d" stroke="#5e3a24" strokeWidth="4" />
      <circle cx="8" cy="16" r="3.5" fill="#111" />
      <circle cx="56" cy="16" r="3.5" fill="#111" />
      <circle cx="8" cy="48" r="3.5" fill="#111" />
      <circle cx="56" cy="48" r="3.5" fill="#111" />
      <circle cx="40" cy="30" r="7" fill="#111" />
      <circle cx="40" cy="30" r="3.2" fill="#fff" />
      <text x="40" y="32.5" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="5" fill="#111" textAnchor="middle">8</text>
      <circle cx="20" cy="36" r="5" fill="#fff" stroke="#ccc" />
      <path d="M2 50l14-10" stroke="#c08552" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  penal: (
    <>
      <path d="M6 14h52v34" stroke="#fff" strokeWidth="4" fill="none" />
      <path d="M6 14v34" stroke="#fff" strokeWidth="4" />
      <path d="M8 18h48M8 26h48M8 34h48M8 42h48M14 16v32M24 16v32M34 16v32M44 16v32M54 16v32" stroke="#cfd8dc" strokeWidth="1" />
      <rect x="2" y="12" width="60" height="40" rx="2" fill="none" stroke="#546e7a" strokeWidth="2" />
      <circle cx="40" cy="44" r="9" fill="#fff" stroke={T} strokeWidth="2" />
      <path d="M40 38l4 3-1.5 5h-5l-1.5-5z" fill={T} />
      <path d="M31 44l3 0M49 44l-3 0M40 53v-3" stroke={T} strokeWidth="2" />
    </>
  ),

  // ---------- Palos del mazo español ----------
  oro: (
    <>
      <circle cx="32" cy="32" r="24" fill="#ffc83d" stroke="#b8860b" strokeWidth="3" />
      <circle cx="32" cy="32" r="15" fill="none" stroke="#b8860b" strokeWidth="2.5" />
      <path d="M32 20l3 8h8l-6 5 2 8-7-5-7 5 2-8-6-5h8z" fill="#e0a800" />
    </>
  ),
  copa: (
    <>
      <path d="M14 8h36c0 14-6 24-18 24S14 22 14 8z" fill="#e63946" stroke="#9b1c26" strokeWidth="2.5" />
      <path d="M32 32v14M20 56h24l-4-10H24z" fill="#ffc83d" stroke="#b8860b" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M19 12h26" stroke="#fff" strokeWidth="2" opacity=".5" />
    </>
  ),
  espada: (
    <>
      <path d="M32 4l5 8v32h-10V12z" fill="#cfd8dc" stroke="#455a64" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M18 44h28v5H18z" fill="#ffc83d" stroke="#b8860b" strokeWidth="2.5" />
      <path d="M29 49h6v9h-6z" fill="#2a6fdb" stroke="#1a4a99" strokeWidth="2" />
    </>
  ),
  basto: (
    <>
      <path d="M22 58l6-48c1-5 9-5 10 0l4 48z" fill="#4caf50" stroke="#1b5e20" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="30" cy="22" r="3" fill="#1b5e20" />
      <circle cx="36" cy="34" r="3" fill="#1b5e20" />
      <circle cx="31" cy="46" r="3" fill="#1b5e20" />
    </>
  ),

  // ---------- Interfaz ----------
  campana: (
    <>
      <path d="M32 8c-11 0-17 9-17 19v11l-5 8h44l-5-8V27c0-10-6-19-17-19z" fill="#ffc83d" stroke="#b8860b" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="32" cy="52" r="5" fill="#b8860b" />
      <path d="M50 14q5 6 2 14M14 14q-5 6-2 14" stroke="#b8860b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  campanaNo: (
    <>
      <path d="M32 8c-11 0-17 9-17 19v11l-5 8h44l-5-8V27c0-10-6-19-17-19z" fill="#b0bec5" stroke="#607d8b" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="32" cy="52" r="5" fill="#607d8b" />
      <path d="M8 8l48 48" stroke="#e63946" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  chat: (
    <>
      <path d="M8 14c0-4 3-7 7-7h34c4 0 7 3 7 7v22c0 4-3 7-7 7H28l-12 11v-11h-1c-4 0-7-3-7-7z" fill="#fff" stroke={T} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="22" cy="25" r="3.5" fill={T} />
      <circle cx="32" cy="25" r="3.5" fill={T} />
      <circle cx="42" cy="25" r="3.5" fill={T} />
    </>
  ),
  trofeo: (
    <>
      <path d="M18 8h28v14c0 9-6 15-14 15s-14-6-14-15z" fill="#ffc83d" stroke="#b8860b" strokeWidth="2.5" />
      <path d="M18 12H9c0 9 4 13 10 13M46 12h9c0 9-4 13-10 13" fill="none" stroke="#b8860b" strokeWidth="3" />
      <path d="M28 37h8v9h-8zM18 56h28l-3-10H21z" fill="#e0a800" stroke="#b8860b" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 14l2 5h5l-4 3 1 5-4-3-4 3 1-5-4-3h5z" fill="#fff6c8" />
    </>
  ),
  medalla: (
    <>
      <path d="M20 4h10l6 18H26zM34 4h10l-6 18h-10z" fill="#2a6fdb" />
      <circle cx="32" cy="40" r="18" fill="#cfd8dc" stroke="#78909c" strokeWidth="3" />
      <text x="32" y="47" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="20" fill="#546e7a" textAnchor="middle">2</text>
    </>
  ),
  apreton: (
    <>
      <path d="M4 30l12-10 10 4 8-4 10 2 16 8-6 12-8-4-10 10c-3 3-7 3-10 0L10 40z" fill={P} stroke={T} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M26 24l-6 8c-2 3 2 6 5 4l7-6 10 10M34 44l-6-6M30 48l-6-6" stroke={T} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  corona: (
    <>
      <path d="M6 22l12 10 14-20 14 20 12-10-6 30H12z" fill="#ffc83d" stroke="#b8860b" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="32" cy="38" r="4" fill="#e63946" />
      <circle cx="19" cy="40" r="3" fill="#2a6fdb" />
      <circle cx="45" cy="40" r="3" fill="#2a6fdb" />
    </>
  ),
  escoba: (
    <>
      <path d="M44 4L30 30" stroke="#8d5a3b" strokeWidth="5" strokeLinecap="round" />
      <path d="M22 26l14 8-4 6-18 20c-4 2-8-1-6-5z" fill="#ffc83d" stroke="#b8860b" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M17 44l-5 7M22 46l-5 8M27 44l-6 9" stroke="#b8860b" strokeWidth="2" />
    </>
  ),
  chispas: (
    <>
      <path d="M26 6l5 15 15 5-15 5-5 15-5-15-15-5 15-5z" fill="#ffd54a" />
      <path d="M48 34l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#ffe57f" />
      <path d="M50 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff3b0" />
    </>
  ),
  bombilla: (
    <>
      <path d="M32 6c-11 0-18 8-18 18c0 7 4 11 7 15c2 2 3 5 3 8h16c0-3 1-6 3-8c3-4 7-8 7-15c0-10-7-18-18-18z" fill="#ffe066" stroke="#b8860b" strokeWidth="2.5" />
      <path d="M24 50h16v4H24zM26 57h12" stroke="#607d8b" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  lapiz: (
    <>
      <path d="M10 54l4-14L44 10l10 10-30 30z" fill="#ffc83d" stroke={T} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M38 16l10 10" stroke={T} strokeWidth="2.5" />
      <path d="M10 54l4-14 10 10z" fill="#ffe0b2" stroke={T} strokeWidth="2.5" strokeLinejoin="round" />
    </>
  ),
  dado: (
    <>
      <rect x="8" y="8" width="48" height="48" rx="10" fill="#fff" stroke={T} strokeWidth="3" />
      <circle cx="20" cy="20" r="4.5" fill={T} />
      <circle cx="32" cy="32" r="4.5" fill={T} />
      <circle cx="44" cy="44" r="4.5" fill={T} />
    </>
  ),
  siete: (
    <>
      <rect x="8" y="6" width="48" height="52" rx="8" fill="#fffaf0" stroke={T} strokeWidth="2.5" />
      <text x="32" y="46" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="36" fill="#b8860b" textAnchor="middle">7</text>
    </>
  ),

  // ---------- Manos (piedra, papel o tijera) ----------
  piedra: mano('M14 30c0-4 3-6 6-6h3c0-3 2-5 5-5s5 2 5 4c1-2 3-3 5-3c3 0 5 2 5 5c3 0 5 2 5 5v14c0 8-6 14-14 14h-8c-9 0-16-7-16-16z'),
  papel: mano('M14 36V20c0-3 4-3 4 0v12V10c0-3 5-3 5 0v20V6c0-3 5-3 5 0v24V9c0-3 5-3 5 0v25l4-7c2-3 6-1 5 2l-6 15c-2 7-8 12-16 12c-7 0-11-6-11-14z'),
  tijera: mano('M18 36l-6-26c-1-3 4-4 5-1l7 22-2-26c0-3 5-3 5 0l2 26c1 0 2 0 3 1c1-2 5-2 6 1c2-1 5 0 5 3v8c0 9-6 15-14 15h-2c-8 0-12-6-12-14z'),
  lagarto: mano('M8 34c0-10 9-18 22-18h14c6 0 12 4 12 10v2H36c-2 0-2 3 0 3h18c0 9-9 15-20 15H22c-8 0-14-5-14-12z'),
  spock: mano('M16 56c-5 0-8-5-7-10l3-16c1-3 5-3 5 0v4l-2-24c0-3 5-3 5 0l3 22V8c0-3 5-3 5 0v26l3-26c0-3 5-3 5 0l-2 26 3-20c1-3 5-2 5 1l-3 26c-1 10-8 15-17 15z'),

  // ---------- Más dibujos (memotest) ----------
  sol: (
    <>
      <circle cx="32" cy="32" r="13" fill="#ffc83d" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d="M32 6v8" stroke="#ffa000" strokeWidth="4" strokeLinecap="round" transform={`rotate(${i * 45} 32 32)`} />)}
    </>
  ),
  luna: <path d="M40 8a24 24 0 1 0 16 36A20 20 0 0 1 40 8z" fill="#ffe066" stroke="#d4a017" strokeWidth="2.5" />,
  estrella: <path d="M32 5l8 17 19 2-14 13 4 19-17-10-17 10 4-19L5 24l19-2z" fill="#ffd54a" stroke="#e0a800" strokeWidth="2.5" strokeLinejoin="round" />,
  rayo: <path d="M36 4L12 36h16l-6 24 26-34H32z" fill="#ffd54a" stroke="#e0a800" strokeWidth="2.5" strokeLinejoin="round" />,
  flor: (
    <>
      {Array.from({ length: 6 }, (_, i) => <ellipse key={i} cx="32" cy="16" rx="8" ry="12" fill="#ff8ac2" transform={`rotate(${i * 60} 32 30)`} />)}
      <circle cx="32" cy="30" r="8" fill="#ffd54a" />
      <path d="M32 40v20" stroke="#4caf50" strokeWidth="4" />
    </>
  ),
  gato: (
    <>
      <path d="M12 14l10 10h20l10-10v26c0 11-9 18-20 18S12 51 12 40z" fill="#ff9f43" stroke={T} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="24" cy="36" r="3" fill={T} />
      <circle cx="40" cy="36" r="3" fill={T} />
      <path d="M30 42h4l-2 3zM32 45q-3 4-7 2M32 45q3 4 7 2M6 40h12M46 40h12" stroke={T} strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  raton: (
    <>
      <path d="M50 46c6 2 10 6 8 12" stroke="#d48aa0" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="34" cy="40" rx="18" ry="14" fill="#a8a8b3" stroke={T} strokeWidth="2.5" />
      <circle cx="16" cy="18" r="9" fill="#ffb3c7" stroke={T} strokeWidth="2.5" />
      <circle cx="16" cy="18" r="4.5" fill="#ff8fab" />
      <circle cx="36" cy="16" r="9" fill="#ffb3c7" stroke={T} strokeWidth="2.5" />
      <circle cx="36" cy="16" r="4.5" fill="#ff8fab" />
      <path d="M10 34c0-9 7-15 16-15s14 6 14 14c0 7-6 12-14 13l-12 2c-4 0-6-2-4-6z" fill="#bdbdc7" stroke={T} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="21" cy="30" r="2.6" fill={T} />
      <circle cx="31" cy="30" r="2.6" fill={T} />
      <circle cx="8" cy="46" r="3" fill="#ff6f91" />
      <path d="M12 42l-10-2M12 45l-10 3M14 47l-8 7" stroke={T} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  queso: (
    <>
      <path d="M6 44l50-26v24L6 58z" fill="#ffc83d" stroke="#b8860b" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M6 44l50-26c-14-6-32-4-42 6z" fill="#ffe082" stroke="#b8860b" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="22" cy="48" rx="4" ry="3" fill="#e0a800" />
      <ellipse cx="40" cy="40" rx="3" ry="2.5" fill="#e0a800" />
      <ellipse cx="48" cy="50" rx="2.5" ry="2" fill="#e0a800" />
      <ellipse cx="30" cy="27" rx="3" ry="1.6" fill="#e0a800" />
    </>
  ),
  madriguera: (
    <>
      <path d="M6 56c0-20 12-34 26-34s26 14 26 34z" fill="#8d6e63" stroke="#4e342e" strokeWidth="2.5" />
      <path d="M16 56c0-12 7-22 16-22s16 10 16 22z" fill="#2b1d16" />
      <path d="M4 56h56" stroke="#4e342e" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  perro: (
    <>
      <ellipse cx="32" cy="36" rx="18" ry="20" fill="#c08552" stroke={T} strokeWidth="2.5" />
      <path d="M14 22c-8 0-10 16-4 22l6-4zM50 22c8 0 10 16 4 22l-6-4z" fill="#7a4a2a" />
      <circle cx="25" cy="32" r="3" fill={T} />
      <circle cx="39" cy="32" r="3" fill={T} />
      <ellipse cx="32" cy="42" rx="5" ry="4" fill={T} />
      <path d="M32 46v4q-4 4-6 0M32 50q4 4 6 0" stroke={T} strokeWidth="2" fill="none" />
    </>
  ),
  pez: (
    <>
      <path d="M8 32c8-12 24-16 36-8l12-8v32l-12-8c-12 8-28 4-36-8z" fill="#4fc3f7" stroke="#0277bd" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="20" cy="30" r="3" fill={T} />
      <path d="M30 24q4 8 0 16" stroke="#0277bd" strokeWidth="2" fill="none" />
    </>
  ),
  hongo: (
    <>
      <path d="M6 30c0-14 12-24 26-24s26 10 26 24z" fill="#e63946" stroke="#9b1c26" strokeWidth="2.5" />
      <circle cx="20" cy="18" r="4" fill="#fff" />
      <circle cx="36" cy="14" r="5" fill="#fff" />
      <circle cx="46" cy="24" r="3" fill="#fff" />
      <path d="M22 30h20v20c0 5-4 8-10 8s-10-3-10-8z" fill="#fff3e0" stroke="#bcaaa4" strokeWidth="2.5" />
    </>
  ),
  cohete: (
    <>
      <path d="M32 4c10 8 14 20 12 36H20C18 24 22 12 32 4z" fill="#eceff1" stroke="#546e7a" strokeWidth="2.5" />
      <circle cx="32" cy="22" r="5" fill="#4fc3f7" stroke="#0277bd" strokeWidth="2" />
      <path d="M20 32l-8 12h10zM44 32l8 12H42z" fill="#e63946" />
      <path d="M26 42c0 8 3 14 6 18c3-4 6-10 6-18z" fill="#ffa000" />
    </>
  ),
  globo: (
    <>
      <ellipse cx="32" cy="24" rx="16" ry="19" fill="#7b5cff" stroke="#4527a0" strokeWidth="2.5" />
      <path d="M29 43h6l-3 4zM32 47q-6 6 0 10t0 6" stroke="#4527a0" strokeWidth="2" fill="none" />
      <ellipse cx="25" cy="17" rx="4" ry="6" fill="#fff" opacity=".35" />
    </>
  ),
  regalo: (
    <>
      <rect x="8" y="26" width="48" height="32" rx="3" fill="#e63946" stroke="#9b1c26" strokeWidth="2.5" />
      <rect x="6" y="18" width="52" height="10" rx="2" fill="#ff6b6b" stroke="#9b1c26" strokeWidth="2.5" />
      <path d="M28 18h8v40h-8z" fill="#ffc83d" />
      <path d="M32 18c-8-12-20-6-12 0zM32 18c8-12 20-6 12 0z" fill="#ffc83d" stroke="#b8860b" strokeWidth="2" />
    </>
  ),
  helado: (
    <>
      <path d="M20 30h24L32 60z" fill="#e0a85a" stroke="#8d5a3b" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="10" fill="#ff8ac2" />
      <circle cx="40" cy="24" r="10" fill="#8ce0c0" />
      <circle cx="32" cy="14" r="10" fill="#fff3e0" />
    </>
  ),
  pizza: (
    <>
      <path d="M32 60L6 12c16-8 36-8 52 0z" fill="#ffc83d" stroke="#e0a800" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M6 12c16-8 36-8 52 0l-3 6c-14-7-32-7-46 0z" fill="#c8813a" />
      <circle cx="26" cy="26" r="5" fill="#e63946" />
      <circle cx="40" cy="30" r="5" fill="#e63946" />
      <circle cx="32" cy="44" r="4" fill="#e63946" />
    </>
  ),
  mate: (
    <>
      <path d="M14 26h32v16c0 10-7 16-16 16s-16-6-16-16z" fill="#8d5a3b" stroke="#5e3a24" strokeWidth="2.5" />
      <path d="M14 26c2-4 30-4 32 0" fill="#4caf50" />
      <path d="M36 28L48 4" stroke="#b0bec5" strokeWidth="4" strokeLinecap="round" />
      <path d="M14 34h32" stroke="#ffc83d" strokeWidth="3" />
    </>
  ),
  arbol: (
    <>
      <path d="M32 4L12 34h12L10 50h44L40 34h12z" fill="#43a047" stroke="#1b5e20" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="28" y="50" width="8" height="10" fill="#8d5a3b" />
    </>
  ),
  nube: <path d="M16 46c-6 0-10-4-10-9s4-9 10-9c1-8 8-14 16-14c7 0 13 5 15 12c6 0 11 5 11 10s-5 10-11 10z" fill="#fff" stroke="#90a4ae" strokeWidth="2.5" />,
  ancla: (
    <>
      <circle cx="32" cy="12" r="6" fill="none" stroke="#455a64" strokeWidth="4" />
      <path d="M32 18v38M22 28h20M10 40c2 10 12 16 22 16s20-6 22-16" stroke="#455a64" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ),
  frutilla: (
    <>
      <path d="M32 60C14 46 10 34 14 26c4-6 12-6 18-3c6-3 14-3 18 3c4 8 0 20-18 34z" fill="#e63946" stroke="#9b1c26" strokeWidth="2.5" />
      <path d="M20 22l12-14 12 14-12-4z" fill="#4caf50" />
      {[[24, 34], [36, 32], [30, 42], [40, 42], [22, 44]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="1.5" ry="2.5" fill="#ffe57f" />)}
    </>
  ),
};

// Emoticones que se pueden mandar en una partida (el orden es el del selector).
export const EMOTES = ['fuckyou', 'risa', 'llanto', 'enojo', 'beso', 'corazon', 'fuego', 'aplauso', 'facha', 'pulgar', 'sorpresa', 'caca', 'ojitos'];

export function Icono({ id, tam = 24, titulo, className = '' }) {
  const dibujo = ICONOS[id];
  if (!dibujo) return null;
  return (
    <svg
      className={`icono ${className}`}
      viewBox="0 0 64 64"
      width={tam}
      height={tam}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
    >
      {titulo && <title>{titulo}</title>}
      {dibujo}
    </svg>
  );
}
