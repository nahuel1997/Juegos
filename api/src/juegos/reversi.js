// Reversi (Othello) 1vs1: ponés una ficha que encierre fichas del rival en línea (horizontal, vertical
// o diagonal) y se dan vuelta. Si no tenés jugada, pasás. Termina cuando ninguno puede jugar: gana
// el que tiene más fichas. Tablero de 6, 8 o 10.
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { lado: 8, ayudas: true };

export function validarConfig(c = {}) {
  const lado = Number(c.lado ?? CONFIG_DEFECTO.lado);
  if (![6, 8, 10].includes(lado)) throw new ErrorJuego('El tablero es de 6, 8 o 10');
  return { lado, ayudas: !!(c.ayudas ?? CONFIG_DEFECTO.ayudas) };
}

const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];

// Fichas que da vuelta poner en (f, c) el jugador j (vacío = no vale).
export function vueltas(t, f, c, j) {
  if (t[f][c] !== null) return [];
  const lado = t.length;
  const res = [];
  for (const [df, dc] of DIRS) {
    const linea = [];
    let ff = f + df; let cc = c + dc;
    while (ff >= 0 && cc >= 0 && ff < lado && cc < lado && t[ff][cc] !== null && t[ff][cc] !== j) {
      linea.push([ff, cc]);
      ff += df; cc += dc;
    }
    if (linea.length && ff >= 0 && cc >= 0 && ff < lado && cc < lado && t[ff][cc] === j) res.push(...linea);
  }
  return res;
}

export function jugadas(t, j) {
  const res = [];
  for (let f = 0; f < t.length; f++) for (let c = 0; c < t.length; c++) {
    const v = vueltas(t, f, c, j);
    if (v.length) res.push({ f, c, n: v.length });
  }
  return res;
}

export class PartidaReversi {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'reversi';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    const negras = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    const blancas = negras === jugadores[0] ? jugadores[1] : jugadores[0];
    this.negras = negras;
    const { lado } = config;
    this.tablero = Array.from({ length: lado }, () => Array(lado).fill(null));
    const m = lado / 2;
    this.tablero[m - 1][m - 1] = blancas; this.tablero[m][m] = blancas;
    this.tablero[m - 1][m] = negras; this.tablero[m][m - 1] = negras;
    this.turno = negras; // empiezan las negras
    this.ultima = null;
    this.paso = null;
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  cuenta(j) {
    return this.tablero.flat().filter((x) => x === j).length;
  }

  accion(j, tipo, datos = {}) {
    const r = this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo !== 'poner') throw new ErrorJuego('Acción desconocida');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    const lado = this.config.lado;
    const f = entero(datos.fila, 0, lado - 1, 'La fila');
    const c = entero(datos.col, 0, lado - 1, 'La columna');
    const v = vueltas(this.tablero, f, c, j);
    if (!v.length) throw new ErrorJuego('Ahí no encerrás ninguna ficha');
    this.tablero[f][c] = j;
    for (const [ff, cc] of v) this.tablero[ff][cc] = j;
    this.ultima = { fila: f, col: c, por: j, vueltas: v };
    this.paso = null;
    if (jugadas(this.tablero, r).length) { this.turno = r; return; }
    if (jugadas(this.tablero, j).length) { this.paso = r; return; } // el rival pasa, sigue j
    this.#fin();
  }

  #fin() {
    this.estado = 'terminada';
    this.turno = null;
    const [a, b] = this.jugadores;
    const [na, nb] = [this.cuenta(a), this.cuenta(b)];
    this.ganador = na === nb ? null : na > nb ? a : b;
    this.motivoFin = 'fichas';
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return Object.fromEntries(this.jugadores.map((j) => [j, this.cuenta(j)]));
  }

  vistaPara(j) {
    const r = this.rival(j);
    const quien = (x) => (x === null ? null : x === j ? 'yo' : 'rival');
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      tablero: this.tablero.map((fila) => fila.map(quien)),
      soyNegras: this.negras === j,
      turno: quien(this.turno),
      posibles: this.turno === j ? jugadas(this.tablero, j) : [],
      ultima: this.ultima && { ...this.ultima, por: quien(this.ultima.por) },
      paso: quien(this.paso),
      fichas: { yo: this.cuenta(j), rival: this.cuenta(r) },
    };
  }
}
