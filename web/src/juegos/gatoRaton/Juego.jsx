import { useEffect, useMemo, useRef, useState } from 'react';
import { Icono } from '../../iconos.jsx';
import { Cartel, Confeti, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

const TECLAS = {
  ArrowUp: 'arriba', ArrowRight: 'derecha', ArrowDown: 'abajo', ArrowLeft: 'izquierda',
  w: 'arriba', d: 'derecha', s: 'abajo', a: 'izquierda',
};
const MOTIVO = {
  quesos: (gane) => (gane ? '¡Te comiste todos los quesos!' : 'El ratón se comió todos los quesos'),
  atrapado: (gane) => (gane ? '¡Lo atrapaste!' : '¡Te atrapó el gato!'),
  tiempo: (gane) => (gane ? 'Se le terminó el tiempo al ratón' : 'Se te terminó el tiempo'),
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
        {gatoSoyYo ? <>¡Salió gato! <b>Vos sos el gato</b>: atrapá a {nombreRival}</> : <>¡Salió ratón! <b>Vos sos el ratón</b>: comete los quesos</>}
      </p>
    </div>
  );
}

export default function JuegoGatoRaton({ partida, accion, ctx }) {
  const p = partida;
  const { paredes, raton, gato, quesos, madrigueras, miRol, config } = p;
  const lado = paredes.length;
  const jugando = p.estado === 'jugando' && (p.fase === 'jugando' || p.fase === 'cuenta');

  // Reloj local (el server manda cuánto falta en cada cambio).
  const base = useMemo(() => ({ t: Date.now(), falta: p.faltaMs, cuenta: p.faltaCuentaMs }), [p.faltaMs, p.faltaCuentaMs]);
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    if (!jugando) return undefined;
    const t = setInterval(() => setAhora(Date.now()), 200);
    return () => clearInterval(t);
  }, [jugando]);
  const pasado = Math.max(0, ahora - base.t);
  const cuenta = p.fase === 'cuenta' ? Math.ceil(Math.max(0, base.cuenta - pasado) / 1000) : 0;
  const segundos = Math.ceil(Math.max(0, base.falta - (p.fase === 'jugando' ? pasado : 0)) / 1000);

  // Para dónde mira cada uno (según su último paso).
  const [mira, setMira] = useState({ gato: 1, raton: 1 });
  useEffect(() => {
    const u = p.ultimo;
    if (u && (u.dir === 'izquierda' || u.dir === 'derecha')) setMira((m) => ({ ...m, [u.quien]: u.dir === 'izquierda' ? -1 : 1 }));
  }, [p.ultimo, p.movs]);

  const mover = (dir) => { if (jugando) accion('mover', { dir }); };
  const moverRef = useRef(mover);
  moverRef.current = mover;

  // Flechitas del teclado (y WASD). No molesta si estás escribiendo en el chat.
  useEffect(() => {
    const tecla = (e) => {
      const dir = TECLAS[e.key] ?? TECLAS[e.key?.toLowerCase?.()];
      if (!dir || e.repeat || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      e.preventDefault();
      moverRef.current(dir);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  // En el celular: deslizar el dedo sobre el laberinto.
  const toque = useRef(null);
  const empezarToque = (e) => { const t = e.touches[0]; toque.current = [t.clientX, t.clientY]; };
  const moverToque = (e) => {
    if (!toque.current) return;
    const t = e.touches[0];
    const dx = t.clientX - toque.current[0]; const dy = t.clientY - toque.current[1];
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    mover(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'derecha' : 'izquierda') : (dy > 0 ? 'abajo' : 'arriba'));
    toque.current = [t.clientX, t.clientY];
  };

  // La moneda al aire solo al arrancar la partida.
  const [moneda, setMoneda] = useState(() => p.ronda === 1 && p.fase === 'cuenta' && p.movs === 0);
  useEffect(() => {
    if (!moneda) return undefined;
    const t = setTimeout(() => setMoneda(false), 2800);
    return () => clearTimeout(t);
  }, [moneda]);

  // Queso comido, cambio de ronda y final de ronda.
  const comio = useRef(p.comidos);
  useEffect(() => {
    if (p.comidos > comio.current) efectoSonido.moneda?.();
    comio.current = p.comidos;
  }, [p.comidos]);
  const cambio = useEfecto(`r${p.ronda}`, () => ({ rol: miRol }), 2400);
  const fin = useEfecto(p.ultimaRonda ? `f${p.ultimaRonda.ronda}` : null, () => {
    const u = p.ultimaRonda;
    if (u.motivo === 'atrapado') efectoSonido.explosion(false);
    else if (u.mia) efectoSonido.fanfarria();
    return { ...u };
  }, 2600);

  const rastro = new Set(p.rastro.map(([f, c]) => `${f},${c}`));
  const pos = ([f, c]) => ({ left: `${(c / lado) * 100}%`, top: `${(f / lado) * 100}%`, width: `${100 / lado}%`, height: `${100 / lado}%` });
  const total = config.quesos;

  let estado;
  if (p.fase === 'resumen') estado = `Fin de la ronda ${p.ronda}`;
  else if (p.fase === 'cuenta') estado = '¡Preparate!';
  else estado = miRol === 'gato' ? '¡Atrapalo!' : '¡A comer quesos!';

  return (
    <div className="gr">
      {moneda && <Moneda gatoSoyYo={miRol === 'gato'} nombreRival={ctx.nombreRival} />}
      {cambio && !moneda && p.ronda > 1 && <Cartel key={cambio.id} texto={`Ronda ${p.ronda}`} sub={cambio.rol === 'gato' ? 'Ahora sos el gato' : 'Ahora sos el ratón'} />}
      {fin && (
        <>
          <Cartel key={fin.id} tipo={fin.rol === 'gato' ? 'hundido' : 'oro'} texto={fin.motivo === 'atrapado' ? '¡ATRAPADO!' : fin.motivo === 'tiempo' ? '¡TIEMPO!' : '¡TODOS LOS QUESOS!'} sub={MOTIVO[fin.motivo](fin.mia)} />
          {fin.mia && <Confeti key={`c${fin.id}`} cantidad={60} />}
        </>
      )}

      <div className="marcador">
        <span>Vos <b>{p.puntos.yo}</b></span>
        <span className="ronda">Ronda {p.ronda} de {config.rondas}</span>
        <span><b>{p.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${p.fase === 'jugando' ? 'tu-turno' : ''}`}>
        <span className="con-iconos gr-rol"><Icono id={miRol} tam={26} /> Sos el {miRol === 'gato' ? 'gato' : 'ratón'}</span>
        {estado}
        <small>
          {miRol === 'gato'
            ? 'Sos un poco más rápido, pero no podés entrar a las madrigueras.'
            : 'Escondete en las madrigueras: ahí el gato no entra.'}
        </small>
      </div>

      <div className="gr-datos">
        <span className={`gr-reloj ${segundos <= 10 && p.fase === 'jugando' ? 'apurado' : ''}`}>
          <Icono id="reloj" tam={22} /> {p.fase === 'resumen' ? '—' : `${segundos} s`}
        </span>
        <span className="gr-quesos" aria-label={`Quesos comidos: ${p.comidos} de ${total}`}>
          {Array.from({ length: total }, (_, i) => <i key={i} className={i < p.comidos ? 'comido' : ''}><Icono id="queso" tam={22} /></i>)}
        </span>
      </div>

      <div className="gr-zona">
        <div
          className={`gr-laberinto ${p.fase === 'jugando' ? 'activo' : ''}`}
          style={{ '--lado': lado, '--ms-gato': `${p.msGato}ms`, '--ms-raton': `${p.msRaton}ms` }}
          onTouchStart={empezarToque}
          onTouchMove={moverToque}
          onTouchEnd={() => { toque.current = null; }}
        >
          {paredes.map((fila, f) => fila.map((v, c) => {
            const k = `${f},${c}`;
            return <div key={k} className={`gr-celda ${v & 1 ? 'pa' : ''} ${v & 2 ? 'pd' : ''} ${v & 4 ? 'pb' : ''} ${v & 8 ? 'pi' : ''} ${rastro.has(k) ? 'rastro' : ''}`} />;
          }))}
          {madrigueras.map((m) => <span key={`m${m}`} className="gr-pieza madriguera" style={pos(m)}><Icono id="madriguera" /></span>)}
          {quesos.map((q) => <span key={`q${q}`} className="gr-pieza queso" style={pos(q)}><Icono id="queso" /></span>)}
          <span className={`gr-pieza raton ${miRol === 'raton' ? 'mia' : ''}`} style={{ ...pos(raton), '--mira': mira.raton }}><Icono id="raton" /></span>
          <span className={`gr-pieza gato ${miRol === 'gato' ? 'mia' : ''}`} style={{ ...pos(gato), '--mira': mira.gato }}><Icono id="gato" /></span>
          {cuenta > 0 && !moneda && <div className="gr-cuenta" key={cuenta}>{cuenta}</div>}
        </div>

        <div className="gr-control" aria-label="Mover">
          {[['arriba', 0], ['izquierda', -90], ['derecha', 90], ['abajo', 180]].map(([dir, giro]) => (
            <button
              key={dir}
              type="button"
              className={`btn fantasma ${dir} ${p.miDir === dir ? 'va' : ''} ${p.quiero === dir ? 'quiere' : ''}`}
              disabled={!jugando}
              onPointerDown={(e) => { e.preventDefault(); mover(dir); }}
              aria-label={dir}
            >
              <Flecha giro={giro} />
            </button>
          ))}
          <span className="centro"><Icono id={miRol} tam={30} /></span>
          <p className="ayuda">Tocá una flecha (o deslizá el dedo) y sigue solo hasta la próxima pared. Si pedís doblar antes, dobla en la primera esquina que pueda.</p>
        </div>
      </div>

      {p.fase === 'resumen' && p.estado === 'jugando' && p.ultimaRonda && (
        <div className="tarjeta gr-resumen">
          <h3>{p.ultimaRonda.mia ? '¡Ganaste la ronda!' : `${ctx.nombreRival} ganó la ronda`}</h3>
          <p className="sub">{MOTIVO[p.ultimaRonda.motivo](p.ultimaRonda.mia)} · Van {p.puntos.yo} a {p.puntos.rival}</p>
          <p className="sub">En la próxima ronda se cambian: vas a ser el {miRol === 'gato' ? 'ratón' : 'gato'}, con laberinto nuevo.</p>
          <button className="btn" disabled={p.listosSiguiente.includes('yo')} onClick={() => accion('siguiente')}>
            {p.listosSiguiente.includes('yo') ? `Esperando a ${ctx.nombreRival}…` : 'Siguiente ronda →'}
          </button>
        </div>
      )}
    </div>
  );
}

JuegoGatoRaton.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival} en ${p.rondas.length} ronda${p.rondas.length === 1 ? '' : 's'}.`;

JuegoGatoRaton.claveTurno = (p) => (p.estado === 'jugando' && p.fase === 'cuenta' ? `gr-${p.ronda}` : null);
