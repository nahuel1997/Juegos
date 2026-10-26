import { useState } from 'react';
import { Personaje } from './dibujos.jsx';

export default function JuegoQuien({ partida, accion, ctx }) {
  const { personajes, preguntas, tema, historial, tumbados } = partida;
  const miTurno = partida.estado === 'jugando' && partida.turno === ctx.yo;
  const [atributo, setAtributo] = useState(Object.keys(preguntas)[0]);
  const [arriesgando, setArriesgando] = useState(false);
  const bajados = new Set(tumbados);
  const secreto = personajes[partida.miSecreto];
  const ultimaMia = [...historial].reverse().find((h) => h.mia && h.atributo);

  function tocar(i) {
    if (arriesgando) {
      if (window.confirm(`¿Arriesgás que es ${personajes[i].nombre}?`)) accion('arriesgar', { indice: i });
      setArriesgando(false);
      return;
    }
    accion('tumbar', { indices: [i], levantar: bajados.has(i) });
  }

  // Baja de una todos los que no coinciden con la última respuesta.
  function bajarSegunRespuesta() {
    if (!ultimaMia) return;
    const indices = personajes
      .map((x, i) => ((x[ultimaMia.atributo] === ultimaMia.valor) !== ultimaMia.respuesta ? i : -1))
      .filter((i) => i >= 0 && !bajados.has(i));
    if (indices.length) accion('tumbar', { indices });
  }

  return (
    <div className="quien">
      <div className="quien-cab">
        <div className="quien-secreto">
          <small>Tu {tema === 'perritos' ? 'perrito' : 'gatito'} secreto</small>
          <div className="quien-carta grande"><Personaje tema={tema} p={secreto} /><b>{secreto.nombre}</b></div>
        </div>
        <div className="quien-estado">
          <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
            {partida.estado !== 'jugando' ? 'Partida terminada' : miTurno ? (arriesgando ? 'Tocá el que creés que es' : '¡Te toca! Preguntá o arriesgá') : `Pregunta ${ctx.nombreRival}…`}
            <small>Te quedan {personajes.length - bajados.size} en pie · a {ctx.nombreRival} le quedan {personajes.length - partida.tumbadosRival}</small>
          </div>
          {miTurno && (
            <div className="quien-preguntas tarjeta">
              <div className="pestanas">
                {Object.entries(preguntas).map(([k, v]) => (
                  <button key={k} type="button" className={`pestana ${atributo === k ? 'activa' : ''}`} onClick={() => setAtributo(k)}>{v.titulo}</button>
                ))}
              </div>
              <div className="quien-valores">
                {Object.entries(preguntas[atributo].valores).map(([valor, texto]) => (
                  <button key={valor} type="button" className="btn chico fantasma" onClick={() => accion('preguntar', { atributo, valor })}>{texto}</button>
                ))}
              </div>
              <button type="button" className={`btn ${arriesgando ? '' : 'fantasma'}`} onClick={() => setArriesgando((a) => !a)}>
                {arriesgando ? 'Cancelar' : '¡Ya sé quién es! Arriesgar'}
              </button>
            </div>
          )}
          {ultimaMia && partida.estado === 'jugando' && (
            <button type="button" className="btn chico fantasma" onClick={bajarSegunRespuesta}>
              Bajar los que no coinciden con “{ultimaMia.texto}” ({ultimaMia.respuesta ? 'sí' : 'no'})
            </button>
          )}
        </div>
      </div>

      <div className={`quien-tablero ${arriesgando ? 'arriesgando' : ''}`}>
        {personajes.map((x, i) => (
          <button
            key={x.nombre}
            type="button"
            className={`quien-carta ${bajados.has(i) ? 'bajada' : ''} ${partida.secretoRival === i ? 'era' : ''}`}
            onClick={() => tocar(i)}
            disabled={partida.estado !== 'jugando'}
            title={bajados.has(i) ? 'Levantar' : arriesgando ? 'Arriesgar' : 'Bajar'}
          >
            <Personaje tema={tema} p={x} />
            <b>{x.nombre}</b>
          </button>
        ))}
      </div>

      {historial.length > 0 && (
        <ul className="historial compacto quien-historial">
          {[...historial].reverse().map((h, k) => (
            <li key={k} className={h.atributo ? (h.respuesta ? 'gane' : 'perdi') : h.acierto ? 'gane' : 'perdi'}>
              <span>{h.mia ? 'Vos' : ctx.nombreRival}: {h.atributo ? h.texto : `¿Es ${h.arriesgo}?`}</span>
              <b>{h.atributo ? (h.respuesta ? 'Sí' : 'No') : h.acierto ? '¡Sí!' : 'No'}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

JuegoQuien.textoFinal = (p, gane) => {
  const era = p.personajes[p.secretoRival]?.nombre;
  if (p.motivoFin === 'erro') return gane ? `Le erró. El tuyo era ${p.personajes[p.miSecreto].nombre}.` : `Le erraste: era ${era}.`;
  return gane ? `¡Adivinaste! Era ${era}.` : `Adivinó el tuyo. El suyo era ${era}.`;
};
JuegoQuien.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.turno === ctx.yo ? `q-${p.historial.length}` : null);
