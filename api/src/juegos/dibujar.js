// Dibujá y adiviná 1vs1: por turnos, uno elige una palabra entre tres y la dibuja en vivo; el otro la
// tiene que adivinar escribiendo antes de que se acabe el tiempo. Cuanto más rápido, más puntos (para
// los dos). Después se cambian. Gana el que suma más.
import { ErrorJuego, entero, normalizar, ganadorPorPuntos } from './comun.js';

export const PALABRAS = [
  'mate', 'termo', 'bombilla', 'asado', 'parrilla', 'empanada', 'alfajor', 'dulce de leche', 'medialuna', 'pizza',
  'milanesa', 'choripán', 'helado', 'torta', 'banana', 'manzana', 'sandía', 'frutilla', 'huevo', 'queso',
  'pelota', 'arco', 'cancha', 'camiseta', 'botines', 'silbato', 'trofeo', 'bicicleta', 'patineta', 'raqueta',
  'colectivo', 'tren', 'avión', 'barco', 'auto', 'moto', 'helicóptero', 'cohete', 'semáforo', 'puente',
  'perro', 'gato', 'caballo', 'vaca', 'chancho', 'gallina', 'pato', 'pez', 'tiburón', 'pulpo',
  'jirafa', 'elefante', 'león', 'mono', 'serpiente', 'tortuga', 'mariposa', 'araña', 'abeja', 'caracol',
  'casa', 'escuela', 'hospital', 'iglesia', 'castillo', 'carpa', 'faro', 'plaza', 'calesita', 'tobogán',
  'sol', 'luna', 'estrella', 'nube', 'lluvia', 'rayo', 'arcoíris', 'montaña', 'volcán', 'playa',
  'árbol', 'flor', 'cactus', 'hoja', 'hongo', 'fuego', 'nieve', 'muñeco de nieve', 'isla', 'río',
  'guitarra', 'piano', 'tambor', 'trompeta', 'micrófono', 'televisor', 'celular', 'computadora', 'auriculares', 'cámara',
  'reloj', 'anteojos', 'sombrero', 'gorra', 'zapatilla', 'paraguas', 'mochila', 'llave', 'candado', 'tijera',
  'lápiz', 'libro', 'cuaderno', 'regla', 'goma', 'escoba', 'balde', 'cama', 'silla', 'mesa',
  'heladera', 'lámpara', 'vela', 'escalera', 'ventana', 'puerta', 'inodoro', 'ducha', 'cepillo de dientes', 'espejo',
  'corona', 'espada', 'escudo', 'dragón', 'fantasma', 'robot', 'extraterrestre', 'sirena', 'pirata', 'bruja',
  'dormir', 'correr', 'nadar', 'bailar', 'cocinar', 'llorar', 'reír', 'saltar', 'pescar', 'volar',
  'globo', 'regalo', 'cumpleaños', 'barrilete', 'dado', 'carta', 'ajedrez', 'yoyó', 'trompo', 'burbuja',
];

export const CONFIG_DEFECTO = { turnos: 3, tiempo: 80 };

export function validarConfig(c = {}) {
  return {
    turnos: entero(c.turnos ?? CONFIG_DEFECTO.turnos, 1, 6, 'Los turnos por jugador'),
    tiempo: entero(c.tiempo ?? CONFIG_DEFECTO.tiempo, 30, 180, 'El tiempo'),
  };
}

const MAX_TRAZOS = 600;
const MAX_PUNTOS = 400;

// Distancia de edición (para avisar "¡casi!").
function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let k = 1; k <= b.length; k++) d[0][k] = k;
  for (let i = 1; i <= a.length; i++) {
    for (let k = 1; k <= b.length; k++) d[i][k] = Math.min(d[i - 1][k] + 1, d[i][k - 1] + 1, d[i - 1][k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

export class PartidaDibujar {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'dibujar';
    this.jugadores = [...jugadores];
    this.config = config;
    this.rand = rand;
    this.estado = 'jugando';
    this.ganador = null;
    this.motivoFin = null;
    this.puntos = Object.fromEntries(jugadores.map((j) => [j, 0]));
    this.primero = empieza ?? (rand() < 0.5 ? jugadores[0] : jugadores[1]);
    this.usadas = [];
    this.turnoN = 0;
    this.timer = null;
    this.notificar = null;
    this.#nuevoTurno();
  }

  rival(j) {
    if (!this.jugadores.includes(j)) throw new ErrorJuego('No jugás en esta partida');
    return this.jugadores[0] === j ? this.jugadores[1] : this.jugadores[0];
  }

  #nuevoTurno() {
    this.turnoN++;
    this.dibuja = this.turnoN % 2 === 1 ? this.primero : this.rival(this.primero);
    const rand = this.rand ?? Math.random;
    const libres = PALABRAS.filter((p) => !this.usadas.includes(p));
    this.opciones = [];
    while (this.opciones.length < 3) {
      const p = libres.splice(Math.floor(rand() * libres.length), 1)[0];
      this.opciones.push(p);
    }
    this.fase = 'eligiendo'; // eligiendo | dibujando | revelado
    this.palabra = null;
    this.trazos = [];
    this.intentos = [];
    this.hasta = null;
    this.acierto = null;
    this.listosSiguiente = new Set();
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    const dibujo = j === this.dibuja;

    if (tipo === 'siguiente') {
      if (this.fase !== 'revelado') throw new ErrorJuego('El turno no terminó');
      this.listosSiguiente.add(j);
      if (this.listosSiguiente.size === 2) {
        if (this.turnoN >= this.config.turnos * 2) return this.#terminar();
        this.#nuevoTurno();
      }
      return;
    }
    if (tipo === 'elegir') {
      if (!dibujo) throw new ErrorJuego('Elige la palabra el que dibuja');
      if (this.fase !== 'eligiendo') throw new ErrorJuego('Ya elegiste');
      if (!this.opciones.includes(datos.palabra)) throw new ErrorJuego('Esa palabra no estaba entre las opciones');
      this.palabra = datos.palabra;
      this.usadas.push(datos.palabra);
      this.fase = 'dibujando';
      this.hasta = Date.now() + this.config.tiempo * 1000;
      this.#programar();
      return;
    }
    if (tipo === 'trazo' || tipo === 'borrar' || tipo === 'deshacer') {
      if (!dibujo) throw new ErrorJuego('No te toca dibujar');
      if (this.fase !== 'dibujando') throw new ErrorJuego('No estás dibujando');
      if (tipo === 'borrar') { this.trazos = []; return; }
      if (tipo === 'deshacer') {
        // Deshace el último trazo completo (los pedacitos de un mismo trazo comparten id).
        const ultimo = this.trazos[this.trazos.length - 1]?.id;
        this.trazos = this.trazos.filter((t) => t.id !== ultimo);
        return;
      }
      if (this.trazos.length >= MAX_TRAZOS) throw new ErrorJuego('El dibujo ya tiene demasiados trazos: borrá un poco');
      const puntos = (Array.isArray(datos.puntos) ? datos.puntos : []).slice(0, MAX_PUNTOS)
        .map((p) => [Math.max(0, Math.min(1000, Math.round(Number(p?.[0]) || 0))), Math.max(0, Math.min(1000, Math.round(Number(p?.[1]) || 0)))]);
      if (!puntos.length) return;
      const color = /^#[0-9a-f]{6}$/i.test(datos.color) ? datos.color : '#222222';
      const grosor = Math.max(1, Math.min(40, Number(datos.grosor) || 4));
      this.trazos.push({ id: String(datos.id ?? this.trazos.length).slice(0, 20), puntos, color, grosor });
      return;
    }
    if (tipo === 'adivinar') {
      if (dibujo) throw new ErrorJuego('Vos sos el que dibuja');
      if (this.fase !== 'dibujando') throw new ErrorJuego('Ahora no se puede adivinar');
      const texto = String(datos.texto ?? '').trim().slice(0, 40);
      if (!texto) return;
      const a = normalizar(texto);
      const b = normalizar(this.palabra);
      if (a === b) {
        const restante = Math.max(0, this.hasta - Date.now()) / 1000;
        const valor = Math.max(10, Math.round((100 * restante) / this.config.tiempo));
        this.puntos[j] += valor;
        this.puntos[this.dibuja] += Math.round(valor / 2);
        this.acierto = { segundos: Math.round(this.config.tiempo - restante), puntos: valor, dibujo: Math.round(valor / 2) };
        this.intentos.push({ texto, ok: true });
        return this.#revelar();
      }
      this.intentos.push({ texto, casi: b.length > 3 && distancia(a, b) <= 1 });
      return;
    }
    throw new ErrorJuego('Acción desconocida');
  }

  #programar() {
    clearTimeout(this.timer);
    const turno = this.turnoN;
    this.timer = setTimeout(() => {
      if (this.turnoN === turno && this.fase === 'dibujando' && this.estado === 'jugando') {
        this.#revelar();
        this.notificar?.();
      }
    }, Math.max(0, this.hasta - Date.now()));
    this.timer.unref?.();
  }

  // Después de restaurar una partida guardada.
  reanudar() {
    if (this.estado === 'jugando' && this.fase === 'dibujando') this.#programar();
  }

  #revelar() {
    clearTimeout(this.timer);
    this.timer = null;
    this.fase = 'revelado';
    this.hasta = null;
  }

  #terminar() {
    this.estado = 'terminada';
    this.ganador = ganadorPorPuntos(this.jugadores, this.puntos);
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
    return { puntos: this.puntos, turnos: this.turnoN };
  }

  vistaPara(j) {
    const rival = this.rival(j);
    const dibujo = j === this.dibuja;
    const ver = dibujo || this.fase === 'revelado';
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      turnoN: this.turnoN,
      totalTurnos: this.config.turnos * 2,
      dibujoYo: dibujo,
      fase: this.fase,
      opciones: dibujo && this.fase === 'eligiendo' ? this.opciones : null,
      palabra: ver ? this.palabra : null,
      // Al que adivina se le muestran solo los espacios (y cuántas letras tiene cada palabra).
      molde: this.palabra ? this.palabra.split(' ').map((p) => p.length) : null,
      trazos: this.trazos,
      intentos: this.intentos,
      hasta: this.hasta,
      ahora: Date.now(),
      acierto: this.acierto,
      puntos: { yo: this.puntos[j], rival: this.puntos[rival] },
      listosSiguiente: [...this.listosSiguiente].map((x) => (x === j ? 'yo' : 'rival')),
    };
  }
}
