import { useEffect, useMemo, useState } from 'react';
import { FLOTA, LETRAS, TAM, cabe, celdasDe, flotaAlAzar, largoDe } from '../juegos/flota.js';

const k = (f, c) => `${f},${c}`;

// Mapa celda -> pedazo de barco, para dibujar cada barco con sus puntas redondeadas.
function mapaBarcos(barcos, extra = {}) {
  const m = new Map();
  for (const b of barcos) {
    const largo = b.largo ?? largoDe(b.id);
    celdasDe(b, largo).forEach(([f, c], i) =>
      m.set(k(f, c), { ...extra, id: b.id, horizontal: b.horizontal, punta: i === 0 ? 'ini' : i === largo - 1 ? 'fin' : '', hundido: b.hundido }),
    );
  }
  return m;
}

function Tablero({ celda, onClick, onHover, clickable, titulo, className = '' }) {
  const filas = Array.from({ length: TAM }, (_, f) => f);
  return (
    <div className={`tablero-wrap ${className}`}>
      {titulo && <h3>{titulo}</h3>}
      <div className={`tablero ${clickable ? 'clickable' : ''}`} onMouseLeave={() => onHover?.(null)}>
        <div className="coord" />
        {filas.map((c) => <div key={`h${c}`} className="coord">{c + 1}</div>)}
        {filas.map((f) => (
          <FilaTablero key={f} f={f} celda={celda} onClick={onClick} onHover={onHover} />
        ))}
      </div>
    </div>
  );
}

function FilaTablero({ f, celda, onClick, onHover }) {
  return (
    <>
      <div className="coord">{LETRAS[f]}</div>
      {Array.from({ length: TAM }, (_, c) => {
        const { clase = '', marca = null, titulo } = celda(f, c);
        return (
          <button
            key={c}
            type="button"
            className={`celda ${clase}`}
            title={titulo ?? `${LETRAS[f]}${c + 1}`}
            onClick={() => onClick?.(f, c)}
            onMouseEnter={() => onHover?.([f, c])}
            onContextMenu={(e) => { if (onHover) { e.preventDefault(); onHover('girar'); } }}
          >
            {marca}
          </button>
        );
      })}
    </>
  );
}

const claseBarco = (b) => (b ? `barco ${b.horizontal ? 'h' : 'v'} ${b.punta} ${b.hundido ? 'hundido' : ''}` : '');

function Colocacion({ partida, emitir }) {
  const [barcos, setBarcos] = useState([]);
  const [sel, setSel] = useState(FLOTA[0].id);
  const [horizontal, setHorizontal] = useState(true);
  const [hover, setHover] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const tecla = (e) => { if (e.key === 'r' || e.key === 'R') setHorizontal((h) => !h); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  const mapa = useMemo(() => mapaBarcos(barcos), [barcos]);
  const previa = sel && hover ? { id: sel, fila: hover[0], col: hover[1], horizontal } : null;
  const previaOk = previa && cabe(previa, barcos);
  const celdasPrevia = previa ? new Set(celdasDe(previa, largoDe(sel)).map(([f, c]) => k(f, c))) : new Set();
  const faltan = FLOTA.filter((t) => !barcos.some((b) => b.id === t.id));

  function click(f, c) {
    const pieza = mapa.get(k(f, c));
    if (pieza && !sel) {
      // Levantar un barco ya ubicado para moverlo.
      const b = barcos.find((x) => x.id === pieza.id);
      setBarcos(barcos.filter((x) => x.id !== pieza.id));
      setSel(b.id);
      setHorizontal(b.horizontal);
      return;
    }
    if (!sel) return;
    const nuevo = { id: sel, fila: f, col: c, horizontal };
    if (!cabe(nuevo, barcos)) return;
    const lista = [...barcos, nuevo];
    setBarcos(lista);
    setSel(FLOTA.find((t) => !lista.some((b) => b.id === t.id))?.id ?? null);
  }

  async function listo() {
    setEnviando(true);
    await emitir('colocar', { barcos });
    setEnviando(false);
  }

  if (partida.listo.yo) {
    return (
      <div className="colocacion">
        <div className="estado-cinta espera">Flota lista. Esperando que {partida.nombreRival} ubique la suya…</div>
        <Tablero titulo="Tu flota" celda={(f, c) => ({ clase: claseBarco(mapaBarcos(partida.miFlota).get(k(f, c))) })} />
      </div>
    );
  }

  return (
    <div className="colocacion">
      <div className="estado-cinta">
        Ubicá tus barcos{partida.listo.rival ? ` · ${partida.nombreRival} ya está listo` : ''}
      </div>
      <div className="colocacion-grid">
        <Tablero
          clickable
          celda={(f, c) => {
            const enPrevia = celdasPrevia.has(k(f, c));
            return { clase: `${claseBarco(mapa.get(k(f, c)))} ${enPrevia ? (previaOk ? 'previa' : 'previa mal') : ''}` };
          }}
          onClick={click}
          onHover={(h) => (h === 'girar' ? setHorizontal((x) => !x) : setHover(h))}
        />
        <div className="panel-flota">
          <h3>Tu flota</h3>
          <ul className="lista-barcos">
            {FLOTA.map((t) => {
              const ubicado = barcos.some((b) => b.id === t.id);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`item-barco ${sel === t.id ? 'activo' : ''} ${ubicado ? 'ubicado' : ''}`}
                    onClick={() => {
                      if (ubicado) setBarcos(barcos.filter((b) => b.id !== t.id));
                      setSel(t.id);
                    }}
                  >
                    <span className="mini-barco">{Array.from({ length: t.largo }, (_, i) => <i key={i} />)}</span>
                    {t.nombre}
                    {ubicado && <small>✓</small>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="acciones col">
            <button className="btn fantasma" onClick={() => setHorizontal((h) => !h)}>
              ↻ Girar ({horizontal ? 'horizontal' : 'vertical'})
            </button>
            <button className="btn fantasma" onClick={() => { setBarcos(flotaAlAzar()); setSel(null); }}>🎲 Al azar</button>
            <button className="btn fantasma" onClick={() => { setBarcos([]); setSel(FLOTA[0].id); }}>Limpiar</button>
            <button className="btn grande" disabled={faltan.length > 0 || enviando} onClick={listo}>
              {faltan.length ? `Faltan ${faltan.length} barco${faltan.length > 1 ? 's' : ''}` : '¡Listo!'}
            </button>
          </div>
          <p className="ayuda">Tocá el tablero para ubicar. Girá con el botón, la tecla R o clic derecho. Tocá un barco ubicado para moverlo. Los barcos no se pueden tocar entre sí.</p>
        </div>
      </div>
    </div>
  );
}

function textoUltimo(u, yo, nombreRival) {
  if (!u) return null;
  const quien = u.por === yo ? 'Vos' : nombreRival;
  const donde = `${LETRAS[u.fila]}${u.col + 1}`;
  if (u.resultado === 'hundido') return `${quien} → ${donde}: ¡Hundido! (${u.barco})`;
  if (u.resultado === 'tocado') return `${quien} → ${donde}: ¡Tocado!`;
  return `${quien} → ${donde}: Agua`;
}

function Combate({ partida, emitir }) {
  const { yo, turno, ultimo, estado } = partida;
  const miTurno = estado === 'jugando' && turno === yo;
  const misDisparos = useMemo(() => new Map(partida.misDisparos.map((d) => [k(d.fila, d.col), d.r])), [partida.misDisparos]);
  const recibidos = useMemo(() => new Map(partida.disparosRecibidos.map((d) => [k(d.fila, d.col), d.r])), [partida.disparosRecibidos]);
  const miMapa = useMemo(() => mapaBarcos(partida.miFlota), [partida.miFlota]);
  const mapaRival = useMemo(() => mapaBarcos(partida.flotaRival), [partida.flotaRival]);
  const esUltimo = (por, f, c) => ultimo && ultimo.por === por && ultimo.fila === f && ultimo.col === c;

  const marca = (r) => (r === 'tocado' ? <span className="impacto">✕</span> : r === 'agua' ? <span className="agua-punto" /> : null);

  return (
    <>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {estado === 'jugando' ? (miTurno ? '¡Te toca disparar!' : `Turno de ${partida.nombreRival}…`) : 'Partida terminada'}
        {ultimo && <small>{textoUltimo(ultimo, yo, partida.nombreRival)}</small>}
      </div>
      {!partida.rivalOnline && estado === 'jugando' && (
        <div className="cinta">{partida.nombreRival} se desconectó. La partida queda guardada hasta que vuelva.</div>
      )}
      <div className="combate">
        <Tablero
          titulo={`Flota de ${partida.nombreRival} · quedan ${partida.restantes.rival}`}
          className={miTurno ? 'activo' : ''}
          clickable={miTurno}
          celda={(f, c) => {
            const r = misDisparos.get(k(f, c));
            const barco = mapaRival.get(k(f, c));
            return {
              clase: `${claseBarco(barco)} ${r || ''} ${!r && miTurno ? 'apuntable' : ''} ${esUltimo(yo, f, c) ? 'ultimo' : ''}`,
              marca: marca(r),
            };
          }}
          onClick={(f, c) => { if (miTurno && !misDisparos.has(k(f, c))) emitir('disparar', { fila: f, col: c }); }}
        />
        <Tablero
          titulo={`Tu flota · quedan ${partida.restantes.mios}`}
          className="propio"
          celda={(f, c) => {
            const r = recibidos.get(k(f, c));
            return {
              clase: `${claseBarco(miMapa.get(k(f, c)))} ${r || ''} ${esUltimo(partida.rival, f, c) ? 'ultimo' : ''}`,
              marca: marca(r),
            };
          }}
        />
      </div>
      <div className="flotas-estado">
        <EstadoFlota titulo="Tus barcos" barcos={partida.miFlota.map((b) => ({ ...b, hundido: b.impactos === b.largo }))} />
        <EstadoFlota titulo={`Barcos de ${partida.nombreRival}`}barcos={FLOTA.map((t) => ({ ...t, hundido: partida.flotaRival.some((b) => b.id === t.id && b.hundido) }))} />
      </div>
    </>
  );
}

function EstadoFlota({ titulo, barcos }) {
  return (
    <div className="estado-flota">
      <h4>{titulo}</h4>
      {barcos.map((b) => (
        <span key={b.id} className={`chip ${b.hundido ? 'hundido' : ''}`}>
          <span className="mini-barco">{Array.from({ length: b.largo }, (_, i) => <i key={i} />)}</span>
          {b.nombre}
        </span>
      ))}
    </div>
  );
}

function Final({ partida, emitir }) {
  const gane = partida.ganador === partida.yo;
  const pidioRival = partida.revancha.includes(partida.rival);
  const pediYo = partida.revancha.includes(partida.yo);
  return (
    <div className={`tarjeta final ${gane ? 'gane' : 'perdi'}`}>
      <div className="final-emoji">{gane ? '🏆' : '🌊'}</div>
      <h2>{gane ? '¡Ganaste!' : `Ganó ${partida.nombreRival}`}</h2>
      <p className="sub">
        {partida.motivoFin === 'abandono'
          ? gane ? `${partida.nombreRival} abandonó la partida.` : 'Abandonaste la partida.'
          : gane ? 'Hundiste toda la flota enemiga.' : 'Te hundieron toda la flota.'}
      </p>
      {pidioRival && !pediYo && <p className="pedido">{partida.nombreRival} quiere la revancha</p>}
      <div className="acciones">
        <button className="btn" disabled={pediYo || !partida.rivalOnline} onClick={() => emitir('revancha')}>
          {pediYo ? 'Esperando respuesta…' : pidioRival ? '¡Aceptar revancha!' : 'Pedir revancha'}
        </button>
        <button className="btn fantasma" onClick={() => emitir('salir')}>Volver al inicio</button>
      </div>
    </div>
  );
}

export default function BatallaNaval({ partida: p, emitir, lobby }) {
  const nombreRival = lobby?.usuarios.find((u) => u.usuario === p.rival)?.nombre || p.rival;
  const partida = { ...p, nombreRival };

  function abandonar() {
    if (window.confirm('¿Seguro que querés abandonar? La partida la gana tu rival.')) emitir('abandonar');
  }

  return (
    <div className="batalla">
      <div className="batalla-cab">
        <h2>🚢 Batalla naval <span className="vs">vs {nombreRival}</span></h2>
        {p.estado !== 'terminada' && <button className="btn chico fantasma" onClick={abandonar}>Abandonar</button>}
      </div>
      {p.estado === 'terminada' && <Final partida={partida} emitir={emitir} />}
      {p.estado === 'colocando' ? <Colocacion partida={partida} emitir={emitir} /> : <Combate partida={partida} emitir={emitir} />}
    </div>
  );
}
