// Las palabras del Stop no se repiten entre partidas hasta usarlas todas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'juegos-stop-'));
process.env.DATA_DIR = dir;
const { PartidaStopPalabras, validarConfig, palabrasJugadas, PALABRAS } = await import('../src/juegos/stopPalabras.js');

const J = ['iara', 'nahuel'];

// Juega una partida de una ronda: los dos la adivinan de una.
function jugarUna() {
  const p = new PartidaStopPalabras(J, validarConfig({ largo: 4, intentos: 4, rondas: 1 }));
  const palabra = p.actual.palabra;
  // Mientras se juega, la palabra no aparece en la lista de jugadas.
  assert.equal(palabrasJugadas()[4].jugadas.includes(palabra), false);
  p.accion('iara', 'intentar', { palabra });
  p.accion('nahuel', 'intentar', { palabra });
  assert.equal(p.estado, 'terminada');
  return palabra;
}

test('no se repite ninguna palabra hasta usarlas todas, y después vuelve a empezar', () => {
  const total = new Set(PALABRAS[4]).size;
  const vistas = [];
  for (let i = 0; i < total; i++) vistas.push(jugarUna());
  assert.equal(new Set(vistas).size, total);
  assert.equal(palabrasJugadas()[4].jugadas.length, total);
  // Se guardó en disco.
  const guardado = JSON.parse(readFileSync(join(dir, 'stop-jugadas.json'), 'utf8'));
  assert.equal(guardado[4].jugadas.length, total);
  // La siguiente arranca una vuelta nueva.
  jugarUna();
  assert.equal(palabrasJugadas()[4].vueltas, 1);
  assert.equal(palabrasJugadas()[4].jugadas.length, 1);
});
