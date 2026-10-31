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
import ConfigGatoRaton from './gatoRaton/Config.jsx';
import JuegoGatoRaton from './gatoRaton/Juego.jsx';
import ConfigUno from './uno/Config.jsx';
import JuegoUno from './uno/Juego.jsx';
import ConfigChinchon from './chinchon/Config.jsx';
import JuegoChinchon from './chinchon/Juego.jsx';
import ConfigTateti from './tateti/Config.jsx';
import JuegoTateti from './tateti/Juego.jsx';
import ConfigCajitas from './cajitas/Config.jsx';
import JuegoCajitas from './cajitas/Juego.jsx';
import ConfigMastermind from './mastermind/Config.jsx';
import JuegoMastermind from './mastermind/Juego.jsx';
import ConfigEscaleras from './escaleras/Config.jsx';
import JuegoEscaleras from './escaleras/Juego.jsx';
import ConfigCaballos from './caballos/Config.jsx';
import JuegoCaballos from './caballos/Juego.jsx';
import ConfigBackgammon from './backgammon/Config.jsx';
import JuegoBackgammon from './backgammon/Juego.jsx';
import ConfigSudoku from './sudoku/Config.jsx';
import JuegoSudoku from './sudoku/Juego.jsx';
import ConfigQuoridor from './quoridor/Config.jsx';
import JuegoQuoridor from './quoridor/Juego.jsx';
import ConfigDibujar from './dibujar/Config.jsx';
import JuegoDibujar from './dibujar/Juego.jsx';
import ConfigMonopoly from './monopoly/Config.jsx';
import JuegoMonopoly from './monopoly/Juego.jsx';
import ConfigTruco from './truco/Config.jsx';
import JuegoTruco from './truco/Juego.jsx';
import ConfigAjedrez from './ajedrez/Config.jsx';
import JuegoAjedrez from './ajedrez/Juego.jsx';
import ConfigReversi from './reversi/Config.jsx';
import JuegoReversi from './reversi/Juego.jsx';
import ConfigTron from './tron/Config.jsx';
import JuegoTron from './tron/Juego.jsx';
import ConfigBotellas from './botellas/Config.jsx';
import JuegoBotellas from './botellas/Juego.jsx';
import ConfigEmojis from './emojis/Config.jsx';
import JuegoEmojis from './emojis/Juego.jsx';
import ConfigSimon from './simon/Config.jsx';
import JuegoSimon from './simon/Juego.jsx';
import ConfigColores from './colores/Config.jsx';
import JuegoColores from './colores/Juego.jsx';

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
  'gato-raton': {
    icono: 'raton',
    texto: 'Laberinto al azar: el ratón busca el queso y el gato lo persigue. Una casilla cada uno.',
    Config: ConfigGatoRaton,
    Juego: JuegoGatoRaton,
  },
  uno: {
    icono: 'uno',
    texto: 'Mismo color o mismo número, +2, +4 y comodines. ¡Acordate de decir UNO!',
    Config: ConfigUno,
    Juego: JuegoUno,
  },
  chinchon: {
    icono: 'chinchon',
    texto: 'Mazo español: ligá escaleras y piernas, cortá con poco y no pases de 100.',
    Config: ConfigChinchon,
    Juego: JuegoChinchon,
  },
  tateti: {
    icono: 'tateti',
    texto: 'Ta te ti clásico o con movimiento, en 3x3 hasta 5x5. Al mejor de N.',
    Config: ConfigTateti,
    Juego: JuegoTateti,
  },
  cajitas: {
    icono: 'cajitas',
    texto: 'Trazá rayitas entre puntos: el que cierra una cajita se la queda y repite.',
    Config: ConfigCajitas,
    Juego: JuegoCajitas,
  },
  mastermind: {
    icono: 'mastermind',
    texto: 'Armá un código de colores y adiviná el del otro con pistas de negras y blancas.',
    Config: ConfigMastermind,
    Juego: JuegoMastermind,
  },
  escaleras: {
    icono: 'escaleras',
    texto: 'Dado, escaleras que suben y serpientes que bajan. Salen distintas cada partida.',
    Config: ConfigEscaleras,
    Juego: JuegoEscaleras,
  },
  caballos: {
    icono: 'caballos',
    texto: 'Los cuatro caballos del mazo español corren: elegí los tuyos y que gane el mejor.',
    Config: ConfigCaballos,
    Juego: JuegoCaballos,
  },
  backgammon: {
    icono: 'backgammon',
    texto: 'Dos dados, 15 fichas: comé, entrá desde la barra y sacalas todas antes.',
    Config: ConfigBackgammon,
    Juego: JuegoBackgammon,
  },
  sudoku: {
    icono: 'sudoku',
    texto: 'El mismo sudoku para los dos, a la vez: gana el primero que lo termina.',
    Config: ConfigSudoku,
    Juego: JuegoSudoku,
  },
  quoridor: {
    icono: 'quoridor',
    texto: 'Cruzá al otro lado y cortale el camino al otro con paredes. Con 1 ficha o 3 tapitas.',
    Config: ConfigQuoridor,
    Juego: JuegoQuoridor,
  },
  dibujar: {
    icono: 'dibujar',
    texto: 'Uno dibuja en vivo y el otro adivina antes de que se acabe el tiempo.',
    Config: ConfigDibujar,
    Juego: JuegoDibujar,
  },
  monopoly: {
    icono: 'monopoly',
    texto: 'Monopoly Lanús: comprá Derqui, el Moonrock, Santa Emilia y La Fortaleza.',
    Config: ConfigMonopoly,
    Juego: JuegoMonopoly,
  },
  truco: {
    icono: 'truco',
    texto: 'Truco a 15 o 30: envido, truco, retruco, vale cuatro y flor opcional.',
    Config: ConfigTruco,
    Juego: JuegoTruco,
  },
  ajedrez: {
    icono: 'ajedrez',
    texto: 'Ajedrez completo, con reloj opcional, enroque, al paso y coronación.',
    Config: ConfigAjedrez,
    Juego: JuegoAjedrez,
  },
  reversi: {
    icono: 'reversi',
    texto: 'Encerrá las fichas del rival para darlas vuelta. Gana el que tiene más.',
    Config: ConfigReversi,
    Juego: JuegoReversi,
  },
  tron: {
    icono: 'tron',
    texto: 'Motos de luz en tiempo real: doblá a tiempo y hacé chocar al otro.',
    Config: ConfigTron,
    Juego: JuegoTron,
  },
  botellas: {
    icono: 'botellas',
    texto: 'La misma mezcla para los dos: ordená los colores antes que el otro.',
    Config: ConfigBotellas,
    Juego: JuegoBotellas,
  },
  emojis: {
    icono: 'emojis',
    texto: 'Contá una canción solo con dibujitos y que el otro la adivine.',
    Config: ConfigEmojis,
    Juego: JuegoEmojis,
  },
  simon: {
    icono: 'simon',
    texto: 'Repetí la secuencia de colores que se alarga. El que se equivoca, pierde.',
    Config: ConfigSimon,
    Juego: JuegoSimon,
  },
  colores: {
    icono: 'colores',
    texto: 'Tocá el color de la tinta, no lo que dice. ¡El más rápido gana la carta!',
    Config: ConfigColores,
    Juego: JuegoColores,
  },
};
