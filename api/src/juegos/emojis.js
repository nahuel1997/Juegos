// Adiviná la canción con dibujitos 1vs1: por turnos, uno elige una canción entre tres y la cuenta solo
// con dibujitos (los de la app, nada de texto). El otro la tiene que adivinar escribiendo antes de que
// se acabe el tiempo. Mientras adivina, el que la armó puede sumar hasta 2 dibujitos de ayuda.
// Cuanto más rápido, más puntos (la mitad para el que la armó). Después se cambian.
import { ErrorJuego, entero, normalizar, ganadorPorPuntos } from './comun.js';

// Los dibujitos disponibles (se dibujan en web/src/juegos/emojis/pictos.jsx).
export const PICTOS = [
  'corazon', 'corazonRoto', 'fuego', 'sol', 'luna', 'estrella', 'nube', 'lluvia', 'rayo', 'arcoiris',
  'nieve', 'viento', 'ola', 'palmera', 'montania', 'flor', 'cactus', 'arbol', 'mariposa', 'pajaro',
  'pez', 'gato', 'perro', 'raton', 'tortuga', 'auto', 'avion', 'tren', 'barco', 'bici',
  'cohete', 'casa', 'edificio', 'puente', 'camino', 'nota', 'guitarra', 'microfono', 'beso', 'ojo',
  'risa', 'llanto', 'diablo', 'angel', 'calavera', 'fantasma', 'corona', 'trofeo', 'copa', 'diamante',
  'dinero', 'reloj', 'telefono', 'paraguas', 'regalo', 'pelota', 'bandera', 'mundo', 'arriba', 'abajo',
  'baile', 'mujer', 'hombre', 'bebe', 'anillo', 'llave', 'puerta', 'fiesta', 'cafe', 'noche',
];

// Canciones (título y artista) con una pista armada, que usa el bot para contarla y para adivinar.
export const CANCIONES = [
  { titulo: 'Corazón partío', artista: 'Alejandro Sanz', pista: ['corazonRoto', 'llanto'] },
  { titulo: 'La bicicleta', artista: 'Carlos Vives y Shakira', pista: ['bici', 'ola', 'sol'] },
  { titulo: 'Despacito', artista: 'Luis Fonsi', pista: ['tortuga', 'beso', 'baile'] },
  { titulo: 'Mariposa tecknicolor', artista: 'Fito Páez', pista: ['mariposa', 'arcoiris'] },
  { titulo: 'Rayando el sol', artista: 'Maná', pista: ['rayo', 'sol', 'llanto'] },
  { titulo: 'Labios compartidos', artista: 'Maná', pista: ['beso', 'mujer', 'hombre', 'hombre'] },
  { titulo: 'Corazón espinado', artista: 'Santana y Maná', pista: ['corazon', 'cactus', 'guitarra'] },
  { titulo: 'Tren al sur', artista: 'Los Prisioneros', pista: ['tren', 'abajo'] },
  { titulo: 'Tusa', artista: 'Karol G y Nicki Minaj', pista: ['corazonRoto', 'llanto', 'fiesta'] },
  { titulo: 'Waka waka', artista: 'Shakira', pista: ['pelota', 'mundo', 'trofeo'] },
  { titulo: 'Gatúbela', artista: 'Karol G', pista: ['gato', 'mujer', 'noche'] },
  { titulo: 'Ojos así', artista: 'Shakira', pista: ['ojo', 'ojo', 'baile'] },
  { titulo: 'Un velero llamado libertad', artista: 'José Luis Perales', pista: ['barco', 'viento', 'pajaro'] },
  { titulo: 'Fuego de noche, nieve de día', artista: 'Ricky Martin', pista: ['fuego', 'noche', 'nieve', 'sol'] },
  { titulo: 'Tren del cielo', artista: 'Soledad', pista: ['tren', 'nube', 'arriba'] },
  { titulo: 'Dale alegría a mi corazón', artista: 'Fito Páez', pista: ['risa', 'corazon'] },
  { titulo: 'Ciudad de pobres corazones', artista: 'Fito Páez', pista: ['edificio', 'corazonRoto', 'corazonRoto'] },
  { titulo: 'El amor después del amor', artista: 'Fito Páez', pista: ['corazon', 'reloj', 'corazon'] },
  { titulo: 'Puente', artista: 'Gustavo Cerati', pista: ['puente', 'nota'] },
  { titulo: 'Ojitos lindos', artista: 'Bad Bunny', pista: ['ojo', 'estrella', 'corazon'] },
  { titulo: 'Muchachos', artista: 'La Mosca', pista: ['pelota', 'bandera', 'estrella', 'trofeo'] },
  { titulo: 'Rata de dos patas', artista: 'Paquita la del Barrio', pista: ['raton', 'hombre', 'diablo'] },
  { titulo: 'El tiburón', artista: 'Proyecto Uno', pista: ['pez', 'ola', 'baile'] },
  { titulo: 'Umbrella', artista: 'Rihanna', pista: ['paraguas', 'lluvia'] },
  { titulo: 'Purple rain', artista: 'Prince', pista: ['lluvia', 'guitarra'] },
  { titulo: 'Here comes the sun', artista: 'The Beatles', pista: ['sol', 'arriba'] },
  { titulo: 'A sky full of stars', artista: 'Coldplay', pista: ['noche', 'estrella', 'estrella', 'estrella'] },
  { titulo: 'Viva la vida', artista: 'Coldplay', pista: ['corona', 'risa'] },
  { titulo: 'Yellow submarine', artista: 'The Beatles', pista: ['barco', 'abajo', 'ola', 'sol'] },
  { titulo: 'Highway to hell', artista: 'AC/DC', pista: ['camino', 'fuego', 'diablo'] },
  { titulo: 'Hotel California', artista: 'Eagles', pista: ['edificio', 'palmera', 'sol'] },
  { titulo: 'We are the champions', artista: 'Queen', pista: ['trofeo', 'corona', 'pelota'] },
  { titulo: 'Thriller', artista: 'Michael Jackson', pista: ['fantasma', 'calavera', 'baile'] },
  { titulo: 'Diamonds', artista: 'Rihanna', pista: ['diamante', 'estrella', 'noche'] },
  { titulo: 'Firework', artista: 'Katy Perry', pista: ['cohete', 'fuego', 'noche'] },
  { titulo: 'Bailando', artista: 'Enrique Iglesias', pista: ['baile', 'corazon', 'nota'] },
  { titulo: 'La bamba', artista: 'Ritchie Valens', pista: ['baile', 'guitarra', 'fiesta'] },
  { titulo: 'Mil horas', artista: 'Los Abuelos de la Nada', pista: ['reloj', 'reloj', 'llanto'] },
  { titulo: 'Gasolina', artista: 'Daddy Yankee', pista: ['auto', 'fuego', 'baile'] },
  { titulo: 'Rosa, rosa', artista: 'Sandro', pista: ['flor', 'flor', 'corazon'] },
  { titulo: 'Gracias a la vida', artista: 'Mercedes Sosa', pista: ['risa', 'sol', 'corazon'] },
  { titulo: 'Casa en el aire', artista: 'Carlos Vives', pista: ['casa', 'nube', 'viento'] },
  { titulo: 'Clavado en un bar', artista: 'Maná', pista: ['copa', 'llanto', 'reloj'] },
  { titulo: 'Me enamoré', artista: 'Shakira', pista: ['corazon', 'ojo', 'anillo'] },
  { titulo: 'Felices los 4', artista: 'Maluma', pista: ['risa', 'mujer', 'hombre', 'hombre'] },
  { titulo: 'Cucurrucucú paloma', artista: 'Caetano Veloso', pista: ['pajaro', 'llanto'] },
  { titulo: 'Llorando se fue', artista: 'Los Kjarkas', pista: ['llanto', 'camino', 'mujer'] },
  { titulo: 'La gota fría', artista: 'Carlos Vives', pista: ['lluvia', 'nieve'] },
  { titulo: 'Bichota', artista: 'Karol G', pista: ['mujer', 'corona', 'fuego'] },
  { titulo: 'Provenza', artista: 'Karol G', pista: ['flor', 'avion', 'beso'] },
  { titulo: 'Columbia', artista: 'Quevedo', pista: ['avion', 'mundo', 'baile'] },
  { titulo: 'Te boté', artista: 'Nio García y Casper', pista: ['puerta', 'corazonRoto', 'fiesta'] },
  { titulo: 'Livin la vida loca', artista: 'Ricky Martin', pista: ['fiesta', 'diablo', 'baile'] },
  { titulo: 'Every breath you take', artista: 'The Police', pista: ['ojo', 'viento', 'reloj'] },
  { titulo: 'Shape of you', artista: 'Ed Sheeran', pista: ['mujer', 'corazon', 'baile'] },
  { titulo: 'Rolling in the deep', artista: 'Adele', pista: ['ola', 'abajo', 'corazonRoto'] },
  { titulo: 'Girasoles', artista: 'Ricardo Arjona', pista: ['flor', 'sol', 'sol'] },
  { titulo: 'Amor clasificado', artista: 'Rodrigo', pista: ['corazon', 'dinero', 'telefono'] },
  { titulo: 'Lamento boliviano', artista: 'Enanitos Verdes', pista: ['llanto', 'nota', 'montania'] },
  { titulo: 'Matador', artista: 'Los Fabulosos Cadillacs', pista: ['calavera', 'baile', 'diablo'] },
];

export const CONFIG_DEFECTO = { turnos: 3, tiempo: 75 };

export function validarConfig(c = {}) {
  return {
    turnos: entero(c.turnos ?? CONFIG_DEFECTO.turnos, 1, 6, 'Los turnos por jugador'),
    tiempo: entero(c.tiempo ?? CONFIG_DEFECTO.tiempo, 30, 180, 'El tiempo'),
  };
}

const MAX_PICTOS = 10;
const EXTRA = 2; // dibujitos de ayuda mientras el otro adivina

function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let k = 1; k <= b.length; k++) d[0][k] = k;
  for (let i = 1; i <= a.length; i++) {
    for (let k = 1; k <= b.length; k++) d[i][k] = Math.min(d[i - 1][k] + 1, d[i][k - 1] + 1, d[i - 1][k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

// Comparación tolerante: sin acentos ni signos, y se perdona un error cada 6 letras.
const limpiar = (t) => normalizar(t).replace(/[^A-ZÑ0-9 ]/g, '').replace(/\s+/g, ' ').trim();
export function acierta(intento, titulo) {
  const a = limpiar(intento); const b = limpiar(titulo);
  if (!a) return false;
  return a === b || distancia(a, b) <= Math.floor(b.length / 6);
}

export class PartidaEmojis {
  constructor(jugadores, config = CONFIG_DEFECTO, { empieza, rand = Math.random } = {}) {
    this.juego = 'emojis';
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
    this.arma = this.turnoN % 2 === 1 ? this.primero : this.rival(this.primero);
    const rand = this.rand ?? Math.random;
    const libres = CANCIONES.map((_, i) => i).filter((i) => !this.usadas.includes(i));
    this.opciones = [];
    while (this.opciones.length < 3 && libres.length) this.opciones.push(libres.splice(Math.floor(rand() * libres.length), 1)[0]);
    this.cancion = null;
    this.pictos = [];
    this.extra = 0;
    this.intentos = [];
    this.acierto = null;
    this.fase = 'eligiendo';
    this.hasta = null;
    this.listosSiguiente = new Set();
  }

  accion(j, tipo, datos = {}) {
    this.rival(j);
    if (this.estado !== 'jugando') throw new ErrorJuego('La partida terminó');
    const armo = j === this.arma;
    if (tipo === 'siguiente') {
      if (this.fase !== 'revelado') throw new ErrorJuego('El turno no terminó');
      this.listosSiguiente.add(j);
      if (this.listosSiguiente.size < 2) return;
      if (this.turnoN >= this.config.turnos * 2) return this.#terminar();
      return this.#nuevoTurno();
    }
    if (tipo === 'elegir') {
      if (!armo || this.fase !== 'eligiendo') throw new ErrorJuego('Ahora no podés elegir');
      const i = entero(datos.opcion, 0, this.opciones.length - 1, 'La opción');
      this.cancion = this.opciones[i];
      this.usadas.push(this.cancion);
      this.fase = 'armando';
      return;
    }
    if (tipo === 'picto' || tipo === 'quitar') {
      if (!armo || !['armando', 'adivinando'].includes(this.fase)) throw new ErrorJuego('Ahora no podés cambiar la pista');
      if (tipo === 'quitar') {
        if (this.fase !== 'armando') throw new ErrorJuego('La pista ya se mandó');
        this.pictos.pop();
        return;
      }
      const id = String(datos.id);
      if (!PICTOS.includes(id)) throw new ErrorJuego('Ese dibujito no existe');
      if (this.fase === 'adivinando') {
        if (this.extra >= EXTRA) throw new ErrorJuego(`Solo ${EXTRA} dibujitos de ayuda`);
        this.extra++;
      } else if (this.pictos.length >= MAX_PICTOS) throw new ErrorJuego(`Hasta ${MAX_PICTOS} dibujitos`);
      this.pictos.push({ id, extra: this.fase === 'adivinando' });
      return;
    }
    if (tipo === 'listo') {
      if (!armo || this.fase !== 'armando') throw new ErrorJuego('Ahora no');
      if (!this.pictos.length) throw new ErrorJuego('Poné al menos un dibujito');
      this.fase = 'adivinando';
      this.hasta = Date.now() + this.config.tiempo * 1000;
      this.#programar();
      return;
    }
    if (tipo === 'adivinar') {
      if (armo || this.fase !== 'adivinando') throw new ErrorJuego('Ahora no podés adivinar');
      const texto = String(datos.texto ?? '').slice(0, 80).trim();
      if (!texto) return;
      if (this.intentos.length >= 40) throw new ErrorJuego('Demasiados intentos');
      const c = CANCIONES[this.cancion];
      if (acierta(texto, c.titulo)) {
        const restante = Math.max(0, this.hasta - Date.now()) / 1000;
        const valor = Math.max(10, Math.round((100 * restante) / this.config.tiempo));
        this.puntos[j] += valor;
        this.puntos[this.arma] += Math.round(valor / 2);
        this.acierto = { segundos: Math.round(this.config.tiempo - restante), puntos: valor, armo: Math.round(valor / 2) };
        this.intentos.push({ texto, ok: true });
        return this.#revelar();
      }
      const a = limpiar(texto); const b = limpiar(c.titulo);
      this.intentos.push({ texto, casi: b.length > 4 && distancia(a, b) <= Math.floor(b.length / 6) + 2 });
      return;
    }
    if (tipo === 'pasar') {
      if (armo || this.fase !== 'adivinando') throw new ErrorJuego('Ahora no');
      return this.#revelar();
    }
    throw new ErrorJuego('Acción desconocida');
  }

  #programar() {
    clearTimeout(this.timer);
    const turno = this.turnoN;
    this.timer = setTimeout(() => {
      if (this.turnoN === turno && this.fase === 'adivinando' && this.estado === 'jugando') {
        this.#revelar();
        this.notificar?.();
      }
    }, Math.max(0, this.hasta - Date.now()));
    this.timer.unref?.();
  }

  reanudar() {
    if (this.estado === 'jugando' && this.fase === 'adivinando') this.#programar();
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
    const r = this.rival(j);
    const armo = j === this.arma;
    const c = this.cancion !== null ? CANCIONES[this.cancion] : null;
    const verCancion = armo || this.fase === 'revelado';
    return {
      estado: this.estado,
      ganador: this.ganador,
      motivoFin: this.motivoFin,
      config: this.config,
      turno: this.turnoN,
      totalTurnos: this.config.turnos * 2,
      armoYo: armo,
      fase: this.fase,
      opciones: armo && this.fase === 'eligiendo' ? this.opciones.map((i) => ({ titulo: CANCIONES[i].titulo, artista: CANCIONES[i].artista })) : null,
      cancion: c && verCancion ? { titulo: c.titulo, artista: c.artista } : null,
      // Pista del artista para el que adivina: cuántas palabras tiene el título.
      palabras: c ? limpiar(c.titulo).split(' ').map((p) => p.length) : null,
      pictos: this.fase === 'armando' && !armo ? [] : this.pictos,
      cantidad: this.pictos.length,
      extraQuedan: EXTRA - this.extra,
      intentos: this.intentos,
      acierto: this.acierto,
      hasta: this.hasta,
      ahora: Date.now(),
      puntos: { yo: this.puntos[j], rival: this.puntos[r] },
      listosSiguiente: [...this.listosSiguiente].map((x) => (x === j ? 'yo' : 'rival')),
    };
  }
}
