import { useEffect, useRef, useState } from 'react';
import { MarcadorN, useFalta } from '../../componentes/comunes.jsx';
import { useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';
import { SIN_AUTOCORRECTOR } from '../../tecladoNativo.js';

export default function JuegoAdivina({ partida, accion, ctx }) {
  const p = partida;
  const falta = useFalta(p.faltaMs, `${p.numero}-${p.fase}-${p.pista}`);
  const seg = falta == null ? null : Math.ceil(falta / 1000);
  const [texto, setTexto] = useState('');
  const [mal, setMal] = useState(false);
  const campo = useRef(null);
  const loSaque = p.acertaron.some((a) => a.j === ctx.yo);
  const puedo = p.estado === 'jugando' && p.fase === 'pistas' && !loSaque && !p.fuera.includes(ctx.yo);
  const revelado = p.fase === 'revelado' || p.estado === 'terminada';
  useEffect(() => { setTexto(''); }, [p.numero]);
  useEffect(() => { if (puedo) setTimeout(() => campo.current?.focus(), 30); }, [puedo, p.numero]);
  useEfecto(loSaque ? `ad-${p.numero}` : null, () => { efectoSonido.ganar?.(); return {}; }, 100);

  const probar = async (e) => {
    e.preventDefault();
    if (!puedo || !texto.trim()) return;
    const r = await accion('adivinar', { texto });
    if (r && r.acierto === false) {
      setMal(true);
      setTimeout(() => setMal(false), 600);
    }
    setTexto('');
  };

  return (
    <div className="ad">
      <MarcadorN jugadores={p.jugadores} puntos={p.puntos} ctx={ctx} fuera={p.fuera} extra={`Ronda ${p.numero} de ${p.total}`} />
      <div className={`estado-cinta ${puedo ? 'tu-turno' : ''}`}>
        <span className="ad-cat">{p.categoria}</span>
        {p.fase === 'cuenta' ? 'Preparate…' : p.fase === 'pistas' ? (loSaque ? '¡La sacaste! Esperá a los demás…' : `Pista ${p.pista} de 5 · vale ${6 - p.pista}`) : ''}
        <small>{p.fase === 'pistas' && seg != null ? `Próxima pista en ${seg} s` : ''}</small>
      </div>
      <ol className="ad-pistas">
        {p.pistas.map((t, i) => (
          <li key={i} className={i === p.pistas.length - 1 && p.fase === 'pistas' ? 'nueva' : ''}><b>{i + 1}</b> {t}</li>
        ))}
        {Array.from({ length: Math.max(0, 5 - p.pistas.length) }, (_, i) => <li key={`v${i}`} className="vacia"><b>{p.pistas.length + i + 1}</b> …</li>)}
      </ol>
      {p.fase === 'pistas' && (
        <form className={`re-form ${mal ? 'mal' : ''}`} onSubmit={probar}>
          <input ref={campo} value={texto} onChange={(e) => setTexto(e.target.value.slice(0, 60))} disabled={!puedo} placeholder={loSaque ? `¡Bien! Era ${p.respuesta}` : '¿Qué es?'} {...SIN_AUTOCORRECTOR} aria-label="Respuesta" />
          <button className="btn" disabled={!puedo || !texto.trim()}>Probar</button>
        </form>
      )}
      {p.errados.length > 0 && !loSaque && p.fase === 'pistas' && <p className="ayuda centro">Probaste: {p.errados.join(', ')}</p>}
      {(p.acertaron.length > 0 || revelado) && (
        <ul className="mo-respuestas">
          {p.acertaron.map((a, i) => <li key={a.j} className="bien">{ctx.nombreDe(a.j)} la sacó con la pista {a.pista}{i === 0 ? ' (¡el primero!)' : ''}</li>)}
        </ul>
      )}
      {revelado && <p className="re-era">Era <b>{p.respuesta}</b></p>}
    </div>
  );
}

JuegoAdivina.textoFinal = (p, _g, ctx) => [...p.jugadores].sort((a, b) => p.puntos[b] - p.puntos[a]).map((j) => `${ctx?.nombreDe?.(j) ?? j} ${p.puntos[j]}`).join(' · ');
JuegoAdivina.claveTurno = (p) => (p.fase === 'pistas' && p.pista === 1 ? `ad-${p.numero}` : null);
