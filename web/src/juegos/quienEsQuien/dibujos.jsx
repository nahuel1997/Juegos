// Gatitos y perritos de ¿Quién es quién?, dibujados en SVG a partir de sus características (las
// mismas que se preguntan). Estilo ilustración: volumen con degradés (un solo degradé por animal,
// en coordenadas de la imagen, así las partes se funden sin costuras), ojos con iris y brillo,
// pelaje y rasgos de cada raza. Grilla de 100x100.

// ---------------- Utilidades de color ----------------
function mezclar(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0')}`;
}
const aclarar = (c, t) => mezclar(c, '#ffffff', t);
const oscurecer = (c, t) => mezclar(c, '#000000', t);
const slug = (s) => s.normalize('NFD').replace(/[^a-z0-9]/gi, '');

// Número estable a partir del nombre, para ubicar manchas siempre igual.
function semilla(texto) {
  let h = 2166136261;
  for (const ch of texto) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// Mancha irregular y suave.
function mancha(rnd, cx, cy, r) {
  const n = 7;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.65 + rnd() * 0.55);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.85];
  });
  let d = `M${((pts[0][0] + pts[n - 1][0]) / 2).toFixed(1)} ${((pts[0][1] + pts[n - 1][1]) / 2).toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[(i + 1) % n];
    d += ` Q${x.toFixed(1)} ${y.toFixed(1)} ${((x + nx) / 2).toFixed(1)} ${((y + ny) / 2).toFixed(1)}`;
  }
  return `${d}Z`;
}

function Ojo({ x, y, rx, ry, iris, id, gato, mirada = 0 }) {
  const forma = gato
    ? `M${x - rx} ${y} C${x - rx * 0.5} ${y - ry * 1.15} ${x + rx * 0.5} ${y - ry * 1.15} ${x + rx} ${y - ry * 0.15} C${x + rx * 0.45} ${y + ry * 1.05} ${x - rx * 0.5} ${y + ry * 1.05} ${x - rx} ${y}Z`
    : null;
  return (
    <g>
      {gato ? <path d={forma} fill={`url(#iris-${id})`} /> : <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#iris-${id})`} />}
      {gato
        ? <ellipse cx={x + mirada} cy={y + 0.2} rx={rx * 0.28} ry={ry * 0.85} fill="#0b0b0f" />
        : <circle cx={x + mirada} cy={y + 0.3} r={rx * 0.52} fill="#0b0b0f" />}
      <ellipse cx={x + rx * 0.3} cy={y - ry * 0.38} rx={rx * 0.26} ry={ry * 0.22} fill="#fff" />
      <circle cx={x - rx * 0.32} cy={y + ry * 0.38} r={rx * 0.1} fill="#fff" opacity=".8" />
      {gato
        ? <path d={forma} fill="none" stroke="#1b1416" strokeWidth="1.1" />
        : <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke="#1b1416" strokeWidth="1" />}
    </g>
  );
}

// ---------------- Gatitos ----------------
const GATO_COLOR = {
  naranja: '#e8913f',
  gris: '#9aa3ad',
  negro: '#3a3a42',
  blanco: '#f4efe6',
  crema: '#ecd3a8',
  marron: '#8a5a3c',
};
const OJOS = { verde: '#79c86a', azul: '#5fb0ff', amarillo: '#f0c23a' };
const CUERPO = { flaquito: 0.8, normal: 1, gordito: 1.32 };
const CABEZA = { flaquito: 0.92, normal: 1, gordito: 1.12 };

export function Gato({ p }) {
  const id = `g${slug(p.nombre)}`;
  const base = GATO_COLOR[p.color];
  const claro = aclarar(base, p.color === 'negro' ? 0.2 : 0.38);
  const oscuro = oscurecer(base, p.color === 'blanco' ? 0.12 : 0.32);
  const raya = p.color === 'negro' ? '#141418' : oscurecer(base, 0.42);
  const k = CUERPO[p.tamano];
  const w = 21 * CABEZA[p.tamano];
  const rnd = semilla(p.nombre);
  const bicolor = p.patron === 'bicolor';
  const blancoPatas = bicolor;
  const pelo = `url(#pelo-${id})`;
  const peloBlanco = `url(#blanco-${id})`;
  const cuerpo = `M${50 - 9 * k} 52 C${50 - 21 * k} 57 ${50 - 26 * k} 74 ${50 - 25 * k} 86 C${50 - 24 * k} 94 ${50 - 13 * k} 96 50 96 C${50 + 13 * k} 96 ${50 + 24 * k} 94 ${50 + 25 * k} 86 C${50 + 26 * k} 74 ${50 + 21 * k} 57 ${50 + 9 * k} 52Z`;
  const cabeza = `M${50 - w} 37 C${50 - w} 22 ${50 - w * 0.55} 16 50 16 C${50 + w * 0.55} 16 ${50 + w} 22 ${50 + w} 37 C${50 + w * 1.02} 49 ${50 + w * 0.62} 57 50 58 C${50 - w * 0.62} 57 ${50 - w * 1.02} 49 ${50 - w} 37Z`;
  const cola = `M${50 + 20 * k} 90 C${50 + 40 * k} 92 ${50 + 42 * k} 70 ${50 + 31 * k} 58 C${50 + 28 * k} 54 ${50 + 30 * k} 50 ${50 + 34 * k} 49`;
  const oreja = (s) => `M${50 + s * w * 0.95} 30 Q${50 + s * w * 1.02} 13 ${50 + s * w * 0.84} 3 Q${50 + s * w * 0.48} 9 ${50 + s * w * 0.2} 19Z`;
  const orejaIn = (s) => `M${50 + s * w * 0.82} 27 Q${50 + s * w * 0.86} 15 ${50 + s * w * 0.78} 8 Q${50 + s * w * 0.52} 13 ${50 + s * w * 0.32} 20Z`;
  const ojoX = w * 0.4;
  const manchas = p.color === 'blanco' ? ['#e08a3a', '#2f2f36'] : [raya, '#f6f1e8'];
  const bigote = p.color === 'negro' ? '#e9e9e9' : '#ffffff';

  return (
    <svg viewBox="0 0 100 100" className="personaje">
      <defs>
        <radialGradient id={`pelo-${id}`} gradientUnits="userSpaceOnUse" cx="40" cy="34" r="66">
          <stop offset="0" stopColor={claro} />
          <stop offset=".5" stopColor={base} />
          <stop offset="1" stopColor={oscuro} />
        </radialGradient>
        <radialGradient id={`blanco-${id}`} gradientUnits="userSpaceOnUse" cx="44" cy="50" r="50">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ddd5c8" />
        </radialGradient>
        <radialGradient id={`iris-${id}`}>
          <stop offset="0" stopColor={aclarar(OJOS[p.ojos], 0.45)} />
          <stop offset=".7" stopColor={OJOS[p.ojos]} />
          <stop offset="1" stopColor={oscurecer(OJOS[p.ojos], 0.35)} />
        </radialGradient>
        <linearGradient id={`rosa-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6a7b6" />
          <stop offset="1" stopColor="#d97a8e" />
        </linearGradient>
        <filter id={`sombra-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.1" floodColor="#1b1020" floodOpacity=".35" />
        </filter>
        <clipPath id={`c-cuerpo-${id}`}><path d={cuerpo} /></clipPath>
        <clipPath id={`c-cabeza-${id}`}><path d={cabeza} /></clipPath>
      </defs>

      <ellipse cx="50" cy="96.5" rx={27 * k} ry="2.6" fill="#000" opacity=".16" />

      {/* cola */}
      <path d={cola} stroke={pelo} strokeWidth="8.5" fill="none" strokeLinecap="round" filter={`url(#sombra-${id})`} />
      {p.patron === 'atigrado' && <path d={cola} stroke={raya} strokeWidth="8.6" fill="none" strokeDasharray="2.6 4.2" opacity=".9" />}
      {bicolor && <path d={`M${50 + 31 * k} 58 C${50 + 28 * k} 54 ${50 + 30 * k} 50 ${50 + 34 * k} 49`} stroke={peloBlanco} strokeWidth="8.4" fill="none" strokeLinecap="round" />}

      {/* cuerpo */}
      <g filter={`url(#sombra-${id})`}>
        <path d={cuerpo} fill={pelo} />
      </g>
      <g clipPath={`url(#c-cuerpo-${id})`}>
        <ellipse cx={50 - 19 * k} cy="84" rx={10 * k} ry="12" fill={oscuro} opacity=".22" />
        <ellipse cx={50 + 19 * k} cy="84" rx={10 * k} ry="12" fill={oscuro} opacity=".22" />
        {p.patron === 'atigrado' && (
          <g stroke={raya} strokeLinecap="round" fill="none">
            {[60, 67, 74, 81, 88].map((y, i) => (
              <g key={y} strokeWidth={2.4 - i * 0.15}>
                <path d={`M${50 - 27 * k} ${y} q${7 * k} ${-1.5} ${12 * k} ${2.5}`} />
                <path d={`M${50 + 27 * k} ${y} q${-7 * k} ${-1.5} ${-12 * k} ${2.5}`} />
              </g>
            ))}
          </g>
        )}
        {p.patron === 'manchas' && Array.from({ length: 5 }, (_, i) => (
          <path key={i} d={mancha(rnd, 50 + (rnd() - 0.5) * 36 * k, 64 + rnd() * 26, 5 + rnd() * 4)} fill={manchas[i % 2]} opacity=".95" />
        ))}
        {/* pecho */}
        <ellipse cx="50" cy="72" rx={9 * k} ry="14" fill={bicolor ? peloBlanco : claro} opacity={bicolor ? 1 : 0.45} />
      </g>

      {/* patas delanteras */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${50 + s * 4} 64 C${50 + s * 4} 78 ${50 + s * 3} 88 ${50 + s * 4} 93 L${50 + s * 11} 93 C${50 + s * 11} 86 ${50 + s * 11} 76 ${50 + s * 10} 64Z`} fill={blancoPatas ? peloBlanco : pelo} />
          {p.patron === 'atigrado' && (
            <path d={`M${50 + s * 4.5} 78 h${s * 6} M${50 + s * 4.5} 84 h${s * 6}`} stroke={raya} strokeWidth="1.6" strokeLinecap="round" />
          )}
          <ellipse cx={50 + s * 7.5} cy="94" rx="5.2" ry="3.2" fill={blancoPatas ? peloBlanco : pelo} />
          <path d={`M${50 + s * 6} 93 v2.2 M${50 + s * 8.6} 93 v2.2`} stroke={oscurecer(blancoPatas ? '#e8e2d6' : base, 0.35)} strokeWidth=".7" strokeLinecap="round" />
        </g>
      ))}

      {/* cabeza */}
      <g filter={`url(#sombra-${id})`}>
        <path d={oreja(-1)} fill={pelo} />
        <path d={oreja(1)} fill={pelo} />
        <path d={cabeza} fill={pelo} />
        {p.tamano === 'gordito' && (
          <path d={`M${50 - w - 1} 42 l-3 3 l4 0 l-3 4 l5 -1 M${50 + w + 1} 42 l3 3 l-4 0 l3 4 l-5 -1`} fill={pelo} />
        )}
      </g>
      <path d={orejaIn(-1)} fill={`url(#rosa-${id})`} />
      <path d={orejaIn(1)} fill={`url(#rosa-${id})`} />
      <path d={`M${50 - w * 0.62} 22 l-2 -5 M${50 - w * 0.56} 22 l0 -6 M${50 + w * 0.62} 22 l2 -5 M${50 + w * 0.56} 22 l0 -6`} stroke={aclarar(base, 0.6)} strokeWidth=".8" strokeLinecap="round" />

      <g clipPath={`url(#c-cabeza-${id})`}>
        {p.patron === 'atigrado' && (
          <g stroke={raya} strokeLinecap="round" fill="none">
            <path d="M43 27 l2.2 -6 l2.6 5 l2.2 -6 l2.2 6 l2.6 -5 l2.2 6" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M47 19 v-4 M50 18 v-5 M53 19 v-4" strokeWidth="1.5" />
            <path d={`M${50 - w} 41 q6 0 9 -2 M${50 - w} 46 q5 0 8 -2 M${50 + w} 41 q-6 0 -9 -2 M${50 + w} 46 q-5 0 -8 -2`} strokeWidth="1.6" />
          </g>
        )}
        {p.patron === 'manchas' && Array.from({ length: 3 }, (_, i) => (
          <path key={i} d={mancha(rnd, 50 + (rnd() - 0.5) * 30, 22 + rnd() * 18, 4 + rnd() * 3)} fill={manchas[(i + 1) % 2]} />
        ))}
        {bicolor && (
          <path d={`M50 28 C46 34 ${50 - w * 0.7} 44 ${50 - w * 0.75} 52 C${50 - w * 0.4} 60 ${50 + w * 0.4} 60 ${50 + w * 0.75} 52 C${50 + w * 0.7} 44 54 34 50 28Z`} fill={peloBlanco} />
        )}
        {/* sombra del contorno */}
        <path d={cabeza} fill="none" stroke={oscuro} strokeWidth="3" opacity=".35" />
      </g>

      {/* hocico */}
      <ellipse cx={50 - 3.6} cy="47.5" rx="4.6" ry="3.6" fill={bicolor ? '#ffffff' : claro} opacity={bicolor ? 0.9 : 0.75} />
      <ellipse cx={50 + 3.6} cy="47.5" rx="4.6" ry="3.6" fill={bicolor ? '#ffffff' : claro} opacity={bicolor ? 0.9 : 0.75} />
      <path d="M47.2 43.8 Q50 42.8 52.8 43.8 Q51.6 46.3 50 46.8 Q48.4 46.3 47.2 43.8Z" fill={`url(#rosa-${id})`} stroke="#a85566" strokeWidth=".4" />
      <path d="M50 46.8 V48.6 M50 48.6 q-2.2 2 -4.2 .6 M50 48.6 q2.2 2 4.2 .6" stroke="#3b2a2e" strokeWidth=".9" fill="none" strokeLinecap="round" />
      {[45.2, 47.2, 49.2].map((y, i) => (
        <g key={y} stroke={bigote} strokeWidth=".45" strokeLinecap="round" opacity=".9">
          <path d={`M45.5 ${y - 0.5} Q${36 - i} ${y - 2 + i * 1.5} ${27 - i * 1.5} ${y - 1 + i * 2.5}`} fill="none" />
          <path d={`M54.5 ${y - 0.5} Q${64 + i} ${y - 2 + i * 1.5} ${73 + i * 1.5} ${y - 1 + i * 2.5}`} fill="none" />
        </g>
      ))}

      {/* ojos */}
      <Ojo x={50 - ojoX} y={36} rx={4.9} ry={4.3} iris={OJOS[p.ojos]} id={id} gato />
      <Ojo x={50 + ojoX} y={36} rx={4.9} ry={4.3} iris={OJOS[p.ojos]} id={id} gato />

      {/* accesorios */}
      {p.accesorio === 'collar' && (
        <g>
          <path d={`M${50 - 11 * Math.min(k, 1.1)} 56.5 Q50 61.5 ${50 + 11 * Math.min(k, 1.1)} 56.5`} stroke="#d62839" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="62" r="2.8" fill="#f2c94c" stroke="#a87b10" strokeWidth=".8" />
          <path d="M48.4 62.6 h3.2" stroke="#a87b10" strokeWidth=".6" />
        </g>
      )}
      {p.accesorio === 'mono' && (
        <g transform={`translate(${50 + w * 0.62} 15) rotate(18)`}>
          <path d="M0 0 C-4 -6 -11 -5 -10 0 C-11 5 -4 6 0 0Z M0 0 C4 -6 11 -5 10 0 C11 5 4 6 0 0Z" fill="#ff5c9a" stroke="#c2185b" strokeWidth=".8" />
          <path d="M-7 -1.5 q2 1.5 4 1 M7 -1.5 q-2 1.5 -4 1" stroke="#c2185b" strokeWidth=".6" fill="none" />
          <ellipse rx="2.4" ry="2.8" fill="#e23a83" stroke="#c2185b" strokeWidth=".6" />
        </g>
      )}
      {p.accesorio === 'anteojos' && (
        <g>
          <circle cx={50 - ojoX} cy="36" r="6.8" fill="#bfe3ff" opacity=".22" stroke="#2b2233" strokeWidth="1.3" />
          <circle cx={50 + ojoX} cy="36" r="6.8" fill="#bfe3ff" opacity=".22" stroke="#2b2233" strokeWidth="1.3" />
          <path d={`M${50 - ojoX + 6.8} 35 Q50 33 ${50 + ojoX - 6.8} 35 M${50 - ojoX - 6.8} 35 l-4 -1.5 M${50 + ojoX + 6.8} 35 l4 -1.5`} stroke="#2b2233" strokeWidth="1.2" fill="none" />
          <path d={`M${50 - ojoX - 3} 32 l3 -2`} stroke="#fff" strokeWidth=".8" opacity=".8" />
        </g>
      )}
    </svg>
  );
}

// ---------------- Perritos ----------------
const PERRO_COLOR = {
  caramelo: '#d29a5c',
  negro: '#2f2f36',
  blanco: '#f3eee4',
  marron: '#7a4a2c',
  gris: '#8e98a3',
  dorado: '#e2ae55',
};
// Forma de cada raza. cr: ancho del cráneo · mx: ancho del hocico · ml: largo del hocico ·
// orejas: tipo · pelo: corto | largo | rulos | esponjoso · extras.
const RAZAS = {
  pitbull: { cr: 25, mej: 25, mx: 14, ml: 10, orejas: 'rosa', pelo: 'corto', lengua: true, mandibula: true },
  caniche: { cr: 17, mej: 17, mx: 8, ml: 12, orejas: 'rulos', pelo: 'rulos' },
  salchicha: { cr: 17, mej: 17, mx: 8, ml: 16, orejas: 'largas', pelo: 'corto' },
  labrador: { cr: 21, mej: 22, mx: 11, ml: 12, orejas: 'caidas', pelo: 'corto', lengua: true },
  chihuahua: { cr: 20, mej: 17, mx: 6.5, ml: 7, orejas: 'enormes', pelo: 'corto', ojazos: true },
  bulldog: { cr: 26, mej: 28, mx: 17, ml: 5, orejas: 'rosa', pelo: 'corto', arrugas: true, papada: true, dientes: true },
  golden: { cr: 21, mej: 23, mx: 11, ml: 12, orejas: 'peludas', pelo: 'largo', lengua: true },
  dalmata: { cr: 20, mej: 20, mx: 10, ml: 12, orejas: 'caidas', pelo: 'corto' },
  beagle: { cr: 20, mej: 21, mx: 10, ml: 11, orejas: 'largas', pelo: 'corto', tricolor: true },
  husky: { cr: 21, mej: 23, mx: 10, ml: 11, orejas: 'paradas', pelo: 'esponjoso', mascara: true, ojosCelestes: true },
  pug: { cr: 22, mej: 23, mx: 13, ml: 3, orejas: 'pug', pelo: 'corto', arrugas: true, mascaraNegra: true, ojazos: true },
  ovejero: { cr: 20, mej: 19, mx: 9, ml: 15, orejas: 'grandes', pelo: 'esponjoso', montura: true },
};
const ESCALA = { chico: 0.8, mediano: 0.91, grande: 1 };

function OrejasPerro({ tipo, s, cr, color, interior, id }) {
  // s = -1 izquierda, 1 derecha. Cabeza centrada en (50, 40).
  const x = 50 + s * cr;
  switch (tipo) {
    case 'paradas':
    case 'grandes':
    case 'enormes': {
      const alto = tipo === 'enormes' ? 30 : tipo === 'grandes' ? 27 : 22;
      const ancho = tipo === 'enormes' ? 15 : tipo === 'grandes' ? 11 : 10;
      const base = tipo === 'enormes' ? 0.55 : 0.7;
      const xa = 50 + s * cr * base;
      return (
        <g>
          <path d={`M${xa - s * 4} 26 Q${x + s * ancho * 0.6} ${30 - alto * 0.55} ${x + s * ancho * 0.3} ${28 - alto} Q${x - s * ancho * 0.5} ${26 - alto * 0.5} ${xa - s * ancho * 0.9} 22Z`} fill={color} />
          <path d={`M${xa - s * 1} 25 Q${x + s * ancho * 0.35} ${30 - alto * 0.55} ${x + s * ancho * 0.2} ${31 - alto} Q${x - s * ancho * 0.35} ${27 - alto * 0.5} ${xa - s * ancho * 0.5} 23Z`} fill={interior} />
          <path d={`M${xa} 24 l${s * 3} -6 M${xa + s * 2} 25 l${s * 4} -5`} stroke={aclarar(color, 0.5)} strokeWidth=".7" strokeLinecap="round" opacity=".8" />
        </g>
      );
    }
    case 'rosa':
      return <path d={`M${x - s * 6} 25 Q${x + s * 6} 16 ${x + s * 9} 25 Q${x + s * 5} 27 ${x + s * 1} 31 Q${x - s * 3} 28 ${x - s * 6} 25Z`} fill={oscurecer(color, 0.12)} />;
    case 'pug':
      return <path d={`M${x - s * 5} 26 Q${x + s * 4} 18 ${x + s * 8} 24 Q${x + s * 6} 31 ${x + s * 1} 33 Z`} fill="#24242a" />;
    case 'rulos':
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={x + s * (3 + (i % 2) * 3)} cy={34 + i * 6.5} r="6" fill={color} />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={`r${i}`} d={`M${x + s * (1 + (i % 2) * 3)} ${33 + i * 6.5} a3 3 0 1 1 ${s * 4} 2`} stroke={oscurecer(color, 0.18)} strokeWidth=".8" fill="none" />
          ))}
        </g>
      );
    case 'largas':
      return (
        <path d={`M${x - s * 5} 27 C${x + s * 10} 24 ${x + s * 12} 52 ${x + s * 7} 66 C${x + s * 3} 70 ${x - s * 3} 66 ${x - s * 3} 58 C${x - s * 4} 46 ${x - s * 6} 36 ${x - s * 5} 27Z`} fill={color} filter={`url(#sombra-${id})`} />
      );
    case 'peludas':
      return (
        <path d={`M${x - s * 5} 27 C${x + s * 10} 25 ${x + s * 12} 46 ${x + s * 9} 58 l${-s * 2} 3 l${-s * 1} -3 l${-s * 3} 4 l${-s * 1} -4 l${-s * 3} 3 C${x - s * 4} 50 ${x - s * 6} 36 ${x - s * 5} 27Z`} fill={color} filter={`url(#sombra-${id})`} />
      );
    default: // caidas
      return (
        <path d={`M${x - s * 5} 26 C${x + s * 9} 23 ${x + s * 11} 44 ${x + s * 7} 55 C${x + s * 4} 59 ${x - s * 2} 56 ${x - s * 3} 49 C${x - s * 4} 40 ${x - s * 6} 33 ${x - s * 5} 26Z`} fill={color} filter={`url(#sombra-${id})`} />
      );
  }
}

export function Perro({ p }) {
  const id = `p${slug(p.nombre)}`;
  const f = RAZAS[p.raza];
  let base = PERRO_COLOR[p.color];
  if (p.raza === 'dalmata') base = '#f6f2ea';
  if (p.raza === 'ovejero' && p.color === 'marron') base = '#b97a42'; // fuego
  if (p.raza === 'pug' && p.color === 'negro') base = '#45454e';
  // Negro y fuego (salchicha y ovejero bicolor): marcas color fuego en vez de blanco.
  const fuego = p.color === 'negro' && p.patron === 'bicolor' && ['salchicha', 'ovejero'].includes(p.raza);
  const colorFuego = '#b9793f';
  const claro = aclarar(base, p.color === 'negro' ? 0.18 : 0.35);
  const oscuro = oscurecer(base, p.color === 'blanco' || p.raza === 'dalmata' ? 0.13 : 0.35);
  const blanco = '#fbf8f2';
  const esc = ESCALA[p.tamano];
  const rnd = semilla(p.nombre);
  const pelo = `url(#pelo-${id})`;
  const peloBlanco = `url(#blanco-${id})`;
  const { cr, mej, mx, ml } = f;
  const yHocico = 46 + ml * 0.25; // centro del hocico
  const bajoHocico = 52 + ml * 0.9; // borde inferior del hocico
  // Cabeza: cráneo redondeado que se angosta hacia el hocico.
  const cabeza = `M50 ${17 - (f.pelo === 'rulos' ? 2 : 0)} C${50 + cr * 0.75} 17 ${50 + cr} 26 ${50 + cr} 36 C${50 + mej} 46 ${50 + mx + 6} ${bajoHocico - 4} ${50 + mx} ${bajoHocico} C${50 + mx * 0.5} ${bajoHocico + 4} ${50 - mx * 0.5} ${bajoHocico + 4} ${50 - mx} ${bajoHocico} C${50 - mx - 6} ${bajoHocico - 4} ${50 - mej} 46 ${50 - cr} 36 C${50 - cr} 26 ${50 - cr * 0.75} 17 50 ${17 - (f.pelo === 'rulos' ? 2 : 0)}Z`;
  const pecho = 'M18 100 C18 80 32 68 50 66 C68 68 82 80 82 100Z';
  const colorOreja = p.raza === 'dalmata' ? '#2b2b31' : f.tricolor ? '#7a4a2c' : p.color === 'blanco' ? '#e3d9c8' : oscurecer(base, 0.15);
  const nariz = p.nariz === 'rosa' ? '#e48c9c' : '#18181c';
  const iris = f.ojosCelestes ? '#6ab7ff' : '#5a3218';
  const ojoR = f.ojazos ? 4.6 : 3.3;
  const colorMancha = p.raza === 'dalmata' || p.color === 'blanco' ? '#26262c' : oscurecer(base, 0.45);
  const bicolor = p.patron === 'bicolor' && !fuego;
  const hocicoClaro = bicolor || p.color === 'blanco' || ['golden', 'labrador', 'chihuahua'].includes(p.raza);
  const mascaraNegra = f.mascaraNegra;

  return (
    <svg viewBox="0 0 100 100" className="personaje">
      <defs>
        <radialGradient id={`pelo-${id}`} gradientUnits="userSpaceOnUse" cx="42" cy="32" r="70">
          <stop offset="0" stopColor={claro} />
          <stop offset=".5" stopColor={base} />
          <stop offset="1" stopColor={oscuro} />
        </radialGradient>
        <radialGradient id={`blanco-${id}`} gradientUnits="userSpaceOnUse" cx="46" cy="50" r="52">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ddd5c8" />
        </radialGradient>
        <radialGradient id={`iris-${id}`}>
          <stop offset="0" stopColor={aclarar(iris, 0.35)} />
          <stop offset="1" stopColor={oscurecer(iris, 0.3)} />
        </radialGradient>
        <radialGradient id={`nariz-${id}`} cx=".4" cy=".3" r=".8">
          <stop offset="0" stopColor={aclarar(nariz, 0.35)} />
          <stop offset="1" stopColor={nariz} />
        </radialGradient>
        <filter id={`sombra-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.2" floodColor="#1b1020" floodOpacity=".35" />
        </filter>
        <clipPath id={`c-cabeza-${id}`}><path d={cabeza} /></clipPath>
        <clipPath id={`c-pecho-${id}`}><path d={pecho} /></clipPath>
      </defs>

      <g transform={`translate(${50 - 50 * esc} ${100 - 100 * esc}) scale(${esc})`}>
        {/* pecho y cuello */}
        <path d={pecho} fill={pelo} filter={`url(#sombra-${id})`} />
        <g clipPath={`url(#c-pecho-${id})`}>
          {bicolor && <path d="M34 100 C36 84 42 72 50 70 C58 72 64 84 66 100Z" fill={peloBlanco} />}
          {f.montura && !fuego && <path d="M14 100 C16 82 28 70 40 68 L60 68 C72 70 84 82 86 100Z" fill="#26262c" opacity=".55" />}
          {fuego && <path d="M36 100 C38 86 44 76 50 74 C56 76 62 86 64 100Z" fill={colorFuego} />}
          {p.patron === 'manchas' && Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={mancha(rnd, 24 + rnd() * 52, 76 + rnd() * 22, 2 + rnd() * 2.5)} fill={colorMancha} />
          ))}
          {f.pelo !== 'corto' && Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${30 + i * 5} ${74 + (i % 3) * 3} q1 4 -1 8`} stroke={oscurecer(base, 0.2)} strokeWidth=".7" fill="none" opacity=".6" />
          ))}
        </g>

        {/* orejas que van detrás de la cabeza */}
        {['paradas', 'grandes', 'enormes', 'rosa', 'pug'].includes(f.orejas) && [-1, 1].map((s) => (
          <OrejasPerro key={s} tipo={f.orejas} s={s} cr={cr} color={f.orejas === 'pug' ? '#24242a' : p.raza === 'husky' || f.montura ? '#2a2a30' : colorOreja} interior="#e9a0ae" id={id} />
        ))}

        {/* cabeza */}
        <path d={cabeza} fill={pelo} filter={`url(#sombra-${id})`} />
        {f.pelo === 'esponjoso' && (
          <path d={`M${50 - cr - 1} 40 l-4 3 l4 1 l-3 4 l5 -1 l-2 4 l5 -2 M${50 + cr + 1} 40 l4 3 l-4 1 l3 4 l-5 -1 l2 4 l-5 -2`} fill={p.raza === 'husky' ? blanco : pelo} />
        )}
        <g clipPath={`url(#c-cabeza-${id})`}>
          {bicolor && !f.mascara && !f.montura && (
            <path d={`M50 22 C47 30 46 36 ${50 - mx - 3} ${yHocico} C${50 - mx - 4} ${bajoHocico + 6} ${50 + mx + 4} ${bajoHocico + 6} ${50 + mx + 3} ${yHocico} C54 36 53 30 50 22Z`} fill={peloBlanco} />
          )}
          {f.mascara && (
            <path d={`M${50 - cr - 4} 34 C${50 - cr * 0.6} 28 ${50 - 6} 30 50 26 C${50 + 6} 30 ${50 + cr * 0.6} 28 ${50 + cr + 4} 34 L${50 + cr + 6} 70 L${50 - cr - 6} 70Z`} fill={bicolor ? peloBlanco : claro} />
          )}
          {f.mascara && <path d={`M${50 - 3} 18 C 47 26 47 30 50 34 C 53 30 53 26 ${50 + 3} 18Z`} fill={p.color === 'negro' ? '#2f2f36' : base} />}
          {f.tricolor && (
            <>
              <path d={`M${50 - cr - 2} 16 C${50 - 6} 24 ${50 - 4} 30 50 32 C${50 + 4} 30 ${50 + 6} 24 ${50 + cr + 2} 16 L${50 + cr + 2} 10 L${50 - cr - 2} 10Z`} fill="#3a2a22" opacity=".55" />
            </>
          )}
          {f.montura && !fuego && <path d={`M${50 - cr - 2} 14 C${50 - cr} 30 ${50 + cr} 30 ${50 + cr + 2} 14Z`} fill="#26262c" opacity=".55" />}
          {fuego && (
            <g fill={colorFuego}>
              <path d={`M${50 - mx - 4} ${yHocico - 4} C${50 - mx - 6} ${bajoHocico} ${50 + mx + 6} ${bajoHocico} ${50 + mx + 4} ${yHocico - 4} C${50 + mx} ${yHocico + 6} ${50 - mx} ${yHocico + 6} ${50 - mx - 4} ${yHocico - 4}Z`} />
              <ellipse cx={50 - cr * 0.33} cy="27.5" rx="2.6" ry="1.8" />
              <ellipse cx={50 + cr * 0.33} cy="27.5" rx="2.6" ry="1.8" />
            </g>
          )}
          {p.patron === 'manchas' && Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={mancha(rnd, 50 + (rnd() - 0.5) * cr * 1.7, 22 + rnd() * 30, 1.6 + rnd() * 2.2)} fill={colorMancha} />
          ))}
          {/* sombra del contorno */}
          <path d={cabeza} fill="none" stroke={oscuro} strokeWidth="3.4" opacity=".3" />
        </g>
        {f.pelo === 'rulos' && (
          <g>
            {[[-9, 18], [-3, 15], [3, 15], [9, 18], [-6, 22], [0, 20], [6, 22]].map(([dx, y], i) => (
              <circle key={i} cx={50 + dx} cy={y} r="5.5" fill={pelo} />
            ))}
            {[[-7, 17], [-1, 14], [5, 16], [-4, 21], [2, 20]].map(([dx, y], i) => (
              <path key={i} d={`M${50 + dx} ${y} a2.4 2.4 0 1 1 3 1.5`} stroke={oscurecer(base, 0.2)} strokeWidth=".7" fill="none" />
            ))}
          </g>
        )}

        {/* orejas caídas, por delante */}
        {['caidas', 'largas', 'peludas', 'rulos'].includes(f.orejas) && [-1, 1].map((s) => (
          <OrejasPerro key={s} tipo={f.orejas} s={s} cr={cr} color={f.orejas === 'rulos' ? base : colorOreja} interior="#e9a0ae" id={id} />
        ))}

        {/* arrugas */}
        {f.arrugas && (
          <g stroke={oscurecer(base, 0.3)} strokeWidth="1" fill="none" strokeLinecap="round" opacity=".8">
            <path d="M43 27 q7 -3 14 0 M44 31 q6 -2.5 12 0" />
            <path d={`M${50 - mx - 1} ${yHocico - 5} q-3 4 -1 9 M${50 + mx + 1} ${yHocico - 5} q3 4 1 9`} />
          </g>
        )}

        {/* hocico */}
        {p.raza === 'bulldog' ? (
          <g>
            <path d={`M${50 - mx - 4} ${yHocico - 3} C${50 - mx - 6} ${bajoHocico + 8} ${50 - 3} ${bajoHocico + 7} 50 ${bajoHocico - 1} C${50 + 3} ${bajoHocico + 7} ${50 + mx + 6} ${bajoHocico + 8} ${50 + mx + 4} ${yHocico - 3} C${50 + mx} ${yHocico - 8} ${50 - mx} ${yHocico - 8} ${50 - mx - 4} ${yHocico - 3}Z`} fill={p.color === 'blanco' || bicolor ? peloBlanco : claro} filter={`url(#sombra-${id})`} />
            <path d={`M50 ${bajoHocico - 1} C${50 - 4} ${bajoHocico + 6} ${50 - mx} ${bajoHocico + 6} ${50 - mx - 3} ${bajoHocico + 2} M50 ${bajoHocico - 1} C${50 + 4} ${bajoHocico + 6} ${50 + mx} ${bajoHocico + 6} ${50 + mx + 3} ${bajoHocico + 2}`} stroke={oscurecer(base, 0.35)} strokeWidth=".9" fill="none" />
          </g>
        ) : (
          <ellipse cx="50" cy={yHocico + 2} rx={mx + 2} ry={p.raza === 'ovejero' ? ml * 0.32 + 5 : ml * 0.45 + 6} fill={mascaraNegra || p.raza === 'ovejero' ? (p.raza === 'pug' && p.color === 'negro' ? '#1d1d22' : '#2a2a30') : hocicoClaro ? (bicolor || p.color === 'blanco' ? peloBlanco : claro) : pelo} opacity={mascaraNegra || hocicoClaro ? 0.95 : 1} />
        )}
        {/* boca */}
        {f.lengua && (
          <path d={`M46 ${bajoHocico - 1} C46 ${bajoHocico + 9} 54 ${bajoHocico + 9} 54 ${bajoHocico - 1}Z`} fill="#ec6f86" stroke="#b24a5e" strokeWidth=".6" />
        )}
        {f.lengua && <path d={`M50 ${bajoHocico} v5`} stroke="#b24a5e" strokeWidth=".6" />}
        {p.raza !== 'bulldog' && <path d={`M50 ${yHocico + 1} V${bajoHocico - 3} M50 ${bajoHocico - 3} C47 ${bajoHocico} 43 ${bajoHocico} ${50 - mx + 1} ${bajoHocico - 4} M50 ${bajoHocico - 3} C53 ${bajoHocico} 57 ${bajoHocico} ${50 + mx - 1} ${bajoHocico - 4}`} stroke={mascaraNegra || p.raza === 'ovejero' ? '#0e0e10' : '#3b2a26'} strokeWidth="1.1" fill="none" strokeLinecap="round" />}
        {f.dientes && (
          <g>
            <path d={`M${50 - mx * 0.6} ${bajoHocico + 4} Q50 ${bajoHocico + 9} ${50 + mx * 0.6} ${bajoHocico + 4} Q50 ${bajoHocico + 6} ${50 - mx * 0.6} ${bajoHocico + 4}Z`} fill="#5a2a33" />
            <path d={`M${50 - mx * 0.45} ${bajoHocico + 5} l1.2 -3 l1.2 3 M${50 + mx * 0.45 - 2.4} ${bajoHocico + 5} l1.2 -3 l1.2 3`} fill="#fffaf0" stroke="#8a7a6a" strokeWidth=".4" />
          </g>
        )}
        {/* nariz */}
        <path d={`M${50 - mx * 0.42 - 1} ${yHocico - 2} C${50 - mx * 0.42 - 1} ${yHocico - 6} ${50 + mx * 0.42 + 1} ${yHocico - 6} ${50 + mx * 0.42 + 1} ${yHocico - 2} C${50 + mx * 0.3} ${yHocico + 2} ${50 - mx * 0.3} ${yHocico + 2} ${50 - mx * 0.42 - 1} ${yHocico - 2}Z`} fill={`url(#nariz-${id})`} />
        <ellipse cx={50 - mx * 0.18 - 0.5} cy={yHocico - 1.4} rx=".9" ry=".7" fill="#000" opacity=".55" />
        <ellipse cx={50 + mx * 0.18 + 0.5} cy={yHocico - 1.4} rx=".9" ry=".7" fill="#000" opacity=".55" />
        <ellipse cx={50 - 1} cy={yHocico - 4} rx={mx * 0.18 + 0.5} ry=".7" fill="#fff" opacity=".45" />

        {/* ojos con cejas */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <path d={`M${50 + s * (cr * 0.33 - 3.5)} ${33 - ojoR} q${s * 3.5} -2.5 ${s * 7} 0`} stroke={oscurecer(base, 0.3)} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity=".7" />
            {f.tricolor || p.raza === 'ovejero' ? <ellipse cx={50 + s * cr * 0.33} cy={34.5} rx={ojoR + 2} ry={ojoR + 1.5} fill="#2a1c16" opacity=".35" /> : null}
            <Ojo x={50 + s * cr * 0.33} y={34.5} rx={ojoR} ry={ojoR} iris={iris} id={id} />
          </g>
        ))}

        {/* accesorios */}
        {p.accesorio === 'collar' && (
          <g>
            <path d="M33 70 Q50 77 67 70" stroke="#d62839" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M33 70 Q50 77 67 70" stroke="#ff6b7a" strokeWidth="1" fill="none" strokeDasharray="1 3" />
            <circle cx="50" cy="79" r="3.6" fill="#f2c94c" stroke="#a87b10" strokeWidth=".9" />
            <circle cx="49" cy="78" r=".9" fill="#fff" opacity=".7" />
          </g>
        )}
        {p.accesorio === 'panuelo' && (
          <g>
            <path d="M31 68 Q50 76 69 68 L52 90 Q50 92 48 90Z" fill="#2a6fdb" stroke="#1a4a99" strokeWidth="1" strokeLinejoin="round" />
            {[[44, 74], [52, 75], [48, 81], [56, 71], [40, 71]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1" fill="#fff" opacity=".8" />)}
          </g>
        )}
        {p.accesorio === 'mono' && (
          <g transform={`translate(${50 + cr * 0.75} 20) rotate(22)`}>
            <path d="M0 0 C-4 -6 -11 -5 -10 0 C-11 5 -4 6 0 0Z M0 0 C4 -6 11 -5 10 0 C11 5 4 6 0 0Z" fill="#ff5c9a" stroke="#c2185b" strokeWidth=".8" />
            <ellipse rx="2.4" ry="2.8" fill="#e23a83" stroke="#c2185b" strokeWidth=".6" />
          </g>
        )}
      </g>
    </svg>
  );
}

export function Personaje({ tema, p }) {
  return tema === 'perritos' ? <Perro p={p} /> : <Gato p={p} />;
}
