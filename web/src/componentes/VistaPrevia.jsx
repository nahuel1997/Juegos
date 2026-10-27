import { useEffect } from 'react';
import { Icono } from '../iconos.jsx';
import { JUEGOS } from '../juegos/index.js';
import { REGLAS } from '../juegos/reglas.js';
import Simulacion from './Simulacion.jsx';

// Ventana con la vista previa de un juego: de qué se trata, cómo se juega, cómo se gana y qué se configura.
// `acciones` son los botones de abajo (desafiar, aceptar…).
export default function VistaPrevia({ id, nombre, cerrar, acciones }) {
  const info = JUEGOS[id];
  const r = REGLAS[id];
  useEffect(() => {
    const tecla = (e) => { if (e.key === 'Escape') cerrar(); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [cerrar]);
  if (!r) return null;
  return (
    <div className="vp-fondo" onClick={cerrar} role="presentation">
      <div className="vp tarjeta" role="dialog" aria-modal="true" aria-label={`Reglas de ${nombre}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="vp-cerrar" onClick={cerrar} aria-label="Cerrar">×</button>
        <div className="vp-cab">
          <span className="vp-icono"><Icono id={info?.icono} tam={84} /></span>
          <div>
            <h2>{nombre}</h2>
            <p className="sub">{info?.texto}</p>
            <div className="vp-chips">
              {r.estilo.map((e) => <span key={e} className="vp-chip">{e}</span>)}
              <span className="vp-chip modo">{r.modo}</span>
              <span className="vp-chip tiempo">{r.duracion}</span>
            </div>
          </div>
        </div>

        <Simulacion id={id} />

        <div className="vp-bloque objetivo">
          <h3>El objetivo</h3>
          <p>{r.objetivo}</p>
        </div>
        <div className="vp-bloque">
          <h3>Cómo se juega</h3>
          <ol className="vp-pasos">{r.pasos.map((p, i) => <li key={i}>{p}</li>)}</ol>
        </div>
        <div className="vp-bloque gana">
          <h3><Icono id="trofeo" tam={20} /> Cómo se gana</h3>
          <p>{r.gana}</p>
        </div>
        {r.opciones?.length > 0 && (
          <div className="vp-bloque">
            <h3>Lo que pueden elegir antes de empezar</h3>
            <ul className="vp-opciones">{r.opciones.map((o) => <li key={o}>{o}</li>)}</ul>
          </div>
        )}
        <div className="acciones vp-acciones">
          {acciones}
          <button type="button" className="btn fantasma" onClick={cerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
