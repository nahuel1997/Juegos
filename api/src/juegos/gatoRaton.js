// El gato y el ratón en tiempo real: laberinto al azar con vueltas. Los dos avanzan solos hacia donde
// apuntan (como el Pac-Man): vos solo doblás. El ratón tiene que comerse todos los quesos antes de que
// se termine el tiempo; el gato tiene que atraparlo. El gato es un poco más rápido, pero no puede
// entrar a las madrigueras, donde el ratón se esconde. En cada ronda se cambian los papeles.
import { ErrorJuego, entero, ganadorPorPuntos } from './comun.js';

export const CAMINOS = { pocos: 0.15, varios: 0.4, muchos: 0.75 }; // cuántos callejones se abren en vueltas
// Milisegundos por casilla del gato; el ratón va siempre a RATON_MS.
export const VENTAJAS = { igual: 210, poca: 185, mucha: 160 };
export const RATON_MS = 210;
export const CONFIG_DEFECTO = { lado: 11, rondas: 2, quesos: 3, tiempo: 60, caminos: 'varios', ventaja: 'poca' };
const CUENTA_MS = 3000;
const TIC_MS = 30;

export function validarConfig(c = {}) {
  const config = {
    lado: entero(c.lado ?? CONFIG_DEFECTO.lado, 7, 19, 'El tamaño del laberinto'),
    rondas: entero(c.rondas ?? CONFIG_DEFECTO.rondas, 1, 10, 'Las rondas'),
    quesos: entero(c.quesos ?? CONFIG_DEFECTO.quesos, 1, 6, 'Los quesos'),
    tiempo: entero(c.tiempo ?? CONFIG_DEFECTO.tiempo, 20, 180, 'El tiempo'),
    caminos: c.caminos ?? CONFIG_DEFECTO.caminos,
    ventaja: c.ventaja ?? CONFIG_DEFECTO.ventaja,
  };
  if (!(config.caminos in CAMINOS)) throw new ErrorJuego('Cantidad de caminos inválida');
  if (!(config.ventaja in VENTAJAS)) throw new ErrorJuego('Ventaja del gato inválida');
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
    this.timer = null;
    this.notificar = null;
    this.#nuevaRonda();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #nuevaRonda() {
    const { lado, caminos, quesos } = this.config;
    const rand = this.rand ?? Math.random;
    this.ronda++;
    this.fase = 'cuenta';
    this.listosSiguiente = new Set();
    this.gatoEs = this.ronda % 2 === 1 ? this.moneda : this.rival(this.moneda);
    this.ratonEs = this.rival(this.gatoEs);
    this.paredes = generarLaberinto(lado, caminos, rand);
    // El ratón sale de una esquina (su madriguera), hay madrigueras en las dos esquinas vecinas
    // y el gato sale de la esquina opuesta.
    const esquinas = [[0, 0], [0, lado - 1], [lado - 1, lado - 1], [lado - 1, 0]];
    const e = Math.floor(rand() * 4);
    this.madrigueras = [esquinas[e], esquinas[(e + 1) % 4], esquinas[(e + 3) % 4]];
    this.raton = [...esquinas[e]];
    this.gato = [...esquinas[(e + 2) % 4]];
    // El gato no pasa por las madrigueras: si alguna zona quedó colgando de una, se le abre otra entrada.
    for (;;) {
      const dist = distancias(this.paredes, this.gato, this.madrigueras);
      const fuera = (f, c) => dist[f][c] === Infinity && !this.madrigueras.some((m) => igual(m, [f, c]));
      let abierta = false;
      for (let f = 0; f < lado && !abierta; f++) {
        for (let c = 0; c < lado && !abierta; c++) {
          if (!fuera(f, c)) continue;
          const d = LISTA.find((x) => {
            const nf = f + x.df; const nc = c + x.dc;
            return nf >= 0 && nc >= 0 && nf < lado && nc < lado && dist[nf][nc] !== Infinity;
          });
          if (d) { quitarPared(this.paredes, f, c, d); abierta = true; }
        }
      }
      if (!abierta) break;
    }
    // Quesos repartidos lejos de las madrigueras y entre ellos.
    const lista = [];
    const ocupadas = [...this.madrigueras, this.gato];
    const lejos = (pos, otras, min) => otras.every((o) => Math.abs(o[0] - pos[0]) + Math.abs(o[1] - pos[1]) >= min);
    for (let intento = 0; lista.length < quesos && intento < 3000; intento++) {
      const pos = [Math.floor(rand() * lado), Math.floor(rand() * lado)];
      const min = intento < 2000 ? Math.max(3, Math.floor(lado / 3)) : 1;
      if (lejos(pos, [...ocupadas, ...lista], min)) lista.push(pos);
    }
    this.quesos = lista;
    this.comidos = 0;
    this.dirs = { [this.gatoEs]: null, [this.ratonEs]: null };
    this.quiere = { [this.gatoEs]: null, [this.ratonEs]: null };
    this.antes = { gato: null, raton: null };
    this.ultimo = null;
    this.rastro = [[...this.raton]];
    this.movs = 0;
    this.inicio = Date.now() + CUENTA_MS;
    this.hasta = this.inicio + this.config.tiempo * 1000;
    this.prox = { gato: this.inicio, raton: this.inicio };
    this.#programar();
  }

  get msGato() {
    return VENTAJAS[this.config.ventaja];
  }

  #programar() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.#tic(), TIC_MS);
    this.timer.unref?.();
  }

  #tic() {
    if (this.estado !== 'jugando' || this.fase === 'resumen') return;
    const ahora = Date.now();
    let cambio = false;
    if (this.fase === 'cuenta') {
      if (ahora < this.inicio) return this.#programar();
      this.fase = 'jugando';
      cambio = true;
    }
    if (ahora >= this.hasta) {
      this.#finRonda('gato', 'tiempo');
      return this.notificar?.();
    }
    this.avanzar(ahora);
    if (this.fase === 'jugando') this.#programar();
    if (cambio || this.huboPaso) this.notificar?.();
  }

  // Mueve a los dos los pasos que les tocan hasta `ahora` (el ratón primero). Público para los tests.
  avanzar(ahora = Date.now()) {
    this.huboPaso = false;
    for (const quien of ['raton', 'gato']) {
      while (this.fase === 'jugando' && ahora >= this.prox[quien]) {
        this.prox[quien] += quien === 'gato' ? this.msGato : RATON_MS;
        if (this.#paso(quien)) this.huboPaso = true;
      }
    }
  }

  // ¿Puede pasar de `pos` hacia `dir`? (el gato no entra a las madrigueras)
  libre(quien, pos, dir) {
    const d = DIRS[dir];
    if (!d || this.paredes[pos[0]][pos[1]] & d.bit) return false;
    const h = [pos[0] + d.df, pos[1] + d.dc];
    return !(quien === 'gato' && this.madrigueras.some((m) => igual(m, h)));
  }

  // Un paso: dobla si puede hacia donde quiere; si no, sigue derecho; si hay pared, se queda quieto.
  #paso(quien) {
    const j = quien === 'gato' ? this.gatoEs : this.ratonEs;
    const pos = quien === 'gato' ? this.gato : this.raton;
    if (this.quiere[j] && this.libre(quien, pos, this.quiere[j])) {
      this.dirs[j] = this.quiere[j];
      this.quiere[j] = null;
    }
    const dir = this.dirs[j];
    if (!dir || !this.libre(quien, pos, dir)) return false;
    const d = DIRS[dir];
    const nueva = [pos[0] + d.df, pos[1] + d.dc];
    this.antes[quien] = [...pos];
    if (quien === 'gato') this.gato = nueva;
    else {
      this.raton = nueva;
      this.rastro.push([...nueva]);
      if (this.rastro.length > 60) this.rastro.shift();
    }
    this.movs++;
    this.ultimo = { quien, dir };
    // Atrapado: en la misma casilla, o se cruzaron de frente en el mismo instante.
    const otro = quien === 'gato' ? 'raton' : 'gato';
    const posOtro = quien === 'gato' ? this.raton : this.gato;
    const cruce = this.antes[otro] && igual(this.antes[otro], nueva) && igual(posOtro, pos);
    if (igual(this.gato, this.raton) || cruce) {
      this.#finRonda('gato', 'atrapado');
      return true;
    }
    if (quien === 'raton') {
      const i = this.quesos.findIndex((q) => igual(q, nueva));
      if (i >= 0) {
        this.quesos.splice(i, 1);
        this.comidos++;
        if (!this.quesos.length) this.#finRonda('raton', 'quesos');
      }
    }
    return true;
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
    if (this.fase === 'resumen') return;
    if (!DIRS[datos.dir]) throw new ErrorJuego('Dirección inválida');
    const quien = j === this.gatoEs ? 'gato' : 'raton';
    const pos = quien === 'gato' ? this.gato : this.raton;
    // Si ya se puede doblar, dobla en el próximo paso; si no, queda anotado hasta que haya lugar.
    if (!this.dirs[j] || this.libre(quien, pos, datos.dir)) {
      this.dirs[j] = datos.dir;
      this.quiere[j] = null;
    } else {
      this.quiere[j] = datos.dir;
    }
  }

  #finRonda(rol, motivo) {
    clearTimeout(this.timer);
    const ganadorRonda = rol === 'gato' ? this.gatoEs : this.ratonEs;
    this.puntos[ganadorRonda]++;
    const segundos = Math.max(0, Math.round((Math.min(Date.now(), this.hasta) - this.inicio) / 1000));
    this.rondas.push({ ronda: this.ronda, ganador: ganadorRonda, rol, motivo, comidos: this.comidos, segundos });
    this.fase = 'resumen';
    if (this.ronda >= this.config.rondas) {
      this.estado = 'terminada';
      this.ganador = ganadorPorPuntos(this.jugadores, this.puntos);
      this.motivoFin = 'puntos';
    }
  }

  // Después de restaurar: la ronda en curso vuelve a arrancar.
  reanudar() {
    if (this.estado !== 'jugando') return;
    if (this.fase === 'resumen' && this.quesos) return; // (sin quesos = guardada con la versión por turnos)
    this.ronda--;
    this.#nuevaRonda();
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    clearTimeout(this.timer);
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
    const ahora = Date.now();
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      ronda: this.ronda,
      fase: this.fase,
      miRol: j === this.gatoEs ? 'gato' : 'raton',
      monedaGato: this.moneda === j ? 'yo' : 'rival',
      paredes: this.paredes,
      raton: this.raton,
      gato: this.gato,
      quesos: this.quesos,
      comidos: this.comidos,
      madrigueras: this.madrigueras,
      rastro: this.rastro,
      movs: this.movs,
      miDir: this.dirs[j],
      quiero: this.quiere[j],
      ultimo: this.ultimo,
      msGato: this.msGato,
      msRaton: RATON_MS,
      faltaCuentaMs: this.fase === 'cuenta' ? Math.max(0, this.inicio - ahora) : 0,
      faltaMs: this.fase === 'resumen' ? 0 : Math.max(0, this.hasta - Math.max(ahora, this.inicio)),
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      rondas: this.rondas.map((r) => ({ ...r, mia: r.ganador === j })),
      ultimaRonda: ultimaRonda && this.fase === 'resumen' ? { ...ultimaRonda, mia: ultimaRonda.ganador === j } : null,
      listosSiguiente: [...this.listosSiguiente].map((x) => (x === j ? 'yo' : 'rival')),
    };
  }
}
