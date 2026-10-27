import { useEffect, useMemo, useState } from 'react';
import { LETRAS, cabe, celdasDe, flotaAlAzar } from './flota.js';
import { Bombazo, CAIDA_BOMBA, Cartel, Llamita, useEfecto } from '../../efectos.jsx';
import { CapaBarcos } from './Barco.jsx';
import { efectoSonido } from '../../sonido.js';

const k = (f, c) => `${f},${c}`;

// Mapa celda -> pedazo de barco, para dibujar cada barco con sus puntas redondeadas.
function mapaBarcos(barcos, flota) {
  const m = new Map();
  for (const b of barcos) {
    const largo = b.largo ?? flota.find((t) => t.id === b.id).largo;
    celdasDe(b, largo).forEach(([f, c], i) =>
      m.set(k(f, c), { id: b.id, horizontal: b.horizontal, punta: i === 0 ? 'ini' : i === largo - 1 ? 'fin' : '', hundido: b.hundido }),
    );
  }
  return m;
}

// Completa tipo y largo de cada barco con los datos de la flota (para dibujarlo).
const conTipo = (barcos, flota) => barcos.map((b) => {
  const t = flota.find((x) => x.id === b.id);
  return { ...b, tipo: b.tipo ?? t.tipo, largo: b.largo ?? t.largo };
});

function Tablero({ filas, columnas, celda, onClick, onHover, clickable, titulo, className = '', barcos = [] }) {
  // (celda puede devolver `fx`: un efecto animado encima de la celda)
  return (
    <div className={`tablero-wrap ${className}`}>
      {titulo && <h3>{titulo}</h3>}
      <div
        className={`tablero ${clickable ? 'clickable' : ''}`}
        style={{ '--cols': columnas, maxWidth: Math.min(560, 46 * columnas + 30) }}
        onMouseLeave={() => onHover?.(null)}
      >
        <CapaBarcos barcos={barcos} />
        <div className="coord" />
        {Array.from({ length: columnas }, (_, c) => <div key={`h${c}`} className="coord">{c + 1}</div>)}
        {Array.from({ length: filas }, (_, f) => (
          <FilaTablero key={f} f={f} columnas={columnas} celda={celda} onClick={onClick} onHover={onHover} />
        ))}
      </div>
    </div>
  );
}

function FilaTablero({ f, columnas, celda, onClick, onHover }) {
  return (
    <>
      <div className="coord">{LETRAS[f]}</div>
      {Array.from({ length: columnas }, (_, c) => {
        const { clase = '', marca = null, fx = null } = celda(f, c);
        return (
          <button
            key={c}
            type="button"
            className={`celda ${clase} ${fx ? 'con-fx' : ''}`}
            title={`${LETRAS[f]}${c + 1}`}
            onClick={() => onClick?.(f, c)}
            onMouseEnter={() => onHover?.([f, c])}
            onContextMenu={(e) => { if (onHover) { e.preventDefault(); onHover('girar'); } }}
          >
            {marca}
            {fx}
          </button>
        );
      })}
    </>
  );
}

const claseBarco = (b) => (b ? `barco ${b.horizontal ? 'h' : 'v'} ${b.punta} ${b.hundido ? 'hundido' : ''}` : '');
const MiniBarco = ({ largo }) => <span className="mini-barco">{Array.from({ length: largo }, (_, i) => <i key={i} />)}</span>;

function Colocacion({ partida, accion, ctx }) {
  const { flota, filas, columnas, pegados } = partida;
  const [barcos, setBarcos] = useState([]);
  const [sel, setSel] = useState(flota[0].id);
  const [horizontal, setHorizontal] = useState(true);
  const [hover, setHover] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const tecla = (e) => { if ((e.key === 'r' || e.key === 'R') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') setHorizontal((h) => !h); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  const mapa = useMemo(() => mapaBarcos(barcos, flota), [barcos, flota]);
  const largoSel = sel && flota.find((t) => t.id === sel).largo;
  const previa = sel && hover ? { id: sel, fila: hover[0], col: hover[1], horizontal } : null;
  const previaOk = previa && cabe(previa, barcos, flota, filas, columnas, pegados);
  const celdasPrevia = previa ? new Set(celdasDe(previa, largoSel).map(([f, c]) => k(f, c))) : new Set();
  const faltan = flota.filter((t) => !barcos.some((b) => b.id === t.id));

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
    if (!cabe(nuevo, barcos, flota, filas, columnas, pegados)) return;
    const lista = [...barcos, nuevo];
    setBarcos(lista);
    setSel(flota.find((t) => !lista.some((b) => b.id === t.id))?.id ?? null);
  }

  async function listo() {
    setEnviando(true);
    await accion('colocar', { barcos });
    setEnviando(false);
  }

  if (partida.listo.yo) {
    return (
      <div className="colocacion">
        <div className="estado-cinta espera">Flota lista. Esperando que {ctx.nombreRival} ubique la suya…</div>
        <Tablero filas={filas} columnas={columnas} titulo="Tu flota" barcos={conTipo(partida.miFlota, flota)} celda={(f, c) => ({ clase: claseBarco(mapaBarcos(partida.miFlota, flota).get(k(f, c))) })} />
      </div>
    );
  }

  return (
    <div className="colocacion">
      <div className="estado-cinta">
        Ubicá tus barcos{partida.listo.rival ? ` · ${ctx.nombreRival} ya está listo` : ''}
      </div>
      <div className="colocacion-grid">
        <Tablero
          filas={filas}
          columnas={columnas}
          clickable
          barcos={[
            ...conTipo(barcos, flota),
            ...(previa ? conTipo([previa], flota).map((b) => ({ ...b, id: 'previa', clase: previaOk ? 'fantasma' : 'fantasma mal' })) : []),
          ]}
          celda={(f, c) => {
            const enPrevia = celdasPrevia.has(k(f, c));
            return { clase: `${claseBarco(mapa.get(k(f, c)))} ${enPrevia ? (previaOk ? 'previa' : 'previa mal') : ''}` };
          }}
          onClick={click}
          onHover={(h) => (h === 'girar' ? setHorizontal((x) => !x) : setHover(h))}
        />
        <div className="panel-flota">
          <h3>Tu flota ({flota.length})</h3>
          <ul className="lista-barcos">
            {flota.map((t) => {
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
                    <MiniBarco largo={t.largo} />
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
            <button className="btn fantasma" onClick={() => { const f = flotaAlAzar(flota, filas, columnas, pegados); if (f) { setBarcos(f); setSel(null); } }}>🎲 Al azar</button>
            <button className="btn fantasma" onClick={() => { setBarcos([]); setSel(flota[0].id); }}>Limpiar</button>
            <button className="btn grande" disabled={faltan.length > 0 || enviando} onClick={listo}>
              {faltan.length ? `Faltan ${faltan.length} barco${faltan.length > 1 ? 's' : ''}` : '¡Listo!'}
            </button>
          </div>
          <p className="ayuda">Tocá el tablero para ubicar. Girá con el botón, la tecla R o clic derecho. Tocá un barco ubicado para moverlo. {pegados ? 'Los barcos pueden ir pegados, pero no encimados.' : 'Los barcos no se pueden tocar entre sí.'}</p>
        </div>
      </div>
    </div>
  );
}

function textoUltimo(u, yo, nombreRival, seguir) {
  if (!u) return null;
  const quien = u.por === yo ? 'Vos' : nombreRival;
  const donde = `${LETRAS[u.fila]}${u.col + 1}`;
  if (u.resultado === 'hundido') return `${quien} → ${donde}: ¡Hundido! (${u.barco}) · pasa el turno`;
  if (u.resultado === 'tocado') return `${quien} → ${donde}: ¡Tocado!${seguir ? '' : ' · pasa el turno'}`;
  return `${quien} → ${donde}: Agua`;
}

function Combate({ partida, accion, ctx }) {
  const { turno, ultimo, estado, flota, filas, columnas } = partida;
  const { yo, rival, nombreRival } = ctx;
  const miTurno = estado === 'jugando' && turno === yo;
  const misDisparos = useMemo(() => new Map(partida.misDisparos.map((d) => [k(d.fila, d.col), d.r])), [partida.misDisparos]);
  const recibidos = useMemo(() => new Map(partida.disparosRecibidos.map((d) => [k(d.fila, d.col), d.r])), [partida.disparosRecibidos]);
  const miMapa = useMemo(() => mapaBarcos(partida.miFlota, flota), [partida.miFlota, flota]);
  const mapaRival = useMemo(() => mapaBarcos(partida.flotaRival, flota), [partida.flotaRival, flota]);
  const esUltimo = (por, f, c) => ultimo && ultimo.por === por && ultimo.fila === f && ultimo.col === c;

  const marca = (r) => (r === 'tocado' ? <><Llamita /><span className="impacto">✕</span></> : r === 'agua' ? <span className="agua-punto" /> : null);

  // Cada disparo nuevo: explosión (tocado), explosión grande + sacudón (hundido) o salpicadura (agua).
  const totalTiros = partida.misDisparos.length + partida.disparosRecibidos.length;
  const fx = useEfecto(ultimo ? `${totalTiros}-${ultimo.por}-${ultimo.fila}-${ultimo.col}` : null, () => {
    // Primero cae la bomba silbando; al tocar, explosión o salpicadura.
    efectoSonido.silbido(CAIDA_BOMBA / 1000);
    setTimeout(() => {
      if (ultimo.resultado === 'agua') efectoSonido.agua();
      else efectoSonido.explosion(ultimo.resultado === 'hundido');
    }, CAIDA_BOMBA);
    return { ...ultimo, ms: CAIDA_BOMBA + (ultimo.resultado === 'hundido' ? 2200 : 1400) };
  });
  const fxEn = (por, f, c) => {
    if (!fx || fx.por !== por || fx.fila !== f || fx.col !== c) return null;
    return <Bombazo key={fx.id} resultado={fx.resultado} />;
  };
  const sacude = (por) => (fx && fx.por === por && fx.resultado !== 'agua' ? (fx.resultado === 'hundido' ? 'sacudon tras-bomba' : 'temblor tras-bomba') : '');
  // El barco recién hundido se va a pique con animación (después de que cae la bomba).
  const recien = (por, b) => fx?.resultado === 'hundido' && fx.por === por && fx.barcoId === b.id;
  const misBarcos = conTipo(partida.miFlota, flota).map((b) => ({ ...b, hundido: b.impactos === b.largo, recien: recien(rival, b) }));
  const barcosRival = conTipo(partida.flotaRival, flota).map((b) => ({ ...b, recien: recien(yo, b) }));

  return (
    <>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {estado === 'jugando' ? (miTurno ? '¡Te toca disparar!' : `Turno de ${nombreRival}…`) : 'Partida terminada'}
        {ultimo && <small>{textoUltimo(ultimo, yo, nombreRival, partida.seguirAlTocar)}</small>}
      </div>
      {fx?.resultado === 'hundido' && (
        <Cartel key={fx.id} retraso={CAIDA_BOMBA / 1000} tipo="hundido" texto="¡HUNDIDO!" sub={fx.por === yo ? `Hundiste el ${fx.barco}` : `Te hundieron el ${fx.barco}`} />
      )}
      <div className="combate">
        <Tablero
          filas={filas}
          columnas={columnas}
          titulo={`Flota de ${nombreRival} · quedan ${partida.restantes.rival}`}
          className={`${miTurno ? 'activo' : ''} ${sacude(yo)}`}
          barcos={barcosRival}
          clickable={miTurno}
          celda={(f, c) => {
            const r = misDisparos.get(k(f, c));
            return {
              clase: `${claseBarco(mapaRival.get(k(f, c)))} ${r || ''} ${!r && miTurno ? 'apuntable' : ''} ${esUltimo(yo, f, c) ? 'ultimo' : ''}`,
              marca: marca(r),
              fx: fxEn(yo, f, c),
            };
          }}
          onClick={(f, c) => { if (miTurno && !misDisparos.has(k(f, c))) accion('disparar', { fila: f, col: c }); }}
        />
        <Tablero
          filas={filas}
          columnas={columnas}
          titulo={`Tu flota · quedan ${partida.restantes.mios}`}
          className={`propio ${sacude(rival)}`}
          barcos={misBarcos}
          celda={(f, c) => {
            const r = recibidos.get(k(f, c));
            return {
              clase: `${claseBarco(miMapa.get(k(f, c)))} ${r || ''} ${esUltimo(rival, f, c) ? 'ultimo' : ''}`,
              marca: marca(r),
              fx: fxEn(rival, f, c),
            };
          }}
        />
      </div>
      <div className="flotas-estado">
        <EstadoFlota titulo="Tus barcos" barcos={partida.miFlota.map((b) => ({ ...b, hundido: b.impactos === b.largo }))} />
        <EstadoFlota titulo={`Barcos de ${nombreRival}`} barcos={flota.map((t) => ({ ...t, hundido: partida.flotaRival.some((b) => b.id === t.id && b.hundido) }))} />
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
          <MiniBarco largo={b.largo} />
          {b.nombre}
        </span>
      ))}
    </div>
  );
}

export default function JuegoBatalla({ partida, accion, ctx }) {
  return partida.estado === 'colocando'
    ? <Colocacion partida={partida} accion={accion} ctx={ctx} />
    : <Combate partida={partida} accion={accion} ctx={ctx} />;
}

// Texto del final según cómo terminó.
JuegoBatalla.textoFinal = (p, gane) => (gane ? 'Hundiste toda la flota enemiga.' : 'Te hundieron toda la flota.');

// Clave que cambia cada vez que empieza un turno tuyo (para el sonido); null si no te toca.
JuegoBatalla.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.turno === ctx.yo ? `b-${p.disparosRecibidos.length}` : null);
