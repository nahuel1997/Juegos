import { useEffect, useMemo, useState } from 'react';
import { Cartel, useEfecto } from '../../efectos.jsx';
import { tono } from '../../sonido.js';

export const COLORES_SIMON = [
  { color: '#e53935', luz: '#ff8a80', nota: 329.6 },
  { color: '#1e88e5', luz: '#82b1ff', nota: 392 },
  { color: '#43a047', luz: '#b9f6ca', nota: 523.3 },
  { color: '#fdd835', luz: '#ffff8d', nota: 659.3 },
  { color: '#8e24aa', luz: '#ea80fc', nota: 784 },
  { color: '#fb8c00', luz: '#ffd180', nota: 880 },
];

export default function JuegoSimon({ partida, accion, ctx }) {
  const p = partida;
  const n = p.config.colores;
  const desfase = useMemo(() => Date.now() - p.ahora, [p.ahora]);
  const [ahora, setAhora] = useState(Date.now());
  const [toque, setToque] = useState(null);
  const mostrando = p.fase === 'mostrando' && p.secuencia;
  useEffect(() => {
    if (p.fase !== 'mostrando' && p.fase !== 'repitiendo') return;
    const t = setInterval(() => setAhora(Date.now()), 60);
    return () => clearInterval(t);
  }, [p.fase, p.largo]);

  // Qué color está encendido mientras se muestra la secuencia.
  const t = ahora - desfase - p.inicio;
  const idx = mostrando && t >= 0 ? Math.floor(t / p.paso) : -1;
  const encendido = mostrando && idx >= 0 && idx < p.secuencia.length && t % p.paso < p.paso * 0.7 ? p.secuencia[idx] : null;
  useEffect(() => { if (encendido !== null) tono(COLORES_SIMON[encendido].nota, p.paso / 1000 * 0.6); }, [encendido, idx, p.paso]);

  const puedo = p.estado === 'jugando' && p.fase === 'repitiendo' && p.situacion.yo === 'jugando';
  const tocar = (i) => {
    if (!puedo) return;
    tono(COLORES_SIMON[i].nota, 0.25);
    setToque(i);
    setTimeout(() => setToque(null), 180);
    accion('tocar', { color: i });
  };

  const fin = useEfecto(p.fase === 'fin' ? `f${p.partida}` : null, () => ({ r: p.resultado }), 2200);
  const restante = p.fase === 'repitiendo' && p.hasta ? Math.max(0, Math.ceil((p.hasta - (ahora - desfase)) / 1000)) : null;

  let estado;
  if (p.fase === 'mostrando') estado = 'Mirá la secuencia…';
  else if (p.fase === 'repitiendo') estado = p.situacion.yo === 'jugando' ? `¡Repetila! (${p.progreso.yo}/${p.largo})` : p.situacion.yo === 'ok' ? `¡Bien! Esperando a ${ctx.nombreRival}…` : 'Te equivocaste…';
  else estado = 'Fin de la partida';

  return (
    <div className="simon">
      {fin && <Cartel key={fin.id} texto={fin.r === 'yo' ? '¡Ganaste la partida!' : fin.r === 'rival' ? `Partida para ${ctx.nombreRival}` : 'Empate'} sub={`Llegaron a ${p.largo} colores`} tipo={fin.r === 'yo' ? 'oro' : ''} />}
      <div className="marcador">
        <span>Vos <b>{p.puntos.yo}</b></span>
        <span className="ronda">Partida {p.partida} de {p.config.partidas} · secuencia de {p.largo}{restante !== null ? ` · ${restante} s` : ''}</span>
        <span><b>{p.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${puedo ? 'tu-turno' : ''}`}>
        {estado}
        <small>{ctx.nombreRival}: {p.situacion.rival === 'ok' ? 'la completó' : p.situacion.rival === 'error' ? 'se equivocó' : p.situacion.rival === 'tiempo' ? 'se quedó sin tiempo' : `${p.progreso.rival}/${p.largo}`}</small>
      </div>
      <div className={`sm-tablero n${n} ${puedo ? 'activo' : ''}`}>
        {COLORES_SIMON.slice(0, n).map((c, i) => (
          <button
            key={i}
            type="button"
            className={`sm-boton ${encendido === i || toque === i ? 'luz' : ''}`}
            style={{ '--c': c.color, '--luz': c.luz }}
            onPointerDown={(e) => { e.preventDefault(); tocar(i); }}
            disabled={!puedo}
            aria-label={`Color ${i + 1}`}
          />
        ))}
        <div className="sm-centro">{p.fase === 'mostrando' ? 'Mirá' : puedo ? '¡Ya!' : p.largo}</div>
      </div>
      <div className="sm-progreso">
        {Array.from({ length: p.largo }, (_, i) => <i key={i} className={i < p.progreso.yo ? 'ok' : ''} />)}
      </div>
      {p.fase === 'fin' && p.estado === 'jugando' && (
        <div className="acciones centro">
          <button className="btn" disabled={p.listosSiguiente.includes('yo')} onClick={() => accion('siguiente')}>{p.listosSiguiente.includes('yo') ? `Esperando a ${ctx.nombreRival}…` : 'Otra partida →'}</button>
        </div>
      )}
    </div>
  );
}

JuegoSimon.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoSimon.claveTurno = (p) => (p.fase === 'repitiendo' && p.situacion.yo === 'jugando' ? `sm-${p.partida}-${p.largo}` : null);
