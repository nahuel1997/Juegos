import { useEffect, useState } from 'react';
import { Stepper } from '../../componentes/comunes.jsx';
import { pedir } from '../../api.js';

// Cuántas palabras hay de cada largo y cuáles ya jugaron (no se repiten hasta usarlas todas).
function PalabrasJugadas({ largo }) {
  const [datos, setDatos] = useState(null);
  useEffect(() => {
    pedir('/stop/palabras').then(setDatos).catch(() => setDatos(null));
  }, [largo]);
  if (!datos) return null;
  const d = datos[largo];
  const total = Object.values(datos).reduce((s, x) => s + x.total, 0);
  return (
    <div className="stop-jugadas">
      <p>
        Hay <b>{total}</b> palabras en total. De {largo} letras ya jugaron <b>{d.jugadas.length}</b> de <b>{d.total}</b>
        {d.vueltas > 0 ? ` (van ${d.vueltas} vuelta${d.vueltas > 1 ? 's' : ''} completa${d.vueltas > 1 ? 's' : ''})` : ''}.
        No se repiten hasta usarlas todas.
      </p>
      <div className="barra-progreso"><i style={{ width: `${(100 * d.jugadas.length) / d.total}%` }} /></div>
      {d.jugadas.length > 0 && (
        <details>
          <summary>Ver las que ya jugaron</summary>
          <div className="stop-lista">
            {[...d.jugadas].sort().map((p) => <span key={p} className="chip">{p}</span>)}
          </div>
        </details>
      )}
      <small className="sub">
        {Object.entries(datos).map(([n, x]) => `${n} letras: ${x.jugadas.length}/${x.total}`).join(' · ')}
      </small>
    </div>
  );
}

export default function ConfigStop({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Palabra</h3>
        <Stepper etiqueta="Letras" valor={config.largo} min={4} max={7} onChange={(largo) => set({ largo })} />
        <Stepper etiqueta="Intentos" valor={config.intentos} min={4} max={8} onChange={(intentos) => set({ intentos })} />
        <Stepper etiqueta="Rondas" valor={config.rondas} min={1} max={7} onChange={(rondas) => set({ rondas })} />
        <PalabrasJugadas largo={config.largo} />
      </section>
      <section>
        <h3>Cómo se juega</h3>
        <ul className="lista-simple">
          <li><span className="tile-mini v">A</span> letra en su lugar</li>
          <li><span className="tile-mini a">A</span> está, pero en otro lugar</li>
          <li><span className="tile-mini g">A</span> no está</li>
        </ul>
        <p className="ayuda">Los dos adivinan la misma palabra a la vez. Gana la ronda quien la saca en menos intentos (si empatan, el más rápido). Del otro solo ves los colores.</p>
      </section>
    </div>
  );
}
