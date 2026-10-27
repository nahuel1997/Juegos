import { useEffect, useRef, useState } from 'react';
import { DadoSvg } from '../escaleras/Juego.jsx';
import { Cartel, Confeti, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

const plata = (n) => `$${Number(n).toLocaleString('es-AR')}`;

// Dónde va cada casilla en la grilla de 11x11 (la Salida abajo a la derecha, en sentido horario).
export function lugarCasilla(i) {
  if (i <= 10) return { fila: 11, col: 11 - i, lado: 'abajo' };
  if (i <= 20) return { fila: 11 - (i - 10), col: 1, lado: 'izq' };
  if (i <= 30) return { fila: 1, col: 1 + (i - 20), lado: 'arriba' };
  return { fila: 1 + (i - 30), col: 11, lado: 'der' };
}

// Iconitos propios para las casillas especiales y los lugares de Lanús.
const DIBUJOS = {
  salida: <path d="M8 32h40l-12-12M48 32L36 44" fill="none" stroke="#c62828" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />,
  comisaria: <><rect x="10" y="10" width="44" height="44" rx="6" fill="#ffb74d" stroke="#333" strokeWidth="3" /><path d="M20 10v44M32 10v44M44 10v44" stroke="#333" strokeWidth="4" /></>,
  libre: <><rect x="8" y="24" width="48" height="20" rx="8" fill="#e53935" stroke="#333" strokeWidth="3" /><path d="M16 24l6-10h20l6 10" fill="#90caf9" stroke="#333" strokeWidth="3" /><circle cx="20" cy="46" r="6" fill="#333" /><circle cx="44" cy="46" r="6" fill="#333" /></>,
  irComisaria: <><path d="M12 30c0-10 9-16 20-16s20 6 20 16z" fill="#1a237e" stroke="#111" strokeWidth="3" /><rect x="8" y="30" width="48" height="8" rx="3" fill="#111" /><circle cx="32" cy="22" r="5" fill="#ffd54a" /></>,
  suerte: <><rect x="14" y="8" width="36" height="48" rx="6" fill="#ff9800" stroke="#333" strokeWidth="3" /><text x="32" y="44" textAnchor="middle" fontSize="34" fontWeight="900" fill="#fff">?</text></>,
  club: <><path d="M32 6l22 8v16c0 14-10 24-22 28C20 54 10 44 10 30V14z" fill="#7b1e3a" stroke="#333" strokeWidth="3" /><path d="M22 30h20M32 20v20" stroke="#fff" strokeWidth="5" strokeLinecap="round" /></>,
  impuesto: <><circle cx="32" cy="32" r="22" fill="#fdd835" stroke="#333" strokeWidth="3" /><text x="32" y="42" textAnchor="middle" fontSize="28" fontWeight="900" fill="#333">$</text></>,
  estacion: <><rect x="14" y="8" width="36" height="38" rx="8" fill="#455a64" stroke="#222" strokeWidth="3" /><rect x="19" y="14" width="26" height="12" rx="2" fill="#bbdefb" /><circle cx="23" cy="36" r="3.5" fill="#ffd54a" /><circle cx="41" cy="36" r="3.5" fill="#ffd54a" /><path d="M18 46l-6 10M46 46l6 10" stroke="#222" strokeWidth="4" strokeLinecap="round" /></>,
  luz: <><path d="M32 6c-11 0-18 8-18 17 0 7 4 11 7 15h22c3-4 7-8 7-15 0-9-7-17-18-17z" fill="#ffee58" stroke="#333" strokeWidth="3" /><rect x="22" y="40" width="20" height="12" rx="3" fill="#90a4ae" stroke="#333" strokeWidth="3" /></>,
  agua: <path d="M32 6C24 20 14 30 14 40a18 18 0 0 0 36 0C50 30 40 20 32 6z" fill="#29b6f6" stroke="#0d47a1" strokeWidth="3" />,
  cafe: <><path d="M12 22h32v14c0 9-7 16-16 16S12 45 12 36z" fill="#fff" stroke="#5d4037" strokeWidth="3" /><path d="M44 26h4a7 7 0 0 1 0 14h-5" fill="none" stroke="#5d4037" strokeWidth="3" /><path d="M22 8c-3 4 3 6 0 10M32 8c-3 4 3 6 0 10" fill="none" stroke="#8d6e63" strokeWidth="3" strokeLinecap="round" /></>,
  futbol: <><rect x="6" y="14" width="52" height="36" rx="4" fill="#43a047" stroke="#1b5e20" strokeWidth="3" /><path d="M32 14v36" stroke="#fff" strokeWidth="2.5" /><circle cx="32" cy="32" r="7" fill="none" stroke="#fff" strokeWidth="2.5" /><path d="M6 24h7v16H6M58 24h-7v16h7" fill="none" stroke="#fff" strokeWidth="2.5" /></>,
  plaza: <><circle cx="32" cy="24" r="16" fill="#66bb6a" stroke="#2e7d32" strokeWidth="3" /><rect x="29" y="38" width="6" height="16" fill="#795548" /><path d="M10 56h44" stroke="#8d6e63" strokeWidth="4" /></>,
  pesa: <><rect x="20" y="28" width="24" height="8" rx="3" fill="#90a4ae" stroke="#333" strokeWidth="2.5" /><rect x="8" y="18" width="12" height="28" rx="4" fill="#212121" /><rect x="44" y="18" width="12" height="28" rx="4" fill="#212121" /></>,
  hospital: <><rect x="10" y="12" width="44" height="42" rx="5" fill="#fff" stroke="#c62828" strokeWidth="3" /><path d="M32 20v26M19 33h26" stroke="#c62828" strokeWidth="7" strokeLinecap="round" /></>,
  bici: <><circle cx="16" cy="40" r="11" fill="none" stroke="#333" strokeWidth="4" /><circle cx="48" cy="40" r="11" fill="none" stroke="#333" strokeWidth="4" /><path d="M16 40l12-18h14l6 18M28 22l8 18h12" fill="none" stroke="#7b1e3a" strokeWidth="4" strokeLinejoin="round" /></>,
  estadio: <><ellipse cx="32" cy="38" rx="28" ry="16" fill="#7b1e3a" stroke="#3e0c1c" strokeWidth="3" /><ellipse cx="32" cy="36" rx="18" ry="9" fill="#43a047" /><path d="M10 24l6-12M54 24l-6-12" stroke="#333" strokeWidth="3" /><circle cx="16" cy="12" r="3" fill="#ffd54a" /><circle cx="48" cy="12" r="3" fill="#ffd54a" /></>,
};
const Dibujo = ({ id, tam = 26 }) => (DIBUJOS[id] ? <svg viewBox="0 0 64 64" width={tam} height={tam} aria-hidden="true">{DIBUJOS[id]}</svg> : null);
const iconoDe = (c) => c.icono || { salida: 'salida', comisaria: 'comisaria', libre: 'libre', irComisaria: 'irComisaria', suerte: 'suerte', club: 'club', impuesto: 'impuesto', estacion: 'estacion' }[c.tipo];

const Casita = ({ hotel }) => (
  <svg viewBox="0 0 20 20" className={`mn-casita ${hotel ? 'hotel' : ''}`} aria-hidden="true">
    <path d="M2 10L10 3l8 7v8H2z" />
  </svg>
);

function Casilla({ i, c, partida, onClick, sel }) {
  const { fila, col, lado } = lugarCasilla(i);
  const grupo = c.grupo && partida.grupos[c.grupo];
  const d = partida.duenio[i];
  const n = partida.casas[i];
  const esquina = i % 10 === 0;
  return (
    <button
      type="button"
      className={`mn-casilla ${lado} ${esquina ? 'esquina' : ''} ${d ? `de-${d}` : ''} ${partida.hipotecada[i] ? 'hipotecada' : ''} ${sel ? 'sel' : ''}`}
      style={{ gridRow: fila, gridColumn: col }}
      onClick={onClick}
      title={c.nombre}
    >
      {grupo && <span className="mn-banda" style={{ background: grupo.color }}>{n > 0 && (n === 5 ? <Casita hotel /> : Array.from({ length: n }, (_, k) => <Casita key={k} />))}</span>}
      {iconoDe(c) && <span className="mn-ico"><Dibujo id={iconoDe(c)} tam={esquina ? 34 : 20} /></span>}
      <span className="mn-nombre">{c.nombre}</span>
      {c.precio && !d && <span className="mn-precio">{plata(c.precio)}</span>}
      {c.monto && <span className="mn-precio">{plata(c.monto)}</span>}
      {d && <span className="mn-duenio" />}
    </button>
  );
}

// Ficha de la propiedad (alquileres, casas, hipoteca) y lo que se puede hacer con ella.
function Ficha({ i, partida, accion, ctx, cerrar, puedoAdministrar }) {
  const c = partida.casillas[i];
  const g = c.grupo && partida.grupos[c.grupo];
  const d = partida.duenio[i];
  const mia = d === 'yo';
  return (
    <div className="mn-ficha tarjeta">
      <div className="mn-ficha-cab" style={{ background: g?.color || '#455a64' }}>
        <small>{g ? `Grupo ${g.nombre}` : c.tipo === 'estacion' ? 'Estación' : c.tipo === 'servicio' ? 'Servicio' : ''}</small>
        <b>{c.nombre}</b>
      </div>
      {c.tipo === 'propiedad' && (
        <table className="mn-alquileres">
          <tbody>
            {['Alquiler', 'Con 1 casa', 'Con 2 casas', 'Con 3 casas', 'Con 4 casas', 'Con hotel'].map((t, k) => (
              <tr key={t} className={partida.casas[i] === k && d ? 'actual' : ''}><td>{t}</td><td>{plata(c.alquiler[k])}</td></tr>
            ))}
            <tr><td>Casa / hotel</td><td>{plata(g.casa)} c/u</td></tr>
          </tbody>
        </table>
      )}
      {c.tipo === 'estacion' && <p className="sub">Alquiler: $25 con una estación, $50 con dos, $100 con tres y $200 con las cuatro.</p>}
      {c.tipo === 'servicio' && <p className="sub">Alquiler: 4 veces los dados (10 veces si tenés los dos servicios).</p>}
      {c.precio && <p className="sub">Precio {plata(c.precio)} · hipoteca {plata(c.precio / 2)}</p>}
      <p className="sub">{d ? (mia ? 'Es tuya' : `Es de ${ctx.nombreRival}`) : 'Sin dueño'}{partida.hipotecada[i] ? ' · HIPOTECADA' : ''}{d && partida.alquileres[i] && c.tipo !== 'servicio' ? ` · cobra ${plata(partida.alquileres[i])}` : ''}</p>
      {mia && puedoAdministrar && (
        <div className="acciones">
          {c.tipo === 'propiedad' && partida.casas[i] < 5 && <button className="btn chico" onClick={() => accion('construir', { casilla: i })}>{partida.casas[i] === 4 ? 'Poner hotel' : 'Construir casa'}</button>}
          {partida.casas[i] > 0 && <button className="btn chico fantasma" onClick={() => accion('vender', { casilla: i })}>Vender casa</button>}
          {!partida.hipotecada[i] && !partida.casas[i] && <button className="btn chico fantasma" onClick={() => accion('hipotecar', { casilla: i })}>Hipotecar</button>}
          {partida.hipotecada[i] && <button className="btn chico fantasma" onClick={() => accion('deshipotecar', { casilla: i })}>Levantar hipoteca</button>}
        </div>
      )}
      <button className="btn fantasma chico" onClick={cerrar}>Cerrar</button>
    </div>
  );
}

export default function JuegoMonopoly({ partida, accion, ctx }) {
  const { casillas, fase } = partida;
  const jugando = partida.estado === 'jugando';
  const miTurno = jugando && partida.turno === ctx.yo;
  const enDeuda = partida.deuda?.por === 'yo';
  const [sel, setSel] = useState(null);
  const colorRival = ctx.colorRival === ctx.colorYo ? '#4fc3f7' : ctx.colorRival;

  // Fichas que avanzan casillero por casillero.
  const [vista, setVista] = useState(partida.pos);
  const antes = useRef(partida.pos);
  useEffect(() => {
    const timers = [];
    for (const q of ['yo', 'rival']) {
      const de = antes.current[q];
      const a = partida.pos[q];
      if (de === a) continue;
      const pasos = (a - de + 40) % 40;
      // Avance normal (hasta 12 casillas): de a una. Si no (comisaría, tarjetas para atrás): directo.
      if (pasos > 0 && pasos <= 12) {
        for (let k = 1; k <= pasos; k++) timers.push(setTimeout(() => setVista((v) => ({ ...v, [q]: (de + k) % 40 })), 650 + k * 150));
      } else {
        timers.push(setTimeout(() => setVista((v) => ({ ...v, [q]: a })), 650));
      }
    }
    antes.current = partida.pos;
    return () => { timers.forEach(clearTimeout); setVista(partida.pos); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partida.pos.yo, partida.pos.rival]);

  const ultimo = partida.log[partida.log.length - 1];
  const [rodando, setRodando] = useState(false);
  // Sonidos de lo que pasó desde la última vez (pueden llegar varias cosas juntas: tiro, compra…).
  const visto = useRef(ultimo?.n ?? 0);
  useEffect(() => {
    const nuevos = partida.log.filter((l) => l.n > visto.current);
    visto.current = ultimo?.n ?? 0;
    if (!nuevos.length) return undefined;
    const timers = [];
    if (nuevos.some((l) => l.dados)) { efectoSonido.dados(); setRodando(true); setTimeout(() => setRodando(false), 600); }
    if (nuevos.some((l) => /^Compró|^Casa|^Hotel/.test(l.texto))) timers.push(setTimeout(() => efectoSonido.fanfarria(), 300));
    if (nuevos.some((l) => /^Alquiler/.test(l.texto))) timers.push(setTimeout(() => efectoSonido.carta?.(), 900));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimo?.n]);
  const tarjeta = useEfecto(partida.tarjeta ? `t${partida.tarjeta.n}` : null, () => ({ ...partida.tarjeta, ms: 4200 }));
  const comisaria = useEfecto(ultimo && /Comisaría/.test(ultimo.texto) && /^(A la|Tres|Cayó|Te agarraron|Se armó)/.test(ultimo.texto) ? `c${ultimo.n}` : null, () => ({ por: ultimo.por, ms: 2200 }));

  const fichaEn = (q) => {
    const { fila, col } = lugarCasilla(vista[q]);
    const juntas = vista.yo === vista.rival;
    return (
      <span
        key={q}
        className={`mn-token ${q}`}
        style={{ gridRow: fila, gridColumn: col, '--corre': juntas ? (q === 'yo' ? '-28%' : '28%') : '0%' }}
      >
        <svg viewBox="0 0 40 48" aria-hidden="true"><path d="M20 4a9 9 0 0 1 6 16l6 22H8l6-22A9 9 0 0 1 20 4z" /><ellipse cx="20" cy="43" rx="15" ry="4" /></svg>
      </span>
    );
  };

  const oferta = partida.oferta != null ? casillas[partida.oferta] : null;
  const misPropiedades = casillas.map((c, i) => ({ c, i })).filter(({ i }) => partida.duenio[i] === 'yo');
  const puedoAdministrar = miTurno || enDeuda;

  let estado;
  if (!jugando) estado = 'Partida terminada';
  else if (enDeuda) estado = `Tenés que pagar ${plata(partida.deuda.monto)}: vendé casas o hipotecá`;
  else if (partida.deuda) estado = `${ctx.nombreRival} está juntando plata para pagar…`;
  else if (miTurno) estado = fase === 'tirar' ? (partida.preso.yo ? 'Estás en la Comisaría: tirá dobles, pagá la fianza o usá la tarjeta' : partida.otraTirada ? '¡Dobles! Tirá de nuevo' : '¡Te toca! Tirá los dados') : fase === 'decidir' ? `¿Comprás ${oferta?.nombre}?` : 'Construí, hipotecá o terminá el turno';
  else estado = `Juega ${ctx.nombreRival}…`;

  return (
    <div className="monopoly" style={{ '--yo': ctx.colorYo, '--rival': colorRival }}>
      {comisaria && <Cartel key={comisaria.id} retraso={0.8} tipo="hundido" texto="¡A LA COMISARÍA!" sub={comisaria.por === 'yo' ? 'Vas preso' : `${ctx.nombreRival} va preso`} />}
      {!jugando && partida.ganador === ctx.yo && <Confeti cantidad={120} />}
      <div className="marcador">
        <span>Vos <b>{plata(partida.dinero.yo)}</b></span>
        <span className="ronda">Patrimonio: {plata(partida.patrimonio.yo)} vs {plata(partida.patrimonio.rival)}{partida.config.turnos ? ` · turno ${Math.min(partida.turnosJugados.yo + 1, partida.config.turnos)} de ${partida.config.turnos}` : ''}</span>
        <span><b>{plata(partida.dinero.rival)}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${miTurno || enDeuda ? 'tu-turno' : ''}`}>{estado}</div>

      <div className="mn-tablero">
        {casillas.map((c, i) => <Casilla key={i} i={i} c={c} partida={partida} sel={sel === i} onClick={() => setSel(sel === i ? null : i)} />)}
        {fichaEn('rival')}
        {fichaEn('yo')}
        <div className="mn-centro">
          <div className="mn-logo"><b>MONOPOLY</b><span>LANÚS</span></div>
          <div className="mn-dados">
            {(partida.dados || [1, 1]).map((d, k) => <DadoSvg key={k} valor={d} rodando={rodando} chico />)}
          </div>
          {sel !== null ? (
            <Ficha i={sel} partida={partida} accion={accion} ctx={ctx} cerrar={() => setSel(null)} puedoAdministrar={puedoAdministrar} />
          ) : (
            <div className="mn-acciones">
              {miTurno && fase === 'tirar' && partida.preso.yo > 0 && (
                <>
                  <button className="btn fantasma" disabled={partida.dinero.yo < 50} onClick={() => accion('fianza')}>Pagar fianza ($50)</button>
                  {partida.libres.yo > 0 && <button className="btn fantasma" onClick={() => accion('usarLibre')}>Usar tarjeta para salir</button>}
                </>
              )}
              {miTurno && fase === 'tirar' && <button className="btn grande" onClick={() => accion('tirar')}>{partida.preso.yo ? 'Tirar (buscando dobles)' : 'Tirar los dados'}</button>}
              {miTurno && fase === 'decidir' && oferta && (
                <div className="mn-oferta">
                  <p>Caíste en <b>{oferta.nombre}</b>: {plata(oferta.precio)}</p>
                  <div className="acciones">
                    <button className="btn" disabled={partida.dinero.yo < oferta.precio} onClick={() => accion('comprar')}>Comprar</button>
                    <button className="btn fantasma" onClick={() => accion('noComprar')}>No, gracias</button>
                    <button className="btn fantasma chico" onClick={() => setSel(partida.oferta)}>Ver ficha</button>
                  </div>
                </div>
              )}
              {miTurno && fase === 'acciones' && <button className="btn grande" onClick={() => accion('terminar')}>Terminar turno</button>}
              {enDeuda && (
                <div className="mn-oferta">
                  <p>Debés <b>{plata(partida.deuda.monto)}</b> {partida.deuda.a === 'rival' ? `a ${ctx.nombreRival}` : 'al banco'}. Tenés {plata(partida.dinero.yo)}.</p>
                  <div className="acciones">
                    <button className="btn" disabled={partida.dinero.yo < partida.deuda.monto} onClick={() => accion('pagarDeuda')}>Pagar</button>
                    <button className="btn fantasma" onClick={() => { if (window.confirm('¿Seguro? Perdés la partida.')) accion('quebrar'); }}>Me declaro en quiebra</button>
                  </div>
                  <p className="ayuda">Tocá tus propiedades en el tablero para vender casas o hipotecarlas.</p>
                </div>
              )}
              {partida.libres.yo > 0 && <small className="mn-libre">Tenés {partida.libres.yo} tarjeta{partida.libres.yo > 1 ? 's' : ''} para salir de la Comisaría</small>}
            </div>
          )}
          {tarjeta && (
            <div key={tarjeta.id} className={`mn-tarjeta ${tarjeta.mazo}`}>
              <small>{tarjeta.mazo === 'suerte' ? 'SUERTE' : 'CLUB DE BARRIO'}</small>
              <Dibujo id={tarjeta.mazo} tam={34} />
              <p>{tarjeta.texto}</p>
              <span>{tarjeta.por === 'yo' ? 'Te tocó a vos' : `Le tocó a ${ctx.nombreRival}`}</span>
            </div>
          )}
          <ul className="mn-log">
            {[...partida.log].reverse().slice(0, 6).map((l) => (
              <li key={l.n} className={l.por}><b>{l.por === 'yo' ? 'Vos' : ctx.nombreRival}:</b> {l.texto}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mn-mias tarjeta">
        <h4>Tus propiedades ({misPropiedades.length})</h4>
        {misPropiedades.length === 0 && <p className="sub">Todavía ninguna.</p>}
        <div className="mn-chips">
          {misPropiedades.map(({ c, i }) => (
            <button key={i} type="button" className={`mn-chip ${partida.hipotecada[i] ? 'hipotecada' : ''}`} style={{ '--g': c.grupo ? partida.grupos[c.grupo].color : '#455a64' }} onClick={() => setSel(i)}>
              {c.nombre}{partida.casas[i] ? ` · ${partida.casas[i] === 5 ? 'hotel' : `${partida.casas[i]} casa${partida.casas[i] > 1 ? 's' : ''}`}` : ''}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

JuegoMonopoly.textoFinal = (p, gane) => {
  if (p.motivoFin === 'quiebra') return gane ? 'El otro se fundió.' : 'Te fundiste.';
  return `Patrimonio: ${plata(p.patrimonio.yo)} contra ${plata(p.patrimonio.rival)}.`;
};
JuegoMonopoly.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.turno === ctx.yo && p.fase === 'tirar' ? `mn-${p.log[p.log.length - 1]?.n ?? 0}` : null);
