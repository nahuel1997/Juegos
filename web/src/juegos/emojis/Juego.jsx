import { useEffect, useMemo, useState } from 'react';
import { Cartel, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';
import { PICTOS, Picto } from './pictos.jsx';

const IDS = Object.keys(PICTOS);

function useRestante(hasta, ahoraServer) {
  const desfase = useMemo(() => Date.now() - ahoraServer, [ahoraServer]);
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    if (!hasta) return;
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, [hasta]);
  return hasta ? Math.max(0, Math.ceil((hasta - (ahora - desfase)) / 1000)) : null;
}

export default function JuegoEmojis({ partida, accion, ctx }) {
  const p = partida;
  const [texto, setTexto] = useState('');
  const restante = useRestante(p.hasta, p.ahora);
  const armando = p.armoYo && p.fase === 'armando';
  const puedoAyudar = p.armoYo && p.fase === 'adivinando' && p.extraQuedan > 0;
  const adivino = !p.armoYo && p.fase === 'adivinando';

  useEfecto(p.pictos.length ? `pc${p.turno}-${p.pictos.length}` : null, () => { efectoSonido.carta?.(); return null; });
  const revelado = useEfecto(p.fase === 'revelado' ? `rv${p.turno}` : null, () => {
    if (p.acierto) efectoSonido.fanfarria?.();
    return { ok: !!p.acierto };
  }, 2200);

  const enviar = (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    accion('adivinar', { texto });
    setTexto('');
  };

  let estado;
  if (p.fase === 'eligiendo') estado = p.armoYo ? 'Elegí la canción que vas a contar' : `${ctx.nombreRival} está eligiendo una canción…`;
  else if (p.fase === 'armando') estado = p.armoYo ? 'Contala solo con dibujitos' : `${ctx.nombreRival} está armando la pista…`;
  else if (p.fase === 'adivinando') estado = p.armoYo ? `${ctx.nombreRival} está adivinando…` : '¿Qué canción es?';
  else estado = p.acierto ? `¡Adivinada en ${p.acierto.segundos} s!` : 'No la adivinó';

  const listo = p.listosSiguiente.includes('yo');
  return (
    <div className="emojis">
      {revelado && <Cartel key={revelado.id} texto={revelado.ok ? '¡La sacó!' : 'Nadie la sacó'} sub={p.cancion ? `${p.cancion.titulo} — ${p.cancion.artista}` : ''} tipo={revelado.ok ? 'oro' : ''} />}
      <div className="marcador">
        <span>Vos <b>{p.puntos.yo}</b></span>
        <span className="ronda">Canción {p.turno} de {p.totalTurnos}{restante !== null ? ` · ${restante} s` : ''}</span>
        <span><b>{p.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${armando || adivino || (p.armoYo && p.fase === 'eligiendo') ? 'tu-turno' : ''}`}>
        {estado}
        {p.cancion && p.armoYo && p.fase !== 'revelado' && <small>Tu canción: <b>{p.cancion.titulo}</b> ({p.cancion.artista})</small>}
      </div>

      {p.fase === 'eligiendo' && p.armoYo && (
        <div className="em-opciones">
          {p.opciones.map((o, i) => (
            <button key={o.titulo} type="button" className="btn fantasma em-opcion" onClick={() => accion('elegir', { opcion: i })}>
              <b>{o.titulo}</b><small>{o.artista}</small>
            </button>
          ))}
        </div>
      )}

      {p.fase !== 'eligiendo' && (
        <div className="em-pista">
          {p.pictos.length === 0 && <span className="ayuda">{p.armoYo ? 'Tocá los dibujitos de abajo para armar la pista' : 'Todavía no hay pista…'}</span>}
          {p.pictos.map((x, i) => <span key={i} className={`em-picto ${x.extra ? 'extra' : ''}`}><Picto id={x.id} tam={52} /></span>)}
          {!p.armoYo && p.fase === 'armando' && p.cantidad > 0 && <span className="ayuda">({p.cantidad} dibujitos, se ven cuando termine)</span>}
        </div>
      )}

      {p.palabras && p.fase !== 'eligiendo' && (
        <div className="em-palabras" aria-label="Largo de cada palabra del título">
          {p.palabras.map((n, i) => <span key={i}>{Array.from({ length: n }, (_, k) => <i key={k} />)}</span>)}
        </div>
      )}

      {(armando || puedoAyudar) && (
        <>
          {puedoAyudar && <p className="ayuda centro">Podés sumar {p.extraQuedan} dibujito{p.extraQuedan === 1 ? '' : 's'} de ayuda.</p>}
          <div className="em-paleta">
            {IDS.map((id) => (
              <button key={id} type="button" className="em-boton" onClick={() => accion('picto', { id })} aria-label={id}>
                <Picto id={id} tam={36} />
              </button>
            ))}
          </div>
          {armando && (
            <div className="acciones centro">
              <button className="btn fantasma" disabled={!p.pictos.length} onClick={() => accion('quitar')}>Borrar el último</button>
              <button className="btn" disabled={!p.pictos.length} onClick={() => accion('listo')}>¡Listo, que adivine!</button>
            </div>
          )}
        </>
      )}

      {adivino && (
        <form className="em-adivinar" onSubmit={enviar}>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí el nombre de la canción" maxLength={80} autoComplete="off" enterKeyHint="send" aria-label="Tu respuesta" />
          <button className="btn">Probar</button>
          <button type="button" className="btn fantasma" onClick={() => accion('pasar')}>Paso</button>
        </form>
      )}

      {p.intentos.length > 0 && (
        <ul className="em-intentos">
          {p.intentos.slice(-8).reverse().map((x, i) => (
            <li key={i} className={x.ok ? 'ok' : x.casi ? 'casi' : ''}>{x.texto}{x.casi ? ' — ¡casi!' : ''}</li>
          ))}
        </ul>
      )}

      {p.fase === 'revelado' && (
        <div className="tarjeta em-revelado">
          <h3>{p.cancion?.titulo}</h3>
          <p>{p.cancion?.artista}</p>
          {p.acierto && <p>+{p.acierto.puntos} para el que adivinó · +{p.acierto.armo} para el que la armó</p>}
          {p.estado === 'jugando' && (
            <button className="btn" disabled={listo} onClick={() => accion('siguiente')}>{listo ? `Esperando a ${ctx.nombreRival}…` : 'Siguiente canción →'}</button>
          )}
        </div>
      )}
    </div>
  );
}

JuegoEmojis.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoEmojis.claveTurno = (p) => {
  if (p.estado !== 'jugando') return null;
  if (p.armoYo && p.fase === 'eligiendo') return `em-${p.turno}-elegir`;
  if (!p.armoYo && p.fase === 'adivinando') return `em-${p.turno}-adivinar`;
  return null;
};
