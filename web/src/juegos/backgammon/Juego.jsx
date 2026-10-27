import { useEffect, useState } from 'react';
import { DadoSvg } from '../escaleras/Juego.jsx';
import { Cartel, Confeti, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

// Arriba: 13 a 24 (izquierda a derecha); abajo: 12 a 1. Mi casa (1 a 6) queda abajo a la derecha.
const ARRIBA = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
const ABAJO = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

function Punta({ n, cant, arriba, origen, destino, onClick, ultima }) {
  const quien = cant > 0 ? 'yo' : cant < 0 ? 'rival' : null;
  const total = Math.abs(cant);
  const muestra = Math.min(total, 5);
  return (
    <button
      type="button"
      className={`bg-punta ${arriba ? 'arriba' : 'abajo'} ${n % 2 ? 'impar' : 'par'} ${origen ? 'origen' : ''} ${destino ? 'destino' : ''} ${ultima ? 'ultima' : ''}`}
      onClick={onClick}
      disabled={!onClick}
      aria-label={`Punta ${n}: ${total} ficha${total === 1 ? '' : 's'}`}
    >
      <span className="bg-triangulo" />
      <span className="bg-pila">
        {Array.from({ length: muestra }, (_, i) => (
          <span key={i} className={`bg-ficha ${quien}`}>{i === muestra - 1 && total > 5 ? total : ''}</span>
        ))}
      </span>
      <small className="bg-num">{n}</small>
    </button>
  );
}

export default function JuegoBackgammon({ partida, accion, ctx }) {
  const { tablero, legales, dados } = partida;
  const jugando = partida.estado === 'jugando' && partida.fase === 'jugando';
  const miTurno = jugando && partida.turno === ctx.yo;
  const [sel, setSel] = useState(null);
  useEffect(() => setSel(null), [partida.ultima?.n]);
  const colorRival = ctx.colorRival === ctx.colorYo ? '#4fc3f7' : ctx.colorRival;

  const origenes = new Set(legales.map((m) => m.desde));
  const destinos = new Set(legales.filter((m) => m.desde === sel).map((m) => m.hasta));
  const tocar = (p) => {
    if (!miTurno || !dados.length) return;
    if (sel !== null && destinos.has(p)) { accion('mover', { desde: sel, hasta: p }); return; }
    if (origenes.has(p)) setSel(sel === p ? null : p);
  };
  const u = partida.ultima;

  const [rodando, setRodando] = useState(false);
  const tiro = useEfecto(u?.tipo === 'tiro' ? `t${partida.mano}-${u.n}` : null, () => {
    efectoSonido.dados();
    setRodando(true);
    setTimeout(() => setRodando(false), 650);
    return u.sinMovida ? { sin: true, por: u.por, ms: 2200 } : null;
  });
  const comio = useEfecto(u?.comio ? `m${u.n}` : null, () => { efectoSonido.explosion(false); return { por: u.por, ms: 1400 }; });
  const fin = useEfecto(partida.fase === 'fin' ? `f${partida.mano}` : null, () => {
    if (partida.resumen.ganador === 'yo') efectoSonido.fanfarria();
    return { ...partida.resumen, ms: 3000 };
  });

  const punta = (n, arriba) => (
    <Punta
      key={n}
      n={n}
      cant={tablero[n]}
      arriba={arriba}
      origen={miTurno && (sel === n || (sel === null && origenes.has(n)))}
      destino={sel !== null && destinos.has(n)}
      ultima={u?.tipo === 'movio' && u.hasta === n}
      onClick={miTurno && (origenes.has(n) || destinos.has(n)) ? () => tocar(n) : undefined}
    />
  );

  let estado;
  if (partida.fase === 'fin') estado = `Fin de la mano ${partida.mano}`;
  else if (miTurno) estado = dados.length ? (sel === null ? 'Elegí una ficha para mover' : 'Elegí a dónde va') : '¡Te toca! Tirá los dados';
  else estado = `Juega ${ctx.nombreRival}…`;
  const listo = partida.listosSiguiente.includes('yo');

  return (
    <div className="bg" style={{ '--yo': ctx.colorYo, '--rival': colorRival }}>
      {tiro?.sin && <Cartel key={tiro.id} retraso={0.6} texto="Sin movida" sub={tiro.por === 'yo' ? 'No podés mover con esos dados' : `${ctx.nombreRival} no puede mover`} />}
      {comio && <Cartel key={comio.id} tipo={comio.por === 'yo' ? 'oro' : 'hundido'} texto="¡COMIDA!" sub={comio.por === 'yo' ? 'Mandaste una ficha a la barra' : 'Te comieron una ficha'} />}
      {fin && <><Cartel key={fin.id} tipo={fin.ganador === 'yo' ? 'oro' : 'hundido'} texto={fin.valor === 3 ? '¡BACKGAMMON!' : fin.valor === 2 ? '¡GAMMON!' : fin.ganador === 'yo' ? '¡Ganaste la mano!' : `Ganó ${ctx.nombreRival}`} sub={`+${fin.valor} punto${fin.valor > 1 ? 's' : ''}`} />{fin.ganador === 'yo' && <Confeti key={`c${fin.id}`} cantidad={70} />}</>}
      <div className="marcador">
        <span>Vos <b>{partida.puntos.yo}</b></span>
        <span className="ronda">Mano {partida.mano} · a {partida.config.puntos}</span>
        <span><b>{partida.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {estado}
        <small>Movés de la 24 a la 1 y sacás desde tu casa (1 a 6) · Afuera: vos {partida.fuera.yo}, {ctx.nombreRival} {partida.fuera.rival}</small>
      </div>
      <div className="bg-mesa">
        <div className="bg-tablero">
          <div className="bg-media arriba">
            {ARRIBA.slice(0, 6).map((n) => punta(n, true))}
            <span className="bg-barra">{partida.bar.rival > 0 && <span className="bg-ficha rival">{partida.bar.rival}</span>}</span>
            {ARRIBA.slice(6).map((n) => punta(n, true))}
          </div>
          <div className="bg-medio">
            <div className="bg-dados">
              {(partida.tirada || [1, 1]).map((d, i) => (
                <span key={i} className={`bg-dado ${partida.turno === ctx.yo && partida.tirada && !dados.includes(d) && !rodando ? 'usado' : ''}`}><DadoSvg valor={d} rodando={rodando} chico /></span>
              ))}
            </div>
            {miTurno && !dados.length && <button className="btn" onClick={() => accion('tirar')}>Tirar dados</button>}
            {miTurno && dados.length > 0 && <small>Quedan: {dados.join(' · ')}</small>}
          </div>
          <div className="bg-media abajo">
            {ABAJO.slice(0, 6).map((n) => punta(n, false))}
            <button
              type="button"
              className={`bg-barra ${miTurno && origenes.has('bar') ? 'origen' : ''}`}
              disabled={!(miTurno && origenes.has('bar'))}
              onClick={() => tocar('bar')}
            >
              {partida.bar.yo > 0 && <span className="bg-ficha yo">{partida.bar.yo}</span>}
            </button>
            {ABAJO.slice(6).map((n) => punta(n, false))}
          </div>
        </div>
        <button
          type="button"
          className={`bg-afuera ${sel !== null && destinos.has('fuera') ? 'destino' : ''}`}
          disabled={!(sel !== null && destinos.has('fuera'))}
          onClick={() => accion('mover', { desde: sel, hasta: 'fuera' })}
        >
          <span>Sacar</span>
          <b>{partida.fuera.yo}</b>
          <small>de 15</small>
        </button>
      </div>
      {partida.fase === 'fin' && partida.estado === 'jugando' && (
        <div className="acciones centro">
          <button className="btn" disabled={listo} onClick={() => accion('siguiente')}>{listo ? `Esperando a ${ctx.nombreRival}…` : 'Otra mano →'}</button>
        </div>
      )}
    </div>
  );
}

JuegoBackgammon.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoBackgammon.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.fase === 'jugando' && p.turno === ctx.yo && !p.dados.length ? `bg-${p.mano}-${p.ultima?.n ?? 0}` : null);
