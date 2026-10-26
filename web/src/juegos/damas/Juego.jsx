import { useEffect, useState } from 'react';
import { Icono } from '../../iconos.jsx';

const igual = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];

export default function JuegoDamas({ partida, accion, ctx }) {
  const { tablero, movidas, cadena, ultima, invertir } = partida;
  const n = tablero.length;
  const miTurno = partida.estado === 'jugando' && partida.turno === ctx.yo;
  const [sel, setSel] = useState(null);

  // Si hay que seguir comiendo, la pieza queda elegida sola.
  useEffect(() => {
    setSel(cadena || null);
  }, [cadena, partida.turno, ultima?.a?.[0], ultima?.a?.[1]]);

  const conMovidas = new Set(movidas.map((m) => `${m.de[0]},${m.de[1]}`));
  const destinos = sel ? movidas.filter((m) => igual(m.de, sel)) : [];
  const obligado = movidas.some((m) => m.come);
  const orden = (i) => (invertir ? n - 1 - i : i); // cada uno ve sus piezas abajo
  const colorRival = ctx.colorRival === ctx.colorYo ? '#3a3a3a' : ctx.colorRival;

  function tocar(f, c) {
    if (!miTurno) return;
    const destino = destinos.find((m) => igual(m.a, [f, c]));
    if (destino) {
      accion('mover', { de: destino.de, a: destino.a });
      return;
    }
    if (cadena) return;
    if (conMovidas.has(`${f},${c}`)) setSel(igual(sel, [f, c]) ? null : [f, c]);
  }

  return (
    <div className="damas" style={{ '--yo': ctx.colorYo, '--rival': colorRival }}>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {partida.estado !== 'jugando'
          ? 'Partida terminada'
          : miTurno
            ? cadena ? '¡Seguí comiendo con la misma pieza!' : obligado ? '¡Te toca! Tenés que comer' : '¡Te toca!'
            : `Juega ${ctx.nombreRival}…`}
        <small>Vos: {partida.piezas.yo} piezas · {ctx.nombreRival}: {partida.piezas.rival}{ultima?.corona ? ' · ¡se coronó una dama!' : ''}</small>
      </div>
      <div className="damas-tablero" style={{ '--n': n }}>
        {Array.from({ length: n }, (_, i) => orden(i)).map((f) =>
          Array.from({ length: n }, (_, k) => orden(k)).map((c) => {
            const p = tablero[f][c];
            const oscura = (f + c) % 2 === 1;
            const esDestino = destinos.find((m) => igual(m.a, [f, c]));
            const clases = [
              'casilla',
              oscura ? 'oscura' : 'clara',
              igual(sel, [f, c]) ? 'sel' : '',
              esDestino ? (esDestino.come ? 'destino come' : 'destino') : '',
              miTurno && !sel && conMovidas.has(`${f},${c}`) ? 'movible' : '',
              ultima && (igual(ultima.de, [f, c]) || igual(ultima.a, [f, c])) ? 'ultima' : '',
            ].join(' ');
            return (
              <button key={`${f}-${c}`} type="button" className={clases} onClick={() => tocar(f, c)} disabled={!oscura} aria-label={`${f + 1}-${c + 1}${p ? (p.mia ? ', tuya' : ', del rival') : ''}`}>
                {p && (
                  <span className={`pieza ${p.mia ? 'yo' : 'rival'} ${p.dama ? 'dama' : ''}`}>
                    {p.dama && <Icono id="corona" tam={22} />}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
      {miTurno && <p className="ayuda">Tocá una pieza que se pueda mover (las que brillan) y después la casilla de destino.</p>}
    </div>
  );
}

JuegoDamas.textoFinal = (p, gane) =>
  p.motivoFin === 'tablas' ? 'Demasiadas jugadas sin avanzar: tablas.' : p.motivoFin === 'bloqueo' ? (gane ? 'Dejaste al rival sin movimientos.' : 'Te quedaste sin movimientos.') : gane ? 'Te comiste todas sus piezas.' : 'Te comieron todas las piezas.';
JuegoDamas.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.turno === ctx.yo && !p.cadena ? `d-${p.piezas.yo}-${p.piezas.rival}-${p.ultima ? p.ultima.a.join() : ''}` : null);
