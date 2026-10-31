import { useEffect, useMemo, useState } from 'react';
import { Cartel, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';
import { Pieza, NOMBRE_PIEZA } from './Piezas.jsx';

const COLUMNAS = 'abcdefgh';
const MOTIVO = { mate: '¡Jaque mate!', ahogado: 'Ahogado: tablas', material: 'Tablas por material insuficiente', '50 movidas': 'Tablas por 50 movidas', tablas: 'Tablas de común acuerdo', tiempo: 'Se terminó el tiempo', abandono: 'Abandono' };
const reloj = (ms) => {
  if (ms == null) return '';
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Cuenta regresiva local a partir de lo que mandó el server.
function useReloj(r) {
  const recibido = useMemo(() => Date.now(), [r]);
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    if (!r?.corre) return;
    const t = setInterval(() => setAhora(Date.now()), 200);
    return () => clearInterval(t);
  }, [r]);
  if (!r) return null;
  const pasado = Math.max(0, ahora - recibido);
  return { yo: r.corre === 'yo' ? Math.max(0, r.yo - pasado) : r.yo, rival: r.corre === 'rival' ? Math.max(0, r.rival - pasado) : r.rival, corre: r.corre };
}

export default function JuegoAjedrez({ partida, accion, ctx }) {
  const p = partida;
  const [sel, setSel] = useState(null); // [f, c] de la pieza elegida
  const [coronar, setCoronar] = useState(null); // { de, a } esperando elegir pieza
  const miTurno = p.turno === 'yo';
  const negras = p.miColor === 'n';
  const r = useReloj(p.reloj);

  useEffect(() => { setSel(null); setCoronar(null); }, [p.jugadas.length]);

  const jugada = useEfecto(p.ultima ? `${p.jugadas.length}` : null, () => {
    if (p.ultima.comio) efectoSonido.explosion?.(); else efectoSonido.carta?.();
    return p.ultima.jaque ? { jaque: true } : null;
  }, 1200);

  const destinos = sel ? p.legales.filter((m) => m.de[0] === sel[0] && m.de[1] === sel[1]) : [];
  const esDestino = (f, c) => destinos.some((m) => m.a[0] === f && m.a[1] === c);
  const mio = (pz) => pz && pz[0] === p.miColor;

  const tocar = (f, c) => {
    if (!miTurno) return;
    const pz = p.tablero[f][c];
    if (sel && esDestino(f, c)) {
      const opciones = destinos.filter((m) => m.a[0] === f && m.a[1] === c);
      if (opciones.some((m) => m.promo)) return setCoronar({ de: sel, a: [f, c] });
      accion('mover', { de: sel, a: [f, c] });
      setSel(null);
      return;
    }
    if (mio(pz) && p.legales.some((m) => m.de[0] === f && m.de[1] === c)) setSel(sel && sel[0] === f && sel[1] === c ? null : [f, c]);
    else setSel(null);
  };

  // El tablero se da vuelta para las negras.
  const orden = [0, 1, 2, 3, 4, 5, 6, 7];
  const filas = negras ? [...orden].reverse() : orden;
  const cols = negras ? [...orden].reverse() : orden;
  const reyEnJaque = p.jaque && miTurno ? p.miColor : p.jaque ? (p.miColor === 'b' ? 'n' : 'b') : null;

  let estado;
  if (p.estado === 'terminada') estado = MOTIVO[p.motivoFin] || 'Fin';
  else if (miTurno) estado = p.jaque ? '¡Estás en jaque! Te toca' : '¡Te toca!';
  else estado = `Juega ${ctx.nombreRival}…`;

  const Capturadas = ({ lista, color }) => (
    <span className="aj-capturadas">{[...lista].sort().map((t, i) => <Pieza key={i} pieza={`${color}${t}`} />)}</span>
  );
  const rivalColor = negras ? 'b' : 'n';

  return (
    <div className="ajedrez">
      {jugada?.jaque && <Cartel key={jugada.id} texto="¡Jaque!" tipo="hundido" />}
      <div className="marcador">
        <span>Vos ({negras ? 'negras' : 'blancas'}) {r && <b className={`aj-reloj ${r.corre === 'yo' ? 'corre' : ''} ${r.yo < 20000 ? 'poco' : ''}`}>{reloj(r.yo)}</b>}</span>
        <span className="ronda">Movida {Math.floor(p.jugadas.length / 2) + 1}</span>
        <span>{r && <b className={`aj-reloj ${r.corre === 'rival' ? 'corre' : ''} ${r.rival < 20000 ? 'poco' : ''}`}>{reloj(r.rival)}</b>} {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {estado}
        {p.ofertaTablas === 'rival' && p.estado === 'jugando' && (
          <span className="aj-tablas">{ctx.nombreRival} ofrece tablas
            <button className="btn chico" onClick={() => accion('responderTablas', { acepta: true })}>Aceptar</button>
            <button className="btn chico fantasma" onClick={() => accion('responderTablas', { acepta: false })}>No</button>
          </span>
        )}
      </div>
      <div className="aj-zona">
        <div className="aj-lado"><Capturadas lista={p.capturadas.yo} color={p.miColor} /></div>
        <div className={`aj-tablero ${miTurno ? 'activo' : ''}`}>
          {filas.map((f) => cols.map((c) => {
            const pz = p.tablero[f][c];
            const clara = (f + c) % 2 === 0;
            const ult = p.ultima && ((p.ultima.de[0] === f && p.ultima.de[1] === c) || (p.ultima.a[0] === f && p.ultima.a[1] === c));
            const elegida = sel && sel[0] === f && sel[1] === c;
            const destino = esDestino(f, c);
            const jaque = pz && reyEnJaque && pz === `${reyEnJaque}K`;
            return (
              <button
                key={`${f}${c}`}
                type="button"
                className={`aj-casilla ${clara ? 'clara' : 'oscura'} ${ult ? 'ultima' : ''} ${elegida ? 'elegida' : ''} ${destino ? (pz ? 'come' : 'destino') : ''} ${jaque ? 'jaque' : ''}`}
                onClick={() => tocar(f, c)}
                aria-label={`${COLUMNAS[c]}${8 - f}${pz ? ` ${NOMBRE_PIEZA[pz[1]]}` : ''}`}
              >
                {pz && <Pieza pieza={pz} className={p.ultima && p.ultima.a[0] === f && p.ultima.a[1] === c ? 'recien' : ''} />}
                {c === cols[0] && <span className="aj-coord fila">{8 - f}</span>}
                {f === filas[7] && <span className="aj-coord col">{COLUMNAS[c]}</span>}
              </button>
            );
          }))}
          {coronar && (
            <div className="aj-coronar">
              <b>Coronar como:</b>
              {['Q', 'R', 'B', 'N'].map((t) => (
                <button key={t} type="button" className="btn fantasma" onClick={() => { accion('mover', { ...coronar, promo: t }); setCoronar(null); setSel(null); }} aria-label={NOMBRE_PIEZA[t]}>
                  <Pieza pieza={`${p.miColor}${t}`} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="aj-lado"><Capturadas lista={p.capturadas.rival} color={rivalColor} /></div>
      </div>
      <div className="acciones centro">
        {p.estado === 'jugando' && p.ofertaTablas !== 'yo' && <button className="btn chico fantasma" onClick={() => accion('ofrecerTablas')}>Ofrecer tablas</button>}
        {p.ofertaTablas === 'yo' && <span className="ayuda">Ofreciste tablas…</span>}
      </div>
      {p.jugadas.length > 0 && (
        <ol className="aj-jugadas">
          {p.jugadas.reduce((filasJ, j, i) => (i % 2 === 0 ? [...filasJ, [j]] : (filasJ[filasJ.length - 1].push(j), filasJ)), []).map((par, i) => (
            <li key={i}>{par[0]} {par[1] || ''}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

JuegoAjedrez.textoFinal = (p) => MOTIVO[p.motivoFin] || '';
JuegoAjedrez.claveTurno = (p) => (p.turno === 'yo' ? `aj-${p.jugadas.length}` : null);
