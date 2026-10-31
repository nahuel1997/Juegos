import { useEffect, useRef, useState } from 'react';
import { MarcadorN } from '../../componentes/comunes.jsx';

const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
const RAPIDOS = [0, 5, 10, 20];

// Ruleta: muestra letras al azar un ratito y frena en la que salió.
function Ruleta({ letra, alTerminar }) {
  const [mostrada, setMostrada] = useState(letra);
  const [girando, setGirando] = useState(true);
  useEffect(() => {
    setGirando(true);
    let n = 0;
    const t = setInterval(() => {
      n++;
      setMostrada(LETRAS[Math.floor(Math.random() * LETRAS.length)]);
      if (n >= 14) {
        clearInterval(t);
        setMostrada(letra);
        setGirando(false);
        alTerminar?.();
      }
    }, 90);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letra]);
  return <div className={`ruleta ${girando ? 'girando' : ''}`}>{mostrada}</div>;
}

function CeldaPuntos({ valor, onChange }) {
  return (
    <div className="puntos-celda">
      {RAPIDOS.map((p) => (
        <button key={p} type="button" className={`pt ${valor === p ? 'activo' : ''}`} onClick={() => onChange(p)}>{p}</button>
      ))}
      <input
        type="number"
        min={0}
        max={100}
        value={valor ?? ''}
        placeholder="–"
        onChange={(e) => onChange(e.target.value === '' ? null : Math.max(0, Math.min(100, Math.round(Number(e.target.value)))))}
        aria-label="Puntos"
      />
    </div>
  );
}

function Puntuar({ partida, ronda, accion, ctx }) {
  const { columnas } = partida.config;
  const jugadores = partida.jugadores.filter((j) => !partida.fuera.includes(j));
  const confirmeYo = partida.confirmados.includes(ctx.yo);
  const faltan = jugadores.filter((j) => !partida.confirmados.includes(j) && j !== ctx.yo);
  const suma = (arr) => arr.reduce((s, p) => s + (p || 0), 0);
  // Yo primero y después los demás.
  const orden = [ctx.yo, ...jugadores.filter((j) => j !== ctx.yo)];
  return (
    <div className="tarjeta puntuar">
      <h3>Puntos de la ronda <span className="letra-chica">{ronda.letra}</span></h3>
      <p className="ayuda">Los pueden cambiar todos. Cuando estén de acuerdo, confirmen.</p>
      <div className="puntuar-scroll">
        <div className="puntuar-tabla" style={{ '--n': orden.length }}>
          <div className="pt-cab" />
          {orden.map((j) => <div key={j} className="pt-cab">{ctx.nombreDe(j)}</div>)}
          {columnas.map((c, i) => (
            <div className="pt-fila" key={c}>
              <div className="pt-col">{c}</div>
              {orden.map((j) => {
                const v = ronda.respuestas[j]?.[i];
                return (
                  <div className="pt-resp" key={j}>
                    <span className={v ? '' : 'vacia'}>{v || '(vacío)'}</span>
                    <CeldaPuntos valor={ronda.puntos[j][i]} onChange={(valor) => accion('puntos', { jugador: j, col: i, valor })} />
                  </div>
                );
              })}
            </div>
          ))}
          <div className="pt-fila total">
            <div className="pt-col">Total ronda</div>
            {orden.map((j) => <div key={j}><b>{suma(ronda.puntos[j])}</b></div>)}
          </div>
        </div>
      </div>
      <div className="acciones">
        <button className="btn" disabled={confirmeYo} onClick={() => accion('confirmar')}>
          {confirmeYo ? 'Confirmado ✓' : 'Confirmar puntos'}
        </button>
        <small className="sub">{faltan.length ? `Falta que confirme: ${faltan.map(ctx.nombreDe).join(', ')}` : 'Ya confirmaron todos los demás'}</small>
      </div>
    </div>
  );
}

export default function JuegoTuti({ partida, accion, ctx }) {
  const { columnas } = partida.config;
  const actual = partida.rondas[partida.rondas.length - 1];
  const escribiendo = partida.estado === 'jugando' && (partida.fase === 'escribiendo' || partida.fase === 'basta');
  const [valores, setValores] = useState(actual.mias);
  const [listaLetra, setListaLetra] = useState(false);
  const [restante, setRestante] = useState(null);
  const inputs = useRef([]);
  const envio = useRef(null);

  // Ronda nueva: borrador limpio (o lo que ya había mandado, si se reconectó) y ruleta.
  useEffect(() => {
    setValores(actual.mias);
    setListaLetra(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partida.numero]);

  // Cuenta regresiva del basta (el server manda cuánto falta; acá se descuenta).
  useEffect(() => {
    if (partida.restanteMs == null) return setRestante(null);
    const fin = Date.now() + partida.restanteMs;
    const tic = () => setRestante(Math.max(0, Math.ceil((fin - Date.now()) / 1000)));
    tic();
    const t = setInterval(tic, 250);
    return () => clearInterval(t);
  }, [partida.restanteMs, partida.fase]);

  // Cuenta para ver la letra y prepararse: hasta que llega a 0 no se puede escribir.
  const [preparacion, setPreparacion] = useState(0);
  useEffect(() => {
    const fin = Date.now() + (partida.arrancaEnMs || 0);
    const tic = () => setPreparacion(Math.max(0, Math.ceil((fin - Date.now()) / 1000)));
    tic();
    const t = setInterval(tic, 200);
    return () => clearInterval(t);
  }, [partida.numero, partida.arrancaEnMs]);
  const puedeEscribir = listaLetra && preparacion === 0;
  useEffect(() => {
    if (puedeEscribir && escribiendo) setTimeout(() => inputs.current[0]?.focus(), 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puedeEscribir, partida.numero]);

  function escribir(i, texto) {
    const nuevos = valores.map((v, k) => (k === i ? texto : v));
    setValores(nuevos);
    clearTimeout(envio.current);
    envio.current = setTimeout(() => accion('respuestas', { valores: nuevos }), 400);
  }

  const completo = valores.every((v) => v.trim());
  const yoBasta = partida.bastaPor === ctx.yo;
  const yaTermine = partida.terminaron.includes(ctx.yo);
  const muchos = partida.jugadores.length > 2;
  const quienBasta = ctx.nombreDe(partida.bastaPor);

  return (
    <div className="tuti">
      <MarcadorN jugadores={partida.jugadores} puntos={partida.totales} ctx={ctx} fuera={partida.fuera} extra={`Ronda ${partida.numero} de ${partida.config.rondas}`} />

      <div className="tuti-cab">
        <Ruleta key={partida.numero} letra={actual.letra} alTerminar={() => setListaLetra(true)} />
        <div className="tuti-estado">
          {escribiendo && partida.fase === 'escribiendo' && (
            puedeEscribir
              ? <b>¡Con la {actual.letra}! Completá todo y cantá basta.</b>
              : listaLetra && <div className="preparate"><span>Preparate, arranca en</span><b key={preparacion}>{preparacion}</b></div>
          )}
          {partida.fase === 'basta' && (
            <b className="alerta">{yoBasta ? `¡Cantaste basta! ${muchos ? 'Los demás tienen' : `${ctx.nombreRival} tiene`}` : yaTermine ? 'Listo: esperando a los demás…' : `¡${quienBasta} cantó basta! Te quedan`} {restante ?? ''} s</b>
          )}
          {partida.fase === 'puntuando' && <b>Ronda cerrada: pongan los puntos.</b>}
          {escribiendo && (
            <button className="btn grande basta" disabled={!completo || !puedeEscribir || yaTermine} onClick={() => { clearTimeout(envio.current); accion('basta', { valores }); }}>
              {yaTermine ? 'Esperando…' : '¡BASTA!'}
            </button>
          )}
        </div>
      </div>

      <div className="tuti-tabla-wrap">
        <table className="tuti-tabla">
          <thead>
            <tr>
              <th>Letra</th>
              {columnas.map((c) => <th key={c}>{c}</th>)}
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {partida.rondas.map((r, n) => {
              const esActual = n === partida.rondas.length - 1;
              const orden = [ctx.yo, ...partida.jugadores.filter((j) => j !== ctx.yo)];
              if (esActual && escribiendo) {
                return (
                  <tr key={n} className="fila-activa">
                    <td className="letra-celda">{listaLetra ? r.letra : '?'}</td>
                    {columnas.map((c, i) => (
                      <td key={c}>
                        <input
                          ref={(el) => (inputs.current[i] = el)}
                          value={valores[i] || ''}
                          maxLength={40}
                          disabled={!puedeEscribir}
                          placeholder={puedeEscribir ? `${c} con ${r.letra}` : ''}
                          onChange={(e) => escribir(i, e.target.value)}
                          onKeyDown={(e) => {
                            // Enter = como Tab: pasa a la casilla siguiente.
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              inputs.current[i + 1]?.focus();
                            }
                          }}
                          autoComplete="off"
                          aria-label={c}
                        />
                      </td>
                    ))}
                    <td>–</td>
                  </tr>
                );
              }
              return orden.map((j, k) => {
                const resp = j === ctx.yo ? r.mias : r.respuestas[j];
                const suma = r.puntos[j].reduce((s, p) => s + (p || 0), 0);
                return (
                  <tr key={`${n}-${j}`} className={`fila-pasada ${k > 0 ? 'rival' : ''}`}>
                    {k === 0 && <td className="letra-celda" rowSpan={orden.length}>{r.letra}</td>}
                    {(resp || columnas.map(() => '')).map((v, i) => <td key={i}>{v || '—'} {r.puntos[j][i] != null && <small className="pts">{r.puntos[j][i]}</small>}</td>)}
                    <td><b>{suma}</b>{orden.length > 2 && <small className="quien"> {ctx.nombreDe(j)}</small>}</td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
        <p className="ayuda">En cada ronda, la primera línea son tus respuestas y abajo las de {partida.jugadores.length > 2 ? 'los demás' : ctx.nombreRival}. Tab o Enter pasa a la casilla siguiente.</p>
      </div>

      {partida.fase === 'puntuando' && partida.estado === 'jugando' && <Puntuar partida={partida} ronda={actual} accion={accion} ctx={ctx} />}
    </div>
  );
}

JuegoTuti.textoFinal = (p, _gane, ctx) => [...p.jugadores].sort((a, b) => p.totales[b] - p.totales[a]).map((j) => `${ctx?.nombreDe?.(j) ?? j} ${p.totales[j]}`).join(' · ');

// Suena cuando sale una letra nueva.
JuegoTuti.claveTurno = (p) => (p.estado === 'jugando' && p.fase === 'escribiendo' ? `t-${p.numero}` : null);
