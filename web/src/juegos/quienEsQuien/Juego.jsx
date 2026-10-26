import { useEffect, useRef, useState } from 'react';
import { Personaje } from './dibujos.jsx';

// Preguntas rápidas: algunas sugerencias por categoría (se pueden editar antes de mandar).
function Sugerencias({ preguntas, elegir }) {
  const [cat, setCat] = useState(Object.keys(preguntas)[0]);
  return (
    <div className="quien-sugerencias">
      <div className="pestanas">
        {Object.entries(preguntas).map(([k, v]) => (
          <button key={k} type="button" className={`pestana ${cat === k ? 'activa' : ''}`} onClick={() => setCat(k)}>{v.titulo}</button>
        ))}
      </div>
      <div className="quien-valores">
        {Object.values(preguntas[cat].valores).map((texto) => (
          <button key={texto} type="button" className="chip boton" onClick={() => elegir(texto)}>{texto}</button>
        ))}
      </div>
    </div>
  );
}

export default function JuegoQuien({ partida, accion, ctx }) {
  const { personajes, preguntas, tema, historial, tumbados, pendiente } = partida;
  const jugando = partida.estado === 'jugando';
  const miTurno = jugando && partida.turno === ctx.yo && !pendiente;
  const meToca = jugando && pendiente && !pendiente.mia; // tengo que responder
  const [texto, setTexto] = useState('');
  const [arriesgando, setArriesgando] = useState(false);
  const [sugerir, setSugerir] = useState(false);
  const chat = useRef(null);
  const bajados = new Set(tumbados);
  const secreto = personajes[partida.miSecreto];
  const enPie = personajes.length - bajados.size;

  useEffect(() => {
    if (chat.current) chat.current.scrollTop = chat.current.scrollHeight;
  }, [historial.length, pendiente]);

  function tocar(i) {
    if (arriesgando) {
      if (window.confirm(`¿Arriesgás que es ${personajes[i].nombre}?`)) accion('arriesgar', { indice: i });
      setArriesgando(false);
      return;
    }
    accion('tumbar', { indices: [i], levantar: bajados.has(i) });
  }

  async function preguntar(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    const r = await accion('preguntar', { texto: t });
    if (!r?.error) { setTexto(''); setSugerir(false); }
  }

  let estado;
  if (!jugando) estado = 'Partida terminada';
  else if (meToca) estado = `${ctx.nombreRival} te preguntó algo: respondé mirando tu personaje`;
  else if (pendiente) estado = `Esperando que ${ctx.nombreRival} responda…`;
  else if (miTurno) estado = arriesgando ? 'Tocá el que creés que es' : '¡Te toca! Hacé una pregunta o arriesgá';
  else estado = `Le toca preguntar a ${ctx.nombreRival}…`;

  return (
    <div className="quien">
      <div className="quien-cab">
        <div className="quien-secreto">
          <small>Tu {tema === 'perritos' ? 'perrito' : 'gatito'} secreto</small>
          <div className="quien-carta grande"><Personaje tema={tema} p={secreto} /><b>{secreto.nombre}</b></div>
        </div>
        <div className="quien-estado">
          <div className={`estado-cinta ${miTurno || meToca ? 'tu-turno' : ''}`}>
            {estado}
            <small>Te quedan {enPie} en pie · a {ctx.nombreRival} le quedan {personajes.length - partida.tumbadosRival}{jugando && enPie === 1 ? ' · en tu próximo turno se revela tu último' : ''}</small>
          </div>

          {/* Chat de preguntas y respuestas */}
          <div className="quien-chat tarjeta">
            <div className="quien-chat-lista" ref={chat}>
              {historial.length === 0 && <p className="sub chat-vacio">Todavía no hay preguntas.</p>}
              {historial.map((h, k) => (
                <div key={k} className={`qmsg ${h.mia ? 'mio' : ''}`}>
                  {h.arriesgo ? (
                    <div className={`burbuja arriesgo ${h.acierto ? 'si' : 'no'}`}>
                      <span>{h.automatico ? 'Le quedaba uno solo: ' : ''}¿Es {h.arriesgo}?</span>
                      <b>{h.acierto ? '¡Sí!' : 'No'}</b>
                    </div>
                  ) : (
                    <div className="burbuja">
                      <span>{h.texto}</span>
                      <b className={h.respuesta === null ? 'espera' : h.respuesta ? 'si' : 'no'}>{h.respuesta === null ? '…' : h.respuesta ? 'Sí' : 'No'}</b>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {meToca && (
              <div className="quien-responder">
                <p>“{pendiente.texto}”</p>
                <div className="acciones">
                  <button className="btn" onClick={() => accion('responder', { si: true })}>Sí</button>
                  <button className="btn fantasma" onClick={() => accion('responder', { si: false })}>No</button>
                </div>
              </div>
            )}

            {miTurno && (
              <>
                <form className="chat-form" onSubmit={preguntar}>
                  <input value={texto} maxLength={140} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí tu pregunta (ej: ¿Tiene manchas?)" autoFocus />
                  <button className="btn chico" disabled={texto.trim().length < 3}>Preguntar</button>
                </form>
                <div className="acciones quien-botones">
                  <button type="button" className="btn chico fantasma" onClick={() => setSugerir((s) => !s)}>{sugerir ? 'Ocultar ideas' : 'Ideas de preguntas'}</button>
                  <button type="button" className={`btn chico ${arriesgando ? '' : 'fantasma'}`} onClick={() => setArriesgando((a) => !a)}>
                    {arriesgando ? 'Cancelar' : '¡Ya sé quién es! Arriesgar'}
                  </button>
                </div>
                {sugerir && <Sugerencias preguntas={preguntas} elegir={setTexto} />}
              </>
            )}
          </div>
        </div>
      </div>

      <p className="ayuda centrado">Tocá una carta para bajarla (o levantarla). Si te queda una sola en pie, en tu próximo turno se arriesga sola.</p>
      <div className={`quien-tablero ${arriesgando ? 'arriesgando' : ''}`}>
        {personajes.map((x, i) => (
          <button
            key={x.nombre}
            type="button"
            className={`quien-carta ${bajados.has(i) ? 'bajada' : ''} ${partida.secretoRival === i ? 'era' : ''}`}
            onClick={() => tocar(i)}
            disabled={!jugando}
            title={bajados.has(i) ? 'Levantar' : arriesgando ? 'Arriesgar' : 'Bajar'}
          >
            <Personaje tema={tema} p={x} />
            <b>{x.nombre}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

JuegoQuien.textoFinal = (p, gane) => {
  const era = p.personajes[p.secretoRival]?.nombre;
  if (p.motivoFin === 'erro') return gane ? `Le erró. El tuyo era ${p.personajes[p.miSecreto].nombre}.` : `Le erraste: era ${era}.`;
  return gane ? `¡Adivinaste! Era ${era}.` : `Adivinó el tuyo. El suyo era ${era}.`;
};
// Te toca si tenés que preguntar o si tenés que responder.
JuegoQuien.claveTurno = (p, ctx) => {
  if (p.estado !== 'jugando') return null;
  if (p.pendiente && !p.pendiente.mia) return `q-r-${p.historial.length}`;
  return !p.pendiente && p.turno === ctx.yo ? `q-p-${p.historial.length}` : null;
};
