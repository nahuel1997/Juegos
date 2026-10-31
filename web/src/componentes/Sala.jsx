import { useCallback, useEffect, useRef, useState } from 'react';
import { JUEGOS } from '../juegos/index.js';
import { Avatar } from './comunes.jsx';
import { efectoSonido, sonarTurno } from '../sonido.js';
import { Confeti } from '../efectos.jsx';
import { Icono } from '../iconos.jsx';
import { SelectorEmotes } from './Emotes.jsx';
import { MarcoSkin, SelectorSkin } from '../skins.jsx';
import { colorInvitado } from './comunes.jsx';

function Final({ sala, emitir, ctx, textoFinal }) {
  const p = sala.partida;
  const empate = p.ganador === null;
  const gane = p.ganador === ctx.yo;
  const muchos = sala.jugadores.length > 2;
  const pediYo = sala.revancha.includes(ctx.yo);
  const otrosPidieron = sala.revancha.filter((x) => x !== ctx.yo);
  const presentes = sala.jugadores.every((j) => j.enSala && j.online);
  const rosa = document.documentElement.dataset.tema === 'rosa';
  let dibujo;
  if (empate) dibujo = <Icono id="apreton" tam={72} />;
  else if (gane) dibujo = rosa ? <><Icono id="corona" tam={72} /><Icono id="corazon" tam={56} /></> : <Icono id="trofeo" tam={72} />;
  else dibujo = <Icono id={rosa ? 'beso' : 'medalla'} tam={72} />;
  // Festejo (o lamento) al terminar. Si se recarga la página con el cartel final a la vista no se repite:
  // la marca se borra recién cuando el cartel se va (revancha, reglas o salir).
  const marca = `fin-${sala.id}`;
  const [festejo] = useState(() => {
    try { return sessionStorage.getItem('fin-visto') !== marca; } catch { return true; }
  });
  useEffect(() => {
    try { sessionStorage.setItem('fin-visto', marca); } catch { /* sin storage */ }
    if (festejo && !empate && p.motivoFin !== 'abandono') {
      if (gane) efectoSonido.ganar(); else efectoSonido.perder();
    }
    return () => { try { sessionStorage.removeItem('fin-visto'); } catch { /* sin storage */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const ganador = ctx.nombreDe(p.ganador);
  return (
    <div className={`tarjeta final ${gane ? 'gane' : empate ? '' : 'perdi'}`}>
      {festejo && gane && <Confeti cantidad={120} />}
      <div className="final-emoji">{dibujo}</div>
      <h2>{empate ? '¡Empate!' : gane ? '¡Ganaste!' : `Ganó ${ganador}`}</h2>
      <p className="sub">
        {p.motivoFin === 'abandono' && !muchos
          ? gane ? `${ctx.nombreRival} abandonó la partida.` : 'Abandonaste la partida.'
          : textoFinal?.(p, gane, ctx)}
      </p>
      {otrosPidieron.length > 0 && !pediYo && (
        <p className="pedido">{otrosPidieron.map(ctx.nombreDe).join(', ')} {otrosPidieron.length === 1 ? 'quiere' : 'quieren'} la revancha</p>
      )}
      {muchos && pediYo && <p className="pedido">Revancha: {sala.revancha.length} de {sala.jugadores.length} listos</p>}
      <div className="acciones">
        <button className="btn" disabled={pediYo || !presentes} onClick={() => emitir('revancha')}>
          {pediYo ? 'Esperando respuesta…' : otrosPidieron.length ? '¡Aceptar revancha!' : 'Pedir revancha'}
        </button>
        <button className="btn fantasma" onClick={() => emitir('volverAConfig')}>Cambiar reglas</button>
        <button className="btn fantasma" onClick={() => emitir('salir')}>Salir de la sala</button>
      </div>
    </div>
  );
}

// Código para compartir: copiar el link o mandarlo con el menú de compartir del celular.
function CodigoSala({ codigo, nombreJuego }) {
  const [copiado, setCopiado] = useState(false);
  const link = `${location.origin}/?codigo=${codigo}`;
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { window.prompt('Copiá el link:', link); }
  };
  const compartir = () => navigator.share?.({ title: `Juguemos ${nombreJuego}`, text: `Entrá con el código ${codigo}`, url: link }).catch(() => {});
  return (
    <div className="codigo-sala">
      <span className="sub">Código de la sala</span>
      <b className="codigo-grande" aria-label={`Código ${codigo.split('').join(' ')}`}>{codigo}</b>
      <div className="acciones">
        <button type="button" className="btn chico" onClick={copiar}>{copiado ? '¡Link copiado!' : 'Copiar link'}</button>
        {typeof navigator.share === 'function' && <button type="button" className="btn chico fantasma" onClick={compartir}>Compartir</button>}
      </div>
      <small className="ayuda">Con el link o el código pueden entrar sin usuario: ponen su nombre y listo.</small>
    </div>
  );
}

export default function Sala({ sala, emitir, gente, usuarios = [], invitacionesEnviadas = [] }) {
  const def = JUEGOS[sala.juego];
  const jugadores = sala.jugadores.map((j) => ({
    ...j,
    color: gente[j.id]?.color || colorInvitado(j.id),
    avatar: gente[j.id]?.avatar || null,
    usuario: j.id,
  }));
  const datos = (id) => jugadores.find((x) => x.id === id);
  const rival = datos(sala.rival) || { usuario: sala.rival, nombre: sala.rival ? sala.rival : 'nadie todavía' };
  const nombreDe = (id) => (id === sala.yo ? 'Vos' : datos(id)?.nombre || id);
  const ctx = {
    yo: sala.yo,
    rival: sala.rival,
    nombreRival: rival.nombre,
    rivalOnline: sala.rivalOnline,
    colorYo: datos(sala.yo)?.color || '#ffb703',
    colorRival: rival.color || '#8ecae6',
    jugadores,
    nombreDe,
    colorDe: (id) => datos(id)?.color || '#8ecae6',
  };
  const accion = useCallback((tipo, d) => emitir('accion', { tipo, datos: d }), [emitir]);
  const listoYo = sala.listos.includes(sala.yo);
  const conCodigo = !!sala.codigo;
  const soyAnfitrion = sala.anfitrion === sala.yo;
  const puedoConfigurar = !conCodigo || soyAnfitrion;
  const faltan = Math.max(0, 2 - sala.jugadores.length);
  const ausentes = jugadores.filter((j) => j.id !== sala.yo && (!j.online || !j.enSala));

  // Sonido cuando empieza un turno tuyo (no al entrar o recargar la sala).
  const clave = sala.partida && def.Juego.claveTurno ? def.Juego.claveTurno(sala.partida, ctx) : null;
  const ultimaClave = useRef(clave);
  useEffect(() => {
    if (clave && clave !== ultimaClave.current) sonarTurno();
    ultimaClave.current = clave;
  }, [clave]);

  function abandonar() {
    const quien = sala.jugadores.length > 2 ? 'Quedás afuera de esta partida.' : 'La partida la gana tu rival.';
    if (window.confirm(`¿Seguro que querés abandonar? ${quien}`)) emitir('abandonar');
  }

  return (
    <div className={`sala sala-${sala.juego}`}>
      <div className="batalla-cab">
        <h2>
          <Icono id={def.icono} tam={30} /> {sala.nombreJuego}{' '}
          {!conCodigo && sala.jugadores.length === 2 ? (
            <span className="vs">vs <Avatar usuario={rival} tam={24} /> {rival.nombre}</span>
          ) : (
            <span className="vs sala-gente">
              {jugadores.map((j) => <Avatar key={j.id} usuario={j} tam={24} />)}
              <small>{sala.jugadores.length} de {sala.max}</small>
            </span>
          )}
        </h2>
        <div className="acciones sala-acciones">
          <SelectorSkin juego={sala.juego} />
          <SelectorEmotes emitir={emitir} />
          {sala.estado === 'config' && <button className="btn chico fantasma" onClick={() => emitir('salir')}>Salir de la sala</button>}
          {sala.estado === 'jugando' && <button className="btn chico fantasma" onClick={abandonar}>Abandonar</button>}
        </div>
      </div>

      {ausentes.map((j) => (
        <div key={j.id} className="cinta">
          {!j.online ? `${j.nombre} se desconectó. La sala queda guardada hasta que vuelva.` : `${j.nombre} salió de la sala.`}
        </div>
      ))}

      {sala.estado === 'config' && (
        <div className="tarjeta config">
          <div className="config-cab">
            <h2>Sala de configuración</h2>
            {puedoConfigurar && <button className="btn chico fantasma" onClick={() => emitir('configurar', { config: sala.configDefecto })}>Reglas por defecto</button>}
          </div>
          {conCodigo && (
            <div className="sala-codigo-zona">
              <CodigoSala codigo={sala.codigo} nombreJuego={sala.nombreJuego} />
              <ul className="sala-jugadores">
                {jugadores.map((j) => (
                  <li key={j.id} className={sala.listos.includes(j.id) ? 'listo-si' : ''}>
                    <Avatar usuario={j} tam={30} />
                    <span>
                      {j.id === sala.yo ? `${j.nombre} (vos)` : j.nombre}
                      <small>
                        {sala.anfitrion === j.id ? 'armó la sala · ' : ''}
                        {j.invitado ? 'invitado · ' : ''}
                        {sala.listos.includes(j.id) ? 'listo' : j.online ? 'eligiendo…' : 'desconectado'}
                      </small>
                    </span>
                    {soyAnfitrion && j.id !== sala.yo && (
                      <button type="button" className="btn chico fantasma" onClick={() => emitir('expulsar', { jugador: j.id })} aria-label={`Sacar a ${j.nombre}`}>Sacar</button>
                    )}
                  </li>
                ))}
                {Array.from({ length: Math.max(0, Math.min(sala.max, 8) - jugadores.length) }, (_, i) => (
                  <li key={`v${i}`} className="vacio"><span className="avatar vacio-av" style={{ width: 30, height: 30 }} /> <span>Lugar libre</span></li>
                ))}
              </ul>
              {sala.jugadores.length < sala.max && usuarios.some((u) => u.online && !u.enSala) && (
                <div className="sala-invitar">
                  <span className="sub">Invitar a:</span>
                  {usuarios.filter((u) => u.online && !u.enSala).map((u) => {
                    const enviada = invitacionesEnviadas.some((i) => i.a === u.usuario);
                    return (
                      <button key={u.usuario} type="button" className="btn chico fantasma" disabled={enviada} onClick={() => emitir('invitar', { a: u.usuario })}>
                        <Avatar usuario={u} tam={20} /> {enviada ? `Esperando a ${u.nombre}…` : u.nombre}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <p className="sub">
            {!conCodigo
              ? 'Los dos pueden cambiar las reglas; cada cambio lo ven los dos y hay que volver a confirmar.'
              : soyAnfitrion
                ? 'Vos elegís las reglas. Cuando todos estén listos, arranca.'
                : `Las reglas las elige ${nombreDe(sala.anfitrion)}. Cuando todos estén listos, arranca.`}
          </p>
          <fieldset className="config-campos" disabled={!puedoConfigurar}>
            <def.Config config={sala.config} cambiar={(config) => emitir('configurar', { config })} />
          </fieldset>
          <div className="listos">
            {!conCodigo && (
              <>
                <span className={`listo ${listoYo ? 'si' : ''}`}>{listoYo ? '✓' : '…'} Vos</span>
                <span className={`listo ${sala.listos.includes(sala.rival) ? 'si' : ''}`}>{sala.listos.includes(sala.rival) ? '✓' : '…'} {rival.nombre}</span>
              </>
            )}
            {conCodigo && <span className="listo">{sala.listos.length} de {sala.jugadores.length} listos</span>}
            <button className="btn grande" disabled={faltan > 0 && !listoYo} onClick={() => emitir('listo', { listo: !listoYo })}>
              {faltan > 0 ? `Falta${faltan > 1 ? 'n' : ''} ${faltan} jugador${faltan > 1 ? 'es' : ''}…` : listoYo ? 'Esperando… (no estoy listo)' : '¡Listo!'}
            </button>
          </div>
        </div>
      )}

      {sala.partida && (
        <MarcoSkin juego={sala.juego}>
          {sala.estado === 'terminada' && <Final sala={sala} emitir={emitir} ctx={ctx} textoFinal={def.Juego.textoFinal} />}
          <def.Juego partida={sala.partida} accion={accion} ctx={ctx} />
        </MarcoSkin>
      )}
    </div>
  );
}
