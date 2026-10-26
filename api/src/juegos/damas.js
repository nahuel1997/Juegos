// Damas 1vs1 (reglas españolas/argentinas configurables): peones en diagonal hacia adelante, se corona
// al llegar al fondo, se come saltando y se encadenan capturas con la misma pieza.
// El server calcula las jugadas válidas y se las manda al cliente (así el front no repite reglas).
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { tamano: 8, comerObligatorio: true, damaVuela: true, peonComeAtras: false };
const LIMITE_SIN_AVANCE = 50; // jugadas seguidas de damas sin comer ni mover peones = empate

export function validarConfig(c = {}) {
  const tamano = entero(c.tamano ?? CONFIG_DEFECTO.tamano, 8, 10, 'El tamaño');
  if (tamano !== 8 && tamano !== 10) throw new ErrorJuego('El tablero es de 8x8 o 10x10');
  return {
    tamano,
    comerObligatorio: c.comerObligatorio !== false,
    damaVuela: c.damaVuela !== false,
    peonComeAtras: c.peonComeAtras === true,
  };
}

const DIAGONALES = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

export class PartidaDamas {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'damas';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    // Quien empieza juega desde abajo (como las blancas).
    this.abajo = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.turno = this.abajo;
    const n = config.tamano;
    const filasPiezas = n === 8 ? 3 : 4;
    this.tablero = Array.from({ length: n }, (_, f) =>
      Array.from({ length: n }, (_, c) => {
        if ((f + c) % 2 === 0) return null; // solo casillas oscuras
        if (f < filasPiezas) return { j: this.rival(this.abajo), dama: false };
        if (f >= n - filasPiezas) return { j: this.abajo, dama: false };
        return null;
      }),
    );
    this.cadena = null; // [f, c] de la pieza que tiene que seguir comiendo
    this.ultima = null;
    this.sinAvance = 0;
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #adelante(j) {
    return j === this.abajo ? -1 : 1;
  }

  #dentro(f, c) {
    return f >= 0 && c >= 0 && f < this.config.tamano && c < this.config.tamano;
  }

  #capturasDesde(f, c) {
    const p = this.tablero[f][c];
    const out = [];
    for (const [df, dc] of DIAGONALES) {
      if (!p.dama && !this.config.peonComeAtras && df !== this.#adelante(p.j)) continue;
      if (p.dama && this.config.damaVuela) {
        // Dama voladora: avanza por casillas vacías hasta la primera pieza; si es del rival,
        // puede caer en cualquier casilla vacía detrás.
        let ff = f + df;
        let cc = c + dc;
        while (this.#dentro(ff, cc) && !this.tablero[ff][cc]) { ff += df; cc += dc; }
        if (!this.#dentro(ff, cc) || this.tablero[ff][cc].j === p.j) continue;
        const come = [ff, cc];
        ff += df; cc += dc;
        while (this.#dentro(ff, cc) && !this.tablero[ff][cc]) {
          out.push({ de: [f, c], a: [ff, cc], come });
          ff += df; cc += dc;
        }
      } else {
        const [mf, mc, af, ac] = [f + df, c + dc, f + 2 * df, c + 2 * dc];
        if (this.#dentro(af, ac) && this.tablero[mf][mc] && this.tablero[mf][mc].j !== p.j && !this.tablero[af][ac]) {
          out.push({ de: [f, c], a: [af, ac], come: [mf, mc] });
        }
      }
    }
    return out;
  }

  #simplesDesde(f, c) {
    const p = this.tablero[f][c];
    const out = [];
    for (const [df, dc] of DIAGONALES) {
      if (!p.dama && df !== this.#adelante(p.j)) continue;
      let ff = f + df;
      let cc = c + dc;
      while (this.#dentro(ff, cc) && !this.tablero[ff][cc]) {
        out.push({ de: [f, c], a: [ff, cc], come: null });
        if (!(p.dama && this.config.damaVuela)) break;
        ff += df; cc += dc;
      }
    }
    return out;
  }

  movidasDe(j) {
    if (this.estado !== 'jugando' || this.turno !== j) return [];
    if (this.cadena) return this.#capturasDesde(...this.cadena);
    const capturas = [];
    const simples = [];
    this.tablero.forEach((fila, f) => fila.forEach((p, c) => {
      if (p?.j !== j) return;
      capturas.push(...this.#capturasDesde(f, c));
      simples.push(...this.#simplesDesde(f, c));
    }));
    return this.config.comerObligatorio && capturas.length ? capturas : [...capturas, ...simples];
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (tipo !== 'mover') throw new ErrorJuego('Acción desconocida');
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    const igual = (x, y) => Array.isArray(y) && x[0] === y[0] && x[1] === y[1];
    const movida = this.movidasDe(j).find((m) => igual(m.de, datos.de) && igual(m.a, datos.a));
    if (!movida) {
      const hayCaptura = this.config.comerObligatorio && this.movidasDe(j).some((m) => m.come);
      throw new ErrorJuego(this.cadena ? 'Tenés que seguir comiendo con la misma pieza' : hayCaptura ? 'Es obligatorio comer' : 'Movimiento inválido');
    }

    const [f, c] = movida.de;
    const [af, ac] = movida.a;
    const pieza = this.tablero[f][c];
    this.tablero[f][c] = null;
    this.tablero[af][ac] = pieza;
    if (movida.come) this.tablero[movida.come[0]][movida.come[1]] = null;
    const fondo = j === this.abajo ? 0 : this.config.tamano - 1;
    const corona = !pieza.dama && af === fondo;
    if (corona) pieza.dama = true;
    this.ultima = { por: j, de: movida.de, a: movida.a, come: movida.come, corona };
    this.sinAvance = movida.come || !pieza.dama || corona ? 0 : this.sinAvance + 1;

    // Si comió (y no se acaba de coronar) y puede seguir comiendo, sigue la misma pieza.
    if (movida.come && !corona && this.#capturasDesde(af, ac).length) {
      this.cadena = [af, ac];
      return;
    }
    this.cadena = null;
    const rival = this.rival(j);
    this.turno = rival;
    if (!this.movidasDe(rival).length) {
      this.estado = 'terminada';
      this.ganador = j;
      this.motivoFin = this.tablero.some((fila) => fila.some((p) => p?.j === rival)) ? 'bloqueo' : 'sin-piezas';
    } else if (this.sinAvance >= LIMITE_SIN_AVANCE) {
      this.estado = 'terminada';
      this.ganador = null;
      this.motivoFin = 'tablas';
    }
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  #cuenta(j) {
    return this.tablero.flat().filter((p) => p?.j === j).length;
  }

  detalleHistorial() {
    return { piezas: Object.fromEntries(this.jugadores.map((j) => [j, this.#cuenta(j)])) };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      turno: this.turno,
      invertir: j !== this.abajo, // cada uno ve sus piezas abajo
      tablero: this.tablero.map((fila) => fila.map((p) => p && { mia: p.j === j, dama: p.dama })),
      movidas: this.movidasDe(j),
      cadena: this.cadena,
      ultima: this.ultima && { ...this.ultima, mia: this.ultima.por === j },
      piezas: { yo: this.#cuenta(j), rival: this.#cuenta(rival) },
    };
  }
}
