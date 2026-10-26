import { useEffect, useState } from 'react';

const PALO = { oros: '🪙', copas: '🍷', espadas: '🗡️', bastos: '🪵' };
const FIGURA = { 10: 'Sota', 11: 'Caballo', 12: 'Rey' };

export function Carta({ carta, seleccionada, onClick, chica }) {
  if (!carta) return <div className={`carta dorso ${chica ? 'chica' : ''}`} />;
  return (
    <button type="button" className={`carta palo-${carta.palo} ${seleccionada ? 'sel' : ''} ${chica ? 'chica' : ''}`} onClick={onClick} disabled={!onClick} title={`${FIGURA[carta.numero] || carta.numero} de ${carta.palo} (vale ${carta.valor})`}>
      <span className="num">{carta.numero}</span>
      <span className="palo">{PALO[carta.palo]}</span>
      <span className="fig">{FIGURA[carta.numero] || ''}</span>
      <span className="val">{carta.valor}</span>
    </button>
  );
}

// Busca cartas de la mesa que sumen 15 con la carta elegida (para el botón de ayuda).
function buscarQuince(carta, mesa) {
  for (let m = 1; m < 1 << mesa.length; m++) {
    const sel = mesa.filter((_, i) => m & (1 << i));
    if (carta.valor + sel.reduce((s, c) => s + c.valor, 0) === 15) return sel.map((c) => c.id);
  }
  return null;
}

function textoUltima(u, ctx) {
  if (!u) return null;
  const quien = u.por === ctx.yo ? 'Vos' : ctx.nombreRival;
  if (u.tipo === 'mesa-inicial') return `La mesa sumaba 15: ${quien === 'Vos' ? 'te la llevaste' : `se la llevó ${quien}`} (¡escoba!)`;
  if (u.tipo === 'tiro') return `${quien} tiró un ${u.carta.numero} de ${u.carta.palo}`;
  return `${quien} levantó ${u.cartas.length + 1} cartas con el ${u.carta.numero} de ${u.carta.palo}${u.escoba ? ' · ¡ESCOBA! 🧹' : ''}`;
}

function Resumen({ partida, accion, ctx }) {
  const r = partida.resumen;
  const listoYo = partida.listosSiguiente.includes(ctx.yo);
  const fila = (nombre, clave) => (
    <tr><td>{nombre}</td><td>{r[clave].yo}</td><td>{r[clave].rival}</td></tr>
  );
  return (
    <div className="tarjeta resumen-mano">
      <h3>Fin de la mano {partida.mano}</h3>
      <table className="planilla">
        <thead><tr><th /><th>Vos</th><th>{ctx.nombreRival}</th></tr></thead>
        <tbody>
          {fila('Cartas', 'cartas')}
          {fila('Oros', 'oros')}
          {fila('Sietes', 'sietes')}
          <tr><td>Escobas</td><td>{partida.escobas.yo}</td><td>{partida.escobas.rival}</td></tr>
          <tr className="total"><td>Puntos de la mano</td><td>{r.detalle.yo.length}</td><td>{r.detalle.rival.length}</td></tr>
        </tbody>
      </table>
      <p className="sub">Vos: {r.detalle.yo.join(', ') || 'nada'} · {ctx.nombreRival}: {r.detalle.rival.join(', ') || 'nada'}</p>
      {partida.estado === 'jugando' && (
        <button className="btn" disabled={listoYo} onClick={() => accion('siguiente')}>
          {listoYo ? `Esperando a ${ctx.nombreRival}…` : 'Siguiente mano →'}
        </button>
      )}
    </div>
  );
}

export default function JuegoEscoba({ partida, accion, ctx }) {
  const miTurno = partida.estado === 'jugando' && partida.fase === 'jugando' && partida.turno === ctx.yo;
  const [mia, setMia] = useState(null);
  const [mesaSel, setMesaSel] = useState([]);
  const [sinQuince, setSinQuince] = useState(false);

  // Cada jugada nueva limpia la selección.
  const firma = partida.mesa.map((c) => c.id).join() + partida.miMano.map((c) => c.id).join();
  useEffect(() => {
    setMia(null);
    setMesaSel([]);
    setSinQuince(false);
  }, [firma]);
  useEffect(() => setSinQuince(false), [mia]);

  const carta = partida.miMano.find((c) => c.id === mia);
  const suma = (carta?.valor || 0) + partida.mesa.filter((c) => mesaSel.includes(c.id)).reduce((s, c) => s + c.valor, 0);
  const toggleMesa = (id) => setMesaSel(mesaSel.includes(id) ? mesaSel.filter((x) => x !== id) : [...mesaSel, id]);

  return (
    <div className="escoba">
      <div className="marcador">
        <span>Vos <b>{partida.puntos.yo}</b></span>
        <span className="ronda">Mano {partida.mano} · a {partida.config.puntosParaGanar}</span>
        <span><b>{partida.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>

      {partida.fase === 'resumen' ? (
        <Resumen partida={partida} accion={accion} ctx={ctx} />
      ) : (
        <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
          {miTurno ? '¡Te toca!' : `Juega ${ctx.nombreRival}…`}
          {partida.ultima && <small>{textoUltima(partida.ultima, ctx)}</small>}
        </div>
      )}

      <div className="paño">
        <div className="fila-rival">
          <div className="mano-rival">{Array.from({ length: partida.cartasRival }, (_, i) => <Carta key={i} chica />)}</div>
          <small>{ctx.nombreRival}: {partida.levantadas.rival} levantadas · 🧹 {partida.escobas.rival}</small>
        </div>

        <div className="mesa">
          {partida.mesa.length === 0 && <span className="mesa-vacia">Mesa vacía</span>}
          {partida.mesa.map((c) => (
            <Carta key={c.id} carta={c} seleccionada={mesaSel.includes(c.id)} onClick={miTurno && mia ? () => toggleMesa(c.id) : undefined} />
          ))}
          <div className="mazo" title="Cartas en el mazo">{partida.mazo > 0 && <><Carta chica /><small>{partida.mazo}</small></>}</div>
        </div>

        {miTurno && carta && (
          <div className={`suma ${suma === 15 ? 'ok' : ''}`}>
            {carta.valor}{partida.mesa.filter((c) => mesaSel.includes(c.id)).map((c) => ` + ${c.valor}`).join('')} = <b>{suma}</b>
            <div className="acciones">
              {mesaSel.length > 0 ? (
                <button className="btn" disabled={suma !== 15} onClick={() => accion('jugar', { carta: mia, levantar: mesaSel })}>Levantar</button>
              ) : (
                <button className="btn fantasma" onClick={() => accion('jugar', { carta: mia })}>Tirarla a la mesa</button>
              )}
              <button className="btn chico fantasma" onClick={() => { const q = buscarQuince(carta, partida.mesa); setMesaSel(q || []); setSinQuince(!q); }}>💡 ¿Hay 15?</button>
            </div>
            {sinQuince && <small>Con esta carta no se llega a 15.</small>}
          </div>
        )}

        <div className="mi-mano">
          {partida.miMano.map((c) => (
            <Carta key={c.id} carta={c} seleccionada={mia === c.id} onClick={miTurno ? () => { setMia(mia === c.id ? null : c.id); setMesaSel([]); } : undefined} />
          ))}
        </div>
        <small className="mis-datos">Vos: {partida.levantadas.yo} levantadas · 🧹 {partida.escobas.yo}{partida.reparte === ctx.yo ? ' · repartís vos' : ''}</small>
        {miTurno && !carta && <p className="ayuda">Elegí una carta de tu mano y después las de la mesa que sumen 15.</p>}
      </div>
    </div>
  );
}

JuegoEscoba.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
