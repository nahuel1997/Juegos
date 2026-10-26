// Datos que cada uno cambia desde su perfil (nombre, color, tema, clave, foto). Viven en DATA_DIR
// (volumen Docker) y pisan a usuarios.json, que queda como base de solo lectura.
import { readFileSync, writeFileSync, mkdirSync, renameSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.env.DATA_DIR || join(process.cwd(), 'datos');
const ARCHIVO = join(DIR, 'perfiles.json');
const AVATARES = join(DIR, 'avatares');

export const TEMAS = ['azul', 'rosa', 'negro'];

let perfiles = {};
try {
  perfiles = JSON.parse(readFileSync(ARCHIVO, 'utf8'));
} catch {
  perfiles = {};
}

function guardar() {
  mkdirSync(DIR, { recursive: true });
  const tmp = `${ARCHIVO}.tmp`;
  writeFileSync(tmp, JSON.stringify(perfiles, null, 2));
  renameSync(tmp, ARCHIVO);
}

export const perfilDe = (usuario) => perfiles[usuario] || {};

export function actualizarPerfil(usuario, cambios) {
  perfiles[usuario] = { ...perfilDe(usuario), ...cambios };
  guardar();
}

// Solo JPEG, PNG o WebP, reconocidos por sus primeros bytes (no por lo que diga el cliente).
function tipoImagen(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

export const MAX_AVATAR = 400 * 1024;

export function guardarAvatar(usuario, buf) {
  const tipo = tipoImagen(buf);
  if (!tipo) throw Object.assign(new Error('La imagen tiene que ser JPG, PNG o WebP'), { status: 400 });
  if (buf.length > MAX_AVATAR) throw Object.assign(new Error('La imagen es muy pesada'), { status: 400 });
  mkdirSync(AVATARES, { recursive: true });
  writeFileSync(join(AVATARES, `${usuario}.img`), buf);
  actualizarPerfil(usuario, { avatarTipo: tipo, avatarVersion: Date.now() });
}

export function borrarAvatar(usuario) {
  rmSync(join(AVATARES, `${usuario}.img`), { force: true });
  actualizarPerfil(usuario, { avatarTipo: null, avatarVersion: null });
}

export function archivoAvatar(usuario) {
  const p = perfilDe(usuario);
  const ruta = join(AVATARES, `${usuario}.img`);
  return p.avatarTipo && existsSync(ruta) ? { ruta, tipo: p.avatarTipo } : null;
}
