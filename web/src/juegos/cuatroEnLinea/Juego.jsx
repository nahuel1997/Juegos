import { useState } from 'react';

export default function JuegoCuatro({ partida, accion, ctx }) {
  const { config, tablero, ultima, linea } = partida;
  const miTurno = partida.estado === 'jugando' && partida.turno === ctx.yo;
  const [hover, setHover] = useState(null);
  const enLinea = new Set((linea || []).map(([f, c]) => `${f},${c}`));
  const llena = (c) => tablero[0][c] !== null;
  // Si los dos eligieron el mismo color en el perfil, el rival va en amarillo.
  const colorRival = ctx.colorRival === ctx.colorYo ? '#ffd54a' : ctx.colorRival;

  return (
    <div className="cuatro" style={{ '--yo': ctx.colorYo, '--rival': colorRival }}>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {partida.estado === 'jugando' ? (miTurno ? '¡Te toca! Elegí una columna' : `Juega ${ctx.nombreRival}…`) : 'Partida terminada'}
        <small>
          <span className="ficha-mini yo" /> vos · <span className="ficha-mini rival" /> {ctx.nombreRival} · {config.enLinea} en línea para ganar
        </small>
      </div>
      <div className="cuatro-tablero" style={{ '--cols': config.columnas }} onMouseLeave={() => setHover(null)}>
        {Array.from({ length: config.columnas }, (_, c) => (
          <button
            key={c}
            type="button"
            className={`cuatro-col ${miTurno && !llena(c) ? 'jugable' : ''} ${hover === c ? 'hover' : ''}`}
            disabled={!miTurno || llena(c)}
            onMouseEnter={() => setHover(c)}
            onClick={() => accion('soltar', { col: c })}
            aria-label={`Columna ${c + 1}`}
          >
            {tablero.map((fila, f) => {
              const v = fila[c];
              const esUltima = ultima && ultima.fila === f && ultima.col === c;
              return (
                <span key={f} className="hueco">
                  {v && (
                    <span
                      key={esUltima ? `u${partida.config.filas}${f}${c}` : undefined}
                      className={`ficha ${v} ${esUltima ? 'cae' : ''} ${enLinea.has(`${f},${c}`) ? 'ganadora' : ''}`}
                      style={esUltima ? { '--desde': `${-(f + 1) * 110}%` } : undefined}
                    />
                  )}
                </span>
              );
            })}
          </button>
        ))}
      </div>
    </div>
  );
}

JuegoCuatro.textoFinal = (p, gane) => (p.motivoFin === 'lleno' ? 'Se llenó el tablero sin cuatro en línea.' : gane ? '¡Cuatro en línea!' : 'Te ganó de mano.');
JuegoCuatro.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.turno === ctx.yo ? `c-${p.tablero.flat().filter(Boolean).length}` : null);
