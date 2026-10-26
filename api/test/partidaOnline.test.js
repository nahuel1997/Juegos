// Partida completa entre dos clientes Socket.IO reales contra el servidor.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import bcrypt from 'bcryptjs';
import { io as conectar } from 'socket.io-client';

// Usuarios de prueba propios (no los reales del sitio).
const CLAVE = 'clave-de-test';
const dir = mkdtempSync(join(tmpdir(), 'juegos-'));
process.env.DATA_DIR = dir;
process.env.USUARIOS_ARCHIVO = join(dir, 'usuarios.json');
const hash = bcrypt.hashSync(CLAVE, 4);
writeFileSync(process.env.USUARIOS_ARCHIVO, JSON.stringify([
  { usuario: 'iara', nombre: 'Iara', color: '#e84393', hash },
  { usuario: 'nahuel', nombre: 'Nahuel', color: '#0984e3', hash },
]));
const { crearServidor } = await import('../src/servidor.js');
const { FLOTA, validarFlota } = await import('../src/juegos/batallaNaval.js');

const flota = FLOTA.map((t, i) => ({ id: t.id, fila: i * 2, col: 0, horizontal: true }));
let servidor, base;
const clientes = [];

before(async () => {
  servidor = crearServidor();
  await new Promise((r) => servidor.listen(0, r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(() => {
  clientes.forEach((c) => c.close());
  servidor.close();
});

async function entrar(usuario, clave) {
  const r = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ usuario, clave }),
  });
  if (r.status !== 200) return { status: r.status };
  const cookie = r.headers.get('set-cookie').split(';')[0];
  const socket = conectar(base, { extraHeaders: { cookie }, transports: ['websocket'] });
  clientes.push(socket);
  const estado = { partida: undefined, lobby: null };
  socket.on('partida', (p) => (estado.partida = p));
  socket.on('lobby', (l) => (estado.lobby = l));
  await new Promise((r) => socket.on('connect', r));
  const emitir = (ev, d) => new Promise((r) => socket.emit(ev, d, r));
  return { status: 200, socket, estado, emitir };
}

const esperar = async (cond) => {
  for (let i = 0; i < 100 && !cond(); i++) await new Promise((r) => setTimeout(r, 20));
  assert.ok(cond(), 'timeout esperando estado');
};

test('clave incorrecta da 401', async () => {
  assert.equal((await entrar('iara', 'nop')).status, 401);
});

test('invitar, ubicar flotas y jugar hasta que alguien gana', async () => {
  const iara = await entrar('iara', CLAVE);
  const nahuel = await entrar('nahuel', CLAVE);
  await esperar(() => iara.estado.lobby?.usuarios.find((u) => u.usuario === 'nahuel')?.online);

  assert.deepEqual(await iara.emitir('invitar', { a: 'nahuel' }), { ok: true });
  await esperar(() => nahuel.estado.lobby?.invitaciones.recibidas.length === 1);
  await nahuel.emitir('responder', { de: 'iara', acepta: true });
  await esperar(() => iara.estado.partida?.estado === 'colocando' && nahuel.estado.partida?.estado === 'colocando');

  // Un disparo antes de tiempo se rechaza sin romper nada.
  assert.match((await iara.emitir('disparar', { fila: 0, col: 0 })).error, /no está en juego/);
  await iara.emitir('colocar', { barcos: flota });
  await nahuel.emitir('colocar', { barcos: flota });
  await esperar(() => iara.estado.partida?.estado === 'jugando');

  // La vista nunca trae la flota del rival mientras se juega.
  assert.equal(iara.estado.partida.flotaRival.length, 0);

  const objetivos = validarFlota(flota).flatMap((b) => b.celdas);
  const turnoDe = () => (iara.estado.partida.turno === 'iara' ? iara : nahuel);
  const pendientes = { iara: [...objetivos], nahuel: [...objetivos] };
  while (iara.estado.partida.estado === 'jugando') {
    const j = turnoDe();
    const yo = j === iara ? 'iara' : 'nahuel';
    const [fila, col] = pendientes[yo].shift();
    const antes = JSON.stringify(j.estado.partida.misDisparos);
    assert.deepEqual(await j.emitir('disparar', { fila, col }), { ok: true });
    await esperar(() => JSON.stringify(j.estado.partida.misDisparos) !== antes);
  }
  await esperar(() => nahuel.estado.partida?.estado === 'terminada');
  assert.ok(['iara', 'nahuel'].includes(iara.estado.partida.ganador));
  assert.equal(iara.estado.partida.flotaRival.length, 5); // al terminar se ve todo
  await esperar(() => iara.estado.lobby?.stats.jugadas === 1);

  // Revancha: cuando la piden los dos arranca otra partida.
  await iara.emitir('revancha');
  await nahuel.emitir('revancha');
  await esperar(() => iara.estado.partida?.estado === 'colocando');
});
