// UNO 1vs1: mazo de 108 cartas (4 colores + comodines). Se tira una carta del mismo color o del mismo
// número/símbolo, o un comodín. Salta y Reversa (de a dos funciona igual que Salta) y los +2 y +4
// hacen que vuelvas a jugar. Al quedarte con una carta tenés que decir "¡UNO!": si no, el rival te
// puede acusar y robás 2. El que se queda sin cartas se lleva los puntos de lo que tiene el otro.
import { ErrorJuego, entero } from './comun.js';

export const COLORES = ['rojo', 'amarillo', 'verde', 'azul'];
export const CONFIG_DEFECTO = { meta: 200, castigoUno: true };

export function validarConfig(c = {}) {
  return {
    meta: entero(c.meta ?? CONFIG_DEFECTO.meta, 50, 500, 'Los puntos para ganar'),
    castigoUno: c.castigoUno === undefined ? CONFIG_DEFECTO.castigoUno : !!c.castigoUno,
  };
}

const ACCIONES = ['salta', 'reversa', 'mas2'];
export const ROBA = { mas2: 2, mas4: 4 };

export function puntosDe(carta) {
  if (carta.color === 'negro') return 50;
  if (ACCIONES.includes(carta.valor)) return 20;
  return Number(carta.valor);
}

export function mazoNuevo(rand = Math.random) {
  const mazo = [];
  let n = 0;
  const poner = (color, valor) => mazo.push({ id: `c${++n}`, color, valor });
  for (const color of COLORES) {
    poner(color, '0');
    for (let i = 0; i < 2; i++) {
      for (let v = 1; v <= 9; v++) poner(color, String(v));
      for (const a of ACCIONES) poner(color, a);
    }
  }
  for (let i = 0; i < 4; i++) { poner('negro', 'comodin'); poner('negro', 'mas4'); }
  mezclar(mazo, rand);
  return mazo;
}

function mezclar(cartas, rand) {
  for (let i = cartas.length - 1; i > 0; i--) {
    const k = Math.floor(rand() * (i + 1));
    [cartas[i], cartas[k]] = [cartas[k], cartas[i]];
  }
}

// ¿Se puede tirar esta carta arriba de `tope` con el color que manda ahora?
export function sePuede(carta, tope, color) {
  return carta.color === 'negro' || carta.color === color || carta.valor === tope.valor;
}

export class PartidaUno {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'uno';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.ronda = 0;
    this.empiezaRonda = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.#nuevaRonda();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #nuevaRonda() {
    const rand = this.rand ?? Math.random;
    this.ronda++;
    if (this.ronda > 1) this.empiezaRonda = this.rival(this.empiezaRonda);
    this.fase = 'jugando';
    this.mazo = mazoNuevo(rand);
    this.mano = Object.fromEntries(this.jugadores.map((j) => [j, this.mazo.splice(0, 7)]));
    // La primera carta del pozo es siempre un número (si sale otra cosa, va al fondo del mazo).
    let i = this.mazo.findIndex((c) => c.color !== 'negro' && !ACCIONES.includes(c.valor));
    this.pozo = this.mazo.splice(i, 1);
    this.color = this.pozo[0].color;
    this.turno = this.empiezaRonda;
    this.robada = null; // id de la carta que acaba de robar quien tiene el turno (solo puede tirar esa o pasar)
    this.sinUno = null; // jugador que quedó con una carta sin decir UNO
    this.dijoUno = null; // jugador que avisó UNO antes de tirar su anteúltima carta
    this.ultima = null;
    this.resumen = null;
    this.listosSiguiente = new Set();
    this.jugadas = 0;
  }

  get tope() {
    return this.pozo[this.pozo.length - 1];
  }

  #robar(j, n) {
    const robadas = [];
    for (let i = 0; i < n; i++) {
      if (!this.mazo.length) {
        // Se mezcla el pozo (menos la de arriba) y vuelve a ser mazo.
        if (this.pozo.length <= 1) break;
        const tope = this.pozo.pop();
        this.mazo = this.pozo;
        this.pozo = [tope];
        mezclar(this.mazo, this.rand ?? Math.random);
      }
      robadas.push(this.mazo.pop());
    }
    this.mano[j].push(...robadas);
    if (this.mano[j].length > 1 && this.sinUno === j) this.sinUno = null;
    return robadas;
  }

  accion(j, tipo, datos = {}) {
    const rival = this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo === 'siguiente') {
      if (this.fase !== 'resumen') throw new ErrorJuego('La ronda no terminó');
      this.listosSiguiente.add(j);
      if (this.listosSiguiente.size === 2) this.#nuevaRonda();
      return;
    }
    if (this.fase !== 'jugando') throw new ErrorJuego('La ronda terminó');

    if (tipo === 'uno') {
      // Se puede avisar antes de tirar la anteúltima (en tu turno) o después, si nadie te acusó todavía.
      if (this.mano[j].length === 1 && this.sinUno === j) {
        this.sinUno = null;
      } else if (this.mano[j].length === 2 && this.turno === j) {
        this.dijoUno = j;
      } else {
        throw new ErrorJuego('Todavía no es momento de decir UNO');
      }
      this.ultima = { por: j, tipo: 'uno', n: ++this.jugadas };
      return;
    }
    if (tipo === 'acusar') {
      if (this.sinUno !== rival) throw new ErrorJuego('No hay a quién acusar');
      this.sinUno = null;
      this.#robar(rival, 2);
      this.ultima = { por: j, tipo: 'acuso', roba: 2, n: ++this.jugadas };
      return;
    }

    if (this.turno !== j) throw new ErrorJuego('No es tu turno');

    if (tipo === 'robar') {
      if (this.robada) throw new ErrorJuego('Ya robaste: tirá esa carta o pasá');
      const [carta] = this.#robar(j, 1);
      this.ultima = { por: j, tipo: 'robo', n: ++this.jugadas };
      // Sin cartas para robar (raro, de a dos): pasa el turno.
      if (!carta) return this.#pasarTurno(j);
      if (sePuede(carta, this.tope, this.color)) this.robada = carta.id;
      else this.#pasarTurno(j);
      return;
    }
    if (tipo === 'pasar') {
      if (!this.robada) throw new ErrorJuego('Primero tenés que robar');
      this.ultima = { por: j, tipo: 'paso', n: ++this.jugadas };
      this.#pasarTurno(j);
      return;
    }
    if (tipo !== 'jugar') throw new ErrorJuego('Acción desconocida');

    const carta = this.mano[j].find((c) => c.id === datos.carta);
    if (!carta) throw new ErrorJuego('Esa carta no está en tu mano');
    if (this.robada && carta.id !== this.robada) throw new ErrorJuego('Solo podés tirar la carta que robaste');
    if (!sePuede(carta, this.tope, this.color)) throw new ErrorJuego('Esa carta no va: tiene que coincidir el color o el número');
    let color = carta.color;
    if (carta.color === 'negro') {
      if (!COLORES.includes(datos.color)) throw new ErrorJuego('Elegí un color');
      color = datos.color;
    }

    this.mano[j] = this.mano[j].filter((c) => c !== carta);
    this.pozo.push(carta);
    this.color = color;
    this.robada = null;
    // Si alguien quedó sin decir UNO y el otro siguió jugando, se salvó.
    if (this.sinUno === rival) this.sinUno = null;
    if (this.mano[j].length === 1) {
      if (this.dijoUno !== j && this.config.castigoUno) this.sinUno = j;
    }
    this.dijoUno = null;

    const roba = ROBA[carta.valor] || 0;
    if (roba) this.#robar(rival, roba);
    this.ultima = { por: j, tipo: 'jugo', carta, color, roba, n: ++this.jugadas };

    if (!this.mano[j].length) return this.#finRonda(j);
    // Salta, Reversa, +2 y +4: el rival pierde el turno (de a dos, vuelve a jugar el mismo).
    if (carta.valor === 'salta' || carta.valor === 'reversa' || roba) return;
    this.#pasarTurno(j);
  }

  #pasarTurno(j) {
    this.robada = null;
    this.dijoUno = null;
    this.turno = this.rival(j);
  }

  #finRonda(j) {
    const rival = this.rival(j);
    const ganados = this.mano[rival].reduce((s, c) => s + puntosDe(c), 0);
    this.puntos[j] += ganados;
    this.resumen = { ganador: j, puntos: ganados, cartasRival: this.mano[rival] };
    this.fase = 'resumen';
    this.turno = null;
    this.sinUno = null;
    if (this.puntos[j] >= this.config.meta) {
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
    return { puntos: this.puntos, rondas: this.ronda };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const quien = (x) => (x === null ? null : x === j ? 'yo' : 'rival');
    const r = this.resumen;
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      ronda: this.ronda,
      fase: this.fase,
      turno: this.turno,
      miMano: this.mano[j],
      cartasRival: this.mano[rival].length,
      tope: this.tope,
      pozo: this.pozo.length,
      color: this.color,
      mazo: this.mazo.length,
      robada: this.turno === j ? this.robada : null,
      sinUno: quien(this.sinUno),
      dijoUno: this.dijoUno === j,
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      ultima: this.ultima && { ...this.ultima, por: quien(this.ultima.por) },
      resumen: r && { ganador: quien(r.ganador), puntos: r.puntos, cartas: r.ganador === j ? r.cartasRival : this.mano[j] },
      listosSiguiente: [...this.listosSiguiente].map(quien),
    };
  }
}
