import { useState } from 'react';
import { Carta } from '../escoba/Juego.jsx';
import { Cartel, Confeti, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

const CORTE_MAXIMO = 5;
const FIGURA = { 10: 'sota', 11: 'caballo', 12: 'rey' };
const nombre = (c) => (c.palo === 'comodin' ? 'el comodín' : `el ${FIGURA[c.numero] || c.numero} de ${c.palo}`);

// El comodín: un bufón propio en SVG.
function Comodin({ chica, seleccionada, onClick, className = '' }) {
  return (
    <button type="button" className={`carta comodin ${chica ? 'chica' : ''} ${seleccionada ? 'sel' : ''} ${className}`} onClick={onClick} disabled={!onClick} title="Comodín (vale 25 si queda suelto)">
      <svg viewBox="0 0 64 64" className="ch-bufon" aria-hidden="true">
        <path d="M14 34 L6 12 L22 24 L32 6 L42 24 L58 12 L50 34 Z" fill="#7b1fa2" stroke="#3b0a4f" strokeWidth="2" />
        <path d="M32 6 L42 24 L32 34 L22 24 Z" fill="#fbc02d" stroke="#3b0a4f" strokeWidth="2" />
        <circle cx="6" cy="12" r="4" fill="#fbc02d" stroke="#3b0a4f" strokeWidth="1.5" />
        <circle cx="32" cy="6" r="4" fill="#e53935" stroke="#3b0a4f" strokeWidth="1.5" />
        <circle cx="58" cy="12" r="4" fill="#fbc02d" stroke="#3b0a4f" strokeWidth="1.5" />
        <circle cx="32" cy="46" r="13" fill="#ffe0c2" stroke="#3b0a4f" strokeWidth="2" />
        <circle cx="27" cy="44" r="1.8" fill="#3b0a4f" />
        <circle cx="37" cy="44" r="1.8" fill="#3b0a4f" />
        <path d="M25 50 Q32 57 39 50" fill="none" stroke="#c2185b" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="12" y="32" width="40" height="6" rx="3" fill="#e53935" stroke="#3b0a4f" strokeWidth="1.5" />
      </svg>
      {!chica && <span className="fig">Comodín</span>}
    </button>
  );
}

export function CartaCh({ carta, ...props }) {
  if (carta?.palo === 'comodin') return <Comodin {...props} />;
  const { className, ...resto } = props;
  return (
    <span className={`ch-carta ${className || ''}`}>
      <Carta carta={carta && { ...carta, valor: carta.numero }} {...resto} />
    </span>
  );
}

// La mano acomodada: primero las combinaciones (cada una en su recuadro) y después las sueltas.
function ManoAcomodada({ cartas, arreglo, elegida, onElegir, nueva, pegadas = [], chica, cortes }) {
  const porId = (id) => cartas.find((c) => c.id === id);
  const carta = (c) => {
    const corte = cortes?.find((x) => x.id === c.id);
    return (
      <span key={c.id} className={`ch-lugar ${c.id === nueva ? 'nueva' : ''} ${pegadas.includes(c.id) ? 'pegada' : ''}`}>
        <CartaCh carta={c} chica={chica} seleccionada={elegida === c.id} onClick={onElegir ? () => onElegir(c.id) : undefined} />
        {corte && corte.puntos <= CORTE_MAXIMO && <small className="ch-corta">corta</small>}
      </span>
    );
  };
  return (
    <div className="ch-mano">
      {arreglo.combos.map((g, i) => (
        <div key={i} className="ch-combo">{g.map(porId).filter(Boolean).map(carta)}</div>
      ))}
      {arreglo.sueltas.length > 0 && <div className="ch-sueltas">{arreglo.sueltas.map(porId).filter(Boolean).map(carta)}</div>}
    </div>
  );
}

function Resumen({ partida, accion, ctx }) {
  const r = partida.resumen;
  const listo = partida.listosSiguiente.includes('yo');
  const quien = r.corto === 'yo' ? 'Cortaste vos' : `Cortó ${ctx.nombreRival}`;
  const lado = (titulo, m, suma) => (
    <div className="ch-lado">
      <h4>{titulo} <span className={`ch-suma ${suma < 0 ? 'menos' : ''}`}>{suma > 0 ? `+${suma}` : suma}</span></h4>
      <ManoAcomodada cartas={m.cartas.concat(partida.resumen[m === r.yo ? 'rival' : 'yo'].cartas)} arreglo={{ combos: m.combos, sueltas: m.sueltas }} pegadas={m.pegadas} chica />
    </div>
  );
  return (
    <div className="tarjeta ch-resumen">
      <h3>{r.chinchon ? '¡Chinchón!' : r.menosDiez ? `${quien}: ¡menos diez!` : quien}</h3>
      {lado('Vos', r.yo, r.suma.yo)}
      {lado(ctx.nombreRival, r.rival, r.suma.rival)}
      {(r.yo.pegadas?.length > 0 || r.rival.pegadas?.length > 0) && <p className="sub">Las cartas con borde verde se pegaron en las combinaciones del que cortó.</p>}
      {partida.estado === 'jugando' && (
        <button className="btn" disabled={listo} onClick={() => accion('siguiente')}>
          {listo ? `Esperando a ${ctx.nombreRival}…` : 'Siguiente ronda →'}
        </button>
      )}
    </div>
  );
}

export default function JuegoChinchon({ partida, accion, ctx }) {
  const jugando = partida.estado === 'jugando' && partida.fase === 'jugando';
  const miTurno = jugando && partida.turno === ctx.yo;
  const robar = miTurno && partida.paso === 'robar';
  const tirar = miTurno && partida.paso === 'tirar';
  const [elegida, setElegida] = useState(null);
  const sel = tirar ? partida.miMano.find((c) => c.id === elegida) : null;
  const corteSel = sel && partida.cortes?.find((c) => c.id === sel.id);
  const puedeCortar = partida.cortes?.some((c) => c.puntos <= CORTE_MAXIMO);

  const hacer = (tipo) => { accion(tipo, { carta: elegida }); setElegida(null); };

  const u = partida.ultima;
  const fx = useEfecto(u ? `c${partida.ronda}-${u.n}` : null, () => {
    if (u.tipo !== 'corto') return null;
    const r = partida.resumen;
    if (r?.chinchon) { efectoSonido.fanfarria(); return { tipo: 'chinchon', mio: u.por === 'yo', ms: 3200 }; }
    if (u.por === 'yo') efectoSonido.ganar(); else efectoSonido.explosion(false);
    return { tipo: r?.menosDiez ? 'menos' : 'corte', mio: u.por === 'yo' };
  }, 2400);

  let estado;
  if (partida.fase === 'resumen') estado = `Fin de la ronda ${partida.ronda}`;
  else if (robar) estado = '¡Te toca! Robá del mazo o la de arriba del pozo';
  else if (tirar) estado = puedeCortar ? 'Elegí qué carta tirar… ¡ya podés cortar!' : 'Elegí qué carta tirar';
  else estado = `Juega ${ctx.nombreRival}…`;

  let ultimaTxt = null;
  if (u && partida.fase === 'jugando') {
    const yo = u.por === 'yo';
    const r = ctx.nombreRival;
    if (u.tipo === 'robo' && u.de === 'pozo') ultimaTxt = yo ? `Levantaste ${nombre(u.carta)} del pozo` : `${r} levantó ${nombre(u.carta)} del pozo`;
    if (u.tipo === 'robo' && u.de !== 'pozo') ultimaTxt = yo ? 'Robaste del mazo' : `${r} robó del mazo`;
    if (u.tipo === 'tiro') ultimaTxt = yo ? `Tiraste ${nombre(u.carta)}` : `${r} tiró ${nombre(u.carta)}`;
  }

  return (
    <div className="chinchon">
      {fx?.tipo === 'chinchon' && (
        <>
          <Cartel key={fx.id} tipo="oro" texto="¡CHINCHÓN!" sub={fx.mio ? '¡Ganaste la partida de una!' : `${ctx.nombreRival} hizo chinchón`} />
          {fx.mio && <Confeti key={`c${fx.id}`} cantidad={140} />}
        </>
      )}
      {fx?.tipo === 'menos' && <Cartel key={fx.id} tipo="oro" texto="¡MENOS DIEZ!" sub={fx.mio ? 'Cortaste con todo ligado' : `${ctx.nombreRival} cortó con todo ligado`} />}
      {fx?.tipo === 'corte' && <Cartel key={fx.id} tipo={fx.mio ? 'escoba' : 'hundido'} texto="¡CORTÓ!" sub={fx.mio ? 'Cortaste vos' : `Cortó ${ctx.nombreRival}`} />}

      <div className="marcador">
        <span>Vos <b>{partida.puntos.yo}</b></span>
        <span className="ronda">Ronda {partida.ronda} · pierde el que pasa {partida.config.limite}</span>
        <span><b>{partida.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className="ch-barras" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, (partida.puntos.yo / partida.config.limite) * 100))}%` }} />
        <span className="rival" style={{ width: `${Math.max(0, Math.min(100, (partida.puntos.rival / partida.config.limite) * 100))}%` }} />
      </div>

      {partida.fase === 'resumen' ? (
        <Resumen partida={partida} accion={accion} ctx={ctx} />
      ) : (
        <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
          {estado}
          {ultimaTxt && <small>{ultimaTxt}</small>}
        </div>
      )}

      {partida.fase === 'jugando' && (
        <div className="paño">
          <div className="fila-rival">
            <div className="mano-rival">{Array.from({ length: partida.cartasRival }, (_, i) => <Carta key={i} chica />)}</div>
            <small>{ctx.nombreRival}: {partida.cartasRival} cartas</small>
          </div>

          <div className="ch-centro">
            <button type="button" className={`ch-mazo ${robar ? 'activo' : ''}`} disabled={!robar} onClick={() => accion('robar', { de: 'mazo' })} title="Robar del mazo">
              <Carta />
              <small>Mazo · {partida.mazo}</small>
            </button>
            <div className={`ch-pozo ${robar && partida.tope ? 'activo' : ''}`}>
              {partida.tope ? (
                <CartaCh key={partida.tope.id} carta={partida.tope} className="tope" onClick={robar ? () => accion('robar', { de: 'pozo' }) : undefined} />
              ) : <span className="mesa-vacia">Pozo vacío</span>}
              <small>{robar && partida.tope ? 'Tocá para levantarla' : `Pozo · ${partida.pozo}`}</small>
            </div>
          </div>

          <ManoAcomodada
            cartas={partida.miMano}
            arreglo={partida.arreglo}
            elegida={elegida}
            nueva={partida.robo}
            cortes={partida.cortes}
            onElegir={tirar ? (id) => setElegida(elegida === id ? null : id) : undefined}
          />
          <p className="ch-suelto">Suelto en tu mano: <b>{partida.arreglo.puntos}</b> punto{partida.arreglo.puntos === 1 ? '' : 's'}</p>

          {tirar && (
            <div className="acciones">
              <button className="btn" disabled={!sel} onClick={() => hacer('tirar')}>{sel ? `Tirar ${nombre(sel)}` : 'Elegí una carta'}</button>
              <button className="btn ch-cortar" disabled={!corteSel || corteSel.puntos > CORTE_MAXIMO} onClick={() => hacer('cortar')}>
                {corteSel && corteSel.puntos <= CORTE_MAXIMO ? `Cortar (quedan ${corteSel.puntos})` : 'Cortar'}
              </button>
            </div>
          )}
          {tirar && <p className="ayuda">Las cartas con “corta” son las que podés tirar para cortar: te quedan {CORTE_MAXIMO} puntos sueltos o menos.</p>}
        </div>
      )}
    </div>
  );
}

JuegoChinchon.textoFinal = (p) => (p.motivoFin === 'chinchon' ? '¡Terminó con chinchón!' : `Terminó ${p.puntos.yo} a ${p.puntos.rival} (gana el que tiene menos).`);

JuegoChinchon.claveTurno = (p, ctx) =>
  p.estado === 'jugando' && p.fase === 'jugando' && p.turno === ctx.yo && p.paso === 'robar' ? `ch-${p.ronda}-${p.ultima?.n ?? 0}` : null;
