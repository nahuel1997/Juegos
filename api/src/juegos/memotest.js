// Memotest 1vs1: por turnos se dan vuelta dos cartas; si son iguales te las quedás y seguís,
// si no, se muestran un momento, se tapan y le toca al otro. Gana quien encuentra más pares.
import { ErrorJuego, entero, ganadorPorPuntos } from './comun.js';

export const CONFIG_DEFECTO = { pares: 10, segundosMirar: 2 };

// Dibujos disponibles (los SVG están en web/src/iconos.jsx).
export const DIBUJOS = [
  'sol', 'luna', 'estrella', 'rayo', 'flor', 'gato', 'perro', 'pez', 'hongo', 'cohete', 'globo', 'regalo',
  'helado', 'pizza', 'mate', 'arbol', 'nube', 'ancla', 'frutilla', 'corazon', 'fuego', 'corona', 'trofeo', 'barco',
];

export function validarConfig(c = {}) {
  return {
    pares: entero(c.pares ?? CONFIG_DEFECTO.pares, 4, DIBUJOS.length, 'Los pares'),
    segundosMirar: entero(c.segundosMirar ?? CONFIG_DEFECTO.segundosMirar, 1, 5, 'Los segundos para mirar'),
  };
}

export class PartidaMemotest {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'memotest';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.turno = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    const elegidos = [...DIBUJOS].sort(() => rand() - 0.5).slice(0, config.pares);
    const cartas = [...elegidos, ...elegidos];
    for (let i = cartas.length - 1; i > 0; i--) {
      const k = Math.floor(rand() * (i + 1));
      [cartas[i], cartas[k]] = [cartas[k], cartas[i]];
    }
    this.cartas = cartas.map((dibujo) => ({ dibujo, de: null })); // de = quién encontró el par
    this.abiertas = []; // índices dados vuelta en el turno actual
    this.mirando = null; // { hasta } cuando hay dos distintas a la vista
    this.timer = null;
    this.notificar = null;
    this.puntos = { [jugadores[0]]: 0, [jugadores[1]]: 0 };
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (tipo !== 'voltear') throw new ErrorJuego('Acción desconocida');
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    if (this.mirando) throw new ErrorJuego('Esperá que se tapen las cartas');
    const i = entero(datos.i, 0, this.cartas.length - 1, 'La carta');
    if (this.cartas[i].de || this.abiertas.includes(i)) throw new ErrorJuego('Esa carta ya está a la vista');
    this.abiertas.push(i);
    if (this.abiertas.length < 2) return;

    const [a, b] = this.abiertas;
    if (this.cartas[a].dibujo === this.cartas[b].dibujo) {
      // Par: te lo quedás y seguís.
      this.cartas[a].de = j;
      this.cartas[b].de = j;
      this.puntos[j]++;
      this.abiertas = [];
      if (this.cartas.every((c) => c.de)) {
        this.estado = 'terminada';
        this.ganador = ganadorPorPuntos(this.jugadores, this.puntos);
        this.motivoFin = 'puntos';
      }
      return;
    }
    // Distintas: se ven un momento y pasa el turno.
    this.mirando = { hasta: Date.now() + this.config.segundosMirar * 1000 };
    this.#programarTapar();
  }

  #programarTapar() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.mirando = null;
      this.abiertas = [];
      this.turno = this.rival(this.turno);
      this.notificar?.();
    }, Math.max(0, this.mirando.hasta - Date.now()));
    this.timer.unref?.();
  }

  // Después de restaurar una partida guardada.
  reanudar() {
    if (this.estado === 'jugando' && this.mirando) this.#programarTapar();
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
    return { puntos: this.puntos };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const terminada = this.estado === 'terminada';
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      turno: this.turno,
      // Solo se mandan los dibujos que están a la vista (nada de espiar por la red).
      cartas: this.cartas.map((c, i) => ({
        dibujo: c.de || this.abiertas.includes(i) || terminada ? c.dibujo : null,
        de: c.de === null ? null : c.de === j ? 'yo' : 'rival',
        abierta: this.abiertas.includes(i),
      })),
      mirando: !!this.mirando,
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      quedan: this.cartas.filter((c) => !c.de).length / 2,
    };
  }
}
