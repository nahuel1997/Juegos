import { useEffect, useRef, useState } from 'react';

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
  const confirmeYo = partida.confirmados.includes(ctx.yo);
  const confirmoRival = partida.confirmados.includes(ctx.rival);
  const suma = (arr) => arr.reduce((s, p) => s + (p || 0), 0);
  return (
    <div className="tarjeta puntuar">
      <h3>Puntos de la ronda <span className="letra-chica">{ronda.letra}</span></h3>
      <p className="ayuda">Los pueden cambiar los dos. Cuando estén de acuerdo, confirmen.</p>
      <div className="puntuar-tabla" style={{ '--n': 2 }}>
        <div className="pt-cab" />
        <div className="pt-cab">Vos</div>
        <div className="pt-cab">{ctx.nombreRival}</div>
        {columnas.map((c, i) => (
          <div className="pt-fila" key={c}>
            <div className="pt-col">{c}</div>
            <div className="pt-resp">
              <span className={ronda.mias[i] ? '' : 'vacia'}>{ronda.mias[i] || '(vacío)'}</span>
              <CeldaPuntos valor={ronda.puntos.yo[i]} onChange={(valor) => accion('puntos', { jugador: ctx.yo, col: i, valor })} />
            </div>
            <div className="pt-resp">
              <span className={ronda.rival?.[i] ? '' : 'vacia'}>{ronda.rival?.[i] || '(vacío)'}</span>
              <CeldaPuntos valor={ronda.puntos.rival[i]} onChange={(valor) => accion('puntos', { jugador: ctx.rival, col: i, valor })} />
            </div>
          </div>
        ))}
        <div className="pt-fila total">
          <div className="pt-col">Total ronda</div>
          <div><b>{suma(ronda.puntos.yo)}</b></div>
          <div><b>{suma(ronda.puntos.rival)}</b></div>
        </div>
      </div>
      <div className="acciones">
        <button className="btn" disabled={confirmeYo} onClick={() => accion('confirmar')}>
          {confirmeYo ? 'Confirmado ✓' : 'Confirmar puntos'}
        </button>
        <small className="sub">{confirmoRival ? `${ctx.nombreRival} ya confirmó` : `${ctx.nombreRival} todavía no confirmó`}</small>
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

  return (
    <div className="tuti">
      <div className="marcador">
        <span>Vos <b>{partida.totales.yo}</b></span>
        <span className="ronda">Ronda {partida.numero} de {partida.config.rondas}</span>
        <span><b>{partida.totales.rival}</b> {ctx.nombreRival}</span>
      </div>

      <div className="tuti-cab">
        <Ruleta key={partida.numero} letra={actual.letra} alTerminar={() => setListaLetra(true)} />
        <div className="tuti-estado">
          {escribiendo && partida.fase === 'escribiendo' && (
            puedeEscribir
              ? <b>¡Con la {actual.letra}! Completá todo y cantá basta.</b>
              : listaLetra && <div className="preparate"><span>Preparate, arranca en</span><b key={preparacion}>{preparacion}</b></div>
          )}
          {partida.fase === 'basta' && (
            <b className="alerta">{yoBasta ? `¡Cantaste basta! ${ctx.nombreRival} tiene` : `¡${ctx.nombreRival} cantó basta! Te quedan`} {restante ?? ''} s</b>
          )}
          {partida.fase === 'puntuando' && <b>Ronda cerrada: pongan los puntos.</b>}
          {escribiendo && (
            <button className="btn grande basta" disabled={!completo || !puedeEscribir || yoBasta} onClick={() => { clearTimeout(envio.current); accion('basta', { valores }); }}>
              {yoBasta ? 'Esperando…' : '¡BASTA!'}
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
              const sumaYo = r.puntos.yo.reduce((s, p) => s + (p || 0), 0);
              const sumaRival = r.puntos.rival.reduce((s, p) => s + (p || 0), 0);
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
              return [
                <tr key={`${n}y`} className="fila-pasada">
                  <td className="letra-celda" rowSpan={2}>{r.letra}</td>
                  {r.mias.map((v, i) => <td key={i}>{v || '—'} {r.puntos.yo[i] != null && <small className="pts">{r.puntos.yo[i]}</small>}</td>)}
                  <td><b>{sumaYo}</b></td>
                </tr>,
                <tr key={`${n}r`} className="fila-pasada rival">
                  {(r.rival || columnas.map(() => '')).map((v, i) => <td key={i}>{v || '—'} {r.puntos.rival[i] != null && <small className="pts">{r.puntos.rival[i]}</small>}</td>)}
                  <td><b>{sumaRival}</b></td>
                </tr>,
              ];
            })}
          </tbody>
        </table>
        <p className="ayuda">En cada ronda, la primera línea son tus respuestas y la segunda las de {ctx.nombreRival}. Tab o Enter pasa a la casilla siguiente.</p>
      </div>

      {partida.fase === 'puntuando' && partida.estado === 'jugando' && <Puntuar partida={partida} ronda={actual} accion={accion} ctx={ctx} />}
    </div>
  );
}

JuegoTuti.textoFinal = (p) => `Terminó ${p.totales.yo} a ${p.totales.rival}.`;

// Suena cuando sale una letra nueva.
JuegoTuti.claveTurno = (p) => (p.estado === 'jugando' && p.fase === 'escribiendo' ? `t-${p.numero}` : null);
