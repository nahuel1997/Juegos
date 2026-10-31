// Adiviná (de 2 a 8): van apareciendo pistas, de la más difícil a la más obvia, sobre un país, una
// comida, una cosa de todos los días o un club de fútbol. Escribí la respuesta cuando quieras: cuanto
// antes la sacás, más puntos (5 con la primera pista… 1 con la última) y el primero suma 1 de yapa.
import { ErrorJuego, entero, PartidaGrupal, mezclar } from './comun.js';
import { acierta } from './emojis.js';
import { CATEGORIAS } from './adivinaDatos.js';

export { CATEGORIAS };
export const CONFIG_DEFECTO = { rondas: 8, segundos: 8, categorias: Object.keys(CATEGORIAS) };
const CUENTA_MS = 2200;
const REVELADO_MS = 4500;
const ENTRE_INTENTOS_MS = 800;

export function validarConfig(c = {}) {
  const categorias = [...new Set(Array.isArray(c.categorias) ? c.categorias : CONFIG_DEFECTO.categorias)].filter((k) => CATEGORIAS[k]);
  if (!categorias.length) throw new ErrorJuego('Elegí al menos una categoría');
  return {
    rondas: entero(c.rondas ?? CONFIG_DEFECTO.rondas, 3, 20, 'Las rondas'),
    segundos: entero(c.segundos ?? CONFIG_DEFECTO.segundos, 4, 20, 'Los segundos por pista'),
    categorias,
  };
}

export const aciertaItem = (texto, [respuesta, otras]) => [respuesta, ...otras].some((r) => acierta(texto, r));

export class PartidaAdivina extends PartidaGrupal {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    super('adivina', jugadores, config);
    this.rand = rand;
    // Las rondas se reparten entre las categorías elegidas, sin repetir.
    const todos = config.categorias.flatMap((cat) => CATEGORIAS[cat].items.map((_, i) => [cat, i]));
    this.orden = mezclar(todos, rand);
    this.numero = 0;
    this.#nueva();
  }

  get item() {
    const [cat, i] = this.orden[(this.numero - 1) % this.orden.length];
    return { cat, datos: CATEGORIAS[cat].items[i] };
  }

  #nueva() {
    this.numero++;
    this.pista = 0;
    this.acertaron = []; // [{ j, pista }] en orden
    this.errados = {}; // jugador -> últimos intentos mal (solo los ve él)
    this.ultimoIntento = {};
    this.irA('cuenta', CUENTA_MS);
  }

  alVencer() {
    if (this.fase === 'cuenta' || (this.fase === 'pistas' && this.pista < 5)) {
      this.pista++;
      // La última pista dura un poco más.
      return this.irA('pistas', this.config.segundos * 1000 * (this.pista === 5 ? 1.5 : 1));
    }
    if (this.fase === 'pistas') return this.irA('revelado', REVELADO_MS);
    if (this.fase === 'revelado') {
      if (this.numero >= this.config.rondas) return this.terminar();
      return this.#nueva();
    }
  }

  accion(j, tipo, datos = {}) {
    this.validar(j);
    if (tipo !== 'adivinar') throw new ErrorJuego('Acción desconocida');
    if (this.fase !== 'pistas') throw new ErrorJuego('Esperá la primera pista');
    if (this.acertaron.some((a) => a.j === j)) throw new ErrorJuego('Ya la sacaste');
    const ahora = Date.now();
    if (ahora - (this.ultimoIntento[j] || 0) < ENTRE_INTENTOS_MS) throw new ErrorJuego('Más despacio');
    this.ultimoIntento[j] = ahora;
    const texto = String(datos.texto ?? '').trim().slice(0, 60);
    if (!texto) throw new ErrorJuego('Escribí algo');
    if (!aciertaItem(texto, this.item.datos)) {
      this.errados[j] = [...(this.errados[j] || []), texto].slice(-4);
      return { ok: true, acierto: false };
    }
    this.puntos[j] += 6 - this.pista + (this.acertaron.length ? 0 : 1);
    this.acertaron.push({ j, pista: this.pista });
    if (this.activos.every((x) => this.acertaron.some((a) => a.j === x))) this.irA('revelado', REVELADO_MS);
    return { ok: true, acierto: true };
  }

  alAbandonar() {
    if (this.fase === 'pistas' && this.activos.every((x) => this.acertaron.some((a) => a.j === x))) this.irA('revelado', REVELADO_MS);
  }

  vistaPara(j) {
    const { cat, datos } = this.item;
    const [respuesta, , pistas] = datos;
    const revelado = this.fase === 'revelado' || this.estado === 'terminada';
    const loSaque = this.acertaron.some((a) => a.j === j);
    return {
      ...this.vistaBase(j),
      numero: this.numero,
      total: this.config.rondas,
      categoria: CATEGORIAS[cat].nombre,
      pista: this.pista,
      pistas: revelado ? pistas : pistas.slice(0, this.pista),
      respuesta: revelado || loSaque ? respuesta : null,
      acertaron: this.acertaron,
      errados: this.errados[j] || [],
    };
  }
}
