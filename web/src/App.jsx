import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { pedir } from './api.js';
import Login from './componentes/Login.jsx';
import Lobby from './componentes/Lobby.jsx';
import Sala from './componentes/Sala.jsx';
import Perfil from './componentes/Perfil.jsx';
import Chat from './componentes/Chat.jsx';
import Avisos from './componentes/Avisos.jsx';
import { Avatar } from './componentes/comunes.jsx';

export default function App() {
  const [usuario, setUsuario] = useState(undefined); // undefined = cargando, null = sin sesión
  const [lobby, setLobby] = useState(null);
  const [sala, setSala] = useState(undefined);
  const [vista, setVista] = useState('inicio'); // inicio | perfil
  const [conectado, setConectado] = useState(false);
  const [avisos, setAvisos] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [escribiendo, setEscribiendo] = useState(null);
  const socketRef = useRef(null);

  const avisar = useCallback((texto, tipo = 'info') => {
    const id = Math.random();
    setAvisos((a) => [...a, { id, texto, tipo }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4000);
  }, []);

  useEffect(() => {
    pedir('/yo').then((r) => setUsuario(r.usuario)).catch(() => setUsuario(null));
  }, []);

  // Tema personal (azul, rosa con corazones o negro). Se recuerda en el navegador para que
  // el login ya salga con ese estilo la próxima vez.
  useEffect(() => {
    if (usuario === undefined) return;
    let tema = usuario?.tema || '';
    try {
      if (usuario) localStorage.setItem('tema', tema);
      else tema = localStorage.getItem('tema') || '';
    } catch { /* sin storage: se usa el del usuario */ }
    document.documentElement.dataset.tema = tema === 'azul' ? '' : tema;
  }, [usuario]);

  const yo = usuario?.usuario;
  useEffect(() => {
    if (!yo) return;
    const s = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = s;
    let quitarEscribiendo;
    s.on('connect', () => setConectado(true));
    s.on('disconnect', () => setConectado(false));
    s.on('connect_error', (e) => {
      if (e.message === 'sin-sesion') setUsuario(null);
    });
    s.on('lobby', setLobby);
    s.on('sala', setSala);
    s.on('aviso', ({ texto }) => avisar(texto));
    s.on('chat:historial', setMensajes);
    s.on('chat:mensaje', (m) => {
      setMensajes((lista) => [...lista.slice(-299), m]);
      setEscribiendo(null);
    });
    s.on('chat:escribiendo', ({ de }) => {
      setEscribiendo(de);
      clearTimeout(quitarEscribiendo);
      quitarEscribiendo = setTimeout(() => setEscribiendo(null), 3000);
    });
    return () => s.close();
  }, [yo, avisar]);

  // Manda un evento y muestra el error si el server lo rechaza.
  const emitir = useCallback(
    (evento, datos) =>
      new Promise((resolve) => {
        socketRef.current?.emit(evento, datos, (r) => {
          if (r?.error) avisar(r.error, 'error');
          resolve(r);
        });
      }),
    [avisar],
  );

  // Todos los usuarios por nombre de usuario (para nombres, colores y fotos).
  const gente = useMemo(() => {
    const m = Object.fromEntries((lobby?.usuarios || []).map((u) => [u.usuario, u]));
    if (usuario) m[usuario.usuario] = usuario;
    return m;
  }, [lobby, usuario]);

  async function salir() {
    await pedir('/logout', { metodo: 'POST' }).catch(() => {});
    setUsuario(null);
    setLobby(null);
    setSala(undefined);
    setMensajes([]);
  }

  if (usuario === undefined) return <div className="cargando">Cargando…</div>;
  if (!usuario) return <Login onEntrar={setUsuario} />;

  return (
    <div className="app">
      <header className="barra">
        <button className="marca" onClick={() => setVista('inicio')}>
          <img src="/icono.svg" alt="" width="28" height="28" />
          <span>Juegos 1vs1{usuario.tema === 'rosa' && ' 💕'}</span>
        </button>
        <div className="barra-der">
          <span className={`punto ${conectado ? 'on' : 'off'}`} title={conectado ? 'Conectado' : 'Reconectando…'} />
          <button className="yo" onClick={() => setVista('perfil')} title="Tu perfil">
            <Avatar usuario={usuario} tam={30} />
            <span>{usuario.nombre}</span>
          </button>
          <button className="btn chico fantasma" onClick={salir}>Salir</button>
        </div>
      </header>
      <main>
        {!conectado && <div className="cinta">Reconectando con el servidor…</div>}
        {vista === 'perfil' ? (
          <Perfil usuario={usuario} onCambio={setUsuario} volver={() => setVista('inicio')} avisar={avisar} />
        ) : sala ? (
          <Sala sala={sala} emitir={emitir} gente={gente} />
        ) : (
          <Lobby lobby={lobby} emitir={emitir} />
        )}
      </main>
      <Chat
        mensajes={mensajes}
        gente={gente}
        yo={usuario.usuario}
        escribiendo={escribiendo}
        enviar={(texto) => emitir('chat:enviar', { texto })}
        avisarEscribiendo={() => socketRef.current?.emit('chat:escribiendo')}
      />
      <Avisos avisos={avisos} />
      {usuario.tema === 'rosa' && <Corazones />}
    </div>
  );
}

// Corazones que suben flotando por el fondo (decorativos, no se pueden tocar).
function Corazones() {
  return (
    <div className="corazones" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} style={{ '--x': `${(i * 37) % 100}%`, '--d': `${9 + (i % 5) * 2}s`, '--r': `${(i * 1.3) % 9}s`, '--t': `${14 + (i % 4) * 6}px` }}>
          {i % 3 ? '♥' : '💖'}
        </span>
      ))}
    </div>
  );
}
