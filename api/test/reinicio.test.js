// Las salas y partidas en curso sobreviven a un reinicio del servidor.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import bcrypt from 'bcryptjs';
import { io as conectar } from 'socket.io-client';

const CLAVE = 'clave-de-test';
const dir = mkdtempSync(join(tmpdir(), 'juegos-reinicio-'));
process.env.DATA_DIR = dir;
process.env.USUARIOS_ARCHIVO = join(dir, 'usuarios.json');
const hash = bcrypt.hashSync(CLAVE, 4);
writeFileSync(process.env.USUARIOS_ARCHIVO, JSON.stringify([
  { usuario: 'iara', nombre: 'Iara', color: '#e84393', hash },
  { usuario: 'nahuel', nombre: 'Nahuel', color: '#0984e3', hash },
]));

const { crearServidor } = await import('../src/servidor.js');
const { PartidaTutiFruti, validarConfig } = await import('../src/juegos/tutiFruti.js');
const { serializar, deserializar } = await import('../src/persistencia.js');

const abiertos = [];
after(() => abiertos.forEach((x) => x.close()));

async function levantar() {
  const servidor = crearServidor();
  await new Promise((r) => servidor.listen(0, r));
  abiertos.push(servidor);
  return { servidor, base: `http://127.0.0.1:${servidor.address().port}` };
}

async function entrar(base, usuario) {
  const r = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ usuario, clave: CLAVE }),
  });
  const cookie = r.headers.get('set-cookie').split(';')[0];
  const socket = conectar(base, { extraHeaders: { cookie }, transports: ['websocket'] });
  abiertos.push(socket);
  const estado = { sala: undefined, lobby: null };
  socket.on('sala', (s) => (estado.sala = s));
  socket.on('lobby', (l) => (estado.lobby = l));
  await new Promise((res) => socket.on('connect', res));
  return { socket, estado, emitir: (ev, d) => new Promise((res) => socket.emit(ev, d, res)) };
}

const esperar = async (cond) => {
  for (let i = 0; i < 150 && !cond(); i++) await new Promise((r) => setTimeout(r, 20));
  assert.ok(cond(), 'timeout esperando estado');
};

test('una generala a medio jugar sigue igual después de reiniciar el servidor', async () => {
  const a = await levantar();
  let iara = await entrar(a.base, 'iara');
  let nahuel = await entrar(a.base, 'nahuel');
  await esperar(() => iara.estado.lobby?.usuarios.find((u) => u.usuario === 'nahuel')?.online);
  await iara.emitir('invitar', { a: 'nahuel', juego: 'generala' });
  await esperar(() => nahuel.estado.lobby?.invitaciones.recibidas.length === 1);
  await nahuel.emitir('responder', { de: 'iara', acepta: true });
  await esperar(() => iara.estado.sala?.estado === 'config');
  await iara.emitir('listo', {});
  await nahuel.emitir('listo', {});
  await esperar(() => iara.estado.sala?.estado === 'jugando');

  const turno = iara.estado.sala.partida.turno;
  const jugador = turno === 'iara' ? iara : nahuel;
  await jugador.emitir('accion', { tipo: 'tirar' });
  await esperar(() => jugador.estado.sala.partida.tiros === 1);
  const antes = jugador.estado.sala.partida;

  // Reinicio: se guarda, se apaga todo y se levanta un servidor nuevo sobre los mismos datos.
  a.servidor.salas.guardarYa();
  iara.socket.close();
  nahuel.socket.close();
  a.servidor.close();

  const b = await levantar();
  iara = await entrar(b.base, 'iara');
  nahuel = await entrar(b.base, 'nahuel');
  const otra = turno === 'iara' ? iara : nahuel;
  await esperar(() => otra.estado.sala?.estado === 'jugando');
  const despues = otra.estado.sala.partida;
  assert.equal(despues.turno, antes.turno);
  assert.deepEqual(despues.dados, antes.dados);
  assert.equal(despues.tiros, 1);

  // Y se puede seguir jugando como si nada.
  const mismo = turno === 'iara' ? iara : nahuel;
  assert.deepEqual(await mismo.emitir('accion', { tipo: 'anotar', datos: { categoria: 'escalera' } }), { ok: true });
  await esperar(() => mismo.estado.sala.partida.turno !== turno);
});

test('un basta de tuti fruti guardado se cierra solo al restaurarlo', async () => {
  const p = new PartidaTutiFruti(['iara', 'nahuel'], validarConfig({ columnas: ['Animal'], rondas: 1, segundosBasta: 1, cuentaAtras: 0 }));
  p.accion('iara', 'basta', { valores: ['Oso'] });
  const copia = Object.assign(new PartidaTutiFruti(['iara', 'nahuel'], p.config), deserializar(serializar(p)));
  clearTimeout(p.timer);
  let avisado = false;
  copia.notificar = () => (avisado = true);
  copia.reanudar();
  assert.equal(copia.vistaPara('iara').fase, 'basta');
  await new Promise((r) => setTimeout(r, 1100));
  assert.equal(copia.vistaPara('iara').fase, 'puntuando');
  assert.ok(avisado);
});
