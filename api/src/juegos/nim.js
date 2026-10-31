// Nim: hay pilas de palitos; por turno sacás los que quieras (o hasta un límite) de UNA sola pila.
// Modo clásico de bar: el que se lleva el último palito pierde (o, si se elige, gana).
// Varias rondas; arranca uno distinto en cada una.
import { ErrorJuego, entero, PartidaGrupal } from './comun.js';

export const CONFIG_DEFECTO = { armado: 'clasico', pilas: 4, maximo: 7, limite: 0, ultimo: 'pierde', rondas: 3 };
export const CLASICO = [1, 3, 5, 7]; // la pirámide de siempre
const PAUSA_MS = 3200;

export function validarConfig(c = {}) {
  const config = {
    armado: c.armado ?? CONFIG_DEFECTO.armado,
    pilas: entero(c.pilas ?? CONFIG_DEFECTO.pilas, 2, 6, 'Las pilas'),
    maximo: entero(c.maximo ?? CONFIG_DEFECTO.maximo, 3, 12, 'Los palitos por pila'),
    limite: entero(c.limite ?? CONFIG_DEFECTO.limite, 0, 5, 'El máximo por jugada'),
    ultimo: c.ultimo ?? CONFIG_DEFECTO.ultimo,
    rondas: entero(c.rondas ?? CONFIG_DEFECTO.rondas, 1, 9, 'Las rondas'),
  };
  if (!['clasico', 'azar'].includes(config.armado)) throw new ErrorJuego('Armado inválido');
  if (!['pierde', 'gana'].includes(config.ultimo)) throw new ErrorJuego('Regla del último inválida');
  return config;
}

// Para el bot: ¿la posición es ganadora para el que mueve? (con o sin límite por jugada)
export function nimSuma(pilas, limite = 0) {
  return pilas.reduce((x, n) => x ^ (limite ? n % (limite + 1) : n), 0);
}

export class PartidaNim extends PartidaGrupal {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    super('nim', jugadores, config);
    this.rand = rand;
    this.ronda = 0;
    this.historial = [];
    this.primero = rand() < 0.5 ? jugadores[0] : jugadores[1];
    this.#nuevaRonda();
  }

  #nuevaRonda() {
    this.ronda++;
    const { armado, pilas, maximo } = this.config;
    const rand = this.rand ?? Math.random;
    this.pilas = armado === 'clasico'
      ? CLASICO.slice(0, pilas).concat(Array(Math.max(0, pilas - 4)).fill(0).map((_, i) => 9 + i * 2)).map((n) => Math.min(n, maximo))
      : Array.from({ length: pilas }, () => 1 + Math.floor(rand() * maximo));
    const otro = this.jugadores.find((j) => j !== this.primero);
    this.turno = this.ronda % 2 === 1 ? this.primero : otro;
    this.ultima = null;
    this.resultado = null;
    this.irA('jugando');
  }

  accion(j, tipo, datos = {}) {
    this.validar(j);
    if (tipo !== 'sacar') throw new ErrorJuego('Acción desconocida');
    if (this.fase !== 'jugando') throw new ErrorJuego('Esperá la próxima ronda');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    const pila = entero(datos.pila, 0, this.pilas.length - 1, 'La pila');
    const tope = this.config.limite || this.pilas[pila];
    if (!this.pilas[pila]) throw new ErrorJuego('Esa pila está vacía');
    const cantidad = entero(datos.cantidad, 1, Math.min(tope, this.pilas[pila]), 'Los palitos');
    this.pilas[pila] -= cantidad;
    this.ultima = { quien: j, pila, cantidad };
    const otro = this.jugadores.find((x) => x !== j);
    if (this.pilas.every((n) => n === 0)) {
      const gana = this.config.ultimo === 'gana' ? j : otro;
      this.puntos[gana]++;
      this.historial.push(gana);
      this.resultado = { gana, ultimo: j };
      if (this.ronda >= this.config.rondas) return this.terminar();
      return this.irA('fin-ronda', PAUSA_MS);
    }
    this.turno = otro;
  }

  alVencer() {
    if (this.fase === 'fin-ronda') this.#nuevaRonda();
  }

  vistaPara(j) {
    return {
      ...this.vistaBase(j),
      ronda: this.ronda,
      pilas: this.pilas,
      turno: this.turno,
      ultima: this.ultima,
      resultado: this.resultado,
      historial: this.historial,
    };
  }
}
