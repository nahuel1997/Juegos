import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PartidaUno, validarConfig, mazoNuevo, sePuede, puntosDe } from '../src/juegos/uno.js';
import { serializar, deserializar } from '../src/persistencia.js';

const J = ['iara', 'nahuel'];
let n = 1000;
const carta = (color, valor) => ({ id: `t${++n}`, color, valor });

// Partida con manos armadas a mano y un tope conocido.
function armada(manoIara, manoNahuel, tope = carta('rojo', '5'), config = {}) {
  const p = new PartidaUno(J, validarConfig(config), { empieza: 'iara' });
  p.mano = { iara: manoIara, nahuel: manoNahuel };
  p.pozo = [tope];
  p.color = tope.color;
  return p;
}

test('uno: mazo de 108 cartas y reparto de 7', () => {
  const m = mazoNuevo();
  assert.equal(m.length, 108);
  assert.equal(m.filter((c) => c.color === 'negro').length, 8);
  assert.equal(new Set(m.map((c) => c.id)).size, 108);
  const p = new PartidaUno(J, validarConfig({}));
  assert.equal(p.mano.iara.length, 7);
  assert.equal(p.mano.nahuel.length, 7);
  assert.ok(/^\d$/.test(p.tope.valor), 'el pozo arranca con un número');
  assert.equal(p.mazo.length, 108 - 15);
});

test('uno: qué se puede tirar', () => {
  const tope = carta('rojo', '5');
  assert.ok(sePuede(carta('rojo', '9'), tope, 'rojo'));
  assert.ok(sePuede(carta('azul', '5'), tope, 'rojo'));
  assert.ok(sePuede(carta('negro', 'mas4'), tope, 'rojo'));
  assert.ok(!sePuede(carta('azul', '7'), tope, 'rojo'));
  assert.equal(puntosDe(carta('negro', 'comodin')), 50);
  assert.equal(puntosDe(carta('verde', 'mas2')), 20);
  assert.equal(puntosDe(carta('verde', '8')), 8);
});

test('uno: turnos, carta que no va, salta y +2 (vuelve a jugar el mismo)', () => {
  const p = armada([carta('azul', '7'), carta('rojo', 'salta'), carta('rojo', 'mas2'), carta('rojo', '1'), carta('verde', '3')], [carta('amarillo', '2'), carta('verde', '4')]);
  assert.throws(() => p.accion('nahuel', 'jugar', { carta: p.mano.nahuel[0].id }), /turno/);
  assert.throws(() => p.accion('iara', 'jugar', { carta: p.mano.iara[0].id }), /no va/);
  p.accion('iara', 'jugar', { carta: p.mano.iara[1].id }); // salta
  assert.equal(p.turno, 'iara');
  p.accion('iara', 'jugar', { carta: p.mano.iara[1].id }); // +2
  assert.equal(p.turno, 'iara');
  assert.equal(p.mano.nahuel.length, 4);
  p.accion('iara', 'jugar', { carta: p.mano.iara[1].id }); // rojo 1
  assert.equal(p.turno, 'nahuel');
});

test('uno: comodín +4 pide color y el rival roba 4', () => {
  const p = armada([carta('negro', 'mas4'), carta('azul', '1'), carta('azul', '2')], [carta('amarillo', '2')]);
  assert.throws(() => p.accion('iara', 'jugar', { carta: p.mano.iara[0].id }), /color/);
  p.accion('iara', 'jugar', { carta: p.mano.iara[0].id, color: 'azul' });
  assert.equal(p.color, 'azul');
  assert.equal(p.mano.nahuel.length, 5);
  assert.equal(p.turno, 'iara');
  p.accion('iara', 'jugar', { carta: p.mano.iara[0].id });
  assert.equal(p.turno, 'nahuel');
});

test('uno: robar: si la robada va, se puede tirar o pasar; si no, pasa el turno', () => {
  const p = armada([carta('azul', '7')], [carta('amarillo', '2')]);
  p.mazo.push(carta('rojo', '9'));
  p.accion('iara', 'robar');
  assert.equal(p.turno, 'iara');
  assert.ok(p.robada);
  assert.throws(() => p.accion('iara', 'robar'), /Ya robaste/);
  assert.throws(() => p.accion('iara', 'jugar', { carta: p.mano.iara[0].id }), /robaste/);
  p.accion('iara', 'pasar');
  assert.equal(p.turno, 'nahuel');
  p.mazo.push(carta('azul', '1'));
  p.accion('nahuel', 'robar');
  assert.equal(p.turno, 'iara', 'la robada no iba: pasa solo');
});

test('uno: sin decir UNO te acusan y robás 2; diciéndolo, no', () => {
  const p = armada([carta('rojo', '1'), carta('rojo', '2'), carta('verde', '9')], [carta('rojo', '3'), carta('azul', '9')]);
  p.accion('iara', 'jugar', { carta: p.mano.iara[0].id });
  assert.equal(p.mano.iara.length, 2);
  p.accion('nahuel', 'uno');
  p.accion('nahuel', 'jugar', { carta: p.mano.nahuel[0].id });
  assert.equal(p.sinUno, null, 'nahuel avisó');
  p.accion('iara', 'jugar', { carta: p.mano.iara[0].id });
  assert.equal(p.sinUno, 'iara');
  assert.throws(() => p.accion('iara', 'acusar'), /acusar/);
  p.accion('nahuel', 'acusar');
  assert.equal(p.mano.iara.length, 3);
  assert.equal(p.sinUno, null);
});

test('uno: el que se queda sin cartas suma lo del otro; la partida se guarda y restaura', () => {
  const p = armada([carta('rojo', '1')], [carta('negro', 'comodin'), carta('azul', 'mas2'), carta('azul', '7')], carta('rojo', '5'), { meta: 50 });
  p.accion('iara', 'jugar', { carta: p.mano.iara[0].id });
  assert.equal(p.fase, 'resumen');
  assert.equal(p.puntos.iara, 77);
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');

  const q = new PartidaUno(J, validarConfig({ meta: 300 }));
  const datos = deserializar(serializar({ partida: q })).partida;
  const r = Object.assign(new PartidaUno(datos.jugadores, datos.config), datos);
  assert.deepEqual(r.tope, q.tope);
  assert.deepEqual(r.vistaPara('iara').miMano, q.vistaPara('iara').miMano);
  r.accion(r.turno, 'robar');
  assert.ok(r.mano[q.empiezaRonda].length === 8);
});

test('uno: la ronda siguiente arranca el otro', () => {
  const p = armada([carta('rojo', '1')], [carta('azul', '7')]);
  p.accion('iara', 'jugar', { carta: p.mano.iara[0].id });
  p.accion('iara', 'siguiente');
  p.accion('nahuel', 'siguiente');
  assert.equal(p.ronda, 2);
  assert.equal(p.turno, 'nahuel');
  assert.equal(p.mano.iara.length, 7);
});
