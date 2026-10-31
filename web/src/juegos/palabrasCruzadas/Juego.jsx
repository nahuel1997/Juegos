import { useEffect, useMemo, useState } from 'react';
import { MarcadorN, useFalta } from '../../componentes/comunes.jsx';
import { useEfecto, Cartel } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';
import { PREMIOS, LETRAS, evaluarJugada } from '../../../../api/src/juegos/palabrasCruzadas.js';

const ROTULO = { P3: 'x3 palabra', P2: 'x2 palabra', L3: 'x3 letra', L2: 'x2 letra' };
const CORTO = { P3: '3P', P2: '2P', L3: '3L', L2: '2L' };

function Ficha({ l, v, comodin, chica }) {
  return (
    <span className={`pc-ficha ${comodin ? 'comodin' : ''} ${chica ? 'chica' : ''}`}>
      <b>{l || ' '}</b>
      {!comodin && v > 0 && <small>{v}</small>}
    </span>
  );
}

export default function JuegoPalabrasCruzadas({ partida, accion, ctx }) {
  const p = partida;
  const miTurno = p.estado === 'jugando' && p.fase === 'turno' && p.turno === ctx.yo;
  const [colocadas, setColocadas] = useState([]); // [{ id, f, c, l }]
  const [elegida, setElegida] = useState(null);
  const [orden, setOrden] = useState([]);
  const [cambio, setCambio] = useState(null); // Set de ids para cambiar
  const [comodin, setComodin] = useState(null); // { id, f, c } esperando la letra
  const falta = useFalta(p.faltaMs, `${p.fase}-${p.turno}-${p.log.length}`);
  const seg = falta == null ? null : Math.ceil(falta / 1000);

  // Si cambia el turno o el tablero, lo que tenía puesto vuelve al atril.
  useEffect(() => { setColocadas([]); setElegida(null); setCambio(null); }, [p.turno, p.log.length]);
  // Orden del atril (se puede mezclar): conserva el orden de las que siguen y suma las nuevas.
  useEffect(() => {
    setOrden((o) => [...o.filter((id) => p.atril.some((x) => x.id === id)), ...p.atril.map((x) => x.id).filter((id) => !o.includes(id))]);
  }, [p.atril]);

  const usadas = new Set(colocadas.map((x) => x.id));
  const atril = orden.map((id) => p.atril.find((x) => x.id === id)).filter((x) => x && !usadas.has(x.id));
  const enCelda = new Map(colocadas.map((x) => [`${x.f},${x.c}`, x]));
  const valorDe = (id) => p.atril.find((x) => x.id === id)?.v ?? 0;

  const vista = useMemo(() => {
    if (!colocadas.length) return null;
    try {
      const ev = evaluarJugada(p.tablero.map((fila) => fila.map((x) => (x && !x.pend ? x : null))), colocadas.map((x) => ({ ...x, v: valorDe(x.id) })));
      return { ok: true, texto: `${ev.palabras.map((w) => w.texto).join(', ')} · vale ${ev.total}${ev.bingo ? ' (¡con las 7!)' : ''}` };
    } catch (e) {
      return { ok: false, texto: e.message };
    }
  }, [colocadas, p.tablero]); // eslint-disable-line react-hooks/exhaustive-deps

  const tocarCelda = (f, c) => {
    if (!miTurno || cambio) return;
    const k = `${f},${c}`;
    if (enCelda.has(k)) { setColocadas(colocadas.filter((x) => `${x.f},${x.c}` !== k)); return; }
    if (p.tablero[f][c] || elegida == null) return;
    const ficha = p.atril.find((x) => x.id === elegida);
    if (!ficha) return;
    if (!ficha.l) { setComodin({ id: ficha.id, f, c }); return; }
    setColocadas([...colocadas, { id: ficha.id, f, c, l: ficha.l }]);
    setElegida(null);
  };
  const ponerComodin = (l) => {
    setColocadas([...colocadas, { ...comodin, l }]);
    setComodin(null);
    setElegida(null);
  };
  const jugar = async () => {
    const r = await accion('jugar', { fichas: colocadas });
    if (!r?.error) setColocadas([]);
  };
  const mezclar = () => setOrden((o) => [...o].sort(() => Math.random() - 0.5));
  const nombres = (t) => t.replace(/@([^@]+)@/g, (_, id) => ctx.nombreDe(id));

  const pend = p.pendiente;
  const yoReviso = pend && pend.j !== ctx.yo && !pend.votos[ctx.yo] && p.fase === 'revision';
  const nueva = useMemo(() => new Set((p.ultima?.casillas || []).map(([f, c]) => `${f},${c}`)), [p.ultima]);
  const fin = useEfecto(p.ultima ? `pc-${p.log.length}` : null, () => {
    if (p.ultima.bingo) efectoSonido.fanfarria?.();
    return { ...p.ultima };
  }, 1800);

  let estado;
  if (p.fase === 'revision') estado = pend.j === ctx.yo ? 'Los demás están revisando tu jugada…' : `Revisá la jugada de ${ctx.nombreDe(pend.j)}`;
  else if (miTurno) estado = cambio ? 'Tocá las fichas que querés cambiar' : '¡Te toca! Tocá una ficha y después la casilla';
  else estado = `Juega ${ctx.nombreDe(p.turno)}…`;

  return (
    <div className="pc">
      {fin && fin.bingo > 0 && <Cartel key={fin.id} texto="¡LAS 7 FICHAS!" sub={`+50 para ${ctx.nombreDe(fin.j)}`} tipo="oro" />}
      <MarcadorN jugadores={p.jugadores} puntos={p.puntos} ctx={ctx} fuera={p.fuera} extra={`Bolsa: ${p.bolsa} fichas`} />
      <div className={`estado-cinta ${miTurno || yoReviso ? 'tu-turno' : ''}`}>
        {estado}
        <small>{seg != null ? `${seg} s · ` : ''}{p.log.length ? nombres(p.log[p.log.length - 1]) : 'La primera palabra pasa por la estrella del centro.'}</small>
      </div>

      {pend && p.fase === 'revision' && (
        <div className="tarjeta pc-revision">
          <div className="pc-palabras">
            {pend.palabras.map((w, i) => (
              <span key={i} className="pc-palabra">{w.texto} <small>+{w.puntos}</small>{w.conocida && <em title="Está en la lista de palabras de la app"> ✓</em>}</span>
            ))}
            {pend.bingo > 0 && <span className="pc-palabra">+50 por las 7</span>}
          </div>
          {pend.j === ctx.yo ? (
            <p className="sub">Si nadie dice “¡No vale!”, en {seg ?? '…'} s se confirma.</p>
          ) : pend.votos[ctx.yo] ? (
            <p className="sub">Dijiste que vale. Esperando a los demás…</p>
          ) : (
            <div className="acciones">
              <button className="btn" onClick={() => accion('aceptar')}>Vale ({seg ?? '…'} s)</button>
              <button className="btn fantasma peligro" onClick={() => accion('rechazar')}>¡No vale!</button>
            </div>
          )}
        </div>
      )}

      <div className="pc-zona">
        <div className="pc-tablero" role="grid" aria-label="Tablero">
          {PREMIOS.map((fila, f) => fila.map((premio, c) => {
            const x = p.tablero[f][c];
            const mia = enCelda.get(`${f},${c}`);
            const centro = f === 7 && c === 7;
            return (
              <button
                key={`${f}-${c}`}
                type="button"
                className={`pc-celda ${premio ? premio.toLowerCase() : ''} ${centro ? 'centro' : ''} ${x?.pend ? 'pend' : ''} ${nueva.has(`${f},${c}`) ? 'nueva' : ''} ${mia ? 'mia' : ''}`}
                onClick={() => tocarCelda(f, c)}
                title={premio ? ROTULO[premio] : undefined}
                aria-label={x ? x.l : mia ? mia.l : premio ? ROTULO[premio] : 'vacía'}
              >
                {x ? <Ficha l={x.l} v={x.v} comodin={x.comodin} chica /> : mia ? <Ficha l={mia.l} v={valorDe(mia.id)} comodin={!p.atril.find((a) => a.id === mia.id)?.l} chica /> : centro ? <span className="pc-estrella">★</span> : premio ? <span className="pc-premio">{CORTO[premio]}</span> : null}
              </button>
            );
          }))}
        </div>
      </div>

      {vista && <p className={`pc-vista ${vista.ok ? 'ok' : 'mal'}`}>{vista.texto}</p>}

      <div className="pc-atril" aria-label="Tus fichas">
        {atril.map((x) => (
          <button
            key={x.id}
            type="button"
            className={`pc-atril-ficha ${elegida === x.id ? 'elegida' : ''} ${cambio?.has(x.id) ? 'para-cambiar' : ''}`}
            onClick={() => {
              if (cambio) { const s = new Set(cambio); s.has(x.id) ? s.delete(x.id) : s.add(x.id); setCambio(s); return; }
              setElegida(elegida === x.id ? null : x.id);
            }}
            disabled={!miTurno && !!cambio}
          >
            <Ficha l={x.l} v={x.v} comodin={!x.l} />
          </button>
        ))}
      </div>

      {miTurno && (
        <div className="acciones centro pc-acciones">
          {!cambio ? (
            <>
              <button className="btn" disabled={!vista?.ok} onClick={jugar}>Jugar</button>
              <button className="btn fantasma" disabled={!colocadas.length} onClick={() => setColocadas([])}>Devolver</button>
              <button className="btn fantasma" onClick={mezclar}>Mezclar</button>
              <button className="btn fantasma" disabled={!p.bolsa} onClick={() => { setColocadas([]); setCambio(new Set()); }}>Cambiar fichas</button>
              <button className="btn fantasma" onClick={() => accion('pasar')}>Pasar</button>
            </>
          ) : (
            <>
              <button className="btn" disabled={!cambio.size} onClick={() => accion('cambiar', { ids: [...cambio] })}>Cambiar {cambio.size || ''}</button>
              <button className="btn fantasma" onClick={() => setCambio(null)}>Cancelar</button>
            </>
          )}
        </div>
      )}

      {comodin && (
        <div className="pc-comodin tarjeta" role="dialog" aria-label="Elegí la letra del comodín">
          <p>¿Qué letra es el comodín?</p>
          <div className="pc-letras">
            {LETRAS.map((l) => <button key={l} type="button" className="btn chico fantasma" onClick={() => ponerComodin(l)}>{l}</button>)}
          </div>
          <button type="button" className="btn chico fantasma" onClick={() => setComodin(null)}>Cancelar</button>
        </div>
      )}

      <ul className="pc-log">
        {p.log.slice(-6).reverse().map((t, i) => <li key={i}>{nombres(t)}</li>)}
      </ul>
    </div>
  );
}

JuegoPalabrasCruzadas.textoFinal = (p, _g, ctx) => [...p.jugadores].sort((a, b) => p.puntos[b] - p.puntos[a]).map((j) => `${ctx?.nombreDe?.(j) ?? j} ${p.puntos[j]}`).join(' · ');
JuegoPalabrasCruzadas.claveTurno = (p, ctx) => (p.estado === 'jugando' && ((p.fase === 'turno' && p.turno === ctx.yo) || (p.fase === 'revision' && p.pendiente?.j !== ctx.yo)) ? `pc-${p.log.length}-${p.fase}` : null);
