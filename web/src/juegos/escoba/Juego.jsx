import { useEffect, useRef, useState } from 'react';
import { Icono } from '../../iconos.jsx';
import { Cartel, Confeti } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

const PALO = { oros: 'oro', copas: 'copa', espadas: 'espada', bastos: 'basto' };
const FIGURA = { 10: 'Sota', 11: 'Caballo', 12: 'Rey' };
const SIETE_DE_OROS = 'oros-7';

export function Carta({ carta, seleccionada, onClick, chica, brilla }) {
  if (!carta) return <div className={`carta dorso ${chica ? 'chica' : ''}`} />;
  return (
    <button type="button" className={`carta palo-${carta.palo} ${seleccionada ? 'sel' : ''} ${chica ? 'chica' : ''} ${brilla ? 'siete-oro' : ''}`} onClick={onClick} disabled={!onClick} title={`${FIGURA[carta.numero] || carta.numero} de ${carta.palo} (vale ${carta.valor})`}>
      <span className="num">{carta.numero}</span>
      <span className="palo"><Icono id={PALO[carta.palo]} tam={chica ? 22 : 44} /></span>
      <span className="fig">{FIGURA[carta.numero] || ''}</span>
      <span className="val">{carta.valor}</span>
    </button>
  );
}

// Busca cartas de la mesa que sumen 15 con la carta elegida (para el botón de ayuda).
function buscarQuince(carta, mesa) {
  for (let m = 1; m < 1 << mesa.length; m++) {
    const sel = mesa.filter((_, i) => m & (1 << i));
    if (carta.valor + sel.reduce((s, c) => s + c.valor, 0) === 15) return sel.map((c) => c.id);
  }
  return null;
}

const SIETE = { id: SIETE_DE_OROS, palo: 'oros', numero: 7, valor: 7 };

// El 7 de oros entra girando en el medio de la pantalla, con rayos y estrellitas.
function ShowSieteDeOros() {
  const estrellas = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const r = 140 + Math.random() * 120;
    return { dx: `${Math.cos(a) * r}px`, dy: `${Math.sin(a) * r}px`, ret: `${0.9 + Math.random() * 0.4}s` };
  });
  return (
    <div className="show-oro" aria-live="polite">
      <div className="rayos" />
      {estrellas.map((e, i) => (
        <span key={i} className="estrellita" style={{ '--dx': e.dx, '--dy': e.dy, animationDelay: e.ret }}><Icono id="estrella" tam={34} /></span>
      ))}
      <Carta carta={SIETE} />
      <div className="texto-oro">¡El 7 de oros está en la mesa!</div>
    </div>
  );
}

// Una escoba gigante barre la pantalla levantando polvo.
function Barrida({ mio, rival, demora }) {
  const retraso = demora ? 0.9 : 0;
  return (
    <>
      <div className="barrida" aria-hidden="true">
        <span className="escoba-gigante" style={{ animationDelay: `${retraso}s` }}><Icono id="escoba" tam={180} /></span>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="polvo" style={{ left: `${8 + i * 11}%`, animationDelay: `${retraso + 0.15 + i * 0.16}s` }} />
        ))}
      </div>
      <Cartel tipo="escoba" retraso={retraso} texto="¡ESCOBA!" sub={mio ? 'Barriste la mesa: +1 punto' : `${rival} barrió la mesa`} />
    </>
  );
}

function textoUltima(u, ctx) {
  if (!u) return null;
  const quien = u.por === ctx.yo ? 'Vos' : ctx.nombreRival;
  if (u.tipo === 'mesa-inicial') return `La mesa sumaba 15: ${quien === 'Vos' ? 'te la llevaste' : `se la llevó ${quien}`} (¡escoba!)`;
  if (u.tipo === 'tiro') return `${quien} tiró un ${u.carta.numero} de ${u.carta.palo}`;
  return `${quien} levantó ${u.cartas.length + 1} cartas con el ${u.carta.numero} de ${u.carta.palo}${u.escoba ? ' · ¡ESCOBA!' : ''}`;
}

function Resumen({ partida, accion, ctx }) {
  const r = partida.resumen;
  const listoYo = partida.listosSiguiente.includes(ctx.yo);
  const fila = (nombre, clave) => (
    <tr><td>{nombre}</td><td>{r[clave].yo}</td><td>{r[clave].rival}</td></tr>
  );
  return (
    <div className="tarjeta resumen-mano">
      <h3>Fin de la mano {partida.mano}</h3>
      <table className="planilla">
        <thead><tr><th /><th>Vos</th><th>{ctx.nombreRival}</th></tr></thead>
        <tbody>
          {fila('Cartas', 'cartas')}
          {fila('Oros', 'oros')}
          {fila('Sietes', 'sietes')}
          <tr><td>Escobas</td><td>{partida.escobas.yo}</td><td>{partida.escobas.rival}</td></tr>
          <tr className="total"><td>Puntos de la mano</td><td>{r.detalle.yo.length}</td><td>{r.detalle.rival.length}</td></tr>
        </tbody>
      </table>
      <p className="sub">Vos: {r.detalle.yo.join(', ') || 'nada'} · {ctx.nombreRival}: {r.detalle.rival.join(', ') || 'nada'}</p>
      {partida.estado === 'jugando' && (
        <button className="btn" disabled={listoYo} onClick={() => accion('siguiente')}>
          {listoYo ? `Esperando a ${ctx.nombreRival}…` : 'Siguiente mano →'}
        </button>
      )}
    </div>
  );
}

export default function JuegoEscoba({ partida, accion, ctx }) {
  const miTurno = partida.estado === 'jugando' && partida.fase === 'jugando' && partida.turno === ctx.yo;
  const [mia, setMia] = useState(null);
  const [mesaSel, setMesaSel] = useState([]);
  const [sinQuince, setSinQuince] = useState(false);

  // Cada jugada nueva limpia la selección.
  const firma = partida.mesa.map((c) => c.id).join() + partida.miMano.map((c) => c.id).join();
  useEffect(() => {
    setMia(null);
    setMesaSel([]);
    setSinQuince(false);
  }, [firma]);
  useEffect(() => setSinQuince(false), [mia]);

  // Momentos especiales: el 7 de oros cae en la mesa, alguien se lo lleva, o alguien hace escoba.
  const [show, setShow] = useState(null);
  const estabaEnMesa = useRef(partida.mesa.some((c) => c.id === SIETE_DE_OROS));
  const enMesa = partida.mesa.some((c) => c.id === SIETE_DE_OROS);
  const u = partida.ultima;
  const seLoLlevo = u && u.tipo !== 'tiro' && (u.carta?.id === SIETE_DE_OROS || u.cartas?.some((c) => c.id === SIETE_DE_OROS));
  const hizoEscoba = u && (u.escoba || u.tipo === 'mesa-inicial');
  const claveUltima = u ? `${u.por}-${u.tipo}-${u.carta?.id || ''}-${partida.mano}` : '';
  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current) {
      // Al entrar (o recargar) no se repite la animación de una jugada vieja.
      montado.current = true;
      return;
    }
    const aparece = enMesa && !estabaEnMesa.current;
    estabaEnMesa.current = enMesa;
    const mio = u?.por === ctx.yo;
    const nuevo = {
      aparece,
      llevo: !aparece && seLoLlevo ? { mio } : null,
      escoba: hizoEscoba ? { mio } : null,
      id: Date.now(),
    };
    if (!nuevo.aparece && !nuevo.llevo && !nuevo.escoba) return;
    if (nuevo.aparece || nuevo.llevo) efectoSonido.fanfarria();
    if (nuevo.escoba) setTimeout(() => efectoSonido.escoba(), nuevo.aparece || nuevo.llevo ? 900 : 0);
    setShow(nuevo);
    const t = setTimeout(() => setShow(null), nuevo.aparece || (nuevo.escoba && nuevo.llevo) ? 3400 : 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enMesa, claveUltima]);

  const carta = partida.miMano.find((c) => c.id === mia);
  const suma = (carta?.valor || 0) + partida.mesa.filter((c) => mesaSel.includes(c.id)).reduce((s, c) => s + c.valor, 0);
  const toggleMesa = (id) => setMesaSel(mesaSel.includes(id) ? mesaSel.filter((x) => x !== id) : [...mesaSel, id]);

  const enMano = partida.enEstaMano || { yo: 0, rival: 0 };
  const mias = partida.misLevantadas;

  return (
    <div className="escoba">
      {show?.aparece && <ShowSieteDeOros key={show.id} />}
      {show?.llevo && (
        <>
          <Cartel key={`l${show.id}`} tipo="oro" texto="¡7 de oros!" sub={show.llevo.mio ? 'Te lo llevaste: +1 punto' : `Se lo llevó ${ctx.nombreRival}`} />
          {show.llevo.mio && <Confeti key={`c${show.id}`} cantidad={60} />}
        </>
      )}
      {show?.escoba && <Barrida key={`e${show.id}`} mio={show.escoba.mio} rival={ctx.nombreRival} demora={show.aparece || show.llevo} />}
      <div className="marcador">
        <span>Vos <b>{partida.puntos.yo + enMano.yo}</b>{enMano.yo > 0 && <small className="en-mano"> (+{enMano.yo} en esta mano)</small>}</span>
        <span className="ronda">Mano {partida.mano} · a {partida.config.puntosParaGanar}</span>
        <span>{enMano.rival > 0 && <small className="en-mano">(+{enMano.rival} en esta mano) </small>}<b>{partida.puntos.rival + enMano.rival}</b> {ctx.nombreRival}</span>
      </div>

      {partida.fase === 'resumen' ? (
        <Resumen partida={partida} accion={accion} ctx={ctx} />
      ) : (
        <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
          {miTurno ? '¡Te toca!' : `Juega ${ctx.nombreRival}…`}
          {partida.ultima && <small>{textoUltima(partida.ultima, ctx)}</small>}
        </div>
      )}

      <div className="paño">
        <div className="fila-rival">
          <div className="mano-rival">{Array.from({ length: partida.cartasRival }, (_, i) => <Carta key={i} chica />)}</div>
          <small>{ctx.nombreRival}: {partida.levantadas.rival} levantadas · <Icono id="escoba" tam={16} /> {partida.escobas.rival}</small>
        </div>

        <div className="mesa">
          {partida.mesa.length === 0 && <span className="mesa-vacia">Mesa vacía</span>}
          {partida.mesa.map((c) => (
            <Carta
              key={c.id}
              carta={c}
              seleccionada={mesaSel.includes(c.id)}
              brilla={c.id === SIETE_DE_OROS}
              onClick={miTurno && mia ? () => toggleMesa(c.id) : undefined}
            />
          ))}
          <div className="mazo" title="Cartas en el mazo">{partida.mazo > 0 && <><Carta chica /><small>{partida.mazo}</small></>}</div>
        </div>

        {miTurno && carta && (
          <div className={`suma ${suma === 15 ? 'ok' : ''}`}>
            {carta.valor}{partida.mesa.filter((c) => mesaSel.includes(c.id)).map((c) => ` + ${c.valor}`).join('')} = <b>{suma}</b>
            <div className="acciones">
              {mesaSel.length > 0 ? (
                <button className="btn" disabled={suma !== 15} onClick={() => accion('jugar', { carta: mia, levantar: mesaSel })}>Levantar</button>
              ) : (
                <button className="btn fantasma" onClick={() => accion('jugar', { carta: mia })}>Tirarla a la mesa</button>
              )}
              <button className="btn chico fantasma" onClick={() => { const q = buscarQuince(carta, partida.mesa); setMesaSel(q || []); setSinQuince(!q); }}><Icono id="bombilla" tam={16} /> ¿Hay 15?</button>
            </div>
            {sinQuince && <small>Con esta carta no se llega a 15.</small>}
          </div>
        )}

        <div className="mi-mano">
          {partida.miMano.map((c) => (
            <Carta key={c.id} carta={c} seleccionada={mia === c.id} onClick={miTurno ? () => { setMia(mia === c.id ? null : c.id); setMesaSel([]); } : undefined} />
          ))}
        </div>
        {mias && (
          <div className="mis-levantadas" aria-label="Lo que llevás levantado">
            <span title="Cartas levantadas"><Icono id="cartas" tam={18} /> <b>{mias.cartas}</b> cartas</span>
            <span title="Oros levantados"><Icono id="oro" tam={18} /> <b>{mias.oros}</b> oros</span>
            <span title="Sietes levantados"><Icono id="siete" tam={18} /> <b>{mias.sietes}</b> sietes</span>
            <span title="Escobas"><Icono id="escoba" tam={18} /> <b>{partida.escobas.yo}</b></span>
            <span className={`siete-oro-chip ${mias.sieteDeOros ? 'si' : ''}`}>{mias.sieteDeOros ? <><Icono id="chispas" tam={16} /> 7 de oros</> : '7 de oros: no'}</span>
          </div>
        )}
        {partida.reparte === ctx.yo && <small className="mis-datos">Repartís vos</small>}
        {miTurno && !carta && <p className="ayuda">Elegí una carta de tu mano y después las de la mesa que sumen 15.</p>}
      </div>
    </div>
  );
}

JuegoEscoba.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;

JuegoEscoba.claveTurno = (p, ctx) =>
  p.estado === 'jugando' && p.fase === 'jugando' && p.turno === ctx.yo ? `e-${p.mano}-${p.mazo}-${p.miMano.length}` : null;
