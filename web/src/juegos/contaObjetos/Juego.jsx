import { useEffect, useRef, useState } from 'react';
import { MarcadorN, useFalta } from '../../componentes/comunes.jsx';
import { Picto } from '../emojis/pictos.jsx';
import { useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

export default function JuegoContaObjetos({ partida, accion, ctx }) {
  const p = partida;
  const falta = useFalta(p.faltaMs, `${p.numero}-${p.fase}`, 100);
  const seg = falta == null ? null : Math.ceil(falta / 1000);
  const [n, setN] = useState('');
  const campo = useRef(null);
  useEffect(() => { setN(''); }, [p.numero]);
  useEffect(() => {
    if (p.fase === 'respondiendo') setTimeout(() => campo.current?.focus(), 30);
  }, [p.fase]);
  const puedo = p.estado === 'jugando' && p.fase === 'respondiendo' && p.mia === null && !p.fuera.includes(ctx.yo);
  const revelado = p.fase === 'revelado' || p.estado === 'terminada';
  const [, varios] = p.nombres;
  const r = p.resultado;
  useEfecto(revelado && r ? `cn-${p.numero}` : null, () => {
    if (r.exactos.includes(ctx.yo)) efectoSonido.ganar?.();
    return {};
  }, 100);
  const responder = (e) => {
    e?.preventDefault();
    if (!puedo || n === '') return;
    accion('responder', { n: Number(n) });
  };
  const sumar = (d) => setN((x) => String(Math.max(0, Math.min(99, (Number(x) || 0) + d))));

  return (
    <div className="cn">
      <MarcadorN jugadores={p.jugadores} puntos={p.puntos} ctx={ctx} fuera={p.fuera} extra={`Pregunta ${p.numero} de ${p.total}`} />
      <div className={`estado-cinta ${puedo ? 'tu-turno' : ''}`}>
        <span className="con-iconos">Contá {varios}: <Picto id={p.objetivo} tam={30} /></span>
        <small>
          {p.fase === 'cuenta' ? '¡Atento! Ya aparecen…' : p.fase === 'mirando' ? `¡Contá! ${seg ?? ''}` : p.fase === 'respondiendo' ? `${p.respondieron.length} de ${p.jugadores.length - p.fuera.length} respondieron · ${seg ?? ''} s` : ''}
        </small>
      </div>
      <div className={`cn-escena ${p.fase}`}>
        {p.fase === 'cuenta' && (
          <div className="cn-aviso">
            <Picto id={p.objetivo} tam={110} />
            <b>Contá {varios}</b>
          </div>
        )}
        {p.escena?.map((x, i) => (
          <span key={i} className={`cn-cosa ${revelado && x.p === p.objetivo ? 'es' : ''} ${revelado && x.p !== p.objetivo ? 'no' : ''}`} style={{ left: `${x.x}%`, top: `${x.y}%`, transform: `translate(-50%, -50%) rotate(${x.g}deg) scale(${x.t})` }}>
            <Picto id={x.p} tam={44} />
          </span>
        ))}
        {p.fase === 'respondiendo' && (
          <form className="cn-responder" onSubmit={responder}>
            <b>Cantidad de {varios}:</b>
            <div className="cn-numero">
              <button type="button" className="btn fantasma" onClick={() => sumar(-1)} disabled={!puedo} aria-label="Uno menos">−</button>
              <input ref={campo} type="number" inputMode="numeric" min={0} max={99} value={p.mia ?? n} onChange={(e) => setN(e.target.value.slice(0, 2))} disabled={!puedo} aria-label="Cantidad" />
              <button type="button" className="btn fantasma" onClick={() => sumar(1)} disabled={!puedo} aria-label="Uno más">+</button>
            </div>
            <button className="btn" disabled={!puedo || n === ''}>{p.mia !== null ? 'Listo, esperando…' : 'Responder'}</button>
          </form>
        )}
        {revelado && p.cantidad != null && <b className="cn-total">Había {p.cantidad}</b>}
      </div>
      {revelado && r && (
        <ul className="mo-respuestas">
          {p.jugadores.filter((j) => !p.fuera.includes(j)).map((j) => {
            const dijo = p.respuestas[j];
            const clase = r.exactos.includes(j) ? 'bien' : r.cerca.includes(j) ? 'cerca' : 'mal';
            return <li key={j} className={clase}>{ctx.nombreDe(j)}: {dijo ?? 'no respondió'}{r.primero === j ? ' · ¡el primero!' : ''}</li>;
          })}
        </ul>
      )}
    </div>
  );
}

JuegoContaObjetos.textoFinal = (p, _g, ctx) => [...p.jugadores].sort((a, b) => p.puntos[b] - p.puntos[a]).map((j) => `${ctx?.nombreDe?.(j) ?? j} ${p.puntos[j]}`).join(' · ');
JuegoContaObjetos.claveTurno = (p) => (p.fase === 'cuenta' ? `cn-${p.numero}` : null);
