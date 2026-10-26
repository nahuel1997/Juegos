import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PartidaCuatroEnLinea, validarConfig as cfg4 } from '../src/juegos/cuatroEnLinea.js';
import { PartidaPiedraPapelTijera, validarConfig as cfgPpt } from '../src/juegos/piedraPapelTijera.js';
import { PartidaDamas, validarConfig as cfgDamas } from '../src/juegos/damas.js';
import { PartidaMemotest, validarConfig as cfgMemo } from '../src/juegos/memotest.js';
import { PartidaStopPalabras, colorear, validarConfig as cfgStop, PALABRAS } from '../src/juegos/stopPalabras.js';
import { serializar, deserializar } from '../src/persistencia.js';

const J = ['iara', 'nahuel'];

// ---------- Cuatro en línea ----------
test('cuatro en línea: gana en vertical, horizontal y diagonal', () => {
  const p = new PartidaCuatroEnLinea(J, cfg4({}), { empieza: 'iara' });
  for (let i = 0; i < 3; i++) {
    p.accion('iara', 'soltar', { col: 0 });
    p.accion('nahuel', 'soltar', { col: 1 });
  }
  p.accion('iara', 'soltar', { col: 0 });
  assert.equal(p.ganador, 'iara');
  assert.equal(p.linea.length, 4);

  const d = new PartidaCuatroEnLinea(J, cfg4({}), { empieza: 'iara' });
  // Escalera para la diagonal: I en (5,0),(4,1),(3,2),(2,3).
  const jugadas = [[0, 'iara'], [1, 'nahuel'], [1, 'iara'], [2, 'nahuel'], [2, 'iara'], [3, 'nahuel'], [2, 'iara'], [3, 'nahuel'], [3, 'iara'], [6, 'nahuel'], [3, 'iara']];
  for (const [col, j] of jugadas) d.accion(j, 'soltar', { col });
  assert.equal(d.ganador, 'iara');
});

test('cuatro en línea: columna llena, turno y empate por tablero lleno', () => {
  const p = new PartidaCuatroEnLinea(J, cfg4({ filas: 4, columnas: 4, enLinea: 4 }), { empieza: 'iara' });
  assert.throws(() => p.accion('nahuel', 'soltar', { col: 0 }), /No es tu turno/);
  // Patrón que llena 4x4 sin cuatro en línea.
  const orden = [0, 1, 0, 1, 1, 0, 1, 0, 2, 3, 2, 3, 3, 2, 3, 2];
  orden.forEach((col, i) => {
    if (i === 8) assert.throws(() => p.accion(p.turno, 'soltar', { col: 0 }), /llena/);
    p.accion(p.turno, 'soltar', { col });
  });
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, null);
  assert.throws(() => cfg4({ filas: 4, columnas: 4, enLinea: 6 }), /No entran/);
});

// ---------- Piedra, papel o tijera ----------
test('ppt: no se ve lo del otro hasta que eligen los dos; empates no cuentan', () => {
  const p = new PartidaPiedraPapelTijera(J, cfgPpt({ mejorDe: 3 }));
  p.accion('iara', 'elegir', { jugada: 'piedra' });
  const v = p.vistaPara('nahuel');
  assert.equal(v.rivalEligio, true);
  const { opciones, ...resto } = v;
  assert.equal(JSON.stringify(resto).includes('piedra'), false);
  assert.ok(opciones.includes('piedra'));
  assert.throws(() => p.accion('iara', 'elegir', { jugada: 'papel' }), /Ya elegiste/);
  p.accion('nahuel', 'elegir', { jugada: 'piedra' }); // empate
  assert.deepEqual(p.vistaPara('iara').puntos, { yo: 0, rival: 0 });
  for (let i = 0; i < 2; i++) {
    p.accion('iara', 'elegir', { jugada: 'papel' });
    p.accion('nahuel', 'elegir', { jugada: 'piedra' });
  }
  assert.equal(p.ganador, 'iara');
  assert.throws(() => cfgPpt({ mejorDe: 4 }), /impar/);
});

test('ppt: variante con lagarto y Spock', () => {
  const p = new PartidaPiedraPapelTijera(J, cfgPpt({ mejorDe: 1, variante: 'spock' }));
  assert.throws(() => new PartidaPiedraPapelTijera(J, cfgPpt({})).accion('iara', 'elegir', { jugada: 'spock' }), /inválida/);
  p.accion('iara', 'elegir', { jugada: 'spock' });
  p.accion('nahuel', 'elegir', { jugada: 'tijera' });
  assert.equal(p.ganador, 'iara');
});

// ---------- Damas ----------
function damasVacio(config = {}) {
  const p = new PartidaDamas(J, cfgDamas(config), { empieza: 'iara' });
  p.tablero = p.tablero.map((f) => f.map(() => null));
  return p;
}

test('damas: arranque, movimientos de peón y turno', () => {
  const p = new PartidaDamas(J, cfgDamas({}), { empieza: 'iara' });
  assert.equal(p.vistaPara('iara').piezas.yo, 12);
  assert.equal(p.vistaPara('nahuel').invertir, true);
  const m = p.movidasDe('iara');
  assert.ok(m.length > 0 && m.every((x) => x.a[0] === x.de[0] - 1));
  assert.deepEqual(p.movidasDe('nahuel'), []);
  p.accion('iara', 'mover', { de: m[0].de, a: m[0].a });
  assert.equal(p.turno, 'nahuel');
});

test('damas: comer es obligatorio y se encadena con la misma pieza', () => {
  const p = damasVacio();
  p.tablero[6][1] = { j: 'iara', dama: false };
  p.tablero[5][2] = { j: 'nahuel', dama: false };
  p.tablero[3][4] = { j: 'nahuel', dama: false };
  p.tablero[0][7] = { j: 'nahuel', dama: false };
  p.tablero[6][7] = { j: 'iara', dama: false };
  assert.throws(() => p.accion('iara', 'mover', { de: [6, 7], a: [5, 6] }), /obligatorio comer/);
  p.accion('iara', 'mover', { de: [6, 1], a: [4, 3] });
  assert.equal(p.turno, 'iara'); // sigue comiendo
  assert.deepEqual(p.cadena, [4, 3]);
  assert.throws(() => p.accion('iara', 'mover', { de: [6, 7], a: [5, 6] }), /seguir comiendo/);
  p.accion('iara', 'mover', { de: [4, 3], a: [2, 5] });
  assert.equal(p.turno, 'nahuel');
  assert.equal(p.vistaPara('iara').piezas.rival, 1);
});

test('damas: coronar y dama voladora; sin piezas pierde', () => {
  const p = damasVacio();
  p.tablero[1][2] = { j: 'iara', dama: false };
  p.tablero[1][6] = { j: 'nahuel', dama: false };
  p.accion('iara', 'mover', { de: [1, 2], a: [0, 1] });
  assert.equal(p.tablero[0][1].dama, true);
  p.accion('nahuel', 'mover', { de: [1, 6], a: [2, 7] });
  p.tablero[3][4] = { j: 'nahuel', dama: false };
  // La dama vuela por la diagonal y come de lejos.
  const comidas = p.movidasDe('iara').filter((m) => m.come);
  assert.ok(comidas.some((m) => m.come[0] === 3 && m.come[1] === 4));
  const m = comidas.find((x) => x.come[0] === 3);
  p.accion('iara', 'mover', { de: m.de, a: m.a });
  assert.equal(p.tablero[3][4], null);
  // Sin piezas del rival en el tablero → la próxima jugada termina la partida.
  const q = damasVacio();
  q.tablero[5][2] = { j: 'iara', dama: false };
  q.tablero[4][3] = { j: 'nahuel', dama: false };
  q.accion('iara', 'mover', { de: [5, 2], a: [3, 4] });
  assert.equal(q.ganador, 'iara');
  assert.equal(q.motivoFin, 'sin-piezas');
});

// ---------- Memotest ----------
test('memotest: par = seguís, distintas = se tapan y pasa el turno', async () => {
  const p = new PartidaMemotest(J, cfgMemo({ pares: 4, segundosMirar: 1 }), { empieza: 'iara' });
  const [a, b] = p.cartas.map((c, i) => [c, i]).filter(([c]) => c.dibujo === p.cartas[0].dibujo).map(([, i]) => i);
  assert.equal(p.vistaPara('nahuel').cartas.some((c) => c.dibujo), false); // no se filtra nada
  p.accion('iara', 'voltear', { i: a });
  p.accion('iara', 'voltear', { i: b });
  assert.equal(p.turno, 'iara');
  assert.equal(p.vistaPara('iara').puntos.yo, 1);
  const otra = p.cartas.findIndex((c) => !c.de);
  const distinta = p.cartas.findIndex((c, i) => !c.de && c.dibujo !== p.cartas[otra].dibujo && i !== otra);
  p.accion('iara', 'voltear', { i: otra });
  p.accion('iara', 'voltear', { i: distinta });
  assert.equal(p.vistaPara('nahuel').mirando, true);
  assert.throws(() => p.accion('iara', 'voltear', { i: p.cartas.findIndex((c, i) => !c.de && i !== otra && i !== distinta) }), /Esperá/);
  // Se guarda y restaura en medio de la mirada: igual se tapa solo.
  const copia = Object.assign(new PartidaMemotest(J, p.config), deserializar(serializar(p)));
  clearTimeout(p.timer);
  let avisado = false;
  copia.notificar = () => (avisado = true);
  copia.reanudar();
  await new Promise((r) => setTimeout(r, 1100));
  assert.ok(avisado);
  assert.equal(copia.turno, 'nahuel');
  assert.equal(copia.vistaPara('nahuel').cartas.filter((c) => c.abierta).length, 0);
});

// ---------- Stop de palabras ----------
test('stop: colores con letras repetidas', () => {
  assert.deepEqual(colorear('PAPAS', 'PALMA'), ['v', 'v', 'g', 'a', 'g']);
  assert.deepEqual(colorear('LLAVE', 'PLAYA'), ['g', 'v', 'v', 'g', 'g']);
  for (const [n, lista] of Object.entries(PALABRAS)) assert.ok(lista.every((p) => p.length === Number(n)));
});

test('stop: gana quien la saca en menos intentos; del rival solo se ven colores', () => {
  const p = new PartidaStopPalabras(J, cfgStop({ largo: 5, intentos: 4, rondas: 2 }), { palabras: ['MANGO', 'PERRO'] });
  p.accion('iara', 'intentar', { palabra: 'mundo' });
  const vista = p.vistaPara('nahuel');
  assert.deepEqual(vista.rival.intentos, [{ colores: ['v', 'g', 'v', 'g', 'v'] }]);
  assert.throws(() => p.accion('iara', 'intentar', { palabra: 'mano' }), /5 letras/);
  p.accion('iara', 'intentar', { palabra: 'MANGO' });
  assert.throws(() => p.accion('iara', 'intentar', { palabra: 'MANGO' }), /Ya terminaste/);
  p.accion('nahuel', 'intentar', { palabra: 'MANGO' }); // 1 intento: gana Nahuel
  assert.equal(p.vistaPara('iara').resultado, 'perdi');
  assert.equal(p.vistaPara('iara').palabra, 'MANGO');
  p.accion('iara', 'siguiente');
  p.accion('nahuel', 'siguiente');
  // Ronda 2: Iara no la saca en 4; Nahuel sí → 2 a 0.
  for (const w of ['PAPAS', 'LLAVE', 'TORTA', 'BARCO']) p.accion('iara', 'intentar', { palabra: w });
  p.accion('nahuel', 'intentar', { palabra: 'PERRO' });
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'nahuel');
});
