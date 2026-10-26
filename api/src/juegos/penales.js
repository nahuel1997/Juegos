// Penales 1vs1: se alternan pateador y arquero. El que patea elige una zona del arco y el arquero
// elige hacia dónde tirarse, a la vez y sin ver lo del otro. Si coinciden, atajada; si no, gol.
// Serie de N penales cada uno y, si empatan, muerte súbita.
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { tiros: 5, zonas: 6 };

export function validarConfig(c = {}) {
  const zonas = entero(c.zonas ?? CONFIG_DEFECTO.zonas, 6, 9, 'Las zonas');
  if (zonas !== 6 && zonas !== 9) throw new ErrorJuego('El arco se divide en 6 o en 9 zonas');
  return { tiros: entero(c.tiros ?? CONFIG_DEFECTO.tiros, 1, 10, 'Los penales'), zonas };
}

export class PartidaPenales {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'penales';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.primero = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.tiros = []; // { pateador, arquero, patea, ataja, gol }
    this.elecciones = {}; // del penal en curso
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  get pateador() {
    return this.tiros.length % 2 === 0 ? this.primero : this.rival(this.primero);
  }

  #goles(j) {
    return this.tiros.filter((t) => t.pateador === j && t.gol).length;
  }

  #pateados(j) {
    return this.tiros.filter((t) => t.pateador === j).length;
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (tipo !== 'elegir') throw new ErrorJuego('Acción desconocida');
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    const zona = entero(datos.zona, 0, this.config.zonas - 1, 'La zona');
    if (this.elecciones[j] !== undefined) throw new ErrorJuego('Ya elegiste: esperá al otro');
    this.elecciones[j] = zona;
    const pateador = this.pateador;
    const arquero = this.rival(pateador);
    if (this.elecciones[pateador] === undefined || this.elecciones[arquero] === undefined) return;

    const patea = this.elecciones[pateador];
    const ataja = this.elecciones[arquero];
    this.tiros.push({ pateador, arquero, patea, ataja, gol: patea !== ataja });
    this.elecciones = {};
    this.#revisarFinal();
  }

  #revisarFinal() {
    const [a, b] = [this.primero, this.rival(this.primero)];
    const ga = this.#goles(a);
    const gb = this.#goles(b);
    const pa = this.#pateados(a);
    const pb = this.#pateados(b);
    const n = this.config.tiros;
    if (pa <= n && pb <= n) {
      // Serie regular: se corta si uno ya no puede alcanzar al otro.
      if (ga > gb + (n - pb)) return this.#terminar(a);
      if (gb > ga + (n - pa)) return this.#terminar(b);
      if (pa === n && pb === n && ga !== gb) return this.#terminar(ga > gb ? a : b);
    } else if (pa === pb && ga !== gb) {
      // Muerte súbita: se define después de que patean los dos.
      return this.#terminar(ga > gb ? a : b);
    }
  }

  #terminar(ganador) {
    this.estado = 'terminada';
    this.ganador = ganador;
    this.motivoFin = 'goles';
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.estado = 'terminada';
    this.ganador = rival;
    this.motivoFin = 'abandono';
  }

  detalleHistorial() {
    return { goles: Object.fromEntries(this.jugadores.map((j) => [j, this.#goles(j)])) };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const ultimo = this.tiros[this.tiros.length - 1];
    const serie = (x) => this.tiros.filter((t) => t.pateador === x).map((t) => t.gol);
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      numero: this.tiros.length + 1,
      rol: this.pateador === j ? 'pateador' : 'arquero',
      yaElegi: this.elecciones[j] !== undefined,
      rivalEligio: this.elecciones[rival] !== undefined,
      goles: { yo: this.#goles(j), rival: this.#goles(rival) },
      serie: { yo: serie(j), rival: serie(rival) },
      muerteSubita: this.#pateados(this.primero) >= this.config.tiros && this.#pateados(this.rival(this.primero)) >= this.config.tiros,
      ultimo: ultimo && { id: this.tiros.length, pateoYo: ultimo.pateador === j, patea: ultimo.patea, ataja: ultimo.ataja, gol: ultimo.gol },
    };
  }
}
