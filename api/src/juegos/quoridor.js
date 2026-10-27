// Quoridor 1vs1: cada uno lleva sus fichas al lado contrario del tablero. En tu turno movés una ficha
// una casilla (si hay otra ficha al lado la podés saltar) o ponés una pared de dos casillas para
// cortarle el camino al rival. Nunca se puede encerrar a nadie: siempre tiene que quedar camino.
// Variante "tapitas": tres fichas cada uno, y hay que cruzar las tres.
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { lado: 9, paredes: 10, fichas: 1 };

export function validarConfig(c = {}) {
  const config = {
    lado: entero(c.lado ?? CONFIG_DEFECTO.lado, 5, 11, 'El tamaño'),
    paredes: entero(c.paredes ?? CONFIG_DEFECTO.paredes, 0, 20, 'Las paredes'),
    fichas: entero(c.fichas ?? CONFIG_DEFECTO.fichas, 1, 3, 'Las fichas'),
  };
  if (config.lado % 2 === 0) throw new ErrorJuego('El tablero tiene que ser impar (5, 7, 9 u 11)');
  return config;
}

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// ¿Hay pared entre (f,c) y su vecina (f+df, c+dc)?
export function bloqueado(paredes, f, c, df, dc) {
  if (df === 1) return paredes.has(`h:${f}:${c}`) || paredes.has(`h:${f}:${c - 1}`);
  if (df === -1) return bloqueado(paredes, f - 1, c, 1, 0);
  if (dc === 1) return paredes.has(`v:${f}:${c}`) || paredes.has(`v:${f - 1}:${c}`);
  return bloqueado(paredes, f, c - 1, 0, 1);
}

// ¿Hay camino desde (f,c) hasta la fila meta? (sin contar fichas, como en el reglamento)
export function hayCamino(lado, paredes, [f0, c0], meta) {
  const visto = new Set([`${f0},${c0}`]);
  const cola = [[f0, c0]];
  while (cola.length) {
    const [f, c] = cola.shift();
    if (f === meta) return true;
    for (const [df, dc] of DIRS) {
      const nf = f + df;
      const nc = c + dc;
      if (nf < 0 || nc < 0 || nf >= lado || nc >= lado || bloqueado(paredes, f, c, df, dc) || visto.has(`${nf},${nc}`)) continue;
      visto.add(`${nf},${nc}`);
      cola.push([nf, nc]);
    }
  }
  return false;
}

export class PartidaQuoridor {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'quoridor';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    const { lado, fichas, paredes } = config;
    const mitad = (lado - 1) / 2;
    const cols = fichas === 1 ? [mitad] : [mitad - 2, mitad, mitad + 2];
    // El primero arranca abajo y va para arriba (fila 0); el segundo al revés.
    this.fichas = {
      [jugadores[0]]: cols.map((c) => ({ f: lado - 1, c, llego: false })),
      [jugadores[1]]: cols.map((c) => ({ f: 0, c, llego: false })),
    };
    this.meta = { [jugadores[0]]: 0, [jugadores[1]]: lado - 1 };
    this.paredes = new Set();
    this.quedan = Object.fromEntries(jugadores.map((j) => [j, paredes]));
    this.turno = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.ultima = null;
    this.jugadas = 0;
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #ocupada(f, c) {
    return this.jugadores.some((j) => this.fichas[j].some((x) => !x.llego && x.f === f && x.c === c));
  }

  // Casillas a las que puede ir una ficha: un paso, salto derecho sobre otra ficha, o diagonal si el salto está tapado.
  destinos(j, i) {
    const { lado } = this.config;
    const x = this.fichas[j][i];
    if (!x || x.llego) return [];
    const dentro = (f, c) => f >= 0 && c >= 0 && f < lado && c < lado;
    const res = [];
    for (const [df, dc] of DIRS) {
      const f = x.f + df;
      const c = x.c + dc;
      if (!dentro(f, c) || bloqueado(this.paredes, x.f, x.c, df, dc)) continue;
      if (!this.#ocupada(f, c)) { res.push([f, c]); continue; }
      const f2 = f + df;
      const c2 = c + dc;
      if (dentro(f2, c2) && !bloqueado(this.paredes, f, c, df, dc) && !this.#ocupada(f2, c2)) { res.push([f2, c2]); continue; }
      for (const [ef, ec] of df ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]]) {
        const f3 = f + ef;
        const c3 = c + ec;
        if (dentro(f3, c3) && !bloqueado(this.paredes, f, c, ef, ec) && !this.#ocupada(f3, c3)) res.push([f3, c3]);
      }
    }
    return res;
  }

  puedePared(tipo, f, c) {
    const { lado } = this.config;
    if (!['h', 'v'].includes(tipo) || f < 0 || c < 0 || f > lado - 2 || c > lado - 2) return false;
    const p = this.paredes;
    if (p.has(`${tipo}:${f}:${c}`)) return false;
    if (tipo === 'h' && (p.has(`h:${f}:${c - 1}`) || p.has(`h:${f}:${c + 1}`) || p.has(`v:${f}:${c}`))) return false;
    if (tipo === 'v' && (p.has(`v:${f - 1}:${c}`) || p.has(`v:${f + 1}:${c}`) || p.has(`h:${f}:${c}`))) return false;
    // Tiene que quedar camino para todas las fichas que no llegaron.
    const prueba = new Set(p).add(`${tipo}:${f}:${c}`);
    return this.jugadores.every((j) => this.fichas[j].every((x) => x.llego || hayCamino(lado, prueba, [x.f, x.c], this.meta[j])));
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    // El segundo jugador ve el tablero girado: sus coordenadas se dan vuelta.
    const n = this.config.lado;
    const girar = j === this.jugadores[1];
    if (tipo === 'mover') {
      const i = entero(datos.ficha ?? 0, 0, this.config.fichas - 1, 'La ficha');
      const f = girar ? n - 1 - Number(datos.fila) : Number(datos.fila);
      const c = girar ? n - 1 - Number(datos.col) : Number(datos.col);
      if (!this.destinos(j, i).some(([a, b]) => a === f && b === c)) throw new ErrorJuego('Ahí no se puede mover');
      const x = this.fichas[j][i];
      const desde = [x.f, x.c];
      x.f = f;
      x.c = c;
      if (f === this.meta[j]) x.llego = true;
      this.ultima = { por: j, tipo: 'mover', ficha: i, desde, hasta: [f, c], llego: x.llego, n: ++this.jugadas };
      if (this.fichas[j].every((y) => y.llego)) {
        this.estado = 'terminada';
        this.ganador = j;
        this.motivoFin = 'llego';
        this.turno = null;
        return;
      }
    } else if (tipo === 'pared') {
      if (this.quedan[j] <= 0) throw new ErrorJuego('No te quedan paredes');
      const f = girar ? n - 2 - Number(datos.fila) : Number(datos.fila);
      const c = girar ? n - 2 - Number(datos.col) : Number(datos.col);
      if (!this.puedePared(datos.tipo, f, c)) throw new ErrorJuego('Esa pared no se puede poner (se cruza, se sale o encierra a alguien)');
      this.paredes.add(`${datos.tipo}:${f}:${c}`);
      this.quedan[j]--;
      this.ultima = { por: j, tipo: 'pared', pared: `${datos.tipo}:${f}:${c}`, n: ++this.jugadas };
    } else {
      throw new ErrorJuego('Acción desconocida');
    }
    this.turno = this.rival(j);
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { jugadas: this.jugadas, paredes: this.paredes.size };
  }

  // Cada uno ve el tablero dado vuelta para que su lado quede siempre abajo.
  vistaPara(j) {
    const rival = this.rival(j);
    const n = this.config.lado;
    const girar = j === this.jugadores[1];
    const pos = ([f, c]) => (girar ? [n - 1 - f, n - 1 - c] : [f, c]);
    const pared = (k) => {
      const [t, f, c] = k.split(':');
      return girar ? `${t}:${n - 2 - Number(f)}:${n - 2 - Number(c)}` : k;
    };
    const fichas = (x) => this.fichas[x].map((y) => ({ ...y, ...Object.fromEntries([['f', pos([y.f, y.c])[0]], ['c', pos([y.f, y.c])[1]]]) }));
    const miTurno = this.turno === j && this.estado === 'jugando';
    // Paredes posibles (para marcar dónde se puede poner), en coordenadas de quien mira.
    const posibles = [];
    if (miTurno && this.quedan[j] > 0) {
      for (const t of ['h', 'v']) for (let f = 0; f < n - 1; f++) for (let c = 0; c < n - 1; c++) {
        if (this.puedePared(t, f, c)) posibles.push(pared(`${t}:${f}:${c}`));
      }
    }
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      turno: this.turno,
      mias: fichas(j),
      suyas: fichas(rival),
      paredes: [...this.paredes].map(pared),
      quedan: { yo: this.quedan[j], rival: this.quedan[rival] },
      destinos: miTurno ? this.fichas[j].map((_, i) => this.destinos(j, i).map(pos)) : [],
      posibles,
      ultima: this.ultima && {
        ...this.ultima,
        por: this.ultima.por === j ? 'yo' : 'rival',
        desde: this.ultima.desde && pos(this.ultima.desde),
        hasta: this.ultima.hasta && pos(this.ultima.hasta),
        pared: this.ultima.pared && pared(this.ultima.pared),
      },
    };
  }
}
