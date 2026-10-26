// Utilidades compartidas por los juegos.

export class ErrorJuego extends Error {}

export function entero(valor, min, max, nombre) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) throw new ErrorJuego(`${nombre} tiene que ser un número entre ${min} y ${max}`);
  return n;
}

export const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

// Mayúsculas sin acentos, pero respetando la Ñ.
export function normalizar(txt) {
  return String(txt ?? '')
    .toUpperCase()
    .replace(/Ñ/g, '\u0001')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0001/g, 'Ñ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Ganador por puntos (null = empate).
export function ganadorPorPuntos(jugadores, puntos) {
  const [a, b] = jugadores;
  if (puntos[a] === puntos[b]) return null;
  return puntos[a] > puntos[b] ? a : b;
}
