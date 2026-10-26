// Gatitos y perritos dibujados en SVG a partir de sus características (las mismas que se preguntan).
// Grilla de 100x100.

const T = '#2b2233';

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

// ---------------- Gatitos ----------------
const GATO_COLOR = {
  naranja: ['#f29a3a', '#c4651a'],
  gris: ['#a3acb6', '#6b7480'],
  negro: ['#35353f', '#18181d'],
  blanco: ['#f8f5ef', '#d6cebf'],
  crema: ['#f1d9b0', '#c9a46a'],
  marron: ['#8b5a3c', '#5e3a24'],
};
const OJOS = { verde: '#5cc46b', azul: '#4fa8ff', amarillo: '#f5c518' };
const ANCHO_CUERPO = { flaquito: 16, normal: 22, gordito: 30 };

export function Gato({ p }) {
  const [base, oscuro] = GATO_COLOR[p.color];
  const rx = ANCHO_CUERPO[p.tamano];
  const cachete = p.tamano === 'gordito' ? 22 : p.tamano === 'flaquito' ? 17 : 19;
  const rnd = semilla(p.nombre);
  const blanco = '#fbf8f2';
  const manchas = p.color === 'blanco' ? ['#f29a3a', '#35353f'] : [oscuro, p.color === 'negro' ? '#f8f5ef' : '#fbf8f2'];
  const idClip = `cuerpo-${p.nombre}`;
  return (
    <svg viewBox="0 0 100 100" className="personaje">
      <defs>
        <clipPath id={idClip}>
          <ellipse cx="50" cy="74" rx={rx} ry="21" />
          <ellipse cx="50" cy="40" rx={cachete} ry="19" />
        </clipPath>
      </defs>
      {/* cola */}
      <path d={`M${50 + rx - 4} 82 q ${16 + rx / 3} -2 ${12 + rx / 4} -26 q -2 -8 4 -10`} stroke={base} strokeWidth="7" fill="none" strokeLinecap="round" />
      {p.patron === 'atigrado' && <path d={`M${58 + rx} 66 l 5 2 M${60 + rx} 58 l 5 1`} stroke={oscuro} strokeWidth="2.5" strokeLinecap="round" />}
      {/* cuerpo */}
      <ellipse cx="50" cy="74" rx={rx} ry="21" fill={base} stroke={T} strokeWidth="2" />
      {/* orejas */}
      <path d={`M${50 - cachete + 3} 30 L${50 - cachete + 1} 10 L${50 - 6} 24 Z`} fill={base} stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <path d={`M${50 + cachete - 3} 30 L${50 + cachete - 1} 10 L${50 + 6} 24 Z`} fill={base} stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <path d={`M${50 - cachete + 5} 27 L${50 - cachete + 4} 15 L${50 - 9} 24 Z`} fill="#f7a8b8" />
      <path d={`M${50 + cachete - 5} 27 L${50 + cachete - 4} 15 L${50 + 9} 24 Z`} fill="#f7a8b8" />
      {/* cabeza */}
      <ellipse cx="50" cy="40" rx={cachete} ry="19" fill={base} stroke={T} strokeWidth="2" />
      {/* pelaje */}
      <g clipPath={`url(#${idClip})`}>
        {p.patron === 'atigrado' && (
          <g stroke={oscuro} strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M44 24 l1 7 M50 22 v8 M56 24 l-1 7" />
            <path d={`M${50 - cachete} 40 h6 M${50 + cachete} 40 h-6 M${50 - cachete} 46 h5 M${50 + cachete} 46 h-5`} />
            {[60, 68, 76, 84].map((y) => <path key={y} d={`M${50 - rx} ${y} q ${rx} 6 ${2 * rx} 0`} />)}
          </g>
        )}
        {p.patron === 'manchas' && Array.from({ length: 6 }, (_, i) => (
          <ellipse key={i} cx={30 + rnd() * 40} cy={i < 2 ? 30 + rnd() * 18 : 60 + rnd() * 28} rx={4 + rnd() * 5} ry={3 + rnd() * 4} fill={manchas[i % 2]} />
        ))}
        {p.patron === 'bicolor' && (
          <>
            <ellipse cx="50" cy="80" rx={rx * 0.62} ry="17" fill={blanco} />
            <path d="M50 32 q -12 6 -12 18 q 12 6 24 0 q 0 -12 -12 -18z" fill={blanco} />
          </>
        )}
      </g>
      {/* patitas */}
      <ellipse cx={50 - rx / 2} cy="93" rx="6" ry="4" fill={p.patron === 'bicolor' ? blanco : base} stroke={T} strokeWidth="1.6" />
      <ellipse cx={50 + rx / 2} cy="93" rx="6" ry="4" fill={p.patron === 'bicolor' ? blanco : base} stroke={T} strokeWidth="1.6" />
      {/* ojos */}
      {[42, 58].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="38" rx="4.6" ry="5.2" fill={OJOS[p.ojos]} stroke={T} strokeWidth="1.2" />
          <ellipse cx={x} cy="38.5" rx="1.4" ry="4" fill={T} />
          <circle cx={x + 1.5} cy="36" r="1.2" fill="#fff" />
        </g>
      ))}
      {/* nariz, boca y bigotes */}
      <path d="M47.5 45 h5 l-2.5 3z" fill="#f08aa0" />
      <path d="M50 48 q -3 4 -6 2 M50 48 q 3 4 6 2" stroke={T} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M38 46 l-12 -2 M38 49 l-12 2 M62 46 l12 -2 M62 49 l12 2" stroke={p.color === 'negro' ? '#ddd' : T} strokeWidth="0.9" strokeLinecap="round" opacity=".7" />
      {/* accesorios */}
      {p.accesorio === 'collar' && (
        <>
          <path d={`M${50 - 15} 57 q 15 6 30 0`} stroke="#e63946" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="62" r="3" fill="#ffc83d" stroke="#b8860b" strokeWidth="1" />
        </>
      )}
      {p.accesorio === 'mono' && (
        <g transform={`translate(${50 + cachete - 6} 22) rotate(20)`}>
          <path d="M0 0 l-9 -6 v12z M0 0 l9 -6 v12z" fill="#ff5c9a" stroke="#c2185b" strokeWidth="1" />
          <circle r="2.5" fill="#c2185b" />
        </g>
      )}
      {p.accesorio === 'anteojos' && (
        <g fill="none" stroke={p.color === 'negro' ? '#ddd' : T} strokeWidth="1.8">
          <circle cx="42" cy="38" r="7" />
          <circle cx="58" cy="38" r="7" />
          <path d="M49 38 h2" />
        </g>
      )}
    </svg>
  );
}

// ---------------- Perritos ----------------
const PERRO_COLOR = {
  caramelo: ['#d9a066', '#a8743c'],
  negro: ['#34343c', '#1b1b20'],
  blanco: ['#f8f5ef', '#d8d0c2'],
  marron: ['#7b4a2e', '#4e2e1b'],
  gris: ['#9aa3ad', '#646d78'],
  dorado: ['#e8b85a', '#c08a2e'],
};
// Forma de cada raza: cabeza (rx, ry), largo del hocico, tipo de orejas y extras.
const RAZAS = {
  pitbull: { rx: 26, ry: 21, hocico: 15, ancho: 17, orejas: 'rosa', extra: 'pecho' },
  caniche: { rx: 18, ry: 19, hocico: 15, ancho: 9, orejas: 'rulos', extra: 'copete' },
  salchicha: { rx: 18, ry: 17, hocico: 20, ancho: 10, orejas: 'largas' },
  labrador: { rx: 22, ry: 20, hocico: 15, ancho: 13, orejas: 'caidas' },
  chihuahua: { rx: 19, ry: 18, hocico: 9, ancho: 8, orejas: 'enormes', extra: 'ojazos' },
  bulldog: { rx: 27, ry: 20, hocico: 8, ancho: 20, orejas: 'chicas', extra: 'papada' },
  golden: { rx: 22, ry: 20, hocico: 15, ancho: 13, orejas: 'peludas' },
  dalmata: { rx: 21, ry: 20, hocico: 15, ancho: 12, orejas: 'caidas' },
  beagle: { rx: 21, ry: 19, hocico: 13, ancho: 13, orejas: 'largas', extra: 'blaze' },
  husky: { rx: 22, ry: 20, hocico: 14, ancho: 12, orejas: 'paradas', extra: 'mascara' },
  pug: { rx: 23, ry: 20, hocico: 6, ancho: 16, orejas: 'chicas', extra: 'arrugas' },
  ovejero: { rx: 21, ry: 20, hocico: 18, ancho: 11, orejas: 'grandes', extra: 'montura' },
};
const ESCALA = { chico: 0.78, mediano: 0.9, grande: 1 };

function Orejas({ tipo, base, oscuro, rx }) {
  const izq = 50 - rx + 4;
  const der = 50 + rx - 4;
  switch (tipo) {
    case 'paradas':
    case 'grandes':
    case 'enormes': {
      const alto = tipo === 'enormes' ? 30 : tipo === 'grandes' ? 26 : 20;
      const ancho = tipo === 'enormes' ? 15 : 10;
      return (
        <>
          <path d={`M${izq - 2} 34 L${izq - ancho} ${34 - alto} L${izq + ancho} 26 Z`} fill={base} stroke={T} strokeWidth="2" strokeLinejoin="round" />
          <path d={`M${der + 2} 34 L${der + ancho} ${34 - alto} L${der - ancho} 26 Z`} fill={base} stroke={T} strokeWidth="2" strokeLinejoin="round" />
          <path d={`M${izq} 30 L${izq - ancho + 4} ${36 - alto} L${izq + ancho - 4} 28 Z`} fill="#f2a7b5" />
          <path d={`M${der} 30 L${der + ancho - 4} ${36 - alto} L${der - ancho + 4} 28 Z`} fill="#f2a7b5" />
        </>
      );
    }
    case 'rosa':
    case 'chicas':
      return (
        <>
          <path d={`M${izq + 2} 28 q -12 -6 -10 8 q 6 -2 12 -2z`} fill={oscuro} stroke={T} strokeWidth="1.8" />
          <path d={`M${der - 2} 28 q 12 -6 10 8 q -6 -2 -12 -2z`} fill={oscuro} stroke={T} strokeWidth="1.8" />
        </>
      );
    case 'rulos':
      return (
        <>
          {[0, 1, 2, 3].map((i) => <circle key={`i${i}`} cx={izq - 4 + (i % 2) * 3} cy={36 + i * 7} r="6" fill={base} stroke={T} strokeWidth="1.5" />)}
          {[0, 1, 2, 3].map((i) => <circle key={`d${i}`} cx={der + 4 - (i % 2) * 3} cy={36 + i * 7} r="6" fill={base} stroke={T} strokeWidth="1.5" />)}
        </>
      );
    case 'largas':
      return (
        <>
          <path d={`M${izq + 4} 30 q -16 4 -10 34 q 8 2 12 -8 z`} fill={oscuro} stroke={T} strokeWidth="2" />
          <path d={`M${der - 4} 30 q 16 4 10 34 q -8 2 -12 -8 z`} fill={oscuro} stroke={T} strokeWidth="2" />
        </>
      );
    case 'peludas':
      return (
        <>
          <path d={`M${izq + 4} 30 q -16 2 -12 26 q 4 4 8 0 q 2 4 6 0 z`} fill={oscuro} stroke={T} strokeWidth="2" />
          <path d={`M${der - 4} 30 q 16 2 12 26 q -4 4 -8 0 q -2 4 -6 0 z`} fill={oscuro} stroke={T} strokeWidth="2" />
        </>
      );
    default: // caidas
      return (
        <>
          <path d={`M${izq + 3} 30 q -14 2 -10 24 q 8 2 12 -6 z`} fill={oscuro} stroke={T} strokeWidth="2" />
          <path d={`M${der - 3} 30 q 14 2 10 24 q -8 2 -12 -6 z`} fill={oscuro} stroke={T} strokeWidth="2" />
        </>
      );
  }
}

export function Perro({ p }) {
  const forma = RAZAS[p.raza];
  let [base, oscuro] = PERRO_COLOR[p.color];
  if (p.raza === 'dalmata') [base, oscuro] = ['#f8f5ef', '#d8d0c2'];
  const blanco = '#fbf8f2';
  const esc = ESCALA[p.tamano];
  const rnd = semilla(p.nombre);
  const { rx, ry, hocico, ancho } = forma;
  const cy = 46;
  const nariz = p.nariz === 'rosa' ? '#f08aa0' : '#1d1d22';
  const idClip = `cara-${p.nombre}`;
  const colorMancha = p.color === 'blanco' || p.raza === 'dalmata' ? '#22222a' : oscuro;
  const ojazos = forma.extra === 'ojazos';
  const ojosColor = p.raza === 'husky' ? '#4fa8ff' : '#3b2416';
  const orejasTipo = p.orejas === 'paradas' && !['paradas', 'grandes', 'enormes'].includes(forma.orejas) ? 'paradas' : forma.orejas;

  return (
    <svg viewBox="0 0 100 100" className="personaje">
      <defs>
        <clipPath id={idClip}>
          <ellipse cx="50" cy={cy} rx={rx} ry={ry} />
          <path d="M22 100 q 0 -26 28 -30 q 28 4 28 30z" />
        </clipPath>
      </defs>
      <g transform={`translate(${50 - 50 * esc} ${100 - 100 * esc}) scale(${esc})`}>
        {/* pecho */}
        <path d="M22 100 q 0 -26 28 -30 q 28 4 28 30z" fill={base} stroke={T} strokeWidth="2" />
        <Orejas tipo={orejasTipo} base={base} oscuro={p.raza === 'dalmata' ? '#22222a' : p.color === 'blanco' ? '#d8d0c2' : oscuro} rx={rx} />
        {/* cabeza */}
        <ellipse cx="50" cy={cy} rx={rx} ry={ry} fill={base} stroke={T} strokeWidth="2" />
        <g clipPath={`url(#${idClip})`}>
          {p.patron === 'bicolor' && forma.extra !== 'mascara' && forma.extra !== 'montura' && (
            <>
              <path d={`M50 ${cy - ry} q -5 ${ry} -${ancho} ${ry + 14} h ${2 * ancho} q -${ancho - 5} -14 -${ancho} -${ry + 14} z`} fill={blanco} />
              <path d="M34 100 q 0 -20 16 -24 q 16 4 16 24z" fill={blanco} />
            </>
          )}
          {forma.extra === 'mascara' && p.patron === 'bicolor' && (
            <path d={`M${50 - rx} ${cy + 2} q 4 -12 14 -10 q 6 -10 12 0 q 10 -2 14 10 v 30 h -${2 * rx} z`} fill={blanco} />
          )}
          {forma.extra === 'montura' && (
            <>
              <path d={`M${50 - rx} ${cy - 4} q ${rx} -${ry} ${2 * rx} 0 v -${ry} h -${2 * rx} z`} fill={oscuro === '#1b1b20' ? '#1b1b20' : '#2b2b33'} opacity=".85" />
              <path d="M22 100 q 4 -18 14 -22 l 28 0 q 10 4 14 22 z" fill="#2b2b33" opacity=".4" />
            </>
          )}
          {p.patron === 'manchas' && Array.from({ length: 9 }, (_, i) => (
            <ellipse key={i} cx={28 + rnd() * 44} cy={i < 5 ? cy - ry + 4 + rnd() * (ry * 1.6) : 78 + rnd() * 18} rx={2.5 + rnd() * 3.5} ry={2 + rnd() * 3} fill={colorMancha} />
          ))}
        </g>
        {forma.extra === 'copete' && [36, 44, 52, 60, 48, 56, 40].map((x, i) => (
          <circle key={i} cx={x + 2} cy={cy - ry + (i > 3 ? -2 : 4)} r="7" fill={base} stroke={T} strokeWidth="1.5" />
        ))}
        {forma.extra === 'arrugas' && (
          <path d={`M42 ${cy - 10} q 8 -4 16 0 M44 ${cy - 6} q 6 -3 12 0`} stroke={oscuro} strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {/* hocico */}
        <ellipse cx="50" cy={cy + 8 + hocico / 4} rx={ancho} ry={hocico / 2 + 5} fill={p.raza === 'pug' ? '#2b2b33' : p.patron === 'bicolor' || p.color === 'blanco' ? blanco : base} stroke={T} strokeWidth="1.8" />
        {forma.extra === 'papada' && (
          <path d={`M${50 - ancho} ${cy + 12} q 0 14 ${ancho} 14 q ${ancho} 0 ${ancho} -14`} fill={base} stroke={T} strokeWidth="1.8" />
        )}
        {/* nariz y boca */}
        <ellipse cx="50" cy={cy + 6 + hocico / 6} rx={ancho > 14 ? 6 : 4.5} ry="3.4" fill={nariz} stroke={T} strokeWidth="1" />
        <path d={`M50 ${cy + 9 + hocico / 6} v4 M50 ${cy + 13 + hocico / 6} q -4 4 -8 1 M50 ${cy + 13 + hocico / 6} q 4 4 8 1`} stroke={T} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {(p.raza === 'pitbull' || p.raza === 'bulldog') && <path d={`M44 ${cy + 15 + hocico / 6} l2 3 l2 -3 M52 ${cy + 15 + hocico / 6} l2 3 l2 -3`} fill="#fff" stroke={T} strokeWidth=".8" />}
        <path d={`M47 ${cy + 16 + hocico / 6} q 3 6 6 0`} fill="#ff7a8a" />
        {/* ojos */}
        {[50 - rx * 0.42, 50 + rx * 0.42].map((x) => (
          <g key={x}>
            <circle cx={x} cy={cy - 3} r={ojazos ? 5.5 : 3.8} fill={ojosColor} stroke={T} strokeWidth="1" />
            <circle cx={x + 1.2} cy={cy - 4.5} r={ojazos ? 1.8 : 1.2} fill="#fff" />
          </g>
        ))}
        {p.raza === 'beagle' || p.raza === 'husky' ? null : <path d={`M${50 - rx * 0.55} ${cy - 10} q 4 -3 8 0 M${50 + rx * 0.55 - 8} ${cy - 10} q 4 -3 8 0`} stroke={T} strokeWidth="1.2" fill="none" opacity=".5" />}
        {/* accesorios */}
        {p.accesorio === 'collar' && (
          <>
            <path d={`M30 ${cy + ry + 2} q 20 8 40 0`} stroke="#e63946" strokeWidth="5" fill="none" strokeLinecap="round" />
            <circle cx="50" cy={cy + ry + 10} r="3.5" fill="#ffc83d" stroke="#b8860b" strokeWidth="1" />
          </>
        )}
        {p.accesorio === 'panuelo' && (
          <path d={`M30 ${cy + ry} q 20 6 40 0 l -20 18 z`} fill="#2a6fdb" stroke="#1a4a99" strokeWidth="1.5" strokeLinejoin="round" />
        )}
        {p.accesorio === 'mono' && (
          <g transform={`translate(${50 + rx - 6} ${cy - ry + 4}) rotate(20)`}>
            <path d="M0 0 l-9 -6 v12z M0 0 l9 -6 v12z" fill="#ff5c9a" stroke="#c2185b" strokeWidth="1" />
            <circle r="2.5" fill="#c2185b" />
          </g>
        )}
      </g>
    </svg>
  );
}

export function Personaje({ tema, p }) {
  return tema === 'perritos' ? <Perro p={p} /> : <Gato p={p} />;
}
