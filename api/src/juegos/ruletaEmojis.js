// Ruleta de emojis (de 2 a 8): la ruleta gira y frena en una combinación de dibujitos que forman una
// palabra o frase (sol + flor = girasol). El primero que la escribe se lleva 3, el segundo 2 y el
// resto que la saque, 1. A mitad de tiempo aparece la primera letra.
import { ErrorJuego, entero, PartidaGrupal, mezclar } from './comun.js';
import { acierta } from './emojis.js';

// [dibujitos (de pictos.jsx), respuesta, otras formas que valen, pista]
export const COMBOS = [
  [['sol', 'flor'], 'Girasol', [], 'Una flor'],
  [['estrella', 'ola'], 'Estrella de mar', [], 'Un animal'],
  [['copa', 'mundo'], 'Copa del Mundo', ['Mundial', 'Copa del mundo de futbol'], 'Fútbol'],
  [['corona', 'mujer'], 'Reina', [], 'Una persona'],
  [['corona', 'hombre'], 'Rey', [], 'Una persona'],
  [['anillo', 'mujer', 'hombre'], 'Casamiento', ['Boda', 'Casarse', 'Matrimonio'], 'Una fiesta'],
  [['regalo', 'fiesta'], 'Cumpleaños', ['Cumple'], 'Una fiesta'],
  [['nieve', 'hombre'], 'Muñeco de nieve', ['Hombre de nieve'], 'Invierno'],
  [['fantasma', 'casa'], 'Casa embrujada', ['Casa encantada'], 'Da miedo'],
  [['edificio', 'nube'], 'Rascacielos', [], 'En la ciudad'],
  [['avion', 'mundo'], 'Vuelta al mundo', ['Viaje', 'Viajar'], 'Viajes'],
  [['tren', 'fantasma'], 'Tren fantasma', [], 'Parque de diversiones'],
  [['cohete', 'luna'], 'Viaje a la Luna', ['Astronauta', 'Llegada a la luna'], 'El espacio'],
  [['gato', 'raton'], 'Tom y Jerry', [], 'Dibujos animados'],
  [['diamante', 'anillo'], 'Compromiso', ['Anillo de compromiso'], 'Antes del casamiento'],
  [['corazon', 'llanto'], 'Corazón roto', ['Desamor'], 'Amor'],
  [['risa', 'llanto'], 'Llorar de risa', [], 'Cuando algo es muy gracioso'],
  [['palmera', 'sol', 'ola'], 'Vacaciones', ['Playa', 'Verano'], 'Enero'],
  [['nieve', 'viento'], 'Invierno', [], 'Una estación'],
  [['flor', 'mariposa'], 'Primavera', [], 'Una estación'],
  [['arbol', 'regalo', 'estrella'], 'Navidad', [], 'Diciembre'],
  [['calavera', 'fantasma'], 'Halloween', ['Noche de brujas'], 'Octubre'],
  [['nota', 'guitarra'], 'Rock', ['Rock and roll', 'Musica'], 'Música'],
  [['microfono', 'fiesta'], 'Karaoke', [], 'Cantar'],
  [['baile', 'noche'], 'Boliche', ['Disco', 'Discoteca', 'Bailar'], 'Salir'],
  [['trofeo', 'pelota'], 'Campeón', ['Campeones'], 'Fútbol'],
  [['bici', 'montania'], 'Mountain bike', ['Ciclismo de montaña'], 'Deporte'],
  [['arriba', 'cohete'], 'Despegue', ['Despegar'], 'El espacio'],
  [['rayo', 'nube'], 'Tormenta', ['Tormenta eléctrica'], 'El clima'],
  [['sol', 'luna'], 'Eclipse', [], 'El cielo'],
  [['estrella', 'noche'], 'Noche estrellada', [], 'El cielo'],
  [['mundo', 'fuego'], 'Calentamiento global', ['Cambio climático'], 'El planeta'],
  [['barco', 'pez'], 'Pesca', ['Pescar', 'Pescador'], 'En el agua'],
  [['casa', 'perro'], 'Cucha', ['Casa del perro', 'Casita del perro'], 'Una mascota'],
  [['dinero', 'arbol'], 'La plata no crece en los árboles', ['Plata no crece en los arboles'], 'Un dicho'],
  [['sol', 'lluvia', 'arcoiris'], 'Arcoíris', ['Arco iris'], 'Después de llover'],
  [['ojo', 'llanto'], 'Lágrima', ['Lagrimas', 'Llorar'], 'La cara'],
  [['cafe', 'sol'], 'Desayuno', ['Mañana', 'Buen día'], 'Temprano'],
  [['corazon', 'beso'], 'Amor', ['Enamorados', 'Novios'], 'San Valentín'],
  [['bebe', 'regalo'], 'Baby shower', [], 'Antes de nacer'],
  [['reloj', 'dinero'], 'El tiempo es oro', ['Tiempo es dinero', 'El tiempo es dinero'], 'Un dicho'],
  [['llave', 'casa'], 'Mudanza', ['Casa nueva', 'Llave de casa'], 'Cambiar de casa'],
  [['angel', 'diablo'], 'Conciencia', ['Bien y mal', 'El bien y el mal'], 'Hombro izquierdo y derecho'],
  [['auto', 'camino'], 'Viaje en auto', ['Ruta', 'Roadtrip', 'Viaje'], 'Vacaciones'],
  [['pez', 'ojo'], 'Buscando a Nemo', ['Nemo'], 'Película'],
  [['barco', 'corazon', 'ola'], 'Titanic', [], 'Película'],
  [['telefono', 'corazon'], 'Amor a distancia', [], 'Amor'],
  [['fuego', 'arbol'], 'Incendio forestal', ['Incendio'], 'Bomberos'],
  [['pajaro', 'arbol'], 'Nido', [], 'Pájaros'],
  [['lluvia', 'paraguas', 'hombre'], 'Día de lluvia', ['Lluvia'], 'El clima'],
];

export const CONFIG_DEFECTO = { rondas: 8, segundos: 40 };
const GIRO_MS = 3200;
const REVELADO_MS = 4000;
const ENTRE_INTENTOS_MS = 900;

export function validarConfig(c = {}) {
  return {
    rondas: entero(c.rondas ?? CONFIG_DEFECTO.rondas, 3, 20, 'Las rondas'),
    segundos: entero(c.segundos ?? CONFIG_DEFECTO.segundos, 15, 90, 'Los segundos'),
  };
}

export const aciertaCombo = (texto, [, respuesta, otras]) => [respuesta, ...otras].some((r) => acierta(texto, r));

export class PartidaRuletaEmojis extends PartidaGrupal {
  constructor(jugadores, config = CONFIG_DEFECTO, { rand = Math.random } = {}) {
    super('ruleta-emojis', jugadores, config);
    this.rand = rand;
    this.orden = mezclar(COMBOS.map((_, i) => i), rand);
    this.numero = 0;
    this.#nueva();
  }

  get combo() {
    return COMBOS[this.orden[(this.numero - 1) % this.orden.length]];
  }

  #nueva() {
    this.numero++;
    this.acertaron = []; // en orden
    this.intentos = {}; // jugador -> último intento (solo lo ve él)
    this.ultimoIntento = {};
    this.irA('girando', GIRO_MS);
  }

  alVencer() {
    if (this.fase === 'girando') {
      this.desde = Date.now();
      return this.irA('adivinando', (this.config.segundos * 1000) / 2);
    }
    // A mitad de tiempo aparece la primera letra.
    if (this.fase === 'adivinando') return this.irA('pista', (this.config.segundos * 1000) / 2);
    if (this.fase === 'pista') return this.irA('revelado', REVELADO_MS);
    if (this.fase === 'revelado') {
      if (this.numero >= this.config.rondas) return this.terminar();
      return this.#nueva();
    }
  }

  accion(j, tipo, datos = {}) {
    this.validar(j);
    if (tipo !== 'adivinar') throw new ErrorJuego('Acción desconocida');
    if (!this.abierta) throw new ErrorJuego('Esperá que frene la ruleta');
    if (this.acertaron.includes(j)) throw new ErrorJuego('Ya la sacaste');
    const ahora = Date.now();
    if (ahora - (this.ultimoIntento[j] || 0) < ENTRE_INTENTOS_MS) throw new ErrorJuego('Más despacio');
    this.ultimoIntento[j] = ahora;
    const texto = String(datos.texto ?? '').slice(0, 60);
    this.intentos[j] = texto;
    if (!aciertaCombo(texto, this.combo)) return { ok: true, acierto: false };
    this.acertaron.push(j);
    this.puntos[j] += Math.max(1, 3 - (this.acertaron.length - 1));
    if (this.activos.every((x) => this.acertaron.includes(x))) this.irA('revelado', REVELADO_MS);
    return { ok: true, acierto: true };
  }

  get abierta() {
    return this.fase === 'adivinando' || this.fase === 'pista';
  }

  alAbandonar() {
    if (this.abierta && this.activos.every((x) => this.acertaron.includes(x))) this.irA('revelado', REVELADO_MS);
  }

  vistaPara(j) {
    const [pictos, respuesta, , pista] = this.combo;
    const revelado = this.fase === 'revelado' || this.estado === 'terminada';
    const loSaque = this.acertaron.includes(j);
    return {
      ...this.vistaBase(j),
      numero: this.numero,
      total: this.config.rondas,
      pictos: this.fase === 'girando' ? null : pictos,
      pista,
      // Cuántas letras tiene cada palabra (y a mitad de tiempo, la primera letra).
      largos: respuesta.split(' ').map((p) => p.length),
      primera: this.fase === 'pista' || revelado ? respuesta[0] : null,
      totalMs: this.abierta ? Math.max(0, this.desde + this.config.segundos * 1000 - Date.now()) : null,
      respuesta: revelado || loSaque ? respuesta : null,
      acertaron: this.acertaron,
      miIntento: this.intentos[j] ?? null,
    };
  }
}
