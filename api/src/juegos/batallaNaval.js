// Batalla naval 1vs1: tablero 10x10, flota clásica. Lógica pura (sin red) para poder testearla.

export const TAM = 10;

export const FLOTA = [
  { id: 'portaaviones', nombre: 'Portaaviones', largo: 5 },
  { id: 'acorazado', nombre: 'Acorazado', largo: 4 },
  { id: 'crucero', nombre: 'Crucero', largo: 3 },
  { id: 'submarino', nombre: 'Submarino', largo: 3 },
  { id: 'destructor', nombre: 'Destructor', largo: 2 },
];

export class ErrorJuego extends Error {}

const enTablero = (f, c) => Number.isInteger(f) && Number.isInteger(c) && f >= 0 && f < TAM && c >= 0 && c < TAM;
const clave = (f, c) => `${f},${c}`;

export function celdasDe({ fila, col, horizontal }, largo) {
  return Array.from({ length: largo }, (_, i) => (horizontal ? [fila, col + i] : [fila + i, col]));
}

// Valida la flota que manda el cliente y devuelve los barcos normalizados con sus celdas.
// Los barcos no pueden superponerse ni tocarse (ni en diagonal).
export function validarFlota(barcos) {
  if (!Array.isArray(barcos) || barcos.length !== FLOTA.length) throw new ErrorJuego('Tenés que ubicar los 5 barcos');
  const ocupadas = new Map();
  const resultado = [];
  for (const tipo of FLOTA) {
    const b = barcos.find((x) => x && x.id === tipo.id);
    if (!b) throw new ErrorJuego(`Falta ubicar el ${tipo.nombre.toLowerCase()}`);
    const pos = { fila: b.fila, col: b.col, horizontal: !!b.horizontal };
    const celdas = celdasDe(pos, tipo.largo);
    for (const [f, c] of celdas) {
      if (!enTablero(f, c)) throw new ErrorJuego(`El ${tipo.nombre.toLowerCase()} se sale del tablero`);
      for (let df = -1; df <= 1; df++) {
        for (let dc = -1; dc <= 1; dc++) {
          const otro = ocupadas.get(clave(f + df, c + dc));
          if (otro) throw new ErrorJuego(`El ${tipo.nombre.toLowerCase()} toca al ${otro.toLowerCase()}`);
        }
      }
    }
    celdas.forEach(([f, c]) => ocupadas.set(clave(f, c), tipo.nombre));
    resultado.push({ ...tipo, ...pos, celdas, impactos: 0 });
  }
  return resultado;
}

export function flotaAlAzar(rand = Math.random) {
  for (;;) {
    const barcos = [];
    const ocupadas = new Set();
    for (const tipo of FLOTA) {
      for (let intento = 0; intento < 200; intento++) {
        const horizontal = rand() < 0.5;
        const fila = Math.floor(rand() * (horizontal ? TAM : TAM - tipo.largo + 1));
        const col = Math.floor(rand() * (horizontal ? TAM - tipo.largo + 1 : TAM));
        const celdas = celdasDe({ fila, col, horizontal }, tipo.largo);
        const choca = celdas.some(([f, c]) =>
          [-1, 0, 1].some((df) => [-1, 0, 1].some((dc) => ocupadas.has(clave(f + df, c + dc)))));
        if (choca) continue;
        celdas.forEach(([f, c]) => ocupadas.add(clave(f, c)));
        barcos.push({ id: tipo.id, fila, col, horizontal });
        break;
      }
    }
    if (barcos.length === FLOTA.length) return barcos;
  }
}

export class PartidaBatallaNaval {
  constructor(jugadorA, jugadorB, { empieza } = {}) {
    this.juego = 'batalla-naval';
    this.jugadores = [jugadorA, jugadorB];
    this.estado = 'colocando'; // colocando | jugando | terminada
    this.flotas = { [jugadorA]: null, [jugadorB]: null };
    this.disparos = { [jugadorA]: new Map(), [jugadorB]: new Map() }; // disparos HECHOS por cada jugador
    this.turno = empieza ?? (Math.random() < 0.5 ? jugadorA : jugadorB);
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

  colocar(j, barcos) {
    this.#exigirJugador(j);
    if (this.estado !== 'colocando') throw new ErrorJuego('Ya no se pueden mover los barcos');
    this.flotas[j] = validarFlota(barcos);
    if (this.jugadores.every((x) => this.flotas[x])) this.estado = 'jugando';
  }

  // Si acertás, seguís tirando; si es agua, pasa el turno.
  disparar(j, fila, col) {
    this.#exigirJugador(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida no está en juego');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    if (!enTablero(fila, col)) throw new ErrorJuego('Disparo fuera del tablero');
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
    } else if (resultado === 'agua') {
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

  // Lo que ve cada jugador: su flota completa, y del rival solo lo que descubrió (los hundidos enteros).
  vistaPara(j) {
    this.#exigirJugador(j);
    const rival = this.rival(j);
    const lista = (m) => [...m].map(([k, r]) => { const [fila, col] = k.split(',').map(Number); return { fila, col, r }; });
    const flotaRival = this.flotas[rival] || [];
    const terminada = this.estado === 'terminada';
    return {
      juego: this.juego,
      estado: this.estado,
      yo: j,
      rival,
      turno: this.turno,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      ultimo: this.ultimo,
      listo: { yo: !!this.flotas[j], rival: !!this.flotas[rival] },
      miFlota: (this.flotas[j] || []).map(({ id, nombre, largo, fila, col, horizontal, impactos }) => ({ id, nombre, largo, fila, col, horizontal, impactos })),
      disparosRecibidos: lista(this.disparos[rival]),
      misDisparos: lista(this.disparos[j]),
      // Al terminar se muestra la flota del rival entera; antes, solo los barcos hundidos.
      flotaRival: flotaRival
        .filter((b) => terminada || b.impactos === b.largo)
        .map(({ id, nombre, largo, fila, col, horizontal, impactos }) => ({ id, nombre, largo, fila, col, horizontal, hundido: impactos === largo })),
      restantes: {
        mios: (this.flotas[j] || []).filter((b) => b.impactos < b.largo).length,
        rival: flotaRival.filter((b) => b.impactos < b.largo).length,
      },
    };
  }
}
