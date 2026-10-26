import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

// Historial de partidas en un JSON (en Docker vive en un volumen). Alcanza para pocos jugadores.
const DIR = process.env.DATA_DIR || join(process.cwd(), 'datos');
const ARCHIVO = join(DIR, 'historial.json');
const MAX = 1000;

let partidas = [];
try {
  partidas = JSON.parse(readFileSync(ARCHIVO, 'utf8'));
} catch {
  partidas = [];
}

function guardar() {
  mkdirSync(DIR, { recursive: true });
  const tmp = `${ARCHIVO}.tmp`;
  writeFileSync(tmp, JSON.stringify(partidas));
  renameSync(tmp, ARCHIVO);
}

// ganador null = empate.
export function registrarPartida({ juego, jugadores, ganador, motivoFin, detalle }) {
  partidas.unshift({ juego, jugadores, ganador, motivoFin, detalle, fecha: new Date().toISOString() });
  partidas = partidas.slice(0, MAX);
  try {
    guardar();
  } catch (e) {
    console.error('No se pudo guardar el historial:', e.message);
  }
}

export function resumen(usuario) {
  const mias = partidas.filter((p) => p.jugadores.includes(usuario));
  const porJuego = {};
  for (const p of mias) {
    const j = (porJuego[p.juego || 'batalla-naval'] ||= { jugadas: 0, ganadas: 0, empatadas: 0 });
    j.jugadas++;
    if (p.ganador === usuario) j.ganadas++;
    if (p.ganador === null) j.empatadas++;
  }
  return {
    jugadas: mias.length,
    ganadas: mias.filter((p) => p.ganador === usuario).length,
    empatadas: mias.filter((p) => p.ganador === null).length,
    porJuego,
    ultimas: mias.slice(0, 10).map((p) => ({ ...p, juego: p.juego || 'batalla-naval' })),
  };
}
