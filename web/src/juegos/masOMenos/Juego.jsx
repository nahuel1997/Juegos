import { MarcadorN, useFalta } from '../../componentes/comunes.jsx';
import { efectoSonido } from '../../sonido.js';
import { useEfecto } from '../../efectos.jsx';

export default function JuegoMasOMenos({ partida, accion, ctx }) {
  const p = partida;
  const falta = useFalta(p.faltaMs, `${p.numero}-${p.fase}`);
  const segundos = falta == null ? null : Math.ceil(falta / 1000);
  const puedo = p.estado === 'jugando' && p.fase === 'pregunta' && !p.mia && !p.fuera.includes(ctx.yo);
  const revelado = p.fase === 'revelado' || p.estado === 'terminada';
  const r = p.resultado;
  const acerte = r?.acertaron.includes(ctx.yo);

  useEfecto(revelado && r ? `mo-${p.numero}` : null, () => {
    if (acerte) efectoSonido.ganar?.();
    return {};
  }, 100);

  const total = p.fase === 'pregunta' ? p.config.segundos * 1000 : null;
  return (
    <div className="mo">
      <MarcadorN jugadores={p.jugadores} puntos={p.puntos} ctx={ctx} fuera={p.fuera} extra={`Pregunta ${p.numero} de ${p.total} · ${p.categoria.nombre}`} />
      <div className={`estado-cinta ${puedo ? 'tu-turno' : ''}`}>
        {p.fase === 'cuenta' ? 'Preparate…' : p.fase === 'pregunta' ? p.categoria.pregunta : revelado ? (acerte ? (r.rapido === ctx.yo ? '¡Bien! Y fuiste el más rápido (+2)' : '¡Bien! (+1)') : 'Esta no…') : ''}
        <small>{p.respondieron.length} de {p.jugadores.length - p.fuera.length} respondieron</small>
      </div>
      {p.fase === 'pregunta' && total && <div className="mo-tiempo"><i style={{ width: `${((falta ?? 0) / total) * 100}%` }} /></div>}
      <div className="mo-cartas">
        <div className="mo-carta conocida">
          <span className="mo-nombre">{p.a.nombre}</span>
          <b className="mo-valor">{p.a.texto}</b>
        </div>
        <span className="mo-vs">vs</span>
        <div className={`mo-carta escondida ${revelado ? 'abierta' : ''}`}>
          <span className="mo-nombre">{p.fase === 'cuenta' ? '…' : p.b.nombre}</span>
          <b className="mo-valor">{revelado ? p.b.texto : '?'}</b>
          {p.fase === 'pregunta' && (
            <div className="mo-botones">
              <button type="button" className={`btn mo-mas ${p.mia === 'mas' ? 'elegida' : ''}`} disabled={!puedo} onClick={() => accion('responder', { r: 'mas' })}>▲ {p.categoria.mas}</button>
              <button type="button" className={`btn mo-menos ${p.mia === 'menos' ? 'elegida' : ''}`} disabled={!puedo} onClick={() => accion('responder', { r: 'menos' })}>▼ {p.categoria.menos}</button>
            </div>
          )}
          {segundos != null && p.fase === 'pregunta' && <span className="mo-seg">{segundos}</span>}
        </div>
      </div>
      {revelado && r && (
        <ul className="mo-respuestas">
          {p.jugadores.filter((j) => !p.fuera.includes(j)).map((j) => {
            const dijo = p.respuestas[j];
            const bien = r.acertaron.includes(j);
            return (
              <li key={j} className={bien ? 'bien' : 'mal'}>
                {ctx.nombreDe(j)}: {dijo ? (dijo === 'mas' ? p.categoria.mas : p.categoria.menos) : 'no respondió'} {bien ? '✓' : '✗'}{r.rapido === j ? ' · el más rápido' : ''}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

JuegoMasOMenos.textoFinal = (p, _g, ctx) => [...p.jugadores].sort((a, b) => p.puntos[b] - p.puntos[a]).map((j) => `${ctx?.nombreDe?.(j) ?? j} ${p.puntos[j]}`).join(' · ');
JuegoMasOMenos.claveTurno = (p) => (p.fase === 'pregunta' ? `mo-${p.numero}` : null);
