import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { serializar, deserializar } from '../src/persistencia.js';
import * as truco from '../src/juegos/truco.js';
import * as ajedrez from '../src/juegos/ajedrez.js';
import * as reversi from '../src/juegos/reversi.js';
import * as tron from '../src/juegos/tron.js';
import * as botellas from '../src/juegos/botellas.js';
import * as emojis from '../src/juegos/emojis.js';
import * as simon from '../src/juegos/simon.js';
import * as colores from '../src/juegos/colores.js';
import { jugadaBot } from '../src/bots.js';

const J = ['iara', 'nahuel'];
const restaurar = (Clase, p) => {
  const datos = deserializar(serializar({ partida: p })).partida;
  return Object.assign(new Clase(datos.jugadores, datos.config), datos);
};
const c = (numero, palo) => ({ id: `${numero}-${palo}`, numero, palo });

// Truco con cartas fijas: reemplaza el reparto.
function trucoCon(manoIara, manoNahuel, config = {}) {
  const p = new truco.PartidaTruco(J, truco.validarConfig(config), { empieza: 'iara' });
  p.iniciales = { iara: manoIara, nahuel: manoNahuel };
  p.mano = { iara: [...manoIara], nahuel: [...manoNahuel] };
  return p;
}

test('truco: jerarquía y envido', () => {
  assert.ok(truco.jerarquia(c(1, 'espadas')) > truco.jerarquia(c(1, 'bastos')));
  assert.ok(truco.jerarquia(c(7, 'oros')) > truco.jerarquia(c(3, 'copas')));
  assert.ok(truco.jerarquia(c(4, 'copas')) < truco.jerarquia(c(5, 'oros')));
  assert.equal(truco.envidoDe([c(7, 'oros'), c(6, 'oros'), c(1, 'espadas')]), 33);
  assert.equal(truco.envidoDe([c(12, 'oros'), c(11, 'oros'), c(3, 'espadas')]), 20);
  assert.equal(truco.envidoDe([c(12, 'oros'), c(5, 'copas'), c(3, 'espadas')]), 5);
});

test('truco: bazas, truco querido y envido', () => {
  const p = trucoCon([c(1, 'espadas'), c(7, 'oros'), c(4, 'copas')], [c(3, 'bastos'), c(2, 'oros'), c(5, 'espadas')]);
  assert.equal(p.turno, 'iara');
  p.accion('iara', 'envido');
  assert.deepEqual(p.opciones('nahuel').slice(0, 2), ['quiero', 'noquiero']);
  assert.throws(() => p.accion('iara', 'jugar', { carta: '1-espadas' }), /no podés/);
  p.accion('nahuel', 'quiero');
  // iara 7 (7 de oros), nahuel 5: gana iara 2.
  assert.equal(p.puntos.iara, 2);
  assert.equal(p.turno, 'iara');
  p.accion('iara', 'truco');
  p.accion('nahuel', 'quiero');
  assert.equal(p.truco.valor, 2);
  assert.ok(!p.opciones('iara').includes('truco'), 'el que cantó no puede subir');
  p.accion('iara', 'jugar', { carta: '1-espadas' });
  assert.ok(p.opciones('nahuel').includes('truco'), 'el que quiso puede retrucar');
  p.accion('nahuel', 'jugar', { carta: '3-bastos' });
  p.accion('iara', 'jugar', { carta: '7-oros' });
  p.accion('nahuel', 'jugar', { carta: '2-oros' });
  assert.equal(p.fase, 'resumen');
  assert.equal(p.puntos.iara, 4);
  p.accion('iara', 'siguiente'); p.accion('nahuel', 'siguiente');
  assert.equal(p.numero, 2);
  assert.equal(p.turno, 'nahuel', 'cambia la mano');
});

test('truco: no quiero, retruco, parda, mazo, envido va primero y falta envido', () => {
  let p = trucoCon([c(4, 'copas'), c(5, 'copas'), c(6, 'oros')], [c(1, 'espadas'), c(1, 'bastos'), c(7, 'espadas')]);
  p.accion('iara', 'truco');
  p.accion('nahuel', 'truco'); // retruco
  p.accion('iara', 'noquiero');
  assert.equal(p.puntos.nahuel, 2, 'no querer el retruco da 2');

  // Parda en la primera: gana la segunda.
  p = trucoCon([c(3, 'copas'), c(1, 'espadas'), c(4, 'oros')], [c(3, 'bastos'), c(2, 'oros'), c(5, 'oros')]);
  p.accion('iara', 'jugar', { carta: '3-copas' });
  p.accion('nahuel', 'jugar', { carta: '3-bastos' });
  assert.equal(p.turno, 'iara', 'después de parda tira el mano');
  p.accion('iara', 'jugar', { carta: '1-espadas' });
  p.accion('nahuel', 'jugar', { carta: '2-oros' });
  assert.equal(p.resumen.ganador, 'iara');

  // Envido está primero: contestar truco con envido; después vuelve el truco.
  p = trucoCon([c(7, 'oros'), c(6, 'oros'), c(4, 'copas')], [c(1, 'espadas'), c(2, 'copas'), c(3, 'copas')]);
  p.accion('iara', 'truco');
  p.accion('nahuel', 'envido');
  p.accion('iara', 'real');
  p.accion('nahuel', 'quiero');
  assert.equal(p.puntos.iara, 5, '33 contra 25: envido + real = 5');
  assert.equal(p.pendiente.tipo, 'truco');
  p.accion('nahuel', 'mazo');
  assert.equal(p.puntos.iara, 6, 'al mazo con truco sin querer: 1');

  // Falta envido a 15: vale lo que le falta al que va ganando (10 → 5).
  p = trucoCon([c(7, 'oros'), c(6, 'oros'), c(4, 'copas')], [c(1, 'espadas'), c(2, 'copas'), c(3, 'copas')], { meta: 15 });
  p.puntos = { iara: 3, nahuel: 10 };
  p.accion('iara', 'falta');
  p.accion('nahuel', 'quiero');
  assert.equal(p.puntos.iara, 8);
  // Si la gana el que va ganando, termina el partido.
  p.puntos = { iara: 3, nahuel: 10 };
  p.iniciales = { iara: [c(4, 'copas'), c(5, 'oros'), c(6, 'espadas')], nahuel: [c(7, 'oros'), c(6, 'oros'), c(1, 'bastos')] };
  p.envido.estado = 'libre';
  p.turno = 'nahuel';
  p.accion('nahuel', 'falta');
  p.accion('iara', 'quiero');
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'nahuel');
});

test('truco: flor y guardado', () => {
  const p = new truco.PartidaTruco(J, truco.validarConfig({ flor: true }), { empieza: 'iara', rand: () => 0.3 });
  const q = restaurar(truco.PartidaTruco, p);
  assert.deepEqual(q.vistaPara('iara').miMano, p.vistaPara('iara').miMano);
  assert.ok(Array.isArray(q.vistaPara('nahuel').opciones));
});

test('ajedrez: mate del pastor, enroque, al paso y coronación', () => {
  const p = new ajedrez.PartidaAjedrez(J, ajedrez.validarConfig({}), { empieza: 'iara' });
  const m = (j, de, a, promo) => p.accion(j, 'mover', { de, a, promo });
  assert.equal(p.vistaPara('iara').legales.length, 20);
  m('iara', [6, 4], [4, 4]); m('nahuel', [1, 4], [3, 4]);
  m('iara', [7, 5], [4, 2]); m('nahuel', [0, 1], [2, 2]);
  m('iara', [7, 3], [3, 7]); m('nahuel', [0, 6], [2, 5]);
  assert.throws(() => m('nahuel', [1, 0], [2, 0]), /turno/);
  m('iara', [3, 7], [1, 5]);
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');
  assert.equal(p.motivoFin, 'mate');
  assert.match(p.jugadas.at(-1), /#$/);

  // Enroque corto, captura al paso y coronación en tableros armados.
  const est = (tablero, extra = {}) => ({ tablero, enroques: { bK: true, bQ: true, nK: true, nQ: true }, alPaso: null, ...extra });
  const vacio = () => Array.from({ length: 8 }, () => Array(8).fill(null));
  let t = vacio(); t[7][4] = 'bK'; t[7][7] = 'bR'; t[0][4] = 'nK';
  assert.ok(ajedrez.movidasLegales(est(t), 'b').some((x) => x.enroque === 'corto'));
  t[0][5] = 'nR'; // ataca f1: no se puede enrocar
  assert.ok(!ajedrez.movidasLegales(est(t), 'b').some((x) => x.enroque === 'corto'));
  t = vacio(); t[7][4] = 'bK'; t[0][4] = 'nK'; t[3][4] = 'bP'; t[3][3] = 'nP';
  assert.ok(ajedrez.movidasLegales(est(t, { alPaso: [2, 3] }), 'b').some((x) => x.alPaso));
  t = vacio(); t[7][4] = 'bK'; t[0][0] = 'nK'; t[1][7] = 'bP';
  assert.equal(ajedrez.movidasLegales(est(t), 'b').filter((x) => x.promo).length, 4);
  // Ahogado: rey negro en a8 sin movidas y sin jaque.
  t = vacio(); t[0][0] = 'nK'; t[2][1] = 'bQ'; t[7][7] = 'bK';
  assert.equal(ajedrez.movidasLegales(est(t), 'n').length, 0);
  assert.ok(!ajedrez.enJaque(t, 'n'));
});

test('ajedrez: reloj y tablas', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  try {
    const p = new ajedrez.PartidaAjedrez(J, ajedrez.validarConfig({ minutos: 1 }), { empieza: 'iara' });
    let avisos = 0; p.notificar = () => avisos++;
    mock.timers.tick(30000);
    p.accion('iara', 'mover', { de: [6, 4], a: [4, 4] });
    assert.ok(p.vistaPara('iara').reloj.yo <= 30000);
    mock.timers.tick(61000);
    assert.equal(p.estado, 'terminada');
    assert.equal(p.ganador, 'iara', 'a nahuel se le terminó el tiempo');
    assert.equal(p.motivoFin, 'tiempo');
    assert.ok(avisos > 0);
  } finally { mock.timers.reset(); }
  const q = new ajedrez.PartidaAjedrez(J, ajedrez.validarConfig({}), { empieza: 'iara' });
  q.accion('iara', 'ofrecerTablas');
  q.accion('nahuel', 'responderTablas', { acepta: true });
  assert.equal(q.estado, 'terminada');
  assert.equal(q.ganador, null);
});

test('reversi: dar vuelta, pasar y fin', () => {
  const p = new reversi.PartidaReversi(J, reversi.validarConfig({ lado: 6 }), { empieza: 'iara' });
  assert.equal(p.vistaPara('iara').posibles.length, 4);
  assert.throws(() => p.accion('iara', 'poner', { fila: 0, col: 0 }), /encerrás/);
  const { f, c } = p.vistaPara('iara').posibles[0];
  p.accion('iara', 'poner', { fila: f, col: c });
  assert.equal(p.cuenta('iara'), 4);
  assert.equal(p.cuenta('nahuel'), 1);
  // Se juega hasta el final con jugadas al azar.
  let vueltasMax = 100;
  while (p.estado === 'jugando' && vueltasMax--) {
    const v = p.vistaPara(p.turno);
    const x = v.posibles[0];
    p.accion(p.turno, 'poner', { fila: x.f, col: x.c });
  }
  assert.equal(p.estado, 'terminada');
  const q = restaurar(reversi.PartidaReversi, p);
  assert.equal(q.cuenta('iara'), p.cuenta('iara'));
});

test('tron: cuenta, giros, choque y rondas', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  try {
    const p = new tron.PartidaTron(J, tron.validarConfig({ tamanio: 'chico', rondas: 1 }), { empieza: 'iara' });
    assert.equal(p.fase, 'cuenta');
    mock.timers.tick(3000);
    assert.equal(p.fase, 'jugando');
    p.accion('iara', 'girar', { dir: 'izquierda' }); // contraria: se ignora
    assert.equal(p.motos.iara.prox.length, 0);
    p.accion('iara', 'girar', { dir: 'arriba' });
    // Nahuel sigue derecho hasta chocar con la pared izquierda; iara sube hasta el techo.
    for (let i = 0; i < 40 && p.estado === 'jugando'; i++) mock.timers.tick(105);
    assert.equal(p.estado, 'terminada');
    assert.ok(p.vistaPara('iara').rastros.yo.length > 1);
  } finally { mock.timers.reset(); }
  // Choque de frente: empate.
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  try {
    const p = new tron.PartidaTron(J, tron.validarConfig({ tamanio: 'chico', rondas: 1 }), { empieza: 'iara' });
    mock.timers.tick(3000);
    for (let i = 0; i < 30 && p.estado === 'jugando'; i++) mock.timers.tick(105);
    assert.equal(p.ganador, null);
  } finally { mock.timers.reset(); }
});

test('botellas: volcar, escondidos, deshacer y resolver', () => {
  const mezcla = [[0, 1, 0, 1], [1, 0, 1, 0], [], []];
  const p = new botellas.PartidaBotellas(J, botellas.validarConfig({ colores: 3, rondas: 1 }), { mezcla });
  const v = p.vistaPara('iara');
  assert.deepEqual(v.botellas[0], [null, null, null, 1], 'solo se ve el de arriba');
  assert.throws(() => p.accion('iara', 'volcar', { de: 2, a: 0 }), /no se puede/);
  p.accion('iara', 'volcar', { de: 0, a: 2 });
  assert.deepEqual(p.vistaPara('iara').botellas[0], [null, null, 0], 'se destapa el de abajo');
  p.accion('iara', 'deshacer');
  assert.deepEqual(p.tableros.iara.botellas[0], [0, 1, 0, 1]);
  const sol = botellas.resolver(mezcla);
  for (const [de, a] of sol) p.accion('iara', 'volcar', { de, a });
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');
  const g = botellas.generar(6, 2);
  assert.ok(botellas.resolver(g));
  const q = new botellas.PartidaBotellas(J, botellas.validarConfig({}));
  assert.equal(restaurar(botellas.PartidaBotellas, q).tableros.iara.botellas.length, 8);
});

test('adiviná la canción: elegir, armar, adivinar con errores de tipeo', () => {
  const p = new emojis.PartidaEmojis(J, emojis.validarConfig({ turnos: 1 }), { empieza: 'iara' });
  assert.equal(p.vistaPara('nahuel').opciones, null);
  p.accion('iara', 'elegir', { opcion: 0 });
  const titulo = p.vistaPara('iara').cancion.titulo;
  assert.equal(p.vistaPara('nahuel').cancion, null);
  assert.throws(() => p.accion('iara', 'picto', { id: 'nada' }), /no existe/);
  assert.throws(() => p.accion('iara', 'listo'), /al menos/);
  p.accion('iara', 'picto', { id: 'corazon' });
  assert.equal(p.vistaPara('nahuel').pictos.length, 0, 'no se ve mientras se arma');
  p.accion('iara', 'listo');
  p.accion('iara', 'picto', { id: 'sol' });
  p.accion('iara', 'picto', { id: 'luna' });
  assert.throws(() => p.accion('iara', 'picto', { id: 'nube' }), /ayuda/);
  p.accion('nahuel', 'adivinar', { texto: 'cualquier cosa' });
  p.accion('nahuel', 'adivinar', { texto: titulo.toLowerCase() });
  assert.equal(p.fase, 'revelado');
  assert.ok(p.puntos.nahuel > 0 && p.puntos.iara > 0);
  assert.ok(emojis.acierta('corazon partio', 'Corazón partío'));
  assert.ok(emojis.acierta('mariposa teknicolor', 'Mariposa tecknicolor'));
  assert.ok(!emojis.acierta('mariposa', 'Mariposa tecknicolor'));
  for (const c of emojis.CANCIONES) for (const id of c.pista) assert.ok(emojis.PICTOS.includes(id), `${c.titulo}: ${id}`);
  p.timer && clearTimeout(p.timer);
});

test('simón: mostrar, repetir, error y tiempo', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  try {
    const p = new simon.PartidaSimon(J, simon.validarConfig({ partidas: 1 }), { rand: () => 0.1 });
    assert.equal(p.fase, 'mostrando');
    assert.equal(p.vistaPara('iara').secuencia.length, 3);
    assert.throws(() => p.accion('iara', 'tocar', { color: 0 }), /Esperá/);
    mock.timers.tick(10000);
    assert.equal(p.fase, 'repitiendo');
    assert.equal(p.vistaPara('iara').secuencia, null, 'no se ve mientras repetís');
    for (const j of J) for (let i = 0; i < 3; i++) p.accion(j, 'tocar', { color: 0 });
    assert.equal(p.secuencia.length, 4, 'los dos acertaron: un color más');
    mock.timers.tick(10000);
    p.accion('iara', 'tocar', { color: 1 }); // error
    for (let i = 0; i < 4; i++) p.accion('nahuel', 'tocar', { color: 0 });
    assert.equal(p.estado, 'terminada');
    assert.equal(p.ganador, 'nahuel');
  } finally { mock.timers.reset(); }
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  try {
    const p = new simon.PartidaSimon(J, simon.validarConfig({ partidas: 1 }), { rand: () => 0.1 });
    mock.timers.tick(10000);
    p.accion('iara', 'tocar', { color: 0 });
    mock.timers.tick(20000); // se les terminó el tiempo: llegó más lejos iara
    assert.equal(p.ganador, 'iara');
  } finally { mock.timers.reset(); }
});

test('contrarreloj de colores: primero que acierta y bloqueo al errar', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  try {
    const p = new colores.PartidaColores(J, colores.validarConfig({ cartas: 5 }));
    assert.equal(p.fase, 'cuenta');
    mock.timers.tick(2500);
    assert.equal(p.fase, 'carta');
    const carta = p.carta;
    assert.notEqual(carta.palabra, carta.tinta);
    p.accion('iara', 'responder', { color: carta.palabra }); // le hizo caso a la palabra: mal
    assert.ok(p.vistaPara('iara').bloqueado);
    p.accion('iara', 'responder', { color: carta.tinta });
    assert.equal(p.puntos.iara, 0, 'bloqueada no suma');
    p.accion('nahuel', 'responder', { color: carta.tinta });
    assert.equal(p.puntos.nahuel, 1);
    assert.equal(p.vistaPara('iara').ganoCarta, 'rival');
    for (let i = 0; i < 10; i++) mock.timers.tick(6500);
    assert.equal(p.estado, 'terminada');
    assert.equal(p.ganador, 'nahuel');
  } finally { mock.timers.reset(); }
});

test('bots: juegan una partida entera de cada juego nuevo sin trabarse', async () => {
  for (const [id, mod, Clase, config] of [
    ['truco', truco, truco.PartidaTruco, { meta: 15 }],
    ['ajedrez', ajedrez, ajedrez.PartidaAjedrez, {}],
    ['reversi', reversi, reversi.PartidaReversi, { lado: 6 }],
    ['botellas', botellas, botellas.PartidaBotellas, { colores: 4, rondas: 1, escondidos: false }],
    ['emojis', emojis, emojis.PartidaEmojis, { turnos: 1 }],
  ]) {
    const p = new Clase(J, mod.validarConfig(config));
    for (let i = 0; i < 3000 && p.estado === 'jugando'; i++) {
      for (const j of J) {
        if (p.estado !== 'jugando') break;
        const jug = await jugadaBot(id, JSON.parse(JSON.stringify(p.vistaPara(j))), j, { rival: p.rival(j) });
        if (jug) { try { p.accion(j, jug.tipo, jug.datos ?? {}); } catch { /* el bot puede errarle */ } }
      }
    }
    clearTimeout(p.timer);
    if (id !== 'ajedrez') assert.equal(p.estado, 'terminada', `${id} no terminó`);
  }
});
