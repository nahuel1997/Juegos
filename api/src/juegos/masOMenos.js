// Más o menos (de 2 a 8): te muestran algo con su número (habitantes, altura, año…) y otra cosa con
// el número escondido. ¿Tiene más o menos? Responden todos a la vez; acertar vale 1 y el más rápido
// en acertar se lleva 1 de yapa.
import { ErrorJuego, entero, PartidaGrupal, mezclar } from './comun.js';
import { CATEGORIAS } from './masOMenosDatos.js';

export { CATEGORIAS };
export const CONFIG_DEFECTO = { preguntas: 10, segundos: 10, categorias: Object.keys(CATEGORIAS) };
const CUENTA_MS = 2500;
const REVELADO_MS = 3800;

export function validarConfig(c = {}) {
  const categorias = [...new Set(Array.isArray(c.categorias) ? c.categorias : CONFIG_DEFECTO.categorias)].filter((k) => CATEGORIAS[k]);
  if (!categorias.length) throw new ErrorJuego('Elegí al menos una categoría');
  return {
    preguntas: entero(c.preguntas ?? CONFIG_DEFECTO.preguntas, 3, 30, 'Las preguntas'),
    segundos: entero(c.segundos ?? CONFIG_DEFECTO.segundos, 4, 30, 'Los segundos'),
    categorias,
  };
}

// Dos cosas de la misma categoría con números bien distintos (más de 8 % de diferencia).
export function armarPar(cat, rand = Math.random, usados = new Set()) {
  const items = CATEGORIAS[cat].items;
  for (let i = 0; i < 200; i++) {
    const [a, b] = mezclar(items, rand);
    if (usados.has(a[0] + b[0]) && i < 150) continue;
    if (Math.abs(a[1] - b[1]) / Math.max(a[1], b[1]) > 0.08) return [a, b];
  }
  return [items[0], items[1]];
}

export class PartidaMasOMenos extends PartidaGrupal {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    super('mas-o-menos', jugadores, config);
    this.rand = rand;
    this.numero = 0;
    this.usados = [];
    this.#nueva();
  }

  #nueva() {
    const rand = this.rand ?? Math.random;
    this.numero++;
    const cats = this.config.categorias;
    const cat = cats[Math.floor(rand() * cats.length)];
    const [a, b] = armarPar(cat, rand, new Set(this.usados));
    this.usados.push(a[0] + b[0]);
    this.pregunta = { cat, a: { nombre: a[0], valor: a[1] }, b: { nombre: b[0], valor: b[1] } };
    this.respuestas = {}; // jugador -> { r: 'mas'|'menos', ms }
    this.resultado = null;
    this.irA('cuenta', CUENTA_MS);
  }

  alVencer() {
    if (this.fase === 'cuenta') {
      this.desde = Date.now();
      return this.irA('pregunta', this.config.segundos * 1000);
    }
    if (this.fase === 'pregunta') return this.#revelar();
    if (this.fase === 'revelado') {
      if (this.numero >= this.config.preguntas) return this.terminar();
      return this.#nueva();
    }
  }

  #revelar() {
    const { a, b } = this.pregunta;
    const bien = b.valor > a.valor ? 'mas' : 'menos';
    const acertaron = Object.entries(this.respuestas).filter(([, x]) => x.r === bien).sort((x, y) => x[1].ms - y[1].ms).map(([j]) => j);
    for (const j of acertaron) this.puntos[j] += 1;
    if (acertaron.length) this.puntos[acertaron[0]] += 1; // yapa para el más rápido
    this.resultado = { bien, acertaron, rapido: acertaron[0] ?? null };
    this.irA('revelado', REVELADO_MS);
  }

  accion(j, tipo, datos = {}) {
    this.validar(j);
    if (tipo !== 'responder') throw new ErrorJuego('Acción desconocida');
    if (this.fase !== 'pregunta') throw new ErrorJuego('Ahora no se puede responder');
    if (this.respuestas[j]) throw new ErrorJuego('Ya respondiste');
    if (!['mas', 'menos'].includes(datos.r)) throw new ErrorJuego('Respuesta inválida');
    this.respuestas[j] = { r: datos.r, ms: Date.now() - this.desde };
    if (this.activos.every((x) => this.respuestas[x])) this.#revelar();
  }

  alAbandonar() {
    if (this.fase === 'pregunta' && this.activos.every((x) => this.respuestas[x])) this.#revelar();
  }

  vistaPara(j) {
    const cat = CATEGORIAS[this.pregunta.cat];
    const { a, b } = this.pregunta;
    const visto = this.fase === 'revelado' || this.estado === 'terminada';
    return {
      ...this.vistaBase(j),
      numero: this.numero,
      total: this.config.preguntas,
      categoria: { id: this.pregunta.cat, nombre: cat.nombre, pregunta: cat.pregunta, mas: cat.mas, menos: cat.menos },
      a: { nombre: a.nombre, texto: cat.unidad(a.valor) },
      b: { nombre: b.nombre, texto: visto ? cat.unidad(b.valor) : null },
      mia: this.respuestas[j]?.r ?? null,
      respondieron: Object.keys(this.respuestas),
      // Lo que eligió cada uno se ve recién al revelar.
      respuestas: visto ? Object.fromEntries(Object.entries(this.respuestas).map(([k, x]) => [k, x.r])) : {},
      resultado: visto ? this.resultado : null,
    };
  }
}
