// Sincronización con el panel de apps (pestaña Usuarios): el panel pide la lista de usuarios con
// "Authorization: Bearer <PANEL_SYNC_TOKEN>". Nunca viajan hashes ni claves: las claves acá se
// eligen a mano (no hay clave inicial que el panel pueda conocer).
import { createHash, timingSafeEqual } from 'node:crypto';
import { listaUsuarios } from './auth.js';

const resumen = (t) => createHash('sha256').update(String(t)).digest();

export function tokenValido(cabecera, token = process.env.PANEL_SYNC_TOKEN) {
  if (!token || token.length < 32) return false;
  const m = /^Bearer (.+)$/.exec(String(cabecera || ''));
  return !!m && timingSafeEqual(resumen(m[1]), resumen(token));
}

export function rutaUsuariosPanel(req, res) {
  if (!tokenValido(req.headers.authorization)) return res.status(401).json({ error: 'No autorizado' });
  res.set('Cache-Control', 'no-store');
  res.json({
    usuarios: listaUsuarios().map((u) => ({ usuario: u.usuario, rol: 'jugador', activo: true, clave_inicial: false })),
  });
}
