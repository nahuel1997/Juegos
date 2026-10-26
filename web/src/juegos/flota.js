// Copia liviana de las reglas del server (api/src/juegos/batallaNaval.js) para validar en vivo
// mientras se ubican los barcos. El server vuelve a validar todo.
export const TAM = 10;
export const LETRAS = 'ABCDEFGHIJ';

export const FLOTA = [
  { id: 'portaaviones', nombre: 'Portaaviones', largo: 5 },
  { id: 'acorazado', nombre: 'Acorazado', largo: 4 },
  { id: 'crucero', nombre: 'Crucero', largo: 3 },
  { id: 'submarino', nombre: 'Submarino', largo: 3 },
  { id: 'destructor', nombre: 'Destructor', largo: 2 },
];

export const largoDe = (id) => FLOTA.find((t) => t.id === id).largo;

export function celdasDe({ fila, col, horizontal }, largo) {
  return Array.from({ length: largo }, (_, i) => (horizontal ? [fila, col + i] : [fila + i, col]));
}

// ¿Se puede poner este barco junto a los otros? (dentro del tablero y sin tocarse, ni en diagonal)
export function cabe(barco, otros) {
  const celdas = celdasDe(barco, largoDe(barco.id));
  if (celdas.some(([f, c]) => f < 0 || c < 0 || f >= TAM || c >= TAM)) return false;
  const ocupadas = new Set(
    otros.filter((b) => b.id !== barco.id).flatMap((b) => celdasDe(b, largoDe(b.id)).map(([f, c]) => `${f},${c}`)),
  );
  return !celdas.some(([f, c]) => [-1, 0, 1].some((df) => [-1, 0, 1].some((dc) => ocupadas.has(`${f + df},${c + dc}`))));
}

export function flotaAlAzar() {
  for (;;) {
    const barcos = [];
    for (const t of FLOTA) {
      for (let i = 0; i < 200; i++) {
        const horizontal = Math.random() < 0.5;
        const b = {
          id: t.id,
          horizontal,
          fila: Math.floor(Math.random() * (horizontal ? TAM : TAM - t.largo + 1)),
          col: Math.floor(Math.random() * (horizontal ? TAM - t.largo + 1 : TAM)),
        };
        if (cabe(b, barcos)) { barcos.push(b); break; }
      }
    }
    if (barcos.length === FLOTA.length) return barcos;
  }
}
