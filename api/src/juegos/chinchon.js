// Chinchón 1vs1 con mazo español (48 cartas o 40 sin ochos y nueves) y comodines opcionales.
// En tu turno robás (del mazo o la de arriba del pozo) y tirás una. Combinaciones: escalera (3 o más
// seguidas del mismo palo) o pierna (3 o 4 del mismo número); el comodín reemplaza a cualquiera.
// Cortás si lo que te queda suelto suma 5 o menos. Al cortar, cada uno suma lo suelto (el que corta
// con todo ligado resta 10) y el rival puede pegar sus sueltas en las combinaciones del que cortó.
// Quien pasa el límite de puntos pierde. Chinchón (7 seguidas del mismo palo, sin comodín) gana la partida.
import { ErrorJuego, entero } from './comun.js';

export const PALOS = ['oros', 'copas', 'espadas', 'bastos'];
export const CONFIG_DEFECTO = { limite: 100, comodines: true, ochosYNueves: true };
export const VALOR_COMODIN = 25;
export const CORTE_MAXIMO = 5;

export function validarConfig(c = {}) {
  return {
    limite: entero(c.limite ?? CONFIG_DEFECTO.limite, 50, 200, 'El límite de puntos'),
    comodines: c.comodines === undefined ? CONFIG_DEFECTO.comodines : !!c.comodines,
    ochosYNueves: c.ochosYNueves === undefined ? CONFIG_DEFECTO.ochosYNueves : !!c.ochosYNueves,
  };
}

export const numerosDe = (config) => (config.ochosYNueves ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]);
const esComodin = (c) => c.palo === 'comodin';
export const valorDe = (c) => (esComodin(c) ? VALOR_COMODIN : c.numero);

export function mazoNuevo(config, rand = Math.random) {
  const mazo = PALOS.flatMap((palo) => numerosDe(config).map((numero) => ({ id: `${palo}-${numero}`, palo, numero })));
  if (config.comodines) mazo.push({ id: 'comodin-1', palo: 'comodin', numero: 0 }, { id: 'comodin-2', palo: 'comodin', numero: 0 });
  mezclar(mazo, rand);
  return mazo;
}

function mezclar(cartas, rand) {
  for (let i = cartas.length - 1; i > 0; i--) {
    const k = Math.floor(rand() * (i + 1));
    [cartas[i], cartas[k]] = [cartas[k], cartas[i]];
  }
}

// La mejor forma de acomodar una mano: combinaciones (listas de ids, en orden) y sueltas, con el
// menor puntaje suelto posible. Fuerza bruta: las manos tienen 7 u 8 cartas.
export function mejorArreglo(cartas, config) {
  const orden = numerosDe(config);
  const pos = (n) => orden.indexOf(n);
  const naturales = cartas.filter((c) => !esComodin(c)).sort((a, b) => PALOS.indexOf(a.palo) - PALOS.indexOf(b.palo) || a.numero - b.numero);
  const comodines = cartas.filter(esComodin);
  let mejor = null;

  function buscar(resto, comodinesLibres, combos, sueltas, puntos) {
    if (mejor && puntos > mejor.puntos) return;
    if (!resto.length) {
      // Los comodines que sobran se pegan a cualquier combinación; si no hay ninguna, quedan sueltos.
      let combosFin = combos;
      let sueltasFin = sueltas;
      let total = puntos;
      if (comodinesLibres.length) {
        if (combos.length) combosFin = [...combos.slice(0, -1), [...combos[combos.length - 1], ...comodinesLibres]];
        else { sueltasFin = [...sueltas, ...comodinesLibres]; total += comodinesLibres.length * VALOR_COMODIN; }
      }
      if (!mejor || total < mejor.puntos) mejor = { combos: combosFin, sueltas: sueltasFin, puntos: total };
      return;
    }
    const [c, ...demas] = resto;
    // 1) Suelta.
    buscar(demas, comodinesLibres, combos, [...sueltas, c], puntos + c.numero);
    // 2) Pierna con las del mismo número (+ comodines).
    const iguales = demas.filter((x) => x.numero === c.numero);
    for (let m = 0; m < 1 << iguales.length; m++) {
      const usadas = iguales.filter((_, i) => m & (1 << i));
      for (let j = 0; j <= comodinesLibres.length; j++) {
        if (1 + usadas.length + j < 3) continue;
        buscar(demas.filter((x) => !usadas.includes(x)), comodinesLibres.slice(j), [...combos, [c, ...usadas, ...comodinesLibres.slice(0, j)]], sueltas, puntos);
      }
    }
    // 3) Escalera que empieza en c (c es la más baja natural de su palo entre las que quedan).
    const delPalo = demas.filter((x) => x.palo === c.palo);
    const p0 = pos(c.numero);
    for (let antes = 0; antes <= comodinesLibres.length; antes++) {
      // `antes` comodines delante de c (por si la escalera empieza más abajo).
      if (p0 - antes < 0) break;
      let libres = comodinesLibres.length - antes;
      const escalera = [...comodinesLibres.slice(0, antes), c];
      let usados = [];
      let k = p0 + 1;
      let comUsados = antes;
      while (k < orden.length) {
        const nat = delPalo.find((x) => x.numero === orden[k]);
        if (nat) { escalera.push(nat); usados = [...usados, nat]; }
        else if (libres > 0) { escalera.push(comodinesLibres[comUsados]); comUsados++; libres--; }
        else break;
        k++;
        if (escalera.length >= 3) {
          buscar(demas.filter((x) => !usados.includes(x)), comodinesLibres.slice(comUsados), [...combos, [...escalera]], sueltas, puntos);
        }
      }
    }
  }

  buscar(naturales, comodines, [], [], 0);
  return {
    combos: mejor.combos.map((g) => g.map((c) => c.id)),
    sueltas: mejor.sueltas.map((c) => c.id),
    puntos: mejor.puntos,
  };
}

// Chinchón: 7 cartas seguidas del mismo palo, sin comodín.
export function esChinchon(cartas, config) {
  if (cartas.length !== 7 || cartas.some(esComodin) || new Set(cartas.map((c) => c.palo)).size !== 1) return false;
  const orden = numerosDe(config);
  const p = cartas.map((c) => orden.indexOf(c.numero)).sort((a, b) => a - b);
  return p.every((x, i) => i === 0 || x === p[i - 1] + 1);
}

// El rival del que cortó pega sus sueltas en las combinaciones del que cortó (si entran).
export function pegarSueltas(sueltas, combosCorte, config) {
  const orden = numerosDe(config);
  const combos = combosCorte.map((g) => [...g]);
  let quedan = [...sueltas];
  const pegadas = [];
  for (let cambio = true; cambio;) {
    cambio = false;
    for (const c of quedan) {
      const g = combos.find((x) => dondeEntra(c, x, orden));
      if (!g) continue;
      if (dondeEntra(c, g, orden) === 'ini') g.unshift(c);
      else g.push(c);
      pegadas.push(c);
      quedan = quedan.filter((x) => x !== c);
      cambio = true;
      break;
    }
  }
  return { quedan, pegadas, combos };
}

// Una escalera tiene al menos dos naturales del mismo palo y números distintos; si no, es pierna.
function esEscalera(grupo) {
  const nat = grupo.filter((x) => !esComodin(x));
  return nat.length >= 2 && new Set(nat.map((x) => x.palo)).size === 1 && new Set(nat.map((x) => x.numero)).size === nat.length;
}

// 'ini' / 'fin' (punta de una escalera), 'pierna', o null si no entra. Las escaleras están en orden.
function dondeEntra(c, grupo, orden) {
  if (esComodin(c)) return null;
  const nat = grupo.filter((x) => !esComodin(x));
  if (!nat.length) return null;
  if (!esEscalera(grupo)) return c.numero === nat[0].numero && nat.length < 4 ? 'pierna' : null;
  if (c.palo !== nat[0].palo) return null;
  const i = grupo.findIndex((x) => !esComodin(x));
  const desde = orden.indexOf(grupo[i].numero) - i;
  const pc = orden.indexOf(c.numero);
  if (pc === desde - 1) return 'ini';
  if (pc === desde + grupo.length) return 'fin';
  return null;
}

export class PartidaChinchon {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'chinchon';
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
    this.ronda++;
    if (this.ronda > 1) this.empiezaRonda = this.rival(this.empiezaRonda);
    this.fase = 'jugando';
    this.mazo = mazoNuevo(this.config, this.rand ?? Math.random);
    this.mano = Object.fromEntries(this.jugadores.map((j) => [j, this.mazo.splice(0, 7)]));
    this.pozo = [this.mazo.pop()];
    this.turno = this.empiezaRonda;
    this.paso = 'robar'; // robar | tirar
    this.ultima = null;
    this.resumen = null;
    this.listosSiguiente = new Set();
    this.jugadas = 0;
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
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');

    if (tipo === 'robar') {
      if (this.paso !== 'robar') throw new ErrorJuego('Ya robaste: ahora tirá una carta');
      let carta;
      if (datos.de === 'pozo') {
        if (!this.pozo.length) throw new ErrorJuego('El pozo está vacío');
        carta = this.pozo.pop();
      } else {
        if (!this.mazo.length) {
          // Se da vuelta el pozo (menos la de arriba) y se mezcla.
          const tope = this.pozo.pop();
          this.mazo = this.pozo;
          this.pozo = tope ? [tope] : [];
          mezclar(this.mazo, this.rand ?? Math.random);
        }
        if (!this.mazo.length) throw new ErrorJuego('No quedan cartas');
        carta = this.mazo.pop();
      }
      this.mano[j].push(carta);
      this.paso = 'tirar';
      this.robo = carta.id;
      this.ultima = { por: j, tipo: 'robo', de: datos.de === 'pozo' ? 'pozo' : 'mazo', carta: datos.de === 'pozo' ? carta : null, n: ++this.jugadas };
      return;
    }

    if (tipo !== 'tirar' && tipo !== 'cortar') throw new ErrorJuego('Acción desconocida');
    if (this.paso !== 'tirar') throw new ErrorJuego('Primero robá una carta');
    const carta = this.mano[j].find((c) => c.id === datos.carta);
    if (!carta) throw new ErrorJuego('Esa carta no está en tu mano');
    const queda = this.mano[j].filter((c) => c !== carta);

    if (tipo === 'cortar') {
      const arreglo = mejorArreglo(queda, this.config);
      if (arreglo.puntos > CORTE_MAXIMO) throw new ErrorJuego(`Para cortar lo suelto tiene que sumar ${CORTE_MAXIMO} o menos (te queda ${arreglo.puntos})`);
      this.mano[j] = queda;
      this.pozo.push(carta);
      return this.#corte(j, arreglo);
    }

    this.mano[j] = queda;
    this.pozo.push(carta);
    this.paso = 'robar';
    this.robo = null;
    this.ultima = { por: j, tipo: 'tiro', carta, n: ++this.jugadas };
    this.turno = rival;
  }

  #corte(j, arreglo) {
    const rival = this.rival(j);
    const porId = (lista) => (ids) => ids.map((id) => lista.find((c) => c.id === id));
    const cartasJ = porId(this.mano[j]);
    const chinchon = esChinchon(this.mano[j], this.config);
    const menosDiez = arreglo.puntos === 0;
    const suma = { [j]: chinchon ? 0 : menosDiez ? -10 : arreglo.puntos };

    const arregloRival = mejorArreglo(this.mano[rival], this.config);
    const cartasR = porId(this.mano[rival]);
    const combosCorte = arreglo.combos.map(cartasJ);
    const { quedan, pegadas, combos } = pegarSueltas(cartasR(arregloRival.sueltas), combosCorte, this.config);
    suma[rival] = quedan.reduce((s, c) => s + valorDe(c), 0);

    this.resumen = {
      corto: j,
      chinchon,
      menosDiez,
      manos: {
        [j]: { combos: combos.map((g) => g.map((c) => c.id)), sueltas: arreglo.sueltas, pegadas: pegadas.map((c) => c.id), cartas: this.mano[j] },
        [rival]: { combos: arregloRival.combos, sueltas: quedan.map((c) => c.id), pegadas: [], cartas: this.mano[rival] },
      },
      suma,
    };
    this.ultima = { por: j, tipo: 'corto', n: ++this.jugadas };
    this.fase = 'resumen';
    this.turno = null;
    for (const x of this.jugadores) this.puntos[x] += suma[x];

    if (chinchon) {
      this.estado = 'terminada';
      this.ganador = j;
      this.motivoFin = 'chinchon';
      return;
    }
    const pasados = this.jugadores.filter((x) => this.puntos[x] > this.config.limite);
    if (pasados.length) {
      const [a, b] = this.jugadores;
      this.estado = 'terminada';
      this.motivoFin = 'puntos';
      // Pierde el que pasó el límite; si pasaron los dos, gana el que tiene menos.
      this.ganador = pasados.length === 1 ? this.rival(pasados[0]) : this.puntos[a] === this.puntos[b] ? null : this.puntos[a] < this.puntos[b] ? a : b;
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
    const quien = (x) => (x == null ? null : x === j ? 'yo' : 'rival');
    const miTurnoTirar = this.fase === 'jugando' && this.turno === j && this.paso === 'tirar';
    const mano = this.mano[j];
    const r = this.resumen;
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      ronda: this.ronda,
      fase: this.fase,
      turno: this.turno,
      paso: this.paso,
      miMano: mano,
      cartasRival: this.mano[rival].length,
      tope: this.pozo[this.pozo.length - 1] ?? null,
      pozo: this.pozo.length,
      mazo: this.mazo.length,
      robo: this.turno === j ? this.robo : null,
      // Cómo conviene acomodar lo que tengo y, al tener 8, cuánto queda suelto tirando cada carta.
      arreglo: mejorArreglo(mano, this.config),
      cortes: miTurnoTirar
        ? mano.map((c) => ({ id: c.id, puntos: mejorArreglo(mano.filter((x) => x !== c), this.config).puntos }))
        : null,
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      ultima: this.ultima && { ...this.ultima, por: quien(this.ultima.por) },
      resumen: r && {
        corto: quien(r.corto),
        chinchon: r.chinchon,
        menosDiez: r.menosDiez,
        yo: r.manos[j],
        rival: r.manos[rival],
        suma: { yo: r.suma[j], rival: r.suma[rival] },
      },
      listosSiguiente: [...this.listosSiguiente].map(quien),
    };
  }
}
