import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SKINS } from '../../api/src/skins.js';
import { pedir } from './api.js';
import { Icono } from './iconos.jsx';

export { SKINS };
const Contexto = createContext({ skins: {}, elegir: () => {} });

function leerLocal() {
  try { return JSON.parse(localStorage.getItem('skins') || '{}'); } catch { return {}; }
}
function guardarLocal(skins) {
  try { localStorage.setItem('skins', JSON.stringify(skins)); } catch { /* sin storage */ }
}

// Las skins de cada uno: las de su perfil (si tiene usuario) o las del navegador (invitados).
export function ProveedorSkins({ usuario, children }) {
  const conPerfil = usuario && !usuario.invitado;
  const [skins, setSkins] = useState(() => (conPerfil ? usuario.skins || {} : leerLocal()));
  const pendiente = useRef(null);
  useEffect(() => {
    setSkins(conPerfil ? usuario.skins || {} : leerLocal());
  }, [usuario?.usuario]); // eslint-disable-line react-hooks/exhaustive-deps

  const elegir = useCallback((juego, skin) => {
    setSkins((antes) => {
      const nuevas = { ...antes };
      if (skin) nuevas[juego] = skin;
      else delete nuevas[juego]; // vuelve a la de todos los juegos
      if (juego === '*') for (const k of Object.keys(nuevas)) if (k !== '*') delete nuevas[k]; // "para todos" pisa las de cada juego
      guardarLocal(nuevas);
      if (conPerfil) {
        clearTimeout(pendiente.current);
        pendiente.current = setTimeout(() => pedir('/perfil/skins', { metodo: 'PUT', datos: { skins: nuevas } }).catch(() => {}), 500);
      }
      return nuevas;
    });
  }, [conPerfil]);

  const valor = useMemo(() => ({ skins, elegir }), [skins, elegir]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSkin(juego) {
  const { skins, elegir } = useContext(Contexto);
  return [skins[juego] || skins['*'] || 'clasico', (skin) => elegir(juego, skin), elegir, skins];
}

// Envuelve la partida: con una skin que no sea la clásica, cambia mesa, tableros y colores.
export function MarcoSkin({ juego, children }) {
  const [skin] = useSkin(juego);
  return (
    <div className={`skin-marco sk-${juego}`} data-skin={skin === 'clasico' ? undefined : skin}>
      {children}
    </div>
  );
}

export function Muestra({ skin, tam = 30 }) {
  const s = SKINS.find((x) => x.id === skin) || SKINS[0];
  return (
    <span className="skin-muestra" style={{ width: tam, height: tam }} aria-hidden="true">
      {s.muestra.map((c, i) => <i key={i} style={{ background: c }} />)}
    </span>
  );
}

// Botón "Skin" con la paleta para elegir (para este juego o para todos).
export function SelectorSkin({ juego }) {
  const [skin, setSkin, elegir, skins] = useSkin(juego);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (!caja.current?.contains(e.target)) setAbierto(false); };
    const esc = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', esc); };
  }, [abierto]);
  const propia = !!skins[juego];
  return (
    <div className="skin-selector" ref={caja}>
      <button type="button" className="btn chico fantasma" aria-expanded={abierto} onClick={() => setAbierto(!abierto)} title="Cambiar la skin de este juego">
        <Icono id="pincel" tam={18} /> Skin
      </button>
      {abierto && (
        <div className="skin-menu tarjeta" role="dialog" aria-label="Elegir skin">
          <p className="sub">Solo cambia cómo lo ves vos.</p>
          <div className="skin-lista">
            {SKINS.map((s) => (
              <button key={s.id} type="button" className={`skin-op ${skin === s.id ? 'activa' : ''}`} onClick={() => setSkin(s.id)} aria-pressed={skin === s.id}>
                <Muestra skin={s.id} />
                <span>{s.nombre}</span>
              </button>
            ))}
          </div>
          <div className="acciones">
            <button type="button" className="btn chico fantasma" onClick={() => { elegir('*', skin); setAbierto(false); }}>Usar esta en todos los juegos</button>
            {propia && <button type="button" className="btn chico fantasma" onClick={() => setSkin(null)}>Igual que los demás</button>}
          </div>
        </div>
      )}
    </div>
  );
}
