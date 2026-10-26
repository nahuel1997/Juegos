// Registro de juegos del front: cómo se presenta cada uno, su pantalla de reglas y la de juego.
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

export const JUEGOS = {
  'batalla-naval': {
    emoji: '🚢',
    texto: 'Ubicá tu flota y hundí la del rival. Tablero y barcos a elección.',
    Config: ConfigBatalla,
    Juego: JuegoBatalla,
  },
  ahorcado: {
    emoji: '🪢',
    texto: 'Uno elige la palabra y el otro la adivina letra por letra. Se turnan.',
    Config: ConfigAhorcado,
    Juego: JuegoAhorcado,
  },
  'tuti-fruti': {
    emoji: '🍉',
    texto: 'Letra al azar, columnas a tu gusto, ¡basta! y los puntos los ponen ustedes.',
    Config: ConfigTuti,
    Juego: JuegoTuti,
  },
  generala: {
    emoji: '🎲',
    texto: 'Cinco dados, tres tiros por turno. Escalera, full, póker y generala.',
    Config: ConfigGenerala,
    Juego: JuegoGenerala,
  },
  escoba: {
    emoji: '🃏',
    texto: 'Mazo español: levantá cartas que sumen 15. ¡Escoba si limpiás la mesa!',
    Config: ConfigEscoba,
    Juego: JuegoEscoba,
  },
};
