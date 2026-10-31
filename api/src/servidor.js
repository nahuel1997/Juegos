import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { login, logout, exigirSesion, exigirAlguien, publico, buscarUsuario, cambiarClave, firmarSesion, rutaInvitado } from './auth.js';
import { montarSalas, JUEGOS } from './salas.js';
import { limpiarSkins } from './skins.js';
import { resumen } from './historial.js';
import { rutaUsuariosPanel } from './panel.js';
import { palabrasJugadas } from './juegos/stopPalabras.js';
import { actualizarPerfil, guardarAvatar, borrarAvatar, archivoAvatar, TEMAS, MAX_AVATAR } from './perfiles.js';

export function crearServidor() {
  const app = express();
  app.disable('x-powered-by');
  // Nginx del host + Nginx del contenedor web: la IP real está 2 saltos atrás.
  app.set('trust proxy', Number(process.env.TRUST_PROXY || 0));
  // La foto de perfil viaja en base64 (≈ 4/3 del tamaño): esa ruta acepta más.
  app.use('/api/perfil/avatar', express.json({ limit: Math.ceil(MAX_AVATAR * 1.4) }));
  app.use(express.json({ limit: '20kb' }));

  let salas = null; // se monta más abajo
  const refrescar = () => salas?.refrescar();

  app.get('/api/salud', (_req, res) => res.json({ ok: true }));
  app.post('/api/login', login);
  app.post('/api/logout', logout);
  app.get('/api/yo', exigirAlguien, (req, res) => res.json({ usuario: req.usuario.invitado ? req.usuario : publico(req.usuario) }));
  // Entrar sin cuenta a una sala con el código que te pasaron.
  app.post('/api/invitado', rutaInvitado((codigo, nombre) => salas.unirInvitado(codigo, nombre)));
  app.get('/api/historial', exigirSesion, (req, res) => res.json(resumen(req.usuario.usuario)));
  app.get('/api/stop/palabras', exigirSesion, (_req, res) => res.json(palabrasJugadas()));

  // Perfil: nombre, color y tema.
  app.put('/api/perfil', exigirSesion, (req, res) => {
    const nombre = String(req.body?.nombre ?? '').trim().slice(0, 20);
    const color = String(req.body?.color ?? '');
    const tema = String(req.body?.tema ?? '');
    if (!nombre) return res.status(400).json({ error: 'El nombre no puede quedar vacío' });
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return res.status(400).json({ error: 'Color inválido' });
    if (!TEMAS.includes(tema)) return res.status(400).json({ error: 'Tema inválido' });
    actualizarPerfil(req.usuario.usuario, { nombre, color, tema });
    refrescar();
    res.json({ usuario: publico(buscarUsuario(req.usuario.usuario)) });
  });

  // Skins elegidas por juego (o '*' para todos). Solo las ve cada uno.
  app.put('/api/perfil/skins', exigirSesion, (req, res) => {
    const skins = limpiarSkins(req.body?.skins, Object.keys(JUEGOS));
    actualizarPerfil(req.usuario.usuario, { skins });
    res.json({ skins });
  });

  app.put('/api/perfil/clave', exigirSesion, async (req, res, next) => {
    try {
      await cambiarClave(req.usuario.usuario, req.body?.actual, req.body?.nueva);
      firmarSesion(res, buscarUsuario(req.usuario.usuario)); // esta sesión sigue; las otras se cierran
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  app.put('/api/perfil/avatar', exigirSesion, (req, res) => {
    const m = /^data:image\/[a-z]+;base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.imagen || ''));
    if (!m) return res.status(400).json({ error: 'Imagen inválida' });
    guardarAvatar(req.usuario.usuario, Buffer.from(m[1], 'base64'));
    refrescar();
    res.json({ usuario: publico(buscarUsuario(req.usuario.usuario)) });
  });

  app.delete('/api/perfil/avatar', exigirSesion, (req, res) => {
    borrarAvatar(req.usuario.usuario);
    refrescar();
    res.json({ usuario: publico(buscarUsuario(req.usuario.usuario)) });
  });

  app.get('/api/avatar/:usuario', exigirAlguien, (req, res) => {
    const a = archivoAvatar(String(req.params.usuario).replace(/[^a-z0-9_-]/gi, ''));
    if (!a) return res.status(404).end();
    // La URL lleva la versión (?v=), así que se puede cachear.
    res.set({ 'Content-Type': a.tipo, 'Cache-Control': 'private, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' });
    res.sendFile(a.ruta);
  });

  // Lista de usuarios para el panel de apps (con token, sin hashes).
  app.get('/api/panel/usuarios', rutaUsuariosPanel);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'No existe' }));
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    const mensaje = status === 413 ? 'La imagen es muy pesada' : status < 500 && err.message && !err.type ? err.message : status < 500 ? 'Pedido inválido' : 'Error del servidor';
    res.status(status).json({ error: mensaje });
  });

  const servidor = createServer(app);
  const io = new Server(servidor, { path: '/socket.io', serveClient: false });
  salas = montarSalas(io);
  servidor.salas = salas;
  return servidor;
}
