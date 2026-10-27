// Ta te ti 1vs1, al mejor de N partidas (arranca uno y después el otro).
// Tablero de 3x3 a 5x5 y cuántas en línea. Variante "con movimiento": cada uno tiene solo 3 fichas
// (o tantas como haya que alinear) y, cuando las puso todas, en vez de poner mueve una a una casilla libre.
import { ErrorJuego, entero, ganadorPorPuntos } from './comun.js';

export const CONFIG_DEFECTO = { lado: 3, enLinea: 3, movimiento: false, partidas: 3 };

export function validarConfig(c = {}) {
  const config = {
    lado: entero(c.lado ?? CONFIG_DEFECTO.lado, 3, 5, 'El tamaño'),
    enLinea: entero(c.enLinea ?? CONFIG_DEFECTO.enLinea, 3, 5, 'Las fichas en línea'),
    movimiento: !!(c.movimiento ?? CONFIG_DEFECTO.movimiento),
    partidas: entero(c.partidas ?? CONFIG_DEFECTO.partidas, 1, 9, 'Las partidas'),
  };
  if (config.enLinea > config.lado) throw new ErrorJuego('No entran tantas en línea en ese tablero');
  return config;
}

const DIRECCIONES = [[0, 1], [1, 0], [1, 1], [1, -1]];

export class PartidaTateti {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'tateti';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.empiezaPrimera = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.partida = 0;
    this.historial = [];
    this.#nueva();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #nueva() {
    this.partida++;
    this.fase = 'jugando';
    const { lado } = this.config;
    this.tablero = Array.from({ length: lado }, () => Array(lado).fill(null));
    this.turno = this.partida % 2 === 1 ? this.empiezaPrimera : this.rival(this.empiezaPrimera);
    this.ultima = null;
    this.linea = null;
    this.listosSiguiente = new Set();
  }

  fichasDe(j) {
    return this.tablero.flat().filter((x) => x === j).length;
  }

  // Con movimiento: cuántas fichas tiene cada uno como máximo.
  get tope() {
    return this.config.enLinea;
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo === 'siguiente') {
      if (this.fase !== 'fin') throw new ErrorJuego('La partida no terminó');
      this.listosSiguiente.add(j);
      if (this.listosSiguiente.size === 2) this.#nueva();
      return;
    }
    if (tipo !== 'poner') throw new ErrorJuego('Acción desconocida');
    if (this.fase !== 'jugando') throw new ErrorJuego('Esta partida ya terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    const { lado } = this.config;
    const f = entero(datos.fila, 0, lado - 1, 'La fila');
    const c = entero(datos.col, 0, lado - 1, 'La columna');
    if (this.tablero[f][c] !== null) throw new ErrorJuego('Esa casilla está ocupada');

    let desde = null;
    if (this.config.movimiento && this.fichasDe(j) >= this.tope) {
      // Ya puso todas: tiene que mover una suya (a cualquier casilla libre).
      if (!Array.isArray(datos.desde)) throw new ErrorJuego('Elegí cuál de tus fichas mover');
      const [df, dc] = datos.desde.map(Number);
      if (this.tablero[df]?.[dc] !== j) throw new ErrorJuego('Esa ficha no es tuya');
      this.tablero[df][dc] = null;
      desde = [df, dc];
    }
    this.tablero[f][c] = j;
    this.ultima = { por: j, fila: f, col: c, desde };

    const linea = this.#linea(f, c, j);
    if (linea) return this.#fin(j, linea);
    if (!this.config.movimiento && this.tablero.flat().every((x) => x !== null)) return this.#fin(null, null);
    this.turno = this.rival(j);
  }

  #linea(fila, col, j) {
    const { lado, enLinea } = this.config;
    const es = (f, c) => f >= 0 && c >= 0 && f < lado && c < lado && this.tablero[f][c] === j;
    for (const [df, dc] of DIRECCIONES) {
      const celdas = [[fila, col]];
      for (const s of [1, -1]) {
        for (let f = fila + df * s, c = col + dc * s; es(f, c); f += df * s, c += dc * s) celdas.push([f, c]);
      }
      if (celdas.length >= enLinea) return celdas;
    }
    return null;
  }

  #fin(ganador, linea) {
    this.fase = 'fin';
    this.turno = null;
    this.linea = linea;
    if (ganador) this.puntos[ganador]++;
    this.historial.push(ganador);
    const necesarias = Math.floor(this.config.partidas / 2) + 1;
    const max = Math.max(...this.jugadores.map((x) => this.puntos[x]));
    if (max >= necesarias || this.partida >= this.config.partidas) {
      this.estado = 'terminada';
      this.ganador = ganadorPorPuntos(this.jugadores, this.puntos);
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
    return { puntos: this.puntos, partidas: this.partida };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const quien = (x) => (x === null ? null : x === j ? 'yo' : 'rival');
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      partida: this.partida,
      fase: this.fase,
      turno: this.turno,
      empece: this.partida % 2 === 1 ? this.empiezaPrimera === j : this.empiezaPrimera !== j,
      tablero: this.tablero.map((fila) => fila.map(quien)),
      ultima: this.ultima && { ...this.ultima, por: quien(this.ultima.por) },
      linea: this.linea,
      moviendo: this.config.movimiento && this.fichasDe(j) >= this.tope,
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      historial: this.historial.map(quien),
      listosSiguiente: [...this.listosSiguiente].map(quien),
    };
  }
}
