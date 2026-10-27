import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PartidaChinchon, validarConfig, mazoNuevo, mejorArreglo, esChinchon, pegarSueltas } from '../src/juegos/chinchon.js';
import { serializar, deserializar } from '../src/persistencia.js';

const J = ['iara', 'nahuel'];
const CFG = validarConfig({});
// 'o5' = 5 de oros, 'c12' = rey de copas, 'J1' = comodín.
const PAL = { o: 'oros', c: 'copas', e: 'espadas', b: 'bastos' };
const cartas = (txt) => txt.split(' ').map((t) => (t[0] === 'J'
  ? { id: `comodin-${t.slice(1)}`, palo: 'comodin', numero: 0 }
  : { id: `${PAL[t[0]]}-${t.slice(1)}`, palo: PAL[t[0]], numero: Number(t.slice(1)) }));

test('chinchón: mazo con y sin ochos/nueves y comodines', () => {
  assert.equal(mazoNuevo(CFG).length, 50);
  assert.equal(mazoNuevo(validarConfig({ comodines: false, ochosYNueves: false })).length, 40);
});

test('chinchón: arma escaleras y piernas con la menor cantidad de puntos sueltos', () => {
  let a = mejorArreglo(cartas('o3 o4 o5 c7 e7 b7 b1'), CFG);
  assert.equal(a.puntos, 1);
  assert.equal(a.combos.length, 2);
  a = mejorArreglo(cartas('o5 o6 J1 c12 e12 b2 b3'), CFG);
  assert.equal(a.puntos, 16, 'conviene usar el comodín con los dos reyes: quedan 5+6+2+3');
});

test('chinchón: comodín en escalera y en pierna', () => {
  // 5-6-comodín de oros y pierna de 12 con comodín: queda solo el 1.
  const a = mejorArreglo(cartas('o5 o6 J1 c12 e12 J2 b1'), CFG);
  assert.equal(a.puntos, 1);
  // Sin ochos ni nueves, el 7 y el 10 son seguidos.
  const sin = validarConfig({ ochosYNueves: false });
  assert.equal(mejorArreglo(cartas('o6 o7 o10 b1'), sin).puntos, 1);
  assert.equal(mejorArreglo(cartas('o6 o7 o10 b1'), CFG).puntos, 24);
});

test('chinchón: chinchón y pegar sueltas en la escalera del que corta', () => {
  assert.ok(esChinchon(cartas('c3 c4 c5 c6 c7 c8 c9'), CFG));
  assert.ok(!esChinchon(cartas('c3 c4 c5 J1 c7 c8 c9'), CFG));
  const corte = [cartas('o4 o5 o6'), cartas('c7 e7 b7')];
  const { quedan, pegadas } = pegarSueltas(cartas('o3 o7 o2 c2 o7'.replace(' o7', '')).concat(cartas('b1')), corte, CFG);
  assert.deepEqual(pegadas.map((c) => c.id).sort(), ['oros-2', 'oros-3', 'oros-7'].sort());
  assert.deepEqual(quedan.map((c) => c.id).sort(), ['bastos-1', 'copas-2']);
});

test('chinchón: robar, tirar, no cortar con mucho suelto y cortar con poco', () => {
  const p = new PartidaChinchon(J, CFG, { empieza: 'iara' });
  assert.equal(p.mano.iara.length, 7);
  assert.throws(() => p.accion('iara', 'tirar', { carta: p.mano.iara[0].id }), /robá/);
  p.accion('iara', 'robar', { de: 'pozo' });
  assert.equal(p.mano.iara.length, 8);
  assert.throws(() => p.accion('iara', 'robar', {}), /Ya robaste/);
  p.accion('iara', 'tirar', { carta: p.mano.iara[0].id });
  assert.equal(p.turno, 'nahuel');

  // Mano armada para cortar: dos combinaciones y un 2 suelto (+ la que roba, que tira).
  p.mano.nahuel = cartas('o3 o4 o5 c7 e7 b7 b2');
  p.mazo.push(...cartas('e12'));
  p.mano.iara = cartas('c1 c2 c3 o10 o11 b9 e9');
  p.accion('nahuel', 'robar', {});
  const vista = p.vistaPara('nahuel');
  assert.equal(vista.cortes.find((c) => c.id === 'espadas-12').puntos, 2);
  assert.throws(() => p.accion('nahuel', 'cortar', { carta: 'bastos-2' }), /5 o menos/);
  p.accion('nahuel', 'cortar', { carta: 'espadas-12' });
  assert.equal(p.fase, 'resumen');
  assert.equal(p.puntos.nahuel, 2);
  // iara: escalera de copas ligada; suelta 10+11+9+9 = 39 (nada entra en lo de nahuel).
  assert.equal(p.puntos.iara, 39);
  assert.equal(p.estado, 'jugando');
});

test('chinchón: menos diez, límite y partida guardada', () => {
  const p = new PartidaChinchon(J, validarConfig({ limite: 50 }), { empieza: 'iara' });
  p.puntos.nahuel = 45;
  p.mano.iara = cartas('o3 o4 o5 c7 e7 b7 o6');
  p.mazo.push(...cartas('b12'));
  p.mano.nahuel = cartas('c10 c11 e1 e5 b3 b4 o12');
  p.accion('iara', 'robar', {});
  p.accion('iara', 'cortar', { carta: 'bastos-12' });
  assert.equal(p.puntos.iara, -10);
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');

  const q = new PartidaChinchon(J, CFG);
  const datos = deserializar(serializar({ partida: q })).partida;
  const r = Object.assign(new PartidaChinchon(datos.jugadores, datos.config), datos);
  assert.deepEqual(r.mano, q.mano);
  r.accion(r.turno, 'robar', {});
  assert.equal(r.paso, 'tirar');
});

test('chinchón: chinchón gana la partida', () => {
  const p = new PartidaChinchon(J, CFG, { empieza: 'iara' });
  p.mano.iara = cartas('c3 c4 c5 c6 c7 c8 b1');
  p.mazo.push(...cartas('c9'));
  p.accion('iara', 'robar', {});
  p.accion('iara', 'cortar', { carta: 'bastos-1' });
  assert.equal(p.estado, 'terminada');
  assert.equal(p.motivoFin, 'chinchon');
  assert.equal(p.ganador, 'iara');
});
