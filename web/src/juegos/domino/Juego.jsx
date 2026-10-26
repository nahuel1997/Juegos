import { useEffect, useState } from 'react';

// Puntos de cada mitad en una grilla de 3x3.
const PUNTOS = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function Mitad({ n, x, y }) {
  return PUNTOS[n].map((p) => <circle key={p} cx={x + 7 + (p % 3) * 8} cy={y + 7 + Math.floor(p / 3) * 8} r="2.6" fill="#1b1b22" />);
}

export function Ficha({ a, b, vertical, onClick, clase = '', titulo }) {
  const w = vertical ? 30 : 60;
  const h = vertical ? 60 : 30;
  const contenido = (
    <svg viewBox={`0 0 ${w} ${h}`} className="domino-svg">
      <rect x="1" y="1" width={w - 2} height={h - 2} rx="5" fill="#fffdf7" stroke="#2b2233" strokeWidth="1.6" />
      {vertical ? <path d="M4 30h22" stroke="#2b2233" strokeWidth="1.2" /> : <path d="M30 4v22" stroke="#2b2233" strokeWidth="1.2" />}
      <Mitad n={a} x={0} y={0} />
      <Mitad n={b} x={vertical ? 0 : 30} y={vertical ? 30 : 0} />
    </svg>
  );
  if (!onClick) return <span className={`ficha-domino ${vertical ? 'v' : 'h'} ${clase}`} title={titulo}>{contenido}</span>;
  return <button type="button" className={`ficha-domino ${vertical ? 'v' : 'h'} ${clase}`} onClick={onClick} title={titulo}>{contenido}</button>;
}

export default function JuegoDomino({ partida, accion, ctx }) {
  const { mesa, miMano, jugables, resumen } = partida;
  const miTurno = partida.estado === 'jugando' && partida.fase === 'jugando' && partida.turno === ctx.yo;
  const [sel, setSel] = useState(null);
  useEffect(() => setSel(null), [mesa.length, miMano.length]);

  const ladosDe = (id) => jugables.find((x) => x.id === id)?.lados || [];
  function tocar(f) {
    const lados = ladosDe(f.id);
    if (!miTurno || !lados.length) return;
    if (lados.length === 1) return accion('jugar', { ficha: f.id, lado: lados[0] });
    setSel(sel === f.id ? null : f.id); // entra en las dos puntas: elegís cuál
  }
  const ladosSel = sel ? ladosDe(sel) : [];
  const listoYo = partida.listos.includes(ctx.yo);
  const u = partida.ultima;

  return (
    <div className="domino">
      <div className="marcador">
        <span>Vos <b>{partida.puntos.yo}</b></span>
        <span className="ronda">Mano {partida.mano}{partida.config.puntosParaGanar ? ` · a ${partida.config.puntosParaGanar}` : ''} · pozo {partida.pozo}</span>
        <span><b>{partida.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>

      {partida.fase === 'resumen' && resumen ? (
        <div className={`tarjeta resumen-mano ${resumen.resultado}`}>
          <h3>
            {resumen.resultado === 'empate' ? 'Mano empatada' : resumen.resultado === 'gane' ? `¡Ganaste la mano! +${resumen.ganados}` : `${ctx.nombreRival} ganó la mano (+${resumen.ganados})`}
            {resumen.motivo === 'tranque' ? ' · se trancó' : ''}
          </h3>
          <div className="domino-fila">
            <small>Fichas de {ctx.nombreRival}:</small>
            {resumen.manoRival.map((f) => <Ficha key={f.id} a={f.a} b={f.b} />)}
          </div>
          {partida.estado === 'jugando' && (
            <button className="btn" disabled={listoYo} onClick={() => accion('siguiente')}>{listoYo ? `Esperando a ${ctx.nombreRival}…` : 'Siguiente mano →'}</button>
          )}
        </div>
      ) : (
        <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
          {miTurno ? (partida.puedeRobar ? 'No tenés ficha: robá del pozo' : partida.puedePasar ? 'No tenés ficha: pasá' : '¡Te toca!') : `Juega ${ctx.nombreRival}…`}
          {u && (
            <small>
              {u.mia
                ? { jugo: 'Jugaste una ficha', robo: 'Robaste del pozo', paso: 'Pasaste' }[u.tipo]
                : `${ctx.nombreRival} ${{ jugo: 'jugó una ficha', robo: 'robó del pozo', paso: 'pasó' }[u.tipo]}`}
            </small>
          )}
        </div>
      )}

      <div className="domino-rival">
        {Array.from({ length: partida.fichasRival }, (_, i) => <span key={i} className="ficha-dorso" />)}
        <small>{ctx.nombreRival}: {partida.fichasRival} fichas</small>
      </div>

      <div className="domino-mesa">
        {ladosSel.includes('izq') && <button type="button" className="punta" onClick={() => accion('jugar', { ficha: sel, lado: 'izq' })}>Acá</button>}
        {mesa.length === 0 && <span className="mesa-vacia">La mesa está vacía: jugá cualquier ficha</span>}
        {mesa.map((f, i) => (
          <Ficha key={f.id} a={f.a} b={f.b} vertical={f.a === f.b} clase={u?.tipo === 'jugo' && u.ficha === f.id ? 'nueva' : ''} titulo={i === 0 || i === mesa.length - 1 ? 'Punta' : undefined} />
        ))}
        {ladosSel.includes('der') && <button type="button" className="punta" onClick={() => accion('jugar', { ficha: sel, lado: 'der' })}>Acá</button>}
      </div>

      <div className="domino-mano">
        {miMano.map((f) => {
          const lados = ladosDe(f.id);
          return (
            <Ficha
              key={f.id}
              a={f.a}
              b={f.b}
              vertical
              clase={`${miTurno && lados.length ? 'jugable' : 'apagada'} ${sel === f.id ? 'sel' : ''}`}
              onClick={() => tocar(f)}
            />
          );
        })}
      </div>
      {miTurno && (partida.puedeRobar || partida.puedePasar) && (
        <div className="acciones centrado">
          {partida.puedeRobar && <button className="btn" onClick={() => accion('robar')}>Robar del pozo ({partida.pozo})</button>}
          {partida.puedePasar && <button className="btn fantasma" onClick={() => accion('pasar')}>Paso</button>}
        </div>
      )}
      {sel && <p className="ayuda centrado">Esa ficha entra en las dos puntas: tocá “Acá” en la que quieras.</p>}
    </div>
  );
}

JuegoDomino.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoDomino.claveTurno = (p, ctx) =>
  p.estado === 'jugando' && p.fase === 'jugando' && p.turno === ctx.yo ? `do-${p.mano}-${p.mesa.length}-${p.miMano.length}` : null;
