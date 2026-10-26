import { useEffect, useRef, useState } from 'react';

// Arco de 300x120 dentro de un SVG de 360x220. Centro de cada zona.
function centroZona(z, zonas) {
  const filas = zonas === 9 ? 3 : 2;
  const col = z % 3;
  const fila = Math.floor(z / 3);
  return [30 + 50 + col * 100, 20 + 120 / filas / 2 + (fila * 120) / filas];
}

export default function JuegoPenales({ partida, accion, ctx }) {
  const { config, rol, ultimo, serie, goles } = partida;
  const zonas = config.zonas;
  const filas = zonas === 9 ? 3 : 2;
  const puedoElegir = partida.estado === 'jugando' && !partida.yaElegi;
  const [anim, setAnim] = useState(null); // { pelota: [x,y], arquero: [x,y], gol, pateoYo }
  const visto = useRef(ultimo?.id || 0);

  useEffect(() => {
    if (!ultimo || ultimo.id === visto.current) return;
    visto.current = ultimo.id;
    setAnim({ fase: 0, ...ultimo });
    const t1 = setTimeout(() => setAnim((a) => a && { ...a, fase: 1 }), 30);
    const t2 = setTimeout(() => setAnim(null), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [ultimo]);

  const [px, py] = anim?.fase ? centroZona(anim.patea, zonas) : [180, 200];
  const [ax, ay] = anim?.fase ? centroZona(anim.ataja, zonas) : [180, 100];
  const inclinacion = anim?.fase ? (ax < 170 ? -60 : ax > 190 ? 60 : 0) : 0;
  const total = Math.max(config.tiros, serie.yo.length, serie.rival.length);

  return (
    <div className="penales">
      <div className="marcador">
        <span>Vos <b>{goles.yo}</b></span>
        <span className="ronda">{partida.muerteSubita ? 'Muerte súbita' : `Penal ${partida.numero}`}</span>
        <span><b>{goles.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className="penales-series">
        {[['Vos', serie.yo], [ctx.nombreRival, serie.rival]].map(([quien, s]) => (
          <div key={quien} className="penales-serie">
            <small>{quien}</small>
            {Array.from({ length: total }, (_, i) => <span key={i} className={`bolita ${s[i] === true ? 'gol' : s[i] === false ? 'errado' : ''}`} />)}
          </div>
        ))}
      </div>

      <div className={`estado-cinta ${puedoElegir ? 'tu-turno' : ''}`}>
        {partida.estado !== 'jugando'
          ? 'Terminó la serie'
          : puedoElegir
            ? rol === 'pateador' ? '¡Te toca patear! Elegí dónde' : '¡Te toca atajar! Elegí hacia dónde tirarte'
            : `Listo. Esperando a ${ctx.nombreRival}…`}
        <small>{rol === 'pateador' ? `Pateás vos, ataja ${ctx.nombreRival}` : `Patea ${ctx.nombreRival}, atajás vos`}{partida.rivalEligio && partida.estado === 'jugando' ? ` · ${ctx.nombreRival} ya eligió` : ''}</small>
      </div>

      <div className="penales-cancha">
        <svg viewBox="0 0 360 220" className="penales-svg">
          <rect width="360" height="220" fill="#3ea05a" />
          <path d="M0 150h360" stroke="#fff" strokeWidth="2" opacity=".7" />
          {/* red */}
          <rect x="30" y="20" width="300" height="120" fill="#e9f2f7" opacity=".25" />
          {Array.from({ length: 15 }, (_, i) => <path key={`v${i}`} d={`M${30 + i * 20} 20v120`} stroke="#fff" strokeWidth=".6" opacity=".5" />)}
          {Array.from({ length: 6 }, (_, i) => <path key={`h${i}`} d={`M30 ${20 + i * 20}h300`} stroke="#fff" strokeWidth=".6" opacity=".5" />)}
          {/* zonas */}
          {Array.from({ length: zonas }, (_, z) => {
            const col = z % 3;
            const fila = Math.floor(z / 3);
            return (
              <rect
                key={z}
                x={30 + col * 100}
                y={20 + (fila * 120) / filas}
                width="100"
                height={120 / filas}
                className={`zona ${puedoElegir ? 'elegible' : ''} ${rol}`}
                onClick={() => puedoElegir && accion('elegir', { zona: z })}
              />
            );
          })}
          {/* palos */}
          <path d="M30 140V20h300v120" stroke="#fff" strokeWidth="6" fill="none" strokeLinejoin="round" />
          {/* arquero */}
          <g className="arquero" style={{ transform: `translate(${ax - 180}px, ${ay - 100}px) rotate(${inclinacion}deg)`, transformOrigin: '180px 110px' }}>
            <circle cx="180" cy="78" r="9" fill="#f2c79b" />
            <rect x="170" y="88" width="20" height="28" rx="6" fill="#ffb703" />
            <path d="M170 92l-16 -10M190 92l16 -10" stroke="#ffb703" strokeWidth="6" strokeLinecap="round" />
            <circle cx="153" cy="81" r="4.5" fill="#fff" />
            <circle cx="207" cy="81" r="4.5" fill="#fff" />
            <path d="M175 116l-3 16M185 116l3 16" stroke="#222" strokeWidth="6" strokeLinecap="round" />
          </g>
          {/* pelota */}
          <g className="pelota" style={{ transform: `translate(${px - 180}px, ${py - 200}px) scale(${anim?.fase ? 0.7 : 1})`, transformOrigin: '180px 200px' }}>
            <circle cx="180" cy="200" r="9" fill="#fff" stroke="#222" strokeWidth="1.5" />
            <path d="M180 194l4 3-1.5 5h-5l-1.5-5z" fill="#222" />
          </g>
        </svg>
        {anim?.fase === 1 && (
          <div className={`penales-cartel ${anim.gol ? 'gol' : 'atajado'}`}>{anim.gol ? '¡GOOOL!' : '¡ATAJADO!'}</div>
        )}
      </div>
      {puedoElegir && <p className="ayuda centrado">Tocá una zona del arco.</p>}
    </div>
  );
}

JuegoPenales.textoFinal = (p) => `Terminó ${p.goles.yo} a ${p.goles.rival}.`;
JuegoPenales.claveTurno = (p) => (p.estado === 'jugando' && !p.yaElegi ? `pe-${p.numero}` : null);
