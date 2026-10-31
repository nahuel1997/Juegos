import { useEffect, useRef, useState } from 'react';
import { MarcadorN, useFalta } from '../../componentes/comunes.jsx';
import { Picto, PICTOS } from '../emojis/pictos.jsx';
import { useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';
import { SIN_AUTOCORRECTOR } from '../../tecladoNativo.js';

const RUEDA = Object.keys(PICTOS).filter((_, i) => i % 3 === 0).slice(0, 18);

export default function JuegoRuletaEmojis({ partida, accion, ctx }) {
  const p = partida;
  const falta = useFalta(p.totalMs, `${p.numero}-${p.fase}`);
  const seg = falta == null ? null : Math.ceil(falta / 1000);
  const [texto, setTexto] = useState('');
  const [mal, setMal] = useState(false);
  const campo = useRef(null);
  const abierta = p.fase === 'adivinando' || p.fase === 'pista';
  const loSaque = p.acertaron.includes(ctx.yo);
  const puedo = p.estado === 'jugando' && abierta && !loSaque && !p.fuera.includes(ctx.yo);
  const revelado = p.fase === 'revelado' || p.estado === 'terminada';
  useEffect(() => { setTexto(''); }, [p.numero]);
  useEffect(() => { if (abierta && !loSaque) setTimeout(() => campo.current?.focus(), 30); }, [abierta, loSaque]);
  useEfecto(loSaque ? `re-${p.numero}` : null, () => { efectoSonido.ganar?.(); return {}; }, 100);

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

  // Rayitas por palabra (con la primera letra cuando ya se ve).
  let letra = 0;
  const rayitas = p.largos.map((n, k) => (
    <span key={k} className="re-palabra">
      {Array.from({ length: n }, (_, i) => {
        const primera = letra === 0 && i === 0 && p.primera;
        letra++;
        return <i key={i}>{p.respuesta ? p.respuesta.split(' ')[k]?.[i] : primera ? p.primera : ''}</i>;
      })}
    </span>
  ));

  return (
    <div className="re">
      <MarcadorN jugadores={p.jugadores} puntos={p.puntos} ctx={ctx} fuera={p.fuera} extra={`Ronda ${p.numero} de ${p.total}`} />
      <div className={`estado-cinta ${puedo ? 'tu-turno' : ''}`}>
        {p.fase === 'girando' ? '¡Gira la ruleta!' : abierta ? (loSaque ? '¡La sacaste! Esperá a los demás…' : `¿Qué palabra o frase es? ${seg ?? ''} s`) : `Era: ${p.respuesta}`}
        <small>Pista: {p.pista}{p.acertaron.length ? ` · la sacaron: ${p.acertaron.map(ctx.nombreDe).join(', ')}` : ''}</small>
      </div>
      <div className="re-mesa">
        {p.fase === 'girando' ? (
          <div className="re-ruleta" aria-hidden="true">
            {RUEDA.map((id, i) => (
              <span key={id} style={{ transform: `rotate(${(i * 360) / RUEDA.length}deg) translateY(-120px)` }}><Picto id={id} tam={36} /></span>
            ))}
            <b className="re-aguja" />
          </div>
        ) : (
          <div className="re-combo">
            {p.pictos?.map((id, i) => (
              <span key={i} className="re-picto" style={{ animationDelay: `${i * 0.15}s` }}>
                {i > 0 && <b className="re-mas">+</b>}
                <Picto id={id} tam={84} />
              </span>
            ))}
          </div>
        )}
        {p.fase !== 'girando' && <div className="re-rayitas">{rayitas}</div>}
      </div>
      {abierta && (
        <form className={`re-form ${mal ? 'mal' : ''}`} onSubmit={probar}>
          <input ref={campo} value={texto} onChange={(e) => setTexto(e.target.value.slice(0, 60))} disabled={!puedo} placeholder={loSaque ? '¡Bien!' : 'Escribí tu respuesta'} {...SIN_AUTOCORRECTOR} aria-label="Respuesta" />
          <button className="btn" disabled={!puedo || !texto.trim()}>Probar</button>
        </form>
      )}
      {revelado && <p className="re-era">Era <b>{p.respuesta}</b></p>}
    </div>
  );
}

JuegoRuletaEmojis.textoFinal = (p, _g, ctx) => [...p.jugadores].sort((a, b) => p.puntos[b] - p.puntos[a]).map((j) => `${ctx?.nombreDe?.(j) ?? j} ${p.puntos[j]}`).join(' · ');
JuegoRuletaEmojis.claveTurno = (p) => (p.fase === 'adivinando' ? `re-${p.numero}` : null);
