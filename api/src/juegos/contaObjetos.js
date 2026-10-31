// Contá los objetos (de 2 a 8): te dicen qué contar, aparece un montón de dibujitos mezclados un
// ratito y desaparecen. ¿Cuántos había? Exacto vale 3 (+1 al primero que la clava); pasarse o quedarse
// corto por uno vale 1.
import { ErrorJuego, entero, PartidaGrupal, mezclar } from './comun.js';

// Dibujitos de web/src/juegos/emojis/pictos.jsx que se distinguen bien de un vistazo.
export const OBJETOS = {
  estrella: ['estrella', 'estrellas'], corazon: ['corazón', 'corazones'], sol: ['sol', 'soles'], luna: ['luna', 'lunas'],
  nube: ['nube', 'nubes'], pez: ['pez', 'peces'], gato: ['gato', 'gatos'], perro: ['perro', 'perros'], flor: ['flor', 'flores'],
  arbol: ['árbol', 'árboles'], mariposa: ['mariposa', 'mariposas'], pajaro: ['pájaro', 'pájaros'], auto: ['auto', 'autos'],
  pelota: ['pelota', 'pelotas'], regalo: ['regalo', 'regalos'], diamante: ['diamante', 'diamantes'], cohete: ['cohete', 'cohetes'],
  casa: ['casa', 'casas'], nota: ['nota musical', 'notas musicales'], tortuga: ['tortuga', 'tortugas'], raton: ['ratón', 'ratones'],
  paraguas: ['paraguas', 'paraguas'], cactus: ['cactus', 'cactus'], llave: ['llave', 'llaves'], corona: ['corona', 'coronas'],
};
export const DIFICULTADES = {
  facil: { ms: 5000, objetivo: [3, 8], otros: [4, 8], tipos: 2 },
  normal: { ms: 3500, objetivo: [5, 12], otros: [8, 14], tipos: 3 },
  dificil: { ms: 2200, objetivo: [7, 16], otros: [12, 20], tipos: 5 },
};
export const CONFIG_DEFECTO = { preguntas: 8, dificultad: 'normal' };
const CUENTA_MS = 2800;
const RESPONDER_MS = 12000;
const REVELADO_MS = 4500;

export function validarConfig(c = {}) {
  const dificultad = c.dificultad ?? CONFIG_DEFECTO.dificultad;
  if (!DIFICULTADES[dificultad]) throw new ErrorJuego('Dificultad inválida');
  return { preguntas: entero(c.preguntas ?? CONFIG_DEFECTO.preguntas, 3, 20, 'Las preguntas'), dificultad };
}

const entre = (rand, [a, b]) => a + Math.floor(rand() * (b - a + 1));

// La escena: dibujitos repartidos sin pisarse demasiado (x, y de 0 a 100; giro y tamaño).
export function armarEscena(dificultad, rand = Math.random) {
  const d = DIFICULTADES[dificultad];
  const [objetivo, ...otros] = mezclar(Object.keys(OBJETOS), rand).slice(0, d.tipos + 1);
  const cantidad = entre(rand, d.objetivo);
  const lista = Array(cantidad).fill(objetivo);
  const extra = entre(rand, d.otros);
  for (let i = 0; i < extra; i++) lista.push(otros[i % otros.length]);
  const puestos = [];
  const escena = mezclar(lista, rand).map((p) => {
    let x; let y;
    for (let intento = 0; intento < 60; intento++) {
      x = 6 + rand() * 88;
      y = 8 + rand() * 84;
      if (puestos.every(([px, py]) => Math.hypot(px - x, (py - y) * 0.62) > 9.5)) break;
    }
    puestos.push([x, y]);
    return { p, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, g: Math.round((rand() - 0.5) * 50), t: Math.round((0.8 + rand() * 0.45) * 100) / 100 };
  });
  return { objetivo, cantidad, escena };
}

export class PartidaContaObjetos extends PartidaGrupal {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    super('conta-objetos', jugadores, config);
    this.rand = rand;
    this.numero = 0;
    this.#nueva();
  }

  #nueva() {
    this.numero++;
    this.ronda = armarEscena(this.config.dificultad, this.rand ?? Math.random);
    this.respuestas = {}; // jugador -> { n, ms }
    this.resultado = null;
    this.irA('cuenta', CUENTA_MS);
  }

  alVencer() {
    if (this.fase === 'cuenta') return this.irA('mirando', DIFICULTADES[this.config.dificultad].ms);
    if (this.fase === 'mirando') {
      this.desde = Date.now();
      return this.irA('respondiendo', RESPONDER_MS);
    }
    if (this.fase === 'respondiendo') return this.#revelar();
    if (this.fase === 'revelado') {
      if (this.numero >= this.config.preguntas) return this.terminar();
      return this.#nueva();
    }
  }

  #revelar() {
    const n = this.ronda.cantidad;
    const exactos = Object.entries(this.respuestas).filter(([, r]) => r.n === n).sort((a, b) => a[1].ms - b[1].ms).map(([j]) => j);
    const cerca = Object.entries(this.respuestas).filter(([, r]) => Math.abs(r.n - n) === 1).map(([j]) => j);
    for (const j of exactos) this.puntos[j] += 3;
    if (exactos.length) this.puntos[exactos[0]] += 1;
    for (const j of cerca) this.puntos[j] += 1;
    this.resultado = { exactos, cerca, primero: exactos[0] ?? null };
    this.irA('revelado', REVELADO_MS);
  }

  accion(j, tipo, datos = {}) {
    this.validar(j);
    if (tipo !== 'responder') throw new ErrorJuego('Acción desconocida');
    if (this.fase !== 'respondiendo') throw new ErrorJuego('Ahora no se puede responder');
    if (this.respuestas[j]) throw new ErrorJuego('Ya respondiste');
    this.respuestas[j] = { n: entero(datos.n, 0, 99, 'El número'), ms: Date.now() - this.desde };
    if (this.activos.every((x) => this.respuestas[x])) this.#revelar();
  }

  alAbandonar() {
    if (this.fase === 'respondiendo' && this.activos.every((x) => this.respuestas[x])) this.#revelar();
  }

  vistaPara(j) {
    const ver = this.fase === 'mirando' || this.fase === 'revelado' || this.estado === 'terminada';
    const revelado = this.fase === 'revelado' || this.estado === 'terminada';
    return {
      ...this.vistaBase(j),
      numero: this.numero,
      total: this.config.preguntas,
      objetivo: this.ronda.objetivo,
      nombres: OBJETOS[this.ronda.objetivo],
      escena: ver ? this.ronda.escena : null, // mientras se responde, no viaja (nada de espiar)
      cantidad: revelado ? this.ronda.cantidad : null,
      mia: this.respuestas[j]?.n ?? null,
      respondieron: Object.keys(this.respuestas),
      respuestas: revelado ? Object.fromEntries(Object.entries(this.respuestas).map(([k, r]) => [k, r.n])) : {},
      resultado: revelado ? this.resultado : null,
    };
  }
}
