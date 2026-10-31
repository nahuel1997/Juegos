// Palabras cruzadas, Jenga, Nim, Más o menos, Tocá el punto, Contá los objetos, Ruleta de emojis y Adiviná.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as cruzadas from '../src/juegos/palabrasCruzadas.js';
import * as jenga from '../src/juegos/jenga.js';
import * as nim from '../src/juegos/nim.js';
import * as mom from '../src/juegos/masOMenos.js';
import * as toca from '../src/juegos/tocaElPunto.js';
import * as conta from '../src/juegos/contaObjetos.js';
import * as ruleta from '../src/juegos/ruletaEmojis.js';
import * as adivina from '../src/juegos/adivina.js';
import { jugadaBot } from '../src/bots.js';
import { serializar, deserializar } from '../src/persistencia.js';

const J = ['iara', 'nahuel'];
const T = ['iara', 'nahuel', 'inv-abc'];
const sinReloj = (p) => { clearTimeout(p.timer); p.timer = null; return p; };
// Avanza las fases por tiempo sin esperar (llama a lo que haría el reloj).
const vencer = (p) => { sinReloj(p); p.alVencer(); sinReloj(p); };

// Juega una partida entera entre bots, sin esperas.
async function jugarConBots(id, p, max = 3000) {
  for (let i = 0; i < max && p.estado === 'jugando'; i++) {
    let algo = false;
    for (const j of p.activos ?? p.jugadores) {
      if (p.estado !== 'jugando') break;
      const jug = await jugadaBot(id, JSON.parse(JSON.stringify(p.vistaPara(j))), j, { rival: p.jugadores.find((x) => x !== j) });
      if (jug) { try { p.accion(j, jug.tipo, jug.datos ?? {}); algo = true; } catch { /* jugada vieja */ } }
    }
    sinReloj(p);
    if ((!algo || i % 25 === 24) && p.hasta) vencer(p); // los de tiempo real también tienen que avanzar
  }
  sinReloj(p);
  return p;
}

// ---------- Palabras cruzadas ----------
test('palabras cruzadas: la primera por el centro, sin huecos, y los puntos con casillas especiales', () => {
  const vacio = Array.from({ length: 15 }, () => Array(15).fill(null));
  const ficha = (l, f, c) => ({ l, v: cruzadas.VALOR[l], f, c });
  assert.throws(() => cruzadas.evaluarJugada(vacio, [ficha('S', 0, 0), ficha('I', 0, 1)]), /centro/);
  assert.throws(() => cruzadas.evaluarJugada(vacio, [ficha('S', 7, 7), ficha('I', 8, 8)]), /misma fila/);
  assert.throws(() => cruzadas.evaluarJugada(vacio, [ficha('S', 7, 7), ficha('I', 7, 9)]), /huecos/);
  // CASA en la fila del centro desde la columna 4: C(4) A(5) S(6) A(7=centro, palabra x2). C=3, A=1, S=1, A=1 → 6 x2 = 12.
  const ev = cruzadas.evaluarJugada(vacio, [ficha('C', 7, 4), ficha('A', 7, 5), ficha('S', 7, 6), ficha('A', 7, 7)]);
  assert.equal(ev.palabras[0].texto, 'CASA');
  assert.equal(ev.total, 12);
  // Una cruzada que usa la A del centro: L3 en (5,5)? No: la A está en (7,5); se arma "MAR" vertical.
  const tab = vacio.map((f) => [...f]);
  for (const x of [ficha('C', 7, 4), ficha('A', 7, 5), ficha('S', 7, 6), ficha('A', 7, 7)]) tab[x.f][x.c] = x;
  const ev2 = cruzadas.evaluarJugada(tab, [ficha('M', 6, 5), ficha('R', 8, 5)]);
  assert.equal(ev2.palabras[0].texto, 'MAR');
  assert.throws(() => cruzadas.evaluarJugada(tab, [ficha('M', 0, 0), ficha('A', 0, 1)]), /tocar/);
});

test('palabras cruzadas: jugada en revisión, "no vale" la anula y aceptar la confirma', () => {
  const p = sinReloj(new cruzadas.PartidaPalabrasCruzadas(J, cruzadas.validarConfig({})));
  const yo = p.turno;
  const otro = J.find((x) => x !== yo);
  // Le damos fichas conocidas.
  p.atriles[yo] = [{ id: 901, l: 'S', v: 1 }, { id: 902, l: 'O', v: 1 }, { id: 903, l: 'L', v: 1 }, { id: 904, l: '', v: 0 }];
  p.accion(yo, 'jugar', { fichas: [{ id: 901, f: 7, c: 6 }, { id: 902, f: 7, c: 7 }, { id: 903, f: 7, c: 8 }] });
  sinReloj(p);
  assert.equal(p.fase, 'revision');
  assert.equal(p.vistaPara(otro).pendiente.palabras[0].texto, 'SOL');
  assert.equal(p.vistaPara(otro).pendiente.palabras[0].conocida, true);
  assert.throws(() => p.accion(yo, 'aceptar'), /propia/);
  p.accion(otro, 'rechazar');
  sinReloj(p);
  assert.equal(p.tablero[7][7], null);
  assert.equal(p.turno, otro);
  assert.equal(p.atriles[yo].length, 4);
  // Ahora juega el otro y se acepta.
  p.atriles[otro] = [{ id: 911, l: 'M', v: 3 }, { id: 912, l: '', v: 0 }];
  p.accion(otro, 'jugar', { fichas: [{ id: 911, f: 7, c: 7 }, { id: 912, f: 7, c: 8, l: 'I' }] });
  p.accion(yo, 'aceptar');
  sinReloj(p);
  assert.equal(p.tablero[7][8].comodin, true);
  assert.equal(p.puntos[otro], 6); // (3 + 0) x2 del centro
  assert.equal(p.atriles[otro].length, 7);
});

test('palabras cruzadas: una partida entera entre bots termina', async () => {
  const p = await jugarConBots('palabras-cruzadas', new cruzadas.PartidaPalabrasCruzadas(J, cruzadas.validarConfig({ revision: 'no' })));
  assert.equal(p.estado, 'terminada');
  assert.ok(p.tablero.flat().filter(Boolean).length >= 10, 'se jugaron palabras');
});

// ---------- Jenga ----------
test('jenga: qué bloques se pueden sacar, zona más chica abajo, y el bloque va arriba', () => {
  const torre = Array.from({ length: 12 }, () => [true, true, true]);
  assert.equal(jenga.puedeSacar(torre, 11, 1), false); // el piso de arriba no
  assert.equal(jenga.puedeSacar(torre, 0, 1), true);
  assert.ok(jenga.anchoZona(torre, 0, 1) < jenga.anchoZona(torre, 10, 1));
  torre[3] = [true, false, true];
  assert.ok(jenga.anchoZona(torre, 3, 0) < 0.1, 'dejar solo uno de costado es muy arriesgado');
  assert.equal(jenga.marca(0), 0);
  assert.equal(jenga.marca(jenga.PERIODO_MS / 2), 1);

  const p = sinReloj(new jenga.PartidaJenga(J, jenga.validarConfig({ pisos: 10, rondas: 1 })));
  const yo = p.turno;
  assert.throws(() => p.accion(yo, 'elegir', { piso: 9, pos: 0 }), /no se puede/);
  p.accion(yo, 'elegir', { piso: 5, pos: 1 });
  sinReloj(p);
  // Tocar justo en el centro de la zona: sale.
  const { centro } = p.intento;
  p.intento.inicio = Date.now() - (centro * jenga.PERIODO_MS) / 2;
  p.accion(yo, 'sacar', { t: (centro * jenga.PERIODO_MS) / 2 });
  sinReloj(p);
  assert.equal(p.torre[5][1], false);
  assert.equal(p.torre.length, 11);
  assert.deepEqual(p.torre[10], [true, false, false]);
  assert.notEqual(p.turno, yo);
});

test('jenga: fallar tambalea y al caerse pierde el que la tiró', () => {
  const p = sinReloj(new jenga.PartidaJenga(T, jenga.validarConfig({ pisos: 10, rondas: 1 })));
  const yo = p.turno;
  p.accion(yo, 'elegir', { piso: 2, pos: 1 });
  sinReloj(p);
  p.tambaleo = 0.95;
  const lejos = p.intento.centro > 0.5 ? 0 : jenga.PERIODO_MS / 2; // la marca en la otra punta
  p.intento.inicio = Date.now() - lejos;
  p.accion(yo, 'sacar', { t: lejos });
  sinReloj(p);
  assert.equal(p.cayo, yo);
  assert.equal(p.estado, 'terminada');
  assert.equal(p.puntos[yo], 0);
  assert.ok(T.filter((x) => x !== yo).every((x) => p.puntos[x] === 1));
});

// ---------- Nim ----------
test('nim: pirámide clásica, límite por jugada y el que saca el último pierde', () => {
  const p = sinReloj(new nim.PartidaNim(J, nim.validarConfig({ rondas: 1, limite: 3 })));
  assert.deepEqual(p.pilas, [1, 3, 5, 7]);
  const yo = p.turno;
  const otro = J.find((x) => x !== yo);
  assert.throws(() => p.accion(yo, 'sacar', { pila: 3, cantidad: 4 }), /Los palitos/);
  p.pilas = [0, 0, 1, 1];
  p.accion(yo, 'sacar', { pila: 2, cantidad: 1 });
  p.accion(otro, 'sacar', { pila: 3, cantidad: 1 }); // se llevó el último
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, yo);
  assert.equal(nim.nimSuma([1, 3, 5, 7]), 0);
});

test('nim: partida entera entre bots', async () => {
  const p = await jugarConBots('nim', new nim.PartidaNim(J, nim.validarConfig({ armado: 'azar', rondas: 3 })));
  assert.equal(p.estado, 'terminada');
  assert.equal(p.historial.length, 3);
});

// ---------- Más o menos ----------
test('más o menos: el número escondido se ve recién al revelar; acertar suma y el más rápido tiene yapa', () => {
  const p = sinReloj(new mom.PartidaMasOMenos(T, mom.validarConfig({ preguntas: 3, categorias: ['alturas'] })));
  assert.equal(p.vistaPara('iara').b.texto, null);
  vencer(p); // cuenta → pregunta
  assert.throws(() => p.accion('iara', 'responder', { r: 'quizas' }), /inválida/);
  const bien = p.pregunta.b.valor > p.pregunta.a.valor ? 'mas' : 'menos';
  const mal = bien === 'mas' ? 'menos' : 'mas';
  p.accion('nahuel', 'responder', { r: bien });
  p.accion('iara', 'responder', { r: bien });
  assert.deepEqual(p.vistaPara('iara').respuestas, {}, 'no se ve lo que eligieron los otros');
  p.accion('inv-abc', 'responder', { r: mal });
  sinReloj(p);
  assert.equal(p.fase, 'revelado');
  assert.ok(p.vistaPara('iara').b.texto);
  assert.equal(p.puntos.nahuel, 2);
  assert.equal(p.puntos.iara, 1);
  assert.equal(p.puntos['inv-abc'], 0);
  for (const cat of Object.keys(mom.CATEGORIAS)) {
    const [a, b] = mom.armarPar(cat);
    assert.ok(Math.abs(a[1] - b[1]) / Math.max(a[1], b[1]) > 0.08, `${cat}: números distintos`);
  }
});

// ---------- Tocá el punto ----------
test('tocá el punto: la misma secuencia para todos, toques en orden y el que más toca gana la ronda', () => {
  const a = toca.objetivo(1234, 5, 'normal');
  assert.deepEqual(a, toca.objetivo(1234, 5, 'normal'));
  assert.ok(a.x >= a.r && a.x <= 1 - a.r);
  const p = sinReloj(new toca.PartidaTocaElPunto(T, toca.validarConfig({ rondas: 1 })));
  assert.throws(() => p.accion('iara', 'tocar', { i: 0 }), /Esperá/);
  vencer(p); // cuenta → jugando
  p.accion('iara', 'tocar', { i: 0 });
  p.accion('iara', 'tocar', { i: 1 }); // demasiado rápido: no cuenta
  p.ultimo.iara = 0;
  p.accion('iara', 'tocar', { i: 1 });
  p.accion('nahuel', 'tocar', { i: -1 }); // uno viejo: no cuenta
  p.accion('nahuel', 'errar');
  assert.equal(p.aciertos.iara, 2);
  assert.equal(p.aciertos.nahuel, 0);
  vencer(p); // fin del tiempo
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');
});

// ---------- Contá los objetos ----------
test('contá los objetos: la escena no viaja mientras se responde; exacto 3, cerca 1', () => {
  const p = sinReloj(new conta.PartidaContaObjetos(T, conta.validarConfig({ preguntas: 3, dificultad: 'facil' })));
  assert.equal(p.vistaPara('iara').escena, null);
  vencer(p); // cuenta → mirando
  const v = p.vistaPara('iara');
  assert.equal(v.escena.filter((x) => x.p === v.objetivo).length, p.ronda.cantidad);
  vencer(p); // mirando → respondiendo
  assert.equal(p.vistaPara('iara').escena, null);
  const n = p.ronda.cantidad;
  p.accion('nahuel', 'responder', { n });
  p.accion('iara', 'responder', { n });
  p.accion('inv-abc', 'responder', { n: n + 1 });
  sinReloj(p);
  assert.equal(p.fase, 'revelado');
  assert.deepEqual(p.puntos, { iara: 3, nahuel: 4, 'inv-abc': 1 });
});

// ---------- Ruleta de emojis ----------
test('ruleta de emojis: los dibujitos existen, 3/2/1 por orden y a mitad de tiempo la primera letra', async () => {
  const { PICTOS } = await import('../src/juegos/emojis.js');
  const ids = new Set(PICTOS);
  for (const [pictos, r] of ruleta.COMBOS) assert.ok(pictos.every((x) => ids.has(x)), `${r}: dibujitos que existen`);
  const p = sinReloj(new ruleta.PartidaRuletaEmojis(T, ruleta.validarConfig({ rondas: 3 })));
  assert.equal(p.vistaPara('iara').pictos, null, 'mientras gira no se ven');
  vencer(p);
  const resp = p.combo[1];
  assert.equal(p.vistaPara('iara').primera, null);
  assert.deepEqual(p.accion('iara', 'adivinar', { texto: 'cualquier cosa' }), { ok: true, acierto: false });
  p.ultimoIntento = {};
  assert.deepEqual(p.accion('nahuel', 'adivinar', { texto: resp.toLowerCase() }), { ok: true, acierto: true });
  p.accion('iara', 'adivinar', { texto: resp });
  assert.equal(p.vistaPara('nahuel').respuesta, resp);
  assert.equal(p.vistaPara('inv-abc').respuesta, null);
  vencer(p); // mitad: pista
  assert.equal(p.vistaPara('inv-abc').primera, resp[0]);
  assert.deepEqual([p.puntos.nahuel, p.puntos.iara], [3, 2]);
});

// ---------- Adiviná ----------
test('adiviná: las pistas van saliendo y saberla antes vale más', () => {
  const p = sinReloj(new adivina.PartidaAdivina(T, adivina.validarConfig({ rondas: 3, categorias: ['clubes'] })));
  vencer(p); // primera pista
  assert.equal(p.vistaPara('iara').pistas.length, 1);
  const [respuesta, otras] = p.item.datos;
  p.accion('iara', 'adivinar', { texto: otras[0] ?? respuesta });
  vencer(p); vencer(p); // tercera pista
  p.accion('nahuel', 'adivinar', { texto: respuesta });
  assert.equal(p.puntos.iara, 6); // 5 + yapa
  assert.equal(p.puntos.nahuel, 3);
  assert.equal(p.vistaPara('inv-abc').pistas.length, 3);
  assert.equal(p.vistaPara('inv-abc').respuesta, null);
  for (const cat of Object.values(adivina.CATEGORIAS)) for (const [r, , pistas] of cat.items) assert.equal(pistas.length, 5, `${r}: cinco pistas`);
});

// ---------- Todos: abandonar con 3, guardar y restaurar, y partidas enteras con bots ----------
test('juegos grupales: con 3, el que abandona queda afuera y la partida sigue', () => {
  const p = sinReloj(new mom.PartidaMasOMenos(T, mom.validarConfig({ preguntas: 3 })));
  p.abandonar('inv-abc');
  assert.equal(p.estado, 'jugando');
  assert.throws(() => p.accion('inv-abc', 'responder', { r: 'mas' }), /Abandonaste/);
  p.abandonar('nahuel');
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');
});

test('juegos grupales: se guardan y al restaurarlos el reloj sigue', () => {
  for (const [Clase, mod] of [[mom.PartidaMasOMenos, mom], [conta.PartidaContaObjetos, conta], [ruleta.PartidaRuletaEmojis, ruleta], [adivina.PartidaAdivina, adivina], [jenga.PartidaJenga, jenga], [cruzadas.PartidaPalabrasCruzadas, cruzadas]]) {
    const p = sinReloj(new Clase(T.slice(0, 3), mod.validarConfig({})));
    const datos = deserializar(serializar({ p })).p;
    const r = Object.assign(new Clase(datos.jugadores, datos.config), datos);
    sinReloj(r);
    r.reanudar();
    assert.equal(r.fase, p.fase);
    if (r.hasta) assert.ok(r.timer, `${p.juego}: reloj reprogramado`);
    sinReloj(r);
  }
});

test('bots: partidas enteras de los juegos grupales terminan', async () => {
  const casos = [
    ['mas-o-menos', new mom.PartidaMasOMenos(T, mom.validarConfig({ preguntas: 3 }))],
    ['conta-objetos', new conta.PartidaContaObjetos(T, conta.validarConfig({ preguntas: 3 }))],
    ['ruleta-emojis', new ruleta.PartidaRuletaEmojis(T, ruleta.validarConfig({ rondas: 3 }))],
    ['adivina', new adivina.PartidaAdivina(T, adivina.validarConfig({ rondas: 3 }))],
    ['toca-el-punto', new toca.PartidaTocaElPunto(T, toca.validarConfig({ rondas: 1 }))],
    ['jenga', new jenga.PartidaJenga(T, jenga.validarConfig({ rondas: 2 }))],
  ];
  for (const [id, p] of casos) {
    await jugarConBots(id, p);
    assert.equal(p.estado, 'terminada', `${id} terminó`);
  }
});
