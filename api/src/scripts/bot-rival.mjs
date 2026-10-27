// Rival automático para probar la UI a mano: acepta desafíos, se pone listo cuando el otro lo está
// y juega cualquiera de los juegos de forma simple.
// Uso: node src/scripts/bot-rival.mjs <usuario> <clave> [http://localhost:4400]
import { io } from 'socket.io-client';
import { jugadaBot } from '../bots.js';

const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));

const [usuario, clave, base = 'http://localhost:4400'] = process.argv.slice(2);
const r = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ usuario, clave }) });
if (!r.ok) throw new Error(`login ${r.status}`);
const s = io(base, { extraHeaders: { cookie: r.headers.get('set-cookie').split(';')[0] }, transports: ['websocket'] });

const azar = (n) => Math.floor(Math.random() * n);
const accion = (tipo, datos) => new Promise((ok) => s.emit('accion', { tipo, datos }, ok));
let ultima = null;
let ocupado = false;
let pendiente = null;

s.on('lobby', (l) => l.invitaciones.recibidas.forEach((i) => s.emit('responder', { de: i.de, acepta: true }, () => {})));
// Si le mandan un emoticón, contesta con otro.
s.on('emote', (e) => {
  if (e.de !== usuario) setTimeout(() => s.emit('emote', { id: ['risa', 'fuckyou', 'beso', 'facha'][azar(4)] }, () => {}), 1500);
});
s.on('chat:mensaje', (m) => {
  if (m.de !== usuario && /hola/i.test(m.texto)) s.emit('chat:enviar', { texto: '¡Hola! Soy el bot 🤖' }, () => {});
});
s.on('sala', (sala) => {
  ultima = sala;
  clearTimeout(pendiente);
  pendiente = setTimeout(pensar, 600);
});

async function pensar() {
  const sala = ultima;
  if (!sala || ocupado) return;
  ocupado = true;
  try {
    await jugar(sala);
  } finally {
    ocupado = false;
    // Si llegó otra novedad mientras jugaba, se vuelve a pensar.
    if (ultima !== sala) pendiente = setTimeout(pensar, 300);
  }
}

async function jugar(sala) {
  const yo = sala.yo;
  if (sala.estado === 'config') {
    if (sala.listos.includes(sala.rival) && !sala.listos.includes(yo)) s.emit('listo', { listo: true }, () => {});
    return;
  }
  if (sala.estado === 'terminada') {
    if (sala.revancha.includes(sala.rival) && !sala.revancha.includes(yo)) s.emit('revancha', {}, () => {});
    return;
  }
  const j = await jugadaBot(sala.juego, sala.partida, yo, { rival: sala.rival, espera });
  if (j) return accion(j.tipo, j.datos);
}

console.log(`bot ${usuario} conectado`);
