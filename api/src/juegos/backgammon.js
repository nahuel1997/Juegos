// Backgammon 1vs1 (sin cubo de doblar). Cada uno tiene 15 fichas y las lleva hasta su casa para
// sacarlas. Se tiran dos dados (dobles = cuatro movidas). Una ficha sola (blot) se puede comer y va a
// la barra: hay que volver a entrarla antes de mover otra. Hay que usar todos los dados que se pueda
// (y si solo entra uno, el más alto). Gana la mano el que saca todas: 1 punto, gammon 2, backgammon 3.
// Se juega a N puntos.
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { puntos: 3 };

export function validarConfig(c = {}) {
  const puntos = entero(c.puntos ?? CONFIG_DEFECTO.puntos, 1, 11, 'Los puntos');
  return { puntos };
}

// El tablero se guarda con signo: positivo = fichas del primer jugador (que va de la 24 a la 1),
// negativo = del segundo (que va de la 1 a la 24). Índices 1..24.
export function tableroInicial() {
  const t = Array(26).fill(0);
  t[24] = 2; t[13] = 5; t[8] = 3; t[6] = 5;
  t[1] = -2; t[12] = -5; t[17] = -3; t[19] = -5;
  return t;
}

// Estado mínimo para calcular jugadas: { t, bar: [n0, n1], fuera: [n0, n1] }; quien = 0 | 1.
const signo = (q) => (q === 0 ? 1 : -1);
const enCasa = (q, p) => (q === 0 ? p >= 1 && p <= 6 : p >= 19 && p <= 24);

function todasEnCasa(s, q) {
  if (s.bar[q]) return false;
  for (let p = 1; p <= 24; p++) if (s.t[p] * signo(q) > 0 && !enCasa(q, p)) return false;
  return true;
}

export function movidasConDado(s, q, d) {
  const sg = signo(q);
  const libre = (p) => s.t[p] * sg >= -1;
  if (s.bar[q]) {
    const e = q === 0 ? 25 - d : d;
    return libre(e) ? [{ desde: 'bar', hasta: e, dado: d }] : [];
  }
  const res = [];
  const casa = todasEnCasa(s, q);
  for (let p = 1; p <= 24; p++) {
    if (s.t[p] * sg <= 0) continue;
    const dest = q === 0 ? p - d : p + d;
    if (dest >= 1 && dest <= 24) {
      if (libre(dest)) res.push({ desde: p, hasta: dest, dado: d });
    } else if (casa) {
      const exacto = dest === 0 || dest === 25;
      // Con un dado más alto solo se saca la ficha más lejana.
      let masLejos = false;
      if (q === 0) for (let x = p + 1; x <= 6; x++) masLejos ||= s.t[x] > 0;
      else for (let x = 19; x < p; x++) masLejos ||= s.t[x] < 0;
      if (exacto || !masLejos) res.push({ desde: p, hasta: 'fuera', dado: d });
    }
  }
  return res;
}

export function aplicar(s, q, m) {
  const sg = signo(q);
  const n = { t: [...s.t], bar: [...s.bar], fuera: [...s.fuera] };
  if (m.desde === 'bar') n.bar[q]--;
  else n.t[m.desde] -= sg;
  if (m.hasta === 'fuera') n.fuera[q]++;
  else {
    let comio = false;
    if (n.t[m.hasta] * sg === -1) { n.t[m.hasta] = 0; n.bar[1 - q]++; comio = true; }
    n.t[m.hasta] += sg;
    n.comio = comio;
  }
  return n;
}

function sinUno(dados, d) {
  const i = dados.indexOf(d);
  return [...dados.slice(0, i), ...dados.slice(i + 1)];
}

// Cuántos dados se pueden usar como máximo desde este estado.
function maxUsables(s, q, dados) {
  if (!dados.length || s.fuera[q] === 15) return 0;
  let mejor = 0;
  for (const d of new Set(dados)) {
    for (const m of movidasConDado(s, q, d)) {
      mejor = Math.max(mejor, 1 + maxUsables(aplicar(s, q, m), q, sinUno(dados, d)));
      if (mejor === dados.length) return mejor;
    }
  }
  return mejor;
}

// Movidas legales ahora (cada una con el dado que usa), respetando "usar todos los dados posibles".
export function movidasLegales(s, q, dados) {
  const total = maxUsables(s, q, dados);
  if (!total) return [];
  let lista = [];
  for (const d of new Set(dados)) {
    for (const m of movidasConDado(s, q, d)) {
      if (1 + maxUsables(aplicar(s, q, m), q, sinUno(dados, d)) === total) lista.push(m);
    }
  }
  // Si solo se puede usar un dado de dos distintos, tiene que ser el más alto.
  if (total === 1 && dados.length === 2 && dados[0] !== dados[1]) {
    const alto = Math.max(...dados);
    if (lista.some((m) => m.dado === alto)) lista = lista.filter((m) => m.dado === alto);
  }
  return lista;
}

export class PartidaBackgammon {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'backgammon';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.empiezaPrimera = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.mano = 0;
    this.#nuevaMano();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  q(j) {
    return this.jugadores.indexOf(j);
  }

  #nuevaMano() {
    this.mano++;
    this.fase = 'jugando';
    this.s = { t: tableroInicial(), bar: [0, 0], fuera: [0, 0] };
    this.turno = this.mano % 2 === 1 ? this.empiezaPrimera : this.rival(this.empiezaPrimera);
    this.dados = []; // dados que quedan por usar
    this.tirada = null; // los dos dados que salieron
    this.ultima = null;
    this.movidasTurno = [];
    this.resumen = null;
    this.listosSiguiente = new Set();
    this.jugadas = 0;
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo === 'siguiente') {
      if (this.fase !== 'fin') throw new ErrorJuego('La mano no terminó');
      this.listosSiguiente.add(j);
      if (this.listosSiguiente.size === 2) this.#nuevaMano();
      return;
    }
    if (this.fase !== 'jugando') throw new ErrorJuego('La mano terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    const q = this.q(j);

    if (tipo === 'tirar') {
      if (this.dados.length) throw new ErrorJuego('Ya tiraste: mové');
      const rand = this.rand ?? Math.random;
      const a = 1 + Math.floor(rand() * 6);
      const b = 1 + Math.floor(rand() * 6);
      this.tirada = [a, b];
      this.dados = a === b ? [a, a, a, a] : [a, b];
      this.movidasTurno = [];
      this.ultima = { por: j, tipo: 'tiro', dados: this.tirada, n: ++this.jugadas };
      if (!movidasLegales(this.s, q, this.dados).length) {
        this.ultima.sinMovida = true;
        this.#pasar(j);
      }
      return;
    }
    if (tipo !== 'mover') throw new ErrorJuego('Acción desconocida');
    if (!this.dados.length) throw new ErrorJuego('Primero tirá los dados');
    // El segundo jugador ve el tablero dado vuelta: sus puntas se convierten (p -> 25 - p).
    const real = (p) => (q === 0 ? p : 25 - p);
    const desde = datos.desde === 'bar' ? 'bar' : real(Number(datos.desde));
    const hasta = datos.hasta === 'fuera' ? 'fuera' : real(Number(datos.hasta));
    // Si el mismo movimiento sale con más de un dado (al sacar), se usa el más chico que sirva.
    const m = movidasLegales(this.s, q, this.dados)
      .filter((x) => x.desde === desde && x.hasta === hasta)
      .sort((a, b) => a.dado - b.dado)[0];
    if (!m) throw new ErrorJuego('Ese movimiento no vale');
    this.s = aplicar(this.s, q, m);
    this.dados = sinUno(this.dados, m.dado);
    this.movidasTurno.push({ desde, hasta, comio: !!this.s.comio });
    this.ultima = { por: j, tipo: 'movio', desde, hasta, comio: !!this.s.comio, n: ++this.jugadas };
    delete this.s.comio;

    if (this.s.fuera[q] === 15) return this.#finMano(j);
    if (!this.dados.length || !movidasLegales(this.s, q, this.dados).length) this.#pasar(j);
  }

  #pasar(j) {
    this.dados = [];
    this.turno = this.rival(j);
  }

  #finMano(j) {
    const r = this.q(this.rival(j));
    let valor = 1;
    if (this.s.fuera[r] === 0) {
      valor = 2;
      // Backgammon: el rival todavía tiene fichas en la barra o en la casa del que ganó.
      const enCasaGanador = (p) => (r === 1 ? p >= 1 && p <= 6 : p >= 19 && p <= 24);
      let atrasada = this.s.bar[r] > 0;
      for (let p = 1; p <= 24; p++) if (this.s.t[p] * signo(r) > 0 && enCasaGanador(p)) atrasada = true;
      if (atrasada) valor = 3;
    }
    this.puntos[j] += valor;
    this.resumen = { ganador: j, valor };
    this.fase = 'fin';
    this.turno = null;
    this.dados = [];
    if (this.puntos[j] >= this.config.puntos) {
      this.estado = 'terminada';
      this.ganador = j;
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
    return { puntos: this.puntos, manos: this.mano };
  }

  // Cada uno lo ve como si fuera el primero: sus fichas positivas, y él va de la 24 a la 1.
  vistaPara(j) {
    const rival = this.rival(j);
    const q = this.q(j);
    const conv = (p) => (q === 0 || p === 'bar' || p === 'fuera' ? p : 25 - p);
    const t = Array(26).fill(0);
    for (let p = 1; p <= 24; p++) t[conv(p)] = this.s.t[p] * signo(q);
    const quien = (x) => (x == null ? null : x === j ? 'yo' : 'rival');
    const miTurno = this.turno === j && this.dados.length;
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      mano: this.mano,
      fase: this.fase,
      turno: this.turno,
      tablero: t,
      bar: { yo: this.s.bar[q], rival: this.s.bar[1 - q] },
      fuera: { yo: this.s.fuera[q], rival: this.s.fuera[1 - q] },
      tirada: this.tirada,
      dados: this.dados,
      legales: miTurno ? movidasLegales(this.s, q, this.dados).map((m) => ({ ...m, desde: conv(m.desde), hasta: conv(m.hasta) })) : [],
      movidasTurno: this.movidasTurno.map((m) => ({ ...m, desde: conv(m.desde), hasta: conv(m.hasta) })),
      ultima: this.ultima && { ...this.ultima, por: quien(this.ultima.por), desde: conv(this.ultima.desde), hasta: conv(this.ultima.hasta) },
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      resumen: this.resumen && { ganador: quien(this.resumen.ganador), valor: this.resumen.valor },
      listosSiguiente: [...this.listosSiguiente].map(quien),
    };
  }
}
