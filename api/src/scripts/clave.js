// Uso: npm run clave -- <usuario> <clave nueva>
// Le pone una clave nueva a un usuario (pisa la que haya elegido desde su perfil) y le cierra las
// sesiones abiertas. Escribe en DATA_DIR/perfiles.json: correrlo con la API apagada (la API tiene
// los perfiles en memoria y los volvería a guardar). En Docker:
//   docker compose stop api
//   docker compose run --rm --no-deps api node src/scripts/clave.js <usuario> "<clave nueva>"
//   docker compose start api
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { perfilDe, actualizarPerfil } from '../perfiles.js';

const [usuario, clave] = process.argv.slice(2);
if (!usuario || !clave) {
  console.error('Uso: npm run clave -- <usuario> <clave nueva>');
  process.exit(1);
}
if (clave.length < 6) {
  console.error('La clave tiene que tener al menos 6 caracteres');
  process.exit(1);
}
const archivo = process.env.USUARIOS_ARCHIVO || fileURLToPath(new URL('../../../usuarios.json', import.meta.url));
const usuarios = JSON.parse(readFileSync(archivo, 'utf8'));
const nombre = usuario.trim().toLowerCase();
if (!usuarios.some((u) => u.usuario === nombre)) {
  console.error(`No existe el usuario "${nombre}". Usuarios: ${usuarios.map((u) => u.usuario).join(', ')}`);
  process.exit(1);
}
const anterior = perfilDe(nombre).claveVersion || 0;
actualizarPerfil(nombre, { hash: bcrypt.hashSync(clave, 10), claveVersion: anterior + 1 });
console.log(`Listo: ${nombre} tiene clave nueva (se cerraron sus sesiones abiertas).`);
