// Chat en vivo entre todos los usuarios. Se guardan los últimos mensajes en DATA_DIR/chat.json.
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const DIR = process.env.DATA_DIR || join(process.cwd(), 'datos');
const ARCHIVO = join(DIR, 'chat.json');
const MAX_GUARDADOS = 300;
const MAX_TEXTO = 500;

let mensajes = [];
try {
  mensajes = JSON.parse(readFileSync(ARCHIVO, 'utf8'));
} catch {
  mensajes = [];
}

let pendiente = null;
function guardarLuego() {
  // Se agrupan las escrituras: como mucho una por segundo.
  if (pendiente) return;
  pendiente = setTimeout(() => {
    pendiente = null;
    try {
      mkdirSync(DIR, { recursive: true });
      writeFileSync(`${ARCHIVO}.tmp`, JSON.stringify(mensajes));
      renameSync(`${ARCHIVO}.tmp`, ARCHIVO);
    } catch (e) {
      console.error('No se pudo guardar el chat:', e.message);
    }
  }, 1000);
  pendiente.unref?.();
}

const envios = new Map(); // usuario -> fechas de los últimos envíos (freno al spam)

export function montarChat(io, socket, yo) {
  socket.emit('chat:historial', mensajes.slice(-100));

  socket.on('chat:enviar', ({ texto } = {}, ack) => {
    const responder = typeof ack === 'function' ? ack : () => {};
    const limpio = String(texto ?? '').trim().slice(0, MAX_TEXTO);
    if (!limpio) return responder({ error: 'Mensaje vacío' });
    const ahora = Date.now();
    const recientes = (envios.get(yo) || []).filter((t) => ahora - t < 10_000);
    if (recientes.length >= 10) return responder({ error: 'Más despacio' });
    envios.set(yo, [...recientes, ahora]);
    const msg = { id: randomUUID(), de: yo, texto: limpio, fecha: new Date().toISOString() };
    mensajes.push(msg);
    mensajes = mensajes.slice(-MAX_GUARDADOS);
    guardarLuego();
    io.emit('chat:mensaje', msg);
    responder({ ok: true });
  });

  socket.on('chat:escribiendo', () => socket.broadcast.emit('chat:escribiendo', { de: yo }));
}
