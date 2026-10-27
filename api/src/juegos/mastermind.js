// Mastermind 1vs1: cada uno arma un código secreto de colores y los dos, a la vez, intentan adivinar
// el del otro. Cada intento se responde con negras (color y lugar justos) y blancas (color justo en
// otro lugar). Gana quien lo descubre en menos intentos; si los dos usan los mismos, empate.
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { largo: 4, colores: 6, repetidos: true, intentos: 10, azar: false };

export function validarConfig(c = {}) {
  const config = {
    largo: entero(c.largo ?? CONFIG_DEFECTO.largo, 3, 6, 'El largo del código'),
    colores: entero(c.colores ?? CONFIG_DEFECTO.colores, 4, 8, 'La cantidad de colores'),
    repetidos: !!(c.repetidos ?? CONFIG_DEFECTO.repetidos),
    intentos: entero(c.intentos ?? CONFIG_DEFECTO.intentos, 5, 15, 'Los intentos'),
    azar: !!(c.azar ?? CONFIG_DEFECTO.azar),
  };
  if (!config.repetidos && config.largo > config.colores) throw new ErrorJuego('Sin repetir colores, el código no puede ser más largo que los colores');
  return config;
}

export function evaluar(secreto, intento) {
  let negras = 0;
  const restoS = {};
  const restoI = {};
  secreto.forEach((x, i) => {
    if (x === intento[i]) negras++;
    else {
      restoS[x] = (restoS[x] || 0) + 1;
      restoI[intento[i]] = (restoI[intento[i]] || 0) + 1;
    }
  });
  const blancas = Object.keys(restoI).reduce((s, k) => s + Math.min(restoI[k], restoS[k] || 0), 0);
  return { negras, blancas };
}

export class PartidaMastermind {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    this.juego = 'mastermind';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    // secreto[j] = el código que tiene que adivinar el RIVAL de j (lo arma j).
    this.secreto = Object.fromEntries(jugadores.map((j) => [j, null]));
    this.intentos = Object.fromEntries(jugadores.map((j) => [j, []]));
    this.resuelto = Object.fromEntries(jugadores.map((j) => [j, false]));
    if (config.azar) for (const j of jugadores) this.secreto[j] = this.#alAzar(rand);
    this.fase = config.azar ? 'adivinando' : 'secreto';
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #alAzar(rand) {
    const { largo, colores, repetidos } = this.config;
    const libres = Array.from({ length: colores }, (_, i) => i);
    return Array.from({ length: largo }, () => (repetidos ? Math.floor(rand() * colores) : libres.splice(Math.floor(rand() * libres.length), 1)[0]));
  }

  #validarCodigo(codigo) {
    const { largo, colores, repetidos } = this.config;
    if (!Array.isArray(codigo) || codigo.length !== largo) throw new ErrorJuego(`El código tiene que tener ${largo} colores`);
    const c = codigo.map((x) => entero(x, 0, colores - 1, 'El color'));
    if (!repetidos && new Set(c).size !== c.length) throw new ErrorJuego('No se pueden repetir colores');
    return c;
  }

  #terminado(j) {
    return this.resuelto[j] || this.intentos[j].length >= this.config.intentos;
  }

  accion(j, tipo, datos = {}) {
    const rival = this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo === 'secreto') {
      if (this.fase !== 'secreto') throw new ErrorJuego('Ya están adivinando');
      this.secreto[j] = this.#validarCodigo(datos.codigo);
      if (this.jugadores.every((x) => this.secreto[x])) this.fase = 'adivinando';
      return;
    }
    if (tipo !== 'intento') throw new ErrorJuego('Acción desconocida');
    if (this.fase !== 'adivinando') throw new ErrorJuego('Todavía falta que armen los códigos');
    if (this.#terminado(j)) throw new ErrorJuego('Ya terminaste: esperá al otro');
    const intento = this.#validarCodigo(datos.codigo);
    const r = evaluar(this.secreto[rival], intento);
    this.intentos[j].push({ codigo: intento, ...r });
    if (r.negras === this.config.largo) this.resuelto[j] = true;
    if (this.jugadores.every((x) => this.#terminado(x))) this.#cerrar();
  }

  #cerrar() {
    this.estado = 'terminada';
    this.motivoFin = 'intentos';
    const [a, b] = this.jugadores;
    // Puntaje: intentos usados si lo resolvió; si no, infinito.
    const p = (x) => (this.resuelto[x] ? this.intentos[x].length : Infinity);
    this.ganador = p(a) === p(b) ? null : p(a) < p(b) ? a : b;
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { intentos: Object.fromEntries(this.jugadores.map((x) => [x, this.intentos[x].length])) };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const fin = this.estado === 'terminada';
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      fase: this.fase,
      miSecreto: this.secreto[j],
      secretoListo: { yo: !!this.secreto[j], rival: !!this.secreto[rival] },
      misIntentos: this.intentos[j],
      // Del rival solo se ve cuántos intentos lleva y cómo le fue (no los colores), hasta el final.
      intentosRival: this.intentos[rival].map((x) => (fin ? x : { negras: x.negras, blancas: x.blancas })),
      resuelto: { yo: this.resuelto[j], rival: this.resuelto[rival] },
      terminado: { yo: this.#terminado(j), rival: this.#terminado(rival) },
      secretoRival: fin || this.#terminado(j) ? this.secreto[rival] : null,
    };
  }
}
