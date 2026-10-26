// Partidas completas entre dos clientes Socket.IO reales contra el servidor.
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
  { usuario: 'iara', nombre: 'Iara', color: '#e84393', tema: 'rosa', hash },
  { usuario: 'nahuel', nombre: 'Nahuel', color: '#0984e3', tema: 'negro', hash },
]));

const { crearServidor } = await import('../src/servidor.js');
const { flotaDe, validarFlota } = await import('../src/juegos/batallaNaval.js');

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

async function entrar(usuario, clave = CLAVE) {
  const r = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ usuario, clave }),
  });
  if (r.status !== 200) return { status: r.status };
  const cookie = r.headers.get('set-cookie').split(';')[0];
  const socket = conectar(base, { extraHeaders: { cookie }, transports: ['websocket'] });
  clientes.push(socket);
  const estado = { sala: undefined, lobby: null, chat: [] };
  socket.on('sala', (s) => (estado.sala = s));
  socket.on('lobby', (l) => (estado.lobby = l));
  socket.on('chat:mensaje', (m) => estado.chat.push(m));
  await new Promise((r) => socket.on('connect', r));
  const emitir = (ev, d) => new Promise((r) => socket.emit(ev, d, r));
  const api = (ruta, metodo = 'GET', datos) =>
    fetch(`${base}/api${ruta}`, { method: metodo, headers: { cookie, 'content-type': 'application/json' }, body: datos && JSON.stringify(datos) });
  return { status: 200, socket, estado, emitir, api, cookie };
}

const esperar = async (cond) => {
  for (let i = 0; i < 150 && !cond(); i++) await new Promise((r) => setTimeout(r, 20));
  assert.ok(cond(), 'timeout esperando estado');
};

let iara, nahuel;

test('clave incorrecta da 401', async () => {
  assert.equal((await entrar('iara', 'nop')).status, 401);
  iara = await entrar('iara');
  nahuel = await entrar('nahuel');
  await esperar(() => iara.estado.lobby?.usuarios.find((u) => u.usuario === 'nahuel')?.online);
});

test('chat en vivo', async () => {
  assert.deepEqual(await iara.emitir('chat:enviar', { texto: 'hola amor' }), { ok: true });
  await esperar(() => nahuel.estado.chat.some((m) => m.texto === 'hola amor' && m.de === 'iara'));
  assert.ok((await nahuel.emitir('chat:enviar', { texto: '   ' })).error);
});

test('perfil: nombre, tema y foto', async () => {
  let r = await iara.api('/perfil', 'PUT', { nombre: 'Iarita', color: '#ff4f9a', tema: 'rosa' });
  assert.equal((await r.json()).usuario.nombre, 'Iarita');
  await esperar(() => nahuel.estado.lobby.usuarios.find((u) => u.usuario === 'iara').nombre === 'Iarita');
  r = await iara.api('/perfil', 'PUT', { nombre: 'Iara', color: 'rojo', tema: 'rosa' });
  assert.equal(r.status, 400);
  // PNG de 1x1
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  r = await iara.api('/perfil/avatar', 'PUT', { imagen: `data:image/png;base64,${png}` });
  const { usuario } = await r.json();
  assert.match(usuario.avatar, /^\/api\/avatar\/iara\?v=/);
  r = await nahuel.api(usuario.avatar.replace('/api', ''));
  assert.equal(r.headers.get('content-type'), 'image/png');
  r = await iara.api('/perfil/avatar', 'PUT', { imagen: `data:image/png;base64,${Buffer.from('<svg/>').toString('base64')}` });
  assert.equal(r.status, 400);
});

test('batalla naval: sala de configuración, reglas en vivo y partida completa', async () => {
  assert.deepEqual(await iara.emitir('invitar', { a: 'nahuel', juego: 'batalla-naval' }), { ok: true });
  await esperar(() => nahuel.estado.lobby?.invitaciones.recibidas.length === 1);
  await nahuel.emitir('responder', { de: 'iara', acepta: true });
  await esperar(() => iara.estado.sala?.estado === 'config' && nahuel.estado.sala?.estado === 'config');

  // Una regla imposible se rechaza; una válida la ven los dos y desmarca el "listo".
  await iara.emitir('listo', { listo: true });
  assert.match((await nahuel.emitir('configurar', { config: { filas: 6, columnas: 6, barcos: { portaaviones: 4 } } })).error, /No entran/);
  const config = { filas: 8, columnas: 9, barcos: { crucero: 2, destructor: 1 }, seguirAlTocar: true };
  assert.deepEqual(await nahuel.emitir('configurar', { config }), { ok: true });
  await esperar(() => iara.estado.sala.config.filas === 8 && iara.estado.sala.listos.length === 0);

  await iara.emitir('listo', { listo: true });
  await nahuel.emitir('listo', { listo: true });
  await esperar(() => iara.estado.sala?.estado === 'jugando' && iara.estado.sala.partida.estado === 'colocando');
  const vista = iara.estado.sala.partida;
  assert.equal(vista.filas, 8);
  assert.equal(vista.flota.length, 3);

  const flota = flotaDe(config);
  const barcos = flota.map((t, i) => ({ id: t.id, fila: i * 2, col: 0, horizontal: true }));
  assert.match((await iara.emitir('accion', { tipo: 'disparar', datos: { fila: 0, col: 0 } })).error, /no está en juego/);
  await iara.emitir('accion', { tipo: 'colocar', datos: { barcos } });
  await nahuel.emitir('accion', { tipo: 'colocar', datos: { barcos } });
  await esperar(() => iara.estado.sala.partida.estado === 'jugando');
  assert.equal(iara.estado.sala.partida.flotaRival.length, 0);

  const objetivos = validarFlota(barcos, flota, 8, 9).flatMap((b) => b.celdas);
  const pendientes = { iara: [...objetivos], nahuel: [...objetivos] };
  while (iara.estado.sala.partida.estado === 'jugando') {
    const yo = iara.estado.sala.partida.turno === 'iara' ? 'iara' : 'nahuel';
    const j = yo === 'iara' ? iara : nahuel;
    const [fila, col] = pendientes[yo].shift();
    const antes = JSON.stringify(j.estado.sala.partida.misDisparos);
    assert.deepEqual(await j.emitir('accion', { tipo: 'disparar', datos: { fila, col } }), { ok: true });
    await esperar(() => JSON.stringify(j.estado.sala.partida.misDisparos) !== antes);
  }
  await esperar(() => nahuel.estado.sala?.estado === 'terminada');
  assert.equal(iara.estado.sala.partida.flotaRival.length, 3);
  await esperar(() => iara.estado.lobby?.stats.porJuego['batalla-naval']?.jugadas === 1);

  // Revancha con las mismas reglas; después volver a la sala y salir.
  await iara.emitir('revancha');
  await nahuel.emitir('revancha');
  await esperar(() => iara.estado.sala?.partida?.estado === 'colocando');
  assert.equal(iara.estado.sala.partida.filas, 8);
  assert.match((await iara.emitir('salir')).error, /abandonar/);
  await iara.emitir('abandonar');
  await nahuel.emitir('volverAConfig');
  await esperar(() => iara.estado.sala?.estado === 'config');
  await nahuel.emitir('salir');
  await esperar(() => iara.estado.sala === null && nahuel.estado.sala === null);
});

test('ahorcado online', async () => {
  await nahuel.emitir('invitar', { a: 'iara', juego: 'ahorcado' });
  await esperar(() => iara.estado.lobby?.invitaciones.recibidas.length === 1);
  await iara.emitir('responder', { de: 'nahuel', acepta: true });
  await esperar(() => iara.estado.sala?.juego === 'ahorcado');
  await iara.emitir('configurar', { config: { rondas: 1, errores: 6, modo: 'rival' } });
  await iara.emitir('listo', {});
  await nahuel.emitir('listo', {});
  await esperar(() => iara.estado.sala?.estado === 'jugando');
  const yoElijo = iara.estado.sala.partida.ronda.adivinoYo ? nahuel : iara;
  const adivina = yoElijo === iara ? nahuel : iara;
  await yoElijo.emitir('accion', { tipo: 'palabra', datos: { palabra: 'mate', pista: '🧉' } });
  await esperar(() => adivina.estado.sala.partida.ronda.fase === 'adivinando');
  assert.equal(adivina.estado.sala.partida.ronda.palabra, null);
  assert.deepEqual(adivina.estado.sala.partida.ronda.mostrada, ['_', '_', '_', '_']);
  await adivina.emitir('accion', { tipo: 'arriesgar', datos: { palabra: 'Mate' } });
  await esperar(() => iara.estado.sala?.estado === 'terminada');
  await iara.emitir('salir');
  await esperar(() => nahuel.estado.sala === null);
});
