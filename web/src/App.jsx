import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { pedir } from './api.js';
import Login from './componentes/Login.jsx';
import Lobby from './componentes/Lobby.jsx';
import BatallaNaval from './componentes/BatallaNaval.jsx';
import Avisos from './componentes/Avisos.jsx';

export default function App() {
  const [usuario, setUsuario] = useState(undefined); // undefined = cargando, null = sin sesión
  const [lobby, setLobby] = useState(null);
  const [partida, setPartida] = useState(undefined);
  const [conectado, setConectado] = useState(false);
  const [avisos, setAvisos] = useState([]);
  const socketRef = useRef(null);

  const avisar = useCallback((texto, tipo = 'info') => {
    const id = Math.random();
    setAvisos((a) => [...a, { id, texto, tipo }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4000);
  }, []);

  useEffect(() => {
    pedir('/yo').then((r) => setUsuario(r.usuario)).catch(() => setUsuario(null));
  }, []);

  // Tema personal (ej. rosa con corazones para Iara). Se recuerda en el navegador para que
  // el login ya salga con ese estilo la próxima vez.
  useEffect(() => {
    if (usuario === undefined) return;
    let tema = usuario?.tema || '';
    try {
      if (usuario) localStorage.setItem('tema', tema);
      else tema = localStorage.getItem('tema') || '';
    } catch { /* sin storage: se usa el del usuario */ }
    document.documentElement.dataset.tema = tema;
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;
    const s = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = s;
    s.on('connect', () => setConectado(true));
    s.on('disconnect', () => setConectado(false));
    s.on('connect_error', (e) => {
      if (e.message === 'sin-sesion') setUsuario(null);
    });
    s.on('lobby', setLobby);
    s.on('partida', setPartida);
    s.on('aviso', ({ texto }) => avisar(texto));
    return () => s.close();
  }, [usuario, avisar]);

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

  async function salir() {
    await pedir('/logout', { metodo: 'POST' }).catch(() => {});
    setUsuario(null);
    setLobby(null);
    setPartida(undefined);
  }

  if (usuario === undefined) return <div className="cargando">Cargando…</div>;
  if (!usuario) return <Login onEntrar={setUsuario} />;

  return (
    <div className="app">
      <header className="barra">
        <div className="marca">
          <img src="/icono.svg" alt="" width="28" height="28" />
          <span>Juegos 1vs1{usuario.tema === 'rosa' && ' 💕'}</span>
        </div>
        <div className="barra-der">
          <span className={`punto ${conectado ? 'on' : 'off'}`} title={conectado ? 'Conectado' : 'Reconectando…'} />
          <span className="yo" style={{ '--c': usuario.color }}>{usuario.nombre}</span>
          <button className="btn chico fantasma" onClick={salir}>Salir</button>
        </div>
      </header>
      <main>
        {!conectado && <div className="cinta">Reconectando con el servidor…</div>}
        {partida ? (
          <BatallaNaval partida={partida} emitir={emitir} lobby={lobby} />
        ) : (
          <Lobby lobby={lobby} emitir={emitir} />
        )}
      </main>
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
