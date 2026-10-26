// Ahorcado 1vs1 por rondas: en cada ronda uno elige la palabra (o sale al azar) y el otro la adivina.
// Los roles se alternan. Adivinar suma 1 punto; si lo ahorcan, el punto es para quien eligió.
import { ErrorJuego, entero, LETRAS, normalizar, ganadorPorPuntos } from './comun.js';

export const CONFIG_DEFECTO = { rondas: 4, errores: 6, modo: 'rival' }; // modo: rival | azar

const PALABRAS = [
  'MATE', 'ASADO', 'EMPANADA', 'ALFAJOR', 'DULCE DE LECHE', 'MILANESA', 'CHORIPAN', 'FACTURAS', 'MEDIALUNA',
  'BICICLETA', 'MARIPOSA', 'ELEFANTE', 'JIRAFA', 'COCODRILO', 'PINGUINO', 'CANGURO', 'TORTUGA', 'MURCIELAGO',
  'GUITARRA', 'PIANO', 'BATERIA', 'TROMPETA', 'VIOLIN', 'MONTAÑA', 'CASCADA', 'GLACIAR', 'DESIERTO', 'VOLCAN',
  'BIBLIOTECA', 'HELADERA', 'ESCALERA', 'VENTANA', 'ALMOHADA', 'PARAGUAS', 'SOMBRERO', 'ZAPATILLA', 'BUFANDA',
  'CHOCOLATE', 'FRUTILLA', 'DURAZNO', 'ANANA', 'SANDIA', 'MANDARINA', 'ZANAHORIA', 'BERENJENA', 'CALABAZA',
  'ASTRONAUTA', 'BOMBERO', 'CARPINTERO', 'FOTOGRAFO', 'ARQUITECTA', 'PELUQUERO', 'JARDINERA', 'VETERINARIA',
  'TELESCOPIO', 'MICROONDAS', 'COMPUTADORA', 'AURICULARES', 'TELEFONO', 'RELOJ', 'LINTERNA', 'BRUJULA',
  'ARCOIRIS', 'TORMENTA', 'RELAMPAGO', 'HURACAN', 'PRIMAVERA', 'OTOÑO', 'INVIERNO', 'VERANO', 'MEDIANOCHE',
  'FUTBOL', 'BASQUET', 'NATACION', 'AJEDREZ', 'ESGRIMA', 'PATINETA', 'TOBOGAN', 'CALESITA', 'BARRILETE',
  'CORAZON', 'BESO', 'ABRAZO', 'CARIÑO', 'SONRISA', 'AVENTURA', 'TESORO', 'PIRATA', 'DRAGON', 'UNICORNIO',
];

export function validarConfig(c = {}) {
  const modo = c.modo ?? CONFIG_DEFECTO.modo;
  if (!['rival', 'azar'].includes(modo)) throw new ErrorJuego('Modo desconocido');
  return {
    rondas: entero(c.rondas ?? CONFIG_DEFECTO.rondas, 1, 12, 'Las rondas'),
    errores: entero(c.errores ?? CONFIG_DEFECTO.errores, 4, 10, 'Los errores permitidos'),
    modo,
  };
}

export function validarPalabra(txt) {
  const palabra = normalizar(txt);
  if (palabra.length < 2 || palabra.length > 30) throw new ErrorJuego('La palabra tiene que tener entre 2 y 30 letras');
  if (![...palabra].every((ch) => ch === ' ' || LETRAS.includes(ch))) throw new ErrorJuego('Solo letras y espacios');
  if ([...palabra].filter((ch) => ch !== ' ').length < 2) throw new ErrorJuego('Muy corta');
  return palabra;
}

export class PartidaAhorcado {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'ahorcado';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    // "empieza" = el primero en adivinar.
    this.primero = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = { [jugadores[0]]: 0, [jugadores[1]]: 0 };
    this.rondas = [];
    this.usadas = new Set();
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
    const n = this.rondas.length;
    const adivina = n % 2 === 0 ? this.primero : this.rival(this.primero);
    const ronda = { numero: n + 1, adivina, elige: this.rival(adivina), palabra: null, pista: '', letras: [], errores: 0, fase: 'eligiendo', resultado: null };
    if (this.config.modo === 'azar') {
      const libres = PALABRAS.filter((p) => !this.usadas.has(p));
      ronda.palabra = (libres.length ? libres : PALABRAS)[Math.floor(this.rand() * (libres.length || PALABRAS.length))];
      this.usadas.add(ronda.palabra);
      ronda.fase = 'adivinando';
    }
    this.rondas.push(ronda);
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    const r = this.actual;
    if (tipo === 'palabra') {
      if (r.fase !== 'eligiendo') throw new ErrorJuego('La palabra ya está elegida');
      if (r.elige !== j) throw new ErrorJuego('Esta ronda la palabra la elige tu rival');
      r.palabra = validarPalabra(datos.palabra);
      r.pista = String(datos.pista ?? '').trim().slice(0, 80);
      r.fase = 'adivinando';
      return;
    }
    if (tipo === 'letra' || tipo === 'arriesgar') {
      if (r.fase !== 'adivinando') throw new ErrorJuego('Todavía no hay palabra para adivinar');
      if (r.adivina !== j) throw new ErrorJuego('Esta ronda adivina tu rival');
      if (tipo === 'letra') {
        const letra = normalizar(datos.letra);
        if (!LETRAS.includes(letra)) throw new ErrorJuego('Letra inválida');
        if (r.letras.includes(letra)) throw new ErrorJuego('Esa letra ya la probaste');
        r.letras.push(letra);
        if (!r.palabra.includes(letra)) r.errores++;
        if ([...r.palabra].every((ch) => ch === ' ' || r.letras.includes(ch))) return this.#resolver(true);
      } else {
        const intento = normalizar(datos.palabra);
        if (!intento) throw new ErrorJuego('Escribí la palabra');
        if (intento === r.palabra) return this.#resolver(true);
        r.errores++;
      }
      if (r.errores >= this.config.errores) this.#resolver(false);
      return;
    }
    if (tipo === 'siguiente') {
      if (r.fase !== 'resuelta') throw new ErrorJuego('La ronda no terminó');
      this.#nuevaRonda();
      return;
    }
    throw new ErrorJuego('Acción desconocida');
  }

  #resolver(adivino) {
    const r = this.actual;
    r.fase = 'resuelta';
    r.resultado = adivino ? 'adivino' : 'ahorcado';
    if (adivino) this.puntos[r.adivina]++;
    else if (this.config.modo === 'rival') this.puntos[r.elige]++;
    if (this.rondas.length >= this.config.rondas) {
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
    return { puntos: this.puntos };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const r = this.actual;
    const veTodo = r.fase === 'resuelta' || r.elige === j || this.estado === 'terminada';
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      ronda: {
        numero: r.numero,
        total: this.config.rondas,
        adivinoYo: r.adivina === j,
        fase: r.fase,
        pista: r.pista,
        letras: r.letras,
        errores: r.errores,
        resultado: r.resultado,
        // Lo que se ve de la palabra: "_" para lo no descubierto.
        mostrada: r.palabra ? [...r.palabra].map((ch) => (ch === ' ' || r.letras.includes(ch) ? ch : '_')) : null,
        palabra: veTodo ? r.palabra : null,
      },
      historial: this.rondas
        .filter((x) => x.fase === 'resuelta')
        .map((x) => ({ numero: x.numero, palabra: x.palabra, adivinoYo: x.adivina === j, resultado: x.resultado, errores: x.errores })),
    };
  }
}
