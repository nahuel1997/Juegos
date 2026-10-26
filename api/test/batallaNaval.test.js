import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PartidaBatallaNaval, validarFlota, flotaAlAzar, FLOTA, ErrorJuego } from '../src/juegos/batallaNaval.js';

// Flota fija: cada barco en su fila par, pegado a la izquierda (no se tocan).
const flotaFija = () => FLOTA.map((t, i) => ({ id: t.id, fila: i * 2, col: 0, horizontal: true }));

function partidaEnJuego() {
  const p = new PartidaBatallaNaval('iara', 'nahuel', { empieza: 'iara' });
  p.colocar('iara', flotaFija());
  p.colocar('nahuel', flotaFija());
  return p;
}

test('valida una flota correcta', () => {
  assert.equal(validarFlota(flotaFija()).length, 5);
});

test('rechaza barcos que se tocan o se salen', () => {
  const pegados = flotaFija();
  pegados[1].fila = 1; // acorazado justo abajo del portaaviones
  assert.throws(() => validarFlota(pegados), ErrorJuego);
  const afuera = flotaFija();
  afuera[0].col = 7; // portaaviones de 5 desde la columna 7
  assert.throws(() => validarFlota(afuera), /se sale/);
  assert.throws(() => validarFlota(flotaFija().slice(0, 4)), ErrorJuego);
});

test('la flota al azar siempre es válida', () => {
  for (let i = 0; i < 200; i++) assert.doesNotThrow(() => validarFlota(flotaAlAzar()));
});

test('pasa a jugando cuando los dos ubican la flota', () => {
  const p = new PartidaBatallaNaval('iara', 'nahuel');
  p.colocar('iara', flotaFija());
  assert.equal(p.estado, 'colocando');
  p.colocar('nahuel', flotaFija());
  assert.equal(p.estado, 'jugando');
});

test('agua pasa el turno, tocado lo mantiene', () => {
  const p = partidaEnJuego();
  assert.equal(p.disparar('iara', 0, 0).resultado, 'tocado');
  assert.equal(p.turno, 'iara');
  assert.equal(p.disparar('iara', 9, 9).resultado, 'agua');
  assert.equal(p.turno, 'nahuel');
  assert.throws(() => p.disparar('iara', 5, 5), /No es tu turno/);
});

test('no se puede repetir un disparo', () => {
  const p = partidaEnJuego();
  p.disparar('iara', 0, 0);
  assert.throws(() => p.disparar('iara', 0, 0), /Ya disparaste/);
});

test('hundir toda la flota gana la partida', () => {
  const p = partidaEnJuego();
  let ultimo;
  for (const b of validarFlota(flotaFija())) for (const [f, c] of b.celdas) ultimo = p.disparar('iara', f, c);
  assert.equal(ultimo.resultado, 'hundido');
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');
});

test('la vista no filtra la flota del rival', () => {
  const p = partidaEnJuego();
  p.disparar('iara', 8, 0); // destructor en fila 8: tocado
  let v = p.vistaPara('iara');
  assert.equal(v.flotaRival.length, 0);
  p.disparar('iara', 8, 1); // hundido
  v = p.vistaPara('iara');
  assert.deepEqual(v.flotaRival.map((b) => b.id), ['destructor']);
  assert.equal(v.restantes.rival, 4);
});

test('abandonar le da la partida al rival', () => {
  const p = partidaEnJuego();
  p.abandonar('nahuel');
  assert.equal(p.ganador, 'iara');
  assert.equal(p.motivoFin, 'abandono');
});
