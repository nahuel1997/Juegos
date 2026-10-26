import { useEffect, useRef, useState } from 'react';
import { EMOTES, Icono } from '../iconos.jsx';

const NOMBRES = {
  fuckyou: 'Fuck you', risa: 'Me muero de risa', llanto: 'Llorando', enojo: 'Enojado', beso: 'Beso', corazon: 'Te quiero',
  fuego: 'Fuego', aplauso: 'Aplausos', facha: 'Facha', pulgar: 'Bien ahí', sorpresa: '¡¿Qué?!', caca: 'Caca', ojitos: 'Ternura',
};

// Botón con el selector de emoticones para mandarle al rival.
export function SelectorEmotes({ emitir }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => { if (!caja.current?.contains(e.target)) setAbierto(false); };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);
  return (
    <div className="emotes" ref={caja}>
      <button type="button" className="btn chico fantasma emotes-boton" onClick={() => setAbierto((a) => !a)} aria-label="Mandar un emoticón" aria-expanded={abierto}>
        <Icono id="risa" tam={22} />
      </button>
      {abierto && (
        <div className="emotes-panel" role="menu">
          {EMOTES.map((id) => (
            <button
              key={id}
              type="button"
              className="emote-op"
              title={NOMBRES[id]}
              aria-label={NOMBRES[id]}
              onClick={() => { emitir('emote', { id }); setAbierto(false); }}
            >
              <Icono id={id} tam={36} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Emoticón gigante y animado. Al que lo recibe le ocupa media pantalla; al que lo manda, chiquito.
export function EmoteGrande({ emote, yo, gente }) {
  const [visible, setVisible] = useState(null);
  useEffect(() => {
    if (!emote) return;
    setVisible(emote);
    const t = setTimeout(() => setVisible(null), 2800);
    return () => clearTimeout(t);
  }, [emote]);
  if (!visible) return null;
  const mio = visible.de === yo;
  const quien = gente[visible.de]?.nombre || visible.de;
  return (
    <div className={`emote-grande ${mio ? 'mio' : 'suyo'} emote-${visible.id}`} key={visible.n} aria-live="polite">
      <div className="emote-dibujo"><Icono id={visible.id} tam={512} titulo={NOMBRES[visible.id]} /></div>
      <div className="emote-quien">{mio ? 'Enviado' : `${quien} te mandó esto`}</div>
    </div>
  );
}
