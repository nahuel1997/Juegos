// Dominó 1vs1 (doble seis, 28 fichas). Se juega a los extremos de la línea; si no tenés ficha,
// robás del pozo (o pasás). La mano la gana quien se queda sin fichas o, si se tranca, quien suma
// menos puntos en la mano; el ganador se anota los puntos del rival. Se juega a N puntos.
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { fichasIniciales: 7, conPozo: true, puntosParaGanar: 50 };

export function validarConfig(c = {}) {
  return {
    fichasIniciales: entero(c.fichasIniciales ?? CONFIG_DEFECTO.fichasIniciales, 5, 10, 'Las fichas iniciales'),
    conPozo: c.conPozo !== false,
    puntosParaGanar: entero(c.puntosParaGanar ?? CONFIG_DEFECTO.puntosParaGanar, 0, 200, 'Los puntos para ganar'),
  };
}

export function fichasDomino() {
  const out = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) out.push({ id: `${a}-${b}`, a, b });
  return out;
}

const pips = (fichas) => fichas.reduce((s, f) => s + f.a + f.b, 0);

export class PartidaDomino {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'domino';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = { [jugadores[0]]: 0, [jugadores[1]]: 0 };
    this.manos = 0;
    this.sale = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.#nuevaMano();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #nuevaMano() {
    this.manos++;
    const fichas = fichasDomino();
    for (let i = fichas.length - 1; i > 0; i--) {
      const k = Math.floor(this.rand() * (i + 1));
      [fichas[i], fichas[k]] = [fichas[k], fichas[i]];
    }
    const n = this.config.fichasIniciales;
    this.mano = { [this.jugadores[0]]: fichas.slice(0, n), [this.jugadores[1]]: fichas.slice(n, 2 * n) };
    this.pozo = this.config.conPozo ? fichas.slice(2 * n) : [];
    this.mesa = []; // fichas orientadas: mesa[i].b === mesa[i + 1].a
    this.turno = this.sale;
    this.pases = 0;
    this.fase = 'jugando';
    this.resumen = null;
    this.listos = new Set();
    this.ultima = null;
  }

  extremos() {
    return this.mesa.length ? [this.mesa[0].a, this.mesa[this.mesa.length - 1].b] : null;
  }

  // Lados donde entra cada ficha de la mano ('izq', 'der').
  jugablesDe(j) {
    const ext = this.extremos();
    return this.mano[j].map((f) => {
      if (!ext) return { id: f.id, lados: ['der'] };
      const lados = [];
      if (f.a === ext[0] || f.b === ext[0]) lados.push('izq');
      if (f.a === ext[1] || f.b === ext[1]) lados.push('der');
      return { id: f.id, lados };
    });
  }

  #puedeJugar(j) {
    return this.jugablesDe(j).some((x) => x.lados.length);
  }

  accion(j, tipo, datos = {}) {
    const rival = this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo === 'siguiente') {
      if (this.fase !== 'resumen') throw new ErrorJuego('La mano no terminó');
      this.listos.add(j);
      if (this.listos.size === 2) {
        this.sale = this.rival(this.sale);
        this.#nuevaMano();
      }
      return;
    }
    if (this.fase !== 'jugando') throw new ErrorJuego('La mano terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');

    if (tipo === 'jugar') {
      const ficha = this.mano[j].find((f) => f.id === datos.ficha);
      if (!ficha) throw new ErrorJuego('Esa ficha no es tuya');
      const { lados } = this.jugablesDe(j).find((x) => x.id === ficha.id);
      if (!lados.length) throw new ErrorJuego('Esa ficha no entra');
      const lado = datos.lado && lados.includes(datos.lado) ? datos.lado : lados[0];
      if (!this.mesa.length) {
        this.mesa.push({ ...ficha });
      } else if (lado === 'izq') {
        const ext = this.mesa[0].a;
        this.mesa.unshift(ficha.b === ext ? { ...ficha } : { id: ficha.id, a: ficha.b, b: ficha.a });
      } else {
        const ext = this.mesa[this.mesa.length - 1].b;
        this.mesa.push(ficha.a === ext ? { ...ficha } : { id: ficha.id, a: ficha.b, b: ficha.a });
      }
      this.mano[j] = this.mano[j].filter((f) => f !== ficha);
      this.pases = 0;
      this.ultima = { por: j, tipo: 'jugo', ficha: ficha.id, lado };
      if (!this.mano[j].length) return this.#cerrarMano(j, 'domino');
      this.turno = rival;
      return;
    }
    if (tipo === 'robar') {
      if (!this.config.conPozo || !this.pozo.length) throw new ErrorJuego('No hay pozo para robar');
      if (this.#puedeJugar(j)) throw new ErrorJuego('Tenés fichas para jugar');
      this.mano[j].push(this.pozo.pop());
      this.ultima = { por: j, tipo: 'robo' };
      return;
    }
    if (tipo === 'pasar') {
      if (this.#puedeJugar(j)) throw new ErrorJuego('Tenés fichas para jugar');
      if (this.config.conPozo && this.pozo.length) throw new ErrorJuego('Primero robá del pozo');
      this.pases++;
      this.ultima = { por: j, tipo: 'paso' };
      if (this.pases >= 2) return this.#cerrarMano(null, 'tranque');
      this.turno = rival;
      return;
    }
    throw new ErrorJuego('Acción desconocida');
  }

  #cerrarMano(ganador, motivo) {
    const [a, b] = this.jugadores;
    if (motivo === 'tranque') {
      const pa = pips(this.mano[a]);
      const pb = pips(this.mano[b]);
      ganador = pa === pb ? null : pa < pb ? a : b;
    }
    const ganados = ganador ? pips(this.mano[this.rival(ganador)]) : 0;
    if (ganador) this.puntos[ganador] += ganados;
    this.fase = 'resumen';
    this.resumen = { ganador, motivo, ganados, manos: { [a]: this.mano[a], [b]: this.mano[b] } };
    const meta = this.config.puntosParaGanar;
    if (meta === 0) {
      this.#terminar(ganador);
    } else if (ganador && this.puntos[ganador] >= meta) {
      this.#terminar(ganador);
    }
  }

  #terminar(ganador) {
    this.estado = 'terminada';
    this.ganador = ganador;
    this.motivoFin = 'puntos';
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { puntos: this.puntos, manos: this.manos };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const r = this.resumen;
    const miTurno = this.estado === 'jugando' && this.fase === 'jugando' && this.turno === j;
    const puede = miTurno && this.#puedeJugar(j);
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      fase: this.fase,
      mano: this.manos,
      turno: this.turno,
      miMano: this.mano[j],
      fichasRival: this.mano[rival].length,
      mesa: this.mesa,
      extremos: this.extremos(),
      pozo: this.pozo.length,
      jugables: miTurno ? this.jugablesDe(j) : [],
      puedeRobar: miTurno && !puede && this.config.conPozo && this.pozo.length > 0,
      puedePasar: miTurno && !puede && (!this.config.conPozo || this.pozo.length === 0),
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      ultima: this.ultima && { ...this.ultima, mia: this.ultima.por === j },
      resumen: r && {
        resultado: r.ganador === null ? 'empate' : r.ganador === j ? 'gane' : 'perdi',
        motivo: r.motivo,
        ganados: r.ganados,
        manoRival: r.manos[rival],
      },
      listos: [...this.listos],
    };
  }
}
