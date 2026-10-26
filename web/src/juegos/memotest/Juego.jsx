import { useEffect, useRef, useState } from 'react';
import { Icono } from '../../iconos.jsx';

export default function JuegoMemo({ partida, accion, ctx }) {
  const { cartas, puntos, mirando } = partida;
  const miTurno = partida.estado === 'jugando' && partida.turno === ctx.yo;
  const columnas = Math.ceil(Math.sqrt(cartas.length * 1.4));

  // Mientras una carta se tapa (gira 0,45 s) sigue mostrando su dibujo; después se olvida.
  const vistas = useRef({});
  const [, refrescar] = useState(0);
  cartas.forEach((c, i) => { if (c.dibujo) vistas.current[i] = c.dibujo; });
  useEffect(() => {
    const tapadas = cartas.map((c, i) => (!c.dibujo && vistas.current[i] ? i : -1)).filter((i) => i >= 0);
    if (!tapadas.length) return;
    const t = setTimeout(() => { tapadas.forEach((i) => delete vistas.current[i]); refrescar((n) => n + 1); }, 600);
    return () => clearTimeout(t);
  }, [cartas]);

  return (
    <div className="memo" style={{ '--yo': ctx.colorYo, '--rival': ctx.colorRival === ctx.colorYo ? '#9aa5b1' : ctx.colorRival }}>
      <div className="marcador">
        <span>Vos <b>{puntos.yo}</b></span>
        <span className="ronda">Quedan {partida.quedan} pares</span>
        <span><b>{puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${miTurno && !mirando ? 'tu-turno' : ''}`}>
        {partida.estado !== 'jugando' ? 'Partida terminada' : mirando ? 'No son pareja…' : miTurno ? '¡Te toca! Dá vuelta dos cartas' : `Juega ${ctx.nombreRival}…`}
      </div>
      <div className="memo-tablero" style={{ '--cols': columnas }}>
        {cartas.map((c, i) => {
          const vista = !!c.dibujo;
          return (
            <button
              key={i}
              type="button"
              className={`memo-carta ${vista ? 'vista' : ''} ${c.de ? `de-${c.de}` : ''} ${c.abierta ? 'abierta' : ''}`}
              disabled={!miTurno || mirando || vista}
              onClick={() => accion('voltear', { i })}
              aria-label={vista ? c.dibujo : 'Carta tapada'}
            >
              <span className="memo-interior">
                <span className="memo-dorso"><Icono id="estrella" tam={28} /></span>
                <span className="memo-frente">{(c.dibujo || vistas.current[i]) && <Icono id={c.dibujo || vistas.current[i]} tam={64} />}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

JuegoMemo.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival} en pares.`;
JuegoMemo.claveTurno = (p, ctx) =>
  p.estado === 'jugando' && p.turno === ctx.yo && !p.mirando ? `m-${p.quedan}-${p.puntos.rival}` : null;
