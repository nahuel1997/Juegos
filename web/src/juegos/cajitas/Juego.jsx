import { Cartel, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

// Coordenadas en el SVG: cada caja mide 100; los puntos están en las esquinas.
const PASO = 100;
const M = 20; // margen

export default function JuegoCajitas({ partida, accion, ctx }) {
  const { config, h, v, cajas, ultima } = partida;
  const miTurno = partida.estado === 'jugando' && partida.turno === ctx.yo;
  const colorRival = ctx.colorRival === ctx.colorYo ? '#4fc3f7' : ctx.colorRival;
  const ancho = config.columnas * PASO + M * 2;
  const alto = config.filas * PASO + M * 2;

  const fx = useEfecto(ultima?.cerradas?.length ? `${partida.rayas}` : null, () => {
    if (ultima.por === 'yo') efectoSonido.escoba();
    return { cerradas: ultima.cerradas, por: ultima.por, n: ultima.cerradas.length, ms: 1200 };
  });
  const recien = new Set((fx?.cerradas || []).map(([f, c]) => `${f},${c}`));

  const raya = (tipo, f, c, quien) => {
    const x1 = M + c * PASO;
    const y1 = M + f * PASO;
    const [x2, y2] = tipo === 'h' ? [x1 + PASO, y1] : [x1, y1 + PASO];
    const ult = ultima && ultima.tipo === tipo && ultima.f === f && ultima.c === c;
    return (
      <g key={`${tipo}${f}-${c}`}>
        {quien ? (
          <line x1={x1} y1={y1} x2={x2} y2={y2} className={`caj-raya ${quien} ${ult ? 'ultima' : ''}`} />
        ) : (
          <line
            x1={x1} y1={y1} x2={x2} y2={y2}
            className={`caj-libre ${miTurno ? 'activa' : ''}`}
            onClick={miTurno ? () => accion('raya', { tipo, f, c }) : undefined}
          />
        )}
      </g>
    );
  };

  return (
    <div className="cajitas" style={{ '--yo': ctx.colorYo, '--rival': colorRival }}>
      {fx && fx.n > 1 && <Cartel key={fx.id} tipo={fx.por === 'yo' ? 'oro' : ''} texto={`¡${fx.n} cajitas!`} />}
      <div className="marcador">
        <span>Vos <b>{partida.puntos.yo}</b></span>
        <span className="ronda">{config.filas * config.columnas - partida.puntos.yo - partida.puntos.rival} cajitas libres</span>
        <span><b>{partida.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {partida.estado !== 'jugando' ? 'Partida terminada' : miTurno ? '¡Te toca! Trazá una rayita' : `Juega ${ctx.nombreRival}…`}
        <small>Si cerrás una cajita, es tuya y volvés a jugar.</small>
      </div>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className={`caj-tablero ${miTurno ? 'activo' : ''}`}>
        {cajas.map((fila, f) => fila.map((q, c) => q && (
          <g key={`b${f}-${c}`} className={`caj-caja ${q} ${recien.has(`${f},${c}`) ? 'recien' : ''}`} style={{ transformOrigin: `${M + c * PASO + PASO / 2}px ${M + f * PASO + PASO / 2}px` }}>
            <rect x={M + c * PASO + 6} y={M + f * PASO + 6} width={PASO - 12} height={PASO - 12} rx="10" />
            <text x={M + c * PASO + PASO / 2} y={M + f * PASO + PASO / 2 + 12}>{q === 'yo' ? 'V' : (ctx.nombreRival[0] || '?').toUpperCase()}</text>
          </g>
        )))}
        {h.map((fila, f) => fila.map((q, c) => raya('h', f, c, q)))}
        {v.map((fila, f) => fila.map((q, c) => raya('v', f, c, q)))}
        {Array.from({ length: config.filas + 1 }, (_, f) => Array.from({ length: config.columnas + 1 }, (_, c) => (
          <circle key={`p${f}-${c}`} cx={M + c * PASO} cy={M + f * PASO} r="9" className="caj-punto" />
        )))}
      </svg>
    </div>
  );
}

JuegoCajitas.textoFinal = (p) => `Cajitas: ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoCajitas.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.turno === ctx.yo ? `cj-${p.rayas}` : null);
