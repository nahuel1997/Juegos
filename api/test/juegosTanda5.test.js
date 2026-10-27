import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializar, deserializar } from '../src/persistencia.js';
import * as tateti from '../src/juegos/tateti.js';
import * as cajitas from '../src/juegos/cajitas.js';
import * as mastermind from '../src/juegos/mastermind.js';
import * as escaleras from '../src/juegos/escaleras.js';
import * as caballos from '../src/juegos/caballos.js';
import * as bg from '../src/juegos/backgammon.js';
import * as sudoku from '../src/juegos/sudoku.js';
import * as quoridor from '../src/juegos/quoridor.js';
import * as dibujar from '../src/juegos/dibujar.js';
import * as mono from '../src/juegos/monopoly.js';

const J = ['iara', 'nahuel'];
const restaurar = (Clase, p) => {
  const datos = deserializar(serializar({ partida: p })).partida;
  return Object.assign(new Clase(datos.jugadores, datos.config), datos);
};

test('ta te ti: línea, empate y al mejor de 3', () => {
  const p = new tateti.PartidaTateti(J, tateti.validarConfig({ partidas: 3 }), { empieza: 'iara' });
  const jugar = (lista) => lista.forEach(([j, f, c]) => p.accion(j, 'poner', { fila: f, col: c }));
  jugar([['iara', 0, 0], ['nahuel', 1, 0], ['iara', 0, 1], ['nahuel', 1, 1], ['iara', 0, 2]]);
  assert.equal(p.fase, 'fin');
  assert.equal(p.puntos.iara, 1);
  assert.throws(() => p.accion('iara', 'poner', { fila: 2, col: 2 }), /terminó/);
  p.accion('iara', 'siguiente'); p.accion('nahuel', 'siguiente');
  assert.equal(p.turno, 'nahuel', 'la segunda arranca el otro');
  jugar([['nahuel', 0, 0], ['iara', 1, 1], ['nahuel', 2, 2], ['iara', 0, 2], ['nahuel', 2, 0], ['iara', 1, 0], ['nahuel', 1, 2], ['iara', 2, 1], ['nahuel', 0, 1]]);
  assert.equal(p.historial[1], null, 'empate');
  p.accion('iara', 'siguiente'); p.accion('nahuel', 'siguiente');
  jugar([['iara', 0, 0], ['nahuel', 2, 2], ['iara', 1, 0], ['nahuel', 2, 1], ['iara', 2, 0]]);
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');
});

test('ta te ti con movimiento: con 3 fichas puestas hay que mover', () => {
  const p = new tateti.PartidaTateti(J, tateti.validarConfig({ movimiento: true }), { empieza: 'iara' });
  [['iara', 0, 0], ['nahuel', 1, 1], ['iara', 2, 2], ['nahuel', 0, 2], ['iara', 2, 0], ['nahuel', 1, 0]].forEach(([j, f, c]) => p.accion(j, 'poner', { fila: f, col: c }));
  assert.throws(() => p.accion('iara', 'poner', { fila: 2, col: 1 }), /mover/);
  p.accion('iara', 'poner', { fila: 2, col: 1, desde: [0, 0] });
  assert.equal(p.ganador, null);
  assert.equal(p.fase, 'fin', 'iara alineó la fila de abajo');
  assert.equal(p.puntos.iara, 1);
});

test('puntos y cajitas: cerrar una caja da otro turno y gana el que tiene más', () => {
  const p = new cajitas.PartidaCajitas(J, { filas: 1, columnas: 2 }, { empieza: 'iara' });
  p.accion('iara', 'raya', { tipo: 'h', f: 0, c: 0 });
  p.accion('nahuel', 'raya', { tipo: 'h', f: 1, c: 0 });
  p.accion('iara', 'raya', { tipo: 'v', f: 0, c: 0 });
  assert.equal(p.turno, 'nahuel');
  p.accion('nahuel', 'raya', { tipo: 'v', f: 0, c: 1 });
  assert.equal(p.cajas[0][0], 'nahuel');
  assert.equal(p.turno, 'nahuel', 'cerró y sigue');
  assert.throws(() => p.accion('nahuel', 'raya', { tipo: 'v', f: 0, c: 1 }), /ya está/);
  p.accion('nahuel', 'raya', { tipo: 'h', f: 0, c: 1 });
  p.accion('iara', 'raya', { tipo: 'h', f: 1, c: 1 });
  p.accion('nahuel', 'raya', { tipo: 'v', f: 0, c: 2 });
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'nahuel');
});

test('mastermind: negras y blancas, y gana el que adivina en menos', () => {
  assert.deepEqual(mastermind.evaluar([0, 1, 2, 3], [0, 2, 1, 5]), { negras: 1, blancas: 2 });
  assert.deepEqual(mastermind.evaluar([1, 1, 2, 2], [1, 2, 1, 1]), { negras: 1, blancas: 2 });
  const p = new mastermind.PartidaMastermind(J, mastermind.validarConfig({}));
  assert.throws(() => p.accion('iara', 'intento', { codigo: [0, 0, 0, 0] }), /falta/);
  p.accion('iara', 'secreto', { codigo: [1, 2, 3, 4] });
  p.accion('nahuel', 'secreto', { codigo: [5, 5, 0, 0] });
  p.accion('iara', 'intento', { codigo: [5, 5, 0, 1] });
  p.accion('iara', 'intento', { codigo: [5, 5, 0, 0] });
  assert.equal(p.resuelto.iara, true);
  assert.equal(p.vistaPara('iara').secretoRival.join(), '5,5,0,0');
  assert.equal(p.vistaPara('nahuel').intentosRival[0].codigo, undefined, 'no se ven los colores del otro');
  for (let i = 0; i < 2; i++) p.accion('nahuel', 'intento', { codigo: [0, 0, 0, 0] });
  p.accion('nahuel', 'intento', { codigo: [1, 2, 3, 4] });
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');
});

test('escaleras y serpientes: tablero sin pisarse, rebote y llegada', () => {
  for (let k = 0; k < 20; k++) {
    const s = escaleras.armarTablero(100, 'muchas');
    const extremos = Object.entries(s).flatMap(([a, b]) => [Number(a), b.hasta]);
    assert.equal(new Set(extremos).size, extremos.length);
    assert.ok(!extremos.includes(1) && !extremos.includes(100));
    for (const [a, b] of Object.entries(s)) assert.equal(b.tipo === 'escalera', b.hasta > Number(a));
  }
  let dado = 5;
  const p = new escaleras.PartidaEscaleras(J, escaleras.validarConfig({ seisRepite: false }), { empieza: 'iara', rand: () => (dado - 1) / 6 + 0.01 });
  p.saltos = {};
  p.pos.iara = 97;
  p.accion('iara', 'tirar');
  assert.equal(p.pos.iara, 98, 'se pasó por 2 y rebotó');
  p.accion('nahuel', 'tirar');
  dado = 2;
  p.accion('iara', 'tirar');
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');
});

test('carrera de caballos: elegir, avanzar, retroceder y ganar', () => {
  const p = new caballos.PartidaCaballos(J, caballos.validarConfig({ largo: 4, carreras: 1 }), { empieza: 'iara' });
  p.accion('iara', 'elegir', { palo: 'oros' });
  assert.throws(() => p.accion('nahuel', 'elegir', { palo: 'oros' }), /dueño/);
  p.accion('nahuel', 'elegir', { palo: 'copas' });
  p.accion('iara', 'elegir', { palo: 'espadas' });
  p.accion('nahuel', 'elegir', { palo: 'bastos' });
  assert.equal(p.fase, 'corriendo');
  // Mazo armado: cada palo avanza uno (se da vuelta la primera de la pista: bastos), y oros sigue.
  p.pista = ['bastos', 'copas', 'copas', 'copas'].map((palo, i) => ({ id: `x${i}`, palo, numero: 1, vista: false }));
  p.mazo = ['oros', 'bastos', 'espadas', 'copas', 'oros', 'oros', 'oros', 'oros'].map((palo, i) => ({ id: `m${i}`, palo, numero: 2 })).reverse();
  for (let i = 0; i < 4; i++) p.accion(p.turno, 'carta');
  assert.equal(p.pos.bastos, 0, 'bastos avanzó y retrocedió al darse vuelta la primera de la pista');
  assert.ok(p.pista[0].vista);
  while (p.fase === 'corriendo') p.accion(p.turno, 'carta');
  assert.equal(p.ganadorCarrera, 'oros');
  assert.equal(p.ganador, 'iara');
});

test('backgammon: posición inicial, movidas legales, comer y entrar desde la barra', () => {
  const s = { t: bg.tableroInicial(), bar: [0, 0], fuera: [0, 0] };
  assert.equal(s.t.reduce((a, x) => a + Math.max(0, x), 0), 15);
  const legales = bg.movidasLegales(s, 0, [6, 5]);
  assert.ok(legales.some((m) => m.desde === 24 && m.hasta === 18));
  assert.ok(!legales.some((m) => m.hasta === 19), 'la 19 está tapada por 5 negras');
  // Comer: una negra sola en la 20.
  const s2 = { t: Array(26).fill(0), bar: [0, 0], fuera: [0, 0] };
  s2.t[24] = 1; s2.t[20] = -1; s2.t[6] = 14;
  const n = bg.aplicar(s2, 0, { desde: 24, hasta: 20 });
  assert.equal(n.bar[1], 1);
  assert.equal(n.t[20], 1);
  // Desde la barra solo se puede entrar.
  const lb = bg.movidasLegales(n, 1, [3, 4]);
  assert.ok(lb.every((m) => m.desde === 'bar'));
  // Sacar: todas en casa.
  const s3 = { t: Array(26).fill(0), bar: [0, 0], fuera: [0, 13] };
  s3.t[2] = 2; s3.t[19] = -2;
  const sacar = bg.movidasLegales(s3, 0, [6, 1]);
  assert.ok(sacar.some((m) => m.hasta === 'fuera' && m.dado === 6));
});

test('backgammon: el segundo jugador mueve con sus coordenadas (tablero dado vuelta)', () => {
  const p = new bg.PartidaBackgammon(J, bg.validarConfig({}), { empieza: 'nahuel', rand: () => 0.5 }); // 4 y 4
  p.accion('nahuel', 'tirar');
  const v = p.vistaPara('nahuel');
  const m = v.legales[0];
  p.accion('nahuel', 'mover', { desde: m.desde, hasta: m.hasta });
  assert.equal(p.dados.length, 3);
  assert.equal(p.vistaPara('nahuel').tablero[m.hasta] > 0, true);
});

test('backgammon: la partida corre y se guarda', () => {
  const p = new bg.PartidaBackgammon(J, bg.validarConfig({ puntos: 1 }), { empieza: 'iara' });
  for (let t = 0; t < 400 && p.estado === 'jugando'; t++) {
    const j = p.turno;
    p.accion(j, 'tirar');
    while (p.turno === j && p.dados.length && p.estado === 'jugando') {
      const [m] = p.vistaPara(j).legales;
      p.accion(j, 'mover', { desde: m.desde, hasta: m.hasta });
    }
    if (t === 10) {
      const r = restaurar(bg.PartidaBackgammon, p);
      assert.deepEqual(r.s, p.s);
    }
  }
  assert.equal(p.estado, 'terminada');
  assert.ok(p.puntos[p.ganador] >= 1);
});

test('sudoku: solución única y errores', () => {
  const { tablero, solucion } = sudoku.generar('medio');
  assert.equal(sudoku.contarSoluciones(tablero.map((f) => [...f])), 1);
  assert.ok(tablero.flat().filter(Boolean).length <= 40);
  const p = new sudoku.PartidaSudoku(J, sudoku.validarConfig({ errores: 2, dificultad: 'facil' }));
  const vacias = [];
  p.inicial.forEach((f, i) => f.forEach((x, k) => { if (!x) vacias.push([i, k]); }));
  const [f, c] = vacias[0];
  const mal = (p.solucion[f][c] % 9) + 1;
  p.accion('iara', 'poner', { fila: f, col: c, numero: mal });
  assert.equal(p.errores.iara, 1);
  for (const [a, b] of vacias) p.accion('nahuel', 'poner', { fila: a, col: b, numero: p.solucion[a][b] });
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'nahuel');
  assert.ok(solucion);
});

test('quoridor: mover, saltar, paredes y no encerrar', () => {
  const p = new quoridor.PartidaQuoridor(J, quoridor.validarConfig({ lado: 5 }), { empieza: 'iara' });
  // iara abajo (fila 4, col 2), nahuel arriba (fila 0, col 2).
  p.accion('iara', 'mover', { fila: 3, col: 2 });
  p.accion('nahuel', 'mover', { fila: 3, col: 2 }); // nahuel lo ve girado: (3,2) en su vista = (1,2) real
  assert.deepEqual([p.fichas.nahuel[0].f, p.fichas.nahuel[0].c], [1, 2]);
  p.accion('iara', 'mover', { fila: 2, col: 2 });
  // Ahora están cara a cara: nahuel salta por encima de iara.
  const vista = p.vistaPara('nahuel');
  assert.ok(vista.destinos[0].some(([f, c]) => f === 1 && c === 2), 'salto derecho');
  // Encerrar: paredes que dejarían a alguien sin camino no valen.
  p.paredes = new Set(['h:0:0', 'h:0:2', 'v:0:3']);
  assert.equal(p.puedePared('h', 1, 3), false, 'cerraría el paso a la fila de arriba');
  assert.equal(p.puedePared('h', 2, 0), true);
  assert.equal(p.puedePared('h', 0, 1), false, 'se cruza con otra');
});

test('quoridor con tres tapitas: hay que cruzar las tres', () => {
  const p = new quoridor.PartidaQuoridor(J, quoridor.validarConfig({ lado: 5, fichas: 3 }), { empieza: 'iara' });
  assert.equal(p.fichas.iara.length, 3);
  p.fichas.iara[0].f = 1;
  p.fichas.nahuel[0].f = 3;
  p.accion('iara', 'mover', { ficha: 0, fila: 0, col: p.fichas.iara[0].c });
  assert.equal(p.fichas.iara[0].llego, true);
  assert.equal(p.estado, 'jugando');
});

test('dibujá y adiviná: elegir, dibujar, adivinar y puntos', () => {
  const p = new dibujar.PartidaDibujar(J, dibujar.validarConfig({ turnos: 1 }), { empieza: 'iara' });
  assert.equal(p.vistaPara('nahuel').opciones, null);
  const palabra = p.vistaPara('iara').opciones[0];
  assert.throws(() => p.accion('nahuel', 'elegir', { palabra }), /dibuja/);
  p.accion('iara', 'elegir', { palabra });
  assert.equal(p.vistaPara('nahuel').palabra, null);
  p.accion('iara', 'trazo', { id: 'a', puntos: [[10, 10], [2000, 20]], color: '#ff0000', grosor: 5 });
  assert.equal(p.trazos[0].puntos[1][0], 1000);
  p.accion('nahuel', 'adivinar', { texto: 'cualquiera' });
  p.accion('nahuel', 'adivinar', { texto: palabra.toUpperCase() });
  assert.equal(p.fase, 'revelado');
  assert.ok(p.puntos.nahuel >= 10 && p.puntos.iara >= 5);
  p.accion('iara', 'siguiente'); p.accion('nahuel', 'siguiente');
  assert.equal(p.dibuja, 'nahuel');
  clearTimeout(p.timer);
  const r = restaurar(dibujar.PartidaDibujar, p);
  assert.equal(r.dibuja, 'nahuel');
});

test('monopoly: comprar, alquiler doble con el color, casas parejas y deuda', () => {
  const p = new mono.PartidaMonopoly(J, mono.validarConfig({}), { empieza: 'iara', rand: () => 0 }); // dados 1 y 1
  p.accion('iara', 'tirar'); // dobles: cae en la 2 (club)
  assert.equal(p.pos.iara, 2);
  assert.equal(p.fase, 'tirar', 'dobles: vuelve a tirar');
  p.pos.iara = 0;
  p.accion('iara', 'tirar'); // 2: calle Arias? no: la 2 de nuevo… se fuerza la posición
  p.pos.iara = 1;
  p.fase = 'decidir';
  p.accion('iara', 'comprar');
  assert.equal(p.duenio[1], 'iara');
  p.duenio[3] = 'iara';
  assert.equal(p.alquiler(1, 7), 4, 'alquiler doble con todo el color');
  p.fase = 'acciones';
  p.accion('iara', 'construir', { casilla: 1 });
  assert.throws(() => p.accion('iara', 'construir', { casilla: 1 }), /parejo/);
  p.accion('iara', 'construir', { casilla: 3 });
  assert.equal(p.alquiler(1, 7), 10);
  assert.throws(() => p.accion('iara', 'hipotecar', { casilla: 1 }), /casas/);
  p.accion('iara', 'terminar');
  assert.equal(p.turno, 'nahuel');
  // Nahuel sin plata cae en la calle Derqui con casa: entra en deuda o quiebra.
  p.dinero.nahuel = 5;
  p.pos.nahuel = 39;
  p.rand = () => 0.99; // 6 y 6 → de la 39 a la 11
  p.pos.nahuel = 35;
  p.duenio[5] = 'nahuel';
  p.rand = () => 0; // 1 y 1 → de la 35 a la 37
  p.pos.nahuel = 39; // 39 + 2 = 1 (pasa por la Salida y cobra 200)
  p.accion('nahuel', 'tirar');
  assert.equal(p.pos.nahuel, 1);
  assert.equal(p.dinero.nahuel, 5 + 200 - 10);
  const r = restaurar(mono.PartidaMonopoly, p);
  assert.deepEqual(r.duenio, p.duenio);
});

test('monopoly: deuda, hipoteca para pagar y quiebra', () => {
  const p = new mono.PartidaMonopoly(J, mono.validarConfig({ salario: 0 }), { empieza: 'iara', rand: () => 0.2 }); // 2 y 2
  p.duenio[1] = 'iara'; p.duenio[3] = 'iara'; p.casas[1] = 5; p.casas[3] = 5;
  p.duenio[6] = 'nahuel';
  p.turno = 'nahuel';
  p.dinero.nahuel = 220;
  p.pos.nahuel = 37; // 37 + 4 = 1 → hotel en Derqui: 250
  p.accion('nahuel', 'tirar');
  assert.equal(p.fase, 'deuda');
  assert.throws(() => p.accion('nahuel', 'pagarDeuda'), /alcanza/);
  p.accion('nahuel', 'hipotecar', { casilla: 6 });
  assert.equal(p.dinero.nahuel, 270);
  p.accion('nahuel', 'pagarDeuda');
  assert.equal(p.dinero.nahuel, 20);
  assert.equal(p.fase, 'tirar', 'sacó dobles: vuelve a tirar');
  // Si ni vendiendo todo le alcanza, quiebra directo.
  p.dinero.nahuel = 0;
  p.pos.nahuel = 37;
  p.accion('nahuel', 'tirar');
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');
});
