import { useEffect, useRef, useState } from 'react';
import { Avatar } from './comunes.jsx';

const hora = (iso) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

// Chat en vivo: botón flotante con contador de no leídos y panel.
export default function Chat({ mensajes, gente, yo, escribiendo, enviar, avisarEscribiendo }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [leidos, setLeidos] = useState(() => {
    try { return localStorage.getItem('chat-leido') || ''; } catch { return ''; }
  });
  const lista = useRef(null);
  const ultimoAviso = useRef(0);

  const ultimo = mensajes[mensajes.length - 1];
  const noLeidos = abierto ? 0 : mensajes.filter((m) => m.de !== yo && m.fecha > leidos).length;

  useEffect(() => {
    if (!abierto || !ultimo) return;
    setLeidos(ultimo.fecha);
    try { localStorage.setItem('chat-leido', ultimo.fecha); } catch { /* sin storage */ }
  }, [abierto, ultimo]);

  useEffect(() => {
    if (abierto && lista.current) lista.current.scrollTop = lista.current.scrollHeight;
  }, [abierto, mensajes.length, escribiendo]);

  async function mandar(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    setTexto('');
    const r = await enviar(t);
    if (r?.error) setTexto(t);
  }

  return (
    <>
      <button className={`chat-boton ${abierto ? 'abierto' : ''}`} onClick={() => setAbierto((a) => !a)} aria-label="Chat">
        {abierto ? '✕' : '💬'}
        {noLeidos > 0 && <span className="badge">{noLeidos}</span>}
      </button>
      {abierto && (
        <div className="chat-panel" role="dialog" aria-label="Chat">
          <div className="chat-cab">Chat</div>
          <div className="chat-lista" ref={lista}>
            {mensajes.length === 0 && <p className="sub chat-vacio">Todavía no hay mensajes. ¡Mandá el primero!</p>}
            {mensajes.map((m, i) => {
              const quien = gente[m.de] || { usuario: m.de, nombre: m.de };
              const mio = m.de === yo;
              const seguido = mensajes[i - 1]?.de === m.de;
              return (
                <div key={m.id} className={`msg ${mio ? 'mio' : ''} ${seguido ? 'seguido' : ''}`}>
                  {!mio && !seguido && <Avatar usuario={quien} tam={26} />}
                  <div className="burbuja">
                    {!mio && !seguido && <b style={{ color: quien.color }}>{quien.nombre}</b>}
                    <span>{m.texto}</span>
                    <small>{hora(m.fecha)}</small>
                  </div>
                </div>
              );
            })}
            {escribiendo && <div className="escribiendo">{gente[escribiendo]?.nombre || escribiendo} está escribiendo…</div>}
          </div>
          <form className="chat-form" onSubmit={mandar}>
            <input
              value={texto}
              maxLength={500}
              placeholder="Escribí un mensaje…"
              autoFocus
              onChange={(e) => {
                setTexto(e.target.value);
                if (Date.now() - ultimoAviso.current > 2000) {
                  ultimoAviso.current = Date.now();
                  avisarEscribiendo();
                }
              }}
            />
            <button className="btn chico" disabled={!texto.trim()}>Enviar</button>
          </form>
        </div>
      )}
    </>
  );
}
