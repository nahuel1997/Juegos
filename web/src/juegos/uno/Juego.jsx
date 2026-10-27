import { useState } from 'react';
import { Cartel, Confeti, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

const COLORES = ['rojo', 'amarillo', 'verde', 'azul'];
const NOMBRE = { salta: 'Salta', reversa: 'Reversa', mas2: '+2', comodin: 'Comodín', mas4: '+4' };
const nombreCarta = (c) => `${NOMBRE[c.valor] || c.valor}${c.color === 'negro' ? '' : ` ${c.color}`}`;
const sePuede = (c, tope, color) => c.color === 'negro' || c.color === color || c.valor === tope.valor;

// Dibujito del medio de la carta (SVG propio para los símbolos).
function Simbolo({ valor, chico }) {
  if (valor === 'salta') {
    return (
      <svg viewBox="0 0 40 40" className="uno-svg"><circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="5" /><path d="M11 29L29 11" stroke="currentColor" strokeWidth="5" /></svg>
    );
  }
  if (valor === 'reversa') {
    return (
      <svg viewBox="0 0 40 40" className="uno-svg">
        <path d="M8 22V16c0-4 3-7 7-7h12V4l8 8-8 8v-5H16c-1 0-2 1-2 2v5z" fill="currentColor" />
        <path d="M32 18v6c0 4-3 7-7 7H13v5l-8-8 8-8v5h11c1 0 2-1 2-2v-5z" fill="currentColor" />
      </svg>
    );
  }
  if (valor === 'comodin' || (valor === 'mas4' && !chico)) {
    return (
      <span className="uno-rueda-wrap">
        <svg viewBox="0 0 40 40" className="uno-svg rueda">
          <path d="M20 20V4a16 16 0 0 1 16 16z" fill="#e53935" />
          <path d="M20 20h16a16 16 0 0 1-16 16z" fill="#1e88e5" />
          <path d="M20 20v16A16 16 0 0 1 4 20z" fill="#43a047" />
          <path d="M20 20H4A16 16 0 0 1 20 4z" fill="#fdd835" />
        </svg>
        {valor === 'mas4' && <b className="uno-texto">+4</b>}
      </span>
    );
  }
  if (valor === 'mas2') return <b className="uno-texto">+2</b>;
  if (valor === 'mas4') return <b className="uno-texto">+4</b>;
  return <b className={`uno-texto ${valor === '6' || valor === '9' ? 'subrayado' : ''}`}>{valor}</b>;
}

export function CartaUno({ carta, onClick, puede, chica, className = '' }) {
  if (!carta) {
    return (
      <span className={`uno-carta dorso ${chica ? 'chica' : ''} ${className}`}>
        <span className="uno-ovalo"><b>UNO</b></span>
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`uno-carta c-${carta.color} ${puede ? 'puede' : ''} ${chica ? 'chica' : ''} ${className}`}
      onClick={onClick}
      disabled={!onClick}
      title={nombreCarta(carta)}
    >
      <span className="uno-esq arriba"><Simbolo valor={carta.valor} chico /></span>
      <span className="uno-ovalo"><Simbolo valor={carta.valor} /></span>
      <span className="uno-esq abajo"><Simbolo valor={carta.valor} chico /></span>
    </button>
  );
}

function texto(u, ctx) {
  if (!u) return null;
  const yo = u.por === 'yo';
  const r = ctx.nombreRival;
  if (u.tipo === 'robo') return yo ? 'Robaste una carta' : `${r} robó una carta`;
  if (u.tipo === 'paso') return yo ? 'Pasaste' : `${r} pasó`;
  if (u.tipo === 'uno') return yo ? 'Dijiste ¡UNO!' : `${r} dijo ¡UNO!`;
  if (u.tipo === 'acuso') return yo ? `Cantaste que ${r} no dijo UNO: roba 2` : `${r} cantó que no dijiste UNO: robás 2`;
  let t = yo ? `Tiraste ${nombreCarta(u.carta)}` : `${r} tiró ${nombreCarta(u.carta)}`;
  if (u.carta.color === 'negro') t += yo ? ` y elegiste ${u.color}` : ` y eligió ${u.color}`;
  if (u.roba) t += yo ? ` · ${r} roba ${u.roba}` : ` · robás ${u.roba}`;
  if (['salta', 'reversa', 'mas2', 'mas4'].includes(u.carta.valor)) t += yo ? ' · volvés a jugar' : ` · vuelve a jugar ${r}`;
  return t;
}

function Resumen({ partida, accion, ctx }) {
  const r = partida.resumen;
  const gane = r.ganador === 'yo';
  const listo = partida.listosSiguiente.includes('yo');
  return (
    <div className="tarjeta uno-resumen">
      <h3>{gane ? '¡Te quedaste sin cartas!' : `${ctx.nombreRival} se quedó sin cartas`}</h3>
      <p className="sub">{gane ? `Sumás ${r.puntos} puntos por las cartas de ${ctx.nombreRival}:` : `Suma ${r.puntos} puntos por tus cartas:`}</p>
      <div className="uno-fila">{r.cartas.map((c) => <CartaUno key={c.id} carta={c} chica />)}</div>
      {partida.estado === 'jugando' && (
        <button className="btn" disabled={listo} onClick={() => accion('siguiente')}>
          {listo ? `Esperando a ${ctx.nombreRival}…` : 'Siguiente ronda →'}
        </button>
      )}
    </div>
  );
}

export default function JuegoUno({ partida, accion, ctx }) {
  const { tope, color, miMano } = partida;
  const jugando = partida.estado === 'jugando' && partida.fase === 'jugando';
  const miTurno = jugando && partida.turno === ctx.yo;
  const [eligiendo, setEligiendo] = useState(null); // comodín esperando color

  const puede = (c) => miTurno && (partida.robada ? c.id === partida.robada : sePuede(c, tope, color));
  const jugar = (c) => {
    if (!puede(c)) return;
    if (c.color === 'negro') setEligiendo(c.id);
    else accion('jugar', { carta: c.id });
  };

  // Lo que pasó recién: +2/+4, UNO, acusaciones, cambio de color y fin de ronda.
  const u = partida.ultima;
  const fx = useEfecto(u ? `u${partida.ronda}-${u.n}` : null, () => {
    if (u.tipo === 'jugo') {
      efectoSonido.carta?.();
      if (u.roba) {
        if (u.por === 'rival') efectoSonido.explosion(u.roba === 4);
        return { tipo: 'roba', ...u };
      }
      if (u.carta.color === 'negro') return { tipo: 'color', ...u };
      if (u.carta.valor === 'salta' || u.carta.valor === 'reversa') return { tipo: 'salta', ...u, ms: 1300 };
      return null;
    }
    if (u.tipo === 'uno') { efectoSonido.fanfarria(); return { ...u }; }
    if (u.tipo === 'acuso') { efectoSonido.explosion(false); return { ...u }; }
    return null;
  }, 2000);
  const finRonda = useEfecto(partida.fase === 'resumen' ? `f${partida.ronda}` : null, () => {
    const gane = partida.resumen.ganador === 'yo';
    if (gane) efectoSonido.fanfarria();
    return { gane };
  }, 2600);

  const contraMi = fx?.tipo === 'roba' && fx.por === 'rival';
  const botonUno = jugando && ((miTurno && miMano.length === 2 && !partida.dijoUno) || partida.sinUno === 'yo');
  const vinoDe = u?.tipo === 'jugo' ? (u.por === 'yo' ? 'de-abajo' : 'de-arriba') : '';

  let estado;
  if (partida.fase === 'resumen') estado = `Fin de la ronda ${partida.ronda}`;
  else if (miTurno) estado = partida.robada ? 'Robaste una que va: tirala o pasá' : '¡Te toca! Tirá una carta o robá del mazo';
  else estado = `Juega ${ctx.nombreRival}…`;

  return (
    <div className="uno">
      {fx?.tipo === 'roba' && (
        <Cartel key={fx.id} tipo={contraMi ? 'hundido' : 'oro'} texto={`+${fx.roba}`} sub={contraMi ? `Robás ${fx.roba} y perdés el turno` : `${ctx.nombreRival} roba ${fx.roba}`} />
      )}
      {fx?.tipo === 'color' && <Cartel key={fx.id} tipo={`uno-color c-${fx.color}`} texto={fx.color.toUpperCase()} sub={fx.por === 'yo' ? 'Elegiste el color' : `${ctx.nombreRival} cambió el color`} />}
      {fx?.tipo === 'salta' && <Cartel key={fx.id} texto={fx.carta.valor === 'salta' ? '¡SALTA!' : '¡REVERSA!'} sub={fx.por === 'yo' ? 'Volvés a jugar' : `Vuelve a jugar ${ctx.nombreRival}`} />}
      {fx?.tipo === 'uno' && <Cartel key={fx.id} tipo="oro uno-grito" texto="¡UNO!" sub={fx.por === 'yo' ? 'Avisaste que te queda una' : `A ${ctx.nombreRival} le queda una carta`} />}
      {fx?.tipo === 'acuso' && <Cartel key={fx.id} tipo="hundido" texto="¡NO DIJO UNO!" sub={fx.por === 'yo' ? `${ctx.nombreRival} roba 2` : 'Te agarraron: robás 2'} />}
      {finRonda?.gane && <Confeti key={finRonda.id} cantidad={80} />}

      <div className="marcador">
        <span>Vos <b>{partida.puntos.yo}</b></span>
        <span className="ronda">Ronda {partida.ronda} · a {partida.config.meta}</span>
        <span><b>{partida.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      {partida.fase === 'resumen' ? (
        <Resumen partida={partida} accion={accion} ctx={ctx} />
      ) : (
        <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
          {estado}
          {u && <small>{texto(u, ctx)}</small>}
        </div>
      )}

      <div className={`uno-mesa color-${color}`}>
        <div className="uno-rival">
          <div className={`uno-abanico ${fx?.tipo === 'roba' && !contraMi ? 'recibe' : ''}`}>
            {Array.from({ length: partida.cartasRival }, (_, i) => <CartaUno key={i} chica />)}
          </div>
          <small>{ctx.nombreRival}: {partida.cartasRival} carta{partida.cartasRival === 1 ? '' : 's'}</small>
          {partida.sinUno === 'rival' && (
            <button className="btn peligro uno-acusar" onClick={() => accion('acusar')}>¡No dijo UNO!</button>
          )}
        </div>

        <div className="uno-centro">
          <button
            type="button"
            className={`uno-mazo ${miTurno && !partida.robada ? 'activo' : ''}`}
            disabled={!miTurno || !!partida.robada}
            onClick={() => accion('robar')}
            title="Robar una carta"
          >
            <CartaUno />
            <small>{partida.mazo} · Robar</small>
          </button>
          <div className="uno-pozo">
            <span className={`uno-aro c-${color}`} />
            <CartaUno key={tope.id} carta={tope} className={`tope ${vinoDe}`} />
          </div>
        </div>

        <div className={`uno-mia ${contraMi ? 'castigada' : ''}`}>
          <div className={`uno-abanico mio ${miTurno ? 'turno' : ''}`}>
            {miMano.map((c) => (
              <CartaUno key={c.id} carta={c} puede={puede(c)} className={c.id === partida.robada ? 'robada' : ''} onClick={miTurno ? () => jugar(c) : undefined} />
            ))}
          </div>
          <div className="acciones">
            {botonUno && <button className="btn uno-boton" onClick={() => accion('uno')}>¡UNO!</button>}
            {partida.dijoUno && <span className="chip">Avisaste UNO</span>}
            {miTurno && partida.robada && <button className="btn fantasma" onClick={() => accion('pasar')}>Pasar</button>}
          </div>
          {miTurno && miMano.length === 2 && !partida.dijoUno && partida.config.castigoUno && (
            <p className="ayuda">Te quedan dos: tocá ¡UNO! antes de tirar, o te pueden hacer robar 2.</p>
          )}
        </div>
      </div>

      {eligiendo && (
        <div className="uno-elegir" role="dialog" aria-label="Elegí el color">
          <div className="tarjeta">
            <h3>Elegí el color</h3>
            <div className="uno-colores">
              {COLORES.map((c) => (
                <button key={c} type="button" className={`uno-color c-${c}`} onClick={() => { accion('jugar', { carta: eligiendo, color: c }); setEligiendo(null); }}>
                  {c}
                </button>
              ))}
            </div>
            <button className="btn fantasma" onClick={() => setEligiendo(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

JuegoUno.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival} en ${p.ronda} ronda${p.ronda === 1 ? '' : 's'}.`;

JuegoUno.claveTurno = (p, ctx) =>
  p.estado === 'jugando' && p.fase === 'jugando' && p.turno === ctx.yo ? `uno-${p.ronda}-${p.ultima?.n ?? 0}` : null;
