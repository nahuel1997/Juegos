// ¿Quién es quién? 1vs1 con gatitos o perritos. Cada uno tiene un personaje secreto. En tu turno
// le escribís una pregunta al otro (como un chat) y él responde sí o no mirando su personaje; con
// eso bajás las cartas que descartás. También podés arriesgar; y si te queda uno solo en pie, al
// empezar tu turno siguiente se arriesga solo. Los personajes se dibujan en el front.
import { ErrorJuego, entero } from './comun.js';

export const CONFIG_DEFECTO = { tema: 'gatitos', cantidad: 24, errarPierde: true };

const g = (nombre, color, patron, tamano, ojos, accesorio) => ({ nombre, color, patron, tamano, ojos, accesorio });
export const GATITOS = [
  g('Michi', 'naranja', 'atigrado', 'gordito', 'verde', 'ninguno'),
  g('Pelusa', 'blanco', 'liso', 'gordito', 'azul', 'mono'),
  g('Garfield', 'naranja', 'atigrado', 'gordito', 'amarillo', 'ninguno'),
  g('Tom', 'gris', 'liso', 'normal', 'amarillo', 'collar'),
  g('Luna', 'negro', 'liso', 'flaquito', 'amarillo', 'ninguno'),
  g('Simba', 'crema', 'atigrado', 'normal', 'verde', 'collar'),
  g('Nala', 'crema', 'liso', 'flaquito', 'azul', 'mono'),
  g('Bigotes', 'gris', 'atigrado', 'normal', 'verde', 'anteojos'),
  g('Manchas', 'blanco', 'manchas', 'normal', 'verde', 'collar'),
  g('Copito', 'blanco', 'liso', 'flaquito', 'azul', 'ninguno'),
  g('Tigre', 'naranja', 'atigrado', 'flaquito', 'verde', 'collar'),
  g('Oreo', 'negro', 'bicolor', 'normal', 'verde', 'ninguno'),
  g('Canela', 'marron', 'atigrado', 'normal', 'amarillo', 'mono'),
  g('Pantera', 'negro', 'liso', 'gordito', 'verde', 'collar'),
  g('Mostaza', 'naranja', 'bicolor', 'normal', 'amarillo', 'anteojos'),
  g('Nube', 'gris', 'bicolor', 'gordito', 'azul', 'ninguno'),
  g('Chispa', 'marron', 'manchas', 'flaquito', 'verde', 'ninguno'),
  g('Félix', 'negro', 'bicolor', 'flaquito', 'amarillo', 'mono'),
  g('Mimi', 'crema', 'manchas', 'gordito', 'azul', 'collar'),
  g('Sombra', 'gris', 'liso', 'flaquito', 'verde', 'ninguno'),
  g('Kiwi', 'marron', 'liso', 'gordito', 'verde', 'anteojos'),
  g('Coco', 'marron', 'bicolor', 'flaquito', 'azul', 'collar'),
  g('Rayo', 'crema', 'atigrado', 'gordito', 'amarillo', 'ninguno'),
  g('Gordo', 'naranja', 'manchas', 'gordito', 'azul', 'anteojos'),
];

const p = (nombre, raza, color, patron, tamano, orejas, nariz, accesorio) => ({ nombre, raza, color, patron, tamano, orejas, nariz, accesorio });
export const PERRITOS = [
  p('Lola', 'pitbull', 'caramelo', 'bicolor', 'grande', 'caidas', 'rosa', 'collar'), // caramelo y blanca, nariz rosa
  p('Rocky', 'pitbull', 'gris', 'bicolor', 'grande', 'caidas', 'negra', 'ninguno'),
  p('Toby', 'caniche', 'blanco', 'liso', 'chico', 'caidas', 'negra', 'mono'),
  p('Fifí', 'caniche', 'negro', 'liso', 'chico', 'caidas', 'negra', 'ninguno'),
  p('Salchi', 'salchicha', 'marron', 'liso', 'chico', 'caidas', 'negra', 'collar'),
  p('Pancho', 'salchicha', 'negro', 'bicolor', 'chico', 'caidas', 'negra', 'panuelo'),
  p('Max', 'labrador', 'dorado', 'liso', 'grande', 'caidas', 'negra', 'panuelo'),
  p('Negra', 'labrador', 'negro', 'liso', 'grande', 'caidas', 'negra', 'collar'),
  p('Chiqui', 'chihuahua', 'caramelo', 'liso', 'chico', 'paradas', 'negra', 'mono'),
  p('Taco', 'chihuahua', 'blanco', 'manchas', 'chico', 'paradas', 'rosa', 'ninguno'),
  p('Tanque', 'bulldog', 'blanco', 'manchas', 'mediano', 'caidas', 'negra', 'collar'),
  p('Gordi', 'bulldog', 'caramelo', 'bicolor', 'mediano', 'caidas', 'rosa', 'ninguno'),
  p('Goldie', 'golden', 'dorado', 'liso', 'grande', 'caidas', 'negra', 'ninguno'),
  p('Miel', 'golden', 'caramelo', 'liso', 'grande', 'caidas', 'negra', 'mono'),
  p('Pecas', 'dalmata', 'blanco', 'manchas', 'grande', 'caidas', 'negra', 'collar'),
  p('Lunares', 'dalmata', 'blanco', 'manchas', 'mediano', 'caidas', 'rosa', 'panuelo'),
  p('Snoopy', 'beagle', 'marron', 'bicolor', 'mediano', 'caidas', 'negra', 'ninguno'),
  p('Bruno', 'beagle', 'caramelo', 'bicolor', 'mediano', 'caidas', 'negra', 'panuelo'),
  p('Nieve', 'husky', 'gris', 'bicolor', 'grande', 'paradas', 'negra', 'ninguno'),
  p('Lobo', 'husky', 'negro', 'bicolor', 'grande', 'paradas', 'negra', 'collar'),
  p('Arrugas', 'pug', 'caramelo', 'liso', 'chico', 'caidas', 'negra', 'mono'),
  p('Pug', 'pug', 'negro', 'liso', 'chico', 'caidas', 'negra', 'panuelo'),
  p('Rex', 'ovejero', 'marron', 'bicolor', 'grande', 'paradas', 'negra', 'panuelo'),
  p('Duque', 'ovejero', 'negro', 'bicolor', 'grande', 'paradas', 'negra', 'ninguno'),
];

// Preguntas sugeridas (para no tener que escribir todo): atributo → texto de cada valor.
export const PREGUNTAS = {
  gatitos: {
    color: { titulo: 'Color', valores: { naranja: '¿Es naranja?', gris: '¿Es gris?', negro: '¿Es negro?', blanco: '¿Es blanco?', crema: '¿Es color crema?', marron: '¿Es marrón?' } },
    patron: { titulo: 'Pelaje', valores: { liso: '¿Es de un solo color?', atigrado: '¿Es atigrado?', manchas: '¿Tiene manchas?', bicolor: '¿Tiene pecho y patas blancas?' } },
    tamano: { titulo: 'Tamaño', valores: { flaquito: '¿Es flaquito?', normal: '¿Es de tamaño normal?', gordito: '¿Es gordito?' } },
    ojos: { titulo: 'Ojos', valores: { verde: '¿Tiene ojos verdes?', azul: '¿Tiene ojos azules?', amarillo: '¿Tiene ojos amarillos?' } },
    accesorio: { titulo: 'Accesorio', valores: { ninguno: '¿No tiene nada puesto?', collar: '¿Tiene collar?', mono: '¿Tiene moño?', anteojos: '¿Tiene anteojos?' } },
  },
  perritos: {
    raza: {
      titulo: 'Raza',
      valores: {
        pitbull: '¿Es pitbull?', caniche: '¿Es caniche?', salchicha: '¿Es salchicha?', labrador: '¿Es labrador?', chihuahua: '¿Es chihuahua?', bulldog: '¿Es bulldog?',
        golden: '¿Es golden?', dalmata: '¿Es dálmata?', beagle: '¿Es beagle?', husky: '¿Es husky?', pug: '¿Es pug?', ovejero: '¿Es ovejero?',
      },
    },
    color: { titulo: 'Color', valores: { caramelo: '¿Es color caramelo?', negro: '¿Es negro?', blanco: '¿Es blanco?', marron: '¿Es marrón?', gris: '¿Es gris?', dorado: '¿Es dorado?' } },
    patron: { titulo: 'Pelaje', valores: { liso: '¿Es de un solo color?', manchas: '¿Tiene manchas?', bicolor: '¿Tiene partes blancas?' } },
    tamano: { titulo: 'Tamaño', valores: { chico: '¿Es chiquito?', mediano: '¿Es mediano?', grande: '¿Es grande?' } },
    orejas: { titulo: 'Orejas', valores: { paradas: '¿Tiene las orejas paradas?', caidas: '¿Tiene las orejas caídas?' } },
    nariz: { titulo: 'Nariz', valores: { rosa: '¿Tiene la nariz rosa?', negra: '¿Tiene la nariz negra?' } },
    accesorio: { titulo: 'Accesorio', valores: { ninguno: '¿No tiene nada puesto?', collar: '¿Tiene collar?', panuelo: '¿Tiene pañuelo?', mono: '¿Tiene moño?' } },
  },
};

export function validarConfig(c = {}) {
  const tema = c.tema ?? CONFIG_DEFECTO.tema;
  if (!['gatitos', 'perritos'].includes(tema)) throw new ErrorJuego('Tema desconocido');
  const cantidad = entero(c.cantidad ?? CONFIG_DEFECTO.cantidad, 12, 24, 'La cantidad de personajes');
  if (cantidad % 4 !== 0) throw new ErrorJuego('La cantidad tiene que ser 12, 16, 20 o 24');
  return { tema, cantidad, errarPierde: c.errarPierde !== false };
}

export class PartidaQuienEsQuien {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'quien-es-quien';
    this.jugadores = [...jugadores];
    this.config = config;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    const base = config.tema === 'perritos' ? PERRITOS : GATITOS;
    // Si se juega con menos, se eligen al azar (pero Lola siempre está en la versión perruna).
    let elegidos = [...base].sort(() => rand() - 0.5).slice(0, config.cantidad);
    if (config.tema === 'perritos' && !elegidos.some((x) => x.nombre === 'Lola')) elegidos[0] = base[0];
    elegidos = elegidos.sort((x, y) => x.nombre.localeCompare(y.nombre));
    this.personajes = elegidos;
    const a = Math.floor(rand() * elegidos.length);
    let b = Math.floor(rand() * (elegidos.length - 1));
    if (b >= a) b++;
    this.secreto = { [jugadores[0]]: a, [jugadores[1]]: b };
    this.tumbados = { [jugadores[0]]: [], [jugadores[1]]: [] };
    this.turno = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.historial = []; // { por, texto, respuesta: true|false|null } | { por, arriesgo, acierto, automatico }
    this.pendiente = null; // pregunta esperando el sí o no del otro: { por, texto }
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  accion(j, tipo, datos = {}) {
    const rival = this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');

    if (tipo === 'tumbar') {
      // Bajar o levantar cartas del propio tablero: se puede en cualquier momento.
      const indices = (Array.isArray(datos.indices) ? datos.indices : [datos.indice]).map(Number).filter((i) => Number.isInteger(i) && i >= 0 && i < this.personajes.length);
      const set = new Set(this.tumbados[j]);
      for (const i of indices) (datos.levantar ? set.delete(i) : set.add(i));
      this.tumbados[j] = [...set].sort((x, y) => x - y);
      return;
    }
    if (tipo === 'responder') {
      if (!this.pendiente || this.pendiente.por !== rival) throw new ErrorJuego('No hay pregunta para responder');
      if (typeof datos.si !== 'boolean') throw new ErrorJuego('Respondé sí o no');
      this.historial[this.historial.length - 1].respuesta = datos.si;
      this.pendiente = null;
      // Respondió: ahora le toca a él.
      this.turno = j;
      this.#revisarUltimoEnPie(j);
      return;
    }
    if (this.turno !== j) throw new ErrorJuego('No es tu turno');
    if (this.pendiente) throw new ErrorJuego('Esperá que te respondan');

    if (tipo === 'preguntar') {
      const texto = String(datos.texto ?? '').replace(/\s+/g, ' ').trim().slice(0, 140);
      if (texto.length < 3) throw new ErrorJuego('Escribí una pregunta');
      this.pendiente = { por: j, texto };
      this.historial.push({ por: j, texto, respuesta: null });
      return;
    }
    if (tipo === 'arriesgar') {
      const i = Number(datos.indice);
      if (!Number.isInteger(i) || !this.personajes[i]) throw new ErrorJuego('Personaje inválido');
      const acierto = i === this.secreto[rival];
      this.historial.push({ por: j, arriesgo: this.personajes[i].nombre, acierto });
      if (acierto) return this.#terminar(j, 'adivino');
      if (this.config.errarPierde) return this.#terminar(rival, 'erro');
      this.tumbados[j] = [...new Set([...this.tumbados[j], i])];
      this.turno = rival;
      this.#revisarUltimoEnPie(rival);
      return;
    }
    throw new ErrorJuego('Acción desconocida');
  }

  // Si al empezar su turno le queda un solo personaje en pie, se arriesga solo con ése.
  #revisarUltimoEnPie(j) {
    const enPie = this.personajes.map((_, i) => i).filter((i) => !this.tumbados[j].includes(i));
    if (enPie.length !== 1) return;
    const rival = this.rival(j);
    const acierto = enPie[0] === this.secreto[rival];
    this.historial.push({ por: j, arriesgo: this.personajes[enPie[0]].nombre, acierto, automatico: true });
    if (acierto) return this.#terminar(j, 'adivino');
    if (this.config.errarPierde) return this.#terminar(rival, 'erro');
    this.tumbados[j] = this.tumbados[j].filter((i) => i !== enPie[0]).concat(enPie[0]);
    this.turno = rival;
  }

  #terminar(ganador, motivo) {
    this.estado = 'terminada';
    this.ganador = ganador;
    this.motivoFin = motivo;
  }

  abandonar(j) {
    const rival = this.rival(j);
    if (this.estado === 'terminada') return;
    this.#terminar(rival, 'abandono');
  }

  detalleHistorial() {
    return { preguntas: this.historial.length, tema: this.config.tema };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const terminada = this.estado === 'terminada';
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      tema: this.config.tema,
      personajes: this.personajes,
      preguntas: PREGUNTAS[this.config.tema],
      miSecreto: this.secreto[j],
      secretoRival: terminada ? this.secreto[rival] : null,
      tumbados: this.tumbados[j],
      tumbadosRival: this.tumbados[rival].length,
      turno: this.turno,
      pendiente: this.pendiente && { texto: this.pendiente.texto, mia: this.pendiente.por === j },
      historial: this.historial.map((h) => ({ ...h, mia: h.por === j })),
    };
  }
}
