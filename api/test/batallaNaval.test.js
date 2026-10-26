import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PartidaBatallaNaval, validarFlota, validarConfig, flotaAlAzar, flotaDe, CONFIG_DEFECTO, ErrorJuego } from '../src/juegos/batallaNaval.js';

const FLOTA = flotaDe(CONFIG_DEFECTO);
// Flota fija: cada barco en su fila par, pegado a la izquierda (no se tocan).
const flotaFija = (flota = FLOTA) => flota.map((t, i) => ({ id: t.id, fila: i * 2, col: 0, horizontal: true }));

function partidaEnJuego(config = CONFIG_DEFECTO) {
  const p = new PartidaBatallaNaval(['iara', 'nahuel'], config, { empieza: 'iara' });
  p.accion('iara', 'colocar', { barcos: flotaFija(p.flota) });
  p.accion('nahuel', 'colocar', { barcos: flotaFija(p.flota) });
  return p;
}

test('valida una flota correcta', () => {
  assert.equal(validarFlota(flotaFija(), FLOTA, 10, 10).length, 5);
});

test('rechaza barcos que se tocan o se salen', () => {
  const pegados = flotaFija();
  pegados[1].fila = 1;
  assert.throws(() => validarFlota(pegados, FLOTA, 10, 10), ErrorJuego);
  const afuera = flotaFija();
  afuera[0].col = 7;
  assert.throws(() => validarFlota(afuera, FLOTA, 10, 10), /se sale/);
  assert.throws(() => validarFlota(flotaFija().slice(0, 4), FLOTA, 10, 10), ErrorJuego);
});

test('la flota al azar siempre es válida, también en tableros chicos o con muchos barcos', () => {
  for (let i = 0; i < 100; i++) assert.doesNotThrow(() => validarFlota(flotaAlAzar(FLOTA, 10, 10), FLOTA, 10, 10));
  const cfg = validarConfig({ filas: 12, columnas: 8, barcos: { portaaviones: 2, crucero: 2, destructor: 3 } });
  const flota = flotaDe(cfg);
  assert.equal(flota.length, 7);
  for (let i = 0; i < 50; i++) assert.doesNotThrow(() => validarFlota(flotaAlAzar(flota, 12, 8), flota, 12, 8));
});

test('la config rechaza tableros donde no entran los barcos', () => {
  assert.throws(() => validarConfig({ filas: 6, columnas: 6, barcos: { portaaviones: 4, acorazado: 4 } }), /No entran/);
  assert.throws(() => validarConfig({ filas: 20 }), /filas/);
  assert.throws(() => validarConfig({ barcos: {} }), /al menos un barco/);
});

test('agua y hundido pasan el turno, tocado lo mantiene', () => {
  const p = partidaEnJuego();
  assert.equal(p.disparar('iara', 0, 0).resultado, 'tocado');
  assert.equal(p.turno, 'iara');
  assert.equal(p.disparar('iara', 9, 9).resultado, 'agua');
  assert.equal(p.turno, 'nahuel');
  // Nahuel hunde el destructor (fila 8, largo 2): el primer tiro sigue, el que hunde pasa el turno.
  assert.equal(p.disparar('nahuel', 8, 0).resultado, 'tocado');
  assert.equal(p.turno, 'nahuel');
  assert.equal(p.disparar('nahuel', 8, 1).resultado, 'hundido');
  assert.equal(p.turno, 'iara');
  assert.throws(() => p.disparar('nahuel', 5, 5), /No es tu turno/);
});

test('con seguirAlTocar apagado, cualquier tiro pasa el turno', () => {
  const p = partidaEnJuego({ ...CONFIG_DEFECTO, seguirAlTocar: false });
  p.disparar('iara', 0, 0);
  assert.equal(p.turno, 'nahuel');
});

test('no se puede repetir un disparo', () => {
  const p = partidaEnJuego();
  p.disparar('iara', 0, 0);
  assert.throws(() => p.disparar('iara', 0, 0), /Ya disparaste/);
});

test('hundir toda la flota gana la partida', () => {
  const p = partidaEnJuego();
  const objetivos = validarFlota(flotaFija(), FLOTA, 10, 10).flatMap((b) => b.celdas);
  const pendientes = { iara: [...objetivos], nahuel: [...objetivos] };
  while (p.estado === 'jugando') {
    const j = p.turno;
    const [f, c] = pendientes[j].shift();
    p.disparar(j, f, c);
  }
  assert.equal(p.estado, 'terminada');
  assert.ok(['iara', 'nahuel'].includes(p.ganador));
});

test('la vista no filtra la flota del rival', () => {
  const p = partidaEnJuego();
  p.disparar('iara', 8, 0);
  let v = p.vistaPara('iara');
  assert.equal(v.flotaRival.length, 0);
  p.disparar('iara', 8, 1);
  v = p.vistaPara('iara');
  assert.deepEqual(v.flotaRival.map((b) => b.id), ['destructor-1']);
  assert.equal(v.restantes.rival, 4);
});

test('abandonar le da la partida al rival', () => {
  const p = partidaEnJuego();
  p.abandonar('nahuel');
  assert.equal(p.ganador, 'iara');
  assert.equal(p.motivoFin, 'abandono');
});
