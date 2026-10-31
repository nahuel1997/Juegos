import { useEffect, useState } from 'react';
import { MarcadorN } from '../../componentes/comunes.jsx';
import { Cartel, useEfecto } from '../../efectos.jsx';

// Un palito de fósforo dibujado (cabeza roja).
function Palito({ estado }) {
  return (
    <svg viewBox="0 0 16 80" className={`nm-palito ${estado}`} aria-hidden="true">
      <rect x="5" y="14" width="6" height="64" rx="2.5" fill="var(--nm-madera, #e3b778)" stroke="#8a5a2b" strokeWidth="1" />
      <ellipse cx="8" cy="12" rx="6.5" ry="9" fill="#d32f2f" stroke="#7f1010" strokeWidth="1" />
      <ellipse cx="6" cy="9" rx="2" ry="3" fill="#ff8a80" />
    </svg>
  );
}

export default function JuegoNim({ partida, accion, ctx }) {
  const p = partida;
  const miTurno = p.estado === 'jugando' && p.fase === 'jugando' && p.turno === ctx.yo;
  const [sel, setSel] = useState(null); // { pila, cantidad }
  useEffect(() => setSel(null), [p.turno, p.ronda]);
  const tope = (i) => (p.config.limite ? Math.min(p.config.limite, p.pilas[i]) : p.pilas[i]);

  // Tocar un palito marca ese y todos los de su derecha (hasta el límite).
  const tocar = (pila, k) => {
    if (!miTurno) return;
    const cantidad = Math.min(tope(pila), p.pilas[pila] - k);
    setSel(sel && sel.pila === pila && sel.cantidad === cantidad ? null : { pila, cantidad });
  };

  const fin = useEfecto(p.fase === 'fin-ronda' || (p.estado === 'terminada' && p.resultado) ? `r${p.ronda}` : null, () => ({ ...p.resultado }), 2600);

  let estado;
  if (p.fase === 'fin-ronda') estado = 'Fin de la ronda';
  else if (miTurno) estado = '¡Te toca! Tocá los palitos que querés sacar (de una sola pila)';
  else estado = `Le toca a ${ctx.nombreDe(p.turno)}…`;

  return (
    <div className="nim">
      {fin && <Cartel key={fin.id} texto={fin.gana === ctx.yo ? '¡Ronda tuya!' : `Ronda para ${ctx.nombreDe(fin.gana)}`} sub={`${fin.ultimo === ctx.yo ? 'Te llevaste' : `${ctx.nombreDe(fin.ultimo)} se llevó`} el último palito`} tipo={fin.gana === ctx.yo ? 'oro' : ''} />}
      <MarcadorN jugadores={p.jugadores} puntos={p.puntos} ctx={ctx} extra={`Ronda ${p.ronda} de ${p.config.rondas}`} />
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {estado}
        <small>
          {p.config.ultimo === 'pierde' ? 'El que se lleva el último palito pierde.' : 'El que se lleva el último palito gana.'}
          {p.config.limite ? ` Como mucho ${p.config.limite} por jugada.` : ''}
          {p.ultima && ` · ${p.ultima.quien === ctx.yo ? 'Sacaste' : `${ctx.nombreDe(p.ultima.quien)} sacó`} ${p.ultima.cantidad} de la pila ${p.ultima.pila + 1}`}
        </small>
      </div>
      <div className="nm-mesa">
        {p.pilas.map((n, i) => (
          <div key={i} className={`nm-pila ${sel?.pila === i ? 'elegida' : ''}`}>
            <span className="nm-num">{n}</span>
            <div className="nm-palitos">
              {Array.from({ length: n }, (_, k) => {
                const marcado = sel?.pila === i && k >= n - sel.cantidad;
                return (
                  <button key={k} type="button" className="nm-boton" disabled={!miTurno} onClick={() => tocar(i, k)} aria-label={`Pila ${i + 1}, palito ${k + 1}`}>
                    <Palito estado={marcado ? 'marcado' : ''} />
                  </button>
                );
              })}
              {n === 0 && <span className="nm-vacia">vacía</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="acciones centro">
        <button className="btn" disabled={!miTurno || !sel} onClick={() => { accion('sacar', sel); setSel(null); }}>
          {sel ? `Sacar ${sel.cantidad} palito${sel.cantidad === 1 ? '' : 's'}` : 'Elegí los palitos'}
        </button>
      </div>
    </div>
  );
}

JuegoNim.textoFinal = (p, _g, ctx) => p.jugadores.map((j) => `${ctx?.nombreDe?.(j) ?? j} ${p.puntos[j]}`).join(' · ');
JuegoNim.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.fase === 'jugando' && p.turno === ctx.yo ? `nm-${p.ronda}-${p.pilas.join('')}` : null);
