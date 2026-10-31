import { Stepper } from '../../componentes/comunes.jsx';

export default function ConfigSimon({ config, cambiar }) {
  const set = (cambios) => cambiar({ ...config, ...cambios });
  return (
    <div className="config-grid">
      <section>
        <h3>Colores y velocidad</h3>
        <div className="opciones-fila">
          {[4, 6].map((n) => (
            <button key={n} type="button" className={`btn chico ${config.colores === n ? '' : 'fantasma'}`} onClick={() => set({ colores: n })}>{n} colores</button>
          ))}
        </div>
        <div className="opciones-fila">
          {[['normal', 'Normal'], ['rapida', 'Rápida']].map(([id, t]) => (
            <button key={id} type="button" className={`btn chico ${config.velocidad === id ? '' : 'fantasma'}`} onClick={() => set({ velocidad: id })}>{t}</button>
          ))}
        </div>
      </section>
      <section>
        <h3>Partida</h3>
        <Stepper etiqueta="Al mejor de" valor={config.partidas} min={1} max={9} paso={2} onChange={(partidas) => set({ partidas })} />
        <p className="ayuda">Arranca con 3 colores y suma uno por vuelta. Juegan los dos a la vez.</p>
      </section>
    </div>
  );
}
