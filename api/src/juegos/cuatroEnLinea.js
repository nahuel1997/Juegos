// Cuatro en línea 1vs1: se sueltan fichas por columna; gana quien alinea N (horizontal, vertical o diagonal).
// Tablero y cantidad a alinear configurables. Tablero lleno sin ganador = empate.
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { filas: 6, columnas: 7, enLinea: 4 };

export function validarConfig(c = {}) {
  const config = {
    filas: entero(c.filas ?? CONFIG_DEFECTO.filas, 4, 10, 'Las filas'),
    columnas: entero(c.columnas ?? CONFIG_DEFECTO.columnas, 4, 12, 'Las columnas'),
    enLinea: entero(c.enLinea ?? CONFIG_DEFECTO.enLinea, 3, 6, 'Las fichas en línea'),
  };
  if (config.enLinea > Math.max(config.filas, config.columnas)) throw new ErrorJuego('No entran tantas fichas en línea en ese tablero');
  return config;
}

const DIRECCIONES = [[0, 1], [1, 0], [1, 1], [1, -1]];

export class PartidaCuatroEnLinea {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'cuatro-en-linea';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.tablero = Array.from({ length: config.filas }, () => Array(config.columnas).fill(null));
    this.turno = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.ultima = null;
    this.linea = null; // celdas de la línea ganadora
    this.fichas = 0;
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (tipo !== 'soltar') throw new ErrorJuego('Acción desconocida');
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    const col = entero(datos.col, 0, this.config.columnas - 1, 'La columna');
    let fila = -1;
    for (let f = this.config.filas - 1; f >= 0; f--) if (this.tablero[f][col] === null) { fila = f; break; }
    if (fila < 0) throw new ErrorJuego('Esa columna está llena');
    this.tablero[fila][col] = j;
    this.fichas++;
    this.ultima = { fila, col, por: j };

    const linea = this.#buscarLinea(fila, col, j);
    if (linea) {
      this.linea = linea;
      this.estado = 'terminada';
      this.ganador = j;
      this.motivoFin = 'linea';
    } else if (this.fichas === this.config.filas * this.config.columnas) {
      this.estado = 'terminada';
      this.ganador = null;
      this.motivoFin = 'lleno';
    } else {
      this.turno = this.rival(j);
    }
  }

  #buscarLinea(fila, col, j) {
    const { filas, columnas, enLinea } = this.config;
    const es = (f, c) => f >= 0 && c >= 0 && f < filas && c < columnas && this.tablero[f][c] === j;
    for (const [df, dc] of DIRECCIONES) {
      const celdas = [[fila, col]];
      for (const s of [1, -1]) {
        let f = fila + df * s;
        let c = col + dc * s;
        while (es(f, c)) {
          celdas.push([f, c]);
          f += df * s;
          c += dc * s;
        }
      }
      if (celdas.length >= enLinea) return celdas;
    }
    return null;
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { fichas: this.fichas };
  }

  vistaPara(j) {
    this.rival(j);
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      turno: this.turno,
      // 'yo' | 'rival' | null por celda
      tablero: this.tablero.map((fila) => fila.map((x) => (x === null ? null : x === j ? 'yo' : 'rival'))),
      ultima: this.ultima && { ...this.ultima, mia: this.ultima.por === j },
      linea: this.linea,
    };
  }
}
