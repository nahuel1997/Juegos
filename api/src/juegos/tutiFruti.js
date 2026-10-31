// Tuti fruti (Basta) de 2 a 8 jugadores: columnas personalizadas, letra al azar por ronda, "¡Basta!" con
// cuenta regresiva para los demás y puntos manuales (los cargan los jugadores al cerrar cada ronda).
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
    this.fuera = new Set(); // los que abandonaron (con más de 2 la partida sigue sin ellos)
    this.timer = null;
    this.notificar = null; // lo pone la sala: avisa cambios que no vienen de una acción (fin del basta)
    this.#nuevaRonda();
  }

  #validar(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    if (this.fuera.has(j)) throw new ErrorJuego('Abandonaste esta partida');
  }

  get activos() {
    return this.jugadores.filter((j) => !this.fuera.has(j));
  }

  get actual() {
    return this.rondas[this.rondas.length - 1];
  }

  #nuevaRonda() {
    const usadas = new Set(this.rondas.map((r) => r.letra));
    const libres = LETRAS.filter((l) => !this.config.excluidas.includes(l) && !usadas.has(l));
    const n = this.config.columnas.length;
    this.rondas.push({
      letra: libres[Math.floor(this.rand() * libres.length)],
      fase: 'escribiendo', // escribiendo | basta | puntuando | cerrada
      respuestas: Object.fromEntries(this.jugadores.map((j) => [j, Array(n).fill('')])),
      puntos: Object.fromEntries(this.jugadores.map((j) => [j, Array(n).fill(null)])),
      bastaPor: null,
      terminaron: new Set(), // los que completaron todo y cantaron (o confirmaron) basta
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
    this.#validar(j);
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
      r.terminaron.add(j);
      if (r.fase === 'basta') {
        // Si ya terminaron todos, no hace falta esperar el reloj.
        if (this.activos.every((x) => r.terminaron.has(x))) this.#cerrar();
        return;
      }
      r.bastaPor = j;
      if (this.config.segundosBasta === 0 || this.activos.every((x) => r.terminaron.has(x))) return this.#cerrar();
      r.fase = 'basta';
      r.hasta = Date.now() + this.config.segundosBasta * 1000;
      this.#programarCierre();
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
      return this.#siConfirmaronTodos();
    }
    throw new ErrorJuego('Acción desconocida');
  }

  #siConfirmaronTodos() {
    const r = this.actual;
    if (r.fase !== 'puntuando' || !this.activos.every((x) => r.confirmados.has(x))) return;
    r.fase = 'cerrada';
    if (this.rondas.length >= this.config.rondas) return this.#terminar();
    this.#nuevaRonda();
  }

  // Cierra la ronda cuando se acaba el tiempo del basta.
  #programarCierre() {
    const r = this.actual;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.actual === r && r.fase === 'basta') {
        this.#cerrar();
        this.notificar?.();
      }
    }, Math.max(0, r.hasta - Date.now()));
    this.timer.unref?.();
  }

  // Después de restaurar una partida guardada: si estaba corriendo un basta, se vuelve a programar.
  reanudar() {
    for (const r of this.rondas) r.terminaron ||= new Set(r.bastaPor ? [r.bastaPor] : []); // guardadas con la versión anterior
    if (this.estado === 'jugando' && this.actual.fase === 'basta') this.#programarCierre();
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
    clearTimeout(this.timer);
    this.estado = 'terminada';
    this.ganador = ganadorPorPuntos(this.activos, this.totales());
    this.motivoFin = 'puntos';
  }

  // Con 2, el que abandona pierde. Con más, queda afuera y el resto sigue (si queda uno solo, gana).
  abandonar(j) {
    this.#validar(j);
    if (this.estado === 'terminada') return;
    this.fuera.add(j);
    if (this.activos.length <= 1) {
      clearTimeout(this.timer);
      this.estado = 'terminada';
      this.ganador = this.activos[0] ?? null;
      this.motivoFin = 'abandono';
      return;
    }
    const r = this.actual;
    if (r.fase === 'basta' && this.activos.every((x) => r.terminaron.has(x))) this.#cerrar();
    this.#siConfirmaronTodos();
  }

  detalleHistorial() {
    return { puntos: this.totales() };
  }

  vistaPara(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    const actual = this.actual;
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      yo: j,
      jugadores: this.jugadores,
      fuera: [...this.fuera],
      fase: actual.fase,
      numero: this.rondas.length,
      bastaPor: actual.bastaPor,
      terminaron: [...actual.terminaron],
      restanteMs: actual.hasta ? Math.max(0, actual.hasta - Date.now()) : null,
      arrancaEnMs: Math.max(0, actual.desde - Date.now()),
      confirmados: [...actual.confirmados],
      totales: this.totales(),
      rondas: this.rondas.map((r) => {
        const abierta = r.fase === 'escribiendo' || r.fase === 'basta';
        return {
          letra: r.letra,
          fase: r.fase,
          mias: r.respuestas[j],
          // Las de los demás recién al cerrar la ronda.
          respuestas: abierta ? { [j]: r.respuestas[j] } : r.respuestas,
          puntos: r.puntos,
        };
      }),
    };
  }
}
