import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PartidaAhorcado, validarConfig as cfgAhorcado, validarPalabra } from '../src/juegos/ahorcado.js';
import { PartidaTutiFruti, validarConfig as cfgTuti } from '../src/juegos/tutiFruti.js';
import { PartidaGenerala, puntosPosibles, CONFIG_DEFECTO as CFG_GENERALA } from '../src/juegos/generala.js';
import { PartidaEscoba, puntosDeMano, valorDe } from '../src/juegos/escoba.js';
import { normalizar } from '../src/juegos/comun.js';

const J = ['iara', 'nahuel'];

// ---------- Ahorcado ----------
test('ahorcado: normaliza acentos pero respeta la Ñ', () => {
  assert.equal(normalizar('  canción  de cuña '), 'CANCION DE CUÑA');
  assert.throws(() => validarPalabra('a1'), /Solo letras/);
});

test('ahorcado: quien elige no ve vacíos, quien adivina sí; adivinar suma punto', () => {
  const p = new PartidaAhorcado(J, cfgAhorcado({ rondas: 2 }), { empieza: 'iara' });
  assert.throws(() => p.accion('iara', 'palabra', { palabra: 'MATE' }), /la elige tu rival/);
  p.accion('nahuel', 'palabra', { palabra: 'Maté', pista: 'infusión' });
  assert.equal(p.vistaPara('iara').ronda.palabra, null);
  assert.equal(p.vistaPara('nahuel').ronda.palabra, 'MATE');
  for (const l of ['M', 'A', 'Z', 'T', 'E']) p.accion('iara', 'letra', { letra: l });
  const v = p.vistaPara('iara');
  assert.equal(v.ronda.resultado, 'adivino');
  assert.equal(v.ronda.errores, 1);
  assert.equal(v.puntos.yo, 1);
  // Ronda 2: se invierten los roles; Nahuel se ahorca y el punto es para Iara.
  p.accion('nahuel', 'siguiente');
  p.accion('iara', 'palabra', { palabra: 'SOL' });
  for (const l of 'ABCDEF') p.accion('nahuel', 'letra', { letra: l });
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');
});

test('ahorcado: arriesgar mal suma un error, en modo azar no hay que elegir', () => {
  const p = new PartidaAhorcado(J, cfgAhorcado({ modo: 'azar', rondas: 1 }), { empieza: 'nahuel' });
  assert.equal(p.vistaPara('nahuel').ronda.fase, 'adivinando');
  p.accion('nahuel', 'arriesgar', { palabra: 'NOPE' });
  assert.equal(p.vistaPara('nahuel').ronda.errores, 1);
  p.accion('nahuel', 'arriesgar', { palabra: p.actual.palabra });
  assert.equal(p.ganador, 'nahuel');
});

// ---------- Tuti fruti ----------
test('tuti fruti: columnas propias, letras sin repetir y excluidas', () => {
  assert.throws(() => cfgTuti({ cuentaAtras: 0,  columnas: ['A', 'a'] }), /repetidas/);
  const cfg = cfgTuti({ cuentaAtras: 0,  columnas: ['Comida', 'Marca'], rondas: 3, excluidas: [] });
  const p = new PartidaTutiFruti(J, cfg);
  assert.equal(p.vistaPara('iara').rondas[0].mias.length, 2);
  const cfg2 = cfgTuti({ cuentaAtras: 0,  rondas: 20, excluidas: ['K', 'Ñ', 'Q', 'W', 'X', 'Y', 'Z'] });
  const p2 = new PartidaTutiFruti(J, cfg2);
  const letras = new Set();
  for (let i = 0; i < 20; i++) {
    letras.add(p2.actual.letra);
    assert.ok(!cfg2.excluidas.includes(p2.actual.letra));
    p2.accion('iara', 'basta', { valores: Array(6).fill('x') });
    p2.accion('nahuel', 'basta', { valores: Array(6).fill('y') });
    p2.accion('iara', 'confirmar');
    p2.accion('nahuel', 'confirmar');
  }
  assert.equal(letras.size, 20);
  assert.equal(p2.estado, 'terminada');
});

test('tuti fruti: basta exige completar, oculta respuestas y los puntos son manuales', () => {
  const p = new PartidaTutiFruti(J, cfgTuti({ cuentaAtras: 0,  columnas: ['Animal', 'Color'], rondas: 1, segundosBasta: 0 }));
  p.accion('nahuel', 'respuestas', { valores: ['Mono', ''] });
  assert.equal(p.vistaPara('iara').rondas[0].respuestas.nahuel, undefined); // las del otro no se ven
  assert.throws(() => p.accion('nahuel', 'basta', { valores: ['Mono', ''] }), /Completá/);
  p.accion('iara', 'basta', { valores: ['Mulita', 'Marrón'] });
  const v = p.vistaPara('nahuel');
  assert.equal(v.fase, 'puntuando');
  assert.deepEqual(v.rondas[0].respuestas.iara, ['Mulita', 'Marrón']);
  p.accion('nahuel', 'puntos', { jugador: 'iara', col: 0, valor: 10 });
  p.accion('iara', 'puntos', { jugador: 'iara', col: 1, valor: 10 });
  p.accion('iara', 'puntos', { jugador: 'nahuel', col: 0, valor: 5 });
  p.accion('iara', 'confirmar');
  p.accion('nahuel', 'puntos', { jugador: 'nahuel', col: 0, valor: 10 }); // cambiar desconfirma
  assert.equal(p.vistaPara('iara').confirmados.length, 0);
  p.accion('iara', 'confirmar');
  p.accion('nahuel', 'confirmar');
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'iara');
  assert.deepEqual(p.vistaPara('iara').totales, { iara: 20, nahuel: 10 });
});

test('tuti fruti: con tres jugadores, todos confirman y el que abandona queda afuera', () => {
  const T = ['iara', 'nahuel', 'inv-1234'];
  const p = new PartidaTutiFruti(T, cfgTuti({ cuentaAtras: 0, columnas: ['Animal'], rondas: 1, segundosBasta: 30 }));
  p.accion('iara', 'basta', { valores: ['Oso'] });
  assert.equal(p.actual.fase, 'basta');
  p.accion('nahuel', 'basta', { valores: ['Orca'] });
  assert.equal(p.actual.fase, 'basta', 'falta el tercero');
  p.accion('inv-1234', 'basta', { valores: ['Oveja'] });
  assert.equal(p.actual.fase, 'puntuando', 'terminaron todos: se cierra sin esperar');
  clearTimeout(p.timer);
  assert.deepEqual(p.vistaPara('nahuel').rondas[0].respuestas['inv-1234'], ['Oveja']);
  p.accion('iara', 'puntos', { jugador: 'inv-1234', col: 0, valor: 10 });
  p.accion('iara', 'confirmar');
  p.accion('nahuel', 'confirmar');
  assert.equal(p.estado, 'jugando');
  p.abandonar('nahuel'); // ya no hace falta que confirme él
  p.accion('inv-1234', 'confirmar');
  assert.equal(p.estado, 'terminada');
  assert.equal(p.ganador, 'inv-1234');
});

test('tuti fruti: hay que esperar la cuenta antes de escribir', () => {
  const p = new PartidaTutiFruti(J, cfgTuti({ cuentaAtras: 5, columnas: ['Animal'] }));
  assert.ok(p.vistaPara('iara').arrancaEnMs > 4000);
  assert.throws(() => p.accion('iara', 'basta', { valores: ['Oso'] }), /Esperá/);
  p.actual.desde = Date.now() - 1;
  p.accion('iara', 'basta', { valores: ['Oso'] });
  assert.equal(p.vistaPara('iara').fase, 'basta');
});

test('tuti fruti: el basta con cuenta regresiva cierra solo', async () => {
  const p = new PartidaTutiFruti(J, cfgTuti({ cuentaAtras: 0,  columnas: ['Animal'], rondas: 1, segundosBasta: 1 }));
  let avisado = false;
  p.notificar = () => (avisado = true);
  p.accion('iara', 'basta', { valores: ['Oso'] });
  assert.equal(p.vistaPara('nahuel').fase, 'basta');
  assert.ok(p.vistaPara('nahuel').restanteMs > 0);
  await new Promise((r) => setTimeout(r, 1100));
  assert.equal(p.vistaPara('nahuel').fase, 'puntuando');
  assert.ok(avisado);
});

// ---------- Generala ----------
test('generala: puntajes de las categorías', () => {
  const pp = (d, servido = false, planilla = {}) => puntosPosibles(d, servido, CFG_GENERALA, planilla);
  assert.equal(pp([3, 3, 3, 2, 5])['3'], 9);
  assert.equal(pp([1, 2, 3, 4, 5]).escalera, 20);
  assert.equal(pp([3, 4, 5, 6, 1], true).escalera, 25);
  assert.equal(pp([2, 2, 5, 5, 5]).full, 30);
  assert.equal(pp([4, 4, 4, 4, 1]).poker, 40);
  assert.equal(pp([6, 6, 6, 6, 6]).generala, 50);
  assert.equal(pp([6, 6, 6, 6, 6]).doble, 0);
  assert.equal(pp([6, 6, 6, 6, 6], false, { generala: 50 }).doble, 100);
});

test('generala: tirar, guardar, anotar y alternar turnos hasta llenar la planilla', () => {
  let semilla = 0;
  const rand = () => ((semilla = (semilla * 9301 + 49297) % 233280) / 233280);
  const p = new PartidaGenerala(J, { ...CFG_GENERALA, servidaGana: false }, { empieza: 'iara', rand });
  assert.throws(() => p.accion('iara', 'anotar', { categoria: '1' }), /Primero tirá/);
  assert.throws(() => p.accion('nahuel', 'tirar'), /No es tu turno/);
  p.accion('iara', 'tirar');
  const antes = [...p.dados];
  p.accion('iara', 'tirar', { guardar: [true, true, false, false, false] });
  assert.deepEqual(p.dados.slice(0, 2), antes.slice(0, 2));
  p.accion('iara', 'tirar', { guardar: [true, true, true, false, false] });
  assert.throws(() => p.accion('iara', 'tirar'), /3 veces/);
  p.accion('iara', 'anotar', { categoria: 'generala' });
  assert.equal(p.turno, 'nahuel');
  const cats = p.vistaPara('iara').categorias.map((c) => c.id);
  while (p.estado === 'jugando') {
    const j = p.turno;
    p.accion(j, 'tirar');
    p.accion(j, 'anotar', { categoria: cats.find((c) => p.planillas[j][c] === undefined) });
  }
  assert.equal(Object.keys(p.planillas.iara).length, 11);
  assert.equal(p.motivoFin, 'puntos');
});

test('generala: la servida gana en el acto', () => {
  const p = new PartidaGenerala(J, CFG_GENERALA, { empieza: 'nahuel', rand: () => 0.99 });
  p.accion('nahuel', 'tirar');
  assert.deepEqual(p.dados, [6, 6, 6, 6, 6]);
  p.accion('nahuel', 'anotar', { categoria: 'generala' });
  assert.equal(p.ganador, 'nahuel');
  assert.equal(p.motivoFin, 'servida');
});

// ---------- Escoba del 15 ----------
test('escoba: valores y puntos de una mano', () => {
  assert.deepEqual([1, 7, 10, 11, 12].map(valorDe), [1, 7, 8, 9, 10]);
  const c = (palo, numero) => ({ id: `${palo}-${numero}`, palo, numero });
  const capt = { iara: [c('oros', 7), c('oros', 1), c('copas', 7)], nahuel: [c('bastos', 2)] };
  const d = puntosDeMano(capt, { iara: 1, nahuel: 2 }, J);
  assert.deepEqual(d.iara.sort(), ['Escoba', 'Más cartas', 'Más oros', 'Más sietes', 'Siete de oros'].sort());
  assert.deepEqual(d.nahuel, ['Escoba', 'Escoba']);
});

test('escoba: solo se levanta si suma 15 y se juega la mano entera', () => {
  const p = new PartidaEscoba(J, { puntosParaGanar: 50 }, { empieza: 'iara' });
  const jugar = (j) => {
    // Busca una combinación que sume 15; si no hay, tira la primera carta.
    for (const carta of p.mano[j]) {
      const mesa = p.mesa;
      for (let m = 1; m < 1 << mesa.length; m++) {
        const sel = mesa.filter((_, i) => m & (1 << i));
        if (carta.valor + sel.reduce((s, x) => s + x.valor, 0) === 15) return p.accion(j, 'jugar', { carta: carta.id, levantar: sel.map((x) => x.id) });
      }
    }
    if (p.mesa.length) {
      const otra = p.mano[j][0];
      const mal = p.mesa.find((x) => x.valor + otra.valor !== 15);
      if (mal) assert.throws(() => p.accion(j, 'jugar', { carta: otra.id, levantar: [mal.id] }), /sumar 15/);
    }
    p.accion(j, 'jugar', { carta: p.mano[j][0].id });
  };
  assert.throws(() => p.accion('nahuel', 'jugar', { carta: p.mano.nahuel[0].id }), /No es tu turno/);
  // El siete de oros suma en el marcador apenas se levanta (antes de cerrar la mano).
  p.capturas.iara.push({ id: 'oros-7', palo: 'oros', numero: 7, valor: 7 });
  const v0 = p.vistaPara('iara');
  assert.equal(v0.enEstaMano.yo, p.escobas.iara + 1);
  assert.deepEqual(v0.misLevantadas, { cartas: p.capturas.iara.length, oros: p.capturas.iara.filter((c) => c.palo === 'oros').length, sietes: p.capturas.iara.filter((c) => c.numero === 7).length, sieteDeOros: true });
  p.capturas.iara.pop();
  while (p.fase === 'jugando') jugar(p.turno);
  // Al cerrar la mano todas las cartas terminan levantadas.
  const total = p.capturas.iara.length + p.capturas.nahuel.length;
  assert.equal(total, 40);
  assert.equal(p.vistaPara('iara').fase, 'resumen');
  p.accion('iara', 'siguiente');
  p.accion('nahuel', 'siguiente');
  assert.equal(p.manos, 2);
  assert.equal(p.mano.iara.length + p.mano.nahuel.length, 6);
});
