import { Interruptor } from '../../componentes/comunes.jsx';

export default function ConfigTruco({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Partido</h3>
        <div className="opciones-fila">
          {[15, 30].map((m) => (
            <button key={m} type="button" className={`btn chico ${config.meta === m ? '' : 'fantasma'}`} onClick={() => set({ meta: m })}>A {m}</button>
          ))}
        </div>
        <p className="ayuda">A 30 se juega en malas y buenas (15 y 15).</p>
      </section>
      <section>
        <h3>Reglas</h3>
        <Interruptor valor={config.flor} onChange={(flor) => set({ flor })}>Con flor (3 del mismo palo: 3 puntos, y no hay envido)</Interruptor>
      </section>
    </div>
  );
}
