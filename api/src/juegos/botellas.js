// Botellas de colores (water sort) en duelo: los dos reciben la misma mezcla y la resuelven cada uno
// por su lado, sin ver las botellas del otro (solo cuántas lleva completas). Se vuelca de una botella
// a otra si arriba hay lugar y el color coincide (o está vacía). Con "colores escondidos" solo se ve el
// color de arriba de cada botella hasta que lo destapás. El primero que deja todo ordenado gana la ronda.
import { ErrorJuego, entero, ganadorPorPuntos } from './comun.js';

export const CAPACIDAD = 4;
export const CONFIG_DEFECTO = { colores: 6, vacias: 2, escondidos: true, rondas: 3 };

export function validarConfig(c = {}) {
  return {
    colores: entero(c.colores ?? CONFIG_DEFECTO.colores, 3, 10, 'Los colores'),
    vacias: entero(c.vacias ?? CONFIG_DEFECTO.vacias, 1, 3, 'Las botellas vacías'),
    escondidos: !!(c.escondidos ?? CONFIG_DEFECTO.escondidos),
    rondas: entero(c.rondas ?? CONFIG_DEFECTO.rondas, 1, 9, 'Las rondas'),
  };
}

// Cuánto se puede volcar de i a k (0 = no se puede).
export function cuantoVuelca(b, i, k) {
  if (i === k || !b[i].length || b[k].length >= CAPACIDAD) return 0;
  const color = b[i][b[i].length - 1];
  if (b[k].length && b[k][b[k].length - 1] !== color) return 0;
  let seguidos = 0;
  for (let x = b[i].length - 1; x >= 0 && b[i][x] === color; x--) seguidos++;
  return Math.min(seguidos, CAPACIDAD - b[k].length);
}

export const resuelta = (b) => b.every((x) => !x.length || (x.length === CAPACIDAD && x.every((y) => y === x[0])));
const completas = (b) => b.filter((x) => x.length === CAPACIDAD && x.every((y) => y === x[0])).length;

// Busca una solución (lista de [de, a]) o null. Búsqueda en profundidad con estados vistos.
export function resolver(inicial, limite = 200000) {
  const vistos = new Set();
  const camino = [];
  let nodos = 0;
  const clave = (b) => b.map((x) => x.join('.')).sort().join('|');
  const buscar = (b) => {
    if (resuelta(b)) return true;
    if (++nodos > limite) return false;
    const k = clave(b);
    if (vistos.has(k)) return false;
    vistos.add(k);
    const movs = [];
    for (let i = 0; i < b.length; i++) {
      // No tiene sentido mover una botella de un solo color entera a una vacía.
      const uniforme = b[i].length && b[i].every((y) => y === b[i][0]);
      for (let d = 0; d < b.length; d++) {
        const n = cuantoVuelca(b, i, d);
        if (!n || (uniforme && !b[d].length)) continue;
        movs.push([i, d, n, b[d].length ? 1 : 0]);
      }
    }
    movs.sort((x, y) => y[3] - x[3]); // primero sobre color igual
    for (const [i, d, n] of movs) {
      const nb = b.map((x) => [...x]);
      for (let t = 0; t < n; t++) nb[d].push(nb[i].pop());
      camino.push([i, d]);
      if (buscar(nb)) return true;
      camino.pop();
    }
    return false;
  };
  return buscar(inicial.map((x) => [...x])) ? camino : null;
}

export function generar(colores, vacias, rand = Math.random) {
  for (let intento = 0; intento < 50; intento++) {
    const piezas = [];
    for (let c = 0; c < colores; c++) for (let k = 0; k < CAPACIDAD; k++) piezas.push(c);
    for (let i = piezas.length - 1; i > 0; i--) {
      const k = Math.floor(rand() * (i + 1));
      [piezas[i], piezas[k]] = [piezas[k], piezas[i]];
    }
    const b = Array.from({ length: colores }, (_, i) => piezas.slice(i * CAPACIDAD, (i + 1) * CAPACIDAD));
    for (let v = 0; v < vacias; v++) b.push([]);
    if (b.some((x) => x.length && x.every((y) => y === x[0]))) continue; // ninguna arranca lista
    if (resolver(b, 60000)) return b;
  }
  throw new Error('No se pudo generar una mezcla con solución');
}

export class PartidaBotellas {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random, mezcla } = {}) {
    this.juego = 'botellas';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.ronda = 0;
    this.historial = [];
    this.#nuevaRonda(mezcla);
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #nuevaRonda(mezcla) {
    this.ronda++;
    this.inicial = mezcla ?? generar(this.config.colores, this.config.vacias, this.rand ?? Math.random);
    this.fase = 'jugando';
    this.inicio = Date.now();
    this.resultado = null;
    this.listosSiguiente = new Set();
    this.tableros = Object.fromEntries(this.jugadores.map((j) => [j, this.#tableroNuevo()]));
  }

  #tableroNuevo() {
    // vistos[i][k]: si ya se destapó esa porción (la de arriba siempre se ve).
    return {
      botellas: this.inicial.map((x) => [...x]),
      vistos: this.inicial.map((x) => x.map((_, k) => k === x.length - 1)),
      deshacer: [],
      movidas: 0,
      termino: null,
    };
  }

  accion(j, tipo, datos = {}) {
    const r = this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo === 'siguiente') {
      if (this.fase !== 'fin') throw new ErrorJuego('La ronda no terminó');
      this.listosSiguiente.add(j);
      if (this.listosSiguiente.size === 2) this.#nuevaRonda();
      return;
    }
    if (this.fase !== 'jugando') throw new ErrorJuego('La ronda terminó');
    const t = this.tableros[j];
    if (tipo === 'rendirse') return this.#finRonda(r);
    if (tipo === 'reiniciar') {
      const vistos = t.vistos;
      this.tableros[j] = this.#tableroNuevo();
      this.tableros[j].vistos = this.inicial.map((x, i) => x.map((_, k) => vistos[i]?.[k] || k === x.length - 1));
      this.tableros[j].movidas = t.movidas;
      return;
    }
    if (tipo === 'deshacer') {
      const u = t.deshacer.pop();
      if (!u) throw new ErrorJuego('No hay nada para deshacer');
      for (let x = 0; x < u.n; x++) { t.botellas[u.de].push(t.botellas[u.a].pop()); t.vistos[u.de].push(true); t.vistos[u.a].pop(); }
      t.movidas++;
      return;
    }
    if (tipo !== 'volcar') throw new ErrorJuego('Acción desconocida');
    const total = t.botellas.length;
    const de = entero(datos.de, 0, total - 1, 'La botella');
    const a = entero(datos.a, 0, total - 1, 'La botella');
    const n = cuantoVuelca(t.botellas, de, a);
    if (!n) throw new ErrorJuego('Ahí no se puede volcar');
    for (let x = 0; x < n; x++) { t.botellas[a].push(t.botellas[de].pop()); t.vistos[de].pop(); t.vistos[a].push(true); }
    // Se destapa lo que quedó arriba.
    if (t.vistos[de].length) t.vistos[de][t.vistos[de].length - 1] = true;
    t.deshacer.push({ de, a, n });
    if (t.deshacer.length > 50) t.deshacer.shift();
    t.movidas++;
    if (resuelta(t.botellas)) {
      t.termino = Date.now() - this.inicio;
      this.#finRonda(j);
    }
  }

  #finRonda(ganador) {
    this.puntos[ganador]++;
    this.historial.push(ganador);
    this.resultado = ganador;
    this.fase = 'fin';
    const necesarias = Math.floor(this.config.rondas / 2) + 1;
    if (this.puntos[ganador] >= necesarias || this.ronda >= this.config.rondas) {
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
    return { puntos: this.puntos, rondas: this.ronda };
  }

  vistaPara(j) {
    const r = this.rival(j);
    const t = this.tableros[j];
    const fin = this.fase === 'fin';
    const ver = (tab) => tab.botellas.map((x, i) => x.map((col, k) => (!this.config.escondidos || fin || tab.vistos[i][k] ? col : null)));
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      capacidad: CAPACIDAD,
      ronda: this.ronda,
      fase: this.fase,
      inicio: this.inicio,
      ahora: Date.now(),
      botellas: ver(t),
      movidas: t.movidas,
      puedeDeshacer: t.deshacer.length > 0,
      completas: completas(t.botellas),
      rival: { completas: completas(this.tableros[r].botellas), movidas: this.tableros[r].movidas },
      // Al terminar la ronda se ve cómo quedó el rival.
      botellasRival: fin ? ver(this.tableros[r]) : null,
      resultado: fin ? (this.resultado === j ? 'yo' : 'rival') : null,
      puntos: { yo: this.puntos[j], rival: this.puntos[r] },
      listosSiguiente: [...this.listosSiguiente].map((x) => (x === j ? 'yo' : 'rival')),
    };
  }
}
