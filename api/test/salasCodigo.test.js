// Salas con código: usuarios e invitados sin cuenta, más de 2 jugadores, reglas del anfitrión y skins.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import bcrypt from 'bcryptjs';
import { io as conectar } from 'socket.io-client';

const CLAVE = 'clave-de-test';
const dir = mkdtempSync(join(tmpdir(), 'juegos-codigo-'));
process.env.DATA_DIR = dir;
process.env.USUARIOS_ARCHIVO = join(dir, 'usuarios.json');
const hash = bcrypt.hashSync(CLAVE, 4);
writeFileSync(process.env.USUARIOS_ARCHIVO, JSON.stringify([
  { usuario: 'iara', nombre: 'Iara', color: '#e84393', tema: 'rosa', hash },
  { usuario: 'nahuel', nombre: 'Nahuel', color: '#0984e3', tema: 'negro', hash },
]));

const { crearServidor } = await import('../src/servidor.js');

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

function conectarCon(cookie) {
  const socket = conectar(base, { extraHeaders: { cookie }, transports: ['websocket'] });
  clientes.push(socket);
  const estado = { sala: undefined, lobby: null, avisos: [], error: null };
  socket.on('sala', (s) => (estado.sala = s));
  socket.on('lobby', (l) => (estado.lobby = l));
  socket.on('aviso', (a) => estado.avisos.push(a.texto));
  socket.on('connect_error', (e) => (estado.error = e.message));
  const emitir = (ev, d) => new Promise((r) => socket.emit(ev, d, r));
  const api = (ruta, metodo = 'GET', datos) =>
    fetch(`${base}/api${ruta}`, { method: metodo, headers: { cookie, 'content-type': 'application/json' }, body: datos && JSON.stringify(datos) });
  return { socket, estado, emitir, api, cookie };
}

async function entrar(usuario) {
  const r = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ usuario, clave: CLAVE }) });
  const c = conectarCon(r.headers.get('set-cookie').split(';')[0]);
  await new Promise((ok) => c.socket.on('connect', ok));
  return c;
}

const invitado = (codigo, nombre) => fetch(`${base}/api/invitado`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ codigo, nombre }) });

const esperar = async (cond) => {
  for (let i = 0; i < 150 && !cond(); i++) await new Promise((r) => setTimeout(r, 20));
  assert.ok(cond(), 'timeout esperando estado');
};

let iara, nahuel, inv, codigo;

test('el anfitrión arma la sala con código y entra un invitado sin cuenta', async () => {
  iara = await entrar('iara');
  nahuel = await entrar('nahuel');
  const r = await iara.emitir('crearConCodigo', { juego: 'tuti-fruti' });
  assert.match(r.codigo, /^[A-Z2-9]{5}$/);
  codigo = r.codigo;
  await esperar(() => iara.estado.sala?.codigo === codigo);
  assert.equal(iara.estado.sala.max, 8);
  assert.equal(iara.estado.sala.anfitrion, 'iara');

  // Código mal: error (sin bloquear a nadie).
  assert.equal((await invitado('ZZZZZ', 'Pepe')).status, 400);
  assert.equal((await invitado(codigo, '   ')).status, 400);

  const resp = await invitado(codigo.toLowerCase(), 'Iara'); // mismo nombre que la anfitriona: se numera
  assert.equal(resp.status, 200);
  const datos = await resp.json();
  assert.equal(datos.usuario.invitado, true);
  assert.equal(datos.usuario.nombre, 'Iara 2');
  inv = conectarCon(resp.headers.get('set-cookie').split(';')[0]);
  await esperar(() => inv.estado.sala?.jugadores?.length === 2);
  assert.equal((await (await inv.api('/yo')).json()).usuario.invitado, true);
  await esperar(() => iara.estado.avisos.some((a) => a.includes('Iara 2')));
});

test('un usuario se suma con el código; solo el anfitrión cambia las reglas', async () => {
  assert.deepEqual(await nahuel.emitir('unirmeConCodigo', { codigo }), { ok: true });
  await esperar(() => iara.estado.sala?.jugadores?.length === 3);
  assert.match((await nahuel.emitir('configurar', { config: { rondas: 2 } })).error, /elige el que armó/);
  assert.deepEqual(await iara.emitir('configurar', { config: { ...iara.estado.sala.config, rondas: 1, cuentaAtras: 0, segundosBasta: 30 } }), { ok: true });
  // Los invitados no invitan ni crean salas.
  assert.match((await inv.emitir('crearConCodigo', { juego: 'uno' })).error, /invitados/);
});

test('arranca cuando están listos todos y la partida es de 3', async () => {
  await iara.emitir('listo', {});
  await nahuel.emitir('listo', {});
  await esperar(() => iara.estado.sala?.listos?.length === 2);
  assert.equal(iara.estado.sala.estado, 'config');
  await inv.emitir('listo', {});
  await esperar(() => inv.estado.sala?.estado === 'jugando');
  assert.equal(inv.estado.sala.partida.jugadores.length, 3);
  const yoInv = inv.estado.sala.yo;
  assert.ok(yoInv.startsWith('inv-'));
  // Juegan los tres y cantan basta.
  for (const c of [iara, nahuel, inv]) assert.deepEqual(await c.emitir('accion', { tipo: 'basta', datos: { valores: Array(6).fill('Algo') } }), { ok: true });
  await esperar(() => iara.estado.sala?.partida?.fase === 'puntuando');
  for (const c of [iara, nahuel, inv]) await c.emitir('accion', { tipo: 'confirmar' });
  await esperar(() => iara.estado.sala?.estado === 'terminada');
});

test('el anfitrión saca al invitado: su sesión ya no sirve', async () => {
  await iara.emitir('volverAConfig', {});
  const idInv = inv.estado.sala.yo;
  assert.deepEqual(await iara.emitir('expulsar', { jugador: idInv }), { ok: true });
  await esperar(() => inv.estado.sala === null);
  await esperar(() => iara.estado.sala?.jugadores?.length === 2);
  // Reconectar con la cookie vieja: la sala ya no lo tiene.
  const otra = conectarCon(inv.cookie);
  await esperar(() => otra.estado.error === 'sala-cerrada');
});

test('skins: se guardan en el perfil y se descarta lo inválido', async () => {
  const r = await iara.api('/perfil/skins', 'PUT', { skins: { '*': 'madera', ajedrez: 'neon', inventado: 'neon', truco: 'cualquiera' } });
  assert.deepEqual((await r.json()).skins, { '*': 'madera', ajedrez: 'neon' });
  assert.deepEqual((await (await iara.api('/yo')).json()).usuario.skins, { '*': 'madera', ajedrez: 'neon' });
  assert.equal((await inv.api('/perfil/skins', 'PUT', { skins: {} })).status, 401);
});
