// Registro de juegos del front: cómo se presenta cada uno (ícono SVG propio), su pantalla de reglas y la de juego.
import ConfigBatalla from './batallaNaval/Config.jsx';
import JuegoBatalla from './batallaNaval/Juego.jsx';
import ConfigAhorcado from './ahorcado/Config.jsx';
import JuegoAhorcado from './ahorcado/Juego.jsx';
import ConfigTuti from './tutiFruti/Config.jsx';
import JuegoTuti from './tutiFruti/Juego.jsx';
import ConfigGenerala from './generala/Config.jsx';
import JuegoGenerala from './generala/Juego.jsx';
import ConfigEscoba from './escoba/Config.jsx';
import JuegoEscoba from './escoba/Juego.jsx';
import ConfigCuatro from './cuatroEnLinea/Config.jsx';
import JuegoCuatro from './cuatroEnLinea/Juego.jsx';
import ConfigPpt from './piedraPapelTijera/Config.jsx';
import JuegoPpt from './piedraPapelTijera/Juego.jsx';
import ConfigDamas from './damas/Config.jsx';
import JuegoDamas from './damas/Juego.jsx';
import ConfigMemo from './memotest/Config.jsx';
import JuegoMemo from './memotest/Juego.jsx';
import ConfigStop from './stopPalabras/Config.jsx';
import JuegoStop from './stopPalabras/Juego.jsx';
import ConfigDomino from './domino/Config.jsx';
import JuegoDomino from './domino/Juego.jsx';
import ConfigLudo from './ludo/Config.jsx';
import JuegoLudo from './ludo/Juego.jsx';
import ConfigQuien from './quienEsQuien/Config.jsx';
import JuegoQuien from './quienEsQuien/Juego.jsx';
import ConfigPool from './pool/Config.jsx';
import JuegoPool from './pool/Juego.jsx';
import ConfigPenales from './penales/Config.jsx';
import JuegoPenales from './penales/Juego.jsx';

export const JUEGOS = {
  'batalla-naval': {
    icono: 'barco',
    texto: 'Ubicá tu flota y hundí la del rival. Tablero y barcos a elección.',
    Config: ConfigBatalla,
    Juego: JuegoBatalla,
  },
  ahorcado: {
    icono: 'horca',
    texto: 'Uno elige la palabra y el otro la adivina letra por letra. Se turnan.',
    Config: ConfigAhorcado,
    Juego: JuegoAhorcado,
  },
  'tuti-fruti': {
    icono: 'sandia',
    texto: 'Letra al azar, columnas a tu gusto, ¡basta! y los puntos los ponen ustedes.',
    Config: ConfigTuti,
    Juego: JuegoTuti,
  },
  generala: {
    icono: 'dados',
    texto: 'Cinco dados, tres tiros por turno. Escalera, full, póker y generala.',
    Config: ConfigGenerala,
    Juego: JuegoGenerala,
  },
  escoba: {
    icono: 'cartas',
    texto: 'Mazo español: levantá cartas que sumen 15. ¡Escoba si limpiás la mesa!',
    Config: ConfigEscoba,
    Juego: JuegoEscoba,
  },
  'cuatro-en-linea': {
    icono: 'cuatro',
    texto: 'Soltá fichas por columna y alineá cuatro antes que el otro.',
    Config: ConfigCuatro,
    Juego: JuegoCuatro,
  },
  'piedra-papel-tijera': {
    icono: 'ppt',
    texto: 'Al mejor de N, eligiendo a la vez. Con variante lagarto y Spock.',
    Config: ConfigPpt,
    Juego: JuegoPpt,
  },
  damas: {
    icono: 'damas',
    texto: 'Comé en diagonal, encadená saltos y coroná tus damas.',
    Config: ConfigDamas,
    Juego: JuegoDamas,
  },
  memotest: {
    icono: 'memo',
    texto: 'Dá vuelta pares por turnos. El que encuentra más, gana.',
    Config: ConfigMemo,
    Juego: JuegoMemo,
  },
  'stop-palabras': {
    icono: 'palabras',
    texto: 'Los dos adivinan la misma palabra: gana quien la saca en menos intentos.',
    Config: ConfigStop,
    Juego: JuegoStop,
  },
  domino: {
    icono: 'domino',
    texto: 'Doble seis: jugá a los extremos, robá del pozo y sumá los puntos del rival.',
    Config: ConfigDomino,
    Juego: JuegoDomino,
  },
  ludo: {
    icono: 'ludo',
    texto: 'Sacá tus cuatro fichas con un 6, comé al otro y llegá primero a la meta.',
    Config: ConfigLudo,
    Juego: JuegoLudo,
  },
  'quien-es-quien': {
    icono: 'quien',
    texto: 'Gatitos o perritos: preguntá y bajá cartas hasta adivinar el secreto del otro.',
    Config: ConfigQuien,
    Juego: JuegoQuien,
  },
  pool: {
    icono: 'pool',
    texto: 'Bola 8 con física de verdad: apuntá, medí la fuerza y metelas todas.',
    Config: ConfigPool,
    Juego: JuegoPool,
  },
  penales: {
    icono: 'penal',
    texto: 'Uno patea y el otro ataja: elegí la esquina y que no te la adivinen.',
    Config: ConfigPenales,
    Juego: JuegoPenales,
  },
};
