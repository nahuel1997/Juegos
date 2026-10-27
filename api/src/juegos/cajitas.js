// Puntos y cajitas 1vs1: por turno se traza una rayita entre dos puntos vecinos. El que cierra una
// cajita se la queda y vuelve a jugar. Cuando no quedan rayitas, gana quien cerró más cajitas.
import { ErrorJuego, entero, ganadorPorPuntos } from './comun.js';

export const CONFIG_DEFECTO = { filas: 4, columnas: 4 };

export function validarConfig(c = {}) {
  return {
    filas: entero(c.filas ?? CONFIG_DEFECTO.filas, 2, 9, 'Las filas'),
    columnas: entero(c.columnas ?? CONFIG_DEFECTO.columnas, 2, 9, 'Las columnas'),
  };
}

export class PartidaCajitas {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'cajitas';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    const { filas, columnas } = config;
    // h[f][c]: rayita horizontal sobre la fila de puntos f; v[f][c]: vertical a la izquierda de la caja (f, c).
    this.h = Array.from({ length: filas + 1 }, () => Array(columnas).fill(null));
    this.v = Array.from({ length: filas }, () => Array(columnas + 1).fill(null));
    this.cajas = Array.from({ length: filas }, () => Array(columnas).fill(null));
    this.turno = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.ultima = null;
    this.rayas = 0;
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  get total() {
    const { filas, columnas } = this.config;
    return (filas + 1) * columnas + filas * (columnas + 1);
  }

  #cerrada(f, c) {
    return this.h[f][c] && this.h[f + 1][c] && this.v[f][c] && this.v[f][c + 1];
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (tipo !== 'raya') throw new ErrorJuego('Acción desconocida');
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    const { filas, columnas } = this.config;
    const horizontal = datos.tipo === 'h';
    const f = entero(datos.f, 0, horizontal ? filas : filas - 1, 'La fila');
    const c = entero(datos.c, 0, horizontal ? columnas - 1 : columnas, 'La columna');
    const lista = horizontal ? this.h : this.v;
    if (lista[f][c]) throw new ErrorJuego('Esa rayita ya está');
    lista[f][c] = j;
    this.rayas++;

    // Cajas que puede cerrar esta rayita.
    const vecinas = horizontal ? [[f - 1, c], [f, c]] : [[f, c - 1], [f, c]];
    const cerradas = vecinas.filter(([cf, cc]) => cf >= 0 && cc >= 0 && cf < filas && cc < columnas && !this.cajas[cf][cc] && this.#cerrada(cf, cc));
    for (const [cf, cc] of cerradas) this.cajas[cf][cc] = j;
    this.ultima = { por: j, tipo: horizontal ? 'h' : 'v', f, c, cerradas };

    if (this.rayas === this.total) {
      this.estado = 'terminada';
      this.ganador = ganadorPorPuntos(this.jugadores, this.puntos());
      this.motivoFin = 'puntos';
      this.turno = null;
      return;
    }
    if (!cerradas.length) this.turno = this.rival(j);
  }

  puntos() {
    const flat = this.cajas.flat();
    return Object.fromEntries(this.jugadores.map((x) => [x, flat.filter((y) => y === x).length]));
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { puntos: this.puntos() };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const quien = (x) => (x === null ? null : x === j ? 'yo' : 'rival');
    const p = this.puntos();
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      turno: this.turno,
      h: this.h.map((fila) => fila.map(quien)),
      v: this.v.map((fila) => fila.map(quien)),
      cajas: this.cajas.map((fila) => fila.map(quien)),
      ultima: this.ultima && { ...this.ultima, por: quien(this.ultima.por) },
      rayas: this.rayas,
      puntos: { yo: p[j], rival: p[rival] },
    };
  }
}
