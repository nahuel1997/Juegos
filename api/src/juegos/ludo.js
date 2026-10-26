// Ludo 1vs1: cuatro fichas por jugador (rojo y amarillo, en esquinas opuestas). Se tira el dado y se
// mueve una ficha; para salir de la casa hace falta un 6 (o 1 y 6, configurable). Caer en una ficha
// rival fuera de las casillas seguras la manda a su casa. Gana quien mete las cuatro en la meta.
//
// Posición de cada ficha (relativa a su salida): -1 = casa, 0..50 = recorrido común,
// 51..55 = pasillo propio, 56 = meta. La casilla absoluta del recorrido es (salida + pos) % 52.
import { ErrorJuego } from './comun.js';

export const CONFIG_DEFECTO = { salida: 'seis', seisRepite: true, comerRepite: true, exacto: true };

export const SALIDAS = [0, 26]; // casilla absoluta de salida de cada color
export const SEGURAS = [0, 8, 13, 21, 26, 34, 39, 47];
const META = 56;
const ULTIMA_COMUN = 50;

export function validarConfig(c = {}) {
  const salida = c.salida ?? CONFIG_DEFECTO.salida;
  if (!['seis', 'unoOSeis'].includes(salida)) throw new ErrorJuego('Regla de salida desconocida');
  return {
    salida,
    seisRepite: c.seisRepite !== false,
    comerRepite: c.comerRepite !== false,
    exacto: c.exacto !== false,
  };
}

export class PartidaLudo {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'ludo';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    // Quien empieza es el rojo (salida 0); el otro, amarillo (salida 26).
    const primero = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.colores = { [primero]: 0, [this.rival(primero)]: 1 };
    this.piezas = { [jugadores[0]]: [-1, -1, -1, -1], [jugadores[1]]: [-1, -1, -1, -1] };
    this.turno = primero;
    this.dado = null;
    this.ultimo = null;
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  abs(j, pos) {
    return (SALIDAS[this.colores[j]] + pos) % 52;
  }

  // Destino de cada ficha con el dado actual (null si no se puede mover).
  destinos(j, dado) {
    return this.piezas[j].map((pos) => {
      if (pos === META) return null;
      if (pos === -1) return dado === 6 || (this.config.salida === 'unoOSeis' && dado === 1) ? 0 : null;
      const nuevo = pos + dado;
      if (nuevo > META) return this.config.exacto ? null : META;
      return nuevo;
    });
  }

  accion(j, tipo, datos = {}) {
    const rival = this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');

    if (tipo === 'tirar') {
      if (this.dado !== null) throw new ErrorJuego('Ya tiraste: mové una ficha');
      const dado = 1 + Math.floor(this.rand() * 6);
      this.ultimo = { por: j, dado, tipo: 'tiro', n: (this.ultimo?.n || 0) + 1 };
      if (this.destinos(j, dado).every((d) => d === null)) {
        // No hay jugada: si sacó 6 (y el 6 repite) vuelve a tirar; si no, pasa el turno.
        this.ultimo.sinJugada = true;
        if (!(dado === 6 && this.config.seisRepite)) this.turno = rival;
        return;
      }
      this.dado = dado;
      return;
    }
    if (tipo === 'mover') {
      if (this.dado === null) throw new ErrorJuego('Primero tirá el dado');
      const i = Number(datos.pieza);
      const destino = this.destinos(j, this.dado)[i];
      if (!Number.isInteger(i) || destino == null) throw new ErrorJuego('Esa ficha no se puede mover');
      const desde = this.piezas[j][i];
      this.piezas[j][i] = destino;
      let comio = false;
      if (destino <= ULTIMA_COMUN) {
        const casilla = this.abs(j, destino);
        if (!SEGURAS.includes(casilla)) {
          this.piezas[rival] = this.piezas[rival].map((p) => {
            if (p >= 0 && p <= ULTIMA_COMUN && this.abs(rival, p) === casilla) {
              comio = true;
              return -1;
            }
            return p;
          });
        }
      }
      this.ultimo = { por: j, dado: this.dado, tipo: 'movio', pieza: i, desde, hasta: destino, comio, n: (this.ultimo?.n || 0) + 1 };
      const sacoSeis = this.dado === 6;
      this.dado = null;
      if (this.piezas[j].every((p) => p === META)) {
        this.estado = 'terminada';
        this.ganador = j;
        this.motivoFin = 'meta';
        return;
      }
      const repite = (sacoSeis && this.config.seisRepite) || (comio && this.config.comerRepite);
      if (!repite) this.turno = rival;
      return;
    }
    throw new ErrorJuego('Acción desconocida');
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { enMeta: Object.fromEntries(this.jugadores.map((j) => [j, this.piezas[j].filter((p) => p === META).length])) };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const miTurno = this.estado === 'jugando' && this.turno === j;
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      turno: this.turno,
      colores: { yo: this.colores[j], rival: this.colores[rival] }, // 0 = rojo, 1 = amarillo
      piezas: { yo: this.piezas[j], rival: this.piezas[rival] },
      dado: this.dado,
      movibles: miTurno && this.dado !== null ? this.destinos(j, this.dado).map((d) => d !== null) : [false, false, false, false],
      ultimo: this.ultimo && { ...this.ultimo, mio: this.ultimo.por === j },
      enMeta: { yo: this.piezas[j].filter((p) => p === META).length, rival: this.piezas[rival].filter((p) => p === META).length },
    };
  }
}
