import { useEffect, useRef, useState } from 'react';
import { Icono } from '../../iconos.jsx';
import { Cartel, Confeti, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

// Posiciones de los puntos en una grilla de 3x3 (0..8).
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

const DURA = 950; // ms que tarda un dado en caer
const RETRASO = 70; // cada dado sale un poquito después del anterior

function Dado({ valor, guardado, rodando, orden = 0, onClick, disabled }) {
  // Mientras rueda va mostrando caras al azar hasta que cae en la que salió.
  const [cara, setCara] = useState(null);
  useEffect(() => {
    if (!rodando) return;
    const iv = setInterval(() => setCara(1 + Math.floor(Math.random() * 6)), 80);
    const t = setTimeout(() => { clearInterval(iv); setCara(null); }, DURA * 0.7 + orden * RETRASO);
    return () => { clearInterval(iv); clearTimeout(t); setCara(null); };
  }, [rodando, orden]);
  const v = cara ?? valor;
  return (
    <button
      type="button"
      className={`dado ${guardado ? 'guardado' : ''} ${rodando ? 'rodando' : ''}`}
      style={rodando ? { '--ret': `${orden * RETRASO}ms`, '--dur': `${DURA}ms` } : undefined}
      onClick={onClick}
      disabled={disabled}
      aria-label={valor ? `Dado ${valor}${guardado ? ', guardado' : ''}` : 'Dado sin tirar'}
    >
      {Array.from({ length: 9 }, (_, i) => <i key={i} className={v && PIPS[v].includes(i) ? 'pip' : ''} />)}
    </button>
  );
}

export default function JuegoGenerala({ partida, accion, ctx }) {
  const miTurno = partida.estado === 'jugando' && partida.turno === ctx.yo;
  const [guardar, setGuardar] = useState([false, false, false, false, false]);
  const [rodando, setRodando] = useState(false);

  // Turno nuevo: nada guardado.
  useEffect(() => {
    if (partida.tiros === 0) setGuardar([false, false, false, false, false]);
  }, [partida.tiros, partida.turno]);

  // Cada tiro: los dados ruedan por la mesa (con ruido de cubilete) y, al caer, si salió algo bueno, se canta.
  const [combo, setCombo] = useState(null);
  const firma = `${partida.turno}-${partida.tiros}-${partida.dados.join('')}`;
  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current) { montado.current = true; return; } // al recargar no se vuelve a tirar
    if (partida.tiros === 0) return;
    setRodando(true);
    setCombo(null);
    efectoSonido.dados();
    const sueltos = partida.guardados.filter((g) => !g).length;
    const t = setTimeout(() => {
      setRodando(false);
      const c = cantarJugada(partida.dados, partida.tiros === 1);
      if (!c) return;
      if (c.tipo === 'generala') efectoSonido.fanfarria();
      setCombo({ ...c, id: Date.now() });
    }, DURA + sueltos * RETRASO);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma]);
  useEffect(() => {
    if (!combo) return;
    const t = setTimeout(() => setCombo(null), combo.tipo === 'generala' ? 3600 : 2200);
    return () => clearTimeout(t);
  }, [combo]);

  // La casilla recién anotada se ilumina.
  const u0 = partida.ultimaAnotacion;
  const anotadas = Object.keys(partida.planillas.yo).length + Object.keys(partida.planillas.rival).length;
  const recien = useEfecto(u0 ? `${anotadas}` : null, () => ({ ...u0 }), 1300);
  const esRecien = (cat, quien) => recien && recien.categoria === cat.nombre && (recien.por === ctx.yo) === (quien === 'yo');

  const puedeGuardar = miTurno && partida.tiros > 0 && partida.tiros < 3;
  const mios = partida.planillas.yo;
  const suyos = partida.planillas.rival;
  const u = partida.ultimaAnotacion;

  return (
    <div className="generala">
      {combo && (
        <>
          <Cartel key={combo.id} tipo={combo.tipo === 'generala' ? 'generala' : ''} texto={combo.texto} sub={combo.sub} />
          {combo.tipo === 'generala' && <Confeti key={`c${combo.id}`} />}
        </>
      )}
      <div className="marcador">
        <span>Vos <b>{partida.totales.yo}</b></span>
        <span className="ronda">{miTurno ? '¡Tu turno!' : `Turno de ${ctx.nombreRival}`}</span>
        <span><b>{partida.totales.rival}</b> {ctx.nombreRival}</span>
      </div>
      {u && (
        <div className="estado-cinta">
          <small>
            {u.por === ctx.yo ? 'Anotaste' : `${ctx.nombreRival} anotó`} {u.puntos ? `${u.puntos} en ${u.categoria}` : `0 (tachó ${u.categoria})`}
            {u.servido ? ' · ¡servido!' : ''}
          </small>
        </div>
      )}

      <div className="generala-grid">
        <div className={`mesa-dados tarjeta ${miTurno ? 'activo' : ''}`}>
          <div className={`dados ${combo ? 'combo' : ''}`}>
            {partida.dados.map((d, i) => (
              <Dado
                orden={partida.guardados.slice(0, i).filter((g) => !g).length}
                key={i}
                valor={d}
                guardado={(puedeGuardar && guardar[i]) || (!miTurno && partida.guardados[i])}
                rodando={rodando && !(partida.guardados[i])}
                disabled={!puedeGuardar}
                onClick={() => setGuardar((actual) => actual.map((g, k) => (k === i ? !g : g)))}
              />
            ))}
          </div>
          <div className="tiros">{[1, 2, 3].map((n) => <span key={n} className={n <= partida.tiros ? 'usado' : ''} />)}</div>
          {miTurno ? (
            <>
              <button className="btn grande" disabled={partida.tiros >= 3 || (partida.tiros > 0 && guardar.every(Boolean))} onClick={() => accion('tirar', { guardar })}>
                <span className="con-iconos">{partida.tiros < 3 && <Icono id="dado" tam={22} />}{partida.tiros === 0 ? 'Tirar' : partida.tiros < 3 ? `Volver a tirar (${3 - partida.tiros})` : 'Sin tiros: anotá'}</span>
              </button>
              <p className="ayuda">{partida.tiros === 0 ? 'Tirá los cinco dados.' : 'Tocá los dados que querés guardar y volvé a tirar, o anotá en la planilla.'}</p>
            </>
          ) : (
            <p className="ayuda">{partida.tiros === 0 ? `${ctx.nombreRival} todavía no tiró.` : `${ctx.nombreRival} lleva ${partida.tiros} tiro${partida.tiros > 1 ? 's' : ''}.`}</p>
          )}
        </div>

        <table className="planilla tarjeta">
          <thead>
            <tr><th /><th>Vos</th><th>{ctx.nombreRival}</th></tr>
          </thead>
          <tbody>
            {partida.categorias.map((c) => {
              const usada = mios[c.id] !== undefined;
              const posible = partida.posibles?.[c.id];
              return (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td className={esRecien(c, 'yo') ? 'recien' : ''}>
                    {usada ? (
                      <span className={mios[c.id] === 0 ? 'tachada' : ''}>{mios[c.id] === 0 ? '✕' : mios[c.id]}</span>
                    ) : miTurno && partida.tiros > 0 ? (
                      <button className={`anotar ${posible ? '' : 'tachar'}`} onClick={() => accion('anotar', { categoria: c.id })}>
                        {posible ? `+${posible}` : 'tachar'}
                      </button>
                    ) : ''}
                  </td>
                  <td className={esRecien(c, 'rival') ? 'recien' : ''}>
                    {suyos[c.id] !== undefined ? (
                      <span className={suyos[c.id] === 0 ? 'tachada' : ''}>{suyos[c.id] === 0 ? '✕' : suyos[c.id]}</span>
                    ) : !miTurno && partida.tiros > 0 && partida.posibles?.[c.id] ? (
                      <small className="posible">{partida.posibles[c.id]}?</small>
                    ) : ''}
                  </td>
                </tr>
              );
            })}
            <tr className="total"><td>Total</td><td>{partida.totales.yo}</td><td>{partida.totales.rival}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Qué se canta según cómo cayeron los dados.
function cantarJugada(dados, servido) {
  if (dados.some((d) => !d)) return null;
  const cuenta = Object.values(dados.reduce((m, d) => ({ ...m, [d]: (m[d] || 0) + 1 }), {})).sort((a, b) => b - a);
  const orden = [...new Set(dados)].sort().join('');
  const sub = servido ? '¡Servida!' : undefined;
  if (cuenta[0] === 5) return { tipo: 'generala', texto: '¡GENERALA!', sub };
  if (cuenta[0] === 4) return { tipo: 'poker', texto: '¡Póker!', sub };
  if (cuenta[0] === 3 && cuenta[1] === 2) return { tipo: 'full', texto: '¡Full!', sub };
  if (['12345', '23456', '13456'].includes(orden)) return { tipo: 'escalera', texto: '¡Escalera!', sub };
  return null;
}

JuegoGenerala.textoFinal = (p, gane) =>
  p.motivoFin === 'servida' ? (gane ? '¡Generala servida!' : 'Le salió generala servida') : `Terminó ${p.totales.yo} a ${p.totales.rival}.`;

JuegoGenerala.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.turno === ctx.yo ? `g-${Object.keys(p.planillas.yo).length}` : null);
