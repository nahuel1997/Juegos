// Skins: estéticas que cada jugador elige por juego (o una para todos). Solo cambian lo que ve
// cada uno, nunca el juego. Los colores los usa web/src/skins.css (variables --sk-*); acá están
// las muestras para el selector y la lista para validar lo que se guarda en el perfil.
export const SKINS = [
  { id: 'clasico', nombre: 'Clásico', muestra: ['#13325e', '#ffb703', '#eef3fb'] },
  { id: 'madera', nombre: 'Madera', muestra: ['#8b5a2b', '#e7c69a', '#ffcc66'] },
  { id: 'noche', nombre: 'Noche', muestra: ['#0f1630', '#3b4a7a', '#ffd166'] },
  { id: 'neon', nombre: 'Neón', muestra: ['#07070d', '#00e5ff', '#ff2fd6'] },
  { id: 'pastel', nombre: 'Pastel', muestra: ['#fdeef4', '#c9f2e6', '#ff8fb1'] },
  { id: 'oceano', nombre: 'Océano', muestra: ['#062a3e', '#1b7a9c', '#8fd3e8'] },
  { id: 'selva', nombre: 'Selva', muestra: ['#12301b', '#4f8f3a', '#ffb703'] },
  { id: 'retro', nombre: 'Retro', muestra: ['#2b1d0e', '#c1652f', '#f4e1b5'] },
  { id: 'granate', nombre: 'Granate', muestra: ['#3d0b16', '#a3243b', '#fbeef0'] },
  { id: 'espacio', nombre: 'Espacio', muestra: ['#0a0620', '#3b2a6a', '#7cf9ff'] },
];
export const IDS_SKINS = SKINS.map((s) => s.id);

// Lo que manda el navegador: { juego | '*': skin }. Se descarta lo que no sea válido.
export function limpiarSkins(datos, juegosValidos) {
  const out = {};
  if (!datos || typeof datos !== 'object') return out;
  for (const [k, v] of Object.entries(datos).slice(0, 100)) {
    if ((k === '*' || juegosValidos.includes(k)) && IDS_SKINS.includes(v)) out[k] = v;
  }
  return out;
}
