import { Carta } from '../escoba/Juego.jsx';
import { Cartel, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

const NOMBRE_TRUCO = { 1: 'Truco', 2: 'Retruco', 3: 'Vale cuatro' };
const ETIQUETA = { envido: 'Envido', real: 'Real envido', falta: 'Falta envido', quiero: '¡Quiero!', noquiero: 'No quiero', mazo: 'Al mazo' };

// En el truco no se muestra el "valor" de la escoba.
const sinValor = (c) => c && { ...c, valor: '' };

// Los puntos con fósforos: cuadraditos de 5.
function Fosforos({ n, meta }) {
  const grupos = [];
  for (let i = 0; i < n; i += 5) grupos.push(Math.min(5, n - i));
  return (
    <span className="tr-fosforos" aria-label={`${n} de ${meta}`}>
      {grupos.map((g, i) => (
        <svg key={i} viewBox="0 0 24 24" className={meta === 30 && i === 3 ? 'buenas' : ''}>
          {g > 0 && <path d="M3 3v18" />}
          {g > 1 && <path d="M3 3h18" />}
          {g > 2 && <path d="M21 3v18" />}
          {g > 3 && <path d="M3 21h18" />}
          {g > 4 && <path d="M3 21L21 3" />}
        </svg>
      ))}
      <b>{n}</b>
    </span>
  );
}

export default function JuegoTruco({ partida, accion, ctx }) {
  const p = partida;
  const ops = p.opciones;
  const puedoJugar = ops.includes('jugar');
  const pend = p.pendiente;
  const nombre = (t) => t.replaceAll('@R@', ctx.nombreRival);

  // Cartel cuando el rival canta algo.
  const canto = useEfecto(pend && pend.por === 'rival' ? `${p.numero}-${pend.tipo}-${pend.nombre}-${pend.cadena?.length}` : null, () => {
    efectoSonido.carta();
    return { texto: `¡${pend.nombre}!` };
  }, 1400);
  const finMano = useEfecto(p.fase === 'resumen' && p.resumen ? `m${p.numero}` : null, () => {
    if (p.resumen.ganador === 'yo') efectoSonido.ganar?.();
    return { r: p.resumen };
  }, 1800);

  const botones = ops.filter((o) => o !== 'jugar');
  const etiqueta = (o) => {
    if (o !== 'truco') return ETIQUETA[o];
    const nivel = (pend?.tipo === 'truco' ? pend.nivel : p.truco.nivel) + 1;
    return `¡${NOMBRE_TRUCO[nivel]}!`;
  };

  let estado;
  if (p.fase === 'resumen') estado = p.resumen ? `${p.resumen.ganador === 'yo' ? 'Ganaste' : `Ganó ${ctx.nombreRival}`} la mano: ${p.resumen.puntos} ${p.resumen.puntos === 1 ? 'punto' : 'puntos'}${p.resumen.motivo === 'mazo' ? ' (al mazo)' : p.resumen.motivo === 'noquiero' ? ' (no quiso)' : ''}` : 'Fin de la mano';
  else if (pend) estado = pend.por === 'yo' ? `Cantaste ${pend.nombre}. Esperando a ${ctx.nombreRival}…` : `${ctx.nombreRival} cantó ${pend.nombre}: ¿querés?`;
  else if (p.turno === 'yo') estado = '¡Te toca!';
  else estado = `Juega ${ctx.nombreRival}…`;

  const listo = p.listosSiguiente.includes('yo');
  const bazas = [0, 1, 2].map((i) => p.bazas[i] || null);
  return (
    <div className="truco">
      {canto && <Cartel key={canto.id} texto={canto.texto} tipo="oro" />}
      {finMano && <Cartel key={finMano.id} texto={finMano.r.ganador === 'yo' ? `+${finMano.r.puntos}` : `+${finMano.r.puntos} para ${ctx.nombreRival}`} tipo={finMano.r.ganador === 'yo' ? 'oro' : ''} />}
      <div className="marcador">
        <span>Vos <Fosforos n={p.puntos.yo} meta={p.config.meta} /></span>
        <span className="ronda">Mano {p.numero} · a {p.config.meta}{p.soyMano ? ' · sos mano' : ''}{p.truco.nivel ? ` · ${NOMBRE_TRUCO[p.truco.nivel]} querido` : ''}</span>
        <span><Fosforos n={p.puntos.rival} meta={p.config.meta} /> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${puedoJugar || (pend && pend.por === 'rival') ? 'tu-turno' : ''}`}>
        {estado}
        <small>Tu envido: {p.miEnvido}{p.flor?.yo ? ' · ¡tenés flor!' : ''}</small>
      </div>

      <div className="tr-mano-rival">
        {(p.rivalIniciales || Array.from({ length: p.cartasRival })).map((c, i) => (
          <Carta key={c?.id || i} carta={sinValor(c) || null} chica />
        ))}
      </div>

      <div className="tr-mesa">
        {bazas.map((b, i) => (
          <div key={i} className={`tr-baza ${b?.ganador ? `gano-${b.ganador}` : ''}`}>
            <div className="tr-lugar">{b?.rival && <Carta carta={sinValor(b.rival)} chica />}</div>
            <small>{b?.ganador === 'yo' ? 'Tuya' : b?.ganador === 'rival' ? 'Del rival' : b?.ganador === 'parda' ? 'Parda' : `${i + 1}ª`}</small>
            <div className="tr-lugar">{b?.yo && <Carta carta={sinValor(b.yo)} chica />}</div>
          </div>
        ))}
      </div>

      <div className="tr-mi-mano">
        {p.miMano.map((c) => (
          <Carta key={c.id} carta={sinValor(c)} onClick={puedoJugar ? () => accion('jugar', { carta: c.id }) : undefined} />
        ))}
      </div>

      {botones.length > 0 && p.fase === 'jugando' && (
        <div className="tr-cantos">
          {botones.map((o) => (
            <button key={o} type="button" className={`btn ${['quiero', 'truco', 'envido', 'real', 'falta'].includes(o) ? '' : 'fantasma'} tr-${o}`} onClick={() => accion(o)}>{etiqueta(o)}</button>
          ))}
        </div>
      )}

      {p.envido && (
        <p className="tr-envido">
          {p.envido.querido
            ? `Envido: vos ${p.envido.valores.yo}, ${ctx.nombreRival} ${p.envido.valores.rival} → ${p.envido.puntos} para ${p.envido.ganador === 'yo' ? 'vos' : ctx.nombreRival}`
            : `Envido no querido: ${p.envido.puntos} para ${p.envido.ganador === 'yo' ? 'vos' : ctx.nombreRival}`}
        </p>
      )}

      {p.fase === 'resumen' && p.estado === 'jugando' && (
        <div className="acciones centro">
          <button className="btn" disabled={listo} onClick={() => accion('siguiente')}>{listo ? `Esperando a ${ctx.nombreRival}…` : 'Siguiente mano →'}</button>
        </div>
      )}

      <ul className="tr-eventos">
        {p.eventos.slice(-5).reverse().map((e, i) => <li key={`${p.numero}-${p.eventos.length - i}`}>{nombre(e)}</li>)}
      </ul>
    </div>
  );
}

JuegoTruco.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoTruco.claveTurno = (p) => {
  if (p.estado !== 'jugando' || p.fase !== 'jugando') return null;
  if (p.pendiente?.por === 'rival') return `tr-${p.numero}-c-${p.pendiente.nombre}`;
  return p.opciones.includes('jugar') ? `tr-${p.numero}-${p.bazas.length}-${p.miMano.length}` : null;
};
