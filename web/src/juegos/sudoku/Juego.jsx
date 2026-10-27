import { useEffect, useState } from 'react';
import { useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

const reloj = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function JuegoSudoku({ partida, accion, ctx }) {
  const { inicial, grilla, config } = partida;
  const jugando = partida.estado === 'jugando';
  const [sel, setSel] = useState(null);
  const [lapiz, setLapiz] = useState(false);
  const [notas, setNotas] = useState({}); // "f,c" -> Set de números (solo en el navegador)
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    if (!jugando) return undefined;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [jugando]);

  const poner = (n) => {
    if (!sel || !jugando) return;
    const [f, c] = sel;
    if (inicial[f][c] || grilla[f][c]) return;
    if (lapiz) {
      const k = `${f},${c}`;
      const s = new Set(notas[k] || []);
      if (s.has(n)) s.delete(n); else s.add(n);
      setNotas({ ...notas, [k]: s });
      return;
    }
    accion('poner', { fila: f, col: c, numero: n });
  };

  useEffect(() => {
    const tecla = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (/^[1-9]$/.test(e.key)) { poner(Number(e.key)); e.preventDefault(); return; }
      const mov = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
      if (mov) {
        e.preventDefault();
        const [f, c] = sel || [0, 0];
        setSel([(f + mov[0] + 9) % 9, (c + mov[1] + 9) % 9]);
      }
      if (e.key === 'l' || e.key === 'L') setLapiz((x) => !x);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  const error = useEfecto(partida.ultimoError ? `e${partida.ultimoError.n}` : null, () => {
    efectoSonido.explosion(false);
    return { ...partida.ultimoError, ms: 900 };
  }, 900);

  const valorSel = sel ? grilla[sel[0]][sel[1]] : 0;
  // Cuántas veces está cada número (para apagar los que ya están los nueve).
  const cuenta = Array(10).fill(0);
  grilla.flat().forEach((x) => { cuenta[x]++; });
  const hechas = (partida.vacias - partida.faltan.yo) / partida.vacias;
  const hechasRival = (partida.vacias - partida.faltan.rival) / partida.vacias;

  return (
    <div className="sudoku">
      <div className="marcador">
        <span>Vos <b>{partida.faltan.yo}</b> <small>faltan</small></span>
        <span className="ronda">{reloj(ahora - partida.empezo)} · {config.dificultad}</span>
        <span><small>faltan</small> <b>{partida.faltan.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className="sd-carrera">
        <div><span>Vos</span><i style={{ width: `${hechas * 100}%` }} /><small>{partida.errores.yo} error{partida.errores.yo === 1 ? '' : 'es'}{config.errores ? ` de ${config.errores}` : ''}</small></div>
        <div className="rival"><span>{ctx.nombreRival}</span><i style={{ width: `${hechasRival * 100}%` }} /><small>{partida.errores.rival} error{partida.errores.rival === 1 ? '' : 'es'}</small></div>
      </div>
      <div className="sd-zona">
        <div className={`sd-grilla ${error ? 'error' : ''}`}>
          {grilla.map((fila, f) => fila.map((v, c) => {
            const dada = !!inicial[f][c];
            const esSel = sel && sel[0] === f && sel[1] === c;
            const mismaZona = sel && (sel[0] === f || sel[1] === c || (Math.floor(sel[0] / 3) === Math.floor(f / 3) && Math.floor(sel[1] / 3) === Math.floor(c / 3)));
            const mismoNum = valorSel && v === valorSel;
            const k = `${f},${c}`;
            const fallo = error && error.fila === f && error.col === c;
            return (
              <button
                key={k}
                type="button"
                className={`sd-celda ${dada ? 'dada' : v ? 'mia' : ''} ${esSel ? 'sel' : mismaZona ? 'zona' : ''} ${mismoNum ? 'igual' : ''} ${fallo ? 'fallo' : ''} ${c % 3 === 2 && c < 8 ? 'bd' : ''} ${f % 3 === 2 && f < 8 ? 'bb' : ''}`}
                onClick={() => setSel([f, c])}
              >
                {v ? v : fallo ? <span className="sd-mal">{error.numero}</span> : notas[k]?.size ? (
                  <span className="sd-notas">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <i key={n}>{notas[k].has(n) ? n : ''}</i>)}</span>
                ) : ''}
              </button>
            );
          }))}
        </div>
        <div className="sd-teclado">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} type="button" className="btn fantasma" disabled={!jugando || cuenta[n] >= 9} onClick={() => poner(n)}>{n}</button>
          ))}
          <button type="button" className={`btn ${lapiz ? '' : 'fantasma'} sd-lapiz`} onClick={() => setLapiz(!lapiz)}>Lápiz {lapiz ? 'prendido' : 'apagado'}</button>
          <p className="ayuda">Tocá una casilla y un número (o usá el teclado). Con el lápiz anotás posibles sin que cuente.</p>
        </div>
      </div>
      {partida.grillaRival && (
        <p className="sub centro">Al final, a {ctx.nombreRival} le faltaban {partida.faltan.rival} casillas.</p>
      )}
    </div>
  );
}

JuegoSudoku.textoFinal = (p, gane) => {
  if (p.motivoFin === 'errores') return gane ? 'El otro se pasó de errores.' : 'Te pasaste de errores.';
  return gane ? '¡Lo terminaste primero!' : 'El otro lo terminó primero.';
};
JuegoSudoku.claveTurno = () => null;
