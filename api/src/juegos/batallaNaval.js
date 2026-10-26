// Batalla naval 1vs1 configurable (tamaño del tablero y cantidad de barcos). Lógica pura (sin red).
import { ErrorJuego, entero } from './comun.js';

export { ErrorJuego };

export const TIPOS = [
  { tipo: 'portaaviones', nombre: 'Portaaviones', largo: 5 },
  { tipo: 'acorazado', nombre: 'Acorazado', largo: 4 },
  { tipo: 'crucero', nombre: 'Crucero', largo: 3 },
  { tipo: 'submarino', nombre: 'Submarino', largo: 3 },
  { tipo: 'destructor', nombre: 'Destructor', largo: 2 },
];

export const CONFIG_DEFECTO = {
  filas: 10,
  columnas: 10,
  barcos: { portaaviones: 1, acorazado: 1, crucero: 1, submarino: 1, destructor: 1 },
  seguirAlTocar: false, // false: después de cada tiro pasa el turno; true: tocado = seguís tirando
  pegados: true, // los barcos se pueden poner uno al lado del otro (nunca encimados)
};

const clave = (f, c) => `${f},${c}`;

// Lista de barcos de la partida, cada uno con id propio (ej. "crucero-2").
export function flotaDe(config) {
  return TIPOS.flatMap((t) =>
    Array.from({ length: config.barcos[t.tipo] || 0 }, (_, i) => ({ id: `${t.tipo}-${i + 1}`, tipo: t.tipo, nombre: t.nombre, largo: t.largo })),
  );
}

export function celdasDe({ fila, col, horizontal }, largo) {
  return Array.from({ length: largo }, (_, i) => (horizontal ? [fila, col + i] : [fila + i, col]));
}

// Celdas alrededor que no pueden estar ocupadas: solo la propia si se permiten barcos pegados,
// o también las 8 vecinas si no.
const vecinas = (pegados) => (pegados ? [[0, 0]] : [-1, 0, 1].flatMap((df) => [-1, 0, 1].map((dc) => [df, dc])));
const chocaCon = (celdas, ocupadas, pegados) =>
  celdas.some(([f, c]) => vecinas(pegados).some(([df, dc]) => ocupadas.has(clave(f + df, c + dc))));

// Ubica la flota al azar. Devuelve null si no lo logra en `intentos` vueltas.
export function flotaAlAzar(flota, filas, columnas, { intentos = Infinity, rand = Math.random, pegados = false } = {}) {
  for (let vuelta = 0; vuelta < intentos; vuelta++) {
    const barcos = [];
    const ocupadas = new Set();
    for (const b of flota) {
      for (let i = 0; i < 100; i++) {
        const horizontal = b.largo > columnas ? false : b.largo > filas ? true : rand() < 0.5;
        const fila = Math.floor(rand() * (horizontal ? filas : filas - b.largo + 1));
        const col = Math.floor(rand() * (horizontal ? columnas - b.largo + 1 : columnas));
        const celdas = celdasDe({ fila, col, horizontal }, b.largo);
        if (chocaCon(celdas, ocupadas, pegados)) continue;
        celdas.forEach(([f, c]) => ocupadas.add(clave(f, c)));
        barcos.push({ id: b.id, fila, col, horizontal });
        break;
      }
    }
    if (barcos.length === flota.length) return barcos;
  }
  return null;
}

export function validarConfig(c = {}) {
  const config = {
    filas: entero(c.filas ?? CONFIG_DEFECTO.filas, 6, 15, 'Las filas'),
    columnas: entero(c.columnas ?? CONFIG_DEFECTO.columnas, 6, 15, 'Las columnas'),
    barcos: Object.fromEntries(TIPOS.map((t) => [t.tipo, entero(c.barcos?.[t.tipo] ?? 0, 0, 4, `La cantidad de ${t.nombre.toLowerCase()}s`)])),
    seguirAlTocar: c.seguirAlTocar === true,
    pegados: c.pegados !== false,
  };
  const flota = flotaDe(config);
  if (flota.length === 0) throw new ErrorJuego('Tiene que haber al menos un barco');
  if (flota.length > 15) throw new ErrorJuego('Máximo 15 barcos');
  if (!flotaAlAzar(flota, config.filas, config.columnas, { intentos: 300, pegados: config.pegados })) {
    throw new ErrorJuego('No entran tantos barcos en ese tablero: sumá filas o sacá barcos');
  }
  return config;
}

// Valida la flota que manda el cliente. Nunca encimados; si no se permiten pegados, tampoco tocándose (ni en diagonal).
export function validarFlota(barcos, flota, filas, columnas, { pegados = false } = {}) {
  if (!Array.isArray(barcos) || barcos.length !== flota.length) throw new ErrorJuego(`Tenés que ubicar los ${flota.length} barcos`);
  const ocupadas = new Map();
  return flota.map((tipo) => {
    const b = barcos.find((x) => x && x.id === tipo.id);
    if (!b) throw new ErrorJuego(`Falta ubicar el ${tipo.nombre.toLowerCase()}`);
    const pos = { fila: b.fila, col: b.col, horizontal: !!b.horizontal };
    const celdas = celdasDe(pos, tipo.largo);
    for (const [f, c] of celdas) {
      if (!Number.isInteger(f) || !Number.isInteger(c) || f < 0 || c < 0 || f >= filas || c >= columnas) {
        throw new ErrorJuego(`El ${tipo.nombre.toLowerCase()} se sale del tablero`);
      }
      for (const [df, dc] of vecinas(pegados)) {
        const otro = ocupadas.get(clave(f + df, c + dc));
        if (otro) throw new ErrorJuego(`El ${tipo.nombre.toLowerCase()} ${df || dc ? 'toca al' : 'se encima con el'} ${otro.toLowerCase()}`);
      }
    }
    celdas.forEach(([f, c]) => ocupadas.set(clave(f, c), tipo.nombre));
    return { ...tipo, ...pos, celdas, impactos: 0 };
  });
}

export class PartidaBatallaNaval {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza } = {}) {
    const [a, b] = jugadores;
    this.juego = 'batalla-naval';
    this.jugadores = [a, b];
    this.config = config;
    this.flota = flotaDe(config);
    this.estado = 'colocando'; // colocando | jugando | terminada
    this.flotas = { [a]: null, [b]: null };
    this.disparos = { [a]: new Map(), [b]: new Map() }; // disparos HECHOS por cada jugador
    this.turno = empieza ?? (Math.random() < 0.5 ? a : b);
    this.ganador = null;
    this.motivoFin = null;
    this.ultimo = null; // último disparo, para animarlo en el front
  }

  rival(j) {
    this.#exigirJugador(j);
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #exigirJugador(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
  }

  accion(j, tipo, datos = {}) {
    if (tipo === 'colocar') return this.colocar(j, datos.barcos);
    if (tipo === 'disparar') return this.disparar(j, datos.fila, datos.col);
    throw new ErrorJuego('Acción desconocida');
  }

  colocar(j, barcos) {
    this.#exigirJugador(j);
    if (this.estado !== 'colocando') throw new ErrorJuego('Ya no se pueden mover los barcos');
    this.flotas[j] = validarFlota(barcos, this.flota, this.config.filas, this.config.columnas, { pegados: this.config.pegados });
    if (this.jugadores.every((x) => this.flotas[x])) this.estado = 'jugando';
  }

  disparar(j, fila, col) {
    this.#exigirJugador(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida no está en juego');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    const { filas, columnas } = this.config;
    if (!Number.isInteger(fila) || !Number.isInteger(col) || fila < 0 || col < 0 || fila >= filas || col >= columnas) {
      throw new ErrorJuego('Disparo fuera del tablero');
    }
    const mios = this.disparos[j];
    if (mios.has(clave(fila, col))) throw new ErrorJuego('Ya disparaste ahí');

    const rival = this.rival(j);
    const barco = this.flotas[rival].find((b) => b.celdas.some(([f, c]) => f === fila && c === col));
    let resultado = 'agua';
    if (barco) {
      barco.impactos++;
      resultado = barco.impactos === barco.largo ? 'hundido' : 'tocado';
    }
    mios.set(clave(fila, col), resultado === 'agua' ? 'agua' : 'tocado');
    this.ultimo = { por: j, fila, col, resultado, barco: resultado === 'hundido' ? barco.nombre : null };

    if (this.flotas[rival].every((b) => b.impactos === b.largo)) {
      this.estado = 'terminada';
      this.ganador = j;
      this.motivoFin = 'flota';
    } else if (resultado === 'agua' || resultado === 'hundido' || !this.config.seguirAlTocar) {
      // Al hundir un barco también pasa el turno; al tocar, solo si se juega con seguirAlTocar.
      this.turno = rival;
    }
    return this.ultimo;
  }

  abandonar(j) {
    this.#exigirJugador(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = this.rival(j);
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { disparos: Object.fromEntries(this.jugadores.map((j) => [j, this.disparos[j].size])) };
  }

  // Lo que ve cada jugador: su flota completa, y del rival solo lo que descubrió (los hundidos enteros).
  vistaPara(j) {
    this.#exigirJugador(j);
    const rival = this.rival(j);
    const lista = (m) => [...m].map(([k, r]) => { const [fila, col] = k.split(',').map(Number); return { fila, col, r }; });
    const flotaRival = this.flotas[rival] || [];
    const terminada = this.estado === 'terminada';
    const resumen = ({ id, tipo, nombre, largo, fila, col, horizontal, impactos }) => ({ id, tipo, nombre, largo, fila, col, horizontal, impactos });
    return {
      estado: this.estado,
      filas: this.config.filas,
      columnas: this.config.columnas,
      flota: this.flota,
      pegados: this.config.pegados,
      seguirAlTocar: this.config.seguirAlTocar,
      turno: this.turno,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      ultimo: this.ultimo,
      listo: { yo: !!this.flotas[j], rival: !!this.flotas[rival] },
      miFlota: (this.flotas[j] || []).map(resumen),
      disparosRecibidos: lista(this.disparos[rival]),
      misDisparos: lista(this.disparos[j]),
      // Al terminar se muestra la flota del rival entera; antes, solo los barcos hundidos.
      flotaRival: flotaRival
        .filter((b) => terminada || b.impactos === b.largo)
        .map((b) => ({ ...resumen(b), hundido: b.impactos === b.largo })),
      restantes: {
        mios: (this.flotas[j] || []).filter((b) => b.impactos < b.largo).length,
        rival: flotaRival.filter((b) => b.impactos < b.largo).length,
      },
    };
  }
}
