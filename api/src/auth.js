import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { perfilDe, actualizarPerfil, TEMAS } from './perfiles.js';

function parsearCookies(cabecera) {
  const out = {};
  for (const parte of cabecera.split(';')) {
    const i = parte.indexOf('=');
    if (i > 0) out[parte.slice(0, i).trim()] = decodeURIComponent(parte.slice(i + 1).trim());
  }
  return out;
}

// Usuarios fijos del sitio (solo hashes), en un archivo fuera de git: ver usuarios.example.json.
// Para cambiar una clave: npm run clave -- <usuario> <clave nueva> (ver scripts/clave.js).
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

// tema: estética personal del usuario (azul, rosa o negro); solo la ve él.
export const publico = ({ usuario, nombre, color, tema, avatarVersion, skins }) => ({
  usuario,
  nombre,
  color,
  tema: TEMAS.includes(tema) ? tema : 'azul',
  avatar: avatarVersion ? `/api/avatar/${usuario}?v=${avatarVersion}` : null,
  skins: skins || {},
});

// usuarios.json + lo que cada uno cambió en su perfil.
export function buscarUsuario(usuario) {
  const base = USUARIOS.find((u) => u.usuario === usuario);
  return base ? { ...base, ...perfilDe(usuario) } : undefined;
}
export const todosLosUsuarios = () => USUARIOS.map((u) => publico(buscarUsuario(u.usuario)));
export const listaUsuarios = () => USUARIOS.map((u) => ({ usuario: u.usuario, nombre: buscarUsuario(u.usuario).nombre }));

export async function cambiarClave(usuario, actual, nueva) {
  const u = buscarUsuario(usuario);
  if (!(await bcrypt.compare(String(actual || ''), u.hash))) throw Object.assign(new Error('La clave actual no es correcta'), { status: 400 });
  if (String(nueva || '').length < 6) throw Object.assign(new Error('La clave nueva tiene que tener al menos 6 caracteres'), { status: 400 });
  // Cambiar la clave cierra las otras sesiones (el token lleva la versión de la clave).
  actualizarPerfil(usuario, { hash: await bcrypt.hash(String(nueva), 10), claveVersion: (u.claveVersion || 0) + 1 });
}

export function firmarSesion(res, u) {
  const token = jwt.sign({ sub: u.usuario, v: u.claveVersion || 0 }, SECRETO, { expiresIn: `${DURACION_DIAS}d` });
  res.cookie(COOKIE, token, opcionesCookie());
}

// Freno a la fuerza bruta SIN bloquear a nadie: cada clave mal desde una IP hace esperar un poco
// más la respuesta (0,5 s por fallo, hasta 5 s), y se olvida a los 15 minutos o al entrar bien.
const fallos = new Map();
const VENTANA_MS = 15 * 60 * 1000;
function demora(ip) {
  const f = fallos.get(ip);
  if (!f || Date.now() - f.desde > VENTANA_MS) { fallos.delete(ip); return 0; }
  return Math.min(5000, f.cantidad * 500);
}
function sumarFallo(ip) {
  const f = fallos.get(ip);
  if (!f || Date.now() - f.desde > VENTANA_MS) fallos.set(ip, { desde: Date.now(), cantidad: 1 });
  else f.cantidad++;
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

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
    const { sub, v = 0 } = jwt.verify(token, SECRETO);
    const u = buscarUsuario(sub);
    return u && (u.claveVersion || 0) === v ? u : null;
  } catch {
    return null;
  }
}

export async function login(req, res) {
  const ip = req.ip;
  const ms = demora(ip);
  if (ms) await esperar(ms);
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
  firmarSesion(res, u);
  res.json({ usuario: publico(u) });
}

export function logout(_req, res) {
  res.clearCookie(COOKIE, { ...opcionesCookie(), maxAge: undefined });
  res.clearCookie(COOKIE_INVITADO, { ...opcionesCookie(), maxAge: undefined });
  res.json({ ok: true });
}

export function exigirSesion(req, res, next) {
  const u = usuarioDeCookie(req.headers.cookie);
  if (!u) return res.status(401).json({ error: 'Tenés que iniciar sesión' });
  req.usuario = u;
  next();
}

// Cualquiera con sesión: usuario del sitio o invitado con código.
export function exigirAlguien(req, res, next) {
  const u = usuarioDeCookie(req.headers.cookie) || invitadoDeCookie(req.headers.cookie);
  if (!u) return res.status(401).json({ error: 'Tenés que iniciar sesión' });
  req.usuario = u;
  next();
}

// Invitados: gente sin usuario que entra a UNA sala con el código que le pasaron. La sesión dura
// 2 días y solo sirve mientras esa sala exista (lo controla salas.js).
export const COOKIE_INVITADO = 'juegos_invitado';
const COLORES_INVITADO = ['#ff7043', '#ab47bc', '#26a69a', '#5c6bc0', '#ec407a', '#9ccc65', '#ffa726', '#29b6f6'];

export const publicoInvitado = (inv) => ({
  usuario: inv.id,
  nombre: inv.nombre,
  color: COLORES_INVITADO[[...inv.id].reduce((t, c) => t + c.charCodeAt(0), 0) % COLORES_INVITADO.length],
  tema: 'azul',
  avatar: null,
  invitado: true,
  sala: inv.sala,
});

export function invitadoDeCookie(cabecera) {
  try {
    const token = parsearCookies(cabecera || '')[COOKIE_INVITADO];
    if (!token) return null;
    const { inv, nombre, sala } = jwt.verify(token, SECRETO);
    return inv && String(inv).startsWith('inv-') ? publicoInvitado({ id: inv, nombre, sala }) : null;
  } catch {
    return null;
  }
}

// POST /api/invitado { codigo, nombre }. `unir` (de salas.js) mete al invitado en la sala o tira error.
// Los códigos mal suman demora por IP, igual que las claves mal (sin bloquear a nadie).
export function rutaInvitado(unir) {
  return async (req, res) => {
    const ip = req.ip;
    const ms = demora(ip);
    if (ms) await esperar(ms);
    const codigo = String(req.body?.codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const nombre = String(req.body?.nombre || '').replace(/\s+/g, ' ').trim().slice(0, 20);
    if (!nombre) return res.status(400).json({ error: 'Poné tu nombre para entrar' });
    try {
      const inv = unir(codigo, nombre);
      fallos.delete(ip);
      const token = jwt.sign({ inv: inv.id, nombre: inv.nombre, sala: inv.sala }, SECRETO, { expiresIn: '2d' });
      res.cookie(COOKIE_INVITADO, token, { ...opcionesCookie(), maxAge: 2 * 24 * 3600 * 1000 });
      res.json({ usuario: publicoInvitado(inv) });
    } catch (e) {
      if (e.codigoMal) sumarFallo(ip);
      res.status(400).json({ error: e.message || 'No se pudo entrar' });
    }
  };
}
