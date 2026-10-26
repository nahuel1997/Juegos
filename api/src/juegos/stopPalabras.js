// Stop de palabras (duelo tipo Wordle): los dos adivinan la MISMA palabra secreta a la vez.
// Verde = letra en su lugar, amarillo = está en otro lugar, gris = no está. Gana la ronda quien la
// saca en menos intentos (empate en intentos: el más rápido). Del rival solo se ven los colores.
import { ErrorJuego, entero, LETRAS, normalizar, ganadorPorPuntos } from './comun.js';

export const CONFIG_DEFECTO = { largo: 5, intentos: 6, rondas: 3 };

export const PALABRAS = {
  4: 'MATE CASA LUNA BESO MANO GATO VASO PATO ROSA NUBE PISO TREN FOCA LAGO MESA SAPO PALA TORO RATA OSOS SOPA PIPA COCO KIWI PERA LIMA MAPA DEDO OLLA VELA FARO CUNA MOTO AUTO BOTA TAZA CIMA HADA ISLA JUGO LORO MIEL NIDO ORCA PUMA SOFA TELA VINO ZONA AMOR CAMA FLOR HILO RISA DADO'.split(' '),
  5: 'MANGO PERRO GATOS PLAYA NIEVE TIGRE LIBRO SILLA RELOJ PIANO FRESA LIMON MONTE CAMPO BARCO NARIZ BOTAS CIELO VERDE NEGRO BLUSA CABRA CERDO COBRE DULCE FUEGO GLOBO HIELO HUEVO JUEGO LECHE MARCO MUNDO NOCHE PAPEL PLATO QUESO RATON SALSA SUELO TARTA TORTA VIAJE ZORRO AMIGO ARBOL BAILE CARTA DADOS FIDEO GORRA LLAVE MANTA OSITO PATIO PULPO RISAS SIGLO TECHO VACAS YERBA'.split(' '),
  6: 'CAMION CEREZA JIRAFA PELOTA TOMATE BANANA ESPEJO FIESTA GUANTE HELADO LAGUNA MADERA OVEJAS PALOMA SANDIA ZAPATO ABUELA DIENTE ESTUFA FUTBOL GRANJA HUERTA PAJARO PLANTA SOMBRA VIENTO CAMINO CANCHA COCINA DOMINO ESCOBA FLORES GRILLO CABEZA MONEDA PLUMAS TIJERA VELERO ABRIGO BRUJAS CAMISA CHISTE DIBUJO'.split(' '),
  7: 'MANZANA NARANJA TORTUGA VENTANA CABALLO GALLETA DURAZNO RODILLA BOTELLA CUCHARA MOCHILA TECLADO ALFAJOR BUFANDA CAMISAS ESCUELA FAMILIA LIBRERO NOVELAS PALABRA PANTERA PERFUME PLANETA TIBURON VERANOS ZAPATOS ABANICO BALLENA CAMELLO CEBOLLA GORRION LECHUZA MARISCO PEPINOS TORNADO ESPEJOS PAYASOS CHOCLOS CAMPERA PELOTAS'.split(' '),
};

const LISTAS = Object.fromEntries(Object.entries(PALABRAS).map(([n, lista]) => [n, [...new Set(lista)]]));

export function validarConfig(c = {}) {
  return {
    largo: entero(c.largo ?? CONFIG_DEFECTO.largo, 4, 7, 'El largo de la palabra'),
    intentos: entero(c.intentos ?? CONFIG_DEFECTO.intentos, 4, 8, 'Los intentos'),
    rondas: entero(c.rondas ?? CONFIG_DEFECTO.rondas, 1, 7, 'Las rondas'),
  };
}

// Colores de un intento: verde (v), amarillo (a) o gris (g), respetando letras repetidas.
export function colorear(intento, secreta) {
  const res = Array(intento.length).fill('g');
  const sobran = {};
  for (let i = 0; i < secreta.length; i++) {
    if (intento[i] === secreta[i]) res[i] = 'v';
    else sobran[secreta[i]] = (sobran[secreta[i]] || 0) + 1;
  }
  for (let i = 0; i < intento.length; i++) {
    if (res[i] !== 'v' && sobran[intento[i]] > 0) {
      res[i] = 'a';
      sobran[intento[i]]--;
    }
  }
  return res;
}

export class PartidaStopPalabras {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random, palabras } = {}) {
    this.juego = 'stop-palabras';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = { [jugadores[0]]: 0, [jugadores[1]]: 0 };
    this.rondas = [];
    this.palabrasFijas = palabras; // para tests
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
    const usadas = new Set(this.rondas.map((r) => r.palabra));
    const lista = LISTAS[this.config.largo].filter((p) => !usadas.has(p));
    const palabra = this.palabrasFijas?.[this.rondas.length] ?? lista[Math.floor(this.rand() * lista.length)];
    const jugador = () => ({ intentos: [], resuelto: false, terminado: false, ms: null });
    this.rondas.push({
      palabra,
      inicio: Date.now(),
      por: { [this.jugadores[0]]: jugador(), [this.jugadores[1]]: jugador() },
      ganador: undefined, // undefined = en juego; null = nadie
      listos: new Set(),
    });
  }

  accion(j, tipo, datos = {}) {
    const rival = this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    const r = this.actual;
    if (tipo === 'intentar') {
      const yo = r.por[j];
      if (yo.terminado) throw new ErrorJuego('Ya terminaste esta ronda: esperá a tu rival');
      const palabra = normalizar(datos.palabra).replace(/\s/g, '');
      if (palabra.length !== this.config.largo) throw new ErrorJuego(`Tiene que tener ${this.config.largo} letras`);
      if (![...palabra].every((l) => LETRAS.includes(l))) throw new ErrorJuego('Solo letras');
      yo.intentos.push({ palabra, colores: colorear(palabra, r.palabra) });
      if (palabra === r.palabra) {
        yo.resuelto = true;
        yo.terminado = true;
        yo.ms = Date.now() - r.inicio;
      } else if (yo.intentos.length >= this.config.intentos) {
        yo.terminado = true;
      }
      if (r.por[rival].terminado && yo.terminado) this.#cerrarRonda();
      return;
    }
    if (tipo === 'siguiente') {
      if (r.ganador === undefined) throw new ErrorJuego('La ronda no terminó');
      r.listos.add(j);
      if (r.listos.size === 2) this.#nuevaRonda();
      return;
    }
    throw new ErrorJuego('Acción desconocida');
  }

  #cerrarRonda() {
    const r = this.actual;
    const [a, b] = this.jugadores;
    const pa = r.por[a];
    const pb = r.por[b];
    const mejor = (x, y) => {
      if (x.resuelto !== y.resuelto) return x.resuelto ? -1 : 1;
      if (!x.resuelto) return 0;
      if (x.intentos.length !== y.intentos.length) return x.intentos.length - y.intentos.length;
      return x.ms - y.ms;
    };
    const cmp = mejor(pa, pb);
    r.ganador = cmp === 0 ? null : cmp < 0 ? a : b;
    if (r.ganador) this.puntos[r.ganador]++;
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
    const cerrada = r.ganador !== undefined;
    const mio = r.por[j];
    const suyo = r.por[rival];
    // Estado de cada letra del teclado según mis intentos (verde gana a amarillo, amarillo a gris).
    const teclado = {};
    const peso = { g: 1, a: 2, v: 3 };
    for (const it of mio.intentos) {
      [...it.palabra].forEach((l, i) => {
        if (!teclado[l] || peso[it.colores[i]] > peso[teclado[l]]) teclado[l] = it.colores[i];
      });
    }
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      numero: this.rondas.length,
      fase: cerrada ? 'resultado' : 'jugando',
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      inicio: r.inicio,
      ahora: Date.now(),
      mio: { intentos: mio.intentos, resuelto: mio.resuelto, terminado: mio.terminado, ms: mio.ms },
      // Del rival, mientras se juega, solo los colores.
      rival: {
        intentos: suyo.intentos.map((it) => (cerrada ? it : { colores: it.colores })),
        resuelto: suyo.resuelto,
        terminado: suyo.terminado,
        ms: cerrada ? suyo.ms : null,
      },
      palabra: cerrada ? r.palabra : null,
      resultado: cerrada ? (r.ganador === null ? 'empate' : r.ganador === j ? 'gane' : 'perdi') : null,
      teclado,
      listos: [...r.listos],
    };
  }
}
