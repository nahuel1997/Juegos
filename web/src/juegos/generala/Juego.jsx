import { useEffect, useState } from 'react';

// Posiciones de los puntos en una grilla de 3x3 (0..8).
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function Dado({ valor, guardado, rodando, onClick, disabled }) {
  return (
    <button type="button" className={`dado ${guardado ? 'guardado' : ''} ${rodando ? 'rodando' : ''}`} onClick={onClick} disabled={disabled} aria-label={valor ? `Dado ${valor}${guardado ? ', guardado' : ''}` : 'Dado sin tirar'}>
      {Array.from({ length: 9 }, (_, i) => <i key={i} className={valor && PIPS[valor].includes(i) ? 'pip' : ''} />)}
    </button>
  );
}

export default function JuegoGenerala({ partida, accion, ctx }) {
  const miTurno = partida.estado === 'jugando' && partida.turno === ctx.yo;
  const [guardar, setGuardar] = useState([false, false, false, false, false]);
  const [rodando, setRodando] = useState(false);

  // Turno nuevo: nada guardado.
  useEffect(() => {
    if (partida.tiros === 0) setGuardar([false, false, false, false, false]);
  }, [partida.tiros, partida.turno]);

  // Animación corta cada vez que cambian los dados.
  const firma = partida.dados.join('') + partida.tiros;
  useEffect(() => {
    if (partida.tiros === 0) return;
    setRodando(true);
    const t = setTimeout(() => setRodando(false), 450);
    return () => clearTimeout(t);
  }, [firma, partida.tiros]);

  const puedeGuardar = miTurno && partida.tiros > 0 && partida.tiros < 3;
  const mios = partida.planillas.yo;
  const suyos = partida.planillas.rival;
  const u = partida.ultimaAnotacion;

  return (
    <div className="generala">
      <div className="marcador">
        <span>Vos <b>{partida.totales.yo}</b></span>
        <span className="ronda">{miTurno ? '¡Tu turno!' : `Turno de ${ctx.nombreRival}`}</span>
        <span><b>{partida.totales.rival}</b> {ctx.nombreRival}</span>
      </div>
      {u && (
        <div className="estado-cinta">
          <small>
            {u.por === ctx.yo ? 'Anotaste' : `${ctx.nombreRival} anotó`} {u.puntos ? `${u.puntos} en ${u.categoria}` : `0 (tachó ${u.categoria})`}
            {u.servido ? ' · ¡servido!' : ''}
          </small>
        </div>
      )}

      <div className="generala-grid">
        <div className={`mesa-dados tarjeta ${miTurno ? 'activo' : ''}`}>
          <div className="dados">
            {partida.dados.map((d, i) => (
              <Dado
                key={i}
                valor={d}
                guardado={(puedeGuardar && guardar[i]) || (!miTurno && partida.guardados[i])}
                rodando={rodando && !(partida.guardados[i])}
                disabled={!puedeGuardar}
                onClick={() => setGuardar((actual) => actual.map((g, k) => (k === i ? !g : g)))}
              />
            ))}
          </div>
          <div className="tiros">{[1, 2, 3].map((n) => <span key={n} className={n <= partida.tiros ? 'usado' : ''} />)}</div>
          {miTurno ? (
            <>
              <button className="btn grande" disabled={partida.tiros >= 3 || (partida.tiros > 0 && guardar.every(Boolean))} onClick={() => accion('tirar', { guardar })}>
                {partida.tiros === 0 ? '🎲 Tirar' : partida.tiros < 3 ? `🎲 Volver a tirar (${3 - partida.tiros})` : 'Sin tiros: anotá'}
              </button>
              <p className="ayuda">{partida.tiros === 0 ? 'Tirá los cinco dados.' : 'Tocá los dados que querés guardar y volvé a tirar, o anotá en la planilla.'}</p>
            </>
          ) : (
            <p className="ayuda">{partida.tiros === 0 ? `${ctx.nombreRival} todavía no tiró.` : `${ctx.nombreRival} lleva ${partida.tiros} tiro${partida.tiros > 1 ? 's' : ''}.`}</p>
          )}
        </div>

        <table className="planilla tarjeta">
          <thead>
            <tr><th /><th>Vos</th><th>{ctx.nombreRival}</th></tr>
          </thead>
          <tbody>
            {partida.categorias.map((c) => {
              const usada = mios[c.id] !== undefined;
              const posible = partida.posibles?.[c.id];
              return (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td>
                    {usada ? (
                      <span className={mios[c.id] === 0 ? 'tachada' : ''}>{mios[c.id] === 0 ? '✕' : mios[c.id]}</span>
                    ) : miTurno && partida.tiros > 0 ? (
                      <button className={`anotar ${posible ? '' : 'tachar'}`} onClick={() => accion('anotar', { categoria: c.id })}>
                        {posible ? `+${posible}` : 'tachar'}
                      </button>
                    ) : ''}
                  </td>
                  <td>
                    {suyos[c.id] !== undefined ? (
                      <span className={suyos[c.id] === 0 ? 'tachada' : ''}>{suyos[c.id] === 0 ? '✕' : suyos[c.id]}</span>
                    ) : !miTurno && partida.tiros > 0 && partida.posibles?.[c.id] ? (
                      <small className="posible">{partida.posibles[c.id]}?</small>
                    ) : ''}
                  </td>
                </tr>
              );
            })}
            <tr className="total"><td>Total</td><td>{partida.totales.yo}</td><td>{partida.totales.rival}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

JuegoGenerala.textoFinal = (p, gane) =>
  p.motivoFin === 'servida' ? (gane ? '¡Generala servida!' : 'Le salió generala servida 😱') : `Terminó ${p.totales.yo} a ${p.totales.rival}.`;
