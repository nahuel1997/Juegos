// Rival automático para probar la UI a mano: acepta desafíos, se pone listo cuando el otro lo está
// y juega cualquiera de los juegos de forma simple.
// Uso: node src/scripts/bot-rival.mjs <usuario> <clave> [http://localhost:4400]
import { io } from 'socket.io-client';
import { flotaAlAzar } from '../juegos/batallaNaval.js';

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
  const p = sala.partida;
  switch (sala.juego) {
    case 'batalla-naval':
      if (p.estado === 'colocando' && !p.listo.yo) return accion('colocar', { barcos: flotaAlAzar(p.flota, p.filas, p.columnas, { pegados: p.pegados }) });
      if (p.estado === 'jugando' && p.turno === yo) {
        const hechos = new Set(p.misDisparos.map((d) => `${d.fila},${d.col}`));
        let f, c;
        do { f = azar(p.filas); c = azar(p.columnas); } while (hechos.has(`${f},${c}`));
        return accion('disparar', { fila: f, col: c });
      }
      return;
    case 'ahorcado': {
      const r = p.ronda;
      if (r.fase === 'eligiendo' && !r.adivinoYo) return accion('palabra', { palabra: ['DULCE DE LECHE', 'MARIPOSA', 'GUITARRA', 'ELEFANTE'][azar(4)], pista: 'la eligió el bot' });
      if (r.fase === 'adivinando' && r.adivinoYo) {
        const libres = [...'AEIOSRNLTCDMUP'].filter((l) => !r.letras.includes(l));
        return accion('letra', { letra: libres[0] || 'Z' });
      }
      return;
    }
    case 'tuti-fruti': {
      const ronda = p.rondas[p.rondas.length - 1];
      if (p.fase === 'escribiendo' || (p.fase === 'basta' && p.bastaPor !== yo)) {
        await new Promise((ok) => setTimeout(ok, (p.arrancaEnMs || 0) + 2500));
        return accion('basta', { valores: p.config.columnas.map((c) => `${ronda.letra}${c.toLowerCase().slice(1, 5)}`) });
      }
      if (p.fase === 'puntuando' && !p.confirmados.includes(yo) && p.confirmados.includes(sala.rival)) return accion('confirmar');
      return;
    }
    case 'generala': {
      if (p.turno !== yo) return;
      if (p.tiros === 0) return accion('tirar');
      const libres = p.categorias.filter((c) => p.planillas.yo[c.id] === undefined);
      const mejor = libres.sort((a, b) => (p.posibles[b.id] || 0) - (p.posibles[a.id] || 0))[0];
      return accion('anotar', { categoria: mejor.id });
    }
    case 'escoba':
      if (p.fase === 'resumen') return p.listosSiguiente.includes(yo) ? undefined : accion('siguiente');
      if (p.turno !== yo) return;
      for (const carta of p.miMano) {
        for (let m = 1; m < 1 << p.mesa.length; m++) {
          const sel = p.mesa.filter((_, i) => m & (1 << i));
          if (carta.valor + sel.reduce((t, x) => t + x.valor, 0) === 15) return accion('jugar', { carta: carta.id, levantar: sel.map((x) => x.id) });
        }
      }
      return accion('jugar', { carta: p.miMano[0].id });
  }
}

console.log(`bot ${usuario} conectado`);
