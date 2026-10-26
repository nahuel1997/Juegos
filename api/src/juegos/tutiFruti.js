// Tuti fruti (Basta) 1vs1: columnas personalizadas, letra al azar por ronda, "¡Basta!" con cuenta
// regresiva para el rival y puntos manuales (los cargan los jugadores al cerrar cada ronda).
import { ErrorJuego, entero, LETRAS, ganadorPorPuntos } from './comun.js';

export const CONFIG_DEFECTO = {
  columnas: ['Nombre', 'Animal', 'Color', 'Fruta o verdura', 'País o ciudad', 'Cosa'],
  rondas: 5,
  segundosBasta: 10,
  cuentaAtras: 5, // segundos para ver la letra y prepararse antes de poder escribir
  excluidas: ['K', 'Ñ', 'Q', 'W', 'X', 'Y', 'Z'],
};

const MAX_RESPUESTA = 40;

export function validarConfig(c = {}) {
  const columnas = (Array.isArray(c.columnas) ? c.columnas : CONFIG_DEFECTO.columnas)
    .map((x) => String(x ?? '').trim().slice(0, 24))
    .filter(Boolean);
  if (columnas.length < 1 || columnas.length > 12) throw new ErrorJuego('Tiene que haber entre 1 y 12 columnas');
  if (new Set(columnas.map((x) => x.toLowerCase())).size !== columnas.length) throw new ErrorJuego('Hay columnas repetidas');
  const excluidas = [...new Set((Array.isArray(c.excluidas) ? c.excluidas : CONFIG_DEFECTO.excluidas).map(String))].filter((l) => LETRAS.includes(l));
  const config = {
    columnas,
    rondas: entero(c.rondas ?? CONFIG_DEFECTO.rondas, 1, 20, 'Las rondas'),
    segundosBasta: entero(c.segundosBasta ?? CONFIG_DEFECTO.segundosBasta, 0, 60, 'Los segundos del basta'),
    cuentaAtras: entero(c.cuentaAtras ?? CONFIG_DEFECTO.cuentaAtras, 0, 30, 'La cuenta antes de cada letra'),
    excluidas,
  };
  if (LETRAS.length - excluidas.length < config.rondas) throw new ErrorJuego('Quedan menos letras que rondas: sacá letras excluidas');
  return config;
}

export class PartidaTutiFruti {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    this.juego = 'tuti-fruti';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.rondas = [];
    this.timer = null;
    this.notificar = null; // lo pone la sala: avisa cambios que no vienen de una acción (fin del basta)
    this.#nuevaRonda();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  get actual() {
    return this.rondas[this.rondas.length - 1];
  }

  #nuevaRonda() {
    const usadas = new Set(this.rondas.map((r) => r.letra));
    const libres = LETRAS.filter((l) => !this.config.excluidas.includes(l) && !usadas.has(l));
    const n = this.config.columnas.length;
    const vacio = () => Array(n).fill('');
    this.rondas.push({
      letra: libres[Math.floor(this.rand() * libres.length)],
      fase: 'escribiendo', // escribiendo | basta | puntuando | cerrada
      respuestas: { [this.jugadores[0]]: vacio(), [this.jugadores[1]]: vacio() },
      puntos: { [this.jugadores[0]]: Array(n).fill(null), [this.jugadores[1]]: Array(n).fill(null) },
      bastaPor: null,
      hasta: null,
      desde: Date.now() + this.config.cuentaAtras * 1000, // antes de esto no se puede escribir
      confirmados: new Set(),
    });
  }

  #guardar(j, valores) {
    if (!Array.isArray(valores)) return;
    const r = this.actual;
    r.respuestas[j] = this.config.columnas.map((_, i) => String(valores[i] ?? '').replace(/\s+/g, ' ').slice(0, MAX_RESPUESTA));
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    const r = this.actual;
    const escribiendo = r.fase === 'escribiendo' || r.fase === 'basta';

    if ((tipo === 'respuestas' || tipo === 'basta') && escribiendo && Date.now() < r.desde) {
      throw new ErrorJuego('Esperá que termine la cuenta para escribir');
    }
    if (tipo === 'respuestas') {
      if (!escribiendo) throw new ErrorJuego('La ronda ya se cerró');
      return this.#guardar(j, datos.valores);
    }
    if (tipo === 'basta') {
      if (!escribiendo) throw new ErrorJuego('La ronda ya se cerró');
      this.#guardar(j, datos.valores);
      if (r.respuestas[j].some((x) => !x.trim())) throw new ErrorJuego('Completá todas las columnas para cantar basta');
      if (r.fase === 'basta') {
        if (r.bastaPor !== j) this.#cerrar(); // los dos terminaron: no hace falta esperar
        return;
      }
      r.bastaPor = j;
      if (this.config.segundosBasta === 0) return this.#cerrar();
      r.fase = 'basta';
      r.hasta = Date.now() + this.config.segundosBasta * 1000;
      this.timer = setTimeout(() => {
        if (this.actual === r && r.fase === 'basta') {
          this.#cerrar();
          this.notificar?.();
        }
      }, this.config.segundosBasta * 1000);
      this.timer.unref?.();
      return;
    }
    if (tipo === 'puntos') {
      if (r.fase !== 'puntuando') throw new ErrorJuego('Todavía no se puede puntuar');
      if (!this.jugadores.includes(datos.jugador)) throw new ErrorJuego('Jugador inválido');
      const col = entero(datos.col, 0, this.config.columnas.length - 1, 'La columna');
      const valor = datos.valor === null || datos.valor === '' ? null : entero(datos.valor, 0, 100, 'Los puntos');
      r.puntos[datos.jugador][col] = valor;
      r.confirmados.clear(); // si alguien cambia un puntaje, hay que volver a confirmar
      return;
    }
    if (tipo === 'confirmar') {
      if (r.fase !== 'puntuando') throw new ErrorJuego('Todavía no se puede confirmar');
      r.confirmados.add(j);
      if (r.confirmados.size < 2) return;
      r.fase = 'cerrada';
      if (this.rondas.length >= this.config.rondas) return this.#terminar();
      return this.#nuevaRonda();
    }
    throw new ErrorJuego('Acción desconocida');
  }

  #cerrar() {
    clearTimeout(this.timer);
    this.timer = null;
    const r = this.actual;
    r.fase = 'puntuando';
    r.hasta = null;
  }

  totales() {
    const suma = (j) => this.rondas.reduce((t, r) => t + r.puntos[j].reduce((s, p) => s + (p || 0), 0), 0);
    return Object.fromEntries(this.jugadores.map((j) => [j, suma(j)]));
  }

  #terminar() {
    this.estado = 'terminada';
    this.ganador = ganadorPorPuntos(this.jugadores, this.totales());
    this.motivoFin = 'puntos';
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
    return { puntos: this.totales() };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const totales = this.totales();
    const actual = this.actual;
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      fase: actual.fase,
      numero: this.rondas.length,
      bastaPor: actual.bastaPor,
      restanteMs: actual.hasta ? Math.max(0, actual.hasta - Date.now()) : null,
      arrancaEnMs: Math.max(0, actual.desde - Date.now()),
      confirmados: [...actual.confirmados],
      totales: { yo: totales[j], rival: totales[rival] },
      rondas: this.rondas.map((r) => {
        const abierta = r.fase === 'escribiendo' || r.fase === 'basta';
        return {
          letra: r.letra,
          fase: r.fase,
          mias: r.respuestas[j],
          rival: abierta ? null : r.respuestas[rival], // las del rival recién al cerrar la ronda
          puntos: { yo: r.puntos[j], rival: r.puntos[rival] },
        };
      }),
    };
  }
}
