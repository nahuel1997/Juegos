import { useEffect, useState } from 'react';

// En pantallas táctiles (celular, tablet) los juegos de letras usan el teclado del teléfono en vez
// del teclado dibujado en la página.
const CONSULTA = '(pointer: coarse)';
const esTactil = () => typeof window !== 'undefined' && !!window.matchMedia?.(CONSULTA).matches;

export function useTecladoNativo() {
  const [si, setSi] = useState(esTactil);
  useEffect(() => {
    const m = window.matchMedia?.(CONSULTA);
    if (!m) return undefined;
    const cambio = () => setSi(m.matches);
    m.addEventListener?.('change', cambio);
    return () => m.removeEventListener?.('change', cambio);
  }, []);
  return si;
}

// Lo que escribió el teclado del celular → solo letras A-Z y Ñ, en mayúscula y sin acentos.
export function soloLetras(texto) {
  return String(texto)
    .toUpperCase()
    .replace(/Ñ/g, '\u0000')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0000/g, 'Ñ')
    .replace(/[^A-ZÑ]/g, '');
}

// Atributos para que el teclado del celular no corrija ni complete palabras.
export const SIN_AUTOCORRECTOR = {
  type: 'text',
  inputMode: 'text',
  autoCapitalize: 'characters',
  autoComplete: 'off',
  autoCorrect: 'off',
  spellCheck: false,
};
