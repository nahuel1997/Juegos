import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { pedir } from './api.js';
import Login from './componentes/Login.jsx';
import Lobby from './componentes/Lobby.jsx';
import Sala from './componentes/Sala.jsx';
import Practica from './componentes/Practica.jsx';
import Perfil from './componentes/Perfil.jsx';
import Chat from './componentes/Chat.jsx';
import Avisos from './componentes/Avisos.jsx';
import { Avatar } from './componentes/comunes.jsx';
import { sonidoActivo, setSonidoActivo, sonarTurno } from './sonido.js';
import { Icono } from './iconos.jsx';
import { EmoteGrande } from './componentes/Emotes.jsx';
import { ProveedorSkins } from './skins.jsx';

// Link para entrar a una sala: https://…/?codigo=ABC12 (se saca de la barra al leerlo).
function leerCodigoUrl() {
  try {
    const c = new URLSearchParams(location.search).get('codigo');
    if (c) history.replaceState(null, '', location.pathname);
    return c ? c.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) : '';
  } catch {
    return '';
  }
}

export default function App() {
  const [usuario, setUsuario] = useState(undefined); // undefined = cargando, null = sin sesión
  const [lobby, setLobby] = useState(null);
  const [sala, setSala] = useState(undefined);
  const [vista, setVista] = useState('inicio'); // inicio | perfil
  const [practica, setPractica] = useState(null); // { id, nombre } del juego que se practica contra el bot
  const [conectado, setConectado] = useState(false);
  const [avisos, setAvisos] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [escribiendo, setEscribiendo] = useState(null);
  const [sonido, setSonido] = useState(sonidoActivo);
  const [emote, setEmote] = useState(null);
  const [codigoUrl, setCodigoUrl] = useState(leerCodigoUrl);
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
      if (e.message === 'sala-cerrada') {
        avisar('Esa sala ya se cerró');
        pedir('/logout', { metodo: 'POST' }).catch(() => {});
        setUsuario(null);
      }
    });
    s.on('lobby', setLobby);
    s.on('sala', setSala);
    s.on('aviso', ({ texto }) => avisar(texto));
    s.on('emote', setEmote);
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
  if (!usuario) return <><Login onEntrar={(u) => { setCodigoUrl(''); setUsuario(u); }} codigoInicial={codigoUrl} /><Avisos avisos={avisos} /></>;
  const invitado = !!usuario.invitado;

  return (
    <ProveedorSkins usuario={usuario}>
    <div className="app">
      <header className="barra">
        <button className="marca" onClick={() => setVista('inicio')}>
          <img src="/icono.svg" alt="" width="28" height="28" />
          <span>Juegos 1vs1</span>
          {usuario.tema === 'rosa' && <Icono id="corazon" tam={18} />}
        </button>
        <div className="barra-der">
          <button
            className="btn chico fantasma sonido"
            title={sonido ? 'Silenciar el aviso de turno' : 'Activar el aviso de turno'}
            aria-label={sonido ? 'Silenciar' : 'Activar sonido'}
            onClick={() => { setSonidoActivo(!sonido); setSonido(!sonido); if (!sonido) setTimeout(sonarTurno, 0); }}
          >
            <Icono id={sonido ? 'campana' : 'campanaNo'} tam={20} />
          </button>
          <span className={`punto ${conectado ? 'on' : 'off'}`} title={conectado ? 'Conectado' : 'Reconectando…'} />
          {invitado ? (
            <span className="yo"><Avatar usuario={usuario} tam={30} /><span>{usuario.nombre} <small className="sub">(invitado)</small></span></span>
          ) : (
            <button className="yo" onClick={() => setVista('perfil')} title="Tu perfil">
              <Avatar usuario={usuario} tam={30} />
              <span>{usuario.nombre}</span>
            </button>
          )}
          <button className="btn chico fantasma" onClick={salir}>Salir</button>
        </div>
      </header>
      <main>
        {!conectado && <div className="cinta">Reconectando con el servidor…</div>}
        {invitado && !sala ? (
          <div className="tarjeta sin-sala">
            <h2>{sala === undefined ? 'Entrando a la sala…' : 'Ya no estás en la sala'}</h2>
            {sala === null && <p className="sub">La sala se cerró o te sacaron. Si te pasan otro código, podés volver a entrar.</p>}
            {sala === null && <button className="btn" onClick={salir}>Volver al inicio</button>}
          </div>
        ) : vista === 'perfil' ? (
          <Perfil usuario={usuario} onCambio={setUsuario} volver={() => setVista('inicio')} avisar={avisar} />
        ) : sala ? (
          <Sala sala={sala} emitir={emitir} gente={gente} usuarios={invitado ? [] : lobby?.usuarios || []} invitacionesEnviadas={lobby?.invitaciones?.enviadas || []} />
        ) : practica ? (
          <Practica key={practica.id} id={practica.id} nombre={practica.nombre} usuario={usuario} volver={() => setPractica(null)} />
        ) : (
          <Lobby lobby={lobby} emitir={emitir} practicar={(id, nombre) => setPractica({ id, nombre })} codigoUrl={codigoUrl} olvidarCodigo={() => setCodigoUrl('')} />
        )}
      </main>
      {!invitado && <Chat
        mensajes={mensajes}
        gente={gente}
        yo={usuario.usuario}
        escribiendo={escribiendo}
        enviar={(texto) => emitir('chat:enviar', { texto })}
        avisarEscribiendo={() => socketRef.current?.emit('chat:escribiendo')}
      />}
      <Avisos avisos={avisos} />
      {sala && <EmoteGrande emote={emote} yo={usuario.usuario} gente={gente} />}
      {usuario.tema === 'rosa' && <Corazones />}
    </div>
    </ProveedorSkins>
  );
}

// Corazones que suben flotando por el fondo (decorativos, no se pueden tocar).
function Corazones() {
  return (
    <div className="corazones" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} style={{ '--x': `${(i * 37) % 100}%`, '--d': `${9 + (i % 5) * 2}s`, '--r': `${(i * 1.3) % 9}s`, '--t': `${14 + (i % 4) * 6}px` }}>
          <Icono id="corazon" tam={14 + (i % 4) * 6} />
        </span>
      ))}
    </div>
  );
}
