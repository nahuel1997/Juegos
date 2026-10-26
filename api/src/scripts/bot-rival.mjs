// Rival automático para probar la UI a mano: acepta invitaciones, ubica al azar y dispara al azar.
// Uso: node src/scripts/bot-rival.mjs <usuario> <clave> [http://localhost:4400]
import { io } from 'socket.io-client';
import { flotaAlAzar } from '../juegos/batallaNaval.js';

const [usuario, clave, base = 'http://localhost:4400'] = process.argv.slice(2);
const r = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ usuario, clave }) });
if (!r.ok) throw new Error(`login ${r.status}`);
const s = io(base, { extraHeaders: { cookie: r.headers.get('set-cookie').split(';')[0] }, transports: ['websocket'] });
s.on('lobby', (l) => l.invitaciones.recibidas.forEach((i) => s.emit('responder', { de: i.de, acepta: true }, () => {})));
let tirando = false;
let ultima = null;
const jugar = (p) => {
  if (!p) return;
  if (p.estado === 'colocando' && !p.listo.yo) s.emit('colocar', { barcos: flotaAlAzar() }, () => {});
  if (p.estado === 'terminada' && p.revancha.length && !p.revancha.includes(p.yo)) s.emit('revancha', {}, () => {});
  if (p.estado === 'jugando' && p.turno === p.yo && !tirando) {
    tirando = true;
    setTimeout(() => {
      p = ultima;
      const hechos = new Set(p.misDisparos.map((d) => `${d.fila},${d.col}`));
      let f, c;
      do { f = Math.floor(Math.random() * 10); c = Math.floor(Math.random() * 10); } while (hechos.has(`${f},${c}`));
      s.emit('disparar', { fila: f, col: c }, () => { tirando = false; jugar(ultima); });
    }, 700);
  }
};
s.on('partida', (p) => { ultima = p; jugar(p); });
console.log(`bot ${usuario} conectado`);
