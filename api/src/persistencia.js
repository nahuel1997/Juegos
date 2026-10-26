// Guarda las salas (con sus partidas en curso) en DATA_DIR/salas.json para que sobrevivan a un
// reinicio del servidor o a un deploy. Se escribe agrupado (como mucho cada 300 ms) y de forma
// atómica; al apagar se fuerza la última escritura.
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.env.DATA_DIR || join(process.cwd(), 'datos');
const ARCHIVO = join(DIR, 'salas.json');

// Lo que no se guarda: funciones y cosas que se rearman al restaurar.
const NO_GUARDAR = new Set(['timer', 'notificar', 'rand']);

function reemplazo(clave, valor) {
  if (NO_GUARDAR.has(clave) || typeof valor === 'function') return undefined;
  if (valor instanceof Map) return { __tipo: 'Map', v: [...valor] };
  if (valor instanceof Set) return { __tipo: 'Set', v: [...valor] };
  return valor;
}

function revivir(_clave, valor) {
  if (valor && valor.__tipo === 'Map') return new Map(valor.v);
  if (valor && valor.__tipo === 'Set') return new Set(valor.v);
  return valor;
}

export const serializar = (datos) => JSON.stringify(datos, reemplazo);
export const deserializar = (texto) => JSON.parse(texto, revivir);

export function cargarSalas() {
  try {
    return deserializar(readFileSync(ARCHIVO, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') console.error('No se pudieron leer las salas guardadas:', e.message);
    return null;
  }
}

export function crearGuardador(obtenerEstado) {
  let pendiente = null;
  const escribir = () => {
    clearTimeout(pendiente);
    pendiente = null;
    try {
      mkdirSync(DIR, { recursive: true });
      writeFileSync(`${ARCHIVO}.tmp`, serializar(obtenerEstado()));
      renameSync(`${ARCHIVO}.tmp`, ARCHIVO);
    } catch (e) {
      console.error('No se pudieron guardar las salas:', e.message);
    }
  };
  return {
    luego() {
      if (pendiente) return;
      pendiente = setTimeout(escribir, 300);
      pendiente.unref?.();
    },
    ya: escribir,
  };
}
