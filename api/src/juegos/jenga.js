// Jenga (de 2 a 4): torre de bloques de a tres por piso. En tu turno elegís un bloque (no de los pisos
// de arriba de todo) y lo sacás con pulso: una marca va y viene y tenés que frenarla en la zona verde.
// La zona es más chica cuanto más arriesgado es el bloque (de abajo, de un costado, o el último que
// sostiene un piso). Si fallás, la torre se tambalea; si se tambalea demasiado… se cae y perdés la ronda.
import { ErrorJuego, entero, PartidaGrupal } from './comun.js';

export const CONFIG_DEFECTO = { pisos: 15, rondas: 3, segundosTurno: 25 };
export const PERIODO_MS = 1500; // lo que tarda la marca en ir y volver
const CAIDA_MS = 4200;
const TOLERANCIA_MS = 450; // diferencia aceptada entre el reloj del navegador y el del server

export function validarConfig(c = {}) {
  return {
    pisos: entero(c.pisos ?? CONFIG_DEFECTO.pisos, 9, 18, 'Los pisos'),
    rondas: entero(c.rondas ?? CONFIG_DEFECTO.rondas, 1, 7, 'Las rondas'),
    segundosTurno: entero(c.segundosTurno ?? CONFIG_DEFECTO.segundosTurno, 10, 60, 'Los segundos por turno'),
  };
}

// Dónde está la marca (0 a 1) a los `ms` de empezar: va y vuelve.
export function marca(ms) {
  const t = (((ms % PERIODO_MS) + PERIODO_MS) % PERIODO_MS) / PERIODO_MS;
  return t < 0.5 ? t * 2 : 2 - t * 2;
}

// ¿Qué tan difícil es sacar este bloque? Devuelve el ancho de la zona verde (0 a 1).
export function anchoZona(torre, piso, pos) {
  const fila = torre[piso];
  const quedan = fila.filter(Boolean).length - 1;
  const arriba = torre.length - 1 - piso; // pisos que tiene encima
  let ancho = 0.34 - 0.16 * Math.min(1, arriba / 16);
  if (quedan === 1) {
    const queda = fila.findIndex((x, i) => x && i !== pos);
    ancho *= queda === 1 ? 0.75 : 0.28; // quedarse con el del medio aguanta; con uno del costado, casi no
  } else if (pos !== 1) {
    ancho *= 0.85; // los de los costados son un poco más difíciles
  }
  return Math.max(0.05, ancho);
}

// Pisos de los que se puede sacar: todos menos el de arriba (si está incompleto, tampoco el de abajo de él),
// y sin dejar un piso vacío.
export function puedeSacar(torre, piso, pos) {
  const tope = torre.length - 1;
  const incompleto = torre[tope].filter(Boolean).length < 3;
  if (piso < 0 || piso > tope || pos < 0 || pos > 2 || !torre[piso][pos]) return false;
  if (piso === tope || (incompleto && piso === tope - 1)) return false;
  return torre[piso].filter(Boolean).length > 1;
}

export class PartidaJenga extends PartidaGrupal {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    super('jenga', jugadores, config);
    this.rand = rand;
    this.ronda = 0;
    this.empieza = Math.floor(rand() * jugadores.length);
    this.historial = [];
    this.#nuevaRonda();
  }

  #nuevaRonda() {
    this.ronda++;
    this.torre = Array.from({ length: this.config.pisos }, () => [true, true, true]);
    this.tambaleo = 0;
    this.intento = null;
    this.cayo = null;
    this.ultimo = null;
    const act = this.activos;
    this.turno = act[(this.empieza + this.ronda - 1) % act.length];
    this.irA('eligiendo', this.config.segundosTurno * 1000);
  }

  #pasarTurno() {
    const act = this.activos;
    this.turno = act[(act.indexOf(this.turno) + 1) % act.length] ?? act[0];
    this.intento = null;
    this.irA('eligiendo', this.config.segundosTurno * 1000);
  }

  // El bloque sacado va arriba de todo.
  #ponerArriba() {
    const tope = this.torre[this.torre.length - 1];
    if (tope.every(Boolean)) this.torre.push([true, false, false]);
    else tope[tope.indexOf(false)] = true;
  }

  #caer(j) {
    this.cayo = j;
    this.tambaleo = 1;
    for (const x of this.activos) if (x !== j) this.puntos[x]++;
    this.historial.push(j);
    if (this.ronda >= this.config.rondas) return this.terminar();
    this.irA('cayendo', CAIDA_MS);
  }

  // Falló el pulso: tambalea más cuanto más lejos de la zona y cuanto más alta la torre.
  #fallar(j, distancia) {
    const extra = 0.22 + Math.min(0.5, distancia * 1.4) + this.torre.length / 100;
    this.tambaleo = Math.min(1, this.tambaleo + extra);
    this.ultimo = { j, ok: false, piso: this.intento?.piso, pos: this.intento?.pos };
    const arriesgado = this.intento && this.intento.ancho < 0.1;
    // El último bloque de un costado que se mueve mal, o tambalear de más: se cae todo.
    if (this.tambaleo >= 1 || (arriesgado && (this.rand ?? Math.random)() < 0.5)) return this.#caer(j);
    this.#pasarTurno();
  }

  accion(j, tipo, datos = {}) {
    this.validar(j);
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    if (tipo === 'elegir') {
      if (this.fase !== 'eligiendo') throw new ErrorJuego('Ahora no');
      const piso = entero(datos.piso, 0, this.torre.length - 1, 'El piso');
      const pos = entero(datos.pos, 0, 2, 'El bloque');
      if (!puedeSacar(this.torre, piso, pos)) throw new ErrorJuego('Ese bloque no se puede sacar');
      // La zona verde sale en un lugar distinto cada vez.
      const ancho = anchoZona(this.torre, piso, pos);
      const centro = ancho / 2 + (this.rand ?? Math.random)() * (1 - ancho);
      this.intento = { piso, pos, ancho, centro, inicio: Date.now() };
      return this.irA('sacando', 8000);
    }
    if (tipo === 'soltar') {
      // Se arrepiente: mueve un poco la torre y vuelve a elegir.
      if (this.fase !== 'sacando') throw new ErrorJuego('No estás sacando ningún bloque');
      this.tambaleo = Math.min(0.95, this.tambaleo + 0.06);
      this.intento = null;
      return this.irA('eligiendo', this.config.segundosTurno * 1000);
    }
    if (tipo !== 'sacar') throw new ErrorJuego('Acción desconocida');
    if (this.fase !== 'sacando' || !this.intento) throw new ErrorJuego('Primero elegí un bloque');
    // El navegador manda cuántos ms pasaron cuando tocó; se acepta si se parece al reloj del server.
    const real = Date.now() - this.intento.inicio;
    const dicho = Number(datos.t);
    const ms = Number.isFinite(dicho) ? Math.min(real + 60, Math.max(real - TOLERANCIA_MS, dicho)) : real;
    const donde = marca(ms);
    const { piso, pos, ancho, centro } = this.intento;
    const distancia = Math.max(0, Math.abs(donde - centro) - ancho / 2);
    if (distancia > 0) return this.#fallar(j, distancia);
    this.torre[piso][pos] = false;
    this.#ponerArriba();
    this.tambaleo = Math.max(0, this.tambaleo - 0.08);
    this.ultimo = { j, ok: true, piso, pos };
    this.#pasarTurno();
  }

  alVencer() {
    if (this.fase === 'eligiendo' || this.fase === 'sacando') {
      // Se le terminó el tiempo: cuenta como un pulso fallado.
      return this.#fallar(this.turno, 0.15);
    }
    if (this.fase === 'cayendo') this.#nuevaRonda();
  }

  alAbandonar(j) {
    if (this.turno !== j || this.fase === 'cayendo') return;
    let i = this.jugadores.indexOf(j);
    do i = (i + 1) % this.jugadores.length; while (this.fuera.has(this.jugadores[i]));
    this.turno = this.jugadores[i];
    this.intento = null;
    this.irA('eligiendo', this.config.segundosTurno * 1000);
  }

  vistaPara(j) {
    return {
      ...this.vistaBase(j),
      ronda: this.ronda,
      torre: this.torre,
      tambaleo: this.tambaleo,
      turno: this.turno,
      intento: this.intento && { ...this.intento, transcurrido: Date.now() - this.intento.inicio },
      periodo: PERIODO_MS,
      cayo: this.cayo,
      ultimo: this.ultimo,
      historial: this.historial,
    };
  }
}
