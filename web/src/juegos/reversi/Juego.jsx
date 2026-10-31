import { Cartel, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

export default function JuegoReversi({ partida, accion, ctx }) {
  const p = partida;
  const miTurno = p.turno === 'yo' && p.estado === 'jugando';
  const posibles = new Map(p.posibles.map((x) => [`${x.f},${x.c}`, x.n]));
  const giradas = new Set((p.ultima?.vueltas || []).map(([f, c]) => `${f},${c}`));
  const clave = p.ultima ? `${p.ultima.fila},${p.ultima.col},${p.fichas.yo + p.fichas.rival}` : null;
  useEfecto(clave, () => { efectoSonido.carta?.(); return null; });
  const paso = useEfecto(p.paso ? `paso-${clave}` : null, () => ({ quien: p.paso }), 1500);
  // Colores de las fichas: las negras son oscuras, las blancas claras.
  const miFicha = p.soyNegras ? 'negra' : 'blanca';
  const suFicha = p.soyNegras ? 'blanca' : 'negra';

  let estado;
  if (p.estado === 'terminada') estado = `Fin: ${p.fichas.yo} a ${p.fichas.rival}`;
  else if (miTurno) estado = '¡Te toca!';
  else estado = `Juega ${ctx.nombreRival}…`;

  return (
    <div className="reversi">
      {paso && <Cartel key={paso.id} texto={paso.quien === 'yo' ? 'No tenés jugada: pasás' : `${ctx.nombreRival} pasa`} />}
      <div className="marcador">
        <span><i className={`rv-mini ${miFicha}`} /> Vos <b>{p.fichas.yo}</b></span>
        <span className="ronda">{p.config.lado}x{p.config.lado}</span>
        <span><b>{p.fichas.rival}</b> {ctx.nombreRival} <i className={`rv-mini ${suFicha}`} /></span>
      </div>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {estado}
        <small>Encerrá fichas del rival en línea para darlas vuelta</small>
      </div>
      <div className={`rv-tablero ${miTurno ? 'activo' : ''}`} style={{ '--lado': p.config.lado }}>
        {p.tablero.map((fila, f) => fila.map((v, c) => {
          const k = `${f},${c}`;
          const puede = miTurno && posibles.has(k);
          const ultima = p.ultima && p.ultima.fila === f && p.ultima.col === c;
          return (
            <button key={k} type="button" className={`rv-celda ${puede ? 'puede' : ''} ${ultima ? 'ultima' : ''}`} disabled={!puede} onClick={() => accion('poner', { fila: f, col: c })} aria-label={`Fila ${f + 1}, columna ${c + 1}`}>
              {v && <span key={`${k}-${v}`} className={`rv-ficha ${v === 'yo' ? miFicha : suFicha} ${giradas.has(k) ? 'gira' : ''} ${ultima ? 'nueva' : ''}`} />}
              {puede && p.config.ayudas && <span className="rv-pista">{posibles.get(k)}</span>}
            </button>
          );
        }))}
      </div>
    </div>
  );
}

JuegoReversi.textoFinal = (p) => `Terminó ${p.fichas.yo} a ${p.fichas.rival}.`;
JuegoReversi.claveTurno = (p) => (p.turno === 'yo' && p.estado === 'jugando' ? `rv-${p.fichas.yo + p.fichas.rival}` : null);
