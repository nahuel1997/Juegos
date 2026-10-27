// Carrera de caballos con mazo español: los cuatro caballos (el 11 de cada palo) corren. Al costado de
// la pista hay una fila de cartas boca abajo. Por turno se da vuelta una carta del mazo y avanza el
// caballo de ese palo. Cuando los cuatro pasaron una carta de la pista, esa se da vuelta y el caballo
// de su palo retrocede uno. Antes de cada carrera cada uno elige sus caballos (por turnos).
// El dueño del caballo que gana se lleva el punto. Gana quien suma más carreras.
import { ErrorJuego, entero, ganadorPorPuntos } from './comun.js';

export const PALOS = ['oros', 'copas', 'espadas', 'bastos'];
const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 10, 12];
export const CONFIG_DEFECTO = { largo: 7, carreras: 3 };

export function validarConfig(c = {}) {
  return {
    largo: entero(c.largo ?? CONFIG_DEFECTO.largo, 4, 10, 'El largo de la pista'),
    carreras: entero(c.carreras ?? CONFIG_DEFECTO.carreras, 1, 9, 'Las carreras'),
  };
}

function mezclar(cartas, rand) {
  for (let i = cartas.length - 1; i > 0; i--) {
    const k = Math.floor(rand() * (i + 1));
    [cartas[i], cartas[k]] = [cartas[k], cartas[i]];
  }
  return cartas;
}

export class PartidaCaballos {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'caballos';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.primero = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.carrera = 0;
    this.historial = [];
    this.#nuevaCarrera();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #nuevaCarrera() {
    this.carrera++;
    this.fase = 'eligiendo'; // eligiendo | corriendo | fin
    this.duenio = Object.fromEntries(PALOS.map((p) => [p, null]));
    // Elige primero uno y después el otro, alternando (1-2-2-1 sería más justo, pero de a dos alcanza alternar).
    this.turno = this.carrera % 2 === 1 ? this.primero : this.rival(this.primero);
    const rand = this.rand ?? Math.random;
    const mazo = mezclar(PALOS.flatMap((palo) => NUMEROS.map((numero) => ({ id: `${palo}-${numero}`, palo, numero }))), rand);
    this.pista = mazo.splice(0, this.config.largo).map((c) => ({ ...c, vista: false }));
    this.mazo = mazo;
    this.pos = Object.fromEntries(PALOS.map((p) => [p, 0]));
    this.ultima = null;
    this.vueltas = 0;
    this.listosSiguiente = new Set();
    this.ganadorCarrera = null;
  }

  accion(j, tipo, datos = {}) {
    const rival = this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    if (tipo === 'siguiente') {
      if (this.fase !== 'fin') throw new ErrorJuego('La carrera no terminó');
      this.listosSiguiente.add(j);
      if (this.listosSiguiente.size === 2) this.#nuevaCarrera();
      return;
    }
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');

    if (tipo === 'elegir') {
      if (this.fase !== 'eligiendo') throw new ErrorJuego('Ya están corriendo');
      if (!PALOS.includes(datos.palo)) throw new ErrorJuego('Ese caballo no existe');
      if (this.duenio[datos.palo]) throw new ErrorJuego('Ese caballo ya tiene dueño');
      this.duenio[datos.palo] = j;
      this.ultima = { por: j, tipo: 'eligio', palo: datos.palo, n: ++this.vueltas };
      this.turno = rival;
      if (PALOS.every((p) => this.duenio[p])) this.fase = 'corriendo';
      return;
    }

    if (tipo !== 'carta') throw new ErrorJuego('Acción desconocida');
    if (this.fase !== 'corriendo') throw new ErrorJuego('Todavía están eligiendo caballos');
    if (!this.mazo.length) {
      // Se terminó el mazo (muy raro): se mezclan de nuevo las que salieron.
      this.mazo = mezclar(this.salieron ?? [], this.rand ?? Math.random);
      this.salieron = [];
    }
    const carta = this.mazo.pop();
    (this.salieron ??= []).push(carta);
    this.pos[carta.palo]++;
    const retrocede = [];
    // Cada carta de la pista que ya pasaron los cuatro se da vuelta y hace retroceder a su palo.
    for (let i = 0; i < this.pista.length; i++) {
      const p = this.pista[i];
      if (!p.vista && PALOS.every((x) => this.pos[x] > i)) {
        p.vista = true;
        this.pos[p.palo] = Math.max(0, this.pos[p.palo] - 1);
        retrocede.push({ palo: p.palo, carta: i });
      }
    }
    this.ultima = { por: j, tipo: 'carta', carta, retrocede, n: ++this.vueltas };
    const llego = PALOS.find((p) => this.pos[p] > this.config.largo);
    if (llego) return this.#fin(llego);
    this.turno = rival;
  }

  #fin(palo) {
    this.fase = 'fin';
    this.turno = null;
    const dueno = this.duenio[palo];
    this.puntos[dueno]++;
    this.ganadorCarrera = palo;
    this.historial.push({ palo, dueno });
    const necesarias = Math.floor(this.config.carreras / 2) + 1;
    if (this.puntos[dueno] >= necesarias || this.carrera >= this.config.carreras) {
      this.estado = 'terminada';
      this.ganador = ganadorPorPuntos(this.jugadores, this.puntos);
      this.motivoFin = 'puntos';
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
    return { puntos: this.puntos, carreras: this.carrera };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const quien = (x) => (x == null ? null : x === j ? 'yo' : 'rival');
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      carrera: this.carrera,
      fase: this.fase,
      turno: this.turno,
      duenio: Object.fromEntries(PALOS.map((p) => [p, quien(this.duenio[p])])),
      pista: this.pista.map((c) => (c.vista ? c : { vista: false })),
      pos: this.pos,
      mazo: this.mazo.length,
      ultima: this.ultima && { ...this.ultima, por: quien(this.ultima.por) },
      ganadorCarrera: this.ganadorCarrera,
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      historial: this.historial.map((h) => ({ ...h, dueno: quien(h.dueno) })),
      listosSiguiente: [...this.listosSiguiente].map(quien),
    };
  }
}
