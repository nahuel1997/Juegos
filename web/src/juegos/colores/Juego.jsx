import { useEffect, useMemo, useState } from 'react';
import { Cartel, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

export const TINTAS = { rojo: '#e53935', azul: '#1e88e5', verde: '#2e9d3a', amarillo: '#f2c200', violeta: '#8e24aa', naranja: '#fb8c00' };

export default function JuegoColores({ partida, accion, ctx }) {
  const p = partida;
  const desfase = useMemo(() => Date.now() - p.ahora, [p.ahora]);
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    if (p.estado !== 'jugando') return;
    const t = setInterval(() => setAhora(Date.now()), 100);
    return () => clearInterval(t);
  }, [p.estado]);
  const restante = p.hasta ? Math.max(0, (p.hasta - (ahora - desfase)) / 1000) : 0;
  const puedo = p.fase === 'carta' && !p.bloqueado;

  const gano = useEfecto(p.fase === 'pausa' ? `c${p.numero}` : null, () => {
    if (p.ganoCarta === 'yo') efectoSonido.ganar?.();
    return { g: p.ganoCarta, ms: p.ms };
  }, 1200);

  const c = p.carta;
  return (
    <div className="colores">
      {gano && <Cartel key={gano.id} texto={gano.g === 'yo' ? '¡Tuya!' : gano.g === 'rival' ? `Para ${ctx.nombreRival}` : 'Nadie'} sub={gano.ms ? `${(gano.ms / 1000).toFixed(2)} s` : ''} tipo={gano.g === 'yo' ? 'oro' : ''} />}
      <div className="marcador">
        <span>Vos <b>{p.puntos.yo}</b></span>
        <span className="ronda">Carta {Math.max(1, p.numero)} de {p.total}</span>
        <span><b>{p.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`co-carta ${p.fase}`}>
        {p.fase === 'cuenta' && <b className="co-cuenta">{Math.max(1, Math.ceil(restante))}</b>}
        {c && (
          <>
            <span className={`co-pide ${c.pide}`}>{c.pide === 'tinta' ? '¿De qué COLOR está pintada?' : '¿Qué DICE?'}</span>
            <b className="co-palabra" style={{ color: TINTAS[p.colores[c.tinta]] }}>{p.colores[c.palabra].toUpperCase()}</b>
            {p.fase === 'carta' && <span className="co-tiempo"><i style={{ width: `${(restante / 5) * 100}%` }} /></span>}
          </>
        )}
        {p.estado === 'terminada' && <b className="co-fin">¡Terminó!</b>}
      </div>
      <div className="estado-cinta">
        {p.bloqueado ? 'Le erraste: esperá la próxima' : p.fase === 'carta' ? '¡Rápido!' : p.fase === 'cuenta' ? 'Preparate…' : ' '}
        {p.rivalBloqueado && <small>{ctx.nombreRival} le erró</small>}
      </div>
      <div className={`co-botones n${p.colores.length}`}>
        {p.colores.map((nombre, i) => (
          <button key={nombre} type="button" className="co-boton" style={{ '--c': TINTAS[nombre] }} disabled={!puedo} onPointerDown={(e) => { e.preventDefault(); if (puedo) accion('responder', { color: i }); }}>
            <i />{nombre}
          </button>
        ))}
      </div>
      <div className="co-historial">
        {p.historial.map((h, i) => <i key={i} className={h === 'yo' ? 'mio' : h === 'rival' ? 'suyo' : ''} />)}
      </div>
    </div>
  );
}

JuegoColores.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoColores.claveTurno = (p) => (p.fase === 'cuenta' ? 'co-inicio' : null);
