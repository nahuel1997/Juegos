// Ajedrez 1vs1 con todas las reglas: enroque, captura al paso, coronación, jaque mate, ahogado,
// tablas por material insuficiente, por 50 movidas y por acuerdo. Reloj opcional (minutos + incremento).
// Tablero: fila 0 = la octava (negras arriba), fila 7 = la primera. Piezas: 'bP' (blanca), 'nK' (negra)…
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { minutos: 0, incremento: 0 };

export function validarConfig(c = {}) {
  const minutos = Number(c.minutos ?? CONFIG_DEFECTO.minutos);
  if (![0, 1, 3, 5, 10, 15, 30].includes(minutos)) throw new ErrorJuego('Minutos inválidos');
  return { minutos, incremento: entero(c.incremento ?? CONFIG_DEFECTO.incremento, 0, 30, 'El incremento') };
}

const FILA_INICIAL = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
const VALOR = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
const dentro = (f, c) => f >= 0 && f < 8 && c >= 0 && c < 8;
const otro = (color) => (color === 'b' ? 'n' : 'b');
const COLUMNAS = 'abcdefgh';
export const casilla = (f, c) => `${COLUMNAS[c]}${8 - f}`;

export function tableroInicial() {
  const t = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    t[0][c] = `n${FILA_INICIAL[c]}`;
    t[1][c] = 'nP';
    t[6][c] = 'bP';
    t[7][c] = `b${FILA_INICIAL[c]}`;
  }
  return t;
}

// ¿La casilla (f, c) está atacada por alguna pieza del color dado?
export function atacada(t, f, c, por) {
  const adelante = por === 'b' ? 1 : -1; // los peones blancos atacan hacia arriba (fila menor)
  for (const dc of [-1, 1]) {
    const pf = f + adelante; const pc = c + dc;
    if (dentro(pf, pc) && t[pf][pc] === `${por}P`) return true;
  }
  for (const [df, dc] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) {
    if (dentro(f + df, c + dc) && t[f + df][c + dc] === `${por}N`) return true;
  }
  for (let df = -1; df <= 1; df++) for (let dc = -1; dc <= 1; dc++) {
    if ((df || dc) && dentro(f + df, c + dc) && t[f + df][c + dc] === `${por}K`) return true;
  }
  const rayos = [[[0, 1], [0, -1], [1, 0], [-1, 0]], [[1, 1], [1, -1], [-1, 1], [-1, -1]]];
  for (const [i, dirs] of rayos.entries()) {
    const tipos = i === 0 ? ['R', 'Q'] : ['B', 'Q'];
    for (const [df, dc] of dirs) {
      for (let k = 1; k < 8; k++) {
        const ff = f + df * k; const cc = c + dc * k;
        if (!dentro(ff, cc)) break;
        const p = t[ff][cc];
        if (!p) continue;
        if (p[0] === por && tipos.includes(p[1])) return true;
        break;
      }
    }
  }
  return false;
}

const reyDe = (t, color) => {
  for (let f = 0; f < 8; f++) for (let c = 0; c < 8; c++) if (t[f][c] === `${color}K`) return [f, c];
  return null;
};

export const enJaque = (t, color) => {
  const r = reyDe(t, color);
  return !!r && atacada(t, r[0], r[1], otro(color));
};

// Movidas legales del color: [{ de: [f, c], a: [f, c], promo?, enroque?, alPaso? }].
export function movidasLegales(est, color) {
  const { tablero: t, enroques, alPaso } = est;
  const res = [];
  const pseudo = [];
  for (let f = 0; f < 8; f++) for (let c = 0; c < 8; c++) {
    const p = t[f][c];
    if (!p || p[0] !== color) continue;
    const tipo = p[1];
    const add = (a, extra = {}) => pseudo.push({ de: [f, c], a, ...extra });
    if (tipo === 'P') {
      const dir = color === 'b' ? -1 : 1;
      const inicio = color === 'b' ? 6 : 1;
      const ultima = color === 'b' ? 0 : 7;
      const avanzar = (a, extra) => (a[0] === ultima ? ['Q', 'R', 'B', 'N'].forEach((promo) => add(a, { ...extra, promo })) : add(a, extra));
      if (dentro(f + dir, c) && !t[f + dir][c]) {
        avanzar([f + dir, c]);
        if (f === inicio && !t[f + 2 * dir][c]) add([f + 2 * dir, c], { doble: true });
      }
      for (const dc of [-1, 1]) {
        const a = [f + dir, c + dc];
        if (!dentro(...a)) continue;
        const obj = t[a[0]][a[1]];
        if (obj && obj[0] !== color) avanzar(a);
        else if (alPaso && alPaso[0] === a[0] && alPaso[1] === a[1]) add(a, { alPaso: true });
      }
    } else if (tipo === 'N' || tipo === 'K') {
      const saltos = tipo === 'N'
        ? [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]
        : [[1, 1], [1, 0], [1, -1], [0, 1], [0, -1], [-1, 1], [-1, 0], [-1, -1]];
      for (const [df, dc] of saltos) {
        const a = [f + df, c + dc];
        if (dentro(...a) && (!t[a[0]][a[1]] || t[a[0]][a[1]][0] !== color)) add(a);
      }
      if (tipo === 'K') {
        const fila = color === 'b' ? 7 : 0;
        const rival = otro(color);
        if (f === fila && c === 4 && !atacada(t, f, 4, rival)) {
          if (enroques[`${color}K`] && t[fila][7] === `${color}R` && !t[fila][5] && !t[fila][6] && !atacada(t, fila, 5, rival) && !atacada(t, fila, 6, rival)) add([fila, 6], { enroque: 'corto' });
          if (enroques[`${color}Q`] && t[fila][0] === `${color}R` && !t[fila][1] && !t[fila][2] && !t[fila][3] && !atacada(t, fila, 3, rival) && !atacada(t, fila, 2, rival)) add([fila, 2], { enroque: 'largo' });
        }
      }
    } else {
      const dirs = tipo === 'R' ? [[0, 1], [0, -1], [1, 0], [-1, 0]]
        : tipo === 'B' ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
          : [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (const [df, dc] of dirs) {
        for (let k = 1; k < 8; k++) {
          const a = [f + df * k, c + dc * k];
          if (!dentro(...a)) break;
          const obj = t[a[0]][a[1]];
          if (obj && obj[0] === color) break;
          add(a);
          if (obj) break;
        }
      }
    }
  }
  for (const m of pseudo) if (!enJaque(aplicar(t, m), color)) res.push(m);
  return res;
}

// Tablero después de la movida (copia).
export function aplicar(t, m) {
  const n = t.map((fila) => [...fila]);
  const p = n[m.de[0]][m.de[1]];
  n[m.de[0]][m.de[1]] = null;
  if (m.alPaso) n[m.de[0]][m.a[1]] = null;
  n[m.a[0]][m.a[1]] = m.promo ? `${p[0]}${m.promo}` : p;
  if (m.enroque) {
    const fila = m.a[0];
    if (m.enroque === 'corto') { n[fila][5] = n[fila][7]; n[fila][7] = null; } else { n[fila][3] = n[fila][0]; n[fila][0] = null; }
  }
  return n;
}

function materialInsuficiente(t) {
  const piezas = t.flat().filter(Boolean).filter((p) => p[1] !== 'K');
  if (!piezas.length) return true;
  return piezas.length === 1 && ['B', 'N'].includes(piezas[0][1]);
}

export class PartidaAjedrez {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'ajedrez';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    const blancas = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.color = { [blancas]: 'b', [blancas === jugadores[0] ? jugadores[1] : jugadores[0]]: 'n' };
    this.tablero = tableroInicial();
    this.mueve = 'b';
    this.enroques = { bK: true, bQ: true, nK: true, nQ: true };
    this.alPaso = null;
    this.movidas50 = 0;
    this.jugadas = [];
    this.capturadas = { b: [], n: [] }; // piezas que perdió cada color
    this.ultima = null;
    this.ofertaTablas = null;
    this.tiempo = config.minutos ? Object.fromEntries(jugadores.map((j) => [j, config.minutos * 60000])) : null;
    this.desde = Date.now();
    this.timer = null;
    this.notificar = null;
    this.#programar();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  get turno() {
    return this.jugadores.find((j) => this.color[j] === this.mueve);
  }

  legales() {
    return movidasLegales({ tablero: this.tablero, enroques: this.enroques, alPaso: this.alPaso }, this.mueve);
  }

  accion(j, tipo, datos = {}) {
    const r = this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo === 'ofrecerTablas') { this.ofertaTablas = j; return; }
    if (tipo === 'responderTablas') {
      if (this.ofertaTablas !== r) throw new ErrorJuego('No hay oferta de tablas');
      this.ofertaTablas = null;
      if (datos.acepta) this.#fin(null, 'tablas');
      return;
    }
    if (tipo !== 'mover') throw new ErrorJuego('Acción desconocida');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    this.#descontar();
    if (this.estado !== 'jugando') return;
    const de = [entero(datos.de?.[0], 0, 7, 'La fila'), entero(datos.de?.[1], 0, 7, 'La columna')];
    const a = [entero(datos.a?.[0], 0, 7, 'La fila'), entero(datos.a?.[1], 0, 7, 'La columna')];
    const promo = ['Q', 'R', 'B', 'N'].includes(datos.promo) ? datos.promo : 'Q';
    const m = this.legales().find((x) => x.de[0] === de[0] && x.de[1] === de[1] && x.a[0] === a[0] && x.a[1] === a[1] && (!x.promo || x.promo === promo));
    if (!m) throw new ErrorJuego('Esa movida no vale');

    const pieza = this.tablero[de[0]][de[1]];
    const comida = m.alPaso ? this.tablero[de[0]][a[1]] : this.tablero[a[0]][a[1]];
    if (comida) this.capturadas[comida[0]].push(comida[1]);
    this.tablero = aplicar(this.tablero, m);
    // Derechos de enroque.
    if (pieza[1] === 'K') { this.enroques[`${pieza[0]}K`] = false; this.enroques[`${pieza[0]}Q`] = false; }
    for (const [f, c, k] of [[7, 0, 'bQ'], [7, 7, 'bK'], [0, 0, 'nQ'], [0, 7, 'nK']]) {
      if ((de[0] === f && de[1] === c) || (a[0] === f && a[1] === c)) this.enroques[k] = false;
    }
    this.alPaso = m.doble ? [(de[0] + a[0]) / 2, de[1]] : null;
    this.movidas50 = pieza[1] === 'P' || comida ? 0 : this.movidas50 + 1;
    this.mueve = otro(this.mueve);
    if (this.ofertaTablas === r) this.ofertaTablas = null; // mover es rechazar
    const jaque = enJaque(this.tablero, this.mueve);
    const quedan = this.legales().length;
    const texto = m.enroque ? (m.enroque === 'corto' ? 'O-O' : 'O-O-O')
      : `${pieza[1] === 'P' ? '' : pieza[1]}${casilla(...de)}${comida ? 'x' : '-'}${casilla(...a)}${m.promo ? `=${m.promo}` : ''}`;
    this.jugadas.push(`${texto}${jaque ? (quedan ? '+' : '#') : ''}`);
    this.ultima = { de, a, comio: !!comida, jaque, enroque: m.enroque || null };
    if (this.tiempo) this.tiempo[j] += this.config.incremento * 1000;
    this.desde = Date.now();
    if (!quedan) return this.#fin(jaque ? j : null, jaque ? 'mate' : 'ahogado');
    if (materialInsuficiente(this.tablero)) return this.#fin(null, 'material');
    if (this.movidas50 >= 100) return this.#fin(null, '50 movidas');
    this.#programar();
  }

  // Reloj: descuenta lo que pensó el que mueve.
  #descontar() {
    if (!this.tiempo) return;
    const j = this.turno;
    this.tiempo[j] -= Date.now() - this.desde;
    this.desde = Date.now();
    if (this.tiempo[j] <= 0) {
      this.tiempo[j] = 0;
      this.#fin(this.rival(j), 'tiempo');
    }
  }

  #programar() {
    clearTimeout(this.timer);
    if (!this.tiempo || this.estado !== 'jugando') return;
    const j = this.turno;
    this.timer = setTimeout(() => {
      if (this.estado !== 'jugando' || this.turno !== j) return;
      this.#descontar();
      if (this.estado === 'jugando') this.#programar();
      this.notificar?.();
    }, Math.max(50, this.tiempo[j] - (Date.now() - this.desde) + 30));
    this.timer.unref?.();
  }

  // Después de restaurar: el tiempo que estuvo apagado el server no se le cobra a nadie.
  reanudar() {
    this.desde = Date.now();
    this.#programar();
  }

  #fin(ganador, motivo) {
    clearTimeout(this.timer);
    this.estado = 'terminada';
    this.ganador = ganador;
    this.motivoFin = motivo;
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.#fin(rival, 'abandono');
  }

  detalleHistorial() {
    return { jugadas: this.jugadas.length, motivo: this.motivoFin };
  }

  vistaPara(j) {
    const r = this.rival(j);
    const miTurno = this.estado === 'jugando' && this.turno === j;
    const restante = (x) => (this.tiempo ? Math.max(0, this.tiempo[x] - (this.estado === 'jugando' && this.turno === x ? Date.now() - this.desde : 0)) : null);
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      tablero: this.tablero,
      miColor: this.color[j],
      turno: this.estado === 'jugando' ? (this.turno === j ? 'yo' : 'rival') : null,
      legales: miTurno ? this.legales().map((m) => ({ de: m.de, a: m.a, promo: m.promo || null })) : [],
      jaque: this.estado === 'jugando' && enJaque(this.tablero, this.mueve),
      ultima: this.ultima,
      jugadas: this.jugadas,
      capturadas: { yo: this.capturadas[this.color[j]], rival: this.capturadas[this.color[r]] },
      material: ['b', 'n'].map((col) => this.tablero.flat().filter((p) => p && p[0] === col).reduce((t, p) => t + VALOR[p[1]], 0)),
      ofertaTablas: this.ofertaTablas ? (this.ofertaTablas === j ? 'yo' : 'rival') : null,
      reloj: this.tiempo && { yo: restante(j), rival: restante(r), corre: this.estado === 'jugando' ? (this.turno === j ? 'yo' : 'rival') : null },
    };
  }
}
