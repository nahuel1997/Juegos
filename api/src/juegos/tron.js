// Tron (motos de luz) 1vs1 en tiempo real: las dos motos avanzan solas y dejan una estela; vos solo
// doblás. Pierde el que choca contra una pared o una estela (si chocan los dos a la vez, empate).
// Cuenta regresiva de 3 s por ronda; al mejor de N rondas.
import { ErrorJuego, entero, ganadorPorPuntos } from './comun.js';

export const VELOCIDADES = { lenta: 140, normal: 105, rapida: 75 };
export const TAMANIOS = { chico: [30, 20], mediano: [40, 26], grande: [54, 34] };
export const CONFIG_DEFECTO = { tamanio: 'mediano', velocidad: 'normal', rondas: 3 };

export function validarConfig(c = {}) {
  const tamanio = c.tamanio ?? CONFIG_DEFECTO.tamanio;
  const velocidad = c.velocidad ?? CONFIG_DEFECTO.velocidad;
  if (!TAMANIOS[tamanio]) throw new ErrorJuego('Tamaño inválido');
  if (!VELOCIDADES[velocidad]) throw new ErrorJuego('Velocidad inválida');
  return { tamanio, velocidad, rondas: entero(c.rondas ?? CONFIG_DEFECTO.rondas, 1, 9, 'Las rondas') };
}

export const DIRS = { arriba: [0, -1], abajo: [0, 1], izquierda: [-1, 0], derecha: [1, 0] };
const OPUESTA = { arriba: 'abajo', abajo: 'arriba', izquierda: 'derecha', derecha: 'izquierda' };
const CUENTA_MS = 3000;
const PAUSA_MS = 2600;

export class PartidaTron {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'tron';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.izquierda = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]); // el que sale de la izquierda
    this.ronda = 0;
    this.historial = [];
    this.timer = null;
    this.notificar = null;
    this.#nuevaRonda();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  get medidas() {
    return TAMANIOS[this.config.tamanio];
  }

  #nuevaRonda() {
    this.ronda++;
    const [ancho, alto] = this.medidas;
    const fila = Math.floor(alto / 2);
    // Se van alternando los lados.
    const izq = this.ronda % 2 === 1 ? this.izquierda : this.rival(this.izquierda);
    const der = this.rival(izq);
    this.motos = {
      [izq]: { x: 3, y: fila, dir: 'derecha', prox: [], viva: true },
      [der]: { x: ancho - 4, y: fila, dir: 'izquierda', prox: [], viva: true },
    };
    this.ocupado = Array(ancho * alto).fill(null);
    this.rastros = Object.fromEntries(this.jugadores.map((j) => [j, []]));
    for (const j of this.jugadores) this.#marcar(j);
    this.fase = 'cuenta';
    this.hasta = Date.now() + CUENTA_MS;
    this.resultado = null;
    this.choque = null;
    this.pasos = 0;
    this.#programar(CUENTA_MS);
  }

  #marcar(j) {
    const m = this.motos[j];
    const i = m.y * this.medidas[0] + m.x;
    this.ocupado[i] = j;
    this.rastros[j].push(i);
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo !== 'girar') throw new ErrorJuego('Acción desconocida');
    const dir = String(datos.dir);
    if (!DIRS[dir]) throw new ErrorJuego('Dirección inválida');
    if (this.fase === 'fin') return;
    const m = this.motos[j];
    // Se encolan hasta 2 giros por paso (para poder hacer una "U" rápida).
    const ultima = m.prox[m.prox.length - 1] ?? m.dir;
    if (dir === ultima || dir === OPUESTA[ultima] || m.prox.length >= 2) return;
    m.prox.push(dir);
  }

  #programar(ms) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.#tic(), ms);
    this.timer.unref?.();
  }

  #tic() {
    if (this.estado !== 'jugando') return;
    if (this.fase === 'cuenta') {
      this.fase = 'jugando';
      this.hasta = null;
      this.#programar(VELOCIDADES[this.config.velocidad]);
      this.notificar?.();
      return;
    }
    if (this.fase === 'fin') {
      this.#nuevaRonda();
      this.notificar?.();
      return;
    }
    this.#paso();
    if (this.fase === 'jugando') this.#programar(VELOCIDADES[this.config.velocidad]);
    this.notificar?.();
  }

  // Un paso: las dos avanzan a la vez.
  #paso() {
    const [ancho, alto] = this.medidas;
    this.pasos++;
    const destino = {};
    for (const j of this.jugadores) {
      const m = this.motos[j];
      if (m.prox.length) m.dir = m.prox.shift();
      const [dx, dy] = DIRS[m.dir];
      destino[j] = [m.x + dx, m.y + dy];
    }
    const [a, b] = this.jugadores;
    const choca = (j) => {
      const [x, y] = destino[j];
      return x < 0 || y < 0 || x >= ancho || y >= alto || this.ocupado[y * ancho + x] !== null;
    };
    const frente = destino[a][0] === destino[b][0] && destino[a][1] === destino[b][1];
    const muere = { [a]: frente || choca(a), [b]: frente || choca(b) };
    for (const j of this.jugadores) {
      const m = this.motos[j];
      [m.x, m.y] = destino[j];
      if (muere[j]) { m.viva = false; continue; }
      this.#marcar(j);
    }
    if (!muere[a] && !muere[b]) return;
    const ganador = muere[a] && muere[b] ? null : muere[a] ? b : a;
    this.choque = this.jugadores.filter((j) => muere[j]).map((j) => [this.motos[j].x, this.motos[j].y]);
    this.#finRonda(ganador);
  }

  #finRonda(ganador) {
    if (ganador) this.puntos[ganador]++;
    this.historial.push(ganador);
    this.resultado = ganador;
    this.fase = 'fin';
    const necesarias = Math.floor(this.config.rondas / 2) + 1;
    if (Math.max(...this.jugadores.map((j) => this.puntos[j])) >= necesarias || this.ronda >= this.config.rondas) {
      clearTimeout(this.timer);
      this.estado = 'terminada';
      this.ganador = ganadorPorPuntos(this.jugadores, this.puntos);
      this.motivoFin = 'puntos';
      return;
    }
    this.hasta = Date.now() + PAUSA_MS;
    this.#programar(PAUSA_MS);
  }

  // Después de restaurar: la ronda en curso vuelve a arrancar con cuenta regresiva.
  reanudar() {
    if (this.estado !== 'jugando') return;
    this.ronda--;
    this.#nuevaRonda();
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
    return { puntos: this.puntos, rondas: this.ronda };
  }

  vistaPara(j) {
    const r = this.rival(j);
    const quien = (x) => (x === null ? null : x === j ? 'yo' : 'rival');
    const moto = (x) => ({ x: this.motos[x].x, y: this.motos[x].y, dir: this.motos[x].dir, viva: this.motos[x].viva });
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      ancho: this.medidas[0],
      alto: this.medidas[1],
      ronda: this.ronda,
      fase: this.fase,
      faltaMs: this.hasta ? Math.max(0, this.hasta - Date.now()) : null,
      motos: { yo: moto(j), rival: moto(r) },
      rastros: { yo: this.rastros[j], rival: this.rastros[r] },
      choque: this.choque,
      resultado: this.fase === 'fin' ? quien(this.resultado) : undefined,
      puntos: { yo: this.puntos[j], rival: this.puntos[r] },
      historial: this.historial.map(quien),
    };
  }
}
