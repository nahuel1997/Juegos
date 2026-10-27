// Animaciones compartidas por los juegos: explosiones, salpicaduras, fuego y papel picado. Todo SVG propio.
import { useEffect, useRef, useState } from 'react';

// Devuelve un efecto que dura `ms` cada vez que cambia `clave` (nunca al montar: al recargar
// no se repite la animación de una jugada vieja). `armar(clave)` decide qué efecto mostrar o null.
export function useEfecto(clave, armar, ms = 1600) {
  const [efecto, setEfecto] = useState(null);
  const previa = useRef(clave);
  useEffect(() => {
    if (clave === previa.current) return;
    previa.current = clave;
    const e = clave ? armar(clave) : null;
    if (!e) return;
    setEfecto({ ...e, id: Date.now() });
    const t = setTimeout(() => setEfecto(null), e.ms ?? ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  return efecto;
}

const azar = (a, b) => a + Math.random() * (b - a);

export function Explosion({ grande }) {
  const chispas = Array.from({ length: grande ? 16 : 10 }, (_, i) => (i / (grande ? 16 : 10)) * 360 + azar(-10, 10));
  return (
    <span className={`explosion ${grande ? 'grande' : ''}`} aria-hidden="true">
      <svg viewBox="-50 -50 100 100">
        <defs>
          <radialGradient id="bola-fuego">
            <stop offset="0" stopColor="#fffbe0" />
            <stop offset=".3" stopColor="#ffd54a" />
            <stop offset=".6" stopColor="#ff7a1a" />
            <stop offset=".85" stopColor="#d62828" />
            <stop offset="1" stopColor="#d62828" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="ex-onda" r="20" />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={`h${i}`} className="ex-humo" cx={azar(-14, 14)} cy={azar(-8, 6)} r={azar(9, 14)} style={{ animationDelay: `${0.25 + i * 0.06}s` }} />
        ))}
        <path className="ex-bola" d="M0-26l7 12 13-6-4 13 14 5-13 6 6 13-14-4-3 14-6-12-11 9 1-14-14 0 10-10-9-11 14 1 2-14z" fill="url(#bola-fuego)" />
        <circle className="ex-flash" r="14" />
        {chispas.map((a, i) => (
          <g key={i} transform={`rotate(${a})`}>
            <line className="ex-chispa" x1="10" y1="0" x2={azar(20, 30)} y2="0" style={{ animationDelay: `${azar(0, 0.08)}s` }} />
          </g>
        ))}
      </svg>
    </span>
  );
}

export function Salpicadura() {
  return (
    <span className="salpicadura" aria-hidden="true">
      <svg viewBox="-50 -50 100 100">
        <ellipse className="sp-anillo" rx="16" ry="16" />
        <ellipse className="sp-anillo dos" rx="16" ry="16" />
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={i} className="sp-gota" r={azar(2.5, 4)} style={{ '--dx': `${Math.cos((i / 8) * Math.PI * 2) * azar(18, 28)}px`, '--dy': `${Math.sin((i / 8) * Math.PI * 2) * azar(18, 28) - 10}px` }} />
        ))}
      </svg>
    </span>
  );
}

// Llamita que queda ardiendo en un barco tocado.
export function Llamita() {
  return (
    <span className="llamita" aria-hidden="true">
      <svg viewBox="0 0 40 50">
        <path className="ll-afuera" d="M20 2c4 10 14 14 14 28a14 14 0 0 1-28 0c0-8 5-11 6-18c3 4 4 6 4 9c3-6 4-12 4-19z" />
        <path className="ll-adentro" d="M20 22c2 5 7 7 7 14a7 7 0 0 1-14 0c0-4 3-6 3-9c2 2 3 3 3 5c1-3 1-6 1-10z" />
      </svg>
    </span>
  );
}

const COLORES = ['#ffd54a', '#ff4f9a', '#06d6a0', '#3a86ff', '#ff7a1a', '#ffffff', '#b388ff'];

export function Confeti({ cantidad = 80 }) {
  const [piezas] = useState(() =>
    Array.from({ length: cantidad }, () => ({
      x: azar(0, 100), d: azar(1.8, 3.4), r: azar(0, 0.8), giro: azar(360, 1080) * (Math.random() < 0.5 ? -1 : 1),
      deriva: azar(-80, 80), color: COLORES[Math.floor(Math.random() * COLORES.length)], forma: Math.random() < 0.3 ? 'redondo' : '',
    })),
  );
  return (
    <div className="confeti" aria-hidden="true">
      {piezas.map((p, i) => (
        <i key={i} className={p.forma} style={{ left: `${p.x}%`, background: p.color, animationDuration: `${p.d}s`, animationDelay: `${p.r}s`, '--giro': `${p.giro}deg`, '--deriva': `${p.deriva}px` }} />
      ))}
    </div>
  );
}

// Cartel grande que entra de golpe en el medio de la pantalla.
export function Cartel({ texto, sub, tipo = '', retraso = 0 }) {
  return (
    <div className={`cartel-grande ${tipo}`} style={retraso ? { animationDelay: `${retraso}s` } : undefined} aria-live="polite">
      <b>{texto}</b>
      {sub && <small>{sub}</small>}
    </div>
  );
}
