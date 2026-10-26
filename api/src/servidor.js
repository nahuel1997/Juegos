import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { login, logout, exigirSesion, publico } from './auth.js';
import { montarSalas } from './salas.js';
import { resumen } from './historial.js';

export function crearServidor() {
  const app = express();
  app.disable('x-powered-by');
  // Nginx del host + Nginx del contenedor web: la IP real está 2 saltos atrás.
  app.set('trust proxy', Number(process.env.TRUST_PROXY || 0));
  app.use(express.json({ limit: '20kb' }));

  app.get('/api/salud', (_req, res) => res.json({ ok: true }));
  app.post('/api/login', login);
  app.post('/api/logout', logout);
  app.get('/api/yo', exigirSesion, (req, res) => res.json({ usuario: publico(req.usuario) }));
  app.get('/api/historial', exigirSesion, (req, res) => res.json(resumen(req.usuario.usuario)));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'No existe' }));
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.status === 400 ? 'Pedido inválido' : 'Error del servidor' });
  });

  const servidor = createServer(app);
  const io = new Server(servidor, { path: '/socket.io', serveClient: false });
  montarSalas(io);
  return servidor;
}
