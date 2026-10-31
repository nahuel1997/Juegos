// Piezas chicas que usan varias pantallas.
import { useEffect, useState } from 'react';

export function Avatar({ usuario, tam = 36 }) {
  if (!usuario) return null;
  return (
    <span className="avatar" style={{ '--c': usuario.color, width: tam, height: tam, fontSize: tam * 0.45 }}>
      {usuario.avatar ? <img src={usuario.avatar} alt="" /> : usuario.nombre?.[0]?.toUpperCase()}
    </span>
  );
}

export function Stepper({ valor, min, max, onChange, etiqueta, paso = 1 }) {
  return (
    <div className="stepper">
      {etiqueta && <span className="stepper-etq">{etiqueta}</span>}
      <div className="stepper-ctl">
        <button type="button" className="btn chico fantasma" disabled={valor <= min} onClick={() => onChange(Math.max(min, valor - paso))} aria-label="Menos">−</button>
        <b>{valor}</b>
        <button type="button" className="btn chico fantasma" disabled={valor >= max} onClick={() => onChange(Math.min(max, valor + paso))} aria-label="Más">+</button>
      </div>
    </div>
  );
}

export function Interruptor({ valor, onChange, children }) {
  return (
    <label className="interruptor">
      <input type="checkbox" checked={!!valor} onChange={(e) => onChange(e.target.checked)} />
      <span className="pista-int" />
      <span>{children}</span>
    </label>
  );
}

// Color fijo para cada invitado (el mismo que calcula el server).
const COLORES_INVITADO = ['#ff7043', '#ab47bc', '#26a69a', '#5c6bc0', '#ec407a', '#9ccc65', '#ffa726', '#29b6f6'];
export const colorInvitado = (id) => COLORES_INVITADO[[...String(id)].reduce((t, c) => t + c.charCodeAt(0), 0) % COLORES_INVITADO.length];

// Marcador para juegos de 2 o más: con 2 queda como siempre (Vos N — N rival); con más, una fila de chips.
// puntos: { id: número }. extra: texto del medio (ronda, etc.).
export function MarcadorN({ jugadores, puntos, ctx, extra, fuera = [] }) {
  if (jugadores.length === 2) {
    const otro = jugadores.find((j) => j !== ctx.yo);
    return (
      <div className="marcador">
        <span>Vos <b>{puntos[ctx.yo] ?? 0}</b></span>
        {extra && <span className="ronda">{extra}</span>}
        <span><b>{puntos[otro] ?? 0}</b> {ctx.nombreDe(otro)}</span>
      </div>
    );
  }
  const orden = [...jugadores].sort((a, b) => (puntos[b] ?? 0) - (puntos[a] ?? 0));
  return (
    <div className="marcador-n">
      {extra && <span className="ronda">{extra}</span>}
      <ol>
        {orden.map((j) => (
          <li key={j} className={`${j === ctx.yo ? 'yo-mismo' : ''} ${fuera.includes(j) ? 'fuera' : ''}`} style={{ '--c': ctx.colorDe?.(j) }}>
            <i />{ctx.nombreDe(j)} <b>{puntos[j] ?? 0}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Cuenta regresiva local a partir de lo que falta según el server (se reinicia cuando cambia `clave`).
// Devuelve los ms que quedan, actualizados cada `cada` ms.
export function useFalta(faltaMs, clave, cada = 200) {
  const [base, setBase] = useState(() => ({ t: Date.now(), falta: faltaMs }));
  const [, setTic] = useState(0);
  useEffect(() => {
    setBase({ t: Date.now(), falta: faltaMs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, faltaMs == null]);
  useEffect(() => {
    if (faltaMs == null) return undefined;
    const t = setInterval(() => setTic((x) => x + 1), cada);
    return () => clearInterval(t);
  }, [faltaMs == null, cada]); // eslint-disable-line react-hooks/exhaustive-deps
  if (faltaMs == null || base.falta == null) return null;
  return Math.max(0, base.falta - (Date.now() - base.t));
}
