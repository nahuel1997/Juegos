// Memoria de secuencia (tipo Simón) 1vs1 a la vez: se ilumina una secuencia de colores y los dos la
// repiten, cada uno en su pantalla. Si los dos aciertan, la secuencia suma un color más. El primero
// que se equivoca (o se queda sin tiempo) pierde la partida; si se equivocan los dos, gana el que
// llegó más lejos. Al mejor de N partidas.
import { ErrorJuego, entero, ganadorPorPuntos } from './comun.js';

export const PASO_MS = { normal: 650, rapida: 430 };
export const CONFIG_DEFECTO = { colores: 4, velocidad: 'normal', partidas: 3 };

export function validarConfig(c = {}) {
  const colores = Number(c.colores ?? CONFIG_DEFECTO.colores);
  if (![4, 6].includes(colores)) throw new ErrorJuego('Se juega con 4 o 6 colores');
  const velocidad = c.velocidad ?? CONFIG_DEFECTO.velocidad;
  if (!PASO_MS[velocidad]) throw new ErrorJuego('Velocidad inválida');
  return { colores, velocidad, partidas: entero(c.partidas ?? CONFIG_DEFECTO.partidas, 1, 9, 'Las partidas') };
}

const LARGO_INICIAL = 3;
const LARGO_MAX = 40;

export class PartidaSimon {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    this.juego = 'simon';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.partida = 0;
    this.historial = [];
    this.timer = null;
    this.notificar = null;
    this.#nuevaPartida();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #color() {
    return Math.floor((this.rand ?? Math.random)() * this.config.colores);
  }

  #nuevaPartida() {
    this.partida++;
    this.secuencia = Array.from({ length: LARGO_INICIAL - 1 }, () => this.#color());
    this.resultado = null;
    this.listosSiguiente = new Set();
    this.#nuevoNivel();
  }

  #nuevoNivel() {
    this.secuencia.push(this.#color());
    this.progreso = Object.fromEntries(this.jugadores.map((j) => [j, 0]));
    this.situacion = Object.fromEntries(this.jugadores.map((j) => [j, 'jugando']));
    this.fase = 'mostrando';
    this.inicio = Date.now() + 600;
    this.hasta = this.inicio + this.secuencia.length * PASO_MS[this.config.velocidad] + 300;
    this.#programar();
  }

  #programar() {
    clearTimeout(this.timer);
    const fase = this.fase; const largo = this.secuencia.length; const partida = this.partida;
    this.timer = setTimeout(() => {
      if (this.estado !== 'jugando' || this.fase !== fase || this.secuencia.length !== largo || this.partida !== partida) return;
      if (fase === 'mostrando') {
        this.fase = 'repitiendo';
        this.hasta = Date.now() + largo * 1000 + 4000;
        this.#programar();
      } else if (fase === 'repitiendo') {
        for (const j of this.jugadores) if (this.situacion[j] === 'jugando') this.situacion[j] = 'tiempo';
        this.#evaluar();
      }
      this.notificar?.();
    }, Math.max(0, this.hasta - Date.now()));
    this.timer.unref?.();
  }

  reanudar() {
    if (this.estado !== 'jugando' || this.fase === 'fin') return;
    // Se vuelve a mostrar el nivel actual desde el principio.
    this.secuencia.pop();
    this.#nuevoNivel();
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo === 'siguiente') {
      if (this.fase !== 'fin') throw new ErrorJuego('La partida no terminó');
      this.listosSiguiente.add(j);
      if (this.listosSiguiente.size === 2) this.#nuevaPartida();
      return;
    }
    if (tipo !== 'tocar') throw new ErrorJuego('Acción desconocida');
    if (this.fase !== 'repitiendo') throw new ErrorJuego('Esperá a que termine la secuencia');
    if (this.situacion[j] !== 'jugando') return;
    const color = entero(datos.color, 0, this.config.colores - 1, 'El color');
    if (color !== this.secuencia[this.progreso[j]]) {
      this.situacion[j] = 'error';
    } else {
      this.progreso[j]++;
      if (this.progreso[j] === this.secuencia.length) this.situacion[j] = 'ok';
    }
    if (this.jugadores.every((x) => this.situacion[x] !== 'jugando')) this.#evaluar();
  }

  #evaluar() {
    const [a, b] = this.jugadores;
    const okA = this.situacion[a] === 'ok'; const okB = this.situacion[b] === 'ok';
    if (okA && okB) {
      if (this.secuencia.length >= LARGO_MAX) return this.#finPartida(null);
      return this.#nuevoNivel();
    }
    if (okA !== okB) return this.#finPartida(okA ? a : b);
    // Los dos fallaron: el que llegó más lejos.
    const pa = this.progreso[a]; const pb = this.progreso[b];
    this.#finPartida(pa === pb ? null : pa > pb ? a : b);
  }

  #finPartida(ganador) {
    clearTimeout(this.timer);
    this.fase = 'fin';
    this.hasta = null;
    this.resultado = ganador;
    if (ganador) this.puntos[ganador]++;
    this.historial.push({ ganador, largo: this.secuencia.length });
    const necesarias = Math.floor(this.config.partidas / 2) + 1;
    if (Math.max(...this.jugadores.map((x) => this.puntos[x])) >= necesarias || this.partida >= this.config.partidas) {
      this.estado = 'terminada';
      this.ganador = ganadorPorPuntos(this.jugadores, this.puntos);
      this.motivoFin = 'puntos';
    }
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    clearTimeout(this.timer);
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { puntos: this.puntos, partidas: this.partida, record: Math.max(...this.historial.map((h) => h.largo), 0) };
  }

  vistaPara(j) {
    const r = this.rival(j);
    const quien = (x) => (x === null ? null : x === j ? 'yo' : 'rival');
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      partida: this.partida,
      fase: this.fase,
      largo: this.secuencia.length,
      // La secuencia solo se manda mientras se muestra (y al final, para repasarla).
      secuencia: this.fase === 'mostrando' || this.fase === 'fin' ? this.secuencia : null,
      paso: PASO_MS[this.config.velocidad],
      inicio: this.inicio,
      hasta: this.hasta,
      ahora: Date.now(),
      progreso: { yo: this.progreso[j], rival: this.progreso[r] },
      situacion: { yo: this.situacion[j], rival: this.situacion[r] },
      resultado: this.fase === 'fin' ? quien(this.resultado) : undefined,
      puntos: { yo: this.puntos[j], rival: this.puntos[r] },
      historial: this.historial.map((h) => ({ ganador: quien(h.ganador), largo: h.largo })),
      listosSiguiente: [...this.listosSiguiente].map(quien),
    };
  }
}
