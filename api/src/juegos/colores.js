// Contrarreloj de colores (efecto Stroop) 1vs1 a la vez: aparece el nombre de un color pintado con
// otro color y hay que tocar el color de la TINTA, no lo que dice. El primero que acierta se lleva la
// carta; si le errás, quedás afuera de esa carta. En modo "mezcla", a veces pide la PALABRA.
import { ErrorJuego, entero } from './comun.js';

export const COLORES = ['rojo', 'azul', 'verde', 'amarillo', 'violeta', 'naranja'];
export const CONFIG_DEFECTO = { cartas: 15, colores: 4, mezcla: false };

export function validarConfig(c = {}) {
  const colores = Number(c.colores ?? CONFIG_DEFECTO.colores);
  if (![4, 6].includes(colores)) throw new ErrorJuego('Se juega con 4 o 6 colores');
  return { cartas: entero(c.cartas ?? CONFIG_DEFECTO.cartas, 5, 40, 'Las cartas'), colores, mezcla: !!(c.mezcla ?? CONFIG_DEFECTO.mezcla) };
}

const CUENTA_MS = 2500;
const CARTA_MS = 5000;
const PAUSA_MS = 1300;

export class PartidaColores {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    this.juego = 'colores';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    const n = config.colores;
    // Todas las cartas se arman al principio (las mismas para los dos).
    this.mazo = Array.from({ length: config.cartas }, () => {
      const palabra = Math.floor(rand() * n);
      let tinta = Math.floor(rand() * (n - 1));
      if (tinta >= palabra) tinta++; // la tinta nunca coincide con la palabra
      return { palabra, tinta, pide: config.mezcla && rand() < 0.3 ? 'palabra' : 'tinta' };
    });
    this.numero = 0;
    this.historial = [];
    this.timer = null;
    this.notificar = null;
    this.fase = 'cuenta';
    this.hasta = Date.now() + CUENTA_MS;
    this.#programar();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  get carta() {
    return this.mazo[this.numero - 1];
  }

  #programar() {
    clearTimeout(this.timer);
    const fase = this.fase; const numero = this.numero;
    this.timer = setTimeout(() => {
      if (this.estado !== 'jugando' || this.fase !== fase || this.numero !== numero) return;
      if (fase === 'carta') this.#cerrarCarta(null);
      else this.#siguienteCarta();
      this.notificar?.();
    }, Math.max(0, this.hasta - Date.now()));
    this.timer.unref?.();
  }

  #siguienteCarta() {
    if (this.numero >= this.mazo.length) return this.#terminar();
    this.numero++;
    this.fase = 'carta';
    this.desde = Date.now();
    this.hasta = this.desde + CARTA_MS;
    this.bloqueados = new Set();
    this.ganoCarta = null;
    this.#programar();
  }

  #cerrarCarta(ganador, ms) {
    this.ganoCarta = ganador;
    if (ganador) this.puntos[ganador]++;
    this.historial.push({ ganador, ms: ms ?? null });
    this.fase = 'pausa';
    this.hasta = Date.now() + PAUSA_MS;
    this.#programar();
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo !== 'responder') throw new ErrorJuego('Acción desconocida');
    if (this.fase !== 'carta' || this.bloqueados.has(j)) return;
    const color = entero(datos.color, 0, this.config.colores - 1, 'El color');
    const c = this.carta;
    const bien = c.pide === 'tinta' ? c.tinta : c.palabra;
    if (color === bien) return this.#cerrarCarta(j, Date.now() - this.desde);
    this.bloqueados.add(j);
    if (this.bloqueados.size === 2) this.#cerrarCarta(null);
  }

  #terminar() {
    clearTimeout(this.timer);
    this.estado = 'terminada';
    this.fase = 'fin';
    const [a, b] = this.jugadores;
    this.ganador = this.puntos[a] === this.puntos[b] ? null : this.puntos[a] > this.puntos[b] ? a : b;
    this.motivoFin = 'puntos';
  }

  // Después de restaurar: la carta en curso se vuelve a jugar.
  reanudar() {
    if (this.estado !== 'jugando') return;
    if (this.fase === 'carta') this.numero--;
    this.fase = 'pausa';
    this.hasta = Date.now() + PAUSA_MS;
    this.#programar();
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
    return { puntos: this.puntos, cartas: this.numero };
  }

  vistaPara(j) {
    const r = this.rival(j);
    const quien = (x) => (x === null ? null : x === j ? 'yo' : 'rival');
    const c = this.fase === 'carta' || this.fase === 'pausa' ? this.carta : null;
    const ultimo = this.historial[this.historial.length - 1];
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      colores: COLORES.slice(0, this.config.colores),
      fase: this.fase,
      numero: this.numero,
      total: this.mazo.length,
      carta: c,
      hasta: this.hasta,
      ahora: Date.now(),
      bloqueado: this.fase === 'carta' && this.bloqueados.has(j),
      rivalBloqueado: this.fase === 'carta' && this.bloqueados.has(r),
      ganoCarta: this.fase === 'pausa' ? quien(this.ganoCarta) : undefined,
      ms: this.fase === 'pausa' ? ultimo?.ms : null,
      puntos: { yo: this.puntos[j], rival: this.puntos[r] },
      historial: this.historial.map((h) => quien(h.ganador)),
    };
  }
}
