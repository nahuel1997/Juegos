import { useId } from 'react';

// Barcos vistos desde arriba, dibujados en SVG propio. Se dibujan siempre horizontales (proa a la
// derecha) en una caja de largo×100 y, si van verticales, se giran 90°.
function Casco({ W, alto = 28, popa = 10, punta = 70, grad }) {
  const a = 50 - alto;
  const b = 50 + alto;
  return (
    <path
      className="bq-casco"
      fill={`url(#${grad})`}
      d={`M ${popa} ${a + 6} Q ${popa} ${a} ${popa + 8} ${a} L ${W - punta} ${a} C ${W - 30} ${a} ${W - 8} ${44} ${W - 4} 50 C ${W - 8} ${56} ${W - 30} ${b} ${W - punta} ${b} L ${popa + 8} ${b} Q ${popa} ${b} ${popa} ${b - 6} Z`}
    />
  );
}

// Torreta con su cañón apuntando a proa (1) o a popa (-1).
const Torreta = ({ x, mira = 1, r = 11 }) => (
  <g className="bq-torreta">
    <rect x={mira > 0 ? x : x - r * 2.4} y={47} width={r * 2.4} height={6} rx={3} className="bq-canon" />
    <circle cx={x} cy={50} r={r} />
    <circle cx={x} cy={50} r={r * 0.45} className="bq-tapa" />
  </g>
);

const Avioncito = ({ x, y }) => (
  <path className="bq-avion" transform={`translate(${x} ${y})`} d="M0 -3 L14 -3 L18 0 L14 3 L0 3 Z M6 -3 L10 -14 L13 -14 L11 -3 Z M6 3 L10 14 L13 14 L11 3 Z M0 -3 L-3 -8 L1 -8 L3 -3 Z M0 3 L-3 8 L1 8 L3 3 Z" />
);

function Dibujo({ tipo, largo, grad }) {
  const W = largo * 100;
  if (tipo === 'submarino') {
    return (
      <>
        <ellipse className="bq-casco sub" fill={`url(#${grad})`} cx={W / 2} cy={50} rx={W / 2 - 8} ry={22} />
        <path className="bq-aleta" d={`M 14 50 L 2 30 L 22 44 Z M 14 50 L 2 70 L 22 56 Z`} />
        <line className="bq-linea" x1={40} y1={50} x2={W - 40} y2={50} />
        <rect className="bq-torre" x={W / 2 - 34} y={38} width={68} height={24} rx={12} />
        <circle className="bq-tapa" cx={W / 2 + 18} cy={50} r={5} />
      </>
    );
  }
  if (tipo === 'portaaviones') {
    return (
      <>
        <Casco W={W} alto={36} popa={6} punta={60} grad={grad} />
        <path className="bq-cubierta" d={`M 18 20 L ${W - 70} 20 L ${W - 26} 50 L ${W - 70} 80 L 18 80 Z`} />
        <line className="bq-pista" x1={30} y1={50} x2={W - 60} y2={50} />
        <line className="bq-pista fina" x1={40} y1={70} x2={W * 0.55} y2={28} />
        <rect className="bq-isla" x={W * 0.62} y={12} width={60} height={16} rx={4} />
        <circle className="bq-radar" cx={W * 0.62 + 44} cy={20} r={5} />
        <Avioncito x={60} y={34} />
        <Avioncito x={110} y={66} />
        <Avioncito x={W * 0.42} y={36} />
      </>
    );
  }
  if (tipo === 'acorazado') {
    return (
      <>
        <Casco W={W} alto={30} grad={grad} />
        <path className="bq-cubierta" d={`M 20 30 L ${W - 80} 30 C ${W - 50} 30 ${W - 30} 42 ${W - 22} 50 C ${W - 30} 58 ${W - 50} 70 ${W - 80} 70 L 20 70 Z`} />
        <Torreta x={60} mira={-1} r={13} />
        <rect className="bq-puente" x={W * 0.4} y={36} width={W * 0.2} height={28} rx={6} />
        <circle className="bq-chimenea" cx={W * 0.45} cy={50} r={8} />
        <Torreta x={W - 150} r={13} />
        <Torreta x={W - 95} r={12} />
      </>
    );
  }
  if (tipo === 'crucero') {
    return (
      <>
        <Casco W={W} alto={27} grad={grad} />
        <path className="bq-cubierta" d={`M 20 32 L ${W - 75} 32 C ${W - 50} 32 ${W - 32} 42 ${W - 24} 50 C ${W - 32} 58 ${W - 50} 68 ${W - 75} 68 L 20 68 Z`} />
        <Torreta x={55} mira={-1} />
        <rect className="bq-puente" x={W * 0.36} y={38} width={W * 0.24} height={24} rx={6} />
        <circle className="bq-chimenea" cx={W * 0.43} cy={50} r={7} />
        <circle className="bq-radar" cx={W * 0.55} cy={50} r={6} />
        <Torreta x={W - 90} />
      </>
    );
  }
  // destructor (y cualquier otro)
  return (
    <>
      <Casco W={W} alto={23} popa={12} punta={60} grad={grad} />
      <path className="bq-cubierta" d={`M 22 35 L ${W - 64} 35 C ${W - 44} 35 ${W - 30} 44 ${W - 24} 50 C ${W - 30} 56 ${W - 44} 65 ${W - 64} 65 L 22 65 Z`} />
      <rect className="bq-puente" x={W * 0.3} y={40} width={W * 0.22} height={20} rx={5} />
      <circle className="bq-chimenea" cx={W * 0.36} cy={50} r={6} />
      <Torreta x={W - 70} r={10} />
    </>
  );
}

export function BarcoSVG({ tipo, largo, horizontal = true }) {
  const grad = `bq-g${useId().replace(/:/g, '')}`;
  const W = largo * 100;
  return (
    <svg viewBox={horizontal ? `0 0 ${W} 100` : `0 0 100 ${W}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="bq-c1" />
          <stop offset="1" className="bq-c2" />
        </linearGradient>
      </defs>
      <g transform={horizontal ? undefined : `rotate(90) translate(0 -100)`}>
        <ellipse className="bq-estela" cx={W / 2} cy={50} rx={W / 2 + 4} ry={44} />
        <Dibujo tipo={tipo} largo={largo} grad={grad} />
        <g className="bq-quemado">
          <circle cx={W * 0.3} cy={42} r={14} />
          <circle cx={W * 0.62} cy={58} r={18} />
          <circle cx={W * 0.82} cy={46} r={10} />
        </g>
      </g>
    </svg>
  );
}

// Los barcos encima de la grilla del tablero: cada uno ocupa sus casillas (fila/columna de la grilla).
export function CapaBarcos({ barcos }) {
  return barcos.map((b) => (
    <span
      key={b.id}
      className={`barco-dibujo ${b.horizontal ? 'h' : 'v'} ${b.hundido ? 'hundido' : ''} ${b.recien ? 'recien' : ''} ${b.clase || ''}`}
      style={{
        gridRow: `${b.fila + 2} / span ${b.horizontal ? 1 : b.largo}`,
        gridColumn: `${b.col + 2} / span ${b.horizontal ? b.largo : 1}`,
      }}
    >
      <BarcoSVG tipo={b.tipo} largo={b.largo} horizontal={b.horizontal} />
    </span>
  ));
}
