import { useEffect, useMemo, useRef, useState } from 'react';
import { Cartel, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

const TECLAS = {
  ArrowUp: 'arriba', ArrowDown: 'abajo', ArrowLeft: 'izquierda', ArrowRight: 'derecha',
  w: 'arriba', s: 'abajo', a: 'izquierda', d: 'derecha', W: 'arriba', S: 'abajo', A: 'izquierda', D: 'derecha',
};
const FLECHA = { arriba: 'M12 5l7 9H5z', abajo: 'M12 19l7-9H5z', izquierda: 'M5 12l9-7v14z', derecha: 'M19 12l-9-7v14z' };

export default function JuegoTron({ partida, accion, ctx }) {
  const p = partida;
  const lienzo = useRef(null);
  const toque = useRef(null);
  const jugando = p.estado === 'jugando' && p.fase === 'jugando';
  const colorYo = ctx.colorYo || '#ff4f9a';
  const colorRival = ctx.colorRival && ctx.colorRival !== ctx.colorYo ? ctx.colorRival : '#4fc3f7';

  // Cuenta regresiva local.
  const recibido = useMemo(() => Date.now(), [p]);
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    if (p.fase !== 'cuenta') return;
    const t = setInterval(() => setAhora(Date.now()), 100);
    return () => clearInterval(t);
  }, [p.fase, p.ronda]);
  const cuenta = p.fase === 'cuenta' ? Math.max(1, Math.ceil((p.faltaMs - (ahora - recibido)) / 1000)) : null;

  const girar = (dir) => accion('girar', { dir });

  useEffect(() => {
    const tecla = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const dir = TECLAS[e.key];
      if (!dir) return;
      e.preventDefault();
      girar(dir);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  // Dibujo de la pista.
  useEffect(() => {
    const cv = lienzo.current;
    if (!cv) return;
    const celda = 14;
    cv.width = p.ancho * celda;
    cv.height = p.alto * celda;
    const g = cv.getContext('2d');
    g.fillStyle = '#0b1026';
    g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = 'rgba(120,160,255,.08)';
    g.lineWidth = 1;
    for (let x = 0; x <= p.ancho; x++) { g.beginPath(); g.moveTo(x * celda + 0.5, 0); g.lineTo(x * celda + 0.5, cv.height); g.stroke(); }
    for (let y = 0; y <= p.alto; y++) { g.beginPath(); g.moveTo(0, y * celda + 0.5); g.lineTo(cv.width, y * celda + 0.5); g.stroke(); }
    const pintar = (rastro, color) => {
      g.shadowColor = color;
      g.shadowBlur = 8;
      g.fillStyle = color;
      for (const i of rastro) g.fillRect((i % p.ancho) * celda + 2, Math.floor(i / p.ancho) * celda + 2, celda - 4, celda - 4);
      const u = rastro[rastro.length - 1];
      if (u !== undefined) {
        g.fillStyle = '#fff';
        g.fillRect((u % p.ancho) * celda + 3, Math.floor(u / p.ancho) * celda + 3, celda - 6, celda - 6);
      }
      g.shadowBlur = 0;
    };
    pintar(p.rastros.rival, colorRival);
    pintar(p.rastros.yo, colorYo);
    for (const [x, y] of p.choque || []) {
      g.strokeStyle = '#ffd60a';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x * celda + celda / 2, y * celda + celda / 2, celda, 0, Math.PI * 2);
      g.stroke();
    }
  }, [p, colorYo, colorRival]);

  const fin = useEfecto(p.fase === 'fin' ? `r${p.ronda}` : null, () => {
    efectoSonido.explosion?.();
    return { r: p.resultado };
  }, 2200);

  const empezarToque = (e) => { const t = e.touches[0]; toque.current = [t.clientX, t.clientY]; };
  const moverToque = (e) => {
    if (!toque.current) return;
    const t = e.touches[0];
    const dx = t.clientX - toque.current[0]; const dy = t.clientY - toque.current[1];
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    girar(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'derecha' : 'izquierda') : (dy > 0 ? 'abajo' : 'arriba'));
    toque.current = [t.clientX, t.clientY];
  };

  return (
    <div className="tron">
      {fin && <Cartel key={fin.id} texto={fin.r === 'yo' ? '¡Ganaste la ronda!' : fin.r === 'rival' ? `Ronda para ${ctx.nombreRival}` : '¡Choque! Empate'} tipo={fin.r === 'yo' ? 'oro' : 'hundido'} />}
      <div className="marcador">
        <span><i className="tn-punto" style={{ background: colorYo }} /> Vos <b>{p.puntos.yo}</b></span>
        <span className="ronda">Ronda {p.ronda} de {p.config.rondas}</span>
        <span><b>{p.puntos.rival}</b> {ctx.nombreRival} <i className="tn-punto" style={{ background: colorRival }} /></span>
      </div>
      <div className="tn-pista" onTouchStart={empezarToque} onTouchMove={moverToque} onTouchEnd={() => { toque.current = null; }}>
        <canvas ref={lienzo} className="tn-lienzo" />
        {cuenta && <div className="tn-cuenta" key={cuenta}>{cuenta}</div>}
      </div>
      <div className="tn-botones" aria-label="Dirección">
        {['arriba', 'izquierda', 'abajo', 'derecha'].map((d) => (
          <button key={d} type="button" className={`btn fantasma tn-${d}`} onClick={() => girar(d)} disabled={!jugando && p.fase !== 'cuenta'} aria-label={d}>
            <svg viewBox="0 0 24 24" width="26" height="26"><path d={FLECHA[d]} fill="currentColor" /></svg>
          </button>
        ))}
      </div>
    </div>
  );
}

JuegoTron.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoTron.claveTurno = (p) => (p.fase === 'cuenta' ? `tn-${p.ronda}` : null);
