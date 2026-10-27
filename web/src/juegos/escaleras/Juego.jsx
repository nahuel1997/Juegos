import { useEffect, useRef, useState } from 'react';
import { Cartel, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

const PUNTOS = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[25, 25], [50, 50], [75, 75]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]], 6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]] };
export function DadoSvg({ valor, rodando, chico }) {
  const [cara, setCara] = useState(valor || 1);
  useEffect(() => {
    if (!rodando) { setCara(valor || 1); return undefined; }
    const t = setInterval(() => setCara(1 + Math.floor(Math.random() * 6)), 80);
    return () => clearInterval(t);
  }, [rodando, valor]);
  return (
    <svg viewBox="0 0 100 100" className={`dado-svg ${rodando ? 'rodando' : ''} ${chico ? 'chico' : ''}`} aria-label={`Dado: ${valor}`}>
      <rect x="4" y="4" width="92" height="92" rx="18" />
      {PUNTOS[cara].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" />)}
    </svg>
  );
}

// Número de casilla -> fila/columna en pantalla (la 1 abajo a la izquierda, en zigzag).
function lugar(n, lado) {
  const i = n - 1;
  const filaDesdeAbajo = Math.floor(i / lado);
  let col = i % lado;
  if (filaDesdeAbajo % 2 === 1) col = lado - 1 - col;
  return { fila: lado - 1 - filaDesdeAbajo, col };
}
const centro = (n, lado) => {
  const { fila, col } = lugar(n, lado);
  return [(col + 0.5) * 100, (fila + 0.5) * 100];
};

function Escalera({ desde, hasta, lado }) {
  const [x1, y1] = centro(desde, lado);
  const [x2, y2] = centro(hasta, lado);
  const largo = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const pasos = Math.max(2, Math.floor(largo / 34));
  return (
    <g className="es-escalera" transform={`translate(${x1} ${y1}) rotate(${ang})`}>
      <line x1="0" y1="-14" x2={largo} y2="-14" />
      <line x1="0" y1="14" x2={largo} y2="14" />
      {Array.from({ length: pasos }, (_, i) => <line key={i} className="peldano" x1={(largo * (i + 0.5)) / pasos} y1="-14" x2={(largo * (i + 0.5)) / pasos} y2="14" />)}
    </g>
  );
}

function Serpiente({ desde, hasta, lado, tono }) {
  const [x1, y1] = centro(desde, lado);
  const [x2, y2] = centro(hasta, lado);
  const largo = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const ondas = Math.max(2, Math.round(largo / 90));
  let d = 'M 0 0';
  for (let i = 0; i < ondas; i++) {
    const a = (largo * i) / ondas;
    const b = (largo * (i + 1)) / ondas;
    d += ` C ${a + (b - a) / 3} ${i % 2 ? 26 : -26} ${a + (2 * (b - a)) / 3} ${i % 2 ? 26 : -26} ${b} 0`;
  }
  return (
    <g className="es-serpiente" transform={`translate(${x1} ${y1}) rotate(${ang})`} style={{ '--tono': tono }}>
      <path d={d} className="cuerpo" />
      <path d={d} className="manchas" />
      <ellipse cx="0" cy="0" rx="20" ry="15" className="cabeza" />
      <circle cx="-4" cy="-7" r="3.5" className="ojo" />
      <circle cx="-4" cy="7" r="3.5" className="ojo" />
      <path d="M -20 0 L -32 -5 M -20 0 L -32 5" className="lengua" />
    </g>
  );
}

const TONOS = ['#43a047', '#8e24aa', '#fb8c00', '#00897b', '#e53935', '#3949ab'];

export default function JuegoEscaleras({ partida, accion, ctx }) {
  const { config, saltos, ultima } = partida;
  const lado = Math.sqrt(config.casillas);
  const miTurno = partida.estado === 'jugando' && partida.turno === ctx.yo;
  const colorRival = ctx.colorRival === ctx.colorYo ? '#4fc3f7' : ctx.colorRival;

  // Las fichas avanzan casillero por casillero (y después suben o bajan).
  const [vista, setVista] = useState(partida.pos);
  const [rodando, setRodando] = useState(false);
  const vistos = useRef(ultima?.n ?? 0);
  useEffect(() => {
    if (!ultima || ultima.n === vistos.current) { if (!ultima) setVista(partida.pos); return undefined; }
    vistos.current = ultima.n;
    const quien = ultima.por;
    const camino = [];
    const ida = ultima.rebote ? config.casillas : ultima.paso;
    for (let x = ultima.desde + 1; x <= ida; x++) camino.push(x);
    if (ultima.rebote) for (let x = config.casillas - 1; x >= ultima.paso; x--) camino.push(x);
    if (ultima.via) camino.push(ultima.hasta);
    setRodando(true);
    efectoSonido.dados();
    const timers = [];
    timers.push(setTimeout(() => setRodando(false), 600));
    camino.forEach((x, i) => timers.push(setTimeout(() => {
      setVista((v) => ({ ...v, [quien]: x }));
      if (i === camino.length - 1 && ultima.via) (ultima.via === 'escalera' ? efectoSonido.fanfarria : () => efectoSonido.explosion(false))();
    }, 700 + i * 160 + (ultima.via && i === camino.length - 1 ? 250 : 0))));
    timers.push(setTimeout(() => setVista(partida.pos), 900 + camino.length * 160 + 300));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultima?.n]);

  const fx = useEfecto(ultima?.via ? `v${ultima.n}` : null, () => ({ via: ultima.via, por: ultima.por, ms: 2400 }), 2400);

  const ficha = (quien) => {
    const n = vista[quien];
    if (!n) return null;
    const { fila, col } = lugar(n, lado);
    const juntas = vista.yo === vista.rival;
    return (
      <span
        className={`es-ficha ${quien}`}
        style={{ left: `${(col / lado) * 100}%`, top: `${(fila / lado) * 100}%`, width: `${100 / lado}%`, height: `${100 / lado}%`, '--corre': juntas ? (quien === 'yo' ? '-18%' : '18%') : '0%' }}
      >
        <i />
      </span>
    );
  };

  return (
    <div className="escaleras" style={{ '--yo': ctx.colorYo, '--rival': colorRival }}>
      {fx && <Cartel key={fx.id} retraso={0.9} tipo={fx.via === 'escalera' ? 'oro' : 'hundido'} texto={fx.via === 'escalera' ? '¡ESCALERA!' : '¡SERPIENTE!'} sub={`${fx.por === 'yo' ? 'Vos' : ctx.nombreRival} ${fx.via === 'escalera' ? 'sube' : 'baja'}`} />}
      <div className="marcador">
        <span>Vos <b>{partida.pos.yo || '–'}</b></span>
        <span className="ronda">Meta: {config.casillas}{config.exacto ? ' (justo)' : ''}</span>
        <span><b>{partida.pos.rival || '–'}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {partida.estado !== 'jugando' ? 'Partida terminada' : miTurno ? '¡Te toca! Tirá el dado' : `Juega ${ctx.nombreRival}…`}
        {ultima && <small>{ultima.por === 'yo' ? 'Sacaste' : `${ctx.nombreRival} sacó`} {ultima.dado}{ultima.rebote ? ' y rebotó' : ''}{ultima.via === 'escalera' ? ` · subió de la ${ultima.paso} a la ${ultima.hasta}` : ultima.via === 'serpiente' ? ` · bajó de la ${ultima.paso} a la ${ultima.hasta}` : ''}{ultima.dado === 6 && config.seisRepite && partida.estado === 'jugando' ? ' · ¡6: tira de nuevo!' : ''}</small>}
      </div>
      <div className="es-zona">
        <div className="es-tablero" style={{ '--lado': lado }}>
          {Array.from({ length: config.casillas }, (_, i) => {
            const n = config.casillas - i;
            const { fila, col } = lugar(n, lado);
            return (
              <span key={n} className={`es-casilla ${(fila + col) % 2 ? 'b' : 'a'} ${n === config.casillas ? 'meta' : ''}`} style={{ gridRow: fila + 1, gridColumn: col + 1 }}>
                <small>{n}</small>
              </span>
            );
          })}
          <svg className="es-capa" viewBox={`0 0 ${lado * 100} ${lado * 100}`} preserveAspectRatio="none">
            {Object.entries(saltos).filter(([, s]) => s.tipo === 'escalera').map(([a, s]) => <Escalera key={a} desde={Number(a)} hasta={s.hasta} lado={lado} />)}
            {Object.entries(saltos).filter(([, s]) => s.tipo === 'serpiente').map(([a, s], i) => <Serpiente key={a} desde={Number(a)} hasta={s.hasta} lado={lado} tono={TONOS[i % TONOS.length]} />)}
          </svg>
          {ficha('rival')}
          {ficha('yo')}
        </div>
        <div className="es-panel">
          <DadoSvg valor={ultima?.dado} rodando={rodando} />
          <button className="btn grande" disabled={!miTurno} onClick={() => accion('tirar')}>Tirar el dado</button>
          <p className="ayuda"><span className="ficha-mini yo" /> vos · <span className="ficha-mini rival" /> {ctx.nombreRival}</p>
        </div>
      </div>
    </div>
  );
}

JuegoEscaleras.textoFinal = (p, gane) => (gane ? `¡Llegaste primero a la ${p.config.casillas}!` : 'Llegó primero el otro.');
JuegoEscaleras.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.turno === ctx.yo ? `es-${p.ultima?.n ?? 0}` : null);
