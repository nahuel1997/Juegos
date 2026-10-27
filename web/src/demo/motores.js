// La lógica real de los juegos (la misma del server) para correr la simulación de la vista previa en
// el navegador. Se carga aparte (import dinámico) para no agrandar la página principal.
import * as batallaNaval from '../../../api/src/juegos/batallaNaval.js';
import * as ahorcado from '../../../api/src/juegos/ahorcado.js';
import * as tutiFruti from '../../../api/src/juegos/tutiFruti.js';
import * as generala from '../../../api/src/juegos/generala.js';
import * as escoba from '../../../api/src/juegos/escoba.js';
import * as cuatroEnLinea from '../../../api/src/juegos/cuatroEnLinea.js';
import * as ppt from '../../../api/src/juegos/piedraPapelTijera.js';
import * as damas from '../../../api/src/juegos/damas.js';
import * as memotest from '../../../api/src/juegos/memotest.js';
import * as stopPalabras from '../../../api/src/juegos/stopPalabras.js';
import * as domino from '../../../api/src/juegos/domino.js';
import * as ludo from '../../../api/src/juegos/ludo.js';
import * as quien from '../../../api/src/juegos/quienEsQuien.js';
import * as pool from '../../../api/src/juegos/pool.js';
import * as penales from '../../../api/src/juegos/penales.js';
import * as gatoRaton from '../../../api/src/juegos/gatoRaton.js';
import * as uno from '../../../api/src/juegos/uno.js';
import * as chinchon from '../../../api/src/juegos/chinchon.js';
import * as tateti from '../../../api/src/juegos/tateti.js';
import * as cajitas from '../../../api/src/juegos/cajitas.js';
import * as mastermind from '../../../api/src/juegos/mastermind.js';
import * as escaleras from '../../../api/src/juegos/escaleras.js';
import * as caballos from '../../../api/src/juegos/caballos.js';
import * as backgammon from '../../../api/src/juegos/backgammon.js';
import * as sudoku from '../../../api/src/juegos/sudoku.js';
import * as quoridor from '../../../api/src/juegos/quoridor.js';
import * as dibujar from '../../../api/src/juegos/dibujar.js';
import * as monopoly from '../../../api/src/juegos/monopoly.js';

export { jugadaBot } from '../../../api/src/bots.js';

const m = (mod, Clase, demo = {}) => ({ mod, Clase, demo });

// `demo`: ajustes de reglas para que la simulación sea corta y se vea lo importante.
export const MOTORES = {
  'batalla-naval': m(batallaNaval, batallaNaval.PartidaBatallaNaval, { filas: 8, columnas: 8 }),
  ahorcado: m(ahorcado, ahorcado.PartidaAhorcado, { rondas: 2 }),
  'tuti-fruti': m(tutiFruti, tutiFruti.PartidaTutiFruti),
  generala: m(generala, generala.PartidaGenerala),
  escoba: m(escoba, escoba.PartidaEscoba),
  'cuatro-en-linea': m(cuatroEnLinea, cuatroEnLinea.PartidaCuatroEnLinea),
  'piedra-papel-tijera': m(ppt, ppt.PartidaPiedraPapelTijera),
  damas: m(damas, damas.PartidaDamas),
  memotest: m(memotest, memotest.PartidaMemotest, { pares: 8 }),
  'stop-palabras': m(stopPalabras, stopPalabras.PartidaStopPalabras, { rondas: 1 }),
  domino: m(domino, domino.PartidaDomino),
  ludo: m(ludo, ludo.PartidaLudo),
  'quien-es-quien': m(quien, quien.PartidaQuienEsQuien),
  pool: m(pool, pool.PartidaPool),
  penales: m(penales, penales.PartidaPenales),
  'gato-raton': m(gatoRaton, gatoRaton.PartidaGatoRaton, { lado: 9 }),
  uno: m(uno, uno.PartidaUno),
  chinchon: m(chinchon, chinchon.PartidaChinchon),
  tateti: m(tateti, tateti.PartidaTateti),
  cajitas: m(cajitas, cajitas.PartidaCajitas),
  mastermind: m(mastermind, mastermind.PartidaMastermind, { azar: true }),
  escaleras: m(escaleras, escaleras.PartidaEscaleras),
  caballos: m(caballos, caballos.PartidaCaballos, { carreras: 1 }),
  backgammon: m(backgammon, backgammon.PartidaBackgammon, { puntos: 1 }),
  sudoku: m(sudoku, sudoku.PartidaSudoku, { dificultad: 'facil', errores: 0 }),
  quoridor: m(quoridor, quoridor.PartidaQuoridor, { lado: 7, paredes: 5 }),
  dibujar: m(dibujar, dibujar.PartidaDibujar, { turnos: 1, tiempo: 30 }),
  monopoly: m(monopoly, monopoly.PartidaMonopoly),
};
