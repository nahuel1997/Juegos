import { useEffect, useMemo, useRef, useState } from 'react';
import { MarcadorN, useFalta } from '../../componentes/comunes.jsx';
import { Cartel, useEfecto } from '../../efectos.jsx';
import { efectoSonido, tono } from '../../sonido.js';
import { marca, puedeSacar, anchoZona } from '../../../../api/src/juegos/jenga.js';

// La barra del pulso: la marca va y viene; hay que frenarla en la zona verde.
function Pulso({ intento, miTurno, sacar }) {
  const inicioLocal = useMemo(() => Date.now() - intento.transcurrido, [intento.inicio]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pos, setPos] = useState(marca(intento.transcurrido));
  const listo = useRef(false);
  useEffect(() => {
    listo.current = false;
    let raf;
    const mover = () => { setPos(marca(Date.now() - inicioLocal)); raf = requestAnimationFrame(mover); };
    raf = requestAnimationFrame(mover);
    return () => cancelAnimationFrame(raf);
  }, [inicioLocal]);
  const tirar = () => {
    if (!miTurno || listo.current) return;
    listo.current = true;
    sacar(Date.now() - inicioLocal);
  };
  useEffect(() => {
    if (!miTurno) return undefined;
    const tecla = (e) => { if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) { e.preventDefault(); tirar(); } };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });
  const { centro, ancho } = intento;
  return (
    <div className="jg-pulso">
      <div className="jg-barra" onPointerDown={(e) => { e.preventDefault(); tirar(); }}>
        <span className="jg-verde" style={{ left: `${(centro - ancho / 2) * 100}%`, width: `${ancho * 100}%` }} />
        <span className="jg-marca" style={{ left: `${pos * 100}%` }} />
      </div>
      {miTurno && (
        <button type="button" className="btn grande jg-sacar" onPointerDown={(e) => { e.preventDefault(); tirar(); }}>
          ¡Sacar! <small>(o la barra espaciadora)</small>
        </button>
      )}
    </div>
  );
}

export default function JuegoJenga({ partida, accion, ctx }) {
  const p = partida;
  const miTurno = p.estado === 'jugando' && p.turno === ctx.yo && !p.fuera.includes(ctx.yo);
  const eligiendo = miTurno && p.fase === 'eligiendo';
  const falta = useFalta(p.faltaMs, `${p.fase}-${p.turno}-${p.torre.length}-${p.ultimo?.piso}`);
  const seg = falta == null ? null : Math.ceil(falta / 1000);
  const [mira, setMira] = useState(null); // bloque bajo el dedo (para mostrar qué tan difícil es)

  const ult = p.ultimo;
  useEfecto(ult ? `jg-${p.ronda}-${p.torre.length}-${ult.piso}-${ult.pos}-${ult.ok}-${p.tambaleo}` : null, () => {
    if (ult.ok) tono(320, 0.12); else efectoSonido.explosion?.(false);
    return {};
  }, 50);
  const cayo = useEfecto(p.cayo ? `cae-${p.ronda}` : null, () => {
    efectoSonido.explosion?.(true);
    return { j: p.cayo };
  }, 3600);

  const cayendo = p.fase === 'cayendo' || (p.estado === 'terminada' && p.cayo);
  const pisos = [...p.torre.keys()].reverse(); // de arriba hacia abajo para dibujar

  let estado;
  if (cayendo) estado = p.cayo === ctx.yo ? '¡Se te cayó la torre!' : `¡${ctx.nombreDe(p.cayo)} tiró la torre!`;
  else if (p.fase === 'sacando') estado = miTurno ? '¡Frená la marca en la zona verde!' : `${ctx.nombreDe(p.turno)} está sacando un bloque…`;
  else if (eligiendo) estado = '¡Te toca! Elegí un bloque para sacar';
  else estado = `Elige ${ctx.nombreDe(p.turno)}…`;

  const riesgo = mira ? anchoZona(p.torre, mira[0], mira[1]) : null;

  return (
    <div className="jg">
      {cayo && <Cartel key={cayo.id} texto="¡SE CAYÓ!" sub={cayo.j === ctx.yo ? 'Perdiste la ronda' : `La tiró ${ctx.nombreDe(cayo.j)}`} tipo="hundido" />}
      <MarcadorN jugadores={p.jugadores} puntos={p.puntos} ctx={ctx} fuera={p.fuera} extra={`Ronda ${p.ronda} de ${p.config.rondas}`} />
      <div className={`estado-cinta ${miTurno && !cayendo ? 'tu-turno' : ''}`}>
        {estado}
        <small>
          {seg != null && !cayendo ? `${seg} s · ` : ''}Tambaleo: {Math.round(p.tambaleo * 100)} %
          {riesgo != null && eligiendo ? ` · este bloque: ${riesgo > 0.25 ? 'fácil' : riesgo > 0.15 ? 'medio' : riesgo > 0.08 ? 'difícil' : '¡muy arriesgado!'}` : ''}
        </small>
      </div>
      <div className="jg-escena">
        <div className={`jg-torre ${cayendo ? 'cae' : ''}`} style={{ '--tambaleo': p.tambaleo, '--pisos': p.torre.length }}>
          {pisos.map((piso) => (
            <div key={piso} className={`jg-piso ${piso % 2 ? 'b' : 'a'}`} style={{ '--i': piso }}>
              {p.torre[piso].map((hay, pos) => {
                const se = eligiendo && hay && puedeSacar(p.torre, piso, pos);
                const sacando = p.intento && p.intento.piso === piso && p.intento.pos === pos;
                return (
                  <button
                    key={pos}
                    type="button"
                    className={`jg-bloque ${hay ? '' : 'hueco'} ${se ? 'se' : ''} ${sacando ? 'sacando' : ''} ${ult && ult.piso === piso && ult.pos === pos && !ult.ok ? 'tembló' : ''}`}
                    style={{ '--r': ((piso * 7 + pos * 13) % 9) - 4 }}
                    disabled={!se}
                    onPointerEnter={() => se && setMira([piso, pos])}
                    onPointerLeave={() => setMira(null)}
                    onClick={() => { setMira(null); accion('elegir', { piso, pos }); }}
                    aria-label={hay ? `Piso ${piso + 1}, bloque ${pos + 1}` : 'hueco'}
                  />
                );
              })}
            </div>
          ))}
          <div className="jg-mesa" />
        </div>
      </div>
      {p.fase === 'sacando' && p.intento && (
        <>
          <Pulso key={p.intento.inicio} intento={p.intento} miTurno={miTurno} sacar={(t) => accion('sacar', { t })} />
          {miTurno && <div className="acciones centro"><button type="button" className="btn chico fantasma" onClick={() => accion('soltar')}>Mejor otro bloque (mueve un poco la torre)</button></div>}
        </>
      )}
    </div>
  );
}

JuegoJenga.textoFinal = (p, _g, ctx) => `Tiraron la torre: ${p.historial.map((j) => ctx?.nombreDe?.(j) ?? j).join(', ')}.`;
JuegoJenga.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.fase === 'eligiendo' && p.turno === ctx.yo ? `jg-${p.ronda}-${p.torre.length}-${p.tambaleo}` : null);
