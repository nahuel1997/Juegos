// Escoba del 15 1vs1 con mazo español de 40 cartas. Valores: 1-7 lo que dicen, sota 8, caballo 9, rey 10.
// Se juega una carta: si con cartas de la mesa suma 15, se las lleva (si deja la mesa vacía es escoba).
// Puntos por mano: cada escoba 1, más cartas 1, más oros 1, siete de oros 1, más sietes 1.
// Se juegan manos hasta que alguien llega a los puntos configurados.
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { puntosParaGanar: 15 };

export const PALOS = ['oros', 'copas', 'espadas', 'bastos'];
const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const valorDe = (numero) => (numero <= 7 ? numero : numero - 2);

export function validarConfig(c = {}) {
  return { puntosParaGanar: entero(c.puntosParaGanar ?? CONFIG_DEFECTO.puntosParaGanar, 5, 50, 'Los puntos para ganar') };
}

export function mazoNuevo(rand = Math.random) {
  const mazo = PALOS.flatMap((palo) => NUMEROS.map((numero) => ({ id: `${palo}-${numero}`, palo, numero, valor: valorDe(numero) })));
  for (let i = mazo.length - 1; i > 0; i--) {
    const k = Math.floor(rand() * (i + 1));
    [mazo[i], mazo[k]] = [mazo[k], mazo[i]];
  }
  return mazo;
}

export function puntosDeMano(capturas, escobas, jugadores) {
  const [a, b] = jugadores;
  const detalle = { [a]: [], [b]: [] };
  const mas = (fn, nombre) => {
    const va = fn(capturas[a]);
    const vb = fn(capturas[b]);
    if (va !== vb) detalle[va > vb ? a : b].push(nombre);
  };
  for (const j of jugadores) for (let i = 0; i < escobas[j]; i++) detalle[j].push('Escoba');
  mas((c) => c.length, 'Más cartas');
  mas((c) => c.filter((x) => x.palo === 'oros').length, 'Más oros');
  mas((c) => c.filter((x) => x.numero === 7).length, 'Más sietes');
  for (const j of jugadores) if (capturas[j].some((x) => x.id === 'oros-7')) detalle[j].push('Siete de oros');
  return detalle;
}

export class PartidaEscoba {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'escoba';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = { [jugadores[0]]: 0, [jugadores[1]]: 0 };
    // "empieza" = quien juega primero en la primera mano (el otro reparte).
    this.reparte = this.rival(empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]));
    this.manos = 0;
    this.#nuevaMano();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #nuevaMano() {
    this.manos++;
    this.fase = 'jugando'; // jugando | resumen
    this.mazo = mazoNuevo(this.rand);
    this.mano = { [this.jugadores[0]]: [], [this.jugadores[1]]: [] };
    this.capturas = { [this.jugadores[0]]: [], [this.jugadores[1]]: [] };
    this.escobas = { [this.jugadores[0]]: 0, [this.jugadores[1]]: 0 };
    this.mesa = this.mazo.splice(0, 4);
    this.ultimoEnLevantar = null;
    this.ultima = null;
    this.resumen = null;
    this.listosSiguiente = new Set();
    // Si la mesa inicial suma 15 (o 30) se la lleva quien reparte, como escoba (o dos).
    const suma = this.mesa.reduce((s, c) => s + c.valor, 0);
    if (suma === 15 || suma === 30) {
      this.capturas[this.reparte].push(...this.mesa);
      this.escobas[this.reparte] += suma / 15;
      this.ultima = { por: this.reparte, tipo: 'mesa-inicial', escoba: true, cartas: this.mesa };
      this.mesa = [];
      this.ultimoEnLevantar = this.reparte;
    }
    this.turno = this.rival(this.reparte);
    this.#repartir();
  }

  #repartir() {
    // Tres cartas a cada uno, empezando por quien no reparte.
    for (const j of [this.rival(this.reparte), this.reparte]) this.mano[j] = this.mazo.splice(0, 3);
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo === 'siguiente') {
      if (this.fase !== 'resumen') throw new ErrorJuego('La mano no terminó');
      this.listosSiguiente.add(j);
      if (this.listosSiguiente.size === 2) {
        this.reparte = this.rival(this.reparte);
        this.#nuevaMano();
      }
      return;
    }
    if (tipo !== 'jugar') throw new ErrorJuego('Acción desconocida');
    if (this.fase !== 'jugando') throw new ErrorJuego('La mano terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');

    const carta = this.mano[j].find((c) => c.id === datos.carta);
    if (!carta) throw new ErrorJuego('Esa carta no está en tu mano');
    const ids = [...new Set(Array.isArray(datos.levantar) ? datos.levantar : [])];
    const levantadas = ids.map((id) => this.mesa.find((c) => c.id === id));
    if (levantadas.some((c) => !c)) throw new ErrorJuego('Esa carta no está en la mesa');
    if (levantadas.length > 0 && carta.valor + levantadas.reduce((s, c) => s + c.valor, 0) !== 15) {
      throw new ErrorJuego('Tienen que sumar 15 con tu carta');
    }

    this.mano[j] = this.mano[j].filter((c) => c !== carta);
    if (levantadas.length) {
      this.mesa = this.mesa.filter((c) => !ids.includes(c.id));
      this.capturas[j].push(carta, ...levantadas);
      const escoba = this.mesa.length === 0;
      if (escoba) this.escobas[j]++;
      this.ultimoEnLevantar = j;
      this.ultima = { por: j, tipo: 'levanto', carta, cartas: levantadas, escoba };
    } else {
      this.mesa.push(carta);
      this.ultima = { por: j, tipo: 'tiro', carta };
    }

    this.turno = this.rival(j);
    if (this.jugadores.every((x) => this.mano[x].length === 0)) {
      if (this.mazo.length) this.#repartir();
      else this.#cerrarMano();
    }
  }

  #cerrarMano() {
    // Lo que queda en la mesa es para el último que levantó (no cuenta como escoba).
    if (this.mesa.length && this.ultimoEnLevantar) this.capturas[this.ultimoEnLevantar].push(...this.mesa);
    this.mesa = [];
    const detalle = puntosDeMano(this.capturas, this.escobas, this.jugadores);
    for (const j of this.jugadores) this.puntos[j] += detalle[j].length;
    this.resumen = {
      detalle,
      cartas: Object.fromEntries(this.jugadores.map((j) => [j, this.capturas[j].length])),
      oros: Object.fromEntries(this.jugadores.map((j) => [j, this.capturas[j].filter((c) => c.palo === 'oros').length])),
      sietes: Object.fromEntries(this.jugadores.map((j) => [j, this.capturas[j].filter((c) => c.numero === 7).length])),
    };
    this.fase = 'resumen';
    const [a, b] = this.jugadores;
    const meta = this.config.puntosParaGanar;
    // Gana quien llega a la meta; si llegan los dos, el que tiene más. Empate en la meta: otra mano.
    if ((this.puntos[a] >= meta || this.puntos[b] >= meta) && this.puntos[a] !== this.puntos[b]) {
      this.estado = 'terminada';
      this.ganador = this.puntos[a] > this.puntos[b] ? a : b;
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
    return { puntos: this.puntos, manos: this.manos };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const porJugador = (obj) => obj && { yo: obj[j], rival: obj[rival] };
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      fase: this.fase,
      mano: this.manos,
      turno: this.turno,
      reparte: this.reparte,
      miMano: this.mano[j],
      cartasRival: this.mano[rival].length,
      mesa: this.mesa,
      mazo: this.mazo.length,
      levantadas: { yo: this.capturas[j].length, rival: this.capturas[rival].length },
      escobas: porJugador(this.escobas),
      puntos: porJugador(this.puntos),
      ultima: this.ultima,
      resumen: this.resumen && {
        detalle: porJugador(this.resumen.detalle),
        cartas: porJugador(this.resumen.cartas),
        oros: porJugador(this.resumen.oros),
        sietes: porJugador(this.resumen.sietes),
      },
      listosSiguiente: [...this.listosSiguiente],
      // Cómo viene levantando cada uno (sin mostrar las cartas): el detalle propio completo.
      misLevantadas: conteo(this.capturas[j]),
      // Puntos que ya están asegurados en la mano en curso (escobas y siete de oros),
      // para que el marcador suba en el momento. Al cerrar la mano pasan a `puntos`.
      enEstaMano: this.fase === 'jugando'
        ? { yo: this.#asegurados(j), rival: this.#asegurados(rival) }
        : { yo: 0, rival: 0 },
    };
  }

  #asegurados(j) {
    return this.escobas[j] + (this.capturas[j].some((c) => c.id === SIETE_DE_OROS) ? 1 : 0);
  }
}

const SIETE_DE_OROS = 'oros-7';

function conteo(cartas) {
  return {
    cartas: cartas.length,
    oros: cartas.filter((c) => c.palo === 'oros').length,
    sietes: cartas.filter((c) => c.numero === 7).length,
    sieteDeOros: cartas.some((c) => c.id === SIETE_DE_OROS),
  };
}
