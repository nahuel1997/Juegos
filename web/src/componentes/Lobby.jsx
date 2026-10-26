const JUEGO_INFO = {
  'batalla-naval': { emoji: '🚢', texto: 'Ubicá tu flota y hundí la del rival. Si acertás, seguís tirando.' },
};

const fecha = (iso) => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function Lobby({ lobby, emitir }) {
  if (!lobby) return <div className="cargando">Conectando…</div>;
  const { usuarios, invitaciones, juegos, stats } = lobby;
  const nombre = (u) => usuarios.find((x) => x.usuario === u)?.nombre || u;

  return (
    <div className="lobby">
      {invitaciones.recibidas.map((inv) => (
        <div key={inv.de} className="tarjeta invitacion">
          <div>
            <strong>{nombre(inv.de)}</strong> te desafía a <strong>{inv.nombreJuego}</strong>
          </div>
          <div className="acciones">
            <button className="btn" onClick={() => emitir('responder', { de: inv.de, acepta: true })}>¡Jugar!</button>
            <button className="btn fantasma" onClick={() => emitir('responder', { de: inv.de, acepta: false })}>Ahora no</button>
          </div>
        </div>
      ))}

      {juegos.map((j) => (
        <section key={j.id} className="tarjeta juego">
          <div className="juego-cab">
            <span className="juego-emoji">{JUEGO_INFO[j.id]?.emoji}</span>
            <div>
              <h2>{j.nombre}</h2>
              <p className="sub">{JUEGO_INFO[j.id]?.texto}</p>
            </div>
          </div>
          <ul className="rivales">
            {usuarios.map((u) => {
              const enviada = invitaciones.enviadas.find((i) => i.a === u.usuario);
              return (
                <li key={u.usuario}>
                  <span className="avatar" style={{ '--c': u.color }}>{u.nombre[0]}</span>
                  <span className="rival-nombre">
                    {u.nombre}
                    <small className={u.online ? 'on' : ''}>
                      {u.jugando ? 'jugando' : u.online ? 'conectado' : 'desconectado'}
                    </small>
                  </span>
                  {enviada ? (
                    <button className="btn fantasma" onClick={() => emitir('cancelarInvitacion', { a: u.usuario })}>
                      Esperando… (cancelar)
                    </button>
                  ) : (
                    <button className="btn" disabled={!u.online || u.jugando} onClick={() => emitir('invitar', { a: u.usuario, juego: j.id })}>
                      Desafiar
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="tarjeta">
        <h2>Tus partidas</h2>
        <div className="stats">
          <div><b>{stats.jugadas}</b><span>jugadas</span></div>
          <div><b>{stats.ganadas}</b><span>ganadas</span></div>
          <div><b>{stats.jugadas - stats.ganadas}</b><span>perdidas</span></div>
        </div>
        {stats.ultimas.length > 0 && (
          <ul className="historial">
            {stats.ultimas.map((p, i) => {
              const rival = p.jugadores.find((x) => x !== lobby.yo);
              const gane = p.ganador === lobby.yo;
              return (
                <li key={i} className={gane ? 'gane' : 'perdi'}>
                  <span>{gane ? 'Ganaste' : 'Perdiste'} vs {nombre(rival)}</span>
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
