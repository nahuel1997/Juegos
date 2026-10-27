import { useEffect, useState } from 'react';
import { Icono } from '../../iconos.jsx';
import { Cartel, Confeti, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

// Mismas direcciones y bits de pared que el servidor.
const DIRS = {
  arriba: { bit: 1, df: -1, dc: 0 },
  derecha: { bit: 2, df: 0, dc: 1 },
  abajo: { bit: 4, df: 1, dc: 0 },
  izquierda: { bit: 8, df: 0, dc: -1 },
};
const TECLAS = {
  ArrowUp: 'arriba', ArrowRight: 'derecha', ArrowDown: 'abajo', ArrowLeft: 'izquierda',
  w: 'arriba', d: 'derecha', s: 'abajo', a: 'izquierda',
};
const MOTIVO = {
  queso: (gane) => (gane ? '¡Llegaste al queso!' : 'El ratón llegó al queso'),
  atrapado: (gane) => (gane ? '¡Lo atrapaste!' : '¡Te atrapó el gato!'),
  acorralado: (gane) => (gane ? 'Lo acorralaste: no tenía salida' : 'Te acorralaron: no tenías salida'),
  tiempo: (gane) => (gane ? 'Se le acabaron los movimientos al ratón' : 'Se te acabaron los movimientos'),
};

// Flechita SVG propia para el control en pantalla.
const Flecha = ({ giro }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" style={{ transform: `rotate(${giro}deg)` }} aria-hidden="true">
    <path d="M12 4l8 9h-5v7H9v-7H4z" fill="currentColor" />
  </svg>
);

// La moneda al aire del principio: gira y cae del lado del gato o del ratón.
function Moneda({ gatoSoyYo, nombreRival }) {
  return (
    <div className="moneda-show" aria-live="polite">
      <div className={`moneda ${gatoSoyYo ? 'cae-gato' : 'cae-raton'}`}>
        <span className="cara gato-cara"><Icono id="gato" tam={84} /></span>
        <span className="cara raton-cara"><Icono id="raton" tam={84} /></span>
      </div>
      <p className="moneda-texto">
        {gatoSoyYo ? <>¡Salió gato! <b>Vos sos el gato</b>: atrapá a {nombreRival}</> : <>¡Salió ratón! <b>Vos sos el ratón</b>: llegá al queso</>}
      </p>
    </div>
  );
}

export default function JuegoGatoRaton({ partida, accion, ctx }) {
  const { paredes, raton, gato, queso, madriguera, miRol, config } = partida;
  const lado = paredes.length;
  const jugando = partida.estado === 'jugando' && partida.fase === 'jugando';
  const miTurno = jugando && partida.turno === ctx.yo;
  const yoPos = miRol === 'gato' ? gato : raton;
  const quedan = config.limite - partida.movsRaton;

  // Para dónde mira cada uno (según su último paso).
  const [mira, setMira] = useState({ gato: 1, raton: 1 });
  useEffect(() => {
    const u = partida.ultimo;
    if (u && (u.dir === 'izquierda' || u.dir === 'derecha')) setMira((m) => ({ ...m, [u.quien]: u.dir === 'izquierda' ? -1 : 1 }));
  }, [partida.ultimo, partida.movsRaton, partida.movsGato]);

  const puede = (dir) => {
    if (!miTurno) return false;
    const d = DIRS[dir];
    if (paredes[yoPos[0]][yoPos[1]] & d.bit) return false;
    const h = [yoPos[0] + d.df, yoPos[1] + d.dc];
    if (miRol === 'gato') return !(h[0] === queso[0] && h[1] === queso[1]);
    return !(h[0] === gato[0] && h[1] === gato[1]);
  };
  const mover = (dir) => { if (puede(dir)) accion('mover', { dir }); };

  // Flechitas del teclado (y WASD). No molesta si estás escribiendo en el chat.
  useEffect(() => {
    const tecla = (e) => {
      const dir = TECLAS[e.key] ?? TECLAS[e.key?.toLowerCase?.()];
      if (!dir || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      e.preventDefault();
      mover(dir);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  // La moneda al aire solo al arrancar la partida.
  const [moneda, setMoneda] = useState(() => partida.ronda === 1 && partida.movsRaton === 0 && partida.movsGato === 0 && jugando);
  useEffect(() => {
    if (!moneda) return;
    const t = setTimeout(() => setMoneda(false), 3600);
    return () => clearTimeout(t);
  }, [moneda]);

  // Cambio de ronda (se invierten los papeles) y final de ronda.
  const cambio = useEfecto(`r${partida.ronda}`, () => ({ rol: miRol }), 2400);
  const fin = useEfecto(partida.ultimaRonda ? `f${partida.ultimaRonda.ronda}` : null, () => {
    const u = partida.ultimaRonda;
    if (u.motivo === 'atrapado' || u.motivo === 'acorralado') efectoSonido.explosion(false);
    else if (u.mia) efectoSonido.fanfarria();
    return { ...u };
  }, 2600);

  const posiblesPasos = new Set(Object.keys(DIRS).filter(puede).map((dir) => `${yoPos[0] + DIRS[dir].df},${yoPos[1] + DIRS[dir].dc}`));
  const dirHacia = (f, c) => Object.keys(DIRS).find((dir) => yoPos[0] + DIRS[dir].df === f && yoPos[1] + DIRS[dir].dc === c);
  const rastro = new Set(partida.rastro.map(([f, c]) => `${f},${c}`));
  const pos = ([f, c]) => ({ left: `${(c / lado) * 100}%`, top: `${(f / lado) * 100}%`, width: `${100 / lado}%`, height: `${100 / lado}%` });

  let estado;
  if (partida.fase === 'resumen') estado = `Fin de la ronda ${partida.ronda}`;
  else if (miTurno) estado = miRol === 'gato' ? '¡Te toca! Mové al gato' : '¡Te toca! Mové al ratón';
  else estado = `Mueve ${ctx.nombreRival} (${miRol === 'gato' ? 'ratón' : 'gato'})…`;

  return (
    <div className="gr">
      {moneda && <Moneda gatoSoyYo={miRol === 'gato'} nombreRival={ctx.nombreRival} />}
      {cambio && !moneda && <Cartel key={cambio.id} texto={`Ronda ${partida.ronda}`} sub={cambio.rol === 'gato' ? 'Ahora sos el gato' : 'Ahora sos el ratón'} />}
      {fin && (
        <>
          <Cartel key={fin.id} tipo={fin.rol === 'gato' ? 'hundido' : 'oro'} texto={fin.rol === 'gato' ? '¡ATRAPADO!' : '¡AL QUESO!'} sub={MOTIVO[fin.motivo](fin.mia)} />
          {fin.mia && <Confeti key={`c${fin.id}`} cantidad={60} />}
        </>
      )}

      <div className="marcador">
        <span>Vos <b>{partida.puntos.yo}</b></span>
        <span className="ronda">Ronda {partida.ronda} de {config.rondas}</span>
        <span><b>{partida.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        <span className="con-iconos gr-rol"><Icono id={miRol} tam={26} /> Sos el {miRol === 'gato' ? 'gato' : 'ratón'}</span>
        {estado}
        <small>
          {miRol === 'gato' ? 'Atrapalo antes de que llegue al queso (vos no podés pisar el queso).' : 'Llegá de la madriguera al queso sin que te agarre el gato.'}
          {' '}Al ratón le quedan {quedan} movimiento{quedan === 1 ? '' : 's'}.
        </small>
      </div>

      <div className="gr-zona">
        <div className={`gr-laberinto ${miTurno ? 'activo' : ''}`} style={{ '--lado': lado }}>
          {paredes.map((fila, f) => fila.map((p, c) => {
            const k = `${f},${c}`;
            const paso = posiblesPasos.has(k);
            return (
              <div
                key={k}
                className={`gr-celda ${p & 1 ? 'pa' : ''} ${p & 2 ? 'pd' : ''} ${p & 4 ? 'pb' : ''} ${p & 8 ? 'pi' : ''} ${rastro.has(k) ? 'rastro' : ''} ${paso ? 'paso' : ''}`}
                onClick={paso ? () => mover(dirHacia(f, c)) : undefined}
              />
            );
          }))}
          <span className="gr-pieza madriguera" style={pos(madriguera)}><Icono id="madriguera" /></span>
          <span className="gr-pieza queso" style={pos(queso)}><Icono id="queso" /></span>
          <span className={`gr-pieza raton ${miRol === 'raton' ? 'mia' : ''}`} style={{ ...pos(raton), '--mira': mira.raton }}><Icono id="raton" /></span>
          <span className={`gr-pieza gato ${miRol === 'gato' ? 'mia' : ''}`} style={{ ...pos(gato), '--mira': mira.gato }}><Icono id="gato" /></span>
        </div>

        <div className="gr-control" aria-label="Mover">
          <button type="button" className="btn fantasma arriba" disabled={!puede('arriba')} onClick={() => mover('arriba')} aria-label="Arriba"><Flecha giro={0} /></button>
          <button type="button" className="btn fantasma izquierda" disabled={!puede('izquierda')} onClick={() => mover('izquierda')} aria-label="Izquierda"><Flecha giro={-90} /></button>
          <span className="centro"><Icono id={miRol} tam={30} /></span>
          <button type="button" className="btn fantasma derecha" disabled={!puede('derecha')} onClick={() => mover('derecha')} aria-label="Derecha"><Flecha giro={90} /></button>
          <button type="button" className="btn fantasma abajo" disabled={!puede('abajo')} onClick={() => mover('abajo')} aria-label="Abajo"><Flecha giro={180} /></button>
          <p className="ayuda">Movete con las flechitas del teclado, estos botones o tocando la casilla.</p>
        </div>
      </div>

      {partida.fase === 'resumen' && partida.estado === 'jugando' && partida.ultimaRonda && (
        <div className="tarjeta gr-resumen">
          <h3>{partida.ultimaRonda.mia ? '¡Ganaste la ronda!' : `${ctx.nombreRival} ganó la ronda`}</h3>
          <p className="sub">{MOTIVO[partida.ultimaRonda.motivo](partida.ultimaRonda.mia)} · Van {partida.puntos.yo} a {partida.puntos.rival}</p>
          <p className="sub">En la próxima ronda se cambian: vas a ser el {miRol === 'gato' ? 'ratón' : 'gato'}, con laberinto nuevo.</p>
          <button className="btn" disabled={partida.listosSiguiente.includes('yo')} onClick={() => accion('siguiente')}>
            {partida.listosSiguiente.includes('yo') ? `Esperando a ${ctx.nombreRival}…` : 'Siguiente ronda →'}
          </button>
        </div>
      )}
    </div>
  );
}

JuegoGatoRaton.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival} en ${p.rondas.length} ronda${p.rondas.length === 1 ? '' : 's'}.`;

JuegoGatoRaton.claveTurno = (p, ctx) =>
  p.estado === 'jugando' && p.fase === 'jugando' && p.turno === ctx.yo ? `gr-${p.ronda}-${p.movsRaton}-${p.movsGato}` : null;
