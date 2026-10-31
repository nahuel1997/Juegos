import { useEffect, useMemo, useState } from 'react';
import { Cartel, Confeti, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

export const COLORES_BOTELLA = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#00acc1', '#ec407a', '#6d4c41', '#7cb342'];

function Botella({ capas, capacidad, elegida, onClick, chica, completa }) {
  return (
    <button type="button" className={`bt-botella ${elegida ? 'elegida' : ''} ${chica ? 'chica' : ''} ${completa ? 'completa' : ''}`} onClick={onClick} disabled={!onClick} aria-label={`Botella con ${capas.length} de ${capacidad}`}>
      <span className="bt-vidrio" style={{ '--capacidad': capacidad }}>
        {capas.map((col, k) => (
          <span key={k} className={`bt-capa ${col === null ? 'oculta' : ''}`} style={col === null ? undefined : { background: COLORES_BOTELLA[col] }}>
            {col === null && '?'}
          </span>
        ))}
      </span>
    </button>
  );
}

const llena = (x, cap) => x.length === cap && x.every((y) => y !== null && y === x[0]);

export default function JuegoBotellas({ partida, accion, ctx }) {
  const p = partida;
  const [sel, setSel] = useState(null);
  const jugando = p.estado === 'jugando' && p.fase === 'jugando';
  useEffect(() => setSel(null), [p.movidas, p.ronda]);

  // Cronómetro de la ronda.
  const desfase = useMemo(() => Date.now() - p.ahora, [p.ahora]);
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    if (!jugando) return;
    const t = setInterval(() => setAhora(Date.now()), 500);
    return () => clearInterval(t);
  }, [jugando]);
  const segundos = Math.max(0, Math.floor((ahora - desfase - p.inicio) / 1000));

  useEfecto(p.movidas ? `m${p.movidas}` : null, () => { efectoSonido.agua?.(); return null; });
  const fin = useEfecto(p.fase === 'fin' ? `f${p.ronda}` : null, () => {
    if (p.resultado === 'yo') efectoSonido.fanfarria?.();
    return { r: p.resultado };
  }, 2400);

  const tocar = (i) => {
    if (!jugando) return;
    if (sel === null) { if (p.botellas[i].length) setSel(i); return; }
    if (sel === i) { setSel(null); return; }
    accion('volcar', { de: sel, a: i });
    setSel(null);
  };

  const total = p.config.colores;
  const listo = p.listosSiguiente.includes('yo');
  return (
    <div className="botellas">
      {fin && <Cartel key={fin.id} texto={fin.r === 'yo' ? '¡Ordenaste todo primero!' : `¡${ctx.nombreRival} terminó primero!`} tipo={fin.r === 'yo' ? 'oro' : 'hundido'} />}
      {fin?.r === 'yo' && <Confeti />}
      <div className="marcador">
        <span>Vos <b>{p.puntos.yo}</b></span>
        <span className="ronda">Ronda {p.ronda} de {p.config.rondas} · {Math.floor(segundos / 60)}:{String(segundos % 60).padStart(2, '0')}</span>
        <span><b>{p.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${jugando ? 'tu-turno' : ''}`}>
        {p.fase === 'fin' ? 'Fin de la ronda' : sel === null ? 'Tocá una botella para levantarla' : 'Ahora tocá dónde volcarla'}
        <small>Vos: {p.completas}/{total} listas · {ctx.nombreRival}: {p.rival.completas}/{total} ({p.rival.movidas} movidas)</small>
      </div>
      <div className="bt-progreso" aria-hidden="true">
        <span style={{ width: `${(p.completas / total) * 100}%` }} className="bt-yo" />
        <span style={{ width: `${(p.rival.completas / total) * 100}%` }} className="bt-rival" />
      </div>
      <div className="bt-estante">
        {p.botellas.map((capas, i) => (
          <Botella key={i} capas={capas} capacidad={p.capacidad} elegida={sel === i} completa={llena(capas, p.capacidad)} onClick={jugando ? () => tocar(i) : undefined} />
        ))}
      </div>
      {jugando && (
        <div className="acciones centro">
          <button className="btn chico fantasma" disabled={!p.puedeDeshacer} onClick={() => accion('deshacer')}>Deshacer</button>
          <button className="btn chico fantasma" onClick={() => accion('reiniciar')}>Empezar de nuevo</button>
          <button className="btn chico fantasma" onClick={() => { if (window.confirm('¿Te rendís? La ronda es para el otro.')) accion('rendirse'); }}>Me rindo</button>
        </div>
      )}
      {p.fase === 'fin' && p.botellasRival && (
        <div className="bt-rival-final">
          <small>Así quedó lo de {ctx.nombreRival}:</small>
          <div className="bt-estante chico">{p.botellasRival.map((capas, i) => <Botella key={i} capas={capas} capacidad={p.capacidad} chica />)}</div>
        </div>
      )}
      {p.fase === 'fin' && p.estado === 'jugando' && (
        <div className="acciones centro">
          <button className="btn" disabled={listo} onClick={() => accion('siguiente')}>{listo ? `Esperando a ${ctx.nombreRival}…` : 'Otra mezcla →'}</button>
        </div>
      )}
    </div>
  );
}

JuegoBotellas.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoBotellas.claveTurno = (p) => (p.fase === 'jugando' && p.estado === 'jugando' ? `bt-${p.ronda}` : null);
