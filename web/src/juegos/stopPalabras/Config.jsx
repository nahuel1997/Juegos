import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigStop({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Palabra</h3>
        <Stepper etiqueta="Letras" valor={config.largo} min={4} max={7} onChange={(largo) => set({ largo })} />
        <Stepper etiqueta="Intentos" valor={config.intentos} min={4} max={8} onChange={(intentos) => set({ intentos })} />
        <Stepper etiqueta="Rondas" valor={config.rondas} min={1} max={7} onChange={(rondas) => set({ rondas })} />
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
