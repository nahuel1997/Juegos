import { JUEGOS } from '../juegos/index.js';
import { Avatar } from './comunes.jsx';

const fecha = (iso) => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function Lobby({ lobby, emitir }) {
  if (!lobby) return <div className="cargando">Conectando…</div>;
  const { usuarios, invitaciones, juegos, stats } = lobby;
  const nombre = (u) => usuarios.find((x) => x.usuario === u)?.nombre || u;
  const nombreJuego = (id) => juegos.find((j) => j.id === id)?.nombre || id;

  return (
    <div className="lobby">
      {invitaciones.recibidas.map((inv) => (
        <div key={inv.de} className="tarjeta invitacion">
          <div>
            <strong>{nombre(inv.de)}</strong> te desafía a <strong>{JUEGOS[inv.juego]?.emoji} {inv.nombreJuego}</strong>
          </div>
          <div className="acciones">
            <button className="btn" onClick={() => emitir('responder', { de: inv.de, acepta: true })}>¡Jugar!</button>
            <button className="btn fantasma" onClick={() => emitir('responder', { de: inv.de, acepta: false })}>Ahora no</button>
          </div>
        </div>
      ))}

      <section className="tarjeta">
        <h2>Jugadores</h2>
        <ul className="rivales">
          {usuarios.map((u) => (
            <li key={u.usuario}>
              <Avatar usuario={u} />
              <span className="rival-nombre">
                {u.nombre}
                <small className={u.online ? 'on' : ''}>
                  {u.enSala ? `en una sala de ${u.enSala}` : u.online ? 'conectado' : 'desconectado'}
                </small>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="juegos">
        {juegos.map((j) => {
          const info = JUEGOS[j.id];
          const s = stats.porJuego[j.id];
          return (
            <section key={j.id} className="tarjeta juego">
              <div className="juego-cab">
                <span className="juego-emoji">{info?.emoji}</span>
                <div>
                  <h2>{j.nombre}</h2>
                  <p className="sub">{info?.texto}</p>
                </div>
              </div>
              {s && <p className="juego-stats">Jugadas {s.jugadas} · ganadas {s.ganadas}{s.empatadas ? ` · empates ${s.empatadas}` : ''}</p>}
              <div className="acciones">
                {usuarios.map((u) => {
                  const enviada = invitaciones.enviadas.find((i) => i.a === u.usuario && i.juego === j.id);
                  return enviada ? (
                    <button key={u.usuario} className="btn fantasma" onClick={() => emitir('cancelarInvitacion', { a: u.usuario })}>
                      Esperando a {u.nombre}… (cancelar)
                    </button>
                  ) : (
                    <button key={u.usuario} className="btn" disabled={!u.online || !!u.enSala} onClick={() => emitir('invitar', { a: u.usuario, juego: j.id })}>
                      Desafiar a {u.nombre}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="tarjeta">
        <h2>Tus partidas</h2>
        <div className="stats">
          <div><b>{stats.jugadas}</b><span>jugadas</span></div>
          <div><b>{stats.ganadas}</b><span>ganadas</span></div>
          <div><b>{stats.jugadas - stats.ganadas - stats.empatadas}</b><span>perdidas</span></div>
        </div>
        {stats.ultimas.length > 0 && (
          <ul className="historial">
            {stats.ultimas.map((p, i) => {
              const rival = p.jugadores.find((x) => x !== lobby.yo);
              const res = p.ganador === null ? 'empate' : p.ganador === lobby.yo ? 'gane' : 'perdi';
              return (
                <li key={i} className={res}>
                  <span>
                    {JUEGOS[p.juego]?.emoji} {res === 'empate' ? 'Empataste' : res === 'gane' ? 'Ganaste' : 'Perdiste'} vs {nombre(rival)}
                    <small> · {nombreJuego(p.juego)}</small>
                  </span>
                  <small>{p.motivoFin === 'abandono' ? 'por abandono · ' : ''}{fecha(p.fecha)}</small>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
