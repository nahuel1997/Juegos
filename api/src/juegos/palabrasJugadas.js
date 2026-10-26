// Palabras del Stop que ya se jugaron (en DATA_DIR/stop-jugadas.json), para no repetirlas entre
// partidas hasta haber usado todas las de ese largo. Cuando se terminan, la lista de ese largo
// vuelve a empezar (y se cuenta una "vuelta" más).
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.env.DATA_DIR || join(process.cwd(), 'datos');
const ARCHIVO = join(DIR, 'stop-jugadas.json');

let datos = {}; // largo -> { jugadas: [palabra], vueltas: n }
try {
  datos = JSON.parse(readFileSync(ARCHIVO, 'utf8'));
} catch {
  datos = {};
}

function guardar() {
  try {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(`${ARCHIVO}.tmp`, JSON.stringify(datos));
    renameSync(`${ARCHIVO}.tmp`, ARCHIVO);
  } catch (e) {
    console.error('No se pudieron guardar las palabras jugadas:', e.message);
  }
}

const de = (largo) => (datos[largo] ||= { jugadas: [], vueltas: 0 });

export const jugadas = (largo) => de(largo).jugadas;

export function registrar(largo, palabra) {
  const d = de(largo);
  if (!d.jugadas.includes(palabra)) d.jugadas.push(palabra);
  guardar();
}

// Se usaron todas: la lista de ese largo arranca de nuevo.
export function reiniciar(largo) {
  const d = de(largo);
  d.jugadas = [];
  d.vueltas++;
  guardar();
}

export function resumen(listas) {
  return Object.fromEntries(
    Object.entries(listas).map(([largo, lista]) => [largo, { total: lista.length, jugadas: [...de(largo).jugadas], vueltas: de(largo).vueltas }]),
  );
}
