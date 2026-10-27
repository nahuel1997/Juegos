import { useState } from 'react';
import { Cartel, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

// La cruz y el círculo, dibujados (se trazan solos al aparecer).
const Cruz = () => (
  <svg viewBox="0 0 100 100" className="ttt-marca cruz" aria-hidden="true">
    <path d="M22 22 L78 78" pathLength="1" />
    <path d="M78 22 L22 78" pathLength="1" style={{ animationDelay: '.12s' }} />
  </svg>
);
const Circulo = () => (
  <svg viewBox="0 0 100 100" className="ttt-marca circulo" aria-hidden="true">
    <circle cx="50" cy="50" r="30" pathLength="1" />
  </svg>
);

export default function JuegoTateti({ partida, accion, ctx }) {
  const { tablero, config, linea } = partida;
  const jugando = partida.estado === 'jugando' && partida.fase === 'jugando';
  const miTurno = jugando && partida.turno === ctx.yo;
  const [desde, setDesde] = useState(null); // ficha elegida para mover (variante con movimiento)
  const enLinea = new Set((linea || []).map(([f, c]) => `${f},${c}`));
  // El que arrancó la partida es la cruz.
  const MarcaYo = partida.empece ? Cruz : Circulo;
  const MarcaRival = partida.empece ? Circulo : Cruz;

  const fin = useEfecto(partida.fase === 'fin' ? `f${partida.partida}` : null, () => {
    const r = partida.historial[partida.historial.length - 1];
    if (r === 'yo') efectoSonido.fanfarria();
    return { r };
  }, 2000);

  const tocar = (f, c) => {
    if (!miTurno) return;
    if (partida.moviendo) {
      if (tablero[f][c] === 'yo') return setDesde(desde && desde[0] === f && desde[1] === c ? null : [f, c]);
      if (tablero[f][c] || !desde) return;
      accion('poner', { fila: f, col: c, desde });
      setDesde(null);
      return;
    }
    if (!tablero[f][c]) accion('poner', { fila: f, col: c });
  };

  let estado;
  if (partida.fase === 'fin') estado = `Fin de la partida ${partida.partida}`;
  else if (miTurno) estado = partida.moviendo ? (desde ? 'Ahora tocá una casilla libre' : '¡Te toca! Elegí cuál de tus fichas mover') : '¡Te toca!';
  else estado = `Juega ${ctx.nombreRival}…`;

  const listo = partida.listosSiguiente.includes('yo');
  return (
    <div className="ttt">
      {fin && <Cartel key={fin.id} tipo={fin.r === 'yo' ? 'oro' : fin.r ? 'hundido' : ''} texto={fin.r === 'yo' ? '¡TA TE TI!' : fin.r ? `¡Ganó ${ctx.nombreRival}!` : '¡Empate!'} />}
      <div className="marcador">
        <span>Vos <b>{partida.puntos.yo}</b></span>
        <span className="ronda">Partida {partida.partida} de {config.partidas}</span>
        <span><b>{partida.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {estado}
        <small>Vos sos {partida.empece ? 'la cruz' : 'el círculo'} · {config.enLinea} en línea{config.movimiento ? ' · con movimiento' : ''}</small>
      </div>
      <div className={`ttt-tablero ${miTurno ? 'activo' : ''}`} style={{ '--lado': config.lado, '--yo': ctx.colorYo, '--rival': ctx.colorRival === ctx.colorYo ? '#4fc3f7' : ctx.colorRival }}>
        {tablero.map((fila, f) => fila.map((v, c) => {
          const sel = desde && desde[0] === f && desde[1] === c;
          const puede = miTurno && (partida.moviendo ? (v === 'yo' || (desde && !v)) : !v);
          return (
            <button
              key={`${f},${c}`}
              type="button"
              className={`ttt-celda ${v || ''} ${enLinea.has(`${f},${c}`) ? 'ganadora' : ''} ${sel ? 'sel' : ''} ${puede ? 'puede' : ''}`}
              disabled={!puede}
              onClick={() => tocar(f, c)}
              aria-label={`Fila ${f + 1}, columna ${c + 1}`}
            >
              {v === 'yo' && <MarcaYo />}
              {v === 'rival' && <MarcaRival />}
            </button>
          );
        }))}
      </div>
      {partida.fase === 'fin' && partida.estado === 'jugando' && (
        <div className="acciones centro">
          <button className="btn" disabled={listo} onClick={() => accion('siguiente')}>{listo ? `Esperando a ${ctx.nombreRival}…` : 'Otra partida →'}</button>
        </div>
      )}
    </div>
  );
}

JuegoTateti.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoTateti.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.fase === 'jugando' && p.turno === ctx.yo ? `t-${p.partida}-${p.tablero.flat().filter(Boolean).length}-${p.ultima?.fila}${p.ultima?.col}` : null);
