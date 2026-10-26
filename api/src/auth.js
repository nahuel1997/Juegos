import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function parsearCookies(cabecera) {
  const out = {};
  for (const parte of cabecera.split(';')) {
    const i = parte.indexOf('=');
    if (i > 0) out[parte.slice(0, i).trim()] = decodeURIComponent(parte.slice(i + 1).trim());
  }
  return out;
}

// Usuarios fijos del sitio (solo hashes), en un archivo fuera de git: ver usuarios.example.json.
// Para cambiar una clave: npm run hash -- <clave nueva>.
const ARCHIVO_USUARIOS = process.env.USUARIOS_ARCHIVO || fileURLToPath(new URL('../../usuarios.json', import.meta.url));
let USUARIOS;
try {
  USUARIOS = JSON.parse(readFileSync(ARCHIVO_USUARIOS, 'utf8'));
} catch (e) {
  throw new Error(`No se pudo leer ${ARCHIVO_USUARIOS} (copiá usuarios.example.json y completá los hashes): ${e.message}`);
}

const SECRETO = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'solo-para-desarrollo');
if (!SECRETO) throw new Error('Falta JWT_SECRET');

export const COOKIE = 'juegos_sesion';
const DURACION_DIAS = 30;

// tema: estética personal opcional del usuario (ej. "rosa"); solo la ve él.
export const publico = ({ usuario, nombre, color, tema = '' }) => ({ usuario, nombre, color, tema });
export const buscarUsuario = (usuario) => USUARIOS.find((u) => u.usuario === usuario);
export const todosLosUsuarios = () => USUARIOS.map(publico);

// Freno simple a la fuerza bruta: 8 intentos fallidos por IP cada 15 minutos.
const fallos = new Map();
const VENTANA_MS = 15 * 60 * 1000;
function bloqueada(ip) {
  const f = fallos.get(ip);
  if (!f) return false;
  if (Date.now() - f.desde > VENTANA_MS) { fallos.delete(ip); return false; }
  return f.cantidad >= 8;
}
function sumarFallo(ip) {
  const f = fallos.get(ip);
  if (!f || Date.now() - f.desde > VENTANA_MS) fallos.set(ip, { desde: Date.now(), cantidad: 1 });
  else f.cantidad++;
}

function opcionesCookie() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SEGURA !== 'false' && process.env.NODE_ENV === 'production',
    maxAge: DURACION_DIAS * 24 * 3600 * 1000,
    path: '/',
  };
}

export function usuarioDeCookie(cabecera) {
  try {
    const token = parsearCookies(cabecera || '')[COOKIE];
    if (!token) return null;
    const { sub } = jwt.verify(token, SECRETO);
    return buscarUsuario(sub) || null;
  } catch {
    return null;
  }
}

export async function login(req, res) {
  const ip = req.ip;
  if (bloqueada(ip)) return res.status(429).json({ error: 'Demasiados intentos. Probá en unos minutos.' });
  const usuario = String(req.body?.usuario || '').trim().toLowerCase();
  const clave = String(req.body?.clave || '');
  const u = buscarUsuario(usuario);
  // Se compara igual aunque el usuario no exista, para no revelar cuáles existen por el tiempo de respuesta.
  const ok = await bcrypt.compare(clave, u?.hash || '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
  if (!u || !ok) {
    sumarFallo(ip);
    return res.status(401).json({ error: 'Usuario o clave incorrectos' });
  }
  fallos.delete(ip);
  const token = jwt.sign({ sub: u.usuario }, SECRETO, { expiresIn: `${DURACION_DIAS}d` });
  res.cookie(COOKIE, token, opcionesCookie());
  res.json({ usuario: publico(u) });
}

export function logout(_req, res) {
  res.clearCookie(COOKIE, { ...opcionesCookie(), maxAge: undefined });
  res.json({ ok: true });
}

export function exigirSesion(req, res, next) {
  const u = usuarioDeCookie(req.headers.cookie);
  if (!u) return res.status(401).json({ error: 'Tenés que iniciar sesión' });
  req.usuario = u;
  next();
}
