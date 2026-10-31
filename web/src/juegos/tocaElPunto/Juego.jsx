import { useEffect, useRef, useState } from 'react';
import { MarcadorN, useFalta } from '../../componentes/comunes.jsx';
import { tono } from '../../sonido.js';
import { objetivo } from '../../../../api/src/juegos/tocaElPunto.js';

export default function JuegoTocaElPunto({ partida, accion, ctx }) {
  const p = partida;
  const falta = useFalta(p.faltaMs, `${p.ronda}-${p.fase}`, 100);
  const jugando = p.estado === 'jugando' && p.fase === 'jugando' && !p.fuera.includes(ctx.yo);
  // Cuenta propia (sin esperar al server, para que no se trabe): nunca menos que lo que dice el server.
  const [mios, setMios] = useState(0);
  const [errores, setErrores] = useState(0);
  const [estallido, setEstallido] = useState(null);
  useEffect(() => { setMios(0); setErrores(0); }, [p.ronda]);
  const aciertos = Math.max(mios, p.aciertos[ctx.yo] || 0);
  const obj = objetivo(p.semilla, aciertos, p.config.tamanio);
  const zona = useRef(null);

  const tocar = (e) => {
    e.preventDefault();
    if (!jugando) return;
    const caja = zona.current.getBoundingClientRect();
    const x = (e.clientX - caja.left) / caja.width;
    const y = (e.clientY - caja.top) / caja.height; // la zona es cuadrada
    const dentro = Math.hypot(x - obj.x, y - obj.y) <= obj.r * 1.15;
    if (dentro) {
      tono(660 + (aciertos % 8) * 60, 0.06);
      setEstallido({ x: obj.x, y: obj.y, n: aciertos });
      setMios(aciertos + 1);
      accion('tocar', { i: aciertos });
    } else {
      setErrores((n) => n + 1);
      accion('errar');
    }
  };

  const segundos = falta == null ? null : Math.ceil(falta / 1000);
  const ultima = p.historial[p.historial.length - 1];
  const finRonda = p.fase === 'fin-ronda' || (p.estado === 'terminada' && ultima);
  const puntosVivos = Object.fromEntries(p.jugadores.map((j) => [j, j === ctx.yo ? aciertos : p.aciertos[j]]));

  return (
    <div className="tp">
      <MarcadorN jugadores={p.jugadores} puntos={p.puntos} ctx={ctx} fuera={p.fuera} extra={`Ronda ${p.ronda} de ${p.config.rondas}`} />
      <div className={`estado-cinta ${jugando ? 'tu-turno' : ''}`}>
        {p.fase === 'cuenta' ? 'Preparate…' : jugando ? `¡Tocá los círculos! ${segundos ?? ''} s` : finRonda ? 'Fin de la ronda' : ''}
        <small>
          {p.jugadores.filter((j) => !p.fuera.includes(j)).map((j) => `${ctx.nombreDe(j)}: ${puntosVivos[j]}`).join(' · ')}
          {jugando && errores > 0 ? ` · le erraste ${errores}` : ''}
        </small>
      </div>
      <div className="tp-zona" ref={zona} onPointerDown={tocar} role="application" aria-label="Zona de juego: tocá los círculos">
        {jugando && (
          <span
            key={aciertos}
            className="tp-objetivo"
            style={{ left: `${obj.x * 100}%`, top: `${obj.y * 100}%`, width: `${obj.r * 200}%` }}
          />
        )}
        {estallido && <span key={`e${estallido.n}`} className="tp-estallido" style={{ left: `${estallido.x * 100}%`, top: `${estallido.y * 100}%` }} />}
        {p.fase === 'cuenta' && segundos != null && <b className="tp-cuenta" key={segundos}>{segundos}</b>}
        {finRonda && ultima && (
          <div className="tp-resumen">
            <h3>{ultima.mejores.includes(ctx.yo) ? '¡Ganaste la ronda!' : ultima.mejores.length ? `Ronda para ${ultima.mejores.map(ctx.nombreDe).join(' y ')}` : 'Nadie tocó nada'}</h3>
            <ol>
              {Object.entries(ultima.aciertos).sort((a, b) => b[1] - a[1]).map(([j, n]) => <li key={j}>{ctx.nombreDe(j)}: <b>{n}</b></li>)}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

JuegoTocaElPunto.textoFinal = (p, _g, ctx) => [...p.jugadores].sort((a, b) => p.puntos[b] - p.puntos[a]).map((j) => `${ctx?.nombreDe?.(j) ?? j} ${p.puntos[j]}`).join(' · ');
JuegoTocaElPunto.claveTurno = (p) => (p.fase === 'cuenta' ? `tp-${p.ronda}` : null);
