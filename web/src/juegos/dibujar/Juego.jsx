import { useEffect, useMemo, useRef, useState } from 'react';
import { Cartel, Confeti, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

const COLORES = ['#222222', '#ffffff', '#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#f06292', '#8d5524'];
const GROSORES = [4, 10, 22];
const ENVIO_MS = 160;

function pintar(ctx, trazos, ancho) {
  const k = ancho / 1000;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ancho, ancho * 0.7);
  for (const t of trazos) {
    ctx.strokeStyle = t.color;
    ctx.lineWidth = t.grosor * k;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    t.puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x * k, y * k * 0.7) : ctx.moveTo(x * k, y * k * 0.7)));
    if (t.puntos.length === 1) ctx.lineTo(t.puntos[0][0] * k + 0.1, t.puntos[0][1] * k * 0.7);
    ctx.stroke();
  }
}

// El lienzo: el que dibuja ve su trazo al instante y lo manda de a pedacitos; el otro lo ve en vivo.
function Lienzo({ trazos, puedeDibujar, color, grosor, accion }) {
  const ref = useRef(null);
  const actual = useRef(null); // { id, puntos, enviados }
  const [, refrescar] = useState(0);

  const todos = actual.current ? [...trazos, { color, grosor, puntos: actual.current.puntos }] : trazos;
  useEffect(() => {
    const cv = ref.current;
    const ancho = cv.clientWidth * (window.devicePixelRatio || 1);
    if (cv.width !== Math.round(ancho)) { cv.width = Math.round(ancho); cv.height = Math.round(ancho * 0.7); }
    pintar(cv.getContext('2d'), todos, cv.width);
  });

  const punto = (e) => {
    const r = ref.current.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * 1000), Math.round(((e.clientY - r.top) / r.height) * 1000)];
  };
  const enviar = (final) => {
    const a = actual.current;
    if (!a) return;
    const nuevos = a.puntos.slice(Math.max(0, a.enviados - 1)); // repite el último para que los pedacitos se unan
    if (nuevos.length > (a.enviados ? 1 : 0)) {
      accion('trazo', { id: a.id, puntos: nuevos, color, grosor });
      a.enviados = a.puntos.length;
    }
    if (final) actual.current = null;
  };
  useEffect(() => {
    if (!puedeDibujar) return undefined;
    const t = setInterval(() => enviar(false), ENVIO_MS);
    return () => clearInterval(t);
  });

  return (
    <canvas
      ref={ref}
      className={`dj-lienzo ${puedeDibujar ? 'activo' : ''}`}
      onPointerDown={(e) => {
        if (!puedeDibujar) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        actual.current = { id: `${Date.now() % 1e8}`, puntos: [punto(e)], enviados: 0 };
        refrescar((x) => x + 1);
      }}
      onPointerMove={(e) => {
        if (!actual.current) return;
        const p = punto(e);
        const ult = actual.current.puntos[actual.current.puntos.length - 1];
        if (Math.abs(p[0] - ult[0]) + Math.abs(p[1] - ult[1]) < 4) return;
        actual.current.puntos.push(p);
        refrescar((x) => x + 1);
      }}
      onPointerUp={() => enviar(true)}
      onPointerCancel={() => enviar(true)}
    />
  );
}

export default function JuegoDibujar({ partida, accion, ctx }) {
  const yo = partida.dibujoYo;
  const [color, setColor] = useState(COLORES[0]);
  const [grosor, setGrosor] = useState(GROSORES[0]);
  const [texto, setTexto] = useState('');
  const desfase = useMemo(() => partida.ahora - Date.now(), [partida.ahora]);
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    if (!partida.hasta) return undefined;
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, [partida.hasta]);
  const quedan = partida.hasta ? Math.max(0, Math.ceil((partida.hasta - (ahora + desfase)) / 1000)) : 0;

  const fx = useEfecto(partida.fase === 'revelado' ? `r${partida.turnoN}` : null, () => {
    if (partida.acierto) efectoSonido.fanfarria(); else efectoSonido.perder?.();
    return { acierto: partida.acierto, ms: 2600 };
  });
  const ultimoIntento = partida.intentos[partida.intentos.length - 1];
  const casi = useEfecto(ultimoIntento?.casi ? `c${partida.intentos.length}` : null, () => ({ ms: 1200 }));

  const adivinar = (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    accion('adivinar', { texto });
    setTexto('');
  };
  const listo = partida.listosSiguiente.includes('yo');

  return (
    <div className="dibujar">
      {fx && (fx.acierto
        ? <><Cartel key={fx.id} tipo="oro" texto="¡ADIVINÓ!" sub={`"${partida.palabra}" en ${fx.acierto.segundos} s`} /><Confeti key={`c${fx.id}`} cantidad={60} /></>
        : <Cartel key={fx.id} tipo="hundido" texto="¡TIEMPO!" sub={`Era "${partida.palabra}"`} />)}
      <div className="marcador">
        <span>Vos <b>{partida.puntos.yo}</b></span>
        <span className="ronda">Turno {partida.turnoN} de {partida.totalTurnos}</span>
        <span><b>{partida.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${(yo && partida.fase !== 'revelado') || (!yo && partida.fase === 'dibujando') ? 'tu-turno' : ''}`}>
        {partida.fase === 'eligiendo' && (yo ? 'Elegí qué vas a dibujar' : `${ctx.nombreRival} está eligiendo qué dibujar…`)}
        {partida.fase === 'dibujando' && (yo ? <>Dibujá: <b className="dj-palabra">{partida.palabra}</b></> : '¡Adiviná qué está dibujando!')}
        {partida.fase === 'revelado' && <>Era: <b className="dj-palabra">{partida.palabra}</b></>}
        {partida.fase === 'dibujando' && <small className={`dj-reloj ${quedan <= 10 ? 'poco' : ''}`}>Quedan {quedan} s</small>}
      </div>

      {partida.fase === 'eligiendo' && yo && (
        <div className="opciones dj-opciones">
          {partida.opciones.map((p) => <button key={p} type="button" className="opcion" onClick={() => accion('elegir', { palabra: p })}><b>{p}</b></button>)}
        </div>
      )}

      {partida.fase !== 'eligiendo' && (
        <div className="dj-zona">
          <div className="dj-hoja">
            <Lienzo trazos={partida.trazos} puedeDibujar={yo && partida.fase === 'dibujando'} color={color} grosor={grosor} accion={accion} />
            {!yo && partida.molde && partida.fase === 'dibujando' && (
              <div className="dj-molde">{partida.molde.map((n, i) => <span key={i}>{'_ '.repeat(n).trim()}</span>)}<small>({partida.molde.join(' + ')} letras)</small></div>
            )}
          </div>
          <div className="dj-panel">
            {yo && partida.fase === 'dibujando' && (
              <div className="dj-herramientas">
                <div className="dj-colores">
                  {COLORES.map((c) => <button key={c} type="button" className={`dj-color ${color === c ? 'sel' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={c === '#ffffff' ? 'Goma' : `Color ${c}`} />)}
                </div>
                <div className="dj-grosores">
                  {GROSORES.map((g) => <button key={g} type="button" className={`dj-grosor ${grosor === g ? 'sel' : ''}`} onClick={() => setGrosor(g)} aria-label={`Grosor ${g}`}><i style={{ width: g, height: g, background: color }} /></button>)}
                </div>
                <div className="acciones">
                  <button className="btn fantasma chico" onClick={() => accion('deshacer')}>Deshacer</button>
                  <button className="btn fantasma chico" onClick={() => accion('borrar')}>Borrar todo</button>
                </div>
                <p className="ayuda">El blanco funciona como goma.</p>
              </div>
            )}
            {!yo && partida.fase === 'dibujando' && (
              <form className="dj-adivinar" onSubmit={adivinar}>
                <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="¿Qué es?" maxLength={40} autoFocus />
                <button className="btn" type="submit">Probar</button>
              </form>
            )}
            {casi && <p className="dj-casi">¡Casi! Estás muy cerca</p>}
            <ul className="dj-intentos">
              {[...partida.intentos].reverse().map((x, i) => (
                <li key={partida.intentos.length - i} className={x.ok ? 'ok' : x.casi ? 'casi' : ''}>{x.texto}{x.casi ? ' · ¡casi!' : ''}</li>
              ))}
            </ul>
            {partida.fase === 'revelado' && partida.estado === 'jugando' && (
              <button className="btn" disabled={listo} onClick={() => accion('siguiente')}>{listo ? `Esperando a ${ctx.nombreRival}…` : partida.turnoN >= partida.totalTurnos ? 'Ver resultado →' : 'Siguiente turno →'}</button>
            )}
            {partida.acierto && partida.fase === 'revelado' && <p className="sub">+{partida.acierto.puntos} para el que adivinó, +{partida.acierto.dibujo} para el que dibujó.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

JuegoDibujar.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoDibujar.claveTurno = (p, ctx) => (p.estado === 'jugando' && ((p.dibujoYo && p.fase === 'eligiendo') || (!p.dibujoYo && p.fase === 'dibujando')) ? `dj-${p.turnoN}-${p.fase}` : null);
