import { useState } from 'react';
import { JUEGOS } from '../juegos/index.js';
import VistaPrevia from './VistaPrevia.jsx';
import { Avatar } from './comunes.jsx';
import { Icono } from '../iconos.jsx';

const fecha = (iso) => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// Unirse a una sala con el código que te pasaron (o el que vino en el link).
function UnirseConCodigo({ emitir, codigoUrl, olvidarCodigo }) {
  const [codigo, setCodigo] = useState(codigoUrl || '');
  const unirse = async (e) => {
    e.preventDefault();
    const r = await emitir('unirmeConCodigo', { codigo });
    if (!r?.error) { setCodigo(''); olvidarCodigo?.(); }
  };
  return (
    <form className={`tarjeta con-codigo ${codigoUrl ? 'destacada' : ''}`} onSubmit={unirse}>
      <div>
        <h2><Icono id="llave" tam={26} /> {codigoUrl ? `Te invitaron a la sala ${codigoUrl}` : 'Jugar con código'}</h2>
        <p className="sub">Para jugar con más gente: armá una sala con código desde cualquier juego y compartila. Los que no tienen usuario entran con el link y su nombre.</p>
      </div>
      <div className="con-codigo-campo">
        <input className="campo-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))} placeholder="Código" aria-label="Código de la sala" autoCapitalize="characters" autoComplete="off" spellCheck="false" />
        <button className="btn" disabled={codigo.length < 5}>Unirme</button>
      </div>
    </form>
  );
}

export default function Lobby({ lobby, emitir, practicar, codigoUrl, olvidarCodigo }) {
  const [viendo, setViendo] = useState(null); // id del juego en vista previa
  if (!lobby) return <div className="cargando">Conectando…</div>;
  const { usuarios, invitaciones, juegos, stats } = lobby;
  const nombre = (u) => usuarios.find((x) => x.usuario === u)?.nombre || u;
  const nombreJuego = (id) => juegos.find((j) => j.id === id)?.nombre || id;

  const botonesDesafio = (juegoId) => usuarios.map((u) => {
    const enviada = invitaciones.enviadas.find((i) => i.a === u.usuario && i.juego === juegoId);
    return enviada ? (
      <button key={u.usuario} className="btn fantasma" onClick={() => emitir('cancelarInvitacion', { a: u.usuario })}>
        Esperando a {u.nombre}… (cancelar)
      </button>
    ) : (
      <button key={u.usuario} className="btn" disabled={!u.online || !!u.enSala} onClick={() => emitir('invitar', { a: u.usuario, juego: juegoId })}>
        Desafiar a {u.nombre}
      </button>
    );
  });
  const recibida = viendo && invitaciones.recibidas.find((i) => i.juego === viendo);
  const maxDe = (id) => juegos.find((j) => j.id === id)?.max || 2;
  const botonCodigo = (juegoId) => (
    <button className="btn fantasma" onClick={() => emitir('crearConCodigo', { juego: juegoId })}>
      <Icono id="llave" tam={18} /> Sala con código{maxDe(juegoId) > 2 ? ` (hasta ${maxDe(juegoId)})` : ''}
    </button>
  );

  return (
    <div className="lobby">
      {viendo && (
        <VistaPrevia
          id={viendo}
          nombre={nombreJuego(viendo)}
          cerrar={() => setViendo(null)}
          acciones={recibida ? (
            <button className="btn" onClick={() => { setViendo(null); emitir('responder', { de: recibida.de, acepta: true }); }}>¡Jugar con {nombre(recibida.de)}!</button>
          ) : <>{botonesDesafio(viendo)}{botonCodigo(viendo)}<button className="btn fantasma" onClick={() => { const v = viendo; setViendo(null); practicar(v, nombreJuego(v)); }}>Practicar contra el bot</button></>}
        />
      )}
      {invitaciones.recibidas.map((inv) => (
        <div key={inv.de} className="tarjeta invitacion">
          <div>
            <strong>{nombre(inv.de)}</strong> {inv.sala ? 'te invita a su sala de' : 'te desafía a'} <strong><Icono id={JUEGOS[inv.juego]?.icono} tam={20} /> {inv.nombreJuego}</strong>
          </div>
          <div className="acciones">
            <button className="btn" onClick={() => emitir('responder', { de: inv.de, acepta: true })}>¡Jugar!</button>
            <button className="btn fantasma" onClick={() => setViendo(inv.juego)}>Ver reglas</button>
            <button className="btn fantasma" onClick={() => emitir('responder', { de: inv.de, acepta: false })}>Ahora no</button>
          </div>
        </div>
      ))}

      <UnirseConCodigo key={codigoUrl || 'sin'} emitir={emitir} codigoUrl={codigoUrl} olvidarCodigo={olvidarCodigo} />

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
                <button type="button" className="juego-emoji vp-abrir" onClick={() => setViendo(j.id)} aria-label={`Ver reglas de ${j.nombre}`}><Icono id={info?.icono} tam={52} /></button>
                <div>
                  <h2>{j.nombre}{j.max > 2 && <span className="chip-jugadores" title={`De 2 a ${j.max} jugadores`}><Icono id="gente" tam={16} /> 2 a {j.max}</span>}</h2>
                  <p className="sub">{info?.texto}</p>
                </div>
              </div>
              {s && <p className="juego-stats">Jugadas {s.jugadas} · ganadas {s.ganadas}{s.empatadas ? ` · empates ${s.empatadas}` : ''}</p>}
              <div className="acciones">
                {botonesDesafio(j.id)}
                {botonCodigo(j.id)}
                <button className="btn fantasma" onClick={() => practicar(j.id, j.nombre)}>Practicar</button>
                <button className="btn fantasma" onClick={() => setViendo(j.id)}>Ver reglas</button>
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
              const otros = p.jugadores.filter((x) => x !== lobby.yo).map((x) => p.nombres?.[x] || nombre(x)).join(', ');
              const res = p.ganador === null ? 'empate' : p.ganador === lobby.yo ? 'gane' : 'perdi';
              return (
                <li key={i} className={res}>
                  <span>
                    <Icono id={JUEGOS[p.juego]?.icono} tam={18} /> {res === 'empate' ? 'Empataste' : res === 'gane' ? 'Ganaste' : 'Perdiste'} vs {otros}
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
