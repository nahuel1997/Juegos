import { useEffect, useRef, useState } from 'react';

const COLORES = { 1: '#f5c518', 2: '#1d4ed8', 3: '#e63946', 4: '#7b2cbf', 5: '#f77f00', 6: '#2a9d4f', 7: '#8d1b1b', 8: '#111' };
const colorDe = (n) => (n === 0 ? '#fdfcf7' : COLORES[n > 8 ? n - 8 : n]);
const TRONERAS = [[0, 0], [500, -4], [1000, 0], [0, 500], [500, 504], [1000, 500]];

function Bola({ n, x, y, r }) {
  if (n === 0) return <circle cx={x} cy={y} r={r} fill="#fdfcf7" stroke="#bbb" strokeWidth="1" />;
  const rayada = n > 8;
  return (
    <g transform={`translate(${x} ${y})`}>
      <clipPath id={`bola-${n}`}><circle r={r} /></clipPath>
      <circle r={r} fill={rayada ? '#fdfcf7' : colorDe(n)} stroke="rgba(0,0,0,.35)" strokeWidth="1" />
      {rayada && <rect x={-r} y={-r * 0.55} width={2 * r} height={r * 1.1} fill={colorDe(n)} clipPath={`url(#bola-${n})`} />}
      <circle r={r * 0.48} fill="#fff" />
      <text y={r * 0.22} textAnchor="middle" fontSize={r * 0.62} fontWeight="900" fill="#111">{n}</text>
      <circle cx={-r * 0.35} cy={-r * 0.4} r={r * 0.22} fill="#fff" opacity=".45" />
    </g>
  );
}

export default function JuegoPool({ partida, accion, ctx }) {
  const { mesa, bolas, grupos, quedan, ultimoTiro } = partida;
  const miTurno = partida.estado === 'jugando' && partida.turno === ctx.yo;
  const [angulo, setAngulo] = useState(0);
  const [fijo, setFijo] = useState(false);
  const [fuerza, setFuerza] = useState(55);
  const [cuadro, setCuadro] = useState(null); // posiciones mientras se anima un tiro
  const animado = useRef(ultimoTiro?.id || 0); // no se repite el último tiro al entrar
  const svg = useRef(null);

  // Animación del último tiro (el server ya lo simuló).
  useEffect(() => {
    if (!ultimoTiro || ultimoTiro.id === animado.current) return;
    animado.current = ultimoTiro.id;
    const cuadros = ultimoTiro.cuadros;
    const inicio = performance.now();
    let raf;
    // Por tiempo (60 cuadros por segundo): si la pestaña estuvo en segundo plano, se pone al día.
    const paso = (ahora) => {
      const i = Math.floor((ahora - inicio) / (1000 / 60));
      if (i < cuadros.length) {
        setCuadro(cuadros[i]);
        raf = requestAnimationFrame(paso);
      } else {
        setCuadro(null);
      }
    };
    raf = requestAnimationFrame(paso);
    setFijo(false);
    return () => cancelAnimationFrame(raf);
  }, [ultimoTiro]);

  const animando = cuadro !== null;
  const posiciones = animando
    ? bolas.map((b, k) => (cuadro[k] ? { ...b, x: cuadro[k][0], y: cuadro[k][1], en: true } : { ...b, en: false }))
    : bolas;
  const blanca = posiciones.find((b) => b.n === 0);
  const puedeApuntar = miTurno && !animando && blanca?.en;

  function apuntar(e) {
    if (!puedeApuntar || fijo) return;
    const pt = svg.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.current.getScreenCTM().inverse());
    setAngulo(Math.atan2(p.y - blanca.y, p.x - blanca.x));
  }

  const r = mesa.radio;
  const dx = Math.cos(angulo);
  const dy = Math.sin(angulo);
  const nombreGrupo = (g) => (g === 'lisas' ? 'lisas (1-7)' : g === 'rayadas' ? 'rayadas (9-15)' : 'sin asignar');

  return (
    <div className="pool">
      <div className={`estado-cinta ${miTurno && !animando ? 'tu-turno' : ''}`}>
        {partida.estado !== 'jugando' ? 'Partida terminada' : animando ? 'Rodando…' : miTurno ? '¡Te toca! Apuntá y tirá' : `Tira ${ctx.nombreRival}…`}
        <small>
          Vos: {nombreGrupo(grupos.yo)}{quedan.yo != null ? ` (te quedan ${quedan.yo})` : ''} · {ctx.nombreRival}: {nombreGrupo(grupos.rival)}{quedan.rival != null ? ` (${quedan.rival})` : ''}
          {!animando && ultimoTiro?.mensaje ? ` · ${ultimoTiro.mio ? '' : `${ctx.nombreRival}: `}${ultimoTiro.mensaje}` : ''}
        </small>
      </div>

      <svg
        ref={svg}
        className={`pool-mesa ${puedeApuntar ? 'apuntable' : ''}`}
        viewBox="-40 -40 1080 580"
        onPointerMove={apuntar}
        onPointerDown={(e) => { if (!puedeApuntar) return; setFijo(false); apuntar(e); }}
        onPointerUp={() => puedeApuntar && setFijo(true)}
      >
        <rect x="-40" y="-40" width="1080" height="580" rx="34" fill="#6d3f22" />
        <rect x="-22" y="-22" width="1044" height="544" rx="22" style={{ fill: 'color-mix(in srgb, var(--sk-pano, #1f7a4d) 75%, #000)' }} />
        <rect x="0" y="0" width="1000" height="500" style={{ fill: 'var(--sk-pano, #1f7a4d)' }} />
        <path d="M250 0v500" stroke="rgba(255,255,255,.12)" strokeWidth="2" />
        <circle cx="250" cy="250" r="3" fill="rgba(255,255,255,.3)" />
        {TRONERAS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={mesa.tronera} fill="#0b0b0b" />)}
        {posiciones.filter((b) => b.en).map((b) => <Bola key={b.n} n={b.n} x={b.x} y={b.y} r={r} />)}
        {puedeApuntar && (
          <>
            {partida.config.ayudaPunteria && (
              <line x1={blanca.x + dx * r} y1={blanca.y + dy * r} x2={blanca.x + dx * 420} y2={blanca.y + dy * 420} stroke="rgba(255,255,255,.55)" strokeWidth="2" strokeDasharray="8 8" />
            )}
            {/* taco */}
            <line
              x1={blanca.x - dx * (r + 8 + fuerza * 0.9)}
              y1={blanca.y - dy * (r + 8 + fuerza * 0.9)}
              x2={blanca.x - dx * (r + 330 + fuerza * 0.9)}
              y2={blanca.y - dy * (r + 330 + fuerza * 0.9)}
              stroke="#c8935a"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>

      {puedeApuntar && (
        <div className="pool-controles">
          <label className="pool-fuerza">
            Fuerza <b>{fuerza}%</b>
            <input type="range" min="5" max="100" value={fuerza} onChange={(e) => setFuerza(Number(e.target.value))} />
          </label>
          <button className="btn grande" onClick={() => accion('tirar', { angulo, fuerza: fuerza / 100 })}>¡Tirar!</button>
          <p className="ayuda">Mové el mouse (o el dedo) para apuntar; al soltar queda fija. Tocá la mesa de nuevo para cambiarla.</p>
        </div>
      )}
    </div>
  );
}

JuegoPool.textoFinal = (p, gane) =>
  p.motivoFin === 'ocho' ? (gane ? '¡Metiste la 8!' : 'Metió la 8.') : gane ? 'Al rival se le fue la 8 antes de tiempo.' : 'Se te fue la 8 antes de tiempo.';
JuegoPool.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.turno === ctx.yo ? `po-${p.ultimoTiro?.id || 0}` : null);
