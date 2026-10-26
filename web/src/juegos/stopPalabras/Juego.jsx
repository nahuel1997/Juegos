import { useEffect, useState } from 'react';

const FILAS_TECLADO = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
const segundos = (ms) => (ms == null ? '' : `${(ms / 1000).toFixed(1)} s`);

function Grilla({ intentos, largo, total, escribiendo, chica }) {
  return (
    <div className={`stop-grilla ${chica ? 'chica' : ''}`} style={{ '--largo': largo }}>
      {Array.from({ length: total }, (_, f) => {
        const it = intentos[f];
        const actual = !it && f === intentos.length && escribiendo != null;
        return Array.from({ length: largo }, (_, c) => {
          const letra = it ? it.palabra?.[c] ?? '' : actual ? escribiendo[c] ?? '' : '';
          const color = it?.colores[c];
          return (
            <span key={`${f}-${c}`} className={`tile ${color || ''} ${actual && letra ? 'llena' : ''}`} style={color ? { animationDelay: `${c * 0.12}s` } : undefined}>
              {chica ? '' : letra}
            </span>
          );
        });
      })}
    </div>
  );
}

export default function JuegoStop({ partida, accion, ctx }) {
  const { config, mio, rival, fase } = partida;
  const [palabra, setPalabra] = useState('');
  const [reloj, setReloj] = useState(0);
  const puedoEscribir = partida.estado === 'jugando' && fase === 'jugando' && !mio.terminado;

  useEffect(() => setPalabra(''), [partida.numero, mio.intentos.length]);

  // Reloj de la ronda (corrigiendo la diferencia de hora con el server).
  useEffect(() => {
    if (fase !== 'jugando') return;
    const desfase = Date.now() - partida.ahora;
    const tic = () => setReloj(Date.now() - desfase - partida.inicio);
    tic();
    const t = setInterval(tic, 100);
    return () => clearInterval(t);
  }, [fase, partida.inicio, partida.ahora]);

  function tecla(k) {
    if (!puedoEscribir) return;
    if (k === 'ENTER') {
      if (palabra.length === config.largo) accion('intentar', { palabra });
    } else if (k === 'BORRAR') {
      setPalabra((p) => p.slice(0, -1));
    } else if (palabra.length < config.largo) {
      setPalabra((p) => (p.length < config.largo ? p + k : p));
    }
  }

  // Teclado físico.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') tecla('ENTER');
      else if (e.key === 'Backspace') tecla('BORRAR');
      else if (/^[a-zñ]$/i.test(e.key)) tecla(e.key.toUpperCase());
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const listoYo = partida.listos.includes(ctx.yo);

  return (
    <div className="stop">
      <div className="marcador">
        <span>Vos <b>{partida.puntos.yo}</b></span>
        <span className="ronda">Ronda {partida.numero} de {config.rondas}{fase === 'jugando' ? ` · ${segundos(reloj)}` : ''}</span>
        <span><b>{partida.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>

      {fase === 'resultado' ? (
        <div className={`tarjeta stop-resultado ${partida.resultado}`}>
          <h3>La palabra era <span className="stop-palabra">{partida.palabra}</span></h3>
          <p>
            {partida.resultado === 'gane' ? '¡Ganaste la ronda!' : partida.resultado === 'perdi' ? `${ctx.nombreRival} ganó la ronda` : 'Empate'}
            {' · '}Vos: {mio.resuelto ? `${mio.intentos.length} intentos (${segundos(mio.ms)})` : 'no la sacaste'}
            {' · '}{ctx.nombreRival}: {rival.resuelto ? `${rival.intentos.length} intentos (${segundos(rival.ms)})` : 'no la sacó'}
          </p>
          {partida.estado === 'jugando' && (
            <button className="btn" disabled={listoYo} onClick={() => accion('siguiente')}>{listoYo ? `Esperando a ${ctx.nombreRival}…` : 'Siguiente ronda →'}</button>
          )}
        </div>
      ) : (
        <div className={`estado-cinta ${puedoEscribir ? 'tu-turno' : ''}`}>
          {mio.terminado ? (mio.resuelto ? `¡La sacaste en ${mio.intentos.length}! Esperando a ${ctx.nombreRival}…` : `Sin intentos. Esperando a ${ctx.nombreRival}…`) : `Adiviná la palabra de ${config.largo} letras`}
          <small>{rival.terminado ? `${ctx.nombreRival} ya terminó${rival.resuelto ? ' (la sacó)' : ''}` : `${ctx.nombreRival} va por el intento ${rival.intentos.length + 1}`}</small>
        </div>
      )}

      <div className="stop-grid">
        <Grilla intentos={mio.intentos} largo={config.largo} total={config.intentos} escribiendo={puedoEscribir ? palabra : null} />
        <div className="stop-rival">
          <small>{ctx.nombreRival}</small>
          <Grilla intentos={rival.intentos} largo={config.largo} total={config.intentos} chica={fase === 'jugando'} />
        </div>
      </div>

      <div className="stop-teclado">
        {FILAS_TECLADO.map((fila, i) => (
          <div key={fila} className="fila-teclado">
            {i === 2 && <button type="button" className="tecla ancha" onClick={() => tecla('ENTER')} disabled={!puedoEscribir || palabra.length !== config.largo}>Enviar</button>}
            {[...fila].map((l) => (
              <button key={l} type="button" className={`tecla ${partida.teclado[l] || ''}`} onClick={() => tecla(l)} disabled={!puedoEscribir}>{l}</button>
            ))}
            {i === 2 && <button type="button" className="tecla ancha" onClick={() => tecla('BORRAR')} disabled={!puedoEscribir} aria-label="Borrar">⌫</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

JuegoStop.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoStop.claveTurno = (p) => (p.estado === 'jugando' && p.fase === 'jugando' && !p.mio.terminado ? `s-${p.numero}` : null);
