import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PartidaGatoRaton, validarConfig, generarLaberinto, distancias, vecinos, DIRS } from '../src/juegos/gatoRaton.js';
import { serializar, deserializar } from '../src/persistencia.js';

const J = ['iara', 'nahuel'];

// Camino más corto de `desde` a `hasta` (lista de direcciones), sin pasar por las prohibidas.
function camino(paredes, desde, hasta, prohibidas = []) {
  const dist = distancias(paredes, hasta, prohibidas);
  const pasos = [];
  let actual = desde;
  while (dist[actual[0]][actual[1]] > 0) {
    const v = vecinos(paredes, actual).find(({ pos }) => dist[pos[0]][pos[1]] === dist[actual[0]][actual[1]] - 1);
    pasos.push(v.dir);
    actual = v.pos;
  }
  return pasos;
}

// Estaciona al gato en una casilla que no toque el camino del ratón (para probar sin que moleste).
function estacionarGato(p, pasos) {
  const usadas = [p.raton];
  let a = p.raton;
  for (const d of pasos) { a = [a[0] + DIRS[d].df, a[1] + DIRS[d].dc]; usadas.push(a); }
  const lado = p.paredes.length;
  let mejor = null;
  for (let f = 0; f < lado; f++) for (let c = 0; c < lado; c++) {
    const lejos = Math.min(...usadas.map(([uf, uc]) => Math.abs(uf - f) + Math.abs(uc - c)));
    if (!mejor || lejos > mejor.lejos) mejor = { pos: [f, c], lejos };
  }
  assert.ok(mejor.lejos >= 2);
  p.gato = mejor.pos;
}

test('gato y ratón: el laberinto conecta todo y tiene vueltas (más de un camino)', () => {
  for (const caminos of ['pocos', 'varios', 'muchos']) {
    const lado = 13;
    const p = generarLaberinto(lado, caminos);
    const dist = distancias(p, [0, 0]);
    assert.ok(dist.flat().every((d) => d !== Infinity), 'todas las casillas alcanzables');
    // Un laberinto perfecto tiene lado²-1 pasajes; con vueltas tiene más.
    let pasajes = 0;
    for (let f = 0; f < lado; f++) for (let c = 0; c < lado; c++) { if (!(p[f][c] & 2)) pasajes++; if (!(p[f][c] & 4)) pasajes++; }
    assert.ok(pasajes > lado * lado - 1, `${caminos}: hay vueltas`);
    // Los bordes están cerrados.
    for (let i = 0; i < lado; i++) assert.ok(p[0][i] & 1 && p[lado - 1][i] & 4 && p[i][0] & 8 && p[i][lado - 1] & 2);
  }
});

test('gato y ratón: moneda, papeles, el ratón mueve primero y el queso tiene varias entradas', () => {
  const p = new PartidaGatoRaton(J, validarConfig({ lado: 9 }));
  assert.ok(J.includes(p.moneda));
  assert.equal(p.gatoEs, p.moneda);
  assert.equal(p.turno, p.ratonEs);
  assert.deepEqual(p.raton, p.madriguera);
  assert.ok(vecinos(p.paredes, p.queso).length >= 3);
  assert.throws(() => p.accion(p.gatoEs, 'mover', { dir: 'arriba' }), /No es tu turno/);
  const vista = p.vistaPara(p.gatoEs);
  assert.equal(vista.miRol, 'gato');
  assert.equal(vista.monedaGato, 'yo');
});

test('gato y ratón: paredes, no pisar al gato, el gato no pisa el queso', () => {
  const p = new PartidaGatoRaton(J, validarConfig({ lado: 8 }));
  const [f, c] = p.raton;
  const cerrada = Object.keys(DIRS).find((d) => p.paredes[f][c] & DIRS[d].bit);
  assert.throws(() => p.accion(p.ratonEs, 'mover', { dir: cerrada }), /pared/);
  // Gato al lado del queso: no puede entrar.
  p.turno = p.gatoEs;
  const entrada = vecinos(p.paredes, p.queso)[0];
  p.gato = entrada.pos;
  const haciaQueso = vecinos(p.paredes, p.gato).find((v) => v.pos[0] === p.queso[0] && v.pos[1] === p.queso[1]);
  assert.throws(() => p.accion(p.gatoEs, 'mover', { dir: haciaQueso.dir }), /queso/);
});

test('gato y ratón: el ratón llega al queso, se cambian los papeles y gana el que suma más', () => {
  const p = new PartidaGatoRaton(J, validarConfig({ lado: 9, rondas: 2, limite: 200 }));
  const primerGato = p.gatoEs;
  // Ronda 1: el gato se queda quieto lejos del camino y el ratón camina al queso.
  const pasos = camino(p.paredes, p.raton, p.queso);
  estacionarGato(p, pasos);
  for (const dir of pasos) {
    p.accion(p.ratonEs, 'mover', { dir });
    if (p.fase !== 'jugando') break;
    p.turno = p.ratonEs; // el gato "pasa"
  }
  assert.equal(p.fase, 'resumen');
  assert.equal(p.rondas[0].motivo, 'queso');
  assert.equal(p.puntos[p.ratonEs], 1);
  p.accion('iara', 'siguiente');
  assert.equal(p.ronda, 1);
  p.accion('nahuel', 'siguiente');
  assert.equal(p.ronda, 2);
  assert.notEqual(p.gatoEs, primerGato, 'en la ronda 2 se cambian los papeles');
  // Ronda 2: el gato atrapa al ratón.
  p.accion(p.ratonEs, 'mover', { dir: vecinos(p.paredes, p.raton)[0].dir });
  const haciaRaton = camino(p.paredes, p.gato, p.raton, [p.queso]);
  p.gato = (() => { let g = p.gato; const pasosG = haciaRaton.slice(0, -1); for (const d of pasosG) g = [g[0] + DIRS[d].df, g[1] + DIRS[d].dc]; return g; })();
  p.accion(p.gatoEs, 'mover', { dir: haciaRaton[haciaRaton.length - 1] });
  assert.equal(p.rondas[1].motivo, 'atrapado');
  assert.equal(p.estado, 'terminada');
  // Ganó de ratón en la 1 y de gato en la 2: 2 a 0.
  assert.equal(p.ganador, p.gatoEs);
  assert.equal(p.puntos[p.gatoEs], 2);
});

test('gato y ratón: si el ratón se pasa del límite gana el gato; y la partida se guarda y se restaura', () => {
  const p = new PartidaGatoRaton(J, validarConfig({ lado: 7, rondas: 1, limite: 10 }));
  // El ratón va y viene entre la madriguera y un vecino (sin llegar al queso).
  const ida = vecinos(p.paredes, p.raton)[0];
  const vuelta = Object.keys(DIRS).find((d) => DIRS[d].bit === DIRS[ida.dir].opuesto);
  estacionarGato(p, [ida.dir]);
  for (let i = 0; i < 10 && p.fase === 'jugando'; i++) {
    const v = { dir: i % 2 ? vuelta : ida.dir };
    p.turno = p.ratonEs;
    p.accion(p.ratonEs, 'mover', { dir: v.dir });
  }
  assert.equal(p.rondas[0].motivo, 'tiempo');
  assert.equal(p.ganador, p.gatoEs);

  const q = new PartidaGatoRaton(J, validarConfig({}));
  const datos = deserializar(serializar({ partida: q })).partida;
  const r = Object.assign(new PartidaGatoRaton(datos.jugadores, datos.config), datos);
  assert.deepEqual(r.paredes, q.paredes);
  assert.deepEqual(r.raton, q.raton);
  r.accion(r.ratonEs, 'mover', { dir: vecinos(r.paredes, r.raton).find(({ pos }) => pos[0] !== r.gato[0] || pos[1] !== r.gato[1]).dir });
  assert.equal(r.turno, r.gatoEs);
});
