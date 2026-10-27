// Sudoku duelo: los dos resuelven el mismo sudoku a la vez (generado al azar, con solución única).
// Cada número que ponés se controla: si está mal no queda y te suma un error. Gana el primero que lo
// completa; si alguien llega al máximo de errores, pierde. Se ve cuánto le falta al otro, no sus números.
import { ErrorJuego, entero } from './comun.js';

export const PISTAS = { facil: 40, medio: 32, dificil: 26 };
export const CONFIG_DEFECTO = { dificultad: 'medio', errores: 3 };

export function validarConfig(c = {}) {
  const config = {
    dificultad: c.dificultad ?? CONFIG_DEFECTO.dificultad,
    errores: entero(c.errores ?? CONFIG_DEFECTO.errores, 0, 10, 'Los errores permitidos'),
  };
  if (!(config.dificultad in PISTAS)) throw new ErrorJuego('Dificultad inválida');
  return config;
}

const puede = (g, f, c, n) => {
  for (let i = 0; i < 9; i++) if (g[f][i] === n || g[i][c] === n) return false;
  const bf = f - (f % 3);
  const bc = c - (c % 3);
  for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) if (g[bf + i][bc + k] === n) return false;
  return true;
};

function llenar(g, rand) {
  for (let i = 0; i < 81; i++) {
    const f = Math.floor(i / 9);
    const c = i % 9;
    if (g[f][c]) continue;
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => rand() - 0.5);
    for (const n of nums) {
      if (!puede(g, f, c, n)) continue;
      g[f][c] = n;
      if (llenar(g, rand)) return true;
      g[f][c] = 0;
    }
    return false;
  }
  return true;
}

// Cuenta soluciones (corta en `tope`).
export function contarSoluciones(g, tope = 2) {
  let cuenta = 0;
  const rec = () => {
    // La casilla vacía con menos opciones primero (hace que sea rápido).
    let mejor = null;
    for (let f = 0; f < 9; f++) for (let c = 0; c < 9; c++) {
      if (g[f][c]) continue;
      const ops = [];
      for (let n = 1; n <= 9; n++) if (puede(g, f, c, n)) ops.push(n);
      if (!mejor || ops.length < mejor.ops.length) mejor = { f, c, ops };
      if (!ops.length) return;
    }
    if (!mejor) { cuenta++; return; }
    for (const n of mejor.ops) {
      g[mejor.f][mejor.c] = n;
      rec();
      g[mejor.f][mejor.c] = 0;
      if (cuenta >= tope) return;
    }
  };
  rec();
  return cuenta;
}

export function generar(dificultad, rand = Math.random) {
  const solucion = Array.from({ length: 9 }, () => Array(9).fill(0));
  llenar(solucion, rand);
  const tablero = solucion.map((f) => [...f]);
  const orden = Array.from({ length: 81 }, (_, i) => i).sort(() => rand() - 0.5);
  let quedan = 81;
  for (const i of orden) {
    if (quedan <= PISTAS[dificultad]) break;
    const f = Math.floor(i / 9);
    const c = i % 9;
    const antes = tablero[f][c];
    tablero[f][c] = 0;
    if (contarSoluciones(tablero.map((x) => [...x])) !== 1) tablero[f][c] = antes;
    else quedan--;
  }
  return { tablero, solucion };
}

export class PartidaSudoku {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    this.juego = 'sudoku';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    const { tablero, solucion } = generar(config.dificultad, rand);
    this.inicial = tablero;
    this.solucion = solucion;
    this.grilla = Object.fromEntries(jugadores.map((j) => [j, tablero.map((f) => [...f])]));
    this.errores = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.empezo = Date.now();
    this.ultimoError = null;
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  faltan(j) {
    return this.grilla[j].flat().filter((x) => !x).length;
  }

  accion(j, tipo, datos = {}) {
    const rival = this.rival(j);
    if (tipo !== 'poner') throw new ErrorJuego('Acción desconocida');
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    const f = entero(datos.fila, 0, 8, 'La fila');
    const c = entero(datos.col, 0, 8, 'La columna');
    const n = entero(datos.numero, 1, 9, 'El número');
    if (this.inicial[f][c]) throw new ErrorJuego('Esa casilla ya viene dada');
    if (this.grilla[j][f][c]) throw new ErrorJuego('Esa casilla ya está resuelta');
    if (this.solucion[f][c] !== n) {
      this.errores[j]++;
      this.ultimoError = { por: j, fila: f, col: c, numero: n, n: this.errores[j] };
      if (this.config.errores && this.errores[j] >= this.config.errores) {
        this.estado = 'terminada';
        this.ganador = rival;
        this.motivoFin = 'errores';
      }
      return { ok: false };
    }
    this.grilla[j][f][c] = n;
    if (!this.faltan(j)) {
      this.estado = 'terminada';
      this.ganador = j;
      this.motivoFin = 'completo';
    }
    return { ok: true };
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { errores: this.errores, segundos: Math.round((Date.now() - this.empezo) / 1000) };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const vacias = this.inicial.flat().filter((x) => !x).length;
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      inicial: this.inicial,
      grilla: this.grilla[j],
      vacias,
      faltan: { yo: this.faltan(j), rival: this.faltan(rival) },
      errores: { yo: this.errores[j], rival: this.errores[rival] },
      empezo: this.empezo,
      ultimoError: this.ultimoError?.por === j ? this.ultimoError : null,
      // Al terminar se ve la grilla del otro.
      grillaRival: this.estado === 'terminada' ? this.grilla[rival] : null,
    };
  }
}
