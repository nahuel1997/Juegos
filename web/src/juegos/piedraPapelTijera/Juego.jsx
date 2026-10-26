import { Icono } from '../../iconos.jsx';

const NOMBRE = { piedra: 'Piedra', papel: 'Papel', tijera: 'Tijera', lagarto: 'Lagarto', spock: 'Spock' };

export default function JuegoPpt({ partida, accion, ctx }) {
  const { opciones, miEleccion, rivalEligio, rondas, puntos, necesarios } = partida;
  const ultima = rondas[rondas.length - 1];
  const jugando = partida.estado === 'jugando';

  return (
    <div className="ppt">
      <div className="marcador">
        <span>Vos <b>{puntos.yo}</b></span>
        <span className="ronda">Ronda {partida.ronda} · gana el primero a {necesarios}</span>
        <span><b>{puntos.rival}</b> {ctx.nombreRival}</span>
      </div>

      {ultima && (
        <div className={`ppt-duelo ${ultima.resultado}`} key={rondas.length}>
          <div className="ppt-mano yo"><Icono id={ultima.yo} tam={110} titulo={NOMBRE[ultima.yo]} /><small>Vos</small></div>
          <b className="ppt-vs">{ultima.resultado === 'gane' ? '¡Ganaste la ronda!' : ultima.resultado === 'perdi' ? 'Perdiste la ronda' : 'Empate'}</b>
          <div className="ppt-mano rival"><Icono id={ultima.rival} tam={110} titulo={NOMBRE[ultima.rival]} /><small>{ctx.nombreRival}</small></div>
        </div>
      )}

      {jugando && (
        <div className={`estado-cinta ${!miEleccion ? 'tu-turno' : ''}`}>
          {!miEleccion ? '¡Elegí!' : `Elegiste ${NOMBRE[miEleccion].toLowerCase()}. Esperando a ${ctx.nombreRival}…`}
          <small>{rivalEligio ? `${ctx.nombreRival} ya eligió` : `${ctx.nombreRival} todavía no eligió`}</small>
        </div>
      )}

      {jugando && (
        <div className="ppt-opciones">
          {opciones.map((o) => (
            <button key={o} type="button" className={`ppt-op ${miEleccion === o ? 'elegida' : ''}`} disabled={!!miEleccion} onClick={() => accion('elegir', { jugada: o })}>
              <Icono id={o} tam={72} />
              <span>{NOMBRE[o]}</span>
            </button>
          ))}
        </div>
      )}

      {rondas.length > 0 && (
        <div className="ppt-historial">
          {rondas.map((r, i) => (
            <span key={i} className={`ppt-chip ${r.resultado}`} title={`${NOMBRE[r.yo]} vs ${NOMBRE[r.rival]}`}>
              <Icono id={r.yo} tam={20} /><small>vs</small><Icono id={r.rival} tam={20} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

JuegoPpt.textoFinal = (p) => `Terminó ${p.puntos.yo} a ${p.puntos.rival}.`;
JuegoPpt.claveTurno = (p) => (p.estado === 'jugando' && !p.miEleccion ? `p-${p.ronda}` : null);
