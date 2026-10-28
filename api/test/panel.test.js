// La lista de usuarios para el panel de apps: con token, sin hashes.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TOKEN = 'x'.repeat(40);
const dir = mkdtempSync(join(tmpdir(), 'juegos-panel-'));
process.env.DATA_DIR = dir;
process.env.PANEL_SYNC_TOKEN = TOKEN;
process.env.USUARIOS_ARCHIVO = join(dir, 'usuarios.json');
writeFileSync(process.env.USUARIOS_ARCHIVO, JSON.stringify([
  { usuario: 'iara', nombre: 'Iara', color: '#e84393', hash: '$2b$04$abc' },
  { usuario: 'nahuel', nombre: 'Nahuel', color: '#0984e3', hash: '$2b$04$def' },
]));

const { crearServidor } = await import('../src/servidor.js');
const { tokenValido } = await import('../src/panel.js');
const servidor = crearServidor();
await new Promise((r) => servidor.listen(0, r));
after(() => servidor.close());
const url = `http://127.0.0.1:${servidor.address().port}/api/panel/usuarios`;

test('sin token o con token incorrecto: 401', async () => {
  assert.equal((await fetch(url)).status, 401);
  assert.equal((await fetch(url, { headers: { Authorization: 'Bearer otro' } })).status, 401);
});

test('con token: lista de usuarios sin hashes', async () => {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  assert.equal(r.status, 200);
  const cuerpo = await r.json();
  assert.deepEqual(cuerpo.usuarios.map((u) => u.usuario), ['iara', 'nahuel']);
  assert.ok(!JSON.stringify(cuerpo).includes('$2b$'));
  assert.equal(cuerpo.usuarios[0].clave_inicial, false);
});

test('token corto o vacío: la sincronización queda apagada', () => {
  assert.equal(tokenValido('Bearer corto', 'corto'), false);
  assert.equal(tokenValido('Bearer ', ''), false);
});

test('muchas claves mal no bloquean: con la buena entra igual', { timeout: 60000 }, async () => {
  const { default: bcrypt } = await import('bcryptjs');
  const { actualizarPerfil } = await import('../src/perfiles.js');
  actualizarPerfil('iara', { hash: bcrypt.hashSync('la-buena', 4) });
  const login = (clave) => fetch(url.replace('/panel/usuarios', '/login'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: 'iara', clave }),
  });
  for (let i = 0; i < 10; i++) assert.equal((await login('mal')).status, 401);
  assert.equal((await login('la-buena')).status, 200);
});
