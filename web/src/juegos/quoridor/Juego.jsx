import { useEffect, useState } from 'react';
import { Cartel, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

// Tablero en un SVG: cada casilla mide 100 con una canaleta de 20 para las paredes.
const C = 100;
const G = 22;
const paso = C + G;

export default function JuegoQuoridor({ partida, accion, ctx }) {
  const { config, mias, suyas, paredes, destinos, posibles } = partida;
  const n = config.lado;
  const miTurno = partida.estado === 'jugando' && partida.turno === ctx.yo;
  const [modo, setModo] = useState('mover'); // mover | pared
  const [ficha, setFicha] = useState(0);
  const [orient, setOrient] = useState('h');
  const [hover, setHover] = useState(null);
  const colorRival = ctx.colorRival === ctx.colorYo ? '#4fc3f7' : ctx.colorRival;
  useEffect(() => {
    // Si la ficha elegida ya llegó, se pasa a la siguiente.
    if (mias[ficha]?.llego) setFicha(mias.findIndex((x) => !x.llego));
  }, [mias, ficha]);
  useEffect(() => {
    const tecla = (e) => { if ((e.key === 'r' || e.key === 'R') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') setOrient((o) => (o === 'h' ? 'v' : 'h')); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  const u = partida.ultima;
  const fx = useEfecto(u ? `q${u.n}` : null, () => {
    if (u.tipo === 'pared') efectoSonido.dados(); else efectoSonido.carta?.();
    return u.llego ? { llego: true, por: u.por, ms: 1800 } : null;
  });

  const libres = new Set(posibles);
  const mis = (destinos[ficha] || []).map(([f, c]) => `${f},${c}`);
  const total = n * paso - G;
  const paredSvg = (k, clase) => {
    const [t, f, c] = k.split(':').map((x, i) => (i ? Number(x) : x));
    const x = c * paso;
    const y = f * paso;
    return t === 'h'
      ? <rect key={`${clase}${k}`} className={`qd-pared ${clase}`} x={x} y={y + C + 2} width={C * 2 + G} height={G - 4} rx="6" />
      : <rect key={`${clase}${k}`} className={`qd-pared ${clase}`} x={x + C + 2} y={y} width={G - 4} height={C * 2 + G} rx="6" />;
  };

  return (
    <div className="quoridor" style={{ '--yo': ctx.colorYo, '--rival': colorRival }}>
      {fx?.llego && <Cartel key={fx.id} tipo={fx.por === 'yo' ? 'oro' : 'hundido'} texto="¡CRUZÓ!" sub={fx.por === 'yo' ? 'Una ficha tuya llegó al otro lado' : `Llegó una ficha de ${ctx.nombreRival}`} />}
      <div className="marcador">
        <span>Vos <b>{partida.quedan.yo}</b> <small>paredes</small></span>
        <span className="ronda">{config.fichas === 1 ? 'Llegá al otro lado' : `Cruzá tus ${config.fichas} fichas`}</span>
        <span><small>paredes</small> <b>{partida.quedan.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {partida.estado !== 'jugando' ? 'Partida terminada' : miTurno ? (modo === 'mover' ? '¡Te toca! Mové una ficha o poné una pared' : 'Elegí dónde va la pared') : `Juega ${ctx.nombreRival}…`}
        <small>Vos salís de abajo y vas para arriba. Las paredes tapan dos casillas y nunca pueden encerrar a nadie.</small>
      </div>
      <div className="qd-zona">
        <svg viewBox={`-10 -10 ${total + 20} ${total + 20}`} className={`qd-tablero ${miTurno ? 'activo' : ''}`} onMouseLeave={() => setHover(null)}>
          <rect x="-10" y="-10" width={total + 20} height={total + 20} rx="18" className="qd-fondo" />
          <rect x="-10" y="-10" width={total + 20} height="8" className="qd-meta yo" />
          <rect x="-10" y={total + 2} width={total + 20} height="8" className="qd-meta rival" />
          {Array.from({ length: n }, (_, f) => Array.from({ length: n }, (_, c) => {
            const puede = miTurno && modo === 'mover' && mis.includes(`${f},${c}`);
            return (
              <rect
                key={`${f},${c}`}
                x={c * paso}
                y={f * paso}
                width={C}
                height={C}
                rx="12"
                className={`qd-casilla ${puede ? 'destino' : ''} ${u?.hasta && u.hasta[0] === f && u.hasta[1] === c ? 'ultima' : ''}`}
                onClick={puede ? () => accion('mover', { ficha, fila: f, col: c }) : undefined}
              />
            );
          }))}
          {paredes.map((k) => paredSvg(k, u?.pared === k ? 'puesta nueva' : 'puesta'))}
          {miTurno && modo === 'pared' && hover && libres.has(hover) && paredSvg(hover, 'fantasma')}
          {miTurno && modo === 'pared' && Array.from({ length: n - 1 }, (_, f) => Array.from({ length: n - 1 }, (_, c) => {
            const k = `${orient}:${f}:${c}`;
            return (
              <rect
                key={`z${f},${c}`}
                className="qd-zona-pared"
                x={c * paso + C / 2}
                y={f * paso + C / 2}
                width={paso}
                height={paso}
                onMouseEnter={() => setHover(k)}
                onClick={() => { if (libres.has(k)) accion('pared', { tipo: orient, fila: f, col: c }); }}
              />
            );
          }))}
          {suyas.map((x, i) => !x.llego && <circle key={`r${i}`} cx={x.c * paso + C / 2} cy={x.f * paso + C / 2} r="34" className="qd-ficha rival" />)}
          {mias.map((x, i) => !x.llego && (
            <g key={`y${i}`} onClick={miTurno && modo === 'mover' ? () => setFicha(i) : undefined} className={`qd-ficha-g ${miTurno && i === ficha && modo === 'mover' ? 'elegida' : ''}`}>
              <circle cx={x.c * paso + C / 2} cy={x.f * paso + C / 2} r="34" className="qd-ficha yo" />
            </g>
          ))}
        </svg>
        <div className="qd-panel">
          <div className="opciones">
            <button type="button" className={`opcion ${modo === 'mover' ? 'activa' : ''}`} disabled={!miTurno} onClick={() => setModo('mover')}><b>Mover ficha</b></button>
            <button type="button" className={`opcion ${modo === 'pared' ? 'activa' : ''}`} disabled={!miTurno || !partida.quedan.yo} onClick={() => setModo('pared')}><b>Poner pared</b><small>Te quedan {partida.quedan.yo}</small></button>
          </div>
          {modo === 'pared' && (
            <button type="button" className="btn fantasma" onClick={() => setOrient(orient === 'h' ? 'v' : 'h')}>
              ↻ Girar ({orient === 'h' ? 'acostada' : 'parada'}) · tecla R
            </button>
          )}
          {config.fichas > 1 && (
            <p className="ayuda">Llegaron: vos {mias.filter((x) => x.llego).length} de {config.fichas} · {ctx.nombreRival} {suyas.filter((x) => x.llego).length} de {config.fichas}. Tocá una ficha tuya para elegirla.</p>
          )}
        </div>
      </div>
    </div>
  );
}

JuegoQuoridor.textoFinal = (p, gane) => (gane ? '¡Cruzaste al otro lado!' : 'El otro cruzó primero.');
JuegoQuoridor.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.turno === ctx.yo ? `qd-${p.ultima?.n ?? 0}` : null);
