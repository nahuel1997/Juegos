import { Carta } from '../escoba/Juego.jsx';
import { Icono } from '../../iconos.jsx';
import { Cartel, Confeti, useEfecto } from '../../efectos.jsx';
import { efectoSonido } from '../../sonido.js';

const PALOS = ['oros', 'copas', 'espadas', 'bastos'];
const ICONO = { oros: 'oro', copas: 'copa', espadas: 'espada', bastos: 'basto' };

// Caballito de carrera (SVG propio) con la montura del color del palo.
function Caballo({ palo, corre }) {
  const color = { oros: '#f2b705', copas: '#d62828', espadas: '#2c5aa0', bastos: '#2e7d32' }[palo];
  return (
    <svg viewBox="0 0 64 48" className={`cb-caballo ${corre ? 'corre' : ''}`} aria-hidden="true">
      <path className="cb-cuerpo" d="M14 24c0-6 6-9 14-9h12l8-9 4 2-2 6 6 6-3 3-6-3-2 6c0 5-3 8-8 8H24l-4 10h-4l1-11c-2-2-3-5-3-9z" />
      <path className="cb-pata a" d="M22 34l-5 12h4l5-11z" />
      <path className="cb-pata b" d="M36 34l4 12h4l-3-12z" />
      <path className="cb-cola" d="M14 22c-6-2-9 2-11 8 4-2 7-2 11-3z" />
      <rect x="24" y="14" width="12" height="9" rx="3" fill={color} stroke="#222" strokeWidth="1.5" />
      <circle cx="49" cy="10" r="1.6" fill="#222" />
    </svg>
  );
}

export default function JuegoCaballos({ partida, accion, ctx }) {
  const { config, pista, pos, duenio, ultima } = partida;
  const miTurno = partida.estado === 'jugando' && partida.turno === ctx.yo;
  const largo = config.largo;

  const fx = useEfecto(ultima?.retrocede?.length ? `r${partida.carrera}-${ultima.n}` : null, () => {
    efectoSonido.explosion(false);
    return { palos: ultima.retrocede.map((r) => r.palo), ms: 1400 };
  });
  const fin = useEfecto(partida.fase === 'fin' ? `f${partida.carrera}` : null, () => {
    const mio = duenio[partida.ganadorCarrera] === 'yo';
    if (mio) efectoSonido.fanfarria();
    return { mio, palo: partida.ganadorCarrera, ms: 3000 };
  });
  const carta = useEfecto(ultima?.tipo === 'carta' ? `c${partida.carrera}-${ultima.n}` : null, () => { efectoSonido.carta?.(); return { carta: ultima.carta, ms: 900 }; });

  const listo = partida.listosSiguiente.includes('yo');
  let estado;
  if (partida.fase === 'eligiendo') estado = miTurno ? '¡Elegí un caballo!' : `${ctx.nombreRival} está eligiendo caballo…`;
  else if (partida.fase === 'corriendo') estado = miTurno ? '¡Te toca! Dá vuelta una carta' : `${ctx.nombreRival} da vuelta…`;
  else estado = `Ganó el caballo de ${partida.ganadorCarrera}`;

  return (
    <div className="caballos">
      {fin && <><Cartel key={fin.id} tipo={fin.mio ? 'oro' : 'hundido'} texto={`¡GANÓ ${fin.palo.toUpperCase()}!`} sub={fin.mio ? 'Era tu caballo' : `Era de ${ctx.nombreRival}`} />{fin.mio && <Confeti key={`c${fin.id}`} cantidad={80} />}</>}
      <div className="marcador">
        <span>Vos <b>{partida.puntos.yo}</b></span>
        <span className="ronda">Carrera {partida.carrera} de {config.carreras}</span>
        <span><b>{partida.puntos.rival}</b> {ctx.nombreRival}</span>
      </div>
      <div className={`estado-cinta ${miTurno ? 'tu-turno' : ''}`}>
        {estado}
        {ultima?.tipo === 'carta' && <small>Salió el {ultima.carta.numero} de {ultima.carta.palo}: avanza {ultima.carta.palo}{ultima.retrocede.length ? ` · se dio vuelta la pista: retrocede ${ultima.retrocede.map((r) => r.palo).join(' y ')}` : ''}</small>}
      </div>

      <div className="cb-hipodromo" style={{ '--largo': largo + 2 }}>
        <div className="cb-fila cb-pista">
          <span className="cb-largada">Largada</span>
          {pista.map((c, i) => (
            <span key={i} className={`cb-lugar ${c.vista ? 'vista' : ''}`}>
              {c.vista ? <Carta carta={{ ...c, valor: c.numero }} chica /> : <Carta chica />}
            </span>
          ))}
          <span className="cb-meta">Meta</span>
        </div>
        {PALOS.map((palo) => {
          const d = duenio[palo];
          const elegible = partida.fase === 'eligiendo' && miTurno && !d;
          return (
            <div key={palo} className={`cb-fila cb-carril ${d || ''} ${partida.ganadorCarrera === palo ? 'gano' : ''}`}>
              <button type="button" className={`cb-nombre ${elegible ? 'elegible' : ''}`} disabled={!elegible} onClick={() => accion('elegir', { palo })}>
                <Icono id={ICONO[palo]} tam={22} />
                <small>{d === 'yo' ? 'Tuyo' : d === 'rival' ? ctx.nombreRival : elegible ? 'Elegir' : '—'}</small>
              </button>
              <span className="cb-recorrido">
                <span
                  className={`cb-jinete ${fx?.palos.includes(palo) ? 'atras' : ''}`}
                  style={{ left: `calc(${(Math.min(pos[palo], largo + 1) / (largo + 1)) * 100}% - ${(Math.min(pos[palo], largo + 1) / (largo + 1)) * 56}px)` }}
                >
                  <Caballo palo={palo} corre={carta?.carta?.palo === palo} />
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="cb-mazo">
        <button type="button" className={`cb-dar ${miTurno && partida.fase === 'corriendo' ? 'activo' : ''}`} disabled={!miTurno || partida.fase !== 'corriendo'} onClick={() => accion('carta')}>
          <Carta chica />
          <small>Dar vuelta ({partida.mazo})</small>
        </button>
        {ultima?.tipo === 'carta' && <span key={ultima.n} className="cb-salio"><Carta carta={{ ...ultima.carta, valor: ultima.carta.numero }} /></span>}
      </div>

      {partida.fase === 'fin' && partida.estado === 'jugando' && (
        <div className="acciones centro">
          <button className="btn" disabled={listo} onClick={() => accion('siguiente')}>{listo ? `Esperando a ${ctx.nombreRival}…` : 'Otra carrera →'}</button>
        </div>
      )}
    </div>
  );
}

JuegoCaballos.textoFinal = (p) => `Carreras: ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoCaballos.claveTurno = (p, ctx) => (p.estado === 'jugando' && p.turno === ctx.yo ? `cb-${p.carrera}-${p.ultima?.n ?? 0}` : null);
