// Palabras cruzadas (estilo Scrabble) de 2 a 4: armás palabras en el tablero con tus 7 fichas.
// Las casillas de colores multiplican la letra o la palabra; usar las 7 fichas suma 50.
// No hay diccionario oficial: cada jugada la revisan los demás unos segundos ("¡No vale!" la anula).
import { ErrorJuego, entero, PartidaGrupal, mezclar } from './comun.js';
import { LEXICO } from './palabrasCruzadasLexico.js';

export { LEXICO };
export const LADO = 15;
export const CENTRO = 7;
// [letra, cantidad, valor] (sin CH, LL ni RR: se arman con dos fichas). '' = comodín.
export const FICHAS = [
  ['A', 12, 1], ['E', 12, 1], ['O', 9, 1], ['I', 6, 1], ['S', 6, 1], ['N', 5, 1], ['L', 5, 1], ['R', 6, 1], ['U', 5, 1], ['T', 4, 1],
  ['D', 5, 2], ['G', 2, 2], ['C', 4, 3], ['B', 2, 3], ['M', 2, 3], ['P', 2, 3], ['H', 2, 4], ['F', 1, 4], ['V', 1, 4], ['Y', 1, 4],
  ['Q', 1, 5], ['J', 1, 8], ['Ñ', 1, 8], ['X', 1, 8], ['Z', 1, 10], ['', 2, 0],
];
export const VALOR = Object.fromEntries(FICHAS.map(([l, , v]) => [l, v]));
export const LETRAS = FICHAS.map(([l]) => l).filter(Boolean);

// Casillas especiales: P3/P2 = palabra x3/x2, L3/L2 = letra x3/x2 (el centro es P2).
const MAPA = [
  'P..l...P...l..P',
  '.p...L...L...p.',
  '..p...l.l...p..',
  'l..p...l...p..l',
  '....p.....p....',
  '.L...L...L...L.',
  '..l...l.l...l..',
  'P..l...p...l..P',
];
const CODIGO = { P: 'P3', p: 'P2', L: 'L3', l: 'L2' };
export const PREMIOS = Array.from({ length: LADO }, (_, f) => Array.from({ length: LADO }, (_, c) => CODIGO[MAPA[f <= 7 ? f : 14 - f][c <= 7 ? c : 14 - c]] || null));

export const CONFIG_DEFECTO = { revision: 'si', segundosRevision: 15, segundosTurno: 0 };

export function validarConfig(c = {}) {
  const revision = c.revision ?? CONFIG_DEFECTO.revision;
  if (!['si', 'no'].includes(revision)) throw new ErrorJuego('Revisión inválida');
  const segundosTurno = entero(c.segundosTurno ?? CONFIG_DEFECTO.segundosTurno, 0, 600, 'El tiempo por turno');
  if (segundosTurno && segundosTurno < 30) throw new ErrorJuego('El tiempo por turno tiene que ser 0 (sin límite) o de al menos 30 segundos');
  return { revision, segundosRevision: entero(c.segundosRevision ?? CONFIG_DEFECTO.segundosRevision, 5, 60, 'Los segundos de revisión'), segundosTurno };
}

// Lee la palabra que pasa por (f, c) en una dirección, usando el tablero más las fichas nuevas.
function leerPalabra(celda, f, c, df, dc) {
  while (celda(f - df, c - dc)) { f -= df; c -= dc; }
  const casillas = [];
  while (celda(f, c)) { casillas.push([f, c]); f += df; c += dc; }
  return casillas;
}

// Valida dónde van las fichas nuevas y calcula las palabras que se forman y sus puntos.
// tablero: LADO x LADO con null | { l, v }; nuevas: [{ f, c, l, v }]. Tira ErrorJuego si no se puede.
export function evaluarJugada(tablero, nuevas) {
  if (!nuevas.length) throw new ErrorJuego('Poné al menos una ficha');
  const vistas = new Set();
  for (const n of nuevas) {
    if (!Number.isInteger(n.f) || !Number.isInteger(n.c) || n.f < 0 || n.c < 0 || n.f >= LADO || n.c >= LADO) throw new ErrorJuego('Ficha fuera del tablero');
    if (tablero[n.f][n.c]) throw new ErrorJuego('Esa casilla ya está ocupada');
    if (vistas.has(`${n.f},${n.c}`)) throw new ErrorJuego('Dos fichas en la misma casilla');
    vistas.add(`${n.f},${n.c}`);
  }
  const misma = (k) => nuevas.every((n) => n[k] === nuevas[0][k]);
  const horizontal = misma('f');
  if (!horizontal && !misma('c')) throw new ErrorJuego('Las fichas tienen que ir en una misma fila o columna');
  const nuevaEn = new Map(nuevas.map((n) => [`${n.f},${n.c}`, n]));
  const celda = (f, c) => (f < 0 || c < 0 || f >= LADO || c >= LADO ? null : tablero[f][c] || nuevaEn.get(`${f},${c}`) || null);
  const vacio = tablero.every((fila) => fila.every((x) => !x));
  if (vacio) {
    if (!nuevaEn.has(`${CENTRO},${CENTRO}`)) throw new ErrorJuego('La primera palabra tiene que pasar por el centro');
    if (nuevas.length < 2) throw new ErrorJuego('La primera palabra tiene que tener al menos 2 letras');
  }
  // Dirección principal (con una sola ficha, la que forme palabra).
  let [df, dc] = horizontal ? [0, 1] : [1, 0];
  if (nuevas.length === 1) {
    const { f, c } = nuevas[0];
    if (!celda(f, c - 1) && !celda(f, c + 1)) [df, dc] = [1, 0];
  }
  const principal = leerPalabra(celda, nuevas[0].f, nuevas[0].c, df, dc);
  // Todas las nuevas tienen que estar en la palabra principal (sin huecos).
  const enPrincipal = new Set(principal.map(([f, c]) => `${f},${c}`));
  if (!nuevas.every((n) => enPrincipal.has(`${n.f},${n.c}`))) throw new ErrorJuego('Las fichas tienen que quedar pegadas, sin huecos');
  const palabras = [];
  if (principal.length >= 2) palabras.push(principal);
  for (const n of nuevas) {
    const cruzada = leerPalabra(celda, n.f, n.c, dc, df);
    if (cruzada.length >= 2) palabras.push(cruzada);
  }
  if (!palabras.length) throw new ErrorJuego('Tenés que formar una palabra de al menos 2 letras');
  if (!vacio && palabras.every((p) => p.every(([f, c]) => nuevaEn.has(`${f},${c}`)))) throw new ErrorJuego('La palabra tiene que tocar alguna que ya esté en el tablero');
  const resultado = palabras.map((casillas) => {
    let suma = 0;
    let por = 1;
    for (const [f, c] of casillas) {
      const x = celda(f, c);
      const esNueva = nuevaEn.has(`${f},${c}`);
      const premio = esNueva ? PREMIOS[f][c] : null;
      suma += x.v * (premio === 'L3' ? 3 : premio === 'L2' ? 2 : 1);
      if (premio === 'P3') por *= 3;
      if (premio === 'P2') por *= 2;
    }
    return { texto: casillas.map(([f, c]) => celda(f, c).l).join(''), puntos: suma * por, casillas };
  });
  const bingo = nuevas.length === 7 ? 50 : 0;
  return { palabras: resultado, bingo, total: resultado.reduce((t, p) => t + p.puntos, 0) + bingo };
}

const sumaAtril = (atril) => atril.reduce((t, x) => t + x.v, 0);

export class PartidaPalabrasCruzadas extends PartidaGrupal {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    super('palabras-cruzadas', jugadores, config);
    this.rand = rand;
    let n = 0;
    this.bolsa = mezclar(FICHAS.flatMap(([l, cant, v]) => Array.from({ length: cant }, () => ({ id: ++n, l, v }))), rand);
    this.tablero = Array.from({ length: LADO }, () => Array(LADO).fill(null));
    this.atriles = Object.fromEntries(jugadores.map((j) => [j, this.bolsa.splice(0, 7)]));
    this.turno = jugadores[Math.floor(rand() * jugadores.length)];
    this.sinPuntos = 0; // turnos seguidos sin sumar (pasar, cambiar o jugada anulada)
    this.pendiente = null;
    this.ultima = null;
    this.log = [];
    this.irA('turno', config.segundosTurno ? config.segundosTurno * 1000 : null);
  }

  #anotar(texto) {
    this.log = [...this.log, texto].slice(-10);
  }

  #siguienteTurno() {
    const act = this.activos;
    const i = act.indexOf(this.turno);
    this.turno = act[(i + 1) % act.length] ?? act[0];
    if (this.sinPuntos >= 2 * act.length) return this.#fin(null);
    this.irA('turno', this.config.segundosTurno ? this.config.segundosTurno * 1000 : null);
  }

  // Fin: el que se quedó sin fichas suma lo que les quedó a los demás; cada uno resta lo suyo.
  #fin(cerro) {
    for (const j of this.activos) {
      const resto = sumaAtril(this.atriles[j]);
      this.puntos[j] -= resto;
      if (cerro && j !== cerro) this.puntos[cerro] += resto;
    }
    this.#anotar(cerro ? `@${cerro}@ se quedó sin fichas` : 'Nadie puede seguir: fin de la partida');
    this.terminar();
  }

  #tomar(j) {
    const atril = this.atriles[j];
    while (atril.length < 7 && this.bolsa.length) atril.push(this.bolsa.shift());
  }

  accion(j, tipo, datos = {}) {
    this.validar(j);
    if (tipo === 'aceptar' || tipo === 'rechazar') return this.#votar(j, tipo);
    if (this.fase !== 'turno') throw new ErrorJuego('Esperá que se revise la jugada');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    if (tipo === 'pasar') {
      this.sinPuntos++;
      this.#anotar(`@${j}@ pasó`);
      return this.#siguienteTurno();
    }
    if (tipo === 'cambiar') {
      const ids = Array.isArray(datos.ids) ? datos.ids.map(Number) : [];
      if (!ids.length) throw new ErrorJuego('Elegí qué fichas cambiar');
      if (ids.length > this.bolsa.length) throw new ErrorJuego(`En la bolsa quedan ${this.bolsa.length} fichas`);
      const atril = this.atriles[j];
      if (!ids.every((id) => atril.some((x) => x.id === id))) throw new ErrorJuego('Esas fichas no son tuyas');
      const devueltas = atril.filter((x) => ids.includes(x.id));
      this.atriles[j] = atril.filter((x) => !ids.includes(x.id));
      this.#tomar(j);
      this.bolsa = mezclar([...this.bolsa, ...devueltas], this.rand ?? Math.random);
      this.sinPuntos++;
      this.#anotar(`@${j}@ cambió ${ids.length} ficha${ids.length === 1 ? '' : 's'}`);
      return this.#siguienteTurno();
    }
    if (tipo !== 'jugar') throw new ErrorJuego('Acción desconocida');
    const atril = this.atriles[j];
    const lista = Array.isArray(datos.fichas) ? datos.fichas : [];
    if (lista.length > 7) throw new ErrorJuego('Como mucho 7 fichas');
    const usadas = new Set();
    const nuevas = lista.map((x) => {
      const ficha = atril.find((a) => a.id === Number(x.id));
      if (!ficha || usadas.has(ficha.id)) throw new ErrorJuego('Esa ficha no es tuya');
      usadas.add(ficha.id);
      let l = ficha.l;
      if (!l) {
        l = String(x.l ?? '').toUpperCase();
        if (!LETRAS.includes(l)) throw new ErrorJuego('Elegí qué letra es el comodín');
      }
      return { f: Number(x.f), c: Number(x.c), l, v: ficha.v, id: ficha.id, comodin: !ficha.l };
    });
    const ev = evaluarJugada(this.tablero, nuevas);
    for (const n of nuevas) this.tablero[n.f][n.c] = { l: n.l, v: n.v, comodin: n.comodin, de: j, pend: true };
    this.atriles[j] = atril.filter((a) => !usadas.has(a.id));
    this.pendiente = { j, nuevas, palabras: ev.palabras.map(({ texto, puntos }) => ({ texto, puntos })), bingo: ev.bingo, total: ev.total, votos: {} };
    if (this.config.revision === 'si' && this.activos.length > 1) return this.irA('revision', this.config.segundosRevision * 1000);
    this.#confirmar();
  }

  #votar(j, tipo) {
    if (this.fase !== 'revision' || !this.pendiente) throw new ErrorJuego('No hay ninguna jugada para revisar');
    if (this.pendiente.j === j) throw new ErrorJuego('Tu propia jugada no la votás');
    if (tipo === 'rechazar') return this.#anular(j);
    this.pendiente.votos[j] = 'si';
    if (this.activos.every((x) => x === this.pendiente.j || this.pendiente.votos[x] === 'si')) this.#confirmar();
  }

  #confirmar() {
    const p = this.pendiente;
    for (const n of p.nuevas) delete this.tablero[n.f][n.c].pend;
    this.puntos[p.j] += p.total;
    this.ultima = { j: p.j, palabras: p.palabras, total: p.total, bingo: p.bingo, casillas: p.nuevas.map((n) => [n.f, n.c]) };
    this.#anotar(`@${p.j}@: ${p.palabras.map((x) => x.texto).join(', ')} (+${p.total})`);
    this.pendiente = null;
    this.sinPuntos = 0;
    this.#tomar(p.j);
    if (!this.atriles[p.j].length && !this.bolsa.length) return this.#fin(p.j);
    this.#siguienteTurno();
  }

  // "¡No vale!": las fichas vuelven al atril y pierde el turno.
  #anular(quien) {
    const p = this.pendiente;
    for (const n of p.nuevas) this.tablero[n.f][n.c] = null;
    this.atriles[p.j].push(...p.nuevas.map((n) => ({ id: n.id, l: n.comodin ? '' : n.l, v: n.v })));
    this.#anotar(`@${quien}@ dijo que no vale: ${p.palabras.map((x) => x.texto).join(', ')}`);
    this.pendiente = null;
    this.sinPuntos++;
    this.#siguienteTurno();
  }

  alVencer() {
    if (this.fase === 'revision') return this.#confirmar();
    if (this.fase === 'turno') {
      this.sinPuntos++;
      this.#anotar(`A @${this.turno}@ se le terminó el tiempo`);
      this.#siguienteTurno();
    }
  }

  alAbandonar(j) {
    this.bolsa.push(...this.atriles[j]);
    this.atriles[j] = [];
    if (this.pendiente?.j === j) {
      for (const n of this.pendiente.nuevas) this.tablero[n.f][n.c] = null;
      this.pendiente = null;
      this.turno = j;
      return this.#siguienteTurno();
    }
    if (this.fase === 'revision' && this.activos.every((x) => x === this.pendiente.j || this.pendiente.votos[x] === 'si')) return this.#confirmar();
    if (this.turno === j && this.fase === 'turno') this.#siguienteTurno();
  }

  vistaPara(j) {
    return {
      ...this.vistaBase(j),
      tablero: this.tablero.map((fila) => fila.map((x) => (x ? { l: x.l, v: x.v, comodin: !!x.comodin, pend: !!x.pend } : null))),
      atril: this.atriles[j],
      atriles: Object.fromEntries(this.jugadores.map((x) => [x, this.atriles[x].length])),
      bolsa: this.bolsa.length,
      turno: this.turno,
      pendiente: this.pendiente && {
        j: this.pendiente.j,
        palabras: this.pendiente.palabras.map((p) => ({ ...p, conocida: LEXICO.has(p.texto) })),
        bingo: this.pendiente.bingo,
        total: this.pendiente.total,
        votos: this.pendiente.votos,
      },
      ultima: this.ultima,
      log: this.log,
    };
  }
}
