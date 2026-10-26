// Piedra, papel o tijera al mejor de N. Los dos eligen a la vez y no se ve lo del otro hasta que
// eligieron los dos. Variante opcional con lagarto y Spock. Los empates no cuentan.
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { mejorDe: 3, variante: 'clasica' };

const LE_GANA = {
  clasica: { piedra: ['tijera'], papel: ['piedra'], tijera: ['papel'] },
  spock: {
    piedra: ['tijera', 'lagarto'],
    papel: ['piedra', 'spock'],
    tijera: ['papel', 'lagarto'],
    lagarto: ['papel', 'spock'],
    spock: ['piedra', 'tijera'],
  },
};

export function validarConfig(c = {}) {
  const variante = c.variante ?? CONFIG_DEFECTO.variante;
  if (!LE_GANA[variante]) throw new ErrorJuego('Variante desconocida');
  const mejorDe = entero(c.mejorDe ?? CONFIG_DEFECTO.mejorDe, 1, 15, 'Al mejor de');
  if (mejorDe % 2 === 0) throw new ErrorJuego('Tiene que ser un número impar (al mejor de 3, 5, 7…)');
  return { mejorDe, variante };
}

export class PartidaPiedraPapelTijera {
  constructor(jugadores, config = CONFIG_DEFECTO) {
    this.juego = 'piedra-papel-tijera';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = { [jugadores[0]]: 0, [jugadores[1]]: 0 };
    this.elecciones = {}; // ronda en curso
    this.rondas = []; // { jugadas: {j: x}, ganador: j | null }
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  accion(j, tipo, datos = {}) {
    const rival = this.rival(j);
    if (tipo !== 'elegir') throw new ErrorJuego('Acción desconocida');
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    const reglas = LE_GANA[this.config.variante];
    if (!reglas[datos.jugada]) throw new ErrorJuego('Jugada inválida');
    if (this.elecciones[j]) throw new ErrorJuego('Ya elegiste, esperá a tu rival');
    this.elecciones[j] = datos.jugada;
    if (!this.elecciones[rival]) return;

    const a = this.elecciones[j];
    const b = this.elecciones[rival];
    const ganador = a === b ? null : reglas[a].includes(b) ? j : rival;
    this.rondas.push({ jugadas: { ...this.elecciones }, ganador });
    this.elecciones = {};
    if (ganador) this.puntos[ganador]++;
    const necesarios = Math.ceil(this.config.mejorDe / 2);
    if (ganador && this.puntos[ganador] >= necesarios) {
      this.estado = 'terminada';
      this.ganador = ganador;
      this.motivoFin = 'puntos';
    }
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { puntos: this.puntos, rondas: this.rondas.length };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      opciones: Object.keys(LE_GANA[this.config.variante]),
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      necesarios: Math.ceil(this.config.mejorDe / 2),
      miEleccion: this.elecciones[j] || null,
      rivalEligio: !!this.elecciones[rival], // solo si eligió, no qué
      ronda: this.rondas.length + 1,
      rondas: this.rondas.map((r) => ({
        yo: r.jugadas[j],
        rival: r.jugadas[rival],
        resultado: r.ganador === null ? 'empate' : r.ganador === j ? 'gane' : 'perdi',
      })),
    };
  }
}
