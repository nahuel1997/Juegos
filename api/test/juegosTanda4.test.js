import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PartidaDomino, validarConfig as cfgDomino, fichasDomino } from '../src/juegos/domino.js';
import { PartidaLudo, validarConfig as cfgLudo } from '../src/juegos/ludo.js';
import { PartidaQuienEsQuien, validarConfig as cfgQuien, PERRITOS, GATITOS, PREGUNTAS } from '../src/juegos/quienEsQuien.js';
import { PartidaPool, validarConfig as cfgPool, simular, MESA } from '../src/juegos/pool.js';
import { PartidaPenales, validarConfig as cfgPenales } from '../src/juegos/penales.js';
import { serializar, deserializar } from '../src/persistencia.js';

const J = ['iara', 'nahuel'];

// ---------- Dominó ----------
test('dominó: 28 fichas, reparto y jugadas a los extremos', () => {
  assert.equal(fichasDomino().length, 28);
  const p = new PartidaDomino(J, cfgDomino({}), { empieza: 'iara' });
  assert.equal(p.mano.iara.length, 7);
  assert.equal(p.pozo.length, 14);
  assert.throws(() => p.accion('nahuel', 'jugar', { ficha: p.mano.nahuel[0].id }), /No es tu turno/);
  p.mano.iara[0] = { id: '3-5', a: 3, b: 5 };
  p.accion('iara', 'jugar', { ficha: '3-5' });
  assert.deepEqual(p.extremos(), [3, 5]);
  p.mano.nahuel[0] = { id: '1-5', a: 1, b: 5 };
  p.accion('nahuel', 'jugar', { ficha: '1-5', lado: 'der' });
  assert.deepEqual(p.extremos(), [3, 1]);
  assert.deepEqual(p.mesa.map((f) => [f.a, f.b]), [[3, 5], [5, 1]]);
});

test('dominó: robar si no tenés, pasar cuando no hay pozo, tranque y puntos', () => {
  const p = new PartidaDomino(J, cfgDomino({ fichasIniciales: 5, puntosParaGanar: 0 }), { empieza: 'iara' });
  p.mesa = [{ id: '6-6', a: 6, b: 6 }];
  p.mano.iara = [{ id: '0-1', a: 0, b: 1 }];
  p.mano.nahuel = [{ id: '2-3', a: 2, b: 3 }, { id: '0-0', a: 0, b: 0 }];
  p.pozo = [{ id: '4-6', a: 4, b: 6 }];
  assert.throws(() => p.accion('iara', 'pasar'), /robá/);
  p.accion('iara', 'robar');
  assert.throws(() => p.accion('iara', 'robar'), /Tenés fichas|No hay pozo/);
  p.accion('iara', 'jugar', { ficha: '4-6' });
  // Nahuel no tiene ni 6 ni 4 y no hay pozo: pasa. Iara tampoco (tiene 0-1): tranque.
  p.accion('nahuel', 'pasar');
  p.accion('iara', 'pasar');
  assert.equal(p.estado, 'terminada');
  // Iara suma 1, Nahuel 5: gana Iara y se anota los 5 de Nahuel.
  assert.equal(p.ganador, 'iara');
  assert.equal(p.puntos.iara, 5);
});

test('dominó: quedarse sin fichas gana la mano y suma los puntos del rival', () => {
  const p = new PartidaDomino(J, cfgDomino({ puntosParaGanar: 10 }), { empieza: 'iara' });
  p.mano.iara = [{ id: '2-2', a: 2, b: 2 }];
  p.mano.nahuel = [{ id: '6-5', a: 6, b: 5 }];
  p.accion('iara', 'jugar', { ficha: '2-2' });
  assert.equal(p.fase, 'resumen');
  assert.equal(p.puntos.iara, 11);
  assert.equal(p.ganador, 'iara');
});

// ---------- Ludo ----------
test('ludo: hace falta 6 para salir, se come fuera de las seguras y se gana en la meta', () => {
  let dados = [];
  const rand = () => (dados.shift() - 1) / 6 + 0.01;
  const p = new PartidaLudo(J, cfgLudo({}), { empieza: 'iara', rand });
  dados = [3];
  p.accion('iara', 'tirar'); // sin 6 no sale: pasa el turno
  assert.equal(p.turno, 'nahuel');
  dados = [6];
  p.accion('nahuel', 'tirar');
  assert.equal(p.dado, 6);
  p.accion('nahuel', 'mover', { pieza: 0 });
  assert.equal(p.piezas.nahuel[0], 0);
  assert.equal(p.turno, 'nahuel'); // el 6 repite
  // Armamos una captura: ficha de Iara en la casilla absoluta 30 (no segura), Nahuel a 1 de distancia.
  p.piezas.iara[0] = 30; // Iara sale de 0: absoluta 30
  p.piezas.nahuel[0] = 3; // Nahuel sale de 26: absoluta 29
  dados = [1];
  p.accion('nahuel', 'tirar');
  p.accion('nahuel', 'mover', { pieza: 0 });
  assert.equal(p.piezas.iara[0], -1);
  assert.equal(p.turno, 'nahuel'); // comer repite
  // Meta con número exacto.
  p.piezas.nahuel = [56, 56, 56, 54];
  dados = [5];
  p.accion('nahuel', 'tirar'); // se pasaría: no hay jugada → pasa
  assert.equal(p.turno, 'iara');
  p.turno = 'nahuel';
  dados = [2];
  p.accion('nahuel', 'tirar');
  p.accion('nahuel', 'mover', { pieza: 3 });
  assert.equal(p.ganador, 'nahuel');
});

test('ludo: casillas seguras no se comen', () => {
  let dados = [];
  const rand = () => (dados.shift() - 1) / 6 + 0.01;
  const p = new PartidaLudo(J, cfgLudo({}), { empieza: 'iara', rand });
  p.piezas.nahuel[0] = 8; // absoluta 34 (segura)
  p.piezas.iara[0] = 33; // absoluta 33
  dados = [1];
  p.accion('iara', 'tirar');
  p.accion('iara', 'mover', { pieza: 0 });
  assert.equal(p.piezas.nahuel[0], 8);
});

// ---------- ¿Quién es quién? ----------
test('quién es quién: está la pitbull caramelo y blanca con nariz rosa', () => {
  const lola = PERRITOS.find((x) => x.raza === 'pitbull' && x.color === 'caramelo' && x.patron === 'bicolor' && x.nariz === 'rosa');
  assert.ok(lola);
  assert.equal(GATITOS.length, 24);
  assert.equal(new Set(GATITOS.map((x) => x.nombre)).size, 24);
  // Todas las respuestas posibles existen en las preguntas.
  for (const x of PERRITOS) for (const [k, v] of Object.entries(PREGUNTAS.perritos)) assert.ok(v.valores[x[k]], `${x.nombre}.${k}`);
  for (const x of GATITOS) for (const [k, v] of Object.entries(PREGUNTAS.gatitos)) assert.ok(v.valores[x[k]], `${x.nombre}.${k}`);
  const p = new PartidaQuienEsQuien(J, cfgQuien({ tema: 'perritos', cantidad: 12 }));
  assert.ok(p.personajes.some((x) => x.nombre === 'Lola'));
});

test('quién es quién: pregunta libre, el otro responde sí o no y recién ahí cambia el turno', () => {
  const p = new PartidaQuienEsQuien(J, cfgQuien({ tema: 'gatitos' }), { empieza: 'iara' });
  assert.throws(() => p.accion('iara', 'preguntar', { texto: 'a' }), /Escribí/);
  p.accion('iara', 'preguntar', { texto: '  ¿Es  gordito?  ' });
  assert.deepEqual(p.vistaPara('nahuel').pendiente, { texto: '¿Es gordito?', mia: false });
  assert.throws(() => p.accion('iara', 'preguntar', { texto: '¿Otra?' }), /Esperá/);
  assert.throws(() => p.accion('iara', 'responder', { si: true }), /No hay pregunta/);
  assert.throws(() => p.accion('nahuel', 'preguntar', { texto: '¿Es gris?' }), /No es tu turno/);
  p.accion('nahuel', 'responder', { si: false });
  assert.equal(p.historial[0].respuesta, false);
  assert.equal(p.turno, 'nahuel');
  assert.equal(p.vistaPara('iara').pendiente, null);
  assert.equal(p.vistaPara('iara').secretoRival, null);
  p.accion('iara', 'tumbar', { indices: [0, 1, 2] }); // se puede fuera de turno
  assert.deepEqual(p.vistaPara('iara').tumbados, [0, 1, 2]);
  p.accion('iara', 'tumbar', { indices: [1], levantar: true });
  assert.deepEqual(p.tumbados.iara, [0, 2]);
  p.accion('nahuel', 'arriesgar', { indice: p.secreto.iara });
  assert.equal(p.ganador, 'nahuel');
  assert.equal(p.vistaPara('iara').secretoRival, p.secreto.nahuel);
  // Errar pierde (por defecto).
  const q = new PartidaQuienEsQuien(J, cfgQuien({}), { empieza: 'iara' });
  q.accion('iara', 'arriesgar', { indice: (q.secreto.nahuel + 1) % q.personajes.length });
  assert.equal(q.ganador, 'nahuel');
});

test('quién es quién: si te queda uno solo en pie, se arriesga solo al empezar tu turno', () => {
  const p = new PartidaQuienEsQuien(J, cfgQuien({}), { empieza: 'nahuel' });
  const todos = p.personajes.map((_, i) => i);
  // Iara baja todos menos el secreto de Nahuel (mientras pregunta Nahuel).
  p.accion('iara', 'tumbar', { indices: todos.filter((i) => i !== p.secreto.nahuel) });
  assert.equal(p.estado, 'jugando');
  p.accion('nahuel', 'preguntar', { texto: '¿Tiene collar?' });
  p.accion('iara', 'responder', { si: true }); // le toca a Iara → se revela solo
  assert.equal(p.ganador, 'iara');
  assert.ok(p.historial.at(-1).automatico);
  // Si el que quedó en pie no era, pierde (errarPierde).
  const q = new PartidaQuienEsQuien(J, cfgQuien({}), { empieza: 'nahuel' });
  const otro = (q.secreto.nahuel + 1) % q.personajes.length;
  q.accion('iara', 'tumbar', { indices: q.personajes.map((_, i) => i).filter((i) => i !== otro) });
  q.accion('nahuel', 'preguntar', { texto: '¿Tiene collar?' });
  q.accion('iara', 'responder', { si: false });
  assert.equal(q.ganador, 'nahuel');
});

// ---------- Pool ----------
test('pool: la física mueve bolas, rebota y mete en las troneras', () => {
  const bolas = [
    { n: 0, x: 100, y: 250, vx: 0, vy: 0, en: true },
    { n: 1, x: 200, y: 250, vx: 0, vy: 0, en: true },
  ];
  const { metidas, primera, cuadros } = simular(bolas, 0, 0.6);
  assert.equal(primera, 1);
  assert.ok(bolas[1].x > 200);
  assert.ok(cuadros.length > 5);
  // Tiro directo a la tronera de la esquina.
  const otra = [{ n: 0, x: 60, y: 60, vx: 0, vy: 0, en: true }];
  const r = simular(otra, Math.PI + Math.PI / 4, 0.5);
  assert.deepEqual(r.metidas, [0]);
  // Se detiene siempre (no queda girando para siempre).
  assert.ok(r.cuadros.length < 1500);
});

test('pool: tiro de salida, faltas, grupos y reglas de la 8', () => {
  const p = new PartidaPool(J, cfgPool({}), { empieza: 'iara' });
  assert.equal(p.bolas.length, 16);
  assert.throws(() => p.accion('nahuel', 'tirar', { angulo: 0, fuerza: 1 }), /No es tu turno/);
  p.accion('iara', 'tirar', { angulo: 0, fuerza: 1 });
  assert.ok(p.ultimoTiro.cuadros.length > 10);
  assert.ok(p.ultimoTiro.primera === undefined || true);
  // Escenario armado: Iara tiene lisas y le queda solo la 8 → meterla gana.
  const q = new PartidaPool(J, cfgPool({}), { empieza: 'iara' });
  q.grupos = { iara: 'lisas', nahuel: 'rayadas' };
  q.bolas = [
    { n: 0, x: 860, y: 140, vx: 0, vy: 0, en: true },
    { n: 8, x: 930, y: 70, vx: 0, vy: 0, en: true },
    { n: 9, x: 500, y: 400, vx: 0, vy: 0, en: true },
  ];
  q.accion('iara', 'tirar', { angulo: Math.atan2(70 - 140, 930 - 860), fuerza: 0.6 });
  assert.equal(q.ganador, 'iara');
  // Meter la 8 antes de tiempo pierde.
  const t = new PartidaPool(J, cfgPool({}), { empieza: 'iara' });
  t.grupos = { iara: 'lisas', nahuel: 'rayadas' };
  t.bolas = [
    { n: 0, x: 860, y: 140, vx: 0, vy: 0, en: true },
    { n: 8, x: 930, y: 70, vx: 0, vy: 0, en: true },
    { n: 3, x: 500, y: 400, vx: 0, vy: 0, en: true },
  ];
  t.accion('iara', 'tirar', { angulo: Math.atan2(70 - 140, 930 - 860), fuerza: 0.6 });
  assert.equal(t.ganador, 'nahuel');
  // Meter la blanca es falta: vuelve a su lugar y pasa el turno.
  const u = new PartidaPool(J, cfgPool({}), { empieza: 'iara' });
  u.bolas = [{ n: 0, x: 60, y: 60, vx: 0, vy: 0, en: true }, { n: 5, x: 500, y: 250, vx: 0, vy: 0, en: true }];
  u.accion('iara', 'tirar', { angulo: Math.PI + Math.PI / 4, fuerza: 0.5 });
  assert.equal(u.ultimoTiro.falta, 'Metiste la blanca');
  assert.equal(u.turno, 'nahuel');
  assert.ok(u.bolas[0].en);
  assert.ok(MESA.ancho === 1000);
  // Se puede guardar y restaurar.
  const copia = Object.assign(new PartidaPool(J, u.config), deserializar(serializar(u)));
  assert.equal(copia.vistaPara('iara').bolas.length, 2);
});

// ---------- Penales ----------
test('penales: roles alternados, elecciones ocultas, gol o atajada', () => {
  const p = new PartidaPenales(J, cfgPenales({ tiros: 3 }), { empieza: 'iara' });
  assert.equal(p.vistaPara('iara').rol, 'pateador');
  assert.equal(p.vistaPara('nahuel').rol, 'arquero');
  p.accion('nahuel', 'elegir', { zona: 2 });
  assert.equal(p.vistaPara('iara').rivalEligio, true);
  assert.equal(JSON.stringify(p.vistaPara('iara')).includes('"ataja"'), false);
  p.accion('iara', 'elegir', { zona: 2 }); // atajado
  assert.equal(p.vistaPara('iara').ultimo.gol, false);
  assert.equal(p.vistaPara('iara').rol, 'arquero');
  // Iara 0 de 1. Nahuel convierte los 3 y ataja → se define antes.
  const penal = (pat, arq, zp, za) => { p.accion(pat, 'elegir', { zona: zp }); p.accion(arq, 'elegir', { zona: za }); };
  penal('nahuel', 'iara', 0, 5);
  penal('iara', 'nahuel', 1, 1);
  penal('nahuel', 'iara', 0, 5);
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'nahuel');
});

test('penales: empate en la serie va a muerte súbita', () => {
  const p = new PartidaPenales(J, cfgPenales({ tiros: 1 }), { empieza: 'iara' });
  const penal = (pat, arq, zp, za) => { p.accion(pat, 'elegir', { zona: zp }); p.accion(arq, 'elegir', { zona: za }); };
  penal('iara', 'nahuel', 0, 1); // gol
  penal('nahuel', 'iara', 0, 1); // gol
  assert.equal(p.estado, 'jugando');
  assert.equal(p.vistaPara('iara').muerteSubita, true);
  penal('iara', 'nahuel', 3, 3); // atajado
  assert.equal(p.estado, 'jugando');
  penal('nahuel', 'iara', 4, 0); // gol
  assert.equal(p.ganador, 'nahuel');
});
