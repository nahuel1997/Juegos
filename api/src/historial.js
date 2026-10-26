import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

// Historial de partidas en un JSON (en Docker vive en un volumen). Alcanza para dos jugadores.
const DIR = process.env.DATA_DIR || join(process.cwd(), 'datos');
const ARCHIVO = join(DIR, 'historial.json');
const MAX = 500;

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

export function registrarPartida({ juego, jugadores, ganador, motivoFin, disparos }) {
  partidas.unshift({ juego, jugadores, ganador, motivoFin, disparos, fecha: new Date().toISOString() });
  partidas = partidas.slice(0, MAX);
  try {
    guardar();
  } catch (e) {
    console.error('No se pudo guardar el historial:', e.message);
  }
}

export function resumen(usuario) {
  const mias = partidas.filter((p) => p.jugadores.includes(usuario));
  return {
    jugadas: mias.length,
    ganadas: mias.filter((p) => p.ganador === usuario).length,
    ultimas: mias.slice(0, 10),
  };
}
