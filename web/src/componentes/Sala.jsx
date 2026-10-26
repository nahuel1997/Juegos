import { useCallback } from 'react';
import { JUEGOS } from '../juegos/index.js';
import { Avatar } from './comunes.jsx';

function Final({ sala, emitir, ctx, textoFinal }) {
  const p = sala.partida;
  const empate = p.ganador === null;
  const gane = p.ganador === ctx.yo;
  const pidioRival = sala.revancha.includes(ctx.rival);
  const pediYo = sala.revancha.includes(ctx.yo);
  const rosa = document.documentElement.dataset.tema === 'rosa';
  return (
    <div className={`tarjeta final ${gane ? 'gane' : empate ? '' : 'perdi'}`}>
      <div className="final-emoji">{empate ? '🤝' : rosa ? (gane ? '👑💖' : '💌') : gane ? '🏆' : '🥈'}</div>
      <h2>{empate ? '¡Empate!' : gane ? '¡Ganaste!' : `Ganó ${ctx.nombreRival}`}</h2>
      <p className="sub">
        {p.motivoFin === 'abandono'
          ? gane ? `${ctx.nombreRival} abandonó la partida.` : 'Abandonaste la partida.'
          : textoFinal?.(p, gane)}
      </p>
      {pidioRival && !pediYo && <p className="pedido">{ctx.nombreRival} quiere la revancha</p>}
      <div className="acciones">
        <button className="btn" disabled={pediYo || !sala.rivalEnSala || !sala.rivalOnline} onClick={() => emitir('revancha')}>
          {pediYo ? 'Esperando respuesta…' : pidioRival ? '¡Aceptar revancha!' : 'Pedir revancha'}
        </button>
        <button className="btn fantasma" onClick={() => emitir('volverAConfig')}>Cambiar reglas</button>
        <button className="btn fantasma" onClick={() => emitir('salir')}>Salir de la sala</button>
      </div>
    </div>
  );
}

export default function Sala({ sala, emitir, gente }) {
  const def = JUEGOS[sala.juego];
  const rival = gente[sala.rival] || { usuario: sala.rival, nombre: sala.rival };
  const ctx = { yo: sala.yo, rival: sala.rival, nombreRival: rival.nombre, rivalOnline: sala.rivalOnline };
  const accion = useCallback((tipo, datos) => emitir('accion', { tipo, datos }), [emitir]);
  const listoYo = sala.listos.includes(sala.yo);
  const listoRival = sala.listos.includes(sala.rival);

  function abandonar() {
    if (window.confirm('¿Seguro que querés abandonar? La partida la gana tu rival.')) emitir('abandonar');
  }

  return (
    <div className={`sala sala-${sala.juego}`}>
      <div className="batalla-cab">
        <h2>
          {def.emoji} {sala.nombreJuego}{' '}
          <span className="vs">vs <Avatar usuario={rival} tam={24} /> {rival.nombre}</span>
        </h2>
        {sala.estado === 'config' && <button className="btn chico fantasma" onClick={() => emitir('salir')}>Salir de la sala</button>}
        {sala.estado === 'jugando' && <button className="btn chico fantasma" onClick={abandonar}>Abandonar</button>}
      </div>

      {!sala.rivalOnline && <div className="cinta">{rival.nombre} se desconectó. La sala queda guardada hasta que vuelva.</div>}
      {sala.rivalOnline && !sala.rivalEnSala && <div className="cinta">{rival.nombre} salió de la sala.</div>}

      {sala.estado === 'config' && (
        <div className="tarjeta config">
          <div className="config-cab">
            <h2>Sala de configuración</h2>
            <button className="btn chico fantasma" onClick={() => emitir('configurar', { config: sala.configDefecto })}>Reglas por defecto</button>
          </div>
          <p className="sub">Los dos pueden cambiar las reglas; cada cambio lo ven los dos y hay que volver a confirmar.</p>
          <def.Config config={sala.config} cambiar={(config) => emitir('configurar', { config })} />
          <div className="listos">
            <span className={`listo ${listoYo ? 'si' : ''}`}>{listoYo ? '✓' : '…'} Vos</span>
            <span className={`listo ${listoRival ? 'si' : ''}`}>{listoRival ? '✓' : '…'} {rival.nombre}</span>
            <button className="btn grande" onClick={() => emitir('listo', { listo: !listoYo })}>
              {listoYo ? 'Esperando… (no estoy listo)' : listoRival ? '¡Listo, a jugar!' : '¡Listo!'}
            </button>
          </div>
        </div>
      )}

      {sala.partida && (
        <>
          {sala.estado === 'terminada' && <Final sala={sala} emitir={emitir} ctx={ctx} textoFinal={def.Juego.textoFinal} />}
          <def.Juego partida={sala.partida} accion={accion} ctx={ctx} />
        </>
      )}
    </div>
  );
}
