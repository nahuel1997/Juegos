// El gato y el ratón: laberinto al azar (con varios caminos posibles), una casilla por turno cada uno.
// El ratón sale de la madriguera y tiene que llegar al queso; el gato tiene que atraparlo. Una moneda al aire
// decide quién arranca de gato; en cada ronda se cambian los papeles y laberinto nuevo. Gana el que suma más rondas.
import { ErrorJuego, entero, ganadorPorPuntos } from './comun.js';

export const CAMINOS = { pocos: 0.15, varios: 0.4, muchos: 0.75 }; // cuántos callejones se abren en vueltas
export const CONFIG_DEFECTO = { lado: 11, rondas: 2, limite: 40, caminos: 'varios' };

export function validarConfig(c = {}) {
  const config = {
    lado: entero(c.lado ?? CONFIG_DEFECTO.lado, 6, 21, 'El tamaño del laberinto'),
    rondas: entero(c.rondas ?? CONFIG_DEFECTO.rondas, 1, 10, 'Las rondas'),
    limite: entero(c.limite ?? CONFIG_DEFECTO.limite, 10, 200, 'El límite de movimientos del ratón'),
    caminos: c.caminos ?? CONFIG_DEFECTO.caminos,
  };
  if (!(config.caminos in CAMINOS)) throw new ErrorJuego('Cantidad de caminos inválida');
  return config;
}

// Paredes por casilla como bits: arriba, derecha, abajo, izquierda.
export const DIRS = {
  arriba: { bit: 1, df: -1, dc: 0, opuesto: 4 },
  derecha: { bit: 2, df: 0, dc: 1, opuesto: 8 },
  abajo: { bit: 4, df: 1, dc: 0, opuesto: 1 },
  izquierda: { bit: 8, df: 0, dc: -1, opuesto: 2 },
};
const LISTA = Object.values(DIRS);

function quitarPared(paredes, f, c, d) {
  paredes[f][c] &= ~d.bit;
  paredes[f + d.df][c + d.dc] &= ~d.opuesto;
}

// Laberinto perfecto (backtracking) y después se abren paredes para que haya vueltas y varios caminos.
export function generarLaberinto(lado, caminos = 'varios', rand = Math.random) {
  const paredes = Array.from({ length: lado }, () => Array(lado).fill(15));
  const dentro = (f, c) => f >= 0 && c >= 0 && f < lado && c < lado;
  const visto = Array.from({ length: lado }, () => Array(lado).fill(false));
  const pila = [[Math.floor(rand() * lado), Math.floor(rand() * lado)]];
  visto[pila[0][0]][pila[0][1]] = true;
  while (pila.length) {
    const [f, c] = pila[pila.length - 1];
    const libres = LISTA.filter((d) => dentro(f + d.df, c + d.dc) && !visto[f + d.df][c + d.dc]);
    if (!libres.length) { pila.pop(); continue; }
    const d = libres[Math.floor(rand() * libres.length)];
    quitarPared(paredes, f, c, d);
    visto[f + d.df][c + d.dc] = true;
    pila.push([f + d.df, c + d.dc]);
  }
  // Callejones sin salida: una parte se abre hacia un vecino.
  const p = CAMINOS[caminos];
  for (let f = 0; f < lado; f++) {
    for (let c = 0; c < lado; c++) {
      const cerradas = LISTA.filter((d) => paredes[f][c] & d.bit && dentro(f + d.df, c + d.dc));
      const abiertas = LISTA.filter((d) => !(paredes[f][c] & d.bit));
      if (abiertas.length === 1 && cerradas.length && rand() < p) quitarPared(paredes, f, c, cerradas[Math.floor(rand() * cerradas.length)]);
    }
  }
  return paredes;
}

export function vecinos(paredes, [f, c]) {
  return Object.entries(DIRS)
    .filter(([, d]) => !(paredes[f][c] & d.bit))
    .map(([nombre, d]) => ({ dir: nombre, pos: [f + d.df, c + d.dc] }));
}

// Distancia (en pasos) de una casilla a todas, sin pasar por las prohibidas.
export function distancias(paredes, desde, prohibidas = []) {
  const lado = paredes.length;
  const dist = Array.from({ length: lado }, () => Array(lado).fill(Infinity));
  const no = new Set(prohibidas.map(([f, c]) => `${f},${c}`));
  dist[desde[0]][desde[1]] = 0;
  const cola = [desde];
  while (cola.length) {
    const actual = cola.shift();
    for (const { pos } of vecinos(paredes, actual)) {
      if (no.has(`${pos[0]},${pos[1]}`) || dist[pos[0]][pos[1]] !== Infinity) continue;
      dist[pos[0]][pos[1]] = dist[actual[0]][actual[1]] + 1;
      cola.push(pos);
    }
  }
  return dist;
}

const igual = (a, b) => a[0] === b[0] && a[1] === b[1];

export class PartidaGatoRaton {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    this.juego = 'gato-raton';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.rand = rand;
    // La moneda al aire: quién arranca de gato.
    this.moneda = rand() < 0.5 ? jugadores[0] : jugadores[1];
    this.puntos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.ronda = 0;
    this.rondas = [];
    this.listosSiguiente = new Set();
    this.#nuevaRonda();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #nuevaRonda() {
    const { lado, caminos } = this.config;
    const rand = this.rand ?? Math.random;
    this.ronda++;
    this.fase = 'jugando';
    this.listosSiguiente = new Set();
    this.gatoEs = this.ronda % 2 === 1 ? this.moneda : this.rival(this.moneda);
    this.ratonEs = this.rival(this.gatoEs);
    // Madriguera en una esquina, queso en el cuadrante opuesto (lejos del borde, así tiene varias entradas)
    // y el gato en una de las otras dos esquinas.
    const esquinas = [[0, 0], [0, lado - 1], [lado - 1, lado - 1], [lado - 1, 0]];
    const e = Math.floor(rand() * 4);
    this.madriguera = esquinas[e];
    this.gato = esquinas[(e + (rand() < 0.5 ? 1 : 3)) % 4];
    const lejos = (x) => (x === 0 ? lado - 1 : 0);
    const mitad = Math.max(1, Math.floor(lado / 3));
    const cerca = (x) => (x === 0 ? 1 + Math.floor(rand() * mitad) : lado - 2 - Math.floor(rand() * mitad));
    this.queso = [cerca(lejos(this.madriguera[0])), cerca(lejos(this.madriguera[1]))];
    this.paredes = generarLaberinto(lado, caminos, rand);
    // Al queso se tiene que poder entrar por al menos tres lados.
    const [qf, qc] = this.queso;
    const cerradas = LISTA.filter((d) => this.paredes[qf][qc] & d.bit);
    while (4 - cerradas.length < 3 && cerradas.length) quitarPared(this.paredes, qf, qc, cerradas.splice(Math.floor(rand() * cerradas.length), 1)[0]);
    this.raton = [...this.madriguera];
    this.turno = this.ratonEs; // el ratón mueve primero
    this.movsRaton = 0;
    this.movsGato = 0;
    this.ultimo = null;
    this.rastro = [[...this.raton]];
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo === 'siguiente') {
      if (this.fase !== 'resumen') throw new ErrorJuego('La ronda no terminó');
      this.listosSiguiente.add(j);
      if (this.listosSiguiente.size === 2) this.#nuevaRonda();
      return;
    }
    if (tipo !== 'mover') throw new ErrorJuego('Acción desconocida');
    if (this.fase !== 'jugando') throw new ErrorJuego('La ronda terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    const d = DIRS[datos.dir];
    if (!d) throw new ErrorJuego('Dirección inválida');
    const soyGato = j === this.gatoEs;
    const desde = soyGato ? this.gato : this.raton;
    if (this.paredes[desde[0]][desde[1]] & d.bit) throw new ErrorJuego('Ahí hay una pared');
    const hacia = [desde[0] + d.df, desde[1] + d.dc];

    if (soyGato) {
      if (igual(hacia, this.queso)) throw new ErrorJuego('El gato no puede pisar el queso');
      this.gato = hacia;
      this.movsGato++;
      this.ultimo = { quien: 'gato', dir: datos.dir };
      if (igual(hacia, this.raton)) return this.#finRonda('gato', 'atrapado');
      this.turno = this.ratonEs;
      if (!this.#movidasRaton().length) return this.#finRonda('gato', 'acorralado');
      return;
    }

    if (igual(hacia, this.gato)) throw new ErrorJuego('¡Ahí está el gato!');
    this.raton = hacia;
    this.movsRaton++;
    this.rastro.push([...hacia]);
    this.ultimo = { quien: 'raton', dir: datos.dir };
    if (igual(hacia, this.queso)) return this.#finRonda('raton', 'queso');
    if (this.movsRaton >= this.config.limite) return this.#finRonda('gato', 'tiempo');
    // Si el gato no tiene para dónde ir (encerrado contra el queso), pierde el turno.
    if (this.#movidasGato().length) this.turno = this.gatoEs;
  }

  #movidasRaton() {
    return vecinos(this.paredes, this.raton).filter((v) => !igual(v.pos, this.gato));
  }

  #movidasGato() {
    return vecinos(this.paredes, this.gato).filter((v) => !igual(v.pos, this.queso));
  }

  #finRonda(rol, motivo) {
    const ganadorRonda = rol === 'gato' ? this.gatoEs : this.ratonEs;
    this.puntos[ganadorRonda]++;
    this.rondas.push({ ronda: this.ronda, ganador: ganadorRonda, rol, motivo, movs: this.movsRaton });
    this.fase = 'resumen';
    this.turno = null;
    if (this.ronda >= this.config.rondas) {
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
    return { rondas: this.rondas.length, puntos: this.puntos };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const ultimaRonda = this.rondas[this.rondas.length - 1];
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      ronda: this.ronda,
      fase: this.fase,
      turno: this.turno,
      miRol: j === this.gatoEs ? 'gato' : 'raton',
      monedaGato: this.moneda === j ? 'yo' : 'rival',
      paredes: this.paredes,
      raton: this.raton,
      gato: this.gato,
      queso: this.queso,
      madriguera: this.madriguera,
      rastro: this.rastro,
      movsRaton: this.movsRaton,
      movsGato: this.movsGato,
      ultimo: this.ultimo,
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      rondas: this.rondas.map((r) => ({ ...r, mia: r.ganador === j })),
      ultimaRonda: ultimaRonda && this.fase === 'resumen' ? { ...ultimaRonda, mia: ultimaRonda.ganador === j } : null,
      listosSiguiente: [...this.listosSiguiente].map((x) => (x === j ? 'yo' : 'rival')),
    };
  }
}
