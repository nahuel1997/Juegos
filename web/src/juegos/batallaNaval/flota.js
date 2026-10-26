// Copia liviana de las reglas del server (api/src/juegos/batallaNaval.js) para validar en vivo
// mientras se ubican los barcos. El server vuelve a validar todo.
export const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const TIPOS = [
  { tipo: 'portaaviones', nombre: 'Portaaviones', largo: 5 },
  { tipo: 'acorazado', nombre: 'Acorazado', largo: 4 },
  { tipo: 'crucero', nombre: 'Crucero', largo: 3 },
  { tipo: 'submarino', nombre: 'Submarino', largo: 3 },
  { tipo: 'destructor', nombre: 'Destructor', largo: 2 },
];

export function celdasDe({ fila, col, horizontal }, largo) {
  return Array.from({ length: largo }, (_, i) => (horizontal ? [fila, col + i] : [fila + i, col]));
}

// ¿Se puede poner este barco junto a los otros? Dentro del tablero, nunca encimado y, si no se
// permiten barcos pegados, tampoco tocando a otro (ni en diagonal).
export function cabe(barco, otros, flota, filas, columnas, pegados = false) {
  const largo = (id) => flota.find((b) => b.id === id).largo;
  const celdas = celdasDe(barco, largo(barco.id));
  if (celdas.some(([f, c]) => f < 0 || c < 0 || f >= filas || c >= columnas)) return false;
  const ocupadas = new Set(
    otros.filter((b) => b.id !== barco.id).flatMap((b) => celdasDe(b, largo(b.id)).map(([f, c]) => `${f},${c}`)),
  );
  const radio = pegados ? [0] : [-1, 0, 1];
  return !celdas.some(([f, c]) => radio.some((df) => radio.some((dc) => ocupadas.has(`${f + df},${c + dc}`))));
}

export function flotaAlAzar(flota, filas, columnas, pegados = false) {
  for (let vuelta = 0; vuelta < 2000; vuelta++) {
    const barcos = [];
    for (const t of flota) {
      for (let i = 0; i < 100; i++) {
        const horizontal = t.largo > columnas ? false : t.largo > filas ? true : Math.random() < 0.5;
        const b = {
          id: t.id,
          horizontal,
          fila: Math.floor(Math.random() * (horizontal ? filas : filas - t.largo + 1)),
          col: Math.floor(Math.random() * (horizontal ? columnas - t.largo + 1 : columnas)),
        };
        if (cabe(b, barcos, flota, filas, columnas, pegados)) { barcos.push(b); break; }
      }
    }
    if (barcos.length === flota.length) return barcos;
  }
  return null;
}
