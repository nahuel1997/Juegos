// Piezas de ajedrez dibujadas (SVG propio, viewBox 45x45). color: 'b' blancas, 'n' negras.
const FORMAS = {
  P: <path d="M22.5 9a4.5 4.5 0 0 0-3.6 7.2A6.5 6.5 0 0 0 16 21.6c0 2.2 1 4 2.6 5.2C15.4 28 11 31.6 11 37.5h23c0-5.9-4.4-9.5-7.6-10.7a6.5 6.5 0 0 0 2.6-5.2 6.5 6.5 0 0 0-2.9-5.4A4.5 4.5 0 0 0 22.5 9z" />,
  R: <path d="M11 37.5h23v-3H11zM13.5 34.5l1.5-3h15l1.5 3zM15 31.5V17h15v14.5zM13 17l-1-6h4v2.5h4V11h5v2.5h4V11h4l-1 6z" />,
  N: <path d="M22 10c10.5 1 16.5 8 16 27.5H15c0-9 10-6.5 8-21M24 18c.4 2.9-5.5 7.4-8 9-3 2-2.8 4.3-5 4-1-.9 1.4-3 0-3-1 0 .2 1.2-1 2-1 0-4 1-4-4 0-2 6-12 6-12s1.9-1.9 2-3.5c-.7-1-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.8-2 2.5-3c1 0 1 3 1 3" />,
  B: <path d="M9 36c3.4-1 10.1.4 13.5-2 3.4 2.4 10.1 1 13.5 2 0 0 1.6.5 3 2-.7 1-1.6 1-3 .5-3.4-1-10.1.5-13.5-1-3.4 1.5-10.1 0-13.5 1-1.4.5-2.3.5-3-.5 1.4-1.9 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />,
  Q: <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5zM9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />,
  K: <path d="M22.5 11.6V6M20 8h5M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10z" />,
};

const ADORNOS = {
  P: null,
  R: <path d="M14 29.5h17M14 19h17" fill="none" />,
  N: <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zM15 15.5a.5 1.5 0 1 1-1 0 .5 1.5 0 1 1 1 0z" />,
  B: <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" fill="none" />,
  Q: <circle cx="6" cy="12" r="2.2" />,
  K: <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0" fill="none" />,
};

export function Pieza({ pieza, className = '' }) {
  if (!pieza) return null;
  const [color, tipo] = pieza;
  const blanca = color === 'b';
  return (
    <svg viewBox="0 0 45 45" className={`aj-pieza ${blanca ? 'blanca' : 'negra'} ${className}`} aria-hidden="true">
      <g fill={blanca ? '#fff' : '#2b2233'} stroke={blanca ? '#2b2233' : '#f3e9ff'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        {FORMAS[tipo]}
        {tipo === 'Q' && <>
          <circle cx="6" cy="12" r="2.2" /><circle cx="14" cy="9" r="2.2" /><circle cx="22.5" cy="8" r="2.2" /><circle cx="31" cy="9" r="2.2" /><circle cx="39" cy="12" r="2.2" />
        </>}
        {tipo !== 'Q' && ADORNOS[tipo]}
      </g>
    </svg>
  );
}

export const NOMBRE_PIEZA = { P: 'Peón', N: 'Caballo', B: 'Alfil', R: 'Torre', Q: 'Dama', K: 'Rey' };
