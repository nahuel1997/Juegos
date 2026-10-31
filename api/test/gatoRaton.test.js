import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PartidaGatoRaton, validarConfig, generarLaberinto, distancias, vecinos, DIRS, RATON_MS } from '../src/juegos/gatoRaton.js';
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
    // Con pocos caminos puede salir alguno sin vueltas; con varios o muchos siempre hay.
    if (caminos === 'pocos') assert.ok(pasajes >= lado * lado - 1);
    else assert.ok(pasajes > lado * lado - 1, `${caminos}: hay vueltas`);
    // Los bordes están cerrados.
    for (let i = 0; i < lado; i++) assert.ok(p[0][i] & 1 && p[lado - 1][i] & 4 && p[i][0] & 8 && p[i][lado - 1] & 2);
  }
});

// Arranca la ronda ya (sin la cuenta ni el timer): el tiempo lo maneja el test con avanzar().
function ya(p) {
  clearTimeout(p.timer);
  p.fase = 'jugando';
  p.prox = { raton: p.inicio + RATON_MS, gato: p.inicio + p.msGato };
  return p.inicio;
}

// Lleva al ratón por el camino más corto hasta `hasta`, paso a paso, con el gato estacionado lejos.
function caminarRaton(p, hasta, t) {
  for (const dir of camino(p.paredes, p.raton, hasta, [p.gato])) {
    p.accion(p.ratonEs, 'mover', { dir });
    t += RATON_MS;
    p.avanzar(t);
    if (p.fase !== 'jugando') break;
  }
  return t;
}

test('gato y ratón: madrigueras, quesos lejos y el gato no entra a las madrigueras', () => {
  const p = new PartidaGatoRaton(J, validarConfig({ lado: 11, quesos: 4 }));
  clearTimeout(p.timer);
  assert.ok(J.includes(p.moneda));
  assert.equal(p.gatoEs, p.moneda);
  assert.equal(p.fase, 'cuenta');
  assert.equal(p.quesos.length, 4);
  assert.equal(p.madrigueras.length, 3);
  assert.deepEqual(p.raton, p.madrigueras[0]);
  for (const m of p.madrigueras) {
    const entrada = vecinos(p.paredes, m)[0];
    const hacia = vecinos(p.paredes, entrada.pos).find((v) => v.pos[0] === m[0] && v.pos[1] === m[1]);
    assert.equal(p.libre('gato', entrada.pos, hacia.dir), false);
    assert.equal(p.libre('raton', entrada.pos, hacia.dir), true);
  }
  const vista = p.vistaPara(p.gatoEs);
  assert.equal(vista.miRol, 'gato');
  assert.equal(vista.monedaGato, 'yo');
  assert.ok(vista.faltaCuentaMs > 0);
});

test('gato y ratón: avanza solo hacia donde apunta, dobla cuando puede y para en la pared', () => {
  const p = new PartidaGatoRaton(J, validarConfig({ lado: 9 }));
  let t = ya(p);
  estacionarGato(p, []);
  const salida = vecinos(p.paredes, p.raton)[0];
  p.accion(p.ratonEs, 'mover', { dir: salida.dir });
  t += RATON_MS;
  p.avanzar(t);
  assert.deepEqual(p.raton, salida.pos);
  // Sigue derecho sin tocar nada hasta chocar una pared (y ahí se queda).
  for (let i = 0; i < 30; i++) { t += RATON_MS; p.avanzar(t); }
  const [f, c] = p.raton;
  assert.ok(p.paredes[f][c] & DIRS[salida.dir].bit || p.fase !== 'jugando');
  // Pedir una dirección cerrada la deja anotada para cuando se pueda.
  const cerrada = Object.keys(DIRS).find((d) => p.paredes[f][c] & DIRS[d].bit && d !== salida.dir);
  if (cerrada && p.fase === 'jugando') {
    p.accion(p.ratonEs, 'mover', { dir: cerrada });
    assert.equal(p.quiere[p.ratonEs], cerrada);
  }
});

test('gato y ratón: comer todos los quesos gana la ronda; se cambian los papeles y gana el que suma más', () => {
  const p = new PartidaGatoRaton(J, validarConfig({ lado: 9, rondas: 2, quesos: 2, tiempo: 180 }));
  const primerGato = p.gatoEs;
  let t = ya(p);
  p.gato = [-9, -9]; // el gato fuera del tablero: que no tape ningún camino
  while (p.quesos.length && p.fase === 'jugando') t = caminarRaton(p, p.quesos[0], t);
  assert.equal(p.fase, 'resumen');
  assert.equal(p.rondas[0].motivo, 'quesos');
  assert.equal(p.puntos[p.ratonEs], 1);
  p.accion('iara', 'siguiente');
  assert.equal(p.ronda, 1);
  p.accion('nahuel', 'siguiente');
  clearTimeout(p.timer);
  assert.equal(p.ronda, 2);
  assert.notEqual(p.gatoEs, primerGato, 'en la ronda 2 se cambian los papeles');
  // Ronda 2: el gato va derecho al ratón quieto y lo atrapa.
  t = ya(p);
  const centro = Math.floor(p.paredes.length / 2);
  p.raton = [centro, centro]; // afuera de la madriguera (ahí el gato no entra)
  const ruta = camino(p.paredes, p.gato, p.raton, p.madrigueras);
  for (const dir of ruta) {
    p.accion(p.gatoEs, 'mover', { dir });
    t += p.msGato;
    p.avanzar(t);
    if (p.fase !== 'jugando') break;
  }
  assert.equal(p.rondas[1].motivo, 'atrapado');
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, p.gatoEs);
  assert.equal(p.puntos[p.gatoEs], 2);
});

test('gato y ratón: si se termina el tiempo gana el gato; y la partida se guarda y se restaura', async () => {
  const p = new PartidaGatoRaton(J, validarConfig({ lado: 7, rondas: 1, tiempo: 20 }));
  p.inicio = Date.now() - 21000;
  p.hasta = Date.now() - 1;
  const vivo = setInterval(() => {}, 50); // los timers de la partida no mantienen vivo al proceso
  await new Promise((ok) => { p.notificar = ok; });
  clearInterval(vivo);
  assert.equal(p.rondas[0].motivo, 'tiempo');
  assert.equal(p.ganador, p.gatoEs);

  const q = new PartidaGatoRaton(J, validarConfig({}));
  clearTimeout(q.timer);
  const datos = deserializar(serializar({ partida: q })).partida;
  const r = Object.assign(new PartidaGatoRaton(datos.jugadores, datos.config), datos);
  assert.deepEqual(r.paredes, q.paredes);
  assert.deepEqual(r.quesos, q.quesos);
  r.reanudar();
  assert.equal(r.fase, 'cuenta');
  assert.equal(r.ronda, 1);
  clearTimeout(r.timer);
});
