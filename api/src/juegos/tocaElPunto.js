// Tocá el punto (de 2 a 8): aparecen círculos de a uno y hay que tocarlos lo más rápido posible.
// Todos reciben la MISMA secuencia (sale de una semilla), cada uno a su ritmo; gana el que toca más
// en el tiempo de la ronda. Los círculos se achican a medida que avanzás.
import { ErrorJuego, entero, PartidaGrupal, azarConSemilla } from './comun.js';

export const TAMANIOS = { grande: 0.085, normal: 0.065, chico: 0.048 };
export const CONFIG_DEFECTO = { segundos: 30, tamanio: 'normal', rondas: 2 };
const CUENTA_MS = 3000;
const PAUSA_MS = 4500;
const MIN_ENTRE_TOQUES = 110; // nadie toca más rápido que esto (freno a trampas)

export function validarConfig(c = {}) {
  const tamanio = c.tamanio ?? CONFIG_DEFECTO.tamanio;
  if (!TAMANIOS[tamanio]) throw new ErrorJuego('Tamaño inválido');
  return {
    segundos: entero(c.segundos ?? CONFIG_DEFECTO.segundos, 10, 90, 'Los segundos'),
    tamanio,
    rondas: entero(c.rondas ?? CONFIG_DEFECTO.rondas, 1, 5, 'Las rondas'),
  };
}

// El círculo número i de una semilla: posición (0 a 1) y radio (fracción del ancho).
export function objetivo(semilla, i, tamanio = 'normal') {
  const rand = azarConSemilla(semilla * 7919 + i * 104729);
  const base = TAMANIOS[tamanio] ?? TAMANIOS.normal;
  const r = base * Math.max(0.55, 1 - i * 0.012);
  return { x: r + rand() * (1 - 2 * r), y: r + rand() * (1 - 2 * r), r };
}

export class PartidaTocaElPunto extends PartidaGrupal {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    super('toca-el-punto', jugadores, config);
    this.rand = rand;
    this.ronda = 0;
    this.historial = [];
    this.#nuevaRonda();
  }

  #nuevaRonda() {
    this.ronda++;
    this.semilla = Math.floor((this.rand ?? Math.random)() * 1e9);
    this.aciertos = Object.fromEntries(this.jugadores.map((j) => [j, 0]));
    this.errores = Object.fromEntries(this.jugadores.map((j) => [j, 0]));
    this.ultimo = {};
    this.irA('cuenta', CUENTA_MS);
  }

  alVencer() {
    if (this.fase === 'cuenta') return this.irA('jugando', this.config.segundos * 1000);
    if (this.fase === 'jugando') {
      // Punto de la ronda para el que más tocó (y un punto por cada 10 toques, para que cuente todo).
      const max = Math.max(...this.activos.map((j) => this.aciertos[j]));
      const mejores = this.activos.filter((j) => this.aciertos[j] === max);
      for (const j of this.activos) this.puntos[j] += Math.floor(this.aciertos[j] / 10);
      if (max > 0) for (const j of mejores) this.puntos[j] += 3;
      this.historial.push({ aciertos: { ...this.aciertos }, mejores: max > 0 ? mejores : [] });
      if (this.ronda >= this.config.rondas) return this.terminar();
      return this.irA('fin-ronda', PAUSA_MS);
    }
    if (this.fase === 'fin-ronda') this.#nuevaRonda();
  }

  accion(j, tipo, datos = {}) {
    this.validar(j);
    if (this.fase !== 'jugando') throw new ErrorJuego('Esperá que arranque la ronda');
    if (tipo === 'errar') { this.errores[j]++; return; }
    if (tipo !== 'tocar') throw new ErrorJuego('Acción desconocida');
    // Un toque viejo (repetido o que llegó tarde) no cuenta. Si el navegador va adelantado, igual suma uno.
    if (!Number.isInteger(Number(datos.i)) || Number(datos.i) < this.aciertos[j]) return;
    const ahora = Date.now();
    if (ahora - (this.ultimo[j] || 0) < MIN_ENTRE_TOQUES) return;
    this.ultimo[j] = ahora;
    this.aciertos[j]++;
  }

  vistaPara(j) {
    return {
      ...this.vistaBase(j),
      ronda: this.ronda,
      semilla: this.semilla,
      aciertos: this.aciertos,
      errores: this.errores,
      historial: this.historial,
    };
  }
}
