import { Icono } from '../../iconos.jsx';

// Recorrido común de 52 casillas en el tablero de 15x15 (fila, columna), empezando en la salida roja.
const TRACK = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0],
];
const SALIDAS = [0, 26];
const SEGURAS = [0, 8, 13, 21, 26, 34, 39, 47];
const PASILLO = [
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
];
const META = [[7, 6.3], [7, 7.7]];
const CASA = [
  [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  [[10.5, 10.5], [10.5, 12.5], [12.5, 10.5], [12.5, 12.5]],
];
const COLOR = ['#e63946', '#f2b705'];
const NOMBRE_COLOR = ['rojas', 'amarillas'];
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function lugar(color, pos, i) {
  if (pos === -1) return CASA[color][i];
  if (pos <= 50) return TRACK[(SALIDAS[color] + pos) % 52];
  if (pos <= 55) return PASILLO[color][pos - 51];
  return META[color];
}

// Clases de cada casilla del tablero (para pintarlo).
const CASILLAS = (() => {
  const m = new Map();
  TRACK.forEach(([f, c], i) => m.set(`${f},${c}`, `camino ${SEGURAS.includes(i) ? 'segura' : ''} ${i === 0 ? 'salida-0' : i === 26 ? 'salida-1' : i === 13 ? 'salida-2' : i === 39 ? 'salida-3' : ''}`));
  PASILLO[0].forEach(([f, c]) => m.set(`${f},${c}`, 'pasillo-0'));
  PASILLO[1].forEach(([f, c]) => m.set(`${f},${c}`, 'pasillo-1'));
  return m;
})();

export default function JuegoLudo({ partida, accion, ctx }) {
  const { piezas, colores, dado, movibles, ultimo } = partida;
  const miTurno = partida.estado === 'jugando' && partida.turno === ctx.yo;
  const fichas = [
    ...piezas.rival.map((pos, i) => ({ pos, i, color: colores.rival, mia: false })),
    ...piezas.yo.map((pos, i) => ({ pos, i, color: colores.yo, mia: true })),
  ];
  // Varias fichas en la misma casilla: se corren un poquito para que se vean.
  const ocupacion = {};
  const ubicadas = fichas.map((f) => {
    const [fila, col] = lugar(f.color, f.pos, f.i);
    const clave = `${fila},${col}`;
    const n = (ocupacion[clave] = (ocupacion[clave] || 0) + 1) - 1;
    return { ...f, fila, col, dx: n * 0.18, dy: n * -0.18 };
  });
  const valorDado = dado ?? (ultimo?.dado || null);

  return (
    <div className="ludo">
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {partida.estado !== 'jugando' ? 'Partida terminada' : miTurno ? (dado ? `Sacaste ${dado}: mové una ficha` : '¡Te toca tirar!') : `Juega ${ctx.nombreRival}…`}
        <small>
          Sos las {NOMBRE_COLOR[colores.yo]} · en la meta: vos {partida.enMeta.yo}/4, {ctx.nombreRival} {partida.enMeta.rival}/4
          {ultimo?.sinJugada ? ` · ${ultimo.mio ? 'no tenías' : `${ctx.nombreRival} no tenía`} jugada con ${ultimo.dado}` : ''}
          {ultimo?.comio ? ` · ¡${ultimo.mio ? 'comiste' : `${ctx.nombreRival} te comió`} una ficha!` : ''}
        </small>
      </div>
      <div className="ludo-juego">
        <div className="ludo-tablero">
          {Array.from({ length: 225 }, (_, k) => {
            const f = Math.floor(k / 15);
            const c = k % 15;
            const clase = CASILLAS.get(`${f},${c}`);
            return (
              <div key={k} className={`lc ${clase || ''}`}>
                {clase?.includes('segura') && !clase.includes('salida') && <Icono id="estrella" tam={14} />}
              </div>
            );
          })}
          <div className="ludo-casa c0" />
          <div className="ludo-casa c1" />
          <div className="ludo-casa c2" />
          <div className="ludo-casa c3" />
          <div className="ludo-centro" />
          {ubicadas.map((f) => (
            <button
              key={`${f.mia ? 'y' : 'r'}${f.i}`}
              type="button"
              className={`ludo-ficha ${f.mia && movibles[f.i] ? 'movible' : ''}`}
              style={{ left: `${((f.col + 0.5 + f.dx) / 15) * 100}%`, top: `${((f.fila + 0.5 + f.dy) / 15) * 100}%`, '--c': COLOR[f.color] }}
              disabled={!(f.mia && movibles[f.i])}
              onClick={() => accion('mover', { pieza: f.i })}
              aria-label={`Ficha ${f.i + 1} ${f.mia ? 'tuya' : 'del rival'}`}
            />
          ))}
        </div>
        <div className="ludo-panel">
          <div className={`dado grande-dado ${ultimo ? 'tirado' : ''}`} key={ultimo?.n}>
            {Array.from({ length: 9 }, (_, i) => <i key={i} className={valorDado && PIPS[valorDado].includes(i) ? 'pip' : ''} />)}
          </div>
          {miTurno && !dado && <button className="btn grande" onClick={() => accion('tirar')}>Tirar el dado</button>}
          {miTurno && dado && <p className="ayuda">Tocá una de tus fichas que brillan.</p>}
        </div>
      </div>
    </div>
  );
}

JuegoLudo.textoFinal = (p, gane) => (gane ? 'Llevaste tus cuatro fichas a la meta.' : 'Llegó primero a la meta.');
JuegoLudo.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.turno === ctx.yo && !p.dado ? `l-${p.ultimo?.n || 0}` : null);
