// Utilidades compartidas por los juegos.

export class ErrorJuego extends Error {}

export function entero(valor, min, max, nombre) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) throw new ErrorJuego(`${nombre} tiene que ser un número entre ${min} y ${max}`);
  return n;
}

export const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

// Mayúsculas sin acentos, pero respetando la Ñ.
export function normalizar(txt) {
  return String(txt ?? '')
    .toUpperCase()
    .replace(/Ñ/g, '\u0001')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0001/g, 'Ñ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Ganador por puntos: el que más tiene (null = empate en el primer puesto). Sirve para 2 o más.
export function ganadorPorPuntos(jugadores, puntos) {
  const max = Math.max(...jugadores.map((j) => puntos[j] ?? 0));
  const primeros = jugadores.filter((j) => (puntos[j] ?? 0) === max);
  return primeros.length === 1 ? primeros[0] : null;
}

// Posiciones para mostrar al final: [{ jugador, puntos, puesto }] de mayor a menor (empates comparten puesto).
export function tablaPosiciones(jugadores, puntos) {
  const orden = [...jugadores].sort((x, y) => (puntos[y] ?? 0) - (puntos[x] ?? 0));
  return orden.map((j) => ({ jugador: j, puntos: puntos[j] ?? 0, puesto: 1 + orden.filter((o) => (puntos[o] ?? 0) > (puntos[j] ?? 0)).length }));
}

// Base para los juegos de 2 o más jugadores con fases que avanzan solas por tiempo.
// - puntos: { jugador: número }. Gana el que más tiene (empate = null).
// - Con 2 jugadores, el que abandona pierde; con más, queda afuera y el resto sigue.
// - fase + hasta (timestamp): al vencer se llama a this.alVencer() (lo define cada juego). Al
//   restaurar una partida guardada, reanudar() vuelve a programar el reloj con lo que faltaba.
export class PartidaGrupal {
  constructor(juego, jugadores, config) {
    this.juego = juego;
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.fuera = new Set();
    this.fase = null;
    this.hasta = null;
    this.timer = null;
    this.notificar = null;
  }

  validar(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    if (this.fuera.has(j)) throw new ErrorJuego('Abandonaste esta partida');
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
  }

  get activos() {
    return this.jugadores.filter((j) => !this.fuera.has(j));
  }

  // Pasa a una fase que dura `ms` (sin ms: no vence sola).
  irA(fase, ms) {
    this.fase = fase;
    this.hasta = ms == null ? null : Date.now() + ms;
    this.programar();
  }

  programar() {
    clearTimeout(this.timer);
    this.timer = null;
    if (this.hasta == null || this.estado !== 'jugando') return;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.estado !== 'jugando') return;
      this.alVencer();
      this.notificar?.();
    }, Math.max(0, this.hasta - Date.now()));
    this.timer.unref?.();
  }

  reanudar() {
    this.programar();
  }

  terminar(motivo = 'puntos') {
    clearTimeout(this.timer);
    this.timer = null;
    this.hasta = null;
    this.estado = 'terminada';
    this.ganador = ganadorPorPuntos(this.activos, this.puntos);
    this.motivoFin = motivo;
  }

  abandonar(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    if (this.estado === 'terminada' || this.fuera.has(j)) return;
    this.fuera.add(j);
    if (this.activos.length <= 1) {
      clearTimeout(this.timer);
      this.estado = 'terminada';
      this.ganador = this.activos[0] ?? null;
      this.motivoFin = 'abandono';
      return;
    }
    this.alAbandonar?.(j);
  }

  detalleHistorial() {
    return { puntos: this.puntos };
  }

  // Lo común de todas las vistas.
  vistaBase(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      yo: j,
      jugadores: this.jugadores,
      fuera: [...this.fuera],
      puntos: this.puntos,
      fase: this.fase,
      faltaMs: this.hasta ? Math.max(0, this.hasta - Date.now()) : null,
    };
  }
}

// Números al azar repetibles a partir de una semilla (los usa el navegador para generar lo mismo).
export function azarConSemilla(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Mezcla una copia (Fisher-Yates).
export function mezclar(lista, rand = Math.random) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const k = Math.floor(rand() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}
